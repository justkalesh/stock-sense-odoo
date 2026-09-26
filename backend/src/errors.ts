import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'BAD_REQUEST',
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export function fail(message: string, status = 400, code?: string, fields?: Record<string, string>): never {
  throw new AppError(status, message, code, fields);
}

const body = (code: string, message: string, fields: Record<string, string> = {}) => ({ error: { code, message, fields } });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message, err.fields));
    return;
  }
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const i of err.issues) {
      const k = i.path.join('.');
      if (k && !fields[k]) fields[k] = i.message;
    }
    res.status(400).json(body('VALIDATION', err.issues[0]?.message ?? 'Invalid request', fields));
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') { res.status(409).json(body('DUPLICATE', 'That value is already in use.')); return; }
    if (err.code === 'P2003') { res.status(409).json(body('IN_USE', 'This record is still used elsewhere.')); return; }
    if (err.code === 'P2034') { res.status(409).json(body('CONFLICT', 'Someone else changed this at the same time. Please try again.')); return; }
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json(body('BAD_JSON', 'The request body is not valid JSON.'));
    return;
  }
  console.error(err);
  res.status(500).json(body('INTERNAL', 'Something went wrong on the server. Please try again.'));
};
