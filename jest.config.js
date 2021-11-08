'use strict';

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/*.js'],
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
