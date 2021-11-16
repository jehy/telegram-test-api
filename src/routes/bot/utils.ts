import type { Express, RequestHandler } from 'express';

/**
 * @see https://core.telegram.org/bots/api#making-requests
 */
const ALLOWED_HTTP_METHODS_SET = new Set(['GET', 'POST']);

export const handle = (app: Express, path: string, handler: RequestHandler) => {
  app.all(path, (req, res, next) => {
    if (!ALLOWED_HTTP_METHODS_SET.has(req.method)) {
      const message = `HTTP method '${req.method}' usage is prohibited by Telegram Bot API.`
        + ' Check out official documentation: https://core.telegram.org/bots/api#making-requests';
      res.sendError(new Error(message));
      return;
    }

    handler(req, res, next);
  });
};
