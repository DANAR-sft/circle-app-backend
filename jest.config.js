module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
  clearMocks: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  testTimeout: 120000,
};
