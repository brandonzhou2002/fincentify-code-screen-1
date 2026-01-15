import { ClassType, Field, Int, ObjectType } from 'type-graphql';
import Result from 'lib/Result';
import ApplicationError from 'lib/ApplicationError';
import { init_logger } from 'util/logger';

const logger = init_logger('graphql_layer');

/**
 * Response<T>
 * ---
 * Response<T> is a GraphQL object wrapper around the Result<T, E> ADT
 * that shall be used to return responses to the client via our API.
 * It uses Generic typing to define T: Data Type, and E: Error type, both fields are nullable.
 * For more usage example and documentation check out: https://typegraphql.com/docs/generic-types.html
 * @param TClass Data class type
 * @returns Abstract Generic Wrapper for Result
 */
export default function Response<T>(TClass: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class ResponseCls {
    constructor(r: Result<any, ApplicationError>) {
      this.success = r.ok;
      this.data = null;
      this.error = null;

      if (r.ok) {
        this.data = r.data?.constructor?.name === TClass.name ? r.data : new TClass(r.data);
      } else {
        this.error = new ErrorResponse(r.error);
      }
    }

    @Field(() => Boolean)
    success: boolean;

    @Field(() => TClass, { nullable: true })
    data?: T;

    @Field(() => ErrorResponse, { nullable: true })
    error?: ErrorResponse;
  }
  return ResponseCls;
}

/**
 * ErrorResponse
 * ---
 * A GraphQL response wrapper around any ApplicationError
 */
@ObjectType()
export class ErrorResponse {
  @Field(() => Int)
  code: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  detail?: string;

  @Field({ nullable: true })
  service?: string;

  @Field({ nullable: true })
  flow?: string;

  constructor(error: ApplicationError) {
    this.code = error.code;
    this.name = error.name;
    this.detail = error.detail;
    this.service = error.service;
    this.flow = error.flow;

    logger.warn(
      {
        code: this.code,
        name: this.name,
        detail: this.detail,
      },
      'Error returned to client'
    );
  }
}

@ObjectType()
export class BooleanResponse extends Response(Boolean) {}

@ObjectType()
export class StringResponse {
  constructor(r: Result<string, ApplicationError>) {
    this.success = r.ok;
    this.data = null;
    this.error = null;

    if (r.ok) {
      this.data = r.data;
    } else {
      this.error = new ErrorResponse(r.error);
    }
  }

  @Field(() => Boolean)
  success: boolean;

  @Field({ nullable: true })
  data?: string;

  @Field(() => ErrorResponse, { nullable: true })
  error?: ErrorResponse;
}
