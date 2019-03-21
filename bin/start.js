'use strict';

const TelegramServer = require('../telegramServer');
const config = require('../config/config.json');

const server = new TelegramServer(config);

server.start();
