import { ApolloLink, Operation, FetchResult, NextLink } from '@apollo/client';
import { Observable } from '@apollo/client';
import {
  DelayFunction,
  DelayFunctionOptions,
  buildDelayFunction,
} from '@apollo/client/link/retry/delayFunction';
import { ERROR_CODES } from './errorCodes';

class RetryTimeoutError extends Error {
  constructor() {
    super('Retries timed out');
    this.name = 'Retry Timeout Error';
  }
}

/**
 * Tracking and management of operations that may be (or currently are) retried.
 */
class RetryableOperation<TValue = any> {
  private retry_count: number = 0;
  private idempotent_retry_count: number = 0;
  private values: any[] = [];
  private error: any;
  private complete = false;
  private canceled = false;
  private observers: (ZenObservable.Observer<TValue> | null)[] = [];
  private current_subscription: ZenObservable.Subscription | null = null;
  private timer_id: number | undefined;

  private operation: Operation;
  private next_link: NextLink;
  private delay_for: DelayFunction;
  private max_error_retry_times: number;
  private retry_timeout: number;
  private currently_retrying: boolean;
  private max_idempotent_retry_interval: number;

  private start_time: Date;

  constructor(
    operation: Operation,
    next_link: NextLink,
    delay_for: DelayFunction,
    max_error_retry_times: number,
    retry_timeout: number,
    max_idempotent_retry_interval: number
  ) {
    this.operation = operation;
    this.next_link = next_link;
    this.delay_for = delay_for;
    this.max_error_retry_times = max_error_retry_times;
    this.retry_timeout = retry_timeout;
    this.currently_retrying = false;
    this.max_idempotent_retry_interval = max_idempotent_retry_interval;
    this.start_time = new Date();
  }

  /**
   * Register a new observer for this operation.
   *
   * If the operation has previously emitted other events, they will be
   * immediately triggered for the observer.
   */
  public subscribe(observer: ZenObservable.Observer<TValue>) {
    if (this.canceled) {
      throw new Error(`Subscribing to a retryable link that was canceled is not supported`);
    }
    this.observers.push(observer);

    // If we've already begun, catch this observer up.
    for (const value of this.values) {
      observer.next!(value);
    }

    if (this.complete) {
      observer.complete!();
    } else if (this.error) {
      observer.error!(this.error);
    }
  }

  /**
   * Remove a previously registered observer from this operation.
   *
   * If no observers remain, the operation will stop retrying, and unsubscribe
   * from its downstream link.
   */
  public unsubscribe(observer: ZenObservable.Observer<TValue>) {
    const index = this.observers.indexOf(observer);
    if (index < 0) {
      throw new Error(`RetryLink BUG! Attempting to unsubscribe unknown observer!`);
    }
    // Note that we are careful not to change the order of length of the array,
    // as we are often mid-iteration when calling this method.
    this.observers[index] = null;

    // If this is the last observer, we're done.
    if (this.observers.every((o) => o === null)) {
      this.cancel();
    }
  }

  /**
   * Start the initial request.
   */
  public start() {
    if (this.current_subscription) return; // Already started.

    this.try();
  }

  /**
   * Stop retrying for the operation, and cancel any in-progress requests.
   */
  public cancel() {
    if (this.current_subscription) {
      this.current_subscription.unsubscribe();
    }
    clearTimeout(this.timer_id);
    this.timer_id = undefined;
    this.current_subscription = null;
    this.canceled = true;
  }

  private try() {
    this.current_subscription = this.next_link(this.operation).subscribe({
      next: this.on_next,
      error: this.on_error,
      complete: this.on_complete,
    });
  }

  private get_next_idempotent_retry_delay() {
    return Math.min(this.max_idempotent_retry_interval, Math.pow(2, this.idempotent_retry_count) * 1000);
  }

  private on_next = (value: any) => {
    this.values.push(value);
    // If we get an idempotency in flight error, delay for some time then retry
    let inner_data = value.data[Object.keys(value.data)[0]];
    if (inner_data.error && inner_data.error.code == ERROR_CODES.RequestInFlight) {
      const time_elapsed = new Date().getTime() - this.start_time.getTime();
      if (time_elapsed < this.retry_timeout) {
        this.schedule_retry(this.get_next_idempotent_retry_delay());
        this.idempotent_retry_count += 1;
        return;
      } else {
        this.on_error(new RetryTimeoutError());
      }
    }
    this.currently_retrying = false;

    for (const observer of this.observers) {
      if (!observer) continue;
      observer.next!(value);
    }
  };

  private on_complete = () => {
    if (this.currently_retrying) {
      return;
    }
    this.complete = true;
    for (const observer of this.observers) {
      if (!observer) continue;
      observer.complete!();
    }
  };

  private should_retry_network_error = (count: number, operation: Operation, error: any) => {
    if (count >= this.max_error_retry_times) return false;
    return !!error;
  };

  private on_error = async (error: any) => {
    this.retry_count += 1;
    const should_retry = this.should_retry_network_error(this.retry_count, this.operation, error);

    // Should we retry?
    if (should_retry && !(error instanceof RetryTimeoutError)) {
      this.schedule_retry(this.delay_for(this.retry_count, this.operation, error));
      return;
    }

    this.error = error;
    for (const observer of this.observers) {
      if (!observer) continue;
      observer.error!(error);
    }
  };

  private schedule_retry = (delay: number) => {
    this.currently_retrying = true;
    if (this.timer_id) {
      throw new Error(`RetryLink BUG! Encountered overlapping retries`);
    }

    this.timer_id = (setTimeout(() => {
      this.timer_id = undefined;
      this.try();
    }, delay) as any) as number;
  };
}

class CustomRetryLink extends ApolloLink {
  /*
    Custom retry link to handle network errors as well as idempotency errors
  */

  private delay_for: DelayFunction;
  private max_error_retry_times: number;
  private retry_timeout: number;
  private max_idempotent_retry_interval: number;

  constructor() {
    super();
    const delay_options: DelayFunctionOptions = {
      initial: 350,
      max: 2000,
      jitter: true,
    };
    this.delay_for = buildDelayFunction(delay_options);
    this.max_error_retry_times = 3;
    this.retry_timeout = 600000;
    this.max_idempotent_retry_interval = 15000;
  }

  public request(operation: Operation, next_link: NextLink): Observable<FetchResult> {
    const retryable = new RetryableOperation(
      operation,
      next_link,
      this.delay_for,
      this.max_error_retry_times,
      this.retry_timeout,
      this.max_idempotent_retry_interval
    );
    retryable.start();

    return new Observable((observer) => {
      retryable.subscribe(observer);
      return () => {
        retryable.unsubscribe(observer);
      };
    });
  }
}

export default CustomRetryLink;
