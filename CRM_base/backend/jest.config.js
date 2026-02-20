module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/prisma/**',
    '!**/migrations/**',
    '!jest.config.js',
    '!server.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  // Загрузка переменных окружения для тестов
  setupFiles: ['dotenv/config'],
  env: {
    NODE_ENV: 'test',
    DOTENV_CONFIG_PATH: '.env.test'
  }
};