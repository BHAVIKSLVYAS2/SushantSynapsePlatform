const {test, expect} = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let server, base, online = false;
test.beforeAll(async () => {
  const {output, files} = require('../../../infrastructure/cloudflare/build.cjs').build();
  const {handle} = await import('../../../infrastructure/cloudflare/worker.mjs');
  const assetFetch = async request => {
    const name = new URL(request.url).pathname;
    if (!files.has(name)) return new Response('Not found', {status: 404});
    const type = (name.endsWith('.js') || name.endsWith('.mjs')) ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : name.endsWith('.svg') ? 'image/svg+xml' : name.endsWith('.html') ? 'text/html' : 'application/json';
    return new Response(fs.readFileSync(path.join(output, name)), {headers: {'Content-Type': type}});
  };
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'https://apps.sushantsynapse.com');
      const request = new Request(url, {method: req.method});
      const response = files.has(url.pathname) ? await assetFetch(request) : await handle(request, {ASSETS: {fetch: assetFetch}}, async origin => {
        if (!online) return new Response('Tunnel unavailable', {status: 530});
        return Response.json(new URL(origin.url).pathname === '/healthz' ? {status: 'ok'} : {user: null, setupRequired: false});
      });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });
test.beforeEach(() => { online = false; });
test('offline home keeps public tools usable and every dependent app shows a responsive themed fallback', async ({page}) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 320, height: 850});
  await page.goto(base);
  await expect(page.locator('#free-apps .public-app')).toHaveCount(8);
  await expect(page.locator('#backend-notice')).toHaveCount(0);
  await expect(page.locator('.offline-ribbon')).toHaveCount(4);
  await expect(page.locator('#free-apps .offline-ribbon')).toHaveCount(0);
  await expect(page.locator('#workspace-connection')).toContainText('Azure VM');
  await expect(page.locator('#workspace-connection')).toContainText('laptop');
  await page.locator('#workspace-connection button').click();
  await expect(page.locator('[data-connection-status]')).toContainText('Still offline');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#workspace-connection').scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/home-offline-mobile.png'});
  online = true;
  await page.locator('#workspace-connection button').click();
  await expect(page.locator('.offline-ribbon')).toHaveCount(0);
  await expect(page.locator('#connection-title')).toContainText('back online');
  online = false;
  const showcaseResponse=await page.goto(base+'/showcase?screen=1');expect(showcaseResponse.status()).toBe(200);await expect(page.locator('#scene-nav button')).toHaveCount(11);await expect(page.locator('#backend-notice')).toHaveCount(0);await expect(page.locator('#play')).toBeVisible();
  const supportResponse=await page.goto(base+'/support');expect(supportResponse.status()).toBe(200);await expect(page.locator('#availability')).toContainText('temporarily unavailable');await expect(page.locator('#payment')).toBeHidden();await expect(page.locator('#backend-notice')).toHaveCount(0);await expect(page.getByRole('link',{name:'Explore sponsorship'})).toBeVisible();
  await page.goto(base + '/moment-studio/certificates');
  await expect(page.locator('#backend-notice')).toHaveCount(0);
  await expect(page.locator('canvas').first()).toBeVisible();
  await page.goto(base + '/pocket-pause'); await page.locator('.bubble').first().click(); await expect(page.locator('.bubble').first()).toHaveAttribute('aria-pressed','true'); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/team-mixer'); await page.locator('#mix').click(); await expect(page.locator('#exports')).toBeVisible(); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/celebration-studio'); await expect(page.locator('#card')).toBeVisible(); await expect(page.locator('#download')).toBeEnabled(); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/decision-wheel'); await expect(page.locator('#spin')).toBeVisible(); await page.locator('#spin').click(); await expect(page.locator('#winner')).toBeVisible(); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/daily-spark'); await expect(page.locator('#numbers button')).toHaveCount(4); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/timetable-lite'); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/news'); await expect(page.locator('#newspaper')).toBeVisible();
  await expect(page.locator('#device-note')).toBeVisible(); await expect(page.locator('#backend-notice')).toHaveCount(0);
  await page.goto(base + '/fund-overlap'); await expect(page.locator('#fund-search')).toBeVisible();
  for (const route of ['/signin?next=advocate', '/advocate', '/digital-samaj', '/batchfee-lite', '/tournament-lite?share=abc']) {
    const response = await page.goto(base + route); expect(response.status()).toBe(503);
    await expect(page.getByRole('heading', {name: 'This app is temporarily unavailable.'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Fund Lens', exact: true})).toBeVisible();
    await expect(page.getByRole('link', {name: 'News (temporary editions)', exact: true})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', {name: 'Dark mode', exact: true}).click();
  }
  await page.screenshot({path: 'test-results/cloudflare-unavailable-mobile.png', fullPage: true});
  online = true;
  await page.goto(base + '/signin?next=advocate'); await expect(page.locator('#auth-form')).toBeVisible();
  expect(errors).toEqual([]);
});
test('an outage during sign-in preserves input and connection checks never reload or resubmit', async ({page}) => {
  online = true; await page.goto(base + '/signin');
  await page.getByLabel('Email address').fill('draft@example.com');
  online = false;
  await page.evaluate(() => fetch('/api/auth/status'));
  await expect(page.locator('#backend-notice')).toBeVisible();
  await expect(page.getByLabel('Email address')).toHaveValue('draft@example.com');
  online = true; await page.getByRole('button', {name: 'Check connection'}).click();
  await expect(page.locator('#backend-notice')).toContainText('Connection restored');
  await expect(page.getByLabel('Email address')).toHaveValue('draft@example.com');
});
test('fallback and independent links work without JavaScript; retry keeps the original URL', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  const target = base + '/tournament-lite?share=retain-this';
  await page.goto(target); await expect(page.getByRole('link', {name: 'Moment Studio', exact: true})).toBeVisible();
  await page.getByRole('link', {name: 'Try again'}).click(); expect(page.url()).toBe(target);
  online = true; const response = await page.reload(); expect(response.status()).toBe(200);
  await context.close();
});
