import { StoredBotUpdate } from '../../telegramServer';
import { Route } from '../route';

export const getUpdates: Route = (app, telegramServer) => {
  app.post('/getUpdates', (req, res) => {
    const botToken = req.body.token;
    const messages = telegramServer.storage.botMessages.filter(
      (update) => (
        update.botToken === botToken
          && String(update.message.chat_id) === String(req.body.chatId)
          && !update.isRead
      ),
    );
    // mark updates as read
    messages.forEach((update) => {
      // eslint-disable-next-line no-param-reassign
      update.isRead = true;
    });
    const data = { ok: true, result: messages };
    res.sendResult(data);
  });
};

export interface GetUpdatesResponse {
  ok: true;
  result: StoredBotUpdate[];
}
