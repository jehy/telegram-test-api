'use strict';

const assert = require('assert');
const {handle} = require('./utils');

const sendMessage = (app, telegramServer)=> {
  handle(app, '/bot:token/setWebhook', (req, res, unusedNext) => {
    const botToken = req.params.token;
    const webHook = req.body.url ? req.body : req.query;
    assert.ok(webHook.url, 'Webhook must have a `url` defined');
    telegramServer.setWebhook(webHook, botToken);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;
