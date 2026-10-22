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
const assets = {ASSETS: {fetch: async request => {const target=new URL(request.url).pathname;if(target.startsWith('/_fund-archive/'))return new Response(fs.readFileSync(path.join(exported.output,target)),{headers:{'Content-Type':'application/json'}});return new Response(target,{headers:{'Content-Type':'text/html'}});}}};
test('retired page and asset URLs return 404 at the edge',async()=>{
 for(const route of ['/certificates','/certificates/','/certificates/app.js','/certificates/renderer.js','/certificates/export.js','/certificates/style.css','/certificates/branding.mjs','/celebration-studio','/celebration-studio/','/celebration-studio/app.js','/celebration-studio/renderer.mjs','/celebration-studio/style.css','/celebration-studio/branding.mjs','/arena','/arena/']){
  assert.equal(exported.pages[route],undefined);
  assert.equal((await handle(new Request(base+route),assets,async()=>{throw Error('Retired routes must not contact origin');})).status,404);
 }
});
test('Moment Studio uses explicit certificate and card routes at the edge',async()=>{
 const down=async()=>{throw Error('Public studio must not depend on the backend');};
 for(const root of ['/moment-studio','/moment-studio/']){
  assert.equal(await (await handle(new Request(base+root),assets,down)).text(),exported.pages[root]);
  assert.equal(await (await handle(new Request(base+root+'?occasion=condolence&language=hi'),assets,down)).text(),exported.pages[root]);
 }
 const {staticAssets}=require('../server/static-assets');assert.equal(staticAssets['/moment-studio'],staticAssets['/moment-studio/certificates']);assert.equal(staticAssets['/celebration-studio'],undefined);
});
test('AdSense is limited to anonymous free public apps and has fresh response nonces',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('<html><head><script src="/shared/theme.js"></script></head><body></body></html>',{headers:{'Content-Type':'text/html','Content-Length':'1',ETag:'old'}})}};
 let previous;
 const eligible=['/','/qr-maker','/photo-resize','/bill-splitter','/moment-studio/cards','/take-a-break','/decision-wheel','/focus','/news','/ritual-assist','/team-mixer','/timetable-lite','/fund-overlap','/satire-arena','/privacy','/terms','/contact','/legal','/legal/third-party-notices','/showcase','/support','/sponsor'];
 for(const route of eligible){
  const r=await handle(new Request(base+route),env,async request=>request.url.endsWith('/healthz')?new Response('ok'):request.url.endsWith('/api/arena-editorial/public')?Response.json({posts:[],characters:[]}):new Response(null,{status:404})),html=await r.text(),policy=r.headers.get('Content-Security-Policy');
  const nonce=/script-src 'nonce-([^']+)'/.exec(policy)?.[1];assert.ok(nonce,route);assert.notEqual(nonce,previous,route);previous=nonce;
  assert.match(policy,/'strict-dynamic'/,route);assert.match(html,/client=ca-pub-1894051755496526/,route);assert.match(html,/google-adsense-account/,route);
  assert.equal([...html.matchAll(/<script\b[^>]*>/g)].every(([tag])=>tag.includes(`nonce="${nonce}"`)),true,route);
  assert.equal(r.headers.get('Content-Length'),null,route);assert.equal(r.headers.get('ETag'),null,route);assert.equal(r.headers.get('Cache-Control'),'no-store',route);
 }
 const {cast}=await import('../apps/satire-arena/frontend/catalogue.mjs');
 const dynamic=['/satire-arena/daily','/satire-arena/results','/satire-arena/categories/office','/satire-arena/characters/'+cast[0].id];
 for(const route of dynamic){
  const r=await handle(new Request(base+route),env,async request=>request.url.endsWith('/api/arena-editorial/public')?Response.json({posts:[],characters:[]}):request.url.endsWith('/api/satire-arena/results')?Response.json({days:[]}):new Response(null,{status:404}));
  assert.equal(r.status,200,route);assert.match(await r.text(),/google-adsense-account/,route);assert.match(r.headers.get('Content-Security-Policy'),/nonce-/,route);
 }
 for(const [route,cookie]of [['/','other=1; chambers_session=private'],['/qr-maker','chambers_session=private'],['/signin',''],['/confessions',''],['/feedback',''],['/satire-arena/editor',''],['/advocate','']]){
  const r=await handle(new Request(base+route,{headers:{Cookie:cookie}}),env,async()=>Response.json({status:'ok'}));
  assert.doesNotMatch(await r.text(),/adsbygoogle|google-adsense-account/);assert.match(r.headers.get('Content-Security-Policy'),/script-src 'self';/);
 }
 const head=await handle(new Request(base+'/ritual-assist',{method:'HEAD'}),env);assert.equal(await head.text(),'');assert.match(head.headers.get('Content-Security-Policy'),/nonce-/);
 assert.equal(fs.readFileSync(path.join(exported.output,'ads.txt'),'utf8').trim(),'google.com, pub-1894051755496526, DIRECT, f08c47fec0942fa0');
});
test('Cloudflare export contains only allowlisted frontend files and shared outage assets', () => {
  const files = fs.readdirSync(exported.output, {recursive: true, withFileTypes: true}).filter(item => item.isFile());
  assert.equal(files.length, exported.files.size + 1);
  for (const source of exported.files.values()) assert.match(source, /^(apps\/[^/]+\/frontend\/|packages\/ui\/|apps\/fund-overlap\/data\/holdings\/[a-z0-9-]{1,80}\/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$)/);
  for (const name of Object.values(exported.pages)) assert.match(fs.readFileSync(path.join(exported.output, name), 'utf8'), /shared\/availability.js/);
});
test('independent tools load without origin calls; unavailable app routes return uncached useful HTML', async () => {
  let calls = 0;
  const down = async () => { calls++; throw Error('Disconnected'); };
  for (const route of ['/qr-maker','/qr-maker/','/photo-resize','/photo-resize/','/bill-splitter','/bill-splitter/','/privacy', '/privacy/', '/terms', '/terms/', '/contact', '/contact/', '/legal', '/legal/', '/legal/third-party-notices', '/legal/third-party-notices/', '/showcase', '/showcase/', '/support', '/support/', '/ritual-assist', '/ritual-assist/', '/ritual-assist/calendar', '/ritual-assist/calendar/', '/take-a-break', '/take-a-break/', '/sponsor', '/sponsor/', '/moment-studio', '/moment-studio/', '/moment-studio/cards', '/moment-studio/certificates', '/moment-studio/certificates/', '/team-mixer', '/team-mixer/', '/decision-wheel', '/decision-wheel/', '/daily-spark', '/daily-spark/', '/', '/fund-overlap', '/fund-overlap/', '/news', '/news/', '/timetable-lite']) {
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
  assert.equal((await handle(new Request(base + '/moment-studio', {method: 'POST'}), assets, down)).status, 405);
});

test('Fund Lens public references and provider requests work without an origin; private routes stay protected', async () => {
  const down = async () => { throw Error('Laptop off'); };
  const env = {...assets, FUND_LIMITER: {limit: async () => ({success: true})}};
  const provider = {search: async () => ({funds: [{id: 'amfi-123456', name: 'Example Equity', holdingsPath: '/api/fund-overlap/scheme/123456'}], nextOffset: null}), scheme: async code => ({schemeId: 'amfi-' + code}), snapshot: async slug => ({schemeId: 'groww-' + slug})};
  const get = (path, options = {}) => handle(new Request('https://preview.workers.dev' + path, options), env, down, {provider});
  const index = await (await get('/api/fund-overlap/fund-index.json')).json();
  assert.ok(index.funds.length >= 5);
  const coverage=await (await get('/api/fund-overlap/coverage.json')).json();assert.ok(coverage.summary);assert.deepEqual(coverage.schemes,[]);
  assert.equal((await get('/api/fund-overlap/coverage/schemes?limit=201')).status,400);
  assert.ok(Array.isArray((await (await get('/api/fund-overlap/coverage/schemes?limit=2')).json()).schemes));
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

test('historical audited snapshots remain available at the edge after their current pointer advances',async()=>{
  const archives=JSON.parse(fs.readFileSync(path.join(__dirname,'../infrastructure/cloudflare/fund-archives.json')));
  const [route,target]=Object.entries(archives).find(([url])=>url.includes('/2026-07-31-'));assert.ok(route);
  const env={ASSETS:{fetch:async request=>{assert.equal(new URL(request.url).pathname,target);return new Response(fs.readFileSync(path.join(exported.output,target)),{headers:{ETag:'"fixture-version"'}});}}};
  const response=await handle(new Request(base+route),env,async()=>{throw Error('Historical references must not contact origin');});
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/immutable/);assert.ok((await response.json()).holdings.length);
  assert.equal(await (await handle(new Request(base+route,{method:'HEAD'}),env)).text(),'');
});

test('mapped official schemes use static holdings without provider credentials or conditional alias requests',async()=>{
  const refs=JSON.parse(fs.readFileSync(path.join(__dirname,'../infrastructure/cloudflare/fund-references.json')));
  const fund=refs['/api/fund-overlap/fund-index.json'].funds.find(entry=>entry.schemeCodes?.length);assert.ok(fund,'National official publication must include AMFI mappings');
  let reads=0;
  const env={ASSETS:{fetch:async request=>{
    reads++;assert.equal(request.method,'GET');assert.equal(request.headers.get('Cookie'),null);assert.equal(request.headers.get('If-None-Match'),null);
    assert.equal(request.headers.get('If-Modified-Since'),null);
    return new Response(fs.readFileSync(path.join(exported.output,new URL(request.url).pathname)),{headers:{'Content-Type':'application/json'}});
  }}};
  const provider={scheme:async()=>{throw Error('Mapped official scheme must not call a provider');}};
  const route=base+'/api/fund-overlap/scheme/'+fund.schemeCodes[0];
  const response=await handle(new Request(route,{headers:{Cookie:'chambers_session=private','If-None-Match':'"old-alias"','If-Modified-Since':'Thu, 01 Jan 2026 00:00:00 GMT'}}),env,async()=>{throw Error('Official holdings must not contact origin');},{provider});
  assert.equal(response.status,200);const snapshot=await response.json();assert.equal(snapshot.schemeId,'amfi-'+fund.schemeCodes[0]);assert.equal(snapshot.portfolioDate,fund.portfolioDate);assert.equal(snapshot.source.kind,'official');
  const head=await handle(new Request(route,{method:'HEAD'}),env,undefined,{provider});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(reads,2);
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
