// Global test setup
global.fetch = require('jest-fetch-mock');

// Set test timeout for API calls
jest.setTimeout(30000);

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};