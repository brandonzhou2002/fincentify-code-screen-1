/* eslint-disable @typescript-eslint/ban-types */
import { init_logger } from 'util/logger';

const logger = init_logger('lib::result_adt');

class ResultChainningError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Result<T, E> ADT
 * ---------------
 * Result Algerbraic Data Type is a library to faciliate
 * error handling and branching while maintaining consistent
 * signature across services.
 */
export default class Result<T, E> {
  ok: boolean;
  data: T;
  error: E;

  constructor(ok: boolean, data: T, error: E) {
    this.ok = ok;
    this.data = data;
    this.error = error;
  }

  unwrap(): T {
    if (this.ok) {
      return this.data;
    }
    throw this.error;
  }

  safe_unwrap(): T {
    if (this.ok) {
      return this.data;
    }
    logger.debug(
      {
        source_error: this.error,
      },
      'Error encountered during safe_unwrap, nothing thrown'
    );
    return null;
  }

  unwrap_or_else(fn: Function): T | any {
    if (this.ok) {
      return this.data;
    }
    return fn(this.error);
  }

  static success<T, E>(data: T): Result<T, E> {
    return new Result(true, data, null);
  }

  static fail<T, E>(error: E): Result<T, E> {
    return new Result(false, null, error);
  }
}