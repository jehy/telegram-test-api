import { handle } from './utils';
import { Route } from '../route';

export const sendMessage: Route = (app, telegramServer) => {
  handle(app, '/bot:token/sendMessage', (req, res, unusedNext) => {
    const botToken = req.params.token;
    telegramServer.addBotMessage(req.body, botToken);
    const data = { ok: true, result: null };
    res.sendResult(data);
  });
};
