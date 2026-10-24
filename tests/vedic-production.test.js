const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Node preview pages enforce input privacy and reject business submissions',{timeout:30000},async t=>{
 const fixture=await require('./organisation-preview-fixture.cjs').startPreview({enabled:false});t.after(()=>fixture.stop());
 for(const route of ['/rashifal-kundli','/rashifal-kundli/rashifal','/rashifal-kundli/matching','/rashifal-kundli/time-machine']){
  const r=await fetch(fixture.base+route);assert.equal(r.status,200);assert.equal(r.headers.get('referrer-policy'),'no-referrer');assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);assert.equal(r.headers.get('cache-control'),'no-store');assert.doesNotMatch(await r.text(),/adsbygoogle|availability.js|beta-notice/);
  const head=await fetch(fixture.base+route,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await fetch(fixture.base+route,{method:'POST',body:'synthetic-test-marker'})).status,405);
 }
 assert.equal((await fetch(fixture.base+'/packages/vedic/normalize.mjs')).status,404);
});
test('Vedic production preview exposes only bundled public assets and privacy headers',async()=>{
 const assets=require('../apps/rashifal-kundli/public-assets.cjs');
 for(const [url,file]of Object.entries(assets)){
  assert.ok(url.startsWith('/rashifal-kundli'));
  assert.match(file,/^(apps\/rashifal-kundli\/frontend\/|packages\/ui\/)/);
  assert.ok(fs.existsSync(file),file);
  if(file.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');assert.match(html,/verification preview/);
   assert.doesNotMatch(html,/adsbygoogle|availability.js|beta-notice/);
   for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(match[1]==='/'||Object.hasOwn(assets,match[1]),match[1]);
  }
 }
 const {headers}=require('../apps/rashifal-kundli/privacy.cjs');
 assert.match(headers['Content-Security-Policy'],/connect-src 'none'/);
 assert.equal(headers['Referrer-Policy'],'no-referrer');assert.equal(headers['Cache-Control'],'no-store');
 const {eligiblePage}=require('../packages/ui/adsense.cjs');
 for(const url of Object.keys(assets))assert.equal(eligiblePage(url),false);
 const m=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 assert.equal(fs.readFileSync('apps/rashifal-kundli/frontend/export-report.css','utf8'),m.reportCss.replace(':root{','.vedic-export-preview{').replace('body{','.vedic-export-preview{')+m.reportLayoutCss+m.reportTableCss);
});
