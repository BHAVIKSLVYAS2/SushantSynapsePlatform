const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let handle, exported;
const base = 'https://apps.sushantsynapse.com';
before(async () => { exported = require('../infrastructure/cloudflare/build.cjs').build(); ({handle} = await import('../infrastructure/cloudflare/worker.mjs')); });
const assets = {ASSETS: {fetch: async request => new Response(new URL(request.url).pathname,{headers:{'Content-Type':'text/html'}})}};
test('retired page and asset URLs return 404 at the edge',async()=>{
 for(const route of ['/daily-spark','/daily-spark/','/daily-spark/app.js','/daily-spark/engine.mjs','/api/daily-spark','/decision-wheel','/decision-wheel/','/decision-wheel/app.js','/api/decision-wheel','/news','/news/','/news/app.js','/api/news/sources','/api/news/fetch','/api/news/editions/2026-01-01','/fund-overlap','/fund-overlap/','/fund-overlap/app.js','/api/fund-overlap/search','/api/fund-overlap/portfolio','/certificates','/certificates/','/certificates/app.js','/certificates/renderer.js','/certificates/export.js','/certificates/style.css','/certificates/branding.mjs','/sponsor','/sponsor/','/celebration-studio','/celebration-studio/','/celebration-studio/app.js','/celebration-studio/renderer.mjs','/celebration-studio/style.css','/celebration-studio/branding.mjs','/arena','/arena/','/satire-arena','/satire-arena/editor','/satire-arena/app.js','/api/satire-arena','/api/arena-editorial/public','/api/arena-metrics']){
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
test('AdSense Auto Ads is global on eligible anonymous public pages only',async()=>{
 const env={ASSETS:{fetch:async request=>new URL(request.url).pathname==='/ads.txt'?new Response('google.com, pub-1894051755496526, DIRECT, f08c47fec0942fa0',{headers:{'Content-Type':'text/plain'}}):new Response('<html><head><script src="/shared/theme.js"></script></head><body></body></html>',{headers:{'Content-Type':'text/html','Content-Length':'1',ETag:'old'}})}};
 let previous;
 const eligible=['/','/qr-maker','/photo-resize','/bill-splitter','/moment-studio/cards','/take-a-break','/picksy','/focus','/ritual-assist','/team-mixer','/timetable-lite','/privacy','/terms','/contact','/legal','/legal/third-party-notices','/showcase','/support'];
 for(const route of eligible){
  const response=await handle(new Request(base+route),env,async request=>request.url.endsWith('/healthz')?new Response('ok'):new Response(null,{status:404})),html=await response.text(),policy=response.headers.get('Content-Security-Policy');
  const nonce=/script-src 'nonce-([^']+)'/.exec(policy)?.[1];assert.ok(nonce,route);assert.notEqual(nonce,previous,route);previous=nonce;
  assert.match(policy,/'strict-dynamic'/,route);assert.match(html,/client=ca-pub-1894051755496526/,route);assert.match(html,/google-adsense-account/,route);
  assert.doesNotMatch(html,/data-ad-placement|<ins[^>]+adsbygoogle/i,route);
  assert.equal([...html.matchAll(/<script\b[^>]*>/g)].every(([tag])=>tag.includes(`nonce="${nonce}"`)),true,route);
  assert.equal(response.headers.get('Content-Length'),null,route);assert.equal(response.headers.get('ETag'),null,route);assert.equal(response.headers.get('Cache-Control'),'no-store',route);
 }
 for(const [route,cookie]of [['/','other=1; chambers_session=private'],['/qr-maker','chambers_session=private'],['/feedback',''],['/signin',''],['/advocate','']]){
  const response=await handle(new Request(base+route,{headers:{Cookie:cookie}}),env,async()=>new Response('ok'));
  assert.doesNotMatch(await response.text(),/google-adsense-account|pagead2\.googlesyndication\.com/,route);
  assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self';/,route);
 }
 const ads=await handle(new Request(base+'/ads.txt'),env);assert.equal(await ads.text(),'google.com, pub-1894051755496526, DIRECT, f08c47fec0942fa0');
 for(const route of ['/sponsor','/sponsor/','/sponsor.js','/sponsor.css']){
  assert.equal(exported.pages[route],undefined,route);
  const response=await handle(new Request(base+route),assets,async()=>{throw Error('Retired URLs must not contact origin');});
  assert.equal(response.status,404,route);
 }
 const head=await handle(new Request(base+'/support',{method:'HEAD'}),env);assert.equal(await head.text(),'');assert.match(head.headers.get('Content-Security-Policy'),/nonce-/);
});
test('Cloudflare export contains only allowlisted frontend files and shared outage assets', () => {
  const files = fs.readdirSync(exported.output, {recursive: true, withFileTypes: true}).filter(item => item.isFile());
  assert.equal(files.length,exported.files.size+1);
  for (const [url,source] of exported.files) {
    if(source==='packages/vedic/vendor/astronomy-engine-2.1.19.mjs')assert.match(url,/^(?:\/_static\/[a-f0-9]{32})?\/ritual-assist\/astronomy-engine\.mjs$/);
    else if(['packages/vedic/places.mjs','packages/vedic/place-directory.mjs','packages/vedic/diagnostics.mjs','packages/vedic/data/india-places.json'].includes(source))assert.ok(Object.entries(require('../server/static-assets').staticAssets).some(([allowed,file])=>file===source&&(url===allowed||url.endsWith(allowed)&&/^\/_static\/[a-f0-9]{32}\//.test(url))),'Only explicitly registered public Vedic aliases may be exported');
    else if(['packages/care/engine.mjs','packages/nishi/handoff.mjs'].includes(source))assert.ok(Object.entries(require('../server/static-assets').staticAssets).some(([allowed,file])=>file===source&&(url===allowed||url.endsWith(allowed)&&/^\/_static\/[a-f0-9]{32}\//.test(url))),'Only explicitly registered public shared module aliases may be exported');
    else assert.match(source, /^(apps\/[^/]+\/frontend\/|packages\/(?:ui|http)\/)/);
  }
  for (const [route,name] of Object.entries(exported.pages)) {
   const html=fs.readFileSync(path.join(exported.output,name),'utf8');
   if(route.startsWith('/rashifal-kundli'))assert.doesNotMatch(html,/shared\/availability.js|adsbygoogle|beta-notice/);
   else assert.match(html,/shared\/availability.js/);
  }
});
test('independent tools load without origin calls; unavailable app routes return uncached useful HTML', async () => {
  let calls = 0;
  const down = async () => { calls++; throw Error('Disconnected'); };
  for (const route of ['/qr-maker','/qr-maker/','/photo-resize','/photo-resize/','/bill-splitter','/bill-splitter/','/privacy', '/privacy/', '/terms', '/terms/', '/contact', '/contact/', '/legal', '/legal/', '/legal/third-party-notices', '/legal/third-party-notices/', '/showcase', '/showcase/', '/support', '/support/', '/ritual-assist', '/ritual-assist/', '/ritual-assist/calendar', '/ritual-assist/calendar/', '/take-a-break', '/take-a-break/', '/moment-studio', '/moment-studio/', '/moment-studio/cards', '/moment-studio/certificates', '/moment-studio/certificates/', '/team-mixer', '/team-mixer/', '/picksy', '/picksy/', '/', '/timetable-lite','/tournament-lite','/tournament-lite/']) {
    const response = await handle(new Request(base + route), assets, down);
    assert.equal(response.status, 200); assert.notEqual(await response.text(), '/_pages/unavailable.html');
  }
  assert.equal(calls, 0);
  for (const route of ['/signin?next=advocate', '/advocate', '/advocate/', '/batchfee-lite']) {
    const response = await handle(new Request(base + route), assets, down);
    assert.equal(response.status, 503); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(await response.text(), '/_pages/unavailable.html');
  }
  const head = await handle(new Request(base + '/timetable-lite', {method: 'HEAD'}), assets, down);
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
