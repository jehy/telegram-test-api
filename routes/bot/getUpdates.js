'use strict';

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
      update.isRead = true;
      if ('callbackQuery' in update) {
        return {
          update_id: update.updateId,
          callback_query: {
            id: String(update.callbackId),
            from: update.callbackQuery.from,
            message: update.callbackQuery.message,
            data: update.callbackQuery.data,
          },
        };
      }
      return {
        update_id: update.updateId,
        message: {
          message_id: update.messageId,
          from: update.message.from,
          chat: update.message.chat,
          date: update.message.date,
          text: update.message.text,
          entities: update.entities,
        },
      };
    });
    const data = {ok: true, result: messages};
    res.sendResult(data);
  });
};

module.exports = getUpdates;
