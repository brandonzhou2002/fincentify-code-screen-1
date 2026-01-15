import { Prisma, PrismaClient } from '@prisma/client';
import { init_logger } from './logger';
import { DatabaseError } from '../lib/ApplicationError';

const logger = init_logger('db');

const db = new PrismaClient();

export default db;

export async function db_retriable_transaction<R>(
  fn: (prisma: Prisma.TransactionClient) => Promise<R>,
  opt: {
    isolation_level?: Prisma.TransactionIsolationLevel;
    max_retries?: number;
    retry_delay_ms?: number;
    max_wait_ms?: number;
    timeout_ms?: number;
  },
  ctx: any = {}
): Promise<R> {
  const max_retries = opt.max_retries ?? 5;
  const retry_delay_ms = opt.retry_delay_ms ?? 500;

  let retry_cnt = 0;
  let res;
  let source_err;

  while (retry_cnt < max_retries) {
    try {
      res = await db.$transaction(fn, {
        isolationLevel: opt.isolation_level ?? Prisma.TransactionIsolationLevel.Serializable,
        maxWait: opt.max_wait_ms ?? 2000,
        timeout: opt.timeout_ms ?? 5000,
      });
      return res;
    } catch (err) {
      if (err && err.code !== 'P2034') {
        logger.error(
          {
            prisma_error: err,
            prisma_err_code: err.code,
            retry_cnt,
            max_retries,
            retry_delay_ms,
            isolation_level: opt.isolation_level ?? Prisma.TransactionIsolationLevel.Serializable,

            timestamp: new Date(),
            ...ctx,
          },
          `DB Error other than P2034 encountered, throwing error`
        );
        throw new DatabaseError(err, 'Database error encountered: check logs');
      }
      source_err = err;
      logger.info(
        {
          retry_cnt,
          max_retries,
          retry_delay_ms,
          isolation_level: opt.isolation_level ?? Prisma.TransactionIsolationLevel.Serializable,

          timestamp: new Date(),
          ...ctx,
        },
        `Caution: Transaction failed due to write conflict or deadlock, delay & retry`
      );

      retry_cnt++;
      await new Promise((resolve) => setTimeout(resolve, retry_delay_ms));
    }
  }

  logger.error(
    {
      retry_cnt,
      max_retries,
      retry_delay_ms,
      isolation_level: opt.isolation_level ?? Prisma.TransactionIsolationLevel.Serializable,

      timestamp: new Date(),
      ...ctx,
    },
    `Error: Transaction failed to write after max retries attempted, throwing ServerInternalError`
  );

  throw new DatabaseError(
    source_err,
    'Serializable Isolation Level Transaction attempts have exceeded retry limit'
  );
}
