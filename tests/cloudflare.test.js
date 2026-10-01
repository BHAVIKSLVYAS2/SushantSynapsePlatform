const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let handle, exported;
const base = 'https://apps.sushantsynapse.com';
before(async () => { exported = require('../infrastructure/cloudflare/build.cjs').build(); ({handle} = await import('../infrastructure/cloudflare/worker.mjs')); });
const assets = {ASSETS: {fetch: async request => new Response(new URL(request.url).pathname, {headers: {'Content-Type': 'text/html'}})}};
test('Cloudflare export contains only allowlisted frontend files and shared outage assets', () => {
  const files = fs.readdirSync(exported.output, {recursive: true, withFileTypes: true}).filter(item => item.isFile());
  assert.equal(files.length, exported.files.size + 1);
  for (const source of exported.files.values()) assert.match(source, /^(apps\/[^/]+\/frontend\/|packages\/ui\/)/);
  for (const name of Object.values(exported.pages)) assert.match(fs.readFileSync(path.join(exported.output, name), 'utf8'), /shared\/availability.js/);
});
test('independent tools load without origin calls; unavailable app routes return uncached useful HTML', async () => {
  let calls = 0;
  const down = async () => { calls++; throw Error('Disconnected'); };
  for (const route of ['/', '/news', '/news/', '/certificates', '/certificates/', '/timetable-lite']) {
    const response = await handle(new Request(base + route), assets, down);
    assert.equal(response.status, 200); assert.notEqual(await response.text(), '/_pages/unavailable.html');
  }
  assert.equal(calls, 0);
  for (const route of ['/signin?next=advocate', '/advocate', '/advocate/', '/fund-overlap', '/tournament-lite?share=example', '/batchfee-lite']) {
    const response = await handle(new Request(base + route), assets, down);
    assert.equal(response.status, 503); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(await response.text(), '/_pages/unavailable.html');
  }
  const head = await handle(new Request(base + '/news', {method: 'HEAD'}), assets, down);
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
});
test('healthy origin enables app pages and API proxy preserves cookies, validation, bodies and status', async () => {
  let calls = 0;
  const online = async request => {
    calls++;
    if (new URL(request.url).pathname === '/healthz') return Response.json({status: 'ok'});
    assert.equal(request.method, 'POST'); assert.equal(request.headers.get('Cookie'), 'session=test');
    assert.equal(request.headers.get('Origin'), base); assert.equal(request.redirect, 'manual');
    assert.equal(await request.text(), '{"amount":42}');
    return Response.json({error: 'Insufficient access'}, {status: 403, headers: {'Set-Cookie': 'session=; HttpOnly; Secure'}});
  };
  assert.equal((await handle(new Request(base + '/advocate'), assets, online)).status, 200);
  const response = await handle(new Request(base + '/api/payments', {method: 'POST', headers: {Cookie: 'session=test', Origin: base}, body: '{"amount":42}'}), assets, online);
  assert.equal(response.status, 403); assert.match(response.headers.get('Set-Cookie'), /HttpOnly/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store'); assert.equal(calls, 2);
});
test('failed writes are never retried; gateway failures become JSON and previews never use the origin', async () => {
  let calls = 0;
  const down = async () => { calls++; return new Response('Tunnel error', {status: 530}); };
  const response = await handle(new Request(base + '/api/payments', {method: 'POST', body: '{}'}), assets, down);
  assert.equal(response.status, 503); assert.equal((await response.json()).code, 'BACKEND_UNAVAILABLE'); assert.equal(calls, 1);
  assert.equal((await handle(new Request('https://preview.workers.dev/api/auth/status'), assets, down)).status, 503);
  assert.equal(calls, 1);
  for (const route of ['/data/chambers.sqlite', '/.env', '/server/index.js', '/missing']) assert.equal((await handle(new Request(base + route), assets, down)).status, 404);
  assert.equal((await handle(new Request(base + '/certificates', {method: 'POST'}), assets, down)).status, 405);
});
