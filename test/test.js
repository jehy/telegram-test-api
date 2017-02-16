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


describe('Telegram Server', function () {
  var serverConfig = {port: 9000};
  it('should receive a message', function () {
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

  it('should receive getUpdates message', function () {
    this.slow(200);
    this.timeout(1000);
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
      return new Promise(function (resolve, reject) {
        telegramBot.on('message', function (msg) {
          console.log(colors.blue('Received update: ' + JSON.stringify(msg)));
          resolve();
        })
      });
    }).then(()=> {
      console.log(colors.blue('Stopping polling'));
      return telegramBot.stopPolling();
    }).then(()=> {
      console.log(colors.blue('Polling stopped'));
      return true;//server.stop();//TODO: somehow express in not stoppable here...
    })
  });

/*
  it('should be able to talk with TestBot', function () {
    this.slow(200);
    this.timeout(1000);
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
      return new Promise(function (resolve, reject) {
        telegramBot.on('message', function (msg) {
          console.log(colors.blue('Received update: ' + JSON.stringify(msg)));
          resolve();
        })
      });
    }).then(()=> {
      console.log(colors.blue('Stopping polling'));
      return telegramBot.stopPolling();
    }).then(()=> {
      console.log(colors.blue('Polling stopped'));
      return true;//server.stop();//TODO: somehow express in not stoppable here...
    })
  });*/

});