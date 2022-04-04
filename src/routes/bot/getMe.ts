import { handle } from './utils';
import type { Route } from '../route';

export const getMe: Route = (app) => {
  handle(app, '/bot:token/getMe', (_req, res, _next) => {
    const result = {
      username: 'TestNameBot',
      first_name: 'Test First name',
      id: 666,
    };
    const data = { ok: true, result };
    res.sendResult(data);
  });
};
