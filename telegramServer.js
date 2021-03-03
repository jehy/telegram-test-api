'use strict';

const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const EventEmitter = require('events');
const shutdown = require('http-shutdown');
const http = require('http');

const debug = require('debug')('TelegramServer:server');
const debugStorage = require('debug')('TelegramServer:storage');
const sendResult = require('./modules/sendResult.js');
const TelegramClient = require('./modules/telegramClient.js');
const requestLogger = require('./modules/requestLogger.js');
const Routes = require('./routes/index');

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

class TelegramServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = clone(config);
    this.config.port = this.config.port || 9000;
    this.config.host = this.config.host || 'localhost';
    this.config.protocol = this.config.protocol || 'http';
    this.ApiURL = `${this.config.protocol}://${this.config.host}:${this.config.port}`;
    this.config.storage = this.config.storage || 'RAM';
    this.config.storeTimeout = this.config.storeTimeout || 60; // store for a minute
    this.config.storeTimeout *= 1000;
    debug(`Telegram API server config: ${JSON.stringify(this.config)}`);

    this.updateId = 1;
    this.messageId = 1;
    this.callbackId = 1;
    this.webServer = express();
    this.webServer.use(sendResult);
    this.webServer.use(bodyParser.json());
    this.webServer.use(bodyParser.urlencoded({extended: true}));
    this.webServer.use(express.static('public'));
    this.webServer.use(requestLogger);

    if (this.config.storage === 'RAM') {
      this.storage = {
        userMessages: [],
        botMessages: [],
      };
    }
    this.started = false;
  }

  getClient(botToken, options) {
    // console.log(this);
    return new TelegramClient(this.ApiURL, botToken, options);
  }

  addBotMessage(message, botToken) {
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken,
      message,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
    };
    this.storage.botMessages.push(add);
    this.messageId++;
    this.updateId++;
    this.emit('AddedBotMessage');
  }

  async waitBotMessage() {
    return new Promise((resolve) => this.on('AddedBotMessage', () => resolve()));
  }

  async waitUserMessage() {
    return new Promise((resolve) => this.on('AddedUserMessage', () => resolve()));
  }

  addUserMessage(message) {
    assert.ok(message.botToken, 'The message must be of type object and must contain `botToken` field.');
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken: message.botToken,
      message,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
    };
    this.storage.userMessages.push(add);
    this.messageId++;
    this.updateId++;
    this.emit('AddedUserMessage');
  }

  addUserCommand(message) {
    assert.ok(message.botToken, 'The message must be of type object and must contain `botToken` field.');
    assert.ok(message.entities, 'Command should have entities');
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken: message.botToken,
      message,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
      entities: message.entities,
    };
    this.storage.userMessages.push(add);
    this.messageId++;
    this.updateId++;
    this.emit('AddedUserCommand');
  }

  addUserCallback(callbackQuery) {
    assert.ok(callbackQuery.botToken, 'The callbackQuery must be of type object and must contain `botToken` field.');
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken: callbackQuery.botToken,
      callbackQuery,
      updateId: this.updateId,
      messageId: this.messageId,
      callbackId: this.callbackId,
      isRead: false,
    };
    this.storage.userMessages.push(add);
    this.updateId++;
    this.callbackId++;
    this.emit('AddedUserMessage');
  }

  messageFilter(message) {
    const d = new Date();
    const millis = d.getTime();
    return message.time > millis - this.config.storeTimeout;
  }

  cleanUp() {
    debugStorage('clearing storage');
    debugStorage(`current userMessages storage: ${this.storage.userMessages.length}`);
    this.storage.userMessages = this.storage.userMessages.filter(this.messageFilter, this);
    debugStorage(`filtered userMessages storage: ${this.storage.userMessages.length}`);
    debugStorage(`current botMessages storage: ${this.storage.botMessages.length}`);
    this.storage.botMessages = this.storage.botMessages.filter(this.messageFilter, this);
    debugStorage(`filtered botMessages storage: ${this.storage.botMessages.length}`);
  }

  cleanUpDaemon() {
    if (!this.started) {
      return;
    }
    this.cleanUpDaemonInterval = setInterval(this.cleanUp.bind(this), this.config.storeTimeout);
  }

  /**
   * Obtains all updates (messages or any other content) sent or received by specified bot.
   * Doesn't mark updates as "read".
   * Very useful for testing `deleteMessage` Telegram API method usage.
   */
  getUpdatesHistory(token) {
    return this.storage.botMessages.concat(this.storage.userMessages)
      .filter((item)=>item.botToken === token)
      .sort((a, b)=>a.time - b.time);
  }

  async start() {
    const app = this.webServer;
    const self = this;
    for (let i = 0; i < Routes.length; i++) {
      Routes[i](app, self);
    }
    // there was no route to process request
    app.use((req, res, next) => {
      res.sendError(new Error('Route not found'));
    });
    // Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
    app.use((error, req, res, next) => {
      debug(`Error: ${error}`);
      res.sendError(new Error(`Something went wrong. ${error}`));
    });
    self.server = http.createServer(app);
    self.server = shutdown(self.server);
    await Promise.promisify(self.server.listen, {context: self.server})(self.config.port, self.config.host);
    debug(`Telegram API server is up on port ${self.config.port} in ${app.settings.env} mode`);
    self.started = true;
    self.cleanUpDaemon();
  }

  removeUserMessage(updateId) {
    this.storage.userMessages = this.storage.userMessages
      .filter((update) => (update.updateId !== updateId));
  }

  removeBotMessage(updateId) {
    this.storage.botMessages = this.storage.botMessages
      .filter((update) => update.updateId !== updateId);
  }

  /**
   * Deletes specified message from the storage: sent by bots or by clients.
   * @returns {boolean} - `true` if the message was deleted successfully.
   */
  deleteMessage(chatId, messageId) {
    const isMessageToDelete = (update) => (
      update.message.chat.id === chatId && update.messageId === messageId
    );
    const userUpdate = this.storage.userMessages.find(isMessageToDelete);

    if (userUpdate) {
      this.removeUserMessage(userUpdate.updateId);
      return true;
    }

    const botUpdate = this.storage.botMessages.find(isMessageToDelete);

    if (botUpdate) {
      this.removeBotMessage(botUpdate.updateId);
      return true;
    }

    return false;
  }

  close() {
    this.storage = {
      userMessages: [],
      botMessages: [],
    };
  }

  async stop() {
    if (this.server === undefined) {
      debug('Cant stop server - it is not running!');
      return false;
    }
    this.started = false;
    if (this.cleanUpDaemonInterval) {
      clearInterval(this.cleanUpDaemonInterval);
    }

    const expressStop = new Promise((resolve) => {
      this.server.shutdown(() => {
        resolve();
      });
    });
    debug('Stopping server...');
    this.close();
    await expressStop;
    debug('Server shutdown ok');
    return true;
  }
}

module.exports = TelegramServer;
