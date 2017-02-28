/**
 * If running on Nodejs 5.x and below, we load the transpiled code.
 * Otherwise, we use the ES6 code.
 */

/* eslint-disable global-require*/

const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (majorVersion <= 5) {
  module.exports = require('../lib/test/test.js');
} else {
  module.exports = require('../src/test/test.js');
}
