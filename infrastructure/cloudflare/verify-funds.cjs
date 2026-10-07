const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const base = process.argv[2];
if (!base || !/^https:\/\//.test(base)) throw Error('Provide the HTTPS preview or production URL');
(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requests.push(new URL(r.url()).pathname));
    await page.route('**/healthz', route => route.abort());
    await page.route('**/api/auth/**', route => route.abort());
    await page.goto(base + '/fund-overlap#funds=amfi-118955,ppfas-flexi-cap&basis=equity');
    await page.locator('.pair').first().waitFor({timeout: 120000});
    assert.match(await page.locator('#results').innerText(), /HDFC/);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    assert.equal(requests.includes('/healthz'), false);
    assert.equal(requests.some(p => p.startsWith('/api/auth/')), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({base, comparison: 'HDFC Flexi Cap + official PPFAS', pairs: await page.locator('.pair').count(), backendRequests: 0, widths: [320,768,1440], errors}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
