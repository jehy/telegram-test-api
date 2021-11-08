/* eslint-disable sonarjs/no-duplicate-string */

'use strict';

const TelegramBot = require('node-telegram-bot-api');
const Debug = require('debug');
const {assert} = require('chai');
const {promisify} = require('util');
const TelegramServer = require('../telegramServer');

const delay = promisify(setTimeout);

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

describe('Telegram Server', () => {
  let serverPort = 9001;
  const token = 'sampleToken';

  async function getConnection(serverOptions = {}) {
    serverPort++;
    const serverConfig = {port: serverPort};
    const server = new TelegramServer({...serverConfig, ...serverOptions});
    await server.start();
    return { client: server.getClient(token), server };
  }

  it('should receive user`s messages', async () => {
    const {server, client} = await getConnection();
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user messages to bot', async () => {
    const {server, client} = await getConnection();
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await server.stop();
    assert.equal('/start', res2.text);
  });

  it('should receive bot`s messages', async () => {
    const {server, client} = await getConnection();
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
    await server.stop();
  });

  it('should provide bot`s messages to client', async () => {
    const {server, client} = await getConnection();
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
    await server.stop();
  });

  it('should fully implement user-bot interaction', async () => {
    const {server, client} = await getConnection();
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
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await server.stop();
    assert.equal(1, updates2.result.length, 'Updates queue should contain one message!');
    assert.equal('Hello, Masha!', updates2.result[0].message.text, 'Wrong greeting message!');
  });

  it('should get updates history', async () => {
    const {server, client} = await getConnection();
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
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await server.stop();
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
  });

  it('should allow messages deletion', async () => {
    const {server, client} = await getConnection();
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new DeleterBot(token, botOptions);
    let message = client.makeMessage('delete'); // Should be deleted
    const res = await client.sendMessage(message);
    assert.ok(res.ok);
    message = client.makeMessage('keep safe'); // Shouldn't be deleted
    const res2 = await client.sendMessage(message);
    assert.ok(res2.ok);
    await assertEventuallyTrue(500, 'User messages count should become 1', () => (
      server.storage.userMessages.length === 1
    ));
    debug('Stopping polling');
    await telegramBot.stopPolling();
    await server.stop();
  });

  it('should receive user`s callbacks', async () => {
    const {server, client} = await getConnection();
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user`s callbacks to bot', async () => {
    const {server, client} = await getConnection();
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    assert.equal(true, res.ok);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new CallbackQBot(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    debug('Stopping polling');
    await telegramBot.stopPolling();
    debug('Polling stopped');
    await server.stop();
    assert.equal('somedata', res2.data);
  });

  it('should remove messages on storeTimeout', async () => {
    const {server, client} = await getConnection({storeTimeout: 1});
    const message = client.makeMessage('/start');
    await client.sendMessage(message);
    assert.equal(server.storage.userMessages.length, 1);
    debug('equal 1 ok');
    await delay(2100);
    debug('waited for delay');
    debug('server.storage.userMessages', server.storage.userMessages);
    assert.equal(server.storage.userMessages.length, 0);
    await server.stop();
  });

  describe('Webhook handling', () => {
    let hookPort = 10001;
    function getHookOptions() {
      hookPort++;
      const hookedBotOptions = {polling: false, webHook: {host: 'localhost', port: hookPort }};
      const hookUrl = `http://localhost:${hookedBotOptions.webHook.port}/bot${token}`;
      return {hookedBotOptions, hookUrl};
    }

    it('should not store user`s messages when webhook is set', async () => {
      const {server, client} = await getConnection();
      const {hookUrl, hookedBotOptions} = getHookOptions();
      const bot = new TelegramBotEx(token, {...hookedBotOptions, baseApiUrl: server.ApiURL});
      await bot.setWebHook(hookUrl);
      server.setWebhook({url: hookUrl}, token);
      let message = client.makeMessage('/start');
      let res = await client.sendMessage(message);
      assert.equal(true, res.ok);
      assert.equal(0, server.storage.userMessages.length, 'Message queue should not have any messages');

      server.deleteWebhook(token);
      message = client.makeMessage('/start');
      res = await client.sendMessage(message);
      await bot.closeWebHook();
      assert.equal(true, res.ok);
      assert.equal(1, server.storage.userMessages.length, 'Message queue should have 1 message');
      await server.stop();
    });

    it('should run webhook on user\'s message', async () => {
      const {server, client} = await getConnection();
      const {hookUrl, hookedBotOptions} = getHookOptions();
      const bot = new TelegramBotEx(token, {...hookedBotOptions, baseApiUrl: server.ApiURL});
      await bot.setWebHook(hookUrl);
      const text = `foo-${Math.random()}`;
      const message = client.makeMessage(text);
      await client.sendMessage(message);
      const update = await bot.waitForReceiveUpdate();
      await bot.closeWebHook();
      await server.stop();
      assert.ok(update);
      assert.equal(text, update.text, 'Must receive the message that was just sent');
    });

    it('should run webhook on user\'s command', async () => {
      const {server, client} = await getConnection();
      const {hookUrl, hookedBotOptions} = getHookOptions();
      const bot = new TelegramBotEx(token, {...hookedBotOptions, baseApiUrl: server.ApiURL});
      await bot.setWebHook(hookUrl);
      const text = `/foo-${Math.random()}`;
      const message = client.makeCommand(text);
      await client.sendCommand(message);
      const update = await bot.waitForReceiveUpdate();
      await bot.closeWebHook();
      await server.stop();
      assert.ok(update);
      assert.equal(text, update.text, 'Must recieve the command that was just sent');
    });

    it('should run webhook on user\'s callback query', async () => {
      const {server, client} = await getConnection();
      const {hookUrl, hookedBotOptions} = getHookOptions();
      const bot = new CallbackQBot(token, {...hookedBotOptions, baseApiUrl: server.ApiURL});
      await bot.setWebHook(hookUrl);

      const text = `foo-${Math.random()}`;
      const cb = client.makeCallbackQuery(text);
      await client.sendCallback(cb);
      const update = await bot.waitForReceiveUpdate();

      await bot.closeWebHook();
      await server.stop();
      assert.ok(update);
      assert.equal(text, update.data, 'Must recieve the data that was just sent');
    });
  });
});
