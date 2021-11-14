'use strict';

const formatUpdate = (update) => {
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
};

module.exports = formatUpdate;
