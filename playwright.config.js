const { defineConfig } = require('@playwright/test');
// Browser fixtures must never inherit a live SQL database from the invoking shell.
process.env.DATABASE_PROVIDER='sqlite';
process.env.NODE_ENV='test';
for(const key of Object.keys(process.env))if(key.startsWith('SQLSERVER_'))delete process.env[key];
module.exports = defineConfig({
  testDir: './apps', testMatch: ['**/browser.spec.js','**/platform.spec.js','**/cloudflare.spec.js'], workers: 1, timeout: 60000,
  use: { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true, actionTimeout: 15000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  reporter: 'list',
});
