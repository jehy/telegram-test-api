# Telegram Test Api

[![npm](https://img.shields.io/npm/v/telegram-test-api.svg)](https://npm.im/telegram-test-api)
[![license](https://img.shields.io/npm/l/telegram-test-api.svg)](https://npm.im/telegram-test-api)
[![Build Status](https://travis-ci.org/jehy/telegram-test-api.svg?branch=master)](https://travis-ci.org/jehy/telegram-test-api)
[![Coverage Status](https://coveralls.io/repos/github/jehy/telegram-test-api/badge.svg?branch=master)](https://coveralls.io/github/jehy/telegram-test-api?branch=master)
[![dependencies Status](https://david-dm.org/jehy/telegram-test-api/status.svg)](https://david-dm.org/jehy/telegram-test-api)
[![devDependencies Status](https://david-dm.org/jehy/telegram-test-api/dev-status.svg)](https://david-dm.org/jehy/telegram-test-api?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/jehy/telegram-test-api/badge.svg)](https://snyk.io/test/github/jehy/telegram-test-api)

This is telegram's web server emulator.

It is designed for testing telegram bots without using actual telegram server.

You can either include it your Node.JS test code or start api separately.

## Installation

```bash
npm install telegram-test-api
```

## Usage

### 1. Implement bot with any logic and any library
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

    bot.onText(/\/start/, (msg, match)=> {
      let chatId = msg.from.id;
      let opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Masha'}, {text: 'Sasha'}]],
        }),
      };
      bot.sendMessage(chatId, 'What is your name?', opts);
    });

    bot.onText(/Masha/, (msg, match)=> {
      let chatId = msg.from.id;
      let opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Masha!', opts);
    });

    bot.onText(/Sasha/, (msg, match)=> {
      let chatId = msg.from.id;
      let opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'Hello!'}]],
        }),
      };
      bot.sendMessage(chatId, 'Hello, Sasha!', opts);
    });
  }
}
```

### 2. Start server emulator

You can use `npm start` to start server using settings from `config/config.json`
or include it in your node.js module and use like this:
```js
  const TelegramServer = require('telegram-test-api');
  let serverConfig = {port: 9000};
  let server = new TelegramServer(serverConfig);
  server.start().then(()=>yourTests());
```

#### Emulator options

You can pass options like this:
```json
{
  "port": 9000,
  "host": "localhost",
  "storage": "RAM",
  "storeTimeout": 60
}
```
* `storeTimeout` - how many seconds you want to store user and bot messages which were not fetched
by bot or client.
* `storage` - where you want to store messages. Right now, only `RAM` option is implemented.

### 3. Make requests

#### Requests from bot

You can use any bot API which allows custom Telegram URL like this:
```
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

### 4. Stop server

```js
server.stop().then(()=>doMore());
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

  it('should greet Masha and Sasha', function testFull() {
    this.slow(400);
    this.timeout(800);
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    return client.sendMessage(message)
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot(token, botOptions);
        testBot = new TestBot(telegramBot);
        return client.getUpdates();
      })
      .then((updates)=> {
        console.log(`Client received messages: ${JSON.stringify(updates.result)}`);
        if (updates.result.length !== 1) {
          throw new Error('updates queue should contain one message!');
        }
        let keyboard = JSON.parse(updates.result[0].message.reply_markup).keyboard;
        message = client.makeMessage(keyboard[0][0].text);
        client.sendMessage(message);
        return client.getUpdates();
      })
      .then((updates)=> {
        console.log(`Client received messages: ${JSON.stringify(updates.result)}`);
        if (updates.result.length !== 1) {
          throw new Error('updates queue should contain one message!');
        }
        if (updates.result[0].message.text !== 'Hello, Masha!') {
          throw new Error('Wrong greeting message!');
        }
        return true;
      })
  });
});
```
### Debugging

This project uses `debug` module for verbose logging, to enable it, please launch
your tests with env variable `DEBUG=TelegramServer:*`, like `DEBUG=TelegramServer:* ./node_modules/mocha/bin/mocha --use_strict --exit`.
