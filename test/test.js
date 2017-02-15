'use strict';
var
  TelegramServer = require('../telegramServer'),
  TelegramClient = require('../modules/telegramClient'),

 Promise      = require('bluebird');
 /*TelegramBot  = require('node-telegram-bot-api'),
 telegramBot  = new TelegramBot("sample token", {});


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
 };*/


describe('Telegram Server', function () {
  //let myBot = new TestBot(telegramBot);
  //let testChat = 0;
  var serverConfig = {port: 9000};
  it('should receive a message', function () {
    var server = new TelegramServer(serverConfig);
    var client = new TelegramClient('http://localhost:' + serverConfig.port, 'testToken');
    var message = client.makeMessage("/start");
    return server.start().then(()=> {
      return client.sendMessage(message);
    })
  });

});