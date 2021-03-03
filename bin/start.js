'use strict';

const TelegramServer = require('../telegramServer');
// eslint-disable-next-line import/no-unresolved
const config = require('../config/config.json');

const server = new TelegramServer(config);

server.start();
