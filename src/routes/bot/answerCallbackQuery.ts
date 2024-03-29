import { handle } from './utils';
import type { Route } from '../route';
/**
 * This route does nothing, it just stops spinner on keyboard button
 * @see https://core.telegram.org/bots/api#answercallbackquery
 */
export const answerCallbackQuery: Route = (app) => {
  // @ts-expect-error TS6133: 'unusedTestBot' is declared but its value is never read.
  handle(app, '/bot:token/answerCallbackQuery', (req, res) => {
    res.sendResult({
      ok: true,
      result: null,
    });
  });
};
