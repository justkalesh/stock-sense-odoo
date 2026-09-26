import nodemailer from 'nodemailer';
import { env } from './env.js';

const transport = env.gmailUser && env.gmailAppPassword
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: env.gmailUser, pass: env.gmailAppPassword } })
  : null;

export async function sendOtpEmail(to: string, code: string) {
  if (!transport) {
    console.log(`[mail disabled] Reset code for ${to}: ${code}. Set GMAIL_USER and GMAIL_APP_PASSWORD to send real email.`);
    return;
  }
  await transport.sendMail({
    from: `StockSense <${env.gmailUser}>`,
    to,
    subject: `${code} is your StockSense code`,
    text: `Your StockSense verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't ask to reset your password, you can ignore this email.`,
    html: `<p>Your StockSense verification code is</p><p style="font:600 28px monospace;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you didn't ask to reset your password, you can ignore this email.</p>`,
  });
}
