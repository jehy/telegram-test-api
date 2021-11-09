# Telegram Test Api

[![npm](https://img.shields.io/npm/v/telegram-test-api.svg)](https://npm.im/telegram-test-api)
[![license](https://img.shields.io/npm/l/telegram-test-api.svg)](https://npm.im/telegram-test-api)
[![Build](https://github.com/jehy/telegram-test-api/workflows/Build/badge.svg)](https://github.com/jehy/telegram-test-api/actions/workflows/main.yml)
[![Coverage Status](https://coveralls.io/repos/github/jehy/telegram-test-api/badge.svg?branch=master)](https://coveralls.io/github/jehy/telegram-test-api?branch=master)
[![dependencies Status](https://david-dm.org/jehy/telegram-test-api/status.svg)](https://david-dm.org/jehy/telegram-test-api)
[![devDependencies Status](https://david-dm.org/jehy/telegram-test-api/dev-status.svg)](https://david-dm.org/jehy/telegram-test-api?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/jehy/telegram-test-api/badge.svg)](https://snyk.io/test/github/jehy/telegram-test-api)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/jehyrus)

This is telegram's web server emulator.

It is designed for testing telegram bots without using actual telegram server.

You can either include it your Node.JS test code or start api separately as a service.

Client requests to API can be made via special client, received from code, or via special api (not compatible with telegram client api).

## Using as a separate service

1. `git clone https://github.com/jehy/telegram-test-api.git && cd telegram-test-api`
2. `cp config/config.sample.json config/config.json` and edit `config/config.json` if you need
3. run `npm start` to start server
3. Take a look at `src/modules/telegramClient` to emulate a client in any 
language you want via simple HTTP API.
4. use standard telegram API with your own server URL to test bots.

## Using as built in module for nodejs

### 1. Installation

```bash
npm install telegram-test-api
```
### 2. Make some kind of bot that you wanna test
```js
class TestBot {
  constructor(bot) {
    bot.onText(/\/ping/, (msg, match)=> {
      let chatId = msg.from.id;
      let opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'ok 1'}]],
        }),
      };
      bot.sendMessage(chatId, 'pong', opts);
    });
  }
}
```

### 3. Start server emulator

```js
  const TelegramServer = require('telegram-test-api');
  let serverConfig = {port: 9000};
  let server = new TelegramServer(serverConfig);
  await server.start();
```

#### Emulator options

You can pass options like this:
```js
const serverConfig = {
  "port": 9000,
  "host": "localhost",
  "storage": "RAM",
  "storeTimeout": 60
};

let server = new TelegramServer(serverConfig);
```
options:
* `port`, `host` - pretty self descriptive.
* `storeTimeout` - how many seconds you want to store user and bot messages which were not fetched
by bot or client.
* `storage` - where you want to store messages. Right now, only `RAM` option is implemented.

### 4. Make requests

#### Requests from bot

You can use any bot API which allows custom Telegram URL like this
(example for `node-telegram-bot-api`):
```js
const 
  TelegramBot    = require('node-telegram-bot-api');

  let botOptions = {polling: true, baseApiUrl: server.ApiURL};
  telegramBot = new TelegramBot(token, botOptions);
```
Just set api url to your local instance url - and all done!

#### Requests from client

Client emulation is very easy. You can use built in client class:
```js
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    client.sendMessage(message);
    client.getUpdates();
```

Or you can take a look at `src/modules/telegramClient` and make client in any 
language you want via simple HTTP API.

### 5. Stop server

```js
await server.stop();
```

### Full sample

Your test code can look like this:
```js
const TelegramServer = require('telegram-test-api');
const TelegramBot = require('node-telegram-bot-api');

describe('Telegram bot test', () => {
  let serverConfig = {port: 9001};
  const token = 'sampleToken';
  let server;
  let client;
  beforeEach(() => {
    server = new TelegramServer(serverConfig);
    return server.start().then(() => {
      client = server.getClient(token);
    });
  });

  afterEach(function () {
    this.slow(2000);
    this.timeout(10000);
    return server.stop();
  });

  it('should greet Masha and Sasha', async function testFull() {
    this.slow(400);
    this.timeout(800);
    const message = client.makeMessage('/start');
    await client.sendMessage(message);
    const botOptions = {polling: true, baseApiUrl: server.ApiURL};
    const telegramBot = new TelegramBot(token, botOptions);
    const testBot = new TestBot(telegramBot);
    const updates = await client.getUpdates();
    console.log(`Client received messages: ${JSON.stringify(updates.result)}`);
    if (updates.result.length !== 1) {
      throw new Error('updates queue should contain one message!');
    }
    let keyboard = JSON.parse(updates.result[0].message.reply_markup).keyboard;
    const message2 = client.makeMessage(keyboard[0][0].text);
    await client.sendMessage(message2);
    const updates2 = await client.getUpdates();
    console.log(`Client received messages: ${JSON.stringify(updates2.result)}`);
    if (updates2.result.length !== 1) {
      throw new Error('updates queue should contain one message!');
    }
    if (updates2.result[0].message.text !== 'Hello, Masha!') {
      throw new Error('Wrong greeting message!');
    }
    return true;
  });
});
```
