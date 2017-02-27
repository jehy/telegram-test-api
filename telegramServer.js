/* eslint-disable no-console*/

const
  express        = require('express'),
  bodyParser     = require('body-parser'),
  colors         = require('colors/safe'),
  Promise        = require('bluebird'),
  sendResult     = require('./modules/sendResult.js'),
  TelegramClient = require('./modules/telegramClient.js'),
  requestLogger  = require('./modules/requestLogger.js'),
  EventEmitter   = require('events'),
  objectAssign   = require('object-assign'),
  Routes         = require('./routes/index');

class TelegramServer extends EventEmitter {
  constructor(config = {}) {
    super();
    const self = this;
    this.config = objectAssign({}, config);
    this.config.port = this.config.port || 9000;
    this.config.host = this.config.host || 'localhost';
    this.ApiURL = `http://${this.config.host}:${this.config.port}`;
    this.config.storage = this.config.storage || 'RAM';
    this.config.storeTimeout = this.config.storeTimeout || 60; // store for a minute
    this.config.storeTimeout *= 1000;
    console.log(colors.green(`Telegram API server config: ${JSON.stringify(this.config)}`));

    this.updateId = 1;
    this.messageId = 1;
    this.webServer = express();
    this.webServer.use(sendResult);
    this.webServer.use(bodyParser.json());
    this.webServer.use(bodyParser.urlencoded({extended: true}));
    this.webServer.use(express.static('public'));
    this.webServer.use(requestLogger);

    if (this.config.storage === 'RAM') {
      this.storage = {userMessages: [], botMessages: []};
    }
    setInterval(()=> {
      self.cleanUp();
    }, self.config.storeTimeout);
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
    return new Promise(resolve=>this.on('AddedBotMessage', ()=>resolve()));
  }

  waitUserMessage() {
    return new Promise(resolve=>this.on('AddedUserMessage', ()=>resolve()));
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
    console.log(colors.green('clearing storage'));
    console.log(colors.green(`current userMessages storage: ${this.storage.userMessages.length}`));
    this.storage.userMessages = this.storage.userMessages.filter(this.messageFilter, this);
    console.log(colors.green(`filtered userMessages storage: ${this.storage.userMessages.length}`));

    console.log(colors.green(`current botMessages storage: ${this.storage.botMessages.length}`));
    this.storage.botMessages = this.storage.botMessages.filter(this.messageFilter, this);
    console.log(colors.green(`filtered botMessages storage: ${this.storage.botMessages.length}`));
  }

  start() {
    const app  = this.webServer,
          self = this;
    return Promise.resolve()
      .then(()=> { // set up middleware
        for (let i = 0; i < Routes.length; i++) {
          Routes[i](app, self);
        }
      })
      .then(()=> {
        // there was no route to process request
        app.use((req, res, next)=> {
          res.sendError(new Error('Route not found'));
        });
        // Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
        app.use((error, req, res, next)=> {
          console.log(colors.red(`Error: ${error}`));
          res.sendError(new Error('Smth went wrong'));
        });
      })
      .then(()=>new Promise((resolve)=> {
        self.server = app.listen(self.config.port, self.config.host, ()=> {
          console.log(colors.green(`Telegram API server is up on port ${self.config.port} in ${app.settings.env} mode`));
          resolve();
        });
      }));
  }

  removeUserMessage(updateId) {
    this.storage.userMessages =
      this.storage.userMessages.filter(update=> (update.updateId !== updateId));
  }

  removeBotMessage(updateId) {
    this.storage.botMessages =
      this.storage.botMessages.filter(update=>update.updateId !== updateId);
  }

  close() {
    this.storage = {userMessages: [], botMessages: []};
  }

  stop() {
    const self = this;
    return new Promise((resolve)=> {
      if (self.server === undefined) {
        console.log(colors.red('Cant stop server - it is not running!'));
        resolve();
        return;
      }
      console.log(colors.green('Stopping server...'));
      self.server.close(()=> {
        self.close();
        console.log(colors.green('Server shutdown ok'));
        resolve();
      });
    });
  }
}

module.exports = TelegramServer;
