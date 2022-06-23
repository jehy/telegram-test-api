/* istanbul ignore file */

import { promisify } from 'util';
import { Telegraf } from 'telegraf';
import type { ApiResponse } from 'typegram';
import type { TelegramServerConfig } from '../telegramServer';
import { TelegramServer } from '../telegramServer';

export const delay = promisify(setTimeout);

let serverPort = 9001;

function getPort() {
  serverPort++;
  return serverPort;
}

export async function getServerAndClient(
  token: string,
  serverOptions: Partial<TelegramServerConfig> = {},
) {
  const serverConfig = { port: getPort() };
  const server = new TelegramServer({ ...serverConfig, ...serverOptions });
  await server.start();
  return { client: server.getClient(token), server };
}

export async function getServerAndBot(token: string) {
  const serverConfig = { port: getPort() };
  const server = new TelegramServer(serverConfig);
  await server.start();
  // the options passed to Telegraf in this format will make it try to get messages from the server's local URL
  const bot = new Telegraf(token, {
    telegram: { apiRoot: server.config.apiURL },
  });
  bot.command('start', (ctx) => ctx.reply('Hi!'));
  bot.on('callback_query', (ctx) => ctx.reply('pong'));
  bot.launch();
  return { server, bot };
}

export function getHookOptions(token: string) {
  const hookedBotOptions = {
    polling: false,
    webHook: { host: 'localhost', port: getPort() },
  };
  const hookUrl = `http://localhost:${hookedBotOptions.webHook.port}/bot${token}`;
  return { hookedBotOptions, hookUrl };
}

export async function assertEventuallyTrue(
  timeoutDuration: number,
  message: string,
  func: () => boolean,
) {
  let waited = 0;
  const waitStep = 50;
  while (!func()) {
    // eslint-disable-next-line no-await-in-loop
    await delay(waitStep);
    waited += waitStep;
    if (waited > timeoutDuration) {
      throw new Error(message);
    }
  }
}

export function ensureUpdates<T>(updates: ApiResponse<T>) {
  if (!updates.ok) {
    throw new Error(updates.description);
  }
}
