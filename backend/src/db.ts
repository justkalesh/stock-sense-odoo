import './env.js'; // loads .env before DATABASE_URL is read below
import { PrismaClient, Prisma } from '@prisma/client';

// Neon's pooled URL goes through PgBouncer, which can't share Prisma's prepared statements between clients
function runtimeUrl(raw = process.env.DATABASE_URL) {
  if (!raw || !/-pooler\./.test(raw) || /[?&]pgbouncer=/.test(raw)) return raw;
  return raw + (raw.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const url = runtimeUrl();
export const prisma = url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient();
export type Tx = Prisma.TransactionClient;

// Commands that read stock and then write run Serializable, so two users can't both reserve the last units.
// Postgres aborts one of two conflicting transactions (Prisma P2034); rerunning the whole transaction is safe.
export async function withTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 20_000,
      });
    } catch (e) {
      if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') continue;
      throw e;
    }
  }
}
