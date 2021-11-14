'use strict';

const getUpdates = (app, telegramServer)=> {
  app.post('/getUpdates', (req, res)=> {
    const botToken = req.body.token;
    let messages = telegramServer.storage.botMessages.filter((update)=> (
      update.botToken === botToken && !update.isRead
    ));
    // turn messages into updates
    messages = messages.map((update)=> {
      // eslint-disable-next-line no-param-reassign
      update.isRead = true;
      return update;
    });
    const data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;
