const {test}=require('node:test'),assert=require('node:assert/strict');
const profile='IN_LAHIRI_DEFAULT_V1',context={now:Date.parse('2026-10-24T12:00Z')};
const input={localDate:'2030-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',calculationProfileId:profile};
const birth={...input,localDate:'2000-01-01',timeAccuracy:'exact'};
test('P13 exploration requires explicit local minute/place and admits future exploration separately from birth',async()=>{
 const {normalizeExploration,explorationSnapshot}=await import('../packages/vedic/exploration-place.mjs'),{normalizeInput}=await import('../packages/vedic/normalize.mjs');
 const n=normalizeExploration(input);assert.equal(n.purpose,'exploration');assert.equal(n.utcInstant,'2030-01-01T06:45:00.000Z');assert.equal(explorationSnapshot(input).positions.positions.length,9);
 assert.throws(()=>normalizeInput({...input,timeAccuracy:'exact'},context),e=>e.code==='OUT_OF_RANGE');
 for(const patch of [{localTime:undefined},{name:'private'},{latitude:28},{purpose:'birth'},{timeAccuracy:'unknown'},{elevationMetres:null},{elevationMetres:undefined},{localDate:'2030-02-30'},{timeZoneId:'UTC'}])assert.throws(()=>normalizeExploration({...input,...patch}));
});
test('P13 positions/Panchang reuse identical P04/P05 snapshots and retain observer partial availability',async()=>{
 const {explorationSnapshot}=await import('../packages/vedic/exploration-place.mjs'),{siderealSnapshot}=await import('../packages/vedic/sidereal.mjs'),{panchangForPlace}=await import('../packages/vedic/panchang-place.mjs');
 const s=explorationSnapshot(input);assert.deepEqual(s.positions,siderealSnapshot({timeScale:'UTC',utcInstant:s.exploration.utcInstant,calculationProfileId:profile}));
 assert.deepEqual(s.panchang.value,panchangForPlace({utcInstant:s.exploration.utcInstant,placeId:input.placeId,calculationProfileId:profile}).panchang);
 const edge=explorationSnapshot({...input,localDate:'1950-01-01',localTime:'03:00'});assert.equal(edge.positions.positions.length,9);assert.equal(edge.panchang.status,'unavailable');assert.equal(edge.panchang.diagnostic.code,'OUT_OF_RANGE');
});
test('P13 all 144 reference-sign counts follow an independently rotated zodiac',async()=>{
 const {relativeSignCount,gocharPlacements}=await import('../packages/vedic/gochar.mjs');
 for(let reference=1;reference<=12;reference++){const ordered=Array.from({length:12},(_,i)=>i+1);const cycle=ordered.slice(reference-1).concat(ordered.slice(0,reference-1));
  for(const [i,rashi]of cycle.entries()){assert.equal(relativeSignCount({rashi,referenceRashi:reference}),i+1);for(const referenceKind of ['moon','lagna'])assert.equal(gocharPlacements({positions:[{body:'Moon',siderealLongitude:(rashi-1)*30+15}],referenceKind,referenceRashi:reference}).rows[0].relativeHouse,i+1);}}
 const near=gocharPlacements({positions:[{body:'Saturn',siderealLongitude:30}],referenceKind:'moon',referenceRashi:1});assert.equal(near.rows[0].relativeHouse,null);assert.equal(near.rows[0].status,'near-model-boundary');
 assert.throws(()=>relativeSignCount({rashi:13,referenceRashi:1}));assert.throws(()=>gocharPlacements({positions:[],referenceKind:'moon',referenceRashi:1}));
});
test('P13 endpoint displacement handles wrap/opposition without inventing motion',async()=>{
 const {compareSiderealPositions:f}=await import('../packages/vedic/gochar.mjs');
 for(const [a,b,expected]of [[359,1,2],[1,359,-2],[0,180,-180],[180,0,-180],[345,15,30],[25,25,0]]){
  const rows=f({birthPositions:[{body:'Moon',siderealLongitude:a}],explorationPositions:[{body:'Moon',siderealLongitude:b}]});assert.equal(rows[0].signedEndpointDifference,expected);
 }
 assert.throws(()=>f({birthPositions:[{body:'Moon',siderealLongitude:1}],explorationPositions:[{body:'Sun',siderealLongitude:2}]}));
});
test('P13 private birth Moon/Lagna references preserve exact admission and independent comparison',async()=>{
 const {explorationWithBirth}=await import('../packages/vedic/birth-gochar.mjs'),{birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs'),{siderealForBirth}=await import('../packages/vedic/birth-positions.mjs');
 for(const referenceKind of ['moon','lagna']){const r=explorationWithBirth(input,birth,{referenceKind},context);assert.equal(r.comparison.length,9);assert.equal(r.gochar.status,'available');
  const expected=referenceKind==='moon'?siderealForBirth(birth,context).sidereal.positions.find(p=>p.body==='Moon').rashi:birthChartForBirth(birth,context).chart.ascendant.rashi;assert.equal(r.gochar.value.referenceRashi,expected);}
 const unknown={...birth,timeAccuracy:'unknown'};delete unknown.localTime;assert.throws(()=>explorationWithBirth(input,unknown,{referenceKind:'moon'},context),e=>e.code==='UNSTABLE_BIRTH_TIME');
 assert.throws(()=>explorationWithBirth(input,{...birth,localDate:'2030-01-01'},{referenceKind:'moon'},context),e=>e.code==='OUT_OF_RANGE');
 assert.throws(()=>explorationWithBirth(input,{...birth,purpose:'exploration'},{referenceKind:'moon'},context),e=>e.code==='INVALID_INPUT');
});
test('P13 app keeps exploration visible when optional birth reference is unavailable; locale is numeric invariant',async()=>{
 const {calculateExplorationReport:f}=await import('../apps/rashifal-kundli/frontend/exploration-report.mjs'),{timeMachineLabels}=await import('../apps/rashifal-kundli/frontend/time-machine-view.mjs');
 const unknown={...birth,timeAccuracy:'unknown'};delete unknown.localTime;const r=f(input,{referenceMode:'birth-moon',birthInput:unknown},context);assert.equal(r.snapshot.positions.positions.length,9);assert.equal(r.gochar.status,'unavailable');assert.equal(r.comparison,null);
 const original=f(input,{referenceMode:'manual-lagna',referenceRashi:12},context);for(const language of ['en','hi','gu']){const translated=f({...input,language},{referenceMode:'manual-lagna',referenceRashi:12},context);assert.deepEqual(translated.snapshot.positions,original.snapshot.positions);assert.deepEqual(translated.gochar,original.gochar);assert.deepEqual(Object.keys(timeMachineLabels[language]),Object.keys(timeMachineLabels.en));}
 assert.throws(()=>f(input,{referenceMode:'none',birthInput:birth},context));assert.throws(()=>f({...input,get secret(){throw Error('private');}},{referenceMode:'none'},context));
});
