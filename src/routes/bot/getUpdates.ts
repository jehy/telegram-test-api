import { handle } from './utils';
import { Route } from '../route';

export const getUpdates: Route = (app, telegramServer) => {
  // botsample%20token/getUpdates
  handle(app, '/bot:token/getUpdates', (req, res, unusedNext) => {
    const botToken = req.params.token;

    const data = { ok: true, result: telegramServer.getUpdates(botToken) };
    res.sendResult(data);
  });
};
