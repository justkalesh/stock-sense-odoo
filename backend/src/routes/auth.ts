import { randomBytes, randomInt } from 'node:crypto';
import { Router } from 'express';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { fail } from '../errors.js';
import { checkPassword, endSession, hashPassword, sha256, startSession } from '../auth.js';
import { sendOtpEmail } from '../mail.js';
import { payload } from '../snapshot.js';
import * as v from '../validation.js';

export const authRouter = Router();

const OTP_TTL = 10 * 60_000, RESEND_AFTER = 30_000, MAX_ATTEMPTS = 5;

const findByIdentifier = (who: string) => who.includes('@')
  ? prisma.user.findUnique({ where: { email: who.toLowerCase() } })
  : prisma.user.findFirst({ where: { loginId: { equals: who, mode: 'insensitive' } } });

authRouter.post('/signup', async (req, res) => {
  const d = v.signup.parse(req.body);
  const fields: Record<string, string> = {};
  if (await prisma.user.findFirst({ where: { loginId: { equals: d.loginId, mode: 'insensitive' } } })) fields.id = 'This Login ID is taken.';
  if (await prisma.user.findUnique({ where: { email: d.email } })) fields.email = 'This email is already registered.';
  if (Object.keys(fields).length) fail('Some details are already in use.', 409, 'DUPLICATE', fields);
  const user = await prisma.user.create({
    data: { loginId: d.loginId, email: d.email, name: d.loginId, role: d.role, passwordHash: await hashPassword(d.password) },
  });
  await startSession(res, user.id);
  res.status(201).json(await payload(user));
});

authRouter.post('/login', async (req, res) => {
  const d = v.login.parse(req.body);
  const user = await prisma.user.findFirst({ where: { loginId: { equals: d.loginId, mode: 'insensitive' } } });
  // One message for both cases so the response never reveals which field was wrong
  if (!user || !(await checkPassword(d.password, user.passwordHash))) fail('Invalid Login ID or Password.', 401, 'INVALID_CREDENTIALS');
  await startSession(res, user.id);
  res.json(await payload(user));
});

authRouter.post('/logout', async (req, res) => {
  await endSession(req, res);
  res.json({ ok: true });
});

// Always answers the same way, so it can't be used to discover which accounts exist
authRouter.post('/password/forgot', async (req, res) => {
  const { identifier } = v.identifier.parse(req.body);
  const user = await findByIdentifier(identifier);
  let devOtp: string | undefined;
  if (user && !(user.otpSentAt && Date.now() - user.otpSentAt.getTime() < RESEND_AFTER)) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash: sha256(`${user.id}:${code}`), otpExpires: new Date(Date.now() + OTP_TTL), otpAttempts: 0, otpSentAt: new Date() },
    });
    try {
      await sendOtpEmail(user.email, code);
    } catch (e) {
      console.error('OTP email failed', e);
      fail("We couldn't send the email right now. Please try again in a minute.", 502, 'MAIL_FAILED');
    }
    if (env.exposeDevOtp) devOtp = code;
  }
  res.json({ ok: true, ...(devOtp ? { devOtp } : {}) });
});

authRouter.post('/password/verify', async (req, res) => {
  const d = v.verify.parse(req.body);
  const user = await findByIdentifier(d.identifier);
  if (!user?.otpHash || !user.otpExpires || user.otpExpires < new Date()) fail('This code has expired. Request a new one.', 400, 'OTP_EXPIRED');
  if (user.otpHash !== sha256(`${user.id}:${d.code}`)) {
    const { otpAttempts } = await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - otpAttempts;
    if (left <= 0) {
      await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpires: null, otpAttempts: 0 } });
      fail('Too many attempts. Request a new code.', 400, 'OTP_LOCKED');
    }
    fail(`Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.`, 400, 'OTP_INVALID');
  }
  const resetToken = randomBytes(32).toString('base64url');
  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: null, otpExpires: null, otpAttempts: 0, resetTokenHash: sha256(resetToken), resetTokenExpires: new Date(Date.now() + 15 * 60_000) },
  });
  res.json({ resetToken });
});

authRouter.post('/password/reset', async (req, res) => {
  const d = v.reset.parse(req.body);
  const user = await prisma.user.findFirst({ where: { resetTokenHash: sha256(d.resetToken), resetTokenExpires: { gt: new Date() } } });
  if (!user) fail('This reset session has expired. Please start again.', 400, 'RESET_EXPIRED');
  const passwordHash = await hashPassword(d.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetTokenHash: null, resetTokenExpires: null } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  res.json({ ok: true });
});
