// Read-only HTTPS and Chrome checks. Never creates accounts or business records.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('@playwright/test');
const base = process.argv[2];
if (!['https://apps.sushantsynapse.com', 'https://sushant-synapse-frontend-preview.bhavik-slvyas.workers.dev'].includes(base)) throw Error('Use the production or preview HTTPS origin');
const preview = base.includes('workers.dev');
(async () => {
  const checks = [];
  for (const route of ['/', '/certificates', '/timetable-lite', '/signin', '/advocate', '/news', '/fund-overlap', '/tournament-lite', '/batchfee-lite', '/healthz', '/api/auth/status', '/api/state']) {
    const response = await fetch(base + route, {signal: AbortSignal.timeout(25000)});
    const expected = preview && !['/', '/news', '/certificates', '/timetable-lite'].includes(route) ? 503 : route === '/api/state' ? 401 : 200;
    assert.equal(response.status, expected, route);
    if (!route.startsWith('/api/') && route !== '/healthz') assert.equal(response.headers.get('x-synapse-frontend'), 'cloudflare', route);
    checks.push({route, status: response.status});
    await response.body.cancel();
  }
  const {staticAssets} = require('../../server/static-assets');
  for (const [route, file] of Object.entries(staticAssets).filter(([, file]) => !file.endsWith('.html'))) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get('x-synapse-frontend'), 'cloudflare', route);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.resolve(__dirname, '../..', file)), route);
  }
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await page.locator('#free-apps .public-app').first().waitFor();
    if (preview) await page.locator('#backend-notice').waitFor();
    await page.goto(base + '/certificates'); await page.locator('canvas').first().waitFor();
    assert.equal(await page.locator('#backend-notice').count(), 0);
    await page.goto(base + '/timetable-lite');
    assert.equal(await page.locator('#backend-notice').count(), 0);
    await page.goto(base + '/signin?next=advocate');
    if (preview) await page.getByRole('heading', {name: 'This app is temporarily unavailable.'}).waitFor();
    else await page.locator('#auth-form').waitFor();
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('button', {name: 'Dark mode', exact: true}).click();
    }
    await page.screenshot({path: path.resolve('test-results', preview ? 'cloudflare-preview-live.png' : 'cloudflare-production-live.png'), fullPage: true});
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
  console.log(JSON.stringify({base, checks, staticAssetsMatched: Object.values(staticAssets).filter(file => !file.endsWith('.html')).length, browser: 'passed', businessWrites: 0}, null, 2));
})().catch(error => {console.error(error); process.exitCode = 1;});
