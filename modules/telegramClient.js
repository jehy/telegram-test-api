"use strict";
const requestPromise = require('request-promise');
/**
 *
 * @param {string}url API url
 * @param {string}botToken bot which needs to receive your message
 * @param {object}[options]
 * @constructor
 */
var TelegramClient = function (url, botToken, options = {}) {
  this.userId = options.userId || 1;
  this.chatId = options.chatId || 1;
  this.firstName = options.firstName || 'TestName';
  this.userName = options.userName || 'testUserName';
  this.type = options.type || 'private';
  this.url = url;
  this.botToken = botToken;
};

/**
 *
 * @param {string} messageText
 * @param {object} options
 * @return {{update_id: int, message: {message_id: int, from: {id: number,
 * first_name: string, username: string}, chat: {id: number,
 * first_name: string, username: string, type: string}, date: number, text: string}}}
 */
TelegramClient.prototype.makeMessage = function (messageText, options = {}) {
  options.date = options.date || (Math.floor(Date.now() / 1000));
  return {
    botToken: this.botToken,
    from: {id: this.userId, first_name: this.firstName, username: this.userName},
    chat: {
      id: this.chatId,
      first_name: this.firstName,
      username: this.userName,
      type: this.type
    },
    date: options.date,
    text: messageText
  }
};


TelegramClient.prototype.sendMessage = function (message) {
  var options = {
    uri: this.url + '/sendMessage',
    method: 'POST',
    json: message
  };
  return requestPromise(options);
};

module.exports = TelegramClient;