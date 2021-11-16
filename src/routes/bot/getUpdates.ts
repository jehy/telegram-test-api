import { handle } from './utils';
import type { Route } from '../route';

export const getUpdates: Route = (app, telegramServer) => {
  // botsample%20token/getUpdates
  handle(app, '/bot:token/getUpdates', (req, res, _next) => {
    const botToken = req.params.token;

    const data = { ok: true, result: telegramServer.getUpdates(botToken) };
    res.sendResult(data);
  });
};
