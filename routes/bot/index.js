'use strict';

const deleteMessage = require('./deleteMessage');
const getUpdates = require('./getUpdates');
const getMe = require('./getMe');
const sendMessage = require('./sendMessage');
const setWebhook = require('./setWebhook');
const deleteWebhook = require('./deleteWebhook');
const unknownMethod = require('./unknownMethod');

module.exports = [
  deleteMessage,
  getUpdates,
  getMe,
  sendMessage,
  setWebhook,
  deleteWebhook,
  unknownMethod, // This route should go after all bot API methods.
];
