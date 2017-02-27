
/* eslint-disable no-console*/

const colors = require('colors/safe');
/**
 * requestLogger module - log requests
 * @module requestLogger
 */


module.exports = (req, res, next)=> {

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
  console.log(colors.yellow(`Request: ${JSON.stringify(reqLit)}`));
  next();
};
