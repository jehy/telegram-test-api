
'use strict';

const
  requestPromise = require('request-promise'),
  Promise        = require('bluebird');
/**
 *
 * @param {string}url API url
 * @param {string}botToken bot which needs to receive your message
 * @param {object}[options]
 * @constructor
 */
class TelegramClient {
  constructor(url, botToken, options = {}) {
    this.userId = options.userId || 1;
    this.timeout = options.timeout || 1000;
    this.interval = options.interval || 100;
    this.chatId = options.chatId || 1;
    this.firstName = options.firstName || 'TestName';
    this.userName = options.userName || 'testUserName';
    this.type = options.type || 'private';
    if (url === undefined) {
      throw new Error('Please define telegram api URL');
    }
    if (botToken === undefined) {
      throw new Error('Please define bot token');
    }
    this.url = url;
    this.botToken = botToken;
  }

  /**
   *
   * @param {string} messageText
   * @param {object} options
   * @return {{update_id: int, message: {message_id: int, from: {id: number,
 * first_name: string, username: string}, chat: {id: number,
 * first_name: string, username: string, type: string}, date: number, text: string}}}
   */
  makeMessage(messageText, options = {}) {
    const myOptions = options;
    myOptions.date = options.date || (Math.floor(Date.now() / 1000));
    return {
      botToken: this.botToken,
      from: {id: this.userId, first_name: this.firstName, username: this.userName},
      chat: {
        id: this.chatId,
        first_name: this.firstName,
        username: this.userName,
        type: this.type,
      },
      date: myOptions.date,
      text: messageText,
    };
  }

  sendMessage(message) {
    const options = {
      uri: `${this.url}/sendMessage`,
      method: 'POST',
      json: message,
    };
    return requestPromise(options);
  }

  getUpdates() {
    const self = this;
    const message = {token: this.botToken};
    const options = {
      uri: `${this.url}/getUpdates`,
      method: 'POST',
      json: message,
    };
    return requestPromise(options)
      .then((update)=> {
        if (update.result !== undefined && update.result.length >= 1) {
          return Promise.resolve(update);
        }
        return Promise.delay(this.interval)
          .then(()=>self.getUpdates());
      })
      .timeout(this.timeout, `did not get new updates in ${this.timeout} ms`);
  }
}


module.exports = TelegramClient;
