'use strict';
var
  TelegramServer = require('../telegramServer'),
  TelegramClient = require('../modules/telegramClient'),
  TelegramBot    = require('node-telegram-bot-api'),
  colors         = require('colors/safe'),
  Promise        = require('bluebird');


let TestBot = function (bot) {

  bot.onText(/\/ping/, function (msg, match) {
    let chatId = msg.from.id;
    let opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [[{text: "ok 1"}]]
      })
    };
    bot.sendMessage(chatId, "pong", opts);
  });

  bot.onText(/\/start/, function (msg, match) {
    let chatId = msg.from.id;
    let opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [[{text: "ok 1"}]]
      })
    };
    bot.sendMessage(chatId, "started", opts);
  });

  bot.onText(/whoami/, function (msg, match) {
    let chatId = msg.from.id;
    let opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [[{text: "ok 2"}]]
      })
    };
    bot.sendMessage(chatId, "test", opts);
  });
};

TelegramBot.prototype.waitForReceiveUpdate = function () {
  const self=this;
  return new Promise(function (resolve, reject) {
    self.on('message', function (msg) {
      console.log(colors.blue('Bot received update from server: ' + JSON.stringify(msg)));
      resolve(msg);
    })
  })
};

describe('Telegram Server', function () {
  var serverConfig = {port: 9000};
  xit('should receive user`s messages', function () {
    this.slow(200);
    this.timeout(1000);
    var server = new TelegramServer(serverConfig);
    var client = new TelegramClient('http://localhost:' + serverConfig.port, 'testToken');
    var message = client.makeMessage("/start");
    return server.start().then(()=> {
      return client.sendMessage(message);
    }).then(()=> {
      return server.stop();
    })
  });

  xit('should provide user messages to bot', function () {
    this.slow(200);
    this.timeout(1000);
    serverConfig.port++;
    var server = new TelegramServer(serverConfig);
    var testUrl = 'http://localhost:' + serverConfig.port;
    var client = new TelegramClient(testUrl, 'sampleToken');
    var message = client.makeMessage("/start");
    var telegramBot;
    return server.start().then(()=> {
      return client.sendMessage(message);
    }).then(()=> {
      var botOptions = {polling: true, baseApiUrl: testUrl};
      telegramBot = new TelegramBot("sampleToken", botOptions);
      return telegramBot.waitForReceiveUpdate();
    }).then(()=> {
      console.log(colors.blue('Stopping polling'));
      return telegramBot.stopPolling();
    }).then(()=> {
      console.log(colors.blue('Polling stopped'));
      return true;//server.stop();//TODO: somehow express in not stoppable here...
    })
  });


  it('should receive bot`s messages', function () {
    this.slow(400);
    this.timeout(2000);
    serverConfig.port++;
    var server = new TelegramServer(serverConfig);
    var testUrl = 'http://localhost:' + serverConfig.port;
    var client = new TelegramClient(testUrl, 'sampleToken');
    var message = client.makeMessage("/start");
    var telegramBot, testBot, botWaiter;
    return server.start().then(()=> {
      return client.sendMessage(message);
    }).then(()=> {
      var botOptions = {polling: true, baseApiUrl: testUrl};
      telegramBot = new TelegramBot("sampleToken", botOptions);
      testBot = new TestBot(telegramBot);
      botWaiter = server.WaitBotMessage();
      return telegramBot.waitForReceiveUpdate();
    }).then(()=> {
      console.log(colors.blue('Stopping polling'));
      return telegramBot.stopPolling();
    }).then(()=> {
      return botWaiter;//wait until user reply appears in storage
    }).then(()=> {
      console.log(colors.blue('Bot messages:' + JSON.stringify(server.storage)));
      if (server.storage.botMessages.length != 1)
        throw new Error('Message queue should contain one message!');
      return true;
    }).then(()=> {
      console.log(colors.blue('Polling stopped'));
      return true;//server.stop();//TODO: somehow express in not stoppable here...
    });
  });

});