'use strict';

const request = require('axios');
const merge = require('deep-extend');
const {promisify} = require('util');
const pTimeout = require('p-timeout');

const delay = promisify(setTimeout);
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
    this.chatTitle = options.chatTitle || options.firstName || 'Test Name';
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
   * Builds new message ready for sending with `sendMessage`.
   * @param {string} messageText
   * @param {Object} options
   * @return {
   *   update_id: int,
   *   message: {
   *     message_id: int,
   *     from: {
   *       id: number,
   *       first_name: string,
   *       username: string,
   *     },
   *     chat: {
   *       id: number,
   *       title: string,
   *       first_name: string,
   *       username: string,
   *       type: string,
   *     },
   *     date: number,
   *     text: string
   *   }
   * }
   */
  makeMessage(messageText, options = {}) {
    return merge({
      botToken: this.botToken,
      from: {id: this.userId, first_name: this.firstName, username: this.userName},
      chat: {
        id: this.chatId,
        title: this.chatTitle,
        first_name: this.firstName,
        username: this.userName,
        type: this.type,
      },
      date: Math.floor(Date.now() / 1000),
      text: messageText,
    }, options);
  }

  makeCommand(messageText, options = {}) {
    const entityOffset = messageText.includes('/') && messageText.indexOf('/') || 0;
    const entityLength = messageText.includes(' ') && (messageText.indexOf(' ') - entityOffset) || messageText.length;

    const entities = [{offset: entityOffset, length: entityLength, type: 'bot_command'}];
    const newOptions = merge({entities}, options);
    return this.makeMessage(messageText, newOptions);
  }

  makeCallbackQuery(data, options = {}) {
    const from = {id: this.userId, first_name: this.firstName, username: this.userName};
    return merge({
      botToken: this.botToken,
      from,
      message: {
        from,
        chat: {
          id: this.chatId,
          title: this.chatTitle,
          first_name: this.firstName,
          username: this.userName,
          type: this.type,
        },
      },
      date: Math.floor(Date.now() / 1000),
      data,
    }, options);
  }

  async sendMessage(message) {
    const options = {
      url: `${this.url}/sendMessage`,
      method: 'POST',
      data: message,
    };
    const res = await request(options);
    return res && res.data;
  }

  async sendCommand(message) {
    const options = {
      url: `${this.url}/sendCommand`,
      method: 'POST',
      data: message,
    };
    const res = await request(options);
    return res && res.data;
  }

  async sendCallback(message) {
    const options = {
      url: `${this.url}/sendCallback`,
      method: 'POST',
      data: message,
    };
    const res = await request(options);
    return res && res.data;
  }

  async getUpdates() {
    const data = {token: this.botToken};
    const options = {
      url: `${this.url}/getUpdates`,
      method: 'POST',
      data,
    };
    const update = await request(options);
    if (update.data && update.data.result !== undefined && update.data.result.length >= 1) {
      return update.data;
    }
    await delay(this.interval);
    return pTimeout(this.getUpdates(), this.timeout, `did not get new updates in ${this.timeout} ms`);
  }

  /**
   * Obtains all updates (messages or any other content) sent or received by specified bot.
   * Doesn't mark updates as "read".
   * Very useful for testing `deleteMessage` Telegram API method usage.
   */
  async getUpdatesHistory() {
    const data = {token: this.botToken};
    const res = await request({
      url: `${this.url}/getUpdatesHistory`,
      method: 'POST',
      data,
    });
    return res.data && res.data.result;
  }
}

module.exports = TelegramClient;
