/* eslint-disable sonarjs/no-duplicate-string */

import debug from 'debug';
import { assert } from 'chai';
import TelegramBot from 'node-telegram-bot-api';
import { getServerAndClient, assertEventuallyTrue, delay } from './utils';
import {
  TelegramBotEx,
  TestBot,
  DeleterBot,
  CallbackQBot,
  Logger,
} from './testBots';

const debugTest = debug('TelegramServer:test');

describe('Telegram Server', () => {
  const token = 'sampleToken';

  it('should receive user`s messages', async () => {
    const { server, client } = await getServerAndClient(token);
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user messages to bot', async () => {
    const { server, client } = await getServerAndClient(token);
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new TelegramBotEx(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await server.stop();
    assert.equal('/start', res2.text);
  });

  it('should receive bot`s messages', async () => {
    const { server, client } = await getServerAndClient(token);
    const message = client.makeMessage('/start');
    const botWaiter = server.waitBotMessage();
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new TelegramBotEx(token, botOptions);
    // @ts-expect-error TS6133: 'unusedTestBot' is declared but its value is never read.
    const unusedTestBot = new TestBot(telegramBot);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('/start', res2.text);
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await botWaiter; // wait until bot reply appears in storage
    Logger.botMessages(server.storage);
    assert.equal(
      1,
      server.storage.botMessages.length,
      'Message queue should contain one message!',
    );
    await server.stop();
  });

  it('should provide bot`s messages to client', async () => {
    const { server, client } = await getServerAndClient(token);
    const message = client.makeMessage('/start');
    const botWaiter = server.waitBotMessage();
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new TelegramBotEx(token, botOptions);
    // @ts-expect-error TS6133: 'unusedTestBot' is declared but its value is never read.
    const unusedTestBot = new TestBot(telegramBot);
    const res2 = await telegramBot.waitForReceiveUpdate();
    assert.equal('/start', res2.text);
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await botWaiter;
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(
      1,
      updates.result.length,
      'Updates queue should contain one message!',
    );
    await server.stop();
  });

  it('should fully implement user-bot interaction', async () => {
    const { server, client } = await getServerAndClient(token);
    let message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new TelegramBotEx(token, botOptions);
    // @ts-expect-error TS6133: 'unusedTestBot' is declared but its value is never read.
    const unusedTestBot = new TestBot(telegramBot);
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(
      1,
      updates.result.length,
      'Updates queue should contain one message!',
    );
    const { keyboard } = JSON.parse(updates.result[0].message.reply_markup!);
    message = client.makeMessage(keyboard[0][0].text);
    await client.sendMessage(message);
    const updates2 = await client.getUpdates();
    Logger.serverUpdate(updates2.result);
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await server.stop();
    assert.equal(
      1,
      updates2.result.length,
      'Updates queue should contain one message!',
    );
    assert.equal(
      'Hello, Masha!',
      updates2.result[0].message.text,
      'Wrong greeting message!',
    );
  });

  it('should get updates only for respective client', async () => {
    const { server, client } = await getServerAndClient(token);
    const botOptions = {polling: true, baseApiUrl: server.config.apiURL};
    const telegramBot = new TelegramBotEx(token, botOptions);
    const unusedTestBot = new TestBot(telegramBot);
    const client2 = server.getClient(token, {chatId: 2, firstName: 'Second User'});
    await client.sendMessage(client.makeMessage('/start'));
    await client2.sendMessage(client2.makeMessage('/start'));
    const updates = await client.getUpdates();
    const updates2 = await client2.getUpdates();
    assert.equal(updates.result.length, 1);
    assert.equal(updates2.result.length, 1);
    await telegramBot.stopPolling();
    await server.stop();
  });

  it('should get updates history', async () => {
    const { server, client } = await getServerAndClient(token);
    let message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new TelegramBotEx(token, botOptions);
    // @ts-expect-error TS6133: 'unusedTestBot' is declared but its value is never read.
    const unusedTestBot = new TestBot(telegramBot);
    const updates = await client.getUpdates();
    Logger.serverUpdate(updates.result);
    assert.equal(
      1,
      updates.result.length,
      'Updates queue should contain one message!',
    );
    const { keyboard } = JSON.parse(updates.result[0].message.reply_markup!);
    message = client.makeMessage(keyboard[0][0].text);
    await client.sendMessage(message);
    const updates2 = await client.getUpdates();
    Logger.serverUpdate(updates2.result);
    assert.equal(
      1,
      updates2.result.length,
      'Updates queue should contain one message!',
    );
    assert.equal(
      'Hello, Masha!',
      updates2.result[0].message.text,
      'Wrong greeting message!',
    );

    const history = await client.getUpdatesHistory();
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await server.stop();
    assert.equal(history.length, 4);
    history.forEach((item, index) => {
      assert.ok(item.time);
      assert.ok(item.botToken);
      assert.ok('message' in item && item.message);
      assert.ok(item.updateId);
      assert.ok(item.messageId);
      if (index > 0) {
        assert.isAbove(item.time, history[index - 1].time);
      }
    });
  });

  it('should allow messages deletion', async () => {
    const { server, client } = await getServerAndClient(token);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new DeleterBot(token, botOptions);
    let message = client.makeMessage('delete'); // Should be deleted
    const res = await client.sendMessage(message);
    assert.ok(res.ok);
    message = client.makeMessage('keep safe'); // Shouldn't be deleted
    const res2 = await client.sendMessage(message);
    assert.ok(res2.ok);
    await assertEventuallyTrue(
      500,
      'User messages count should become 1',
      () => server.storage.userMessages.length === 1,
    );
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    await server.stop();
  });

  it('should receive user`s callbacks', async () => {
    const { server, client } = await getServerAndClient(token);
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user`s callbacks to bot', async () => {
    const { server, client } = await getServerAndClient(token);
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    assert.equal(true, res.ok);
    const botOptions = { polling: true, baseApiUrl: server.config.apiURL };
    const telegramBot = new CallbackQBot(token, botOptions);
    const res2 = await telegramBot.waitForReceiveUpdate();
    debugTest('Stopping polling');
    await telegramBot.stopPolling();
    debugTest('Polling stopped');
    await server.stop();
    assert.equal('somedata', res2.data);
  });

  it('should handle message editing', async () => {
    const { server, client } = await getServerAndClient(token);
    const bot = new TelegramBot(token, {baseApiUrl: server.config.apiURL, polling: true});
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.from!.id;
      bot.sendMessage(chatId, 'Greetings');
    });
    bot.on('callback_query', (query) => {
      if (query.data === 'edit') {
        bot.editMessageText(
          'Edited',
          {chat_id: query.message!.chat.id, message_id: query.message!.message_id},
        );
      }
    });
    await client.sendCommand(client.makeCommand('/start'));
    const startUpdates = await client.getUpdates();
    const botReply = startUpdates.result[0];
    assert.exists(botReply);
    assert.equal(botReply.message.text, 'Greetings');

    const cb = client.makeCallbackQuery('edit', {message: {message_id: botReply.messageId}});
    await client.sendCallback(cb);
    await server.waitBotEdits();
    const allUpdates = await client.getUpdatesHistory();
    const targetUpdte = allUpdates.find((update) => update.messageId === botReply.messageId);
    assert.equal(targetUpdte && 'message' in targetUpdte && targetUpdte.message.text, 'Edited');
    await bot.stopPolling();
    await server.stop();
  });

  it('should remove messages on storeTimeout', async () => {
    const { server, client } = await getServerAndClient(token, {
      storeTimeout: 1,
    });
    const message = client.makeMessage('/start');
    await client.sendMessage(message);
    assert.equal(server.storage.userMessages.length, 1);
    debugTest('equal 1 ok');
    await delay(2100);
    debugTest('waited for delay');
    debugTest('server.storage.userMessages', server.storage.userMessages);
    assert.equal(server.storage.userMessages.length, 0);
    await server.stop();
  });
});
