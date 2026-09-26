import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Request, RequestHandler, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from './db.js';
import { env } from './env.js';
import { fail } from './errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

const COOKIE = 'sid';
const SESSION_DAYS = 7;

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export const publicUser = (u: User) => ({
  id: u.id, loginId: u.loginId, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.getTime(),
});

function readToken(req: Request) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

// Only the SHA-256 of the token is stored, so a database leak doesn't hand out live sessions.
export async function startSession(res: Response, userId: number) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: env.isProd, path: '/', expires: expiresAt });
}

export async function endSession(req: Request, res: Response) {
  const token = readToken(req);
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  res.clearCookie(COOKIE, { path: '/' });
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = readToken(req);
  const s = token ? await prisma.session.findUnique({ where: { id: sha256(token) }, include: { user: true } }) : null;
  if (!s || s.expiresAt < new Date()) fail('Please sign in again.', 401, 'UNAUTHENTICATED');
  req.user = s.user;
  req.sessionId = s.id;
  next();
};

export const requireManager: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'MANAGER') fail('Only managers can do this.', 403, 'FORBIDDEN');
  next();
};
