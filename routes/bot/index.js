'use strict';

/* eslint-disable global-require */

module.exports = [
  require('./deleteMessage'),
  require('./getUpdates'),
  require('./getMe'),
  require('./sendMessage'),
  require('./deleteWebhook'),
  require('./unknownMethod'), // This route should go after all bot API methods.
];
