/* eslint-disable no-unused-vars */

interface HttpError {
  http: number;
  message: string;
}
declare namespace Express {
  export interface Response {
    sendError(error: HttpError | Error): void;
    sendResult(promise: Promise<object> | string | object): void;
  }
}
