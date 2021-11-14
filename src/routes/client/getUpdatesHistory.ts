'use strict';

/**
 * Obtains all updates (messages or any other content) sent or received by specified bot.
 * Doesn't mark updates as "read".
 * Very useful for testing `deleteMessage` Telegram API method usage.
 */
const getUpdatesHistory = (app, telegramServer) => {
  app.post('/getUpdatesHistory', (req, res, unusedNext) => {
    const {token} = req.body;
    res.sendResult({
      ok: true,
      result: telegramServer.getUpdatesHistory(token),
    });
  });
};

module.exports = getUpdatesHistory;
