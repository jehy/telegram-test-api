'use strict';

const {handle} = require('./utils');

const sendMessage = (app, telegramServer)=> {
  handle(app, '/bot:token/sendMessage', (req, res, unusedNext) => {
    // console.log(colors.yellow('Processing route bot /sendMessage'));
    const botToken = req.params.token;
    // console.log(colors.blue(`bot token: ${botToken}`));
    // console.log(colors.blue('Adding bot message for request:'));
    // console.log(colors.blue(JSON.stringify(req.body)));
    telegramServer.addBotMessage(req.body, botToken);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;
