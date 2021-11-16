import { handle } from './utils';
import { Route } from '../route';

/**
 * Deletes messages sent by bots or by clients.
 * Doesn't authorize: test is able to delete any existing message.
 * @see https://core.telegram.org/bots/api#deletemessage
 */
export const deleteMessage: Route = (app, telegramServer) => {
  handle(app, '/bot:token/deleteMessage', (req, res, unusedNext) => {
    const chatId = Number(req.body.chat_id);
    const messageId = Number(req.body.message_id);

    if (!Number.isFinite(chatId) || !Number.isFinite(messageId)) {
      res.sendResult({
        ok: false,
        error_code: 400,
        description: 'Bad Request: please specify `chat_id` and `message_id`',
      });
      return;
    }

    const isDeleted = telegramServer.deleteMessage(chatId, messageId);

    if (!isDeleted) {
      res.sendResult({
        ok: false,
        // It seems like 404 would be better but that's the way Telegram actually works.
        error_code: 400,
        description: `Bad Request: chat ${chatId} with message ${messageId} wasn't found`,
      });
      return;
    }

    res.sendResult({
      ok: true,
      result: null,
    });
  });
};
