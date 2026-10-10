const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let handle, exported;
const base = 'https://apps.sushantsynapse.com';
test('warm verified holdings do not rewrite the large progress envelope', async () => {
  const {boundedProvider} = await import('../infrastructure/cloudflare/fund-sources.mjs');
  const refs = JSON.parse(fs.readFileSync(path.join(__dirname, '../infrastructure/cloudflare/fund-references.json'), 'utf8'));
  const fund = refs['/api/fund-overlap/fund-index.json'].funds[0];
  const snapshot = {...refs[fund.holdingsPath], schemeId:'amfi-123456', unresolvedNavWeight:0};
  let writes = 0, upstream = 0;
  const entries = {'https://apps.sushantsynapse.com/_fund-cache/v1/scheme%3A123456':{value:snapshot,savedAt:Date.now()}};
  const provider = await boundedProvider(new Request(base+'/api/fund-overlap/scheme/123456'), {
    match:async()=>Response.json(entries), put:async()=>{writes++;}
  }, async()=>{upstream++; throw Error('Should not fetch cached holdings');});
  assert.equal((await provider.source.scheme('123456')).schemeId, 'amfi-123456');
  await provider.save();
  assert.equal(writes,0); assert.equal(upstream,0);
});
test('ten national searches reuse one catalogue without rewriting holdings progress', async () => {
  const {boundedProvider} = await import('../infrastructure/cloudflare/fund-sources.mjs');
  const names = ['Mirae Asset Large & Midcap', 'HDFC Flexi Cap', 'Parag Parikh Flexi Cap', 'SBI Large Cap', 'ICICI Prudential Large Cap', 'Axis Small Cap', 'Kotak Midcap', 'Nippon India Small Cap', 'Quant Flexi Cap', 'UTI Nifty 50'];
  const queries = ['mirae large and midcap', 'hdfc flexi cap', 'paragparikh flexicap', 'sbi bluechip', 'icici prudential large cap', 'axis small cap', 'kotak midcap', 'nippon india small cap', 'quant flexi cap', 'uti nifty 50'];
  const rows = names.map((name,i) => ({schemeCode:100000+i, schemeName:name+' Fund Direct Growth'}));
  rows.push(...Array.from({length:38000}, (_,i) => ({schemeCode:200000+i, schemeName:'Historical Example '+i+' Fund Regular Growth'})));
  const saved = new Map(); let reads=0, writes=0, upstream=0;
  const cache = {match:async key => {reads++; return saved.get(key)?.clone();}, put:async(key,value) => {writes++; assert.ok(!key.includes('_fund-progress')); saved.set(key,value);}};
  for (const [i, query] of queries.entries()) {
    const provider = await boundedProvider(new Request(base+'/api/fund-overlap/search?q='+encodeURIComponent(query)), cache, async () => {upstream++; return Response.json(rows);});
    const page = await provider.source.search(query);
    assert.equal(page.funds[0]?.id, 'amfi-'+(100000+i));
    await provider.save();
  }
  assert.equal(reads,10); assert.equal(writes,1); assert.equal(upstream,1);
});
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
  for (const route of ['/privacy', '/privacy/', '/terms', '/terms/', '/contact', '/contact/', '/legal', '/legal/', '/legal/third-party-notices', '/legal/third-party-notices/', '/showcase', '/showcase/', '/support', '/support/', '/ritual-assist', '/ritual-assist/', '/ritual-assist/calendar', '/ritual-assist/calendar/', '/take-a-break', '/take-a-break/', '/sponsor', '/sponsor/', '/moment-studio', '/moment-studio/', '/moment-studio/cards', '/moment-studio/certificates', '/moment-studio/certificates/', '/pocket-pause', '/pocket-pause/', '/team-mixer', '/team-mixer/', '/celebration-studio', '/celebration-studio/', '/decision-wheel', '/decision-wheel/', '/daily-spark', '/daily-spark/', '/', '/fund-overlap', '/fund-overlap/', '/news', '/news/', '/certificates', '/certificates/', '/timetable-lite']) {
    const response = await handle(new Request(base + route), assets, down);
    assert.equal(response.status, 200); assert.notEqual(await response.text(), '/_pages/unavailable.html');
  }
  assert.equal(calls, 0);
  for (const route of ['/signin?next=advocate', '/advocate', '/advocate/', '/tournament-lite?share=example', '/batchfee-lite']) {
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

test('Fund Lens public references and provider requests work without an origin; private routes stay protected', async () => {
  const down = async () => { throw Error('Laptop off'); };
  const env = {...assets, FUND_LIMITER: {limit: async () => ({success: true})}};
  const provider = {search: async () => ({funds: [{id: 'amfi-123456', name: 'Example Equity', holdingsPath: '/api/fund-overlap/scheme/123456'}], nextOffset: null}), scheme: async code => ({schemeId: 'amfi-' + code}), snapshot: async slug => ({schemeId: 'groww-' + slug})};
  const get = (path, options = {}) => handle(new Request('https://preview.workers.dev' + path, options), env, down, {provider});
  const index = await (await get('/api/fund-overlap/fund-index.json')).json();
  assert.equal(index.funds.length, 5);
  for (const fund of index.funds) assert.ok((await (await get(fund.holdingsPath)).json()).holdings.length);
  assert.equal((await (await get('/api/fund-overlap/search?q=example')).json()).funds[0].id, 'amfi-123456');
  assert.equal((await (await get('/api/fund-overlap/scheme/123456')).json()).schemeId, 'amfi-123456');
  assert.equal((await (await get('/api/fund-overlap/remote/example-fund')).json()).schemeId, 'groww-example-fund');
  for (const path of ['/api/fund-overlap/search?q=x', '/api/fund-overlap/search?q=example&offset=-1']) assert.equal((await get(path)).status, 400);
  assert.equal((await get('/api/fund-overlap/scheme/invalid')).status, 404);
  assert.equal((await get('/api/fund-overlap/search?q=example', {method: 'POST'})).status, 405);
  assert.equal(await (await get('/api/fund-overlap/fund-index.json', {method: 'HEAD'})).text(), '');
  for (const path of ['portfolio', 'watchlists']) assert.equal((await get('/api/fund-overlap/' + path)).status, 503);
  env.FUND_LIMITER.limit = async () => ({success: false});
  assert.equal((await get('/api/fund-overlap/scheme/123456')).status, 429);
});

test('edge reference cache reuses validated data and labels source failures/date regression stale', async () => {
  const {edgeReferenceCache} = await import('../infrastructure/cloudflare/fund-sources.mjs');
  const saved = new Map(); let now = 1000, calls = 0;
  const cache = edgeReferenceCache({match: async k => saved.get(k)?.clone(), put: async (k, v) => saved.set(k, v)}, () => now);
  const validate = value => {assert.ok(value.portfolioDate);};
  const load = async () => {calls++; return {portfolioDate: '2026-07-31'};};
  await cache.get('scheme:123456', 100, load, validate);
  await cache.get('scheme:123456', 100, load, validate);
  assert.equal(calls, 1);
  now += 200;
  assert.equal((await cache.get('scheme:123456', 100, async () => {throw Error('Source down');}, validate)).stale, true);
  const regressed = await cache.get('scheme:123456', 100, async () => ({portfolioDate: '2026-06-30'}), validate);
  assert.equal(regressed.stale, true); assert.equal(regressed.value.portfolioDate, '2026-07-31');
  await assert.rejects(cache.get('missing', 100, async () => {throw Error('Unavailable');}));
});

test('large portfolios resume verified stock lookups across invocations within the free request budget', async () => {
  const {boundedProvider} = await import('../infrastructure/cloudflare/fund-sources.mjs');
  const fixture = require('../apps/fund-overlap/tests/fixtures/groww-excerpt.json');
  const fund = structuredClone(fixture.fund);
  const equity = fund.holdings.find(h => h.instrument_name === 'Equity');
  fund.holdings = Array.from({length: 240}, (_,i) => ({...equity, stock_search_id: 'stock-' + i, corpus_per: 0.3}));
  const saved = new Map(); let calls = 0;
  const cache = {match: async k => saved.get(k)?.clone(), put: async (k,v) => saved.set(k,v)};
  const fetchImpl = async url => {
    calls++;
    if (url.includes('/scheme/search/')) return Response.json(fund);
    return Response.json({header: {searchId: url.split('/').at(-1), isin: 'INE090A01021'}});
  };
  let result, rounds = 0;
  while (!result && rounds++ < 10) {
    calls = 0;
    const bounded = await boundedProvider(new Request(base + '/api/fund-overlap/remote/' + fund.search_id), cache, fetchImpl);
    try { result = await bounded.source.snapshot(fund.search_id); }
    catch (error) { assert.equal(error.code, 'FUND_CONTINUE'); }
    await bounded.save();
    assert.ok(calls <= 36);
  }
  assert.ok(rounds > 5); assert.ok(Math.abs(result.includedNavWeight - 72) < 0.00001);
});
