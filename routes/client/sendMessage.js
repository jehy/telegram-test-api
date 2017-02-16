
var colors    = require('colors/safe');
var sendMessage = function (app,telegramServer) {


  app.post('/sendMessage', function (req, res, next) {
    console.log(colors.yellow('Processing route client /sendMessage'));
    console.log(colors.blue('Adding client message for request:'));
    console.log(colors.blue(JSON.stringify(req.body)));
    telegramServer.addUserMessage(req.body);
    res.sendResult("ok");
  });
};

module.exports = sendMessage;