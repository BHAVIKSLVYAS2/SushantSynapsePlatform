const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
test('P17 Ritual primitives, ten-year remembrance and two monthly calendars exactly preserve captured baseline',{timeout:60000},async()=>{
 const current=await require('../infrastructure/vedic-integration-cases.cjs').ritualCases();assert.deepEqual(current,require('./fixtures/vedic-ritual-baseline.json').result);
});
test('P17 canonical engine export identities, public URL bytes and licence remain unchanged',async()=>{
 const shared=await import('../packages/vedic/vendor/astronomy-engine-2.1.19.mjs'),ritual=await import('../apps/ritual-assist/frontend/astronomy-engine.mjs');assert.deepEqual(Object.keys(shared),Object.keys(ritual));for(const key of Object.keys(shared))assert.equal(ritual[key],shared[key]);
 const {staticAssets}=require('../server/static-assets'),bytes=fs.readFileSync(staticAssets['/ritual-assist/astronomy-engine.mjs']);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),require('./fixtures/vedic-ritual-baseline.json').engineSha256);assert.match(bytes.toString().slice(0,1600),/MIT License/);
 assert.equal(Object.keys(staticAssets).some(route=>/rashifal-kundli|\/vedic\b/.test(route)),false);
});
test('P17 compatibility diagnostics do not certify distinct profiles as equivalent',async()=>{
 const {auditRitualCompatibility}=await import('../packages/vedic/ritual-compatibility.mjs');for(const utcInstant of ['1950-06-15T06:45:00Z','2000-01-01T06:45:00Z','2026-09-26T06:45:00Z']){const r=auditRitualCompatibility({utcInstant,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});assert.equal(r.policy.profileEquivalent,false);assert.match(r.policy.calendarSubstitution,/blocked/);assert.ok(Number.isFinite(r.sameUtcDifferenceArcsec));assert.ok(Math.abs(r.alignedTtDifferenceArcsec)>1);assert.match(r.acceptance,/not-equivalent/);}
 assert.throws(()=>auditRitualCompatibility({utcInstant:'2000-01-01T00:00Z',calculationProfileId:'other'}),e=>e.code==='MODEL_UNAVAILABLE');
});
test('P17 all feature/runtime release plans fail closed with explicit unaccepted gates',async()=>{
 const {evaluateVedicRelease,vedicReleasePolicy}=await import('../packages/vedic/release-policy.mjs');for(const runtime of ['node','workers'])for(const feature of Object.keys(vedicReleasePolicy.features)){const r=evaluateVedicRelease({runtime,features:[feature]});assert.equal(r.ready,false);assert.equal(r.status,'blocked');assert.ok(r.missing.some(g=>g.id==='astronomySources'));assert.ok(r.missing.some(g=>g.id==='deployment'));assert.ok(Object.isFrozen(r.missing));}
 for(const input of [{runtime:'workers',features:['kundli'],gates:{astronomySources:true}},{runtime:'other',features:['kundli']},{runtime:'node',features:[]},{runtime:'node',features:['fullShadbala']},{runtime:'node',features:['kundli','kundli']}])assert.throws(()=>evaluateVedicRelease(input));
});
test('P17 preview headers and static allowlist reject bodies/paths without public private-page exposure',async t=>{
 const server=await require('../infrastructure/preview-vedic-charts.cjs').createPreviewServer(0,{birth:true});t.after(()=>server.close());const response=await fetch(server.origin);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);assert.match(response.headers.get('permissions-policy'),/geolocation=\(\)/);
 for(const route of ['/data/chambers.sqlite','/birth.mjs?date=2000','/packages/vedic/normalize.mjs','/../data/records.json'])assert.equal((await fetch(server.origin+route)).status,404);assert.equal((await fetch(server.origin,{method:'POST',body:'private-test-marker'})).status,404);
});
