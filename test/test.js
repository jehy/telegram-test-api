/* eslint-disable no-console*/
/* eslint-disable prefer-const*/

const
  TelegramServer = require('../src/telegramServer'),
  TelegramBot    = require('node-telegram-bot-api'),
  colors         = require('colors/safe'),
  Promise        = require('bluebird');


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


TelegramBot.prototype.waitForReceiveUpdate = function waitForReceiveUpdate() {
  const self = this;
  return new Promise((resolve)=> {
    self.on('message', (msg)=> {
      console.log(colors.blue(`Bot received update from server: ${JSON.stringify(msg)}`));
      resolve(msg);
    });
  });
};

describe('Telegram Server', ()=> {
  let serverConfig = {port: 9000};
  it('should receive user`s messages', function sendClientMessages() {
    this.slow(200);
    this.timeout(400);
    let token = 'sampleToken';
    let server = new TelegramServer(serverConfig);
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    return server.start()
      .then(()=>client.sendMessage(message))
      .then(()=> server.stop());
  });

  it('should provide user messages to bot', function testGetUserMessages() {
    this.slow(200);
    this.timeout(400);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    let token = 'sampleToken';
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    let telegramBot;
    return server.start()
      .then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot(token, botOptions);
        return telegramBot.waitForReceiveUpdate();
      }).then(()=> {
        console.log(colors.blue('Stopping polling'));
        return telegramBot.stopPolling();
      })
      .then(()=> {
        console.log(colors.blue('Polling stopped'));
        return true; // server.stop();//TODO: somehow express in not stoppable here...
      });
  });

  it('should receive bot`s messages', function testBotReceiveMessages() {
    this.slow(200);
    this.timeout(400);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    let token = 'sampleToken';
    // let testUrl = `http://localhost:${serverConfig.port}`;
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    let botWaiter = server.waitBotMessage();
    return server.start().then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot(token, botOptions);
        testBot = new TestBot(telegramBot);
        return telegramBot.waitForReceiveUpdate();
      }).then(()=> {
        console.log(colors.blue('Stopping polling'));
        return telegramBot.stopPolling();
      })
      .then(()=> {
        console.log(colors.blue('Polling stopped'));
        return botWaiter;
      })// wait until bot reply appears in storage
      .then(()=> {
        console.log(colors.blue(`Bot messages: ${JSON.stringify(server.storage)}`));
        if (server.storage.botMessages.length !== 1) {
          throw new Error('Message queue should contain one message!');
        }
        return true;
      })
      .then(()=> true); // server.stop(); TODO: somehow express in not stoppable here...
  });


  it('should provide bot`s messages to client', function testClientGetUpdates() {
    this.slow(200);
    this.timeout(400);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    let token = 'sampleToken';
    // let testUrl = `http://localhost:${serverConfig.port}`;
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    let botWaiter = server.waitBotMessage();
    return server.start().then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot(token, botOptions);
        testBot = new TestBot(telegramBot);
        return telegramBot.waitForReceiveUpdate();
      }).then(()=> {
        console.log(colors.blue('Stopping polling'));
        return telegramBot.stopPolling();
      })
      .then(()=> {
        console.log(colors.blue('Polling stopped'));
        return botWaiter;
      })// wait until bot reply appears in storage
      .then(()=> client.getUpdates())
      .then((updates)=> {
        console.log(colors.blue(`Client received messages: ${JSON.stringify(updates.result)}`));
        if (updates.result.length !== 1) {
          throw new Error('updates queue should contain one message!');
        }
        return true;
      })
      .then(()=> true); // server.stop(); TODO: somehow express in not stoppable here...
  });


  it('should fully implement user-bot interaction', function testFull() {
    this.slow(400);
    this.timeout(800);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    // let testUrl = `http://localhost:${serverConfig.port}`;
    let token = 'sampleToken';
    let client = server.getClient(token);
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    return server.start()
      .then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot(token, botOptions);
        testBot = new TestBot(telegramBot);
        return client.getUpdates();
      })
      .then((updates)=> {
        console.log(colors.blue(`Client received messages: ${JSON.stringify(updates.result)}`));
        if (updates.result.length !== 1) {
          throw new Error('updates queue should contain one message!');
        }
        let keyboard = JSON.parse(updates.result[0].message.reply_markup).keyboard;
        message = client.makeMessage(keyboard[0][0].text);
        client.sendMessage(message);
        return client.getUpdates();
      })
      .then((updates)=> {
        console.log(colors.blue(`Client received messages: ${JSON.stringify(updates.result)}`));
        if (updates.result.length !== 1) {
          throw new Error('updates queue should contain one message!');
        }
        if (updates.result[0].message.text !== 'Hello, Masha!') {
          throw new Error('Wrong greeting message!');
        }
        return true;
      })
      .then(()=> true); // server.stop(); TODO: somehow express in not stoppable here...
  });

});
