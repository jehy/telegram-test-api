import { handle } from './utils';
import type { Route } from '../route';

export const sendMessage: Route = (app, telegramServer) => {
  handle(app, '/bot:token/sendMessage', (req, res, _next) => {
    const botToken = req.params.token;
    const result = telegramServer.addBotMessage(req.body, botToken);
    const data = { ok: true, result };
    res.sendResult(data);
  });
};
