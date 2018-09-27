'use strict';

const TelegramServer = require('../index');
const config = require('../config/config.json');

const server = new TelegramServer(config);

server.start();
