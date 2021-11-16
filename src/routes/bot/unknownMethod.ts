import { handle } from './utils';
import type { Route } from '../route';

export const unknownMethod: Route = (app) => {
  handle(app, '/bot:token/:method', (req, res, _next) => {
    const message = `API method '${req.params.method}' is not supported.`
      + " Are you sure you're using Telegram Bot API correctly? Check out"
      + ' the list of methods supported by `telegram-test-api` package or look at official'
      + ' documentation: https://core.telegram.org/bots/api#available-methods';
    res.sendError(new Error(message));
  });
};
