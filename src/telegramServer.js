'use strict';

/* eslint-disable no-console */


const
  express = require('express'),
  bodyParser = require('body-parser'),
  Promise = require('bluebird'),
  EventEmitter = require('events'),
  shutdown = require('http-shutdown'),
  http = require('http'),
  debug = require('debug')('TelegramServer:server'),
  debugStorage = require('debug')('TelegramServer:storage'),
  sendResult = require('./modules/sendResult.js'),
  TelegramClient = require('./modules/telegramClient.js'),
  requestLogger = require('./modules/requestLogger.js'),
  Routes = require('./routes/index');

class TelegramServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = JSON.parse(JSON.stringify(config)); // make config deep copy
    this.config.port = this.config.port || 9000;
    this.config.host = this.config.host || 'localhost';
    this.ApiURL = `http://${this.config.host}:${this.config.port}`;
    this.config.storage = this.config.storage || 'RAM';
    this.config.storeTimeout = this.config.storeTimeout || 60; // store for a minute
    this.config.storeTimeout *= 1000;
    debug(`Telegram API server config: ${JSON.stringify(this.config)}`);

    this.updateId = 1;
    this.messageId = 1;
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
    };
    this.storage.botMessages.push(add);
    this.messageId++;
    this.updateId++;
    this.emit('AddedBotMessage');
  }

  waitBotMessage() {
    return new Promise(resolve => this.on('AddedBotMessage', () => resolve()));
  }

  waitUserMessage() {
    return new Promise(resolve => this.on('AddedUserMessage', () => resolve()));
  }

  addUserMessage(message) {
    const d = new Date();
    const millis = d.getTime();
    const add = {
      time: millis,
      botToken: message.botToken,
      message,
      updateId: this.updateId,
      messageId: this.messageId,
    };
    this.storage.userMessages.push(add);
    this.messageId++;
    this.updateId++;
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
    const self = this;
    if (this.started) {
      this.cleanUp();
      Promise.delay(this.config.storeTimeout)
        .then(() => self.cleanUpDaemon());
    }
  }

  start() {
    const app = this.webServer,
      self = this;
    return Promise.resolve()
      .then(() => { // set up middleware
        for (let i = 0; i < Routes.length; i++) {
          Routes[i](app, self);
        }
      })
      .then(() => {
        // there was no route to process request
        app.use((req, res, next) => {
          res.sendError(new Error('Route not found'));
        });
        // Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
        app.use((error, req, res, next) => {
          debug(`Error: ${error}`);
          res.sendError(new Error('Smth went wrong'));
        });
      })
      .then(() => new Promise((resolve) => {
        self.server = http.createServer(app);
        self.server = shutdown(self.server);
        self.server.listen(self.config.port, self.config.host, () => {
          debug(`Telegram API server is up on port ${self.config.port} in ${app.settings.env} mode`);
          self.started = true;
          self.cleanUpDaemon();
          resolve();
        });
      }));
  }

  removeUserMessage(updateId) {
    this.storage.userMessages = this.storage.userMessages
      .filter(update => (update.updateId !== updateId));
  }

  removeBotMessage(updateId) {
    this.storage.botMessages = this.storage.botMessages
      .filter(update => update.updateId !== updateId);
  }

  close() {
    this.storage = {
      userMessages: [],
      botMessages: [],
    };
  }

  stop() {
    const self = this;
    return new Promise((resolve) => {
      if (self.server === undefined) {
        debug('Cant stop server - it is not running!');
        resolve();
        return;
      }
      debug('Stopping server...');
      self.server.shutdown(() => {
        self.close();
        debug('Server shutdown ok');
        self.started = false;
        resolve();
      });
    });
  }
}

module.exports = TelegramServer;
