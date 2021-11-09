'use strict';

const sendMessage = require('./sendMessage');
const sendCommand = require('./sendCommand');
const sendCallback = require('./sendCallback');
const getUpdates = require('./getUpdates');
const getUpdatesHistory = require('./getUpdatesHistory');

module.exports = [
  sendMessage, sendCommand, sendCallback, getUpdates, getUpdatesHistory,
];
