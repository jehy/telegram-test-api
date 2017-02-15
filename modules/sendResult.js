'use strict';
/**
 * sendResult module - Custom results for API. You may pass text, JSON or promise.
 * @module sendResult
 */


module.exports = function (req, res, next) {
  /**
   * @name sendError
   * @param error {object} error object
   */
  res.sendError = function (error) {
    res.status(error.http || 500)
      .json({'message': error.message || 'Message not implemented'});
  };

  /**
   * @name sendResult
   * @param {Promise|string|json} promise
   */
  res.sendResult = function (promise) {
    if (!promise.then || !promise.catch) {
      // got data
      res.json(promise);
    } else {
      // got promise
      promise.then(function (result) {
        // promise ok
        res.json(result);
      }).catch(function (error) {
        // promise error
        res.sendError(error, res);
      });
    }
  };

  next();

};
