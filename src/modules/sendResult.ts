import type { Handler } from 'express';

/**
 * sendResult module - Custom results for API. You may pass text, JSON or promise.
 * @module sendResult
 */

function isPromise(
  obj: Promise<object> | string | object,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): obj is Promise<any> {
  return typeof obj === 'object' && 'then' in obj && 'catch' in obj;
}

export const sendResult: Handler = (_req, res, next) => {
  res.sendError = (error) => {
    res
      .status('http' in error ? error.http : 500)
      .json({ message: error.message || 'Message not implemented' });
  };

  res.sendResult = (promise) => {
    if (!isPromise(promise)) {
      // got data
      // console.log(colors.yellow(`Sending reply: ${JSON.stringify(promise)}`));
      res.json(promise);
    } else {
      // got promise
      promise
        .then((result) => {
          // promise ok
          res.json(result);
        })
        .catch((error) => {
          // promise error
          res.sendError(error);
        });
    }
  };
  next();
};
