'use strict';

/* eslint-disable global-require */

module.exports = [
  require('./bot/deleteMessage'),
  require('./bot/getUpdates'),
  require('./bot/sendMessage'),
  require('./bot/unknownMethod'), // This route should go after all bot API methods.

  require('./client/sendMessage'),
  require('./client/getUpdates'),
  require('./client/getUpdatesHistory'),
];

/* eslint-enable global-require */
