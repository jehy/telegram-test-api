/* eslint-disable sonarjs/no-duplicate-string */

'use strict';

const Debug = require('debug');
const {assert} = require('chai');
const {getServerAndClient, assertEventuallyTrue, delay} = require('./utils');
const {
  TelegramBotEx, TestBot, DeleterBot, CallbackQBot, Logger,
} = require('./testBots');

const debug = Debug('TelegramServer:test');

describe('Telegram Server', () => {
  const token = 'sampleToken';

  it('should receive user`s messages', async () => {
    const {server, client} = await getServerAndClient(token);
    const message = client.makeMessage('/start');
    const res = await client.sendMessage(message);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user messages to bot', async () => {
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token);
    const cb = client.makeCallbackQuery('somedata');
    const res = await client.sendCallback(cb);
    await server.stop();
    assert.equal(true, res.ok);
  });

  it('should provide user`s callbacks to bot', async () => {
    const {server, client} = await getServerAndClient(token);
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
    const {server, client} = await getServerAndClient(token, {storeTimeout: 1});
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
});
