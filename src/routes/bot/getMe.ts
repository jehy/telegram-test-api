import { handle } from './utils';
import { Route } from '../route';

export const getMe: Route = (app) => {
  handle(app, '/bot:token/getMe', (req, res, unusedNext) => {
    const result = {
      username: 'Test Name',
      first_name: 'Test First name',
      id: 666,
    };
    const data = { ok: true, result };
    res.sendResult(data);
  });
};
