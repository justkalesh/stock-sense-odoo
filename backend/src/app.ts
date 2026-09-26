// Vercel entrypoint: its Express preset serves the default export. Locally, src/local.ts calls listen().
import express from 'express';
import { AppError, errorHandler } from './errors.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/data.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // HTML forms can't send JSON, so this blocks cross-site form posts (CSRF) on top of SameSite cookies
  if (req.method !== 'GET' && req.method !== 'HEAD' && !(req.headers['content-type'] || '').startsWith('application/json')) {
    return next(new AppError(415, 'Requests must be sent as JSON.', 'UNSUPPORTED_MEDIA_TYPE'));
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
app.use('/api', dataRouter);
app.use((_req, _res, next) => next(new AppError(404, 'Not found', 'NOT_FOUND')));
app.use(errorHandler);

export default app;
