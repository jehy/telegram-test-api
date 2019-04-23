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
      bot.hears('/start', ctx => ctx.reply('Hi!'));
      bot.startPolling();
    });
  });

  afterEach(() => server.stop());

  it('should return help content', async () => {
    const client = server.getClient(token, { timeout: 5000 });
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(res.ok, true);
    const updates = await client.getUpdates();
    assert.equal(updates.ok, true);
    assert.equal(updates.result.length, 1, 'updates queue should contain one message!');
  });
});
