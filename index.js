/**
 * If running on Nodejs below 6.4, we load the transpiled code.
 * Otherwise, we use the ES6 code.
 */

/* eslint-disable global-require */

'use strict';

module.exports = require('./src/telegramServer');
