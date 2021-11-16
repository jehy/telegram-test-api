import type { Route } from '../route';

export const sendCallback: Route = (app, telegramServer) => {
  app.post('/sendCallback', (req, res) => {
    telegramServer.addUserCallback(req.body);
    const data = { ok: true, result: null };
    res.sendResult(data);
  });
};
