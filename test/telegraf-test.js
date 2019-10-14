'use strict';

const Telegraf = require('telegraf');
const {assert} = require('chai');
const TelegramServer = require('../telegramServer');

describe('Telegram bot test', () => {
  const serverConfig = { port: 9001 };
  const token = 'some token';
  let server;
  beforeEach(() => {
    server = new TelegramServer(serverConfig);
    return server.start().then(() => {
      // the options passed to Telegraf in this format will make it try to get messages from the server's local URL
      const bot = new Telegraf(token, { telegram: { apiRoot: server.ApiURL } });
      bot.command('start', (ctx) => ctx.reply('Hi!'));
      bot.on('callback_query', (ctx) => ctx.reply('pong'));
      bot.startPolling();
    });
  });

  afterEach(() => server.stop());

  it('should return help content', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    const command = client.makeCommand('/start');
    const res = await client.sendCommand(command);
    assert.equal(res.ok, true);
    const updates = await client.getUpdates();
    assert.equal(updates.ok, true);
    assert.equal(updates.result.length, 1, 'updates queue should contain one message!');
  });

  it('should respond pong to callback_query', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    const cb = client.makeCallbackQuery('ping');
    const res = await client.sendCallback(cb);
    assert.equal(res.ok, true);
    const updates = await client.getUpdates();
    assert.equal(updates.ok, true);
    assert.equal(updates.result.length, 1, 'updates queue should contain one message!');
    assert.equal(updates.result[0].message.text, 'pong', 'message should be pong!');
  });
});
