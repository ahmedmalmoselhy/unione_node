export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**/*.js',
    '!src/scripts/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000,
};
