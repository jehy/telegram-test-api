const colors = require('colors/safe');

let sendMessage = (app, telegramServer)=> {


  app.post('/bot:token/sendMessage', (req, res, next)=> {
    console.log(colors.yellow('Processing route bot /sendMessage'));
    let botToken = req.params.token;
    console.log(colors.blue(`bot token: ${botToken}`));
    console.log(colors.blue('Adding bot message for request:'));
    console.log(colors.blue(JSON.stringify(req.body)));
    telegramServer.addBotMessage(req.body, botToken);
    let data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;
