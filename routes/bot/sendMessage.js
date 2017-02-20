
var colors    = require('colors/safe');
var sendMessage = function (app,telegramServer) {


  app.post('/bot:token/sendMessage', function (req, res, next) {
    console.log(colors.yellow('Processing route bot /sendMessage'));
    var botToken = req.params.token;
    console.log(colors.blue('bot token: ' + botToken));
    console.log(colors.blue('Adding bot message for request:'));
    console.log(colors.blue(JSON.stringify(req.body)));
    telegramServer.addBotMessage(req.body,botToken);
    let data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;