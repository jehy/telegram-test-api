
'use strict';

const
  TelegramServer = require('../index'),
  config = require('../config/config.json'),
  server = new TelegramServer(config);

server.start();
