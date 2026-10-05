module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Selenium runs in a Node environment and controls the external browser
  testMatch: ['**/tests/selenium/**/*.test.ts'],
  testTimeout: 30000, // Selenium tests take time to launch the browser
};
