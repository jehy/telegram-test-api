'use strict';

/* eslint-disable global-require */

module.exports = [
  require('./deleteMessage'),
  require('./getUpdates'),
  require('./getMe'),
  require('./sendMessage'),
  require('./sendChatAction'),
  require('./sendPhoto'),
  require('./deleteWebhook'),
  require('./unknownMethod'), // This route should go after all bot API methods.
];
