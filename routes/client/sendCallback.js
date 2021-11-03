'use strict';

const sendCallback = (app, telegramServer)=> {
  app.post('/sendCallback', (req, res)=> {
    telegramServer.addUserCallback(req.body);
    const data = {ok: true, result: null};
    res.sendResult(data);
  });
};

module.exports = sendCallback;
