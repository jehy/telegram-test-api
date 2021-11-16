import type { Route } from '../route';

export const sendCommand: Route = (app, telegramServer) => {
  app.post('/sendCommand', (req, res) => {
    telegramServer.addUserCommand(req.body);
    const data = { ok: true, result: null };
    res.sendResult(data);
  });
};
