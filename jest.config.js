'use strict';

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  maxWorkers: 1, // more workers can't share getPort() function
  rootDir: '.',
  testMatch: ['<rootDir>/test/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['lcov'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 80,
    },
  },
};
