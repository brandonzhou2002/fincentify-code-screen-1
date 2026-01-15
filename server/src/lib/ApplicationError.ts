/* eslint-disable @typescript-eslint/no-inferrable-types */
export enum ErrorType {
  User,
  Server,
}

export interface Err<E extends Error> {
  source_error?: E;
  code: number;
  name: string;
  type: ErrorType;
  detail?: string;
  service?: string;
  flow?: string;

  _t: string;
}

type ApplicationError = Err<Error>;

export class ServerInternalError<E extends Error> implements Err<E> {
  source_error?: E;
  source_error_string?: string;
  code: number = 503;
  name: string = 'ServerInternalError';
  type: ErrorType = ErrorType.Server;
  detail?: string;
  service?: string;
  flow?: string;

  _t: string;

  constructor(e: E, detail?: string, service?: string, flow?: string) {
    this.detail = detail;
    this.service = service;
    this.flow = flow;
    this.source_error = e;
    this.source_error_string = e.toString();

    this._t = 'ApplicationError';
  }
}

export class DatabaseError<E extends Error> implements Err<E> {
  source_error?: E;
  source_error_string?: string;
  code: number = 5031;
  name: string = 'DatabaseError';
  type: ErrorType = ErrorType.Server;
  detail?: string;
  service?: string;
  flow?: string;
  _t: string = 'ApplicationError';

  constructor(e: E, detail?: string, service?: string, flow?: string) {
    this.detail = detail;
    this.service = service;
    this.flow = flow;
    this.source_error = e;
    this.source_error_string = e.toString();
  }
}

export function UserError(code: number, service?: string, flow?: string) {
  abstract class UserErrorCls<E extends Error> implements Err<E> {
    source_error?: E;
    source_error_string?: string;
    code: number = code;
    name: string;
    type: ErrorType = ErrorType.User;
    detail?: string;
    service?: string = service;
    flow?: string = flow;
    _t: string;

    constructor(e: E, detail?: string) {
      this.detail = detail;
      this.code = code;
      this.name = this.constructor['name'];
      this.source_error = e;
      if (e) {
        this.source_error_string = e.toString();
      }
      this._t = 'ApplicationError';
    }
  }
  return UserErrorCls;
}

export default ApplicationError;
