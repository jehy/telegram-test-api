/**
 * If running on Nodejs below 6.4, we load the transpiled code.
 * Otherwise, we use the ES6 code.
 */

/* eslint-disable global-require */
const semver = require('semver');

if (semver.satisfies(process.version, '>=6.4.0')) {
  module.exports = require('./src/telegramServer');
} else {
  module.exports = require('./lib/telegramServer');
}
