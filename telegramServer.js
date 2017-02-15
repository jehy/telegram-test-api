var fs         = require('fs-promise'),
    express    = require('express'),
    bodyParser = require('body-parser'),
    sendResult = require('./modules/sendResult.js');


var TelegramServer = function (config = {}) {
  this.config = config;
  this.config.port = this.config.port || 9000;
  this.app = express();
  this.app.use(sendResult);
  this.app.use(bodyParser.json());
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(express.static('public'));
};

TelegramServer.prototype.start = function () {
  // All urls are handles with corresponding modules from ./routes
// You can also pass other data to require()
  var app = this.app, self=this;
  return fs.readdir('./routes')
    .then(function (files) {
      files.map(function (file) {
        require('./routes/' + file)(app);
      })
    }).then(function () {
      //there was no route to process request
      app.use(function (req, res, next) {
        res.sendError(new Error('Route not found'));
      });
      //Catch express bodyParser error, like http://stackoverflow.com/questions/15819337/catch-express-bodyparser-error
      app.use(function (error, req, res, next) {
        console.log('Error: ' + error);
        res.sendError(new Error('Smth went wrong'));
      });
    }).then(()=> {
      return new Promise(function (resolve, reject) {
        var server = app.listen(self.config.port, function () {
          console.log('Telegram API server is up on port ' + self.config.port + ' in ' + app.settings.env + ' mode');
          resolve();
        });
      });
    })
};
module.exports = TelegramServer;
