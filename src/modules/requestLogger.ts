import debugTest from 'debug';
import { Handler } from 'express';
const debugRequest = debugTest('TelegramServer:request');
/**
 * requestLogger module - log requests
 * @module requestLogger
 */

export const requestLogger: Handler = (req, res, next) => {
  const reqLit = {
    body: req.body,
    cookies: req.cookies,
    files: req.cookies,
    headers: req.headers,
    method: req.method,
    params: req.params,
    query: req.query,
    url: req.url,
    originalUrl: req.originalUrl,
  };
  debugRequest(`Request: ${JSON.stringify(reqLit)}`);
  next();
};
