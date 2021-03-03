'use strict';

const {handle} = require('./utils');

const sendMessage = (app, telegramServer)=> {
  handle(app, '/bot:token/setWebhook', (req, res, unusedNext) => {
    const botToken = req.params.token;
    telegramServer.setWebhook(req.body, botToken);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;
