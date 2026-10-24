const {test}=require('node:test'),assert=require('node:assert/strict');
const profile='IN_LAHIRI_DEFAULT_V1',base={timeScale:'UTC',utcInstant:'2000-01-01T06:30:00Z',latitude:28.6139,longitude:77.209,calculationProfileId:profile};
const modulePromise=import('../packages/vedic/d9.mjs');
function adjacent(value,up){if(value===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;
 const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,value);v.setBigUint64(0,v.getBigUint64(0)+(up?1n:-1n));return v.getFloat64(0);}
test('all 108 D9 divisions match the separately enumerated movable/fixed/dual table',async()=>{
 const {navamsaForLongitude:f}=await modulePromise,reference=require('./fixtures/vedic-d9/mapping.json');
 for(let sign=0;sign<12;sign++)for(let part=0;part<9;part++){
  const p=f(sign*30+(part+.5)*360/108);
  assert.equal(p.sourceRashi,sign+1);assert.equal(p.divisionWithinRashi,part+1);
  assert.equal(p.rashi,reference.signsByNatalRashi[sign][part]);
 }
 // Element/modality examples independent of the continuous harmonic shortcut.
 assert.equal(f(12.25).rashi,4);assert.equal(f(120+13).rashi,4);assert.equal(f(240+21+55/60).rashi,7);
});
test('every canonical Navamsa boundary classifies adjacent doubles without multiply-nine rounding errors',async()=>{
 const {navamsaForLongitude:f}=await modulePromise;
 for(let i=0;i<108;i++){
  const edge=i*360/108;
  for(const [angle,index]of [[adjacent(edge,false),(i+107)%108],[edge,i],[adjacent(edge,true),i]]){
   const p=f(angle);assert.equal(p.divisionIndex,index,`${i}: ${angle}`);assert.equal(p.rashi,index%12+1);assert.ok(p.nearBoundary);
  }
 }
 for(const angle of [NaN,Infinity,'30',null,undefined])assert.throws(()=>f(angle),e=>e.code==='INVALID_INPUT');
});
test('D9 uses its own ascendant/sign houses and retains source longitudes without fabricating physical coordinates',async()=>{
 const {divisionalChartsAtInstant}=await modulePromise;const {d1,d9}=divisionalChartsAtInstant(base);
 assert.equal(d9.chartType,'D9');assert.equal(d9.houses[0].rashi,d9.ascendant.rashi);
 assert.notEqual(d1.ascendant.rashi,d9.ascendant.rashi);
 for(const p of d9.planets){const original=d1.planets.find(b=>b.body===p.body);
  assert.equal(p.sourceSiderealLongitude,original.siderealLongitude);assert.equal(p.sourceRashi,original.rashi);
  assert.equal(d9.houses[p.houseNumber-1].rashi,p.rashi);assert.ok(d9.houses[p.houseNumber-1].bodies.includes(p.body));
  assert.equal(Object.hasOwn(p,'siderealLongitude'),false);assert.equal(p.kind,original.kind);
 }
 assert.equal(d9.birthTimeStability,'not-evaluated');assert.ok(Object.isFrozen(d9.houses[0].bodies));
 const ra=d9.planets.find(p=>p.body==='Rahu'),ke=d9.planets.find(p=>p.body==='Ketu');assert.equal((ke.houseNumber-ra.houseNumber+12)%12,6);
});
test('D9 birth bridge withholds unknown/approximate and D9-boundary minutes even when D1 passes',async()=>{
 const {birthChartsForBirth}=await import('../packages/vedic/birth-divisions.mjs');
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs');
 const input={localDate:'2000-01-01',localTime:'12:00',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:profile};
 const context={now:Date.parse('2026-10-24T12:00:00Z')};
 for(const accuracy of ['unknown','approximate']){const p={...input,timeAccuracy:accuracy};if(accuracy==='unknown')delete p.localTime;else p.precisionOfBirthTimeMinutes=5;
  assert.throws(()=>birthChartsForBirth(p,context),e=>e.code==='UNSTABLE_BIRTH_TIME');}
 let foundSafe=false,foundWithheld=false;
 for(let minute=0;minute<120;minute+=5){const localTime=String(12+Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),p={...input,localTime};
  try{birthChartForBirth(p,context);}catch{continue;}
  try{const result=birthChartsForBirth(p,context);assert.equal(result.d9.chartType,'D9');foundSafe=true;}
  catch(error){assert.equal(error.code,'UNSTABLE_BIRTH_TIME');foundWithheld=true;}
 }
 assert.ok(foundSafe);assert.ok(foundWithheld);
});
test('both visual styles consume a validated model and reject inconsistent placements or injected body names',async()=>{
 const {divisionalChartsAtInstant}=await modulePromise;const {chartViewModel,northCells,southCells}=await import('../apps/rashifal-kundli/frontend/chart-model.mjs');
 const charts=divisionalChartsAtInstant(base);
 for(const chart of [charts.d1,charts.d9]){
  const model=chartViewModel(chart);assert.equal(model.houses.length,12);assert.equal(model.planets.length,9);
  assert.equal(model.houses[0].rashi,chart.ascendant.rashi);
  const bad=structuredClone(chart);bad.planets[0].body='<img src=x onerror=alert(1)>';assert.throws(()=>chartViewModel(bad));
  const inconsistent=structuredClone(chart);inconsistent.houses[0].rashi=99;assert.throws(()=>chartViewModel(inconsistent));
 }
 assert.equal(northCells.length,12);assert.equal(new Set(northCells.map(x=>x[0])).size,12);
 assert.deepEqual(southCells[0],[1,0]);assert.deepEqual(southCells[11],[0,0]);
});
test('D1 and D9 remain consistent across 149 annual samples and six cities; saved report reproduces',async()=>{
 assert.deepEqual(await require('../infrastructure/verify-vedic-d9.cjs').buildReport(),require('../docs/vedic/P07_REFERENCE_RESULTS.json'));
});
