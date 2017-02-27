/* eslint-disable no-console*/
/* eslint-disable prefer-const*/

const
  TelegramServer = require('../telegramServer'),
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
          keyboard: [[{text: 'ok 1'}]],
        }),
      };
      bot.sendMessage(chatId, 'started', opts);
    });

    bot.onText(/whoami/, (msg, match)=> {
      let chatId = msg.from.id;
      let opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
          keyboard: [[{text: 'ok 2'}]],
        }),
      };
      bot.sendMessage(chatId, 'test', opts);
    });
  }
}


TelegramBot.prototype.waitForReceiveUpdate = function () {
  const self = this;
  return new Promise((resolve)=> {
    self.on('message', (msg)=> {
      console.log(colors.blue(`Bot received update from server: ${JSON.stringify(msg)}`));
      resolve(msg);
    });
  });
};

describe('Telegram Server', function () {
  let serverConfig = {port: 9000};
  it('should receive user`s messages', ()=> {
    this.slow(200);
    this.timeout(1000);
    let server = new TelegramServer(serverConfig);
    let client = server.getClient('sampleToken');
    let message = client.makeMessage('/start');
    return server.start()
      .then(()=>client.sendMessage(message))
      .then(()=> server.stop());
  });

  it('should provide user messages to bot', function () {
    this.slow(200);
    this.timeout(1000);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    let client = server.getClient('sampleToken');
    let message = client.makeMessage('/start');
    let telegramBot;
    return server.start()
      .then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot('sampleToken', botOptions);
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

  it('should receive bot`s messages', function () {
    this.slow(400);
    this.timeout(2000);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    // let testUrl = `http://localhost:${serverConfig.port}`;
    let client = server.getClient('sampleToken');
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    let botWaiter = server.WaitBotMessage();
    return server.start().then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot('sampleToken', botOptions);
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
      .then(()=> {
        return true; // server.stop(); TODO: somehow express in not stoppable here...
      });
  });


  it('should provide bot`s messages to client', function () {
    this.slow(400);
    this.timeout(2000);
    serverConfig.port++;
    let server = new TelegramServer(serverConfig);
    // let testUrl = `http://localhost:${serverConfig.port}`;
    let client = server.getClient('sampleToken');
    let message = client.makeMessage('/start');
    let telegramBot,
        testBot;
    let botWaiter = server.WaitBotMessage();
    return server.start().then(()=> client.sendMessage(message))
      .then(()=> {
        let botOptions = {polling: true, baseApiUrl: server.ApiURL};
        telegramBot = new TelegramBot('sampleToken', botOptions);
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
      .then(()=> {
        return true; // server.stop(); TODO: somehow express in not stoppable here...
      });
  });

});
