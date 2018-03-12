
'use strict';

/**
 * sendResult module - Custom results for API. You may pass text, JSON or promise.
 * @module sendResult
 */


module.exports = (req, res, next)=> {
  /**
   * @name sendError
   * @param error {object} error object
   */
  res.sendError = (error)=> {
    res.status(error.http || 500)
      .json({message: error.message || 'Message not implemented'});
  };

  /**
   * @name sendResult
   * @param {Promise|string|json} promise
   */
  res.sendResult = (promise)=> {
    if (!promise.then || !promise.catch) {
      // got data
      // console.log(colors.yellow(`Sending reply: ${JSON.stringify(promise)}`));
      res.json(promise);
    } else {
      // got promise
      promise.then((result)=> {
        // promise ok
        res.json(result);
      }).catch((error)=> {
        // promise error
        res.sendError(error, res);
      });
    }
  };
  next();
};
