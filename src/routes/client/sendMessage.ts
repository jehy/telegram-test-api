import type { Route } from '../route';

export const sendMessage: Route = (app, telegramServer) => {
  app.post('/sendMessage', (req, res) => {
    telegramServer.addUserMessage(req.body);
    const data = { ok: true, result: null };
    res.sendResult(data);
  });
};
