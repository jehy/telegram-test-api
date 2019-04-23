'use strict';

const sendCommand = (app, telegramServer)=> {
  app.post('/sendCommand', (req, res, next)=> {
    telegramServer.addUserCommand(req.body);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendCommand;
