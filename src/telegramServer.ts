'use strict';

const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const shutdown = require('http-shutdown');
const http = require('http');
const request = require('axios');

const debug = require('debug')('TelegramServer:server');
const debugStorage = require('debug')('TelegramServer:storage');
const sendResult = require('./modules/sendResult');
const TelegramClient = require('./modules/telegramClient');
const requestLogger = require('./modules/requestLogger');
const routes = require('./routes/index');
const formatUpdate = require('./modules/formatUpdate');

class TelegramServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.started = false;
    this.config = TelegramServer.normalizeConfig(config);
    debug(`Telegram API server config: ${JSON.stringify(this.config)}`);

    this.updateId = 1;
    this.messageId = 1;
    this.callbackId = 1;
    this.webhooks = {};
    this.webServer = express();
    this.webServer.use(sendResult);
    this.webServer.use(bodyParser.json());
    this.webServer.use(bodyParser.urlencoded({extended: true}));
    this.webServer.use(requestLogger);

    if (this.config.storage === 'RAM') {
      this.storage = {
        userMessages: [],
        botMessages: [],
      };
    }
    for (let i = 0; i < routes.length; i++) {
      routes[i](this.webServer, this);
    }
    // there was no route to process request
    this.webServer.use((req, res) => {
      res.sendError(new Error('Route not found'));
    });
    // Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
    this.webServer.use((error, req, res) => {
      debug(`Error: ${error}`);
      res.sendError(new Error(`Something went wrong. ${error}`));
    });
  }

  static normalizeConfig(config) {
    const appConfig = {
      port: config.port || 9000,
      host: config.host || 'localhost',
      protocol: config.protocol || 'http',
      storage: config.storage || 'RAM',
      storeTimeout: (config.storeTimeout || 60) * 1000, // store for a minute by default
    };
    appConfig.apiURL = `${appConfig.protocol}://${appConfig.host}:${appConfig.port}`;
    return appConfig;
  }

  getClient(botToken, options) {
    // console.log(this);
    return new TelegramClient(this.config.apiURL, botToken, options);
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
    return new Promise((resolve) => {
      this.on('AddedUserMessage', () => resolve());
      this.on('AddedUserCommand', () => resolve());
      this.on('AddedUserCallbackQuery', () => resolve());
    });
  }

  async addUserMessage(message) {
    await this.addUserUpdate(message, {message});
    this.messageId++;
    this.emit('AddedUserMessage');
  }

  async addUserCommand(message) {
    assert.ok(message.entities, 'Command should have entities');
    await this.addUserUpdate(message, {message, entities: message.entities});
    this.messageId++;
    this.emit('AddedUserCommand');
  }

  async addUserCallback(callbackQuery) {
    await this.addUserUpdate(callbackQuery, {callbackQuery, callbackId: this.callbackId});
    this.callbackId++;
    this.emit('AddedUserCallbackQuery');
  }

  /** @private */
  async addUserUpdate(message, updateFields) {
    assert.ok(message.botToken, 'The message must be of type object and must contain `botToken` field.');
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken: message.botToken,
      updateId: this.updateId,
      messageId: this.messageId,
      isRead: false,
      ...updateFields,
    };
    this.updateId++;
    const webhook = this.webhooks[message.botToken];
    if (webhook) {
      const options = {
        url: webhook.url,
        method: 'POST',
        data: formatUpdate(add),
      };
      const resp = await request(options);
      if (resp.status > 204) {
        debug(`Webhook invocation failed: ${JSON.stringify({
          url: webhook.url,
          method: 'POST',
          requestBody: add,
          responseStatus: resp.status,
          responseBody: resp.body,
        })}`);
        throw new Error('Webhook invocation failed');
      }
    } else {
      this.storage.userMessages.push(add);
    }
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
    this.server = http.createServer(this.webServer);
    this.server = shutdown(this.server);
    const self = this;
    await new Promise((resolve, reject) => {
      self.server.listen(self.config.port, self.config.host)
        .once('listening', resolve)
        .once('error', reject);
    });
    debug(`Telegram API server is up on port ${this.config.port} in ${this.webServer.settings.env} mode`);
    this.started = true;
    this.cleanUpDaemon();
  }

  removeUserMessage(updateId) {
    this.storage.userMessages = this.storage.userMessages
      .filter((update) => (update.updateId !== updateId));
  }

  removeBotMessage(updateId) {
    this.storage.botMessages = this.storage.botMessages
      .filter((update) => update.updateId !== updateId);
  }

  setWebhook(webhook, botToken) {
    this.webhooks[botToken] = webhook;
    debug(`Webhook for bot ${botToken} set to: ${webhook.url}`);
  }

  deleteWebhook(botToken) {
    this.webhooks[botToken] = undefined;
    debug(`Webhook unset for bot ${botToken}`);
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
    this.storage = {
      userMessages: [],
      botMessages: [],
    };
    await expressStop;
    debug('Server shutdown ok');
    return true;
  }
}

module.exports = TelegramServer;
