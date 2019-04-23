'use strict';

const client = require('./client/index');
const bot = require('./bot/index');

/* eslint-disable global-require */

module.exports = [].concat(client, bot);

/* eslint-enable global-require */
