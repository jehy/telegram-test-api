'use strict';

const client = require('./client/index');
const bot = require('./bot/index');

module.exports = [...client, ...bot];
