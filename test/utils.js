'use strict';

const {promisify} = require('util');
const Telegraf = require('telegraf');
const TelegramServer = require('../telegramServer');

const delay = promisify(setTimeout);

let serverPort = 9001;

function getPort() {
  serverPort++;
  return serverPort;
}

async function getServerAndClient(token, serverOptions = {}) {
  const serverConfig = {port: getPort()};
  const server = new TelegramServer({...serverConfig, ...serverOptions});
  await server.start();
  return { client: server.getClient(token), server };
}

async function getServerAndBot(token) {
  const serverConfig = { port: getPort() };
  const server = new TelegramServer(serverConfig);
  await server.start();
  // the options passed to Telegraf in this format will make it try to get messages from the server's local URL
  const bot = new Telegraf(token, { telegram: { apiRoot: server.ApiURL } });
  bot.command('start', (ctx) => ctx.reply('Hi!'));
  bot.on('callback_query', (ctx) => ctx.reply('pong'));
  bot.startPolling();
  return {server, bot};
}

function getHookOptions(token) {
  const hookedBotOptions = {polling: false, webHook: {host: 'localhost', port: getPort() }};
  const hookUrl = `http://localhost:${hookedBotOptions.webHook.port}/bot${token}`;
  return {hookedBotOptions, hookUrl};
}

async function assertEventuallyTrue(timeoutDuration, message, func) {
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

module.exports = {
  getServerAndClient,
  assertEventuallyTrue,
  getServerAndBot,
  getHookOptions,
  delay,
};
