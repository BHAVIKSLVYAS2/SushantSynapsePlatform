const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: ['**/browser.spec.js','**/platform.spec.js'], workers: 1, timeout: 60000,
  use: { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true, actionTimeout: 15000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  reporter: 'list',
});
