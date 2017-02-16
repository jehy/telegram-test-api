var colors = require('colors/safe');
var getUpdates = function (app, telegramServer) {

  ///botsample%20token/getUpdates
  app.post('/bot:token/getUpdates', function (req, res, next) {
    console.log(colors.yellow('Processing route bot /getUpdates'));
    var botToken = req.params.token;
    console.log(colors.blue('bot token: ' + botToken));
    console.log(colors.blue('Requesting updates with request:'));
    console.log(colors.blue(JSON.stringify(req.body)));
    //select messages for this bot
    var messages = telegramServer.storage.userMessages.filter(function (msg) {
      return msg.botToken === botToken;
    });
    //turn messages into updates
    messages = messages.map(function (update) {
      telegramServer.removeUserMessage(update.updateId);
      return {
        update_id: update.updateId,
        message: {
          message_id: update.messageId,
          from: update.message.from,
          chat: update.message.chat,
          date: update.message.date,
          text: update.message.text
        }
      }
    });
    let data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;