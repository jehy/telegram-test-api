'use strict';

const formatUpdate = require('../../modules/formatUpdate');
const {handle} = require('./utils');

const getUpdates = (app, telegramServer)=> {
  // botsample%20token/getUpdates
  handle(app, '/bot:token/getUpdates', (req, res, unusedNext) => {
    const botToken = req.params.token;
    let messages = telegramServer.storage.userMessages.filter((update) => (
      update.botToken === botToken && !update.isRead
    ));
    // turn messages into updates
    messages = messages.map((update)=> {
      // eslint-disable-next-line no-param-reassign
      update.isRead = true;
      return formatUpdate(update);
    });
    const data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;
