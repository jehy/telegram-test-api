
'use strict';

const r1 = require('./bot/getUpdates');
const r2 = require('./bot/sendMessage');
const r3 = require('./client/sendMessage');
const r4 = require('./client/getUpdates');

module.exports = [r1, r2, r3, r4];
