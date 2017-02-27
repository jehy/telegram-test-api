/**
 * If running on Nodejs 4.x and below, we load the transpiled code.
 * Otherwise, we use the ES6 code.
 */

/* eslint-disable global-require*/

const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (majorVersion <= 4) {
  module.exports = require('./lib/telegramServer');
} else {
  module.exports = require('./src/telegramServer');
}
