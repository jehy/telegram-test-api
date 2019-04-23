'use strict';

const getUpdates = (app, telegramServer)=> {
  app.post('/getUpdates', (req, res, next)=> {
    const botToken = req.body.token;
    let messages = telegramServer.storage.botMessages.filter(update=> (
      update.botToken === botToken && !update.isRead
    ));
    // turn messages into updates
    messages = messages.map((update)=> {
      update.isRead = true;
      return update;
    });
    const data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;
