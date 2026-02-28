// Jest setup for tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

// Increase timeout for slow CI environments
jest.setTimeout(10000);

// Clean up mocks between tests
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
