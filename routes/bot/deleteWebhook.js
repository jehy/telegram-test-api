'use strict';

const {handle} = require('./utils');

const deleteWebhook = (app, telegramServer)=> {
  handle(app, '/bot:token/deleteWebhook', (req, res, unusedNext) => {
    const data = {ok: true, result: true, description: 'Webhook was deleted'};
    res.sendResult(data);
  });
};

module.exports = deleteWebhook;
