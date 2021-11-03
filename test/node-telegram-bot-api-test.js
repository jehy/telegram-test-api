/* eslint-disable sonarjs/no-duplicate-string */

'use strict';

const TelegramBot = require('node-telegram-bot-api');
const Debug = require('debug');
const Promise = require('bluebird');
const {assert} = require('chai');
const TelegramServer = require('../telegramServer');

const debug = Debug('TelegramServer:test');
const debugServerUpdate = Debug('TelegramServer:test:serverUpdate');
const debugBotMessage = Debug('TelegramServer:test:botMessage');

class Logger {
  static serverUpdate(...args) {
    debugServerUpdate(JSON.stringify(args));
  }

  static botMessages(...args) {
    debugBotMessage(JSON.stringify(args));
  }
}

class TestBot {
  constructor(bot) {
    bot.onText(/\/ping/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'ok 1'}]],
        }),
      };
      bot.sendMessage(chatId, 'pong', opts);
    });

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Masha'}, {text: 'Sasha'}]],
        }),
      };
      bot.sendMessage(chatId, 'What is your name?', opts);
    });

    bot.onText(/Masha/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Masha!', opts);
    });

    bot.onText(/Sasha/, (msg) => {
      const chatId = msg.from.id;
      const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Sasha!', opts);
    });
  }
}

class TelegramBotEx extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise((resolve) => {
      this.on('message', (msg) => {
        Logger.serverUpdate(msg);
        resolve(msg);
      });
    });
  }
}

class CallbackQBot extends TelegramBot {
  waitForReceiveUpdate() {
    return new Promise((resolve) => {
      this.on('callback_query', (cb) => {
        Logger.serverUpdate(cb);
        resolve(cb);
      });
    });
  }
}

class DeleterBot extends TelegramBot {
  constructor(...args) {
    super(...args);
    this.onText(/delete/, (msg, unusedMatch) => {
      const chatId = msg.chat.id;
      this.deleteMessage(chatId, msg.message_id);
    });
  }
}

async function assertEventuallyTrue(timeoutDuration, message, func) {
  if (func()) {
    return true;
  }
  return Promise.delay(10)
    .then(() => assertEventuallyTrue(timeoutDuration, message, func))
    .timeout(timeoutDuration, message);
}

describe('Telegram Server', () => {
  const serverConfig = {port: 9001};
  const token = 'sampleToken';
  let server;
  let client;
  beforeEach(async () => {
    server = new TelegramServer(serverConfig);
    await server.start();
    client = server.getClient(token);
  });

  afterEach(async function () {
    this.slow(2000);
    this.timeout(10000);
    // eslint-disable-next-line no-console
    console.log('\n\n');
    await server.stop();
  });

  it('should receive user`s messages', async function sendClientMessages() {
    this.slow(200);
    this.timeout(1000);
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
  });

  it('should provide user messages to bot', async function testGetUserMessages() {
    this.slow(200);
    this.timeout(1000);
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('/start', res2.text);
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
  });

  it('should receive bot`s messages', async function testBotReceiveMessages() {
    this.slow(200);
    this.timeout(10000);
    const message = client.makeMessage('/start');
    const botWaiter = server.waitBotMessage();
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const unusedTestBot = new TestBot(telegramBot);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('/start', res2.text);
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await botWaiter; // wait until bot reply appears in storage
    Logger.botMessages(server.storage);
    assert.equal(1, server.storage.botMessages.length, 'Message queue should contain one message!');
  });

  it('should provide bot`s messages to client', async function testClientGetUpdates() {
    this.slow(200);
    this.timeout(1000);
    const message = client.makeMessage('/start');
    const botWaiter = server.waitBotMessage();
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const unusedTestBot = new TestBot(telegramBot);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('/start', res2.text);
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await botWaiter;
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(1, updates.result.length, 'Updates queue should contain one message!');
  });

  it('should fully implement user-bot interaction', async function testFull() {
    this.slow(400);
    this.timeout(1000);
    let message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const unusedTestBot = new TestBot(telegramBot);
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(1, updates.result.length, 'Updates queue should contain one message!');
    const {keyboard} = JSON.parse(updates.result[0].message.reply_markup);
    message = client.makeMessage(keyboard[0][0].text);
    await client.sendMessage(message);
    const updates2 = await client.getUpdates();
    Logger.serverUpdate(updates2.result);
    assert.equal(1, updates2.result.length, 'Updates queue should contain one message!');
    assert.equal('Hello, Masha!', updates2.result[0].message.text, 'Wrong greeting message!');
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
  });

  it('should get updates history', async function testUpdatesHistory() {
    this.slow(400);
    this.timeout(1000);
    let message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const unusedTestBot = new TestBot(telegramBot);
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(1, updates.result.length, 'Updates queue should contain one message!');
    const {keyboard} = JSON.parse(updates.result[0].message.reply_markup);
    message = client.makeMessage(keyboard[0][0].text);
    await client.sendMessage(message);
    const updates2 = await client.getUpdates();
    Logger.serverUpdate(updates2.result);
    assert.equal(1, updates2.result.length, 'Updates queue should contain one message!');
    assert.equal('Hello, Masha!', updates2.result[0].message.text, 'Wrong greeting message!');

    const history = await client.getUpdatesHistory();
    assert.equal(history.length, 4);
    history.forEach((item, index)=>{
      assert.ok(item.time);
      assert.ok(item.botToken);
      assert.ok(item.message);
      assert.ok(item.updateId);
      assert.ok(item.messageId);
      if (index > 0) {
        assert.isAbove(item.time, history[index - 1].time);
      }
    });
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
  });

  it('should allow messages deletion', async function () {
    this.slow(400);
    this.timeout(1000);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const unusedTelegramBot = new DeleterBot(token, botOptions);
    let message = client.makeMessage('delete'); // Should be deleted
    const res = await client.sendMessage(message);
    assert.ok(res.ok);
    message = client.makeMessage('keep safe'); // Shouldn't be deleted
    const res2 = await client.sendMessage(message);
    assert.ok(res2.ok);
    return assertEventuallyTrue(500, 'User messages count should become 1', () => (
      server.storage.userMessages.length === 1
    ));
  });

  it('should receive user`s callbacks', async function () {
    this.slow(200);
    this.timeout(1000);
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    assert.equal(true, res.ok);
  });

  it('should provide user`s callbacks to bot', async function () {
    this.slow(200);
    this.timeout(1000);
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new CallbackQBot(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('somedata', res2.data);
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
  });

  it('should remove messages on storeTimeout', async function () {
    this.slow(2100);
    this.timeout(3000);

    // need non standard server configuration
    await server.stop();
    server = new TelegramServer({...serverConfig, storeTimeout: 1});
    await server.start();
    client = server.getClient(token);
    const message = client.makeMessage('/start');
    await client.sendMessage(message);
    assert.equal(server.storage.userMessages.length, 1);
    debug('equal 1 ok');
    await Promise.delay(2100);
    debug('waited for delay');
    debug('server.storage.userMessages', server.storage.userMessages);
    assert.equal(server.storage.userMessages.length, 0);
  });

  it('should not store user`s messages when webhook is set', async function () {
    this.slow(200);
    this.timeout(1000);
    server.setWebhook({url: '<invalid webhook url>'}, token);
    let message = client.makeMessage('/start');
    let res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    assert.equal(0, server.storage.userMessages.length, 'Message queue should not have any messages');

    server.deleteWebhook(token);
    message = client.makeMessage('/start');
    res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    assert.equal(1, server.storage.userMessages.length, 'Message queue should have 1 message');
  });
});
