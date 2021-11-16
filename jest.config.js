/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1, // more workers can't share getPort() function
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/test/*.test.*'],
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
