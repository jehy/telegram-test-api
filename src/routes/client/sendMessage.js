
'use strict';

const sendMessage = (app, telegramServer)=> {
  app.post('/sendMessage', (req, res, next)=> {
    // console.log(colors.yellow('Processing route client /sendMessage'));
    // console.log(colors.blue('Adding client message for request:'));
    // console.log(colors.blue(JSON.stringify(req.body)));
    telegramServer.addUserMessage(req.body);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendMessage;
