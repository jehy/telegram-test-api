const
  TelegramServer = require('../telegramServer'),
  config         = require('../config/config.json'),
  server         = new TelegramServer(config);

server.start();
