/* eslint-disable @typescript-eslint/no-var-requires */
const bunyan = require('bunyan'),
  bformat = require('bunyan-format'),
  formatOut = bformat({ outputMode: 'short', level: 'debug' });

const streams: any[] = [
  {
    stream: formatOut,
    serializers: bunyan.stdSerializers,
  },
];

const logger = bunyan.createLogger({
  name: 'code-screen-server',
  streams,
});

export type Logger = ReturnType<typeof init_logger>;

// Memoization cache for loggers
const logger_cache = new Map<string, Logger>();

export const init_logger = (service_name: string) => {
  let name = service_name;

  if (process.env.STAGE === 'dev') {
    name = 'dev_' + name;
  } else if (process.env.STAGE === 'test') {
    if (process.env.FORCE_LOG === 'true') {
      name = 'test_' + name;
    } else {
      // Silence all logging on STAGE==test
      return {
        info: (a: any, b?: any) => {
          return;
        },
        error: (a: any, b?: any) => {
          return;
        },
        warn: (a: any, b?: any) => {
          return;
        },
        debug: (a: any, b?: any) => {
          return;
        },
      };
    }
  }

  return logger.child({ component: name });
};

/**
 * Memoized version of init_logger - creates logger once and reuses it
 */
export const get_logger = (service_name: string): Logger => {
  if (!logger_cache.has(service_name)) {
    logger_cache.set(service_name, init_logger(service_name));
  }
  return logger_cache.get(service_name);
};
