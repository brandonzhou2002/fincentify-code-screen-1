import 'reflect-metadata';
import config from 'util/config';
import { init_logger } from 'util/logger';
import init_app from 'app';

let server: any;
const port = config.get('port');
const logger = init_logger('server');

const main = async () => {
  const app = await init_app();

  server = app.listen(port, () => {
    logger.info(`Server listening on tcp 0.0.0.0:${port}`);
  });
};

const shutdown_procedure = (signal: string, exit_code: number) => {
  const fn = async () => {
    logger.info(
      {
        timestamp: new Date().toISOString(),
        signal,
        exit_code,
      },
      `Server is shutting down with exit code ${exit_code}`
    );
    process.exit(exit_code);
  };
  return fn;
};

const shutdown = (signal: string, code?: number) => {
  server.close(async () => {
    logger.info(
      {
        timestamp: new Date().toISOString(),
        signal,
        exit_code: code,
      },
      `Server is shutting down with code ${code}`
    );
    process.exit(code ? code : 0);
  });
};

process.on('SIGTERM', shutdown_procedure('SIGTERM', 0));
process.on('SIGINT', shutdown_procedure('SIGINT', 0));
process.on('unhandledRejection', (err) => {
  logger.error(
    {
      timestamp: new Date().toISOString(),
      error: err,
    },
    `Unhandled rejection occured, exit 1`
  );
  shutdown('ERROR', 1);
});
process.on('uncaughtException', (err) => {
  logger.error(
    {
      timestamp: new Date().toISOString(),
      error_stack: err.stack,
      error_message: err.message,
    },
    `Uncaught error occured, exit 1`
  );
  shutdown('ERROR', 1);
});

main().catch((err) => {
  logger.error(
    {
      timestamp: new Date().toISOString(),
      error_stack: err.stack,
      error_message: err.message,
    },
    `Unhandled error occured, exit 1`
  );
  shutdown('ERROR', 1);
});
