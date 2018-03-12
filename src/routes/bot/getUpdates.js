
'use strict';

const getUpdates =  (app, telegramServer)=> {
  // botsample%20token/getUpdates
  app.post('/bot:token/getUpdates',  (req, res, next)=> {
    // console.log(colors.yellow('Processing route bot /getUpdates'));
    const botToken = req.params.token;
    // console.log(colors.blue(`bot token: ${botToken}`));
    // console.log(colors.blue('Requesting updates with request:'));
    // console.log(colors.blue(JSON.stringify(req.body)));
    // select messages for this bot
    let messages = telegramServer.storage.userMessages.filter(msg=> (msg.botToken === botToken));
    // turn messages into updates
    messages = messages.map((update)=> {
      telegramServer.removeUserMessage(update.updateId);
      return {
        update_id: update.updateId,
        message: {
          message_id: update.messageId,
          from: update.message.from,
          chat: update.message.chat,
          date: update.message.date,
          text: update.message.text,
        },
      };
    });
    const data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;
