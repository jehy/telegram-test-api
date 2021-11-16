import assert from 'assert';
import { handle } from './utils';
import type { Route } from '../route';

export const setWebhook: Route = (app, telegramServer) => {
  handle(app, '/bot:token/setWebhook', (req, res, _next) => {
    const botToken = req.params.token;
    const webHook = req.body.url ? req.body : req.query;
    assert.ok(webHook.url, 'Webhook must have a `url` defined');
    telegramServer.setWebhook(webHook, botToken);
    const data = { ok: true, result: null };
    res.sendResult(data);
  });
};
