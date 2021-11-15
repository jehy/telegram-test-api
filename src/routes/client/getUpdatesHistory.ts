import { TelegramServer } from '../../telegramServer';
import { Route } from '../route';

/**
 * Obtains all updates (messages or any other content) sent or received by specified bot.
 * Doesn't mark updates as "read".
 * Very useful for testing `deleteMessage` Telegram API method usage.
 */
export const getUpdatesHistory: Route = (app, telegramServer) => {
  app.post('/getUpdatesHistory', (req, res, unusedNext) => {
    const { token } = req.body;
    res.sendResult({
      ok: true,
      result: telegramServer.getUpdatesHistory(token),
    });
  });
};

export interface GetUpdatesHistoryResponse {
  ok: true;
  result: ReturnType<TelegramServer['getUpdatesHistory']>;
}
