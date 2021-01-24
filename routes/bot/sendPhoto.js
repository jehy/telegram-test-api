'use strict';

const {handle} = require('./utils');

const sendPhoto = (app, telegramServer)=> {
  handle(app, '/bot:token/sendPhoto', (req, res, unusedNext) => {
    const botToken = req.params.token;
    telegramServer.addBotMessage(req.body, botToken);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendPhoto;
