const {test}=require('node:test'),assert=require('node:assert/strict');
test('home calendar uses Chaitra-year Vikram, Amanta month and explicit IST dates',async()=>{
 const {homeCalendar}=await import('../apps/rashifal-kundli/frontend/home-calendar.mjs');
 for(const [instant,year]of [['2026-03-17T06:30:00Z',2082],['2026-03-21T06:30:00Z',2083],['2026-10-25T06:30:00Z',2083],['2027-01-15T06:30:00Z',2083]]){
  const result=homeCalendar(Date.parse(instant));assert.equal(result.samvat,year,instant);assert.match(result.convention,/Chaitra-year Vikram/);assert.match(result.asOf,/12:00/);assert.ok(result.month);assert.ok(result.tithi===null||typeof result.tithi==='string');
 }
 const now=Date.parse('2026-10-25T18:31:00Z'),en=homeCalendar(now),hi=homeCalendar(now,'hi');assert.match(en.date,/26 October 2026/);assert.equal(hi.samvat,en.samvat);assert.match(hi.month,/[\u0900-\u097f]/);assert.match(hi.tithi,/[\u0900-\u097f]/);
 assert.throws(()=>homeCalendar(NaN));assert.throws(()=>homeCalendar(now,'fr'));
 const gu=homeCalendar(now,'gu');assert.equal(gu.samvat,en.samvat);assert.match(gu.date,/[\u0a80-\u0aff]/);assert.match(gu.month,/[\u0a80-\u0aff]/);assert.match(gu.tithi,/[\u0a80-\u0aff]/);
});
test('home removes editorial teaser fetching and legacy landing redirects without an upstream read',async()=>{
 const fs=require('node:fs'),{cloudPages}=await import('../apps/satire-arena/backend/cloud-pages.mjs');
 assert.doesNotMatch(fs.readFileSync('apps/portal/frontend/platform.js','utf8'),/refreshSatireDiscovery|arena-editorial\/today/);
 const html=fs.readFileSync('apps/portal/frontend/index.html','utf8');assert.match(html,/data-home-vedic/);assert.doesNotMatch(html,/arena-discovery|data-home-satire/);
 for(const path of ['/satire-arena/daily','/satire-arena/daily/'])for(const method of ['GET','HEAD']){
  const r=await cloudPages(new Request('https://example.test'+path,{method}),()=>{throw Error('Unexpected data read');});assert.equal(r.status,308);assert.equal(r.headers.get('Location'),'/satire-arena');assert.equal(await r.text(),'');
 }
});
