const fs           = require('fs-promise'),
      express      = require('express'),
      bodyParser   = require('body-parser'),
      colors       = require('colors/safe'),
      Promise      = require('bluebird'),
      sendResult   = require('./modules/sendResult.js'),
      EventEmitter = require('events');

class TelegramServer extends EventEmitter {
  constructor(config = {}) {
    super();
    var self = this;
    this.config = config;
    this.config.port = this.config.port || 9000;
    this.config.storage = this.config.storage || 'RAM';
    this.config.storeTimeout = this.config.storeTimeout || 60;//store for a minute
    this.config.storeTimeout *= 1000;
    this.updateId = 1;
    this.messageId = 1;
    this.webServer = express();
    this.webServer.use(sendResult);
    this.webServer.use(bodyParser.json());
    this.webServer.use(bodyParser.urlencoded({extended: true}));
    this.webServer.use(express.static('public'));

    this.webServer.use(function (req, res, next) {
      // request logging
      var reqLit = {
        body: req.body,
        cookies: req.cookies,
        files: req.cookies,
        headers: req.headers,
        method: req.method,
        params: req.params,
        query: req.query,
        url: req.url,
        originalUrl: req.originalUrl
      };
      console.log(colors.yellow("Request: " + JSON.stringify(reqLit)));
      next();
    });

    if (this.config.storage === 'RAM') {
      this.storage = {userMessages: [], botMessages: []};
    }
    setTimeout(function () {
      self.cleanUp()
    }, self.config.storeTimeout);
  }
}


TelegramServer.prototype.addBotMessage = function (message, botToken) {
  var d = new Date();
  var millis = d.getTime();
  var add = {
    time: millis,
    botToken: botToken,
    message: message,
    updateId: this.updateId,
    messageId: this.messageId
  };
  this.storage.botMessages.push(add);
  this.messageId++;
  this.updateId++;
  this.emit('AddedBotMessage');
};

TelegramServer.prototype.WaitBotMessage = function () {
  return new Promise((resolve, reject)=> {
    this.on('AddedBotMessage', ()=>resolve())
  })
};
TelegramServer.prototype.WaitUserMessage = function () {
  return new Promise((resolve, reject)=> {
    this.on('AddedUserMessage', ()=>resolve())
  })
};
TelegramServer.prototype.addUserMessage = function (message) {
  var d = new Date();
  var millis = d.getTime();
  var add = {
    time: millis,
    botToken: message.botToken,
    message: message,
    updateId: this.updateId,
    messageId: this.messageId
  };
  this.storage.userMessages.push(add);
  this.messageId++;
  this.updateId++;
  this.emit('AddedUserMessage');
};

TelegramServer.prototype.cleanUp = function () {
  console.log(colors.green('clearing storage'));
  var timeout = this.config.storeTimeout;
  console.log(colors.green('current userMessages storage: ' + this.storage.userMessages.length));
  this.storage.userMessages = this.storage.userMessages.filter(function isNewEnough(message) {
    var d = new Date();
    var millis = d.getTime();
    return message.time > millis - timeout;
  });
  console.log(colors.green('filtered userMessages storage: ' + this.storage.userMessages.length));

  console.log(colors.green('current botMessages storage: ' + this.storage.botMessages.length));
  this.storage.botMessages = this.storage.botMessages.filter(function isNewEnough(message) {
    var d = new Date();
    var millis = d.getTime();
    return message.time > millis - timeout;
  });
  console.log(colors.green('filtered botMessages storage: ' + this.storage.botMessages.length));
};

TelegramServer.prototype.start = function () {
  // All urls are handles with corresponding modules from ./routes
// You can also pass other data to require()
  var app = this.webServer, self = this;
  return fs.readdir('./routes/bot')
    .then(function (files) {
      files.map(function (file) {
        require('./routes/bot/' + file)(app, self);
      })
    }).then(function () {
      return fs.readdir('./routes/client');
    })
    .then(function (files) {
      files.map(function (file) {
        require('./routes/client/' + file)(app, self);
      })
    }).then(function () {
      //there was no route to process request
      app.use(function (req, res, next) {
        res.sendError(new Error('Route not found'));
      });
      //Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
      app.use(function (error, req, res, next) {
        console.log(colors.red('Error: ' + error));
        res.sendError(new Error('Smth went wrong'));
      });
    }).then(()=> {
      return new Promise(function (resolve, reject) {
        self.server = app.listen(self.config.port, function () {
          console.log(colors.green('Telegram API server is up on port ' + self.config.port + ' in ' + app.settings.env + ' mode'));
          resolve();
        });
      });
    });
};
TelegramServer.prototype.removeUserMessage = function (updateId) {
  this.storage.userMessages = this.storage.userMessages.filter(function notToBeRemoved(update) {
    return update.updateId != updateId;
  });
};
TelegramServer.prototype.removeBotMessage = function (updateId) {
  this.storage.botMessages = this.storage.botMessages.filter(function notToBeRemoved(update) {
    return update.updateId != updateId;
  });
};
TelegramServer.prototype.close = function () {
  this.storage = {userMessages: [], botMessages: []};
};

TelegramServer.prototype.stop = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
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
    })
  })
};
module.exports = TelegramServer;
