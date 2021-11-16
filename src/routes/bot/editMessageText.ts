import { handle } from './utils';
import type { Route } from '../route';

export const editMessageText: Route = (app, telegramServer) => {
  handle(app, '/bot:token/editMessageText', (req, res, _next) => {
    telegramServer.editMessageText(req.body);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};
