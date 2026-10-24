const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},context={now:Date.parse('2026-10-24T12:00Z')};
const day=86400000;
test('P14 constant envelopes certify a sector only when the full guarded interval fits',async()=>{
 const {coverSectorInterval:cover,summarizeSectorCover:summary}=await import('../packages/vedic/interval-sectors.mjs');
 const options={startMilliseconds:0,endMilliseconds:60000,endInclusive:false,maximumRateDegreesPerDay:0,guardArcsec:61};
 const constant=cover(options,()=>15);assert.equal(summary(constant,{sectorCount:12}).status,'stable');assert.deepEqual(summary(constant,{sectorCount:12}).possibleValues,[1]);
 const boundary=summary(cover({...options,maximumCells:1},()=>30),{sectorCount:12});assert.equal(boundary.status,'unsupported');assert.deepEqual(boundary.possibleValues,[1,2]);
 assert.equal(summary(cover(options,()=>359),{sectorCount:12}).possibleValues[0],12);
});
test('P14 internal excursions with equal endpoints and midpoint are detected by complete enclosures',async()=>{
 const {coverSectorInterval:cover,summarizeSectorCover:summary}=await import('../packages/vedic/interval-sectors.mjs');
 const wave=t=>10+40*Math.sin(2*Math.PI*t/day);assert.ok(Math.abs(wave(0)-wave(day))<1e-10);assert.ok(Math.abs(wave(day/2)-wave(0))<1e-10);
 const c=cover({startMilliseconds:0,endMilliseconds:day,endInclusive:false,maximumRateDegreesPerDay:252,guardArcsec:0,minimumWindowMilliseconds:1000},wave),s=summary(c,{sectorCount:12});
 assert.equal(s.status,'changes-within-interval');for(const v of [1,2,12])assert.ok(s.provedValues.includes(v));
 const roots=[day/12,day*5/12,(Math.PI+Math.asin(.25))/(2*Math.PI)*day,(2*Math.PI-Math.asin(.25))/(2*Math.PI)*day];
 for(const root of roots)assert.ok(s.possibleBoundaryWindows.some(w=>Date.parse(w.startUtc)<=root&&Date.parse(w.endUtc)>=root),String(root));
});
test('P14 tangent/budget ambiguity stays unresolved and every time cell remains covered',async()=>{
 const {coverSectorInterval:cover,summarizeSectorCover:summary}=await import('../packages/vedic/interval-sectors.mjs');
 const c=cover({startMilliseconds:0,endMilliseconds:day,endInclusive:true,maximumRateDegreesPerDay:1000,guardArcsec:61,maximumCells:5},()=>30.001);
 assert.equal(c.cells[0].startMilliseconds,0);assert.equal(c.cells.at(-1).endMilliseconds,day);for(let i=1;i<c.cells.length;i++)assert.equal(c.cells[i-1].endMilliseconds,c.cells[i].startMilliseconds);
 assert.equal(c.budgetLimited,true);assert.notEqual(summary(c,{sectorCount:12}).status,'stable');
 const tangent=cover({startMilliseconds:0,endMilliseconds:60000,endInclusive:true,maximumRateDegreesPerDay:10000,guardArcsec:0,maximumCells:1000},t=>30+(t/60000-.5)**2);
 assert.equal(summary(tangent,{sectorCount:12}).status,'unsupported');
});
test('P14 sample-budget failures use parent envelopes without inventing stability',async()=>{
 const {coverSectorInterval:cover,summarizeSectorCover:summary}=await import('../packages/vedic/interval-sectors.mjs'),{fail}=await import('../packages/vedic/diagnostics.mjs');let calls=0;
 const c=cover({startMilliseconds:0,endMilliseconds:60000,endInclusive:false,maximumRateDegreesPerDay:1000,guardArcsec:61},()=>{if(++calls>2)fail('COMPUTATION_LIMIT');return 30;});
 assert.equal(c.coverage,'complete-closed-envelope-cover');assert.equal(c.budgetLimited,true);assert.equal(summary(c,{sectorCount:12}).status,'unsupported');
});
test('P14 exact-minute and approximate intervals give feature-specific candidate results',async()=>{
 const {sensitivityForBirth}=await import('../packages/vedic/birth-sensitivity.mjs');
 const exact=sensitivityForBirth(input,context);assert.equal(Date.parse(exact.analysis.interval.endUtc)-Date.parse(exact.analysis.interval.startUtc),60000);assert.equal(exact.analysis.interval.endInclusive,false);assert.equal(exact.analysis.d1.status,'stable');
 const approximate=sensitivityForBirth({...input,timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},context);assert.equal(approximate.analysis.interval.endInclusive,true);assert.equal(approximate.analysis.moonRashi.status,'stable');assert.equal(approximate.analysis.lagnaRashi.status,'stable');assert.equal(approximate.analysis.d9.status,'changes-within-interval');assert.ok(approximate.analysis.lagnaD9.possibleBoundaryWindows.length>0);
});
test('P14 unknown day finds internal Lagna/D9 changes without a noon chart or singular Dasha',async()=>{
 const {sensitivityForBirth}=await import('../packages/vedic/birth-sensitivity.mjs');const unknown={...input,timeAccuracy:'unknown'};delete unknown.localTime;
 const r=sensitivityForBirth(unknown,context),a=r.analysis;assert.equal(r.birth.utcInstant,null);assert.equal(r.birth.localTime,null);assert.equal(a.interval.endInclusive,false);assert.equal(a.moonRashi.status,'stable');assert.equal(a.moonNakshatra.status,'changes-within-interval');assert.equal(a.lagnaRashi.status,'changes-within-interval');assert.deepEqual(a.lagnaRashi.possibleValues,[1,2,3,4,5,6,7,8,9,10,11,12]);
 assert.equal(a.d9.status,'changes-within-interval');assert.equal(a.dasha.timeline,'withheld-no-single-birth-epoch');assert.equal(a.dasha.remainingYearsRange,null);assert.ok(a.evaluations<=a.model.maximumEvaluations);assert.ok(!JSON.stringify(a).includes('sampleMilliseconds'));assert.equal(a.utcInstant,undefined);
});
test('P14 rejects future/purpose overrides and withholds time-model discontinuities',async()=>{
 const {sensitivityForBirth:f}=await import('../packages/vedic/birth-sensitivity.mjs');
 assert.throws(()=>f({...input,purpose:'exploration'},context),e=>e.code==='INVALID_INPUT');assert.throws(()=>f({...input,elevationMetres:undefined},context));
 assert.throws(()=>f(input,{now:Date.parse('2000-01-01T06:45:20Z')}),e=>e.code==='OUT_OF_RANGE');
 for(const localDate of ['2017-01-01','2005-01-15']){const p={...input,localDate,timeAccuracy:'unknown'};delete p.localTime;assert.throws(()=>f(p,context),e=>e.code==='TIME_DATA_UNAVAILABLE');}
});
test('P14 polar Lagna remains unsupported while Moon/balance enclosures stay usable',async()=>{
 const {analyzeSensitivityInterval}=await import('../packages/vedic/sensitivity.mjs'),{siderealSnapshot}=await import('../packages/vedic/sidereal.mjs'),{vimshottariBirthBalance}=await import('../packages/vedic/dasha.mjs');
 const a=analyzeSensitivityInterval({startUtc:'2000-01-01T06:45:00Z',endUtc:'2000-01-01T06:46:00Z',endInclusive:false,latitude:75,longitude:77,elevationMetres:0,calculationProfileId:input.calculationProfileId});assert.equal(a.lagnaRashi.status,'unsupported');assert.equal(a.lagnaRashi.diagnostic.code,'LAGNA_UNAVAILABLE');assert.equal(a.moonRashi.status,'stable');
 for(const utcInstant of ['2000-01-01T06:45:00Z','2000-01-01T06:45:30Z','2000-01-01T06:46:00Z']){const moon=siderealSnapshot({timeScale:'UTC',utcInstant,bodies:['Moon'],calculationProfileId:input.calculationProfileId}).positions[0];const years=vimshottariBirthBalance(moon.siderealLongitude).remainingYears;assert.ok(years>=a.dasha.remainingYearsRange[0]&&years<=a.dasha.remainingYearsRange[1]);}
});
