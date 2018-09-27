
'use strict';

const {handle} = require('./utils');

const unknownMethod = (app) => {
  handle(app, '/bot:token/:method', (req, res, unusedNext) => {
    const message = `API method '${req.params.method}' is not supported.`
      + ' Are you sure you\'re using Telegram Bot API correctly? Check out'
      + ' the list of methods supported by `telegram-test-api` package or look at official'
      + ' documentation: https://core.telegram.org/bots/api#available-methods';
    res.sendError(new Error(message));
  });
};

module.exports = unknownMethod;
