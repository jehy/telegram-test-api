import { handle } from './utils';
import type { Route } from '../route';

export const editMessageReplyMarkup: Route = (app,telegramServer) => {
  handle(app, '/bot:token/editMessageReplyMarkup', (req, res, _next) => {
    telegramServer.editMessageReplyMarkup(req.body);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};
