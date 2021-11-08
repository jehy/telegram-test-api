'use strict';

const {assert} = require('chai');
const {getServerAndClient, getHookOptions} = require('./utils');
const {TelegramBotEx, CallbackQBot} = require('./testBots');

describe('Webhook handling', () => {
  const token = 'sampleToken';

  it('should not store user`s messages when webhook is set', async () => {
    const {server, client} = await getServerAndClient(token);
    const {hookUrl, hookedBotOptions} = getHookOptions(token);
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
    const {server, client} = await getServerAndClient(token);
    const {hookUrl, hookedBotOptions} = getHookOptions(token);
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
    const {server, client} = await getServerAndClient(token);
    const {hookUrl, hookedBotOptions} = getHookOptions(token);
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
    const {server, client} = await getServerAndClient(token);
    const {hookUrl, hookedBotOptions} = getHookOptions(token);
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
