import { handle } from './utils';
import type { Route } from '../route';

export const deleteWebhook: Route = (app, telegramServer) => {
  handle(app, '/bot:token/deleteWebhook', (req, res, _next) => {
    const botToken = req.params.token;
    telegramServer.deleteWebhook(botToken);
    const data = { ok: true, result: true, description: 'Webhook was deleted' };
    res.sendResult(data);
  });
};
