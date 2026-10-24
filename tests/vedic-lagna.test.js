const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const profile='IN_LAHIRI_DEFAULT_V1',base={timeScale:'UTC',utcInstant:'2000-01-01T06:30:00Z',latitude:28.6139,longitude:77.209,calculationProfileId:profile};
const lagna=import('../packages/vedic/lagna.mjs'),charts=import('../packages/vedic/d1.mjs');
const circular=(a,b)=>Math.abs(((a-b+540)%360)-180);
const code=expected=>e=>e.name==='VedicInputError'&&e.code===expected;
test('pinned ERFA sidereal-time sources and published numerical expectations reproduce offline',async()=>{
 const run=spawnSync(process.execPath,['infrastructure/prepare-vedic-lagna.cjs','--check'],{encoding:'utf8',windowsHide:true});
 assert.equal(run.status,0,run.stderr);
 const facts=JSON.parse(fs.readFileSync('tests/fixtures/vedic-lagna/erfa-reference.json'));
 const {greenwichMeanSidereal1982:g,equationEquinoxes1994:e}=await import('../packages/vedic/sidereal-time.mjs');
 assert.ok(Math.abs(g(facts.gmst82.ut1JulianDay)*Math.PI/180-facts.gmst82.radians)<1e-12);
 assert.ok(Math.abs(e(facts.eqeq94.ttJulianDay)-facts.eqeq94.radians)<1e-16);
 const f=facts.gst94SameScaleReference;
 assert.ok(Math.abs(g(f.ut1JulianDay)*Math.PI/180+e(f.ttJulianDay)-f.radians)<1e-12);
});
test('eastern horizon cardinal goldens select rising rather than the antipodal setting solution',async()=>{
 const {ascendantGeometry}=await lagna;
 for(const [theta,expected] of [[0,90],[90,180],[180,270],[270,0]]){
  const g=ascendantGeometry({localApparentDegrees:theta,latitude:0,trueObliquityDegrees:23.439291111});
  assert.ok(circular(g.tropicalLongitude,expected)<1e-10);assert.ok(g.eastProjection>0);
  assert.ok(Math.abs(g.horizonResidual)<1e-12);
 }
 const n=ascendantGeometry({localApparentDegrees:10,latitude:28,trueObliquityDegrees:23.4});
 const s=ascendantGeometry({localApparentDegrees:190,latitude:-28,trueObliquityDegrees:23.4});
 assert.ok(circular(n.tropicalLongitude+180,s.tropicalLongitude)<1e-10);
});
test('saved report reproduces independent horizon roots and full-range D1 consistency',async()=>{
 assert.deepEqual(await require('../infrastructure/verify-vedic-lagna.cjs').buildReport(),
  JSON.parse(fs.readFileSync('docs/vedic/P06_REFERENCE_RESULTS.json')));
});
test('Lagna uses apparent sidereal time, true obliquity and true Lahiri exactly once',async()=>{
 const {lagnaAtInstant}=await lagna;const a=lagnaAtInstant(base);
 const {meanObliquity1980,nutation1980,DEG}=await import('../packages/vedic/iau1976.mjs');
 assert.equal(a.geometry.trueObliquityDegrees,(meanObliquity1980(a.time.ttJulianDay)+nutation1980(a.time.ttJulianDay).obliquityRadians)/DEG);
 assert.ok(circular(a.siderealLongitude,a.tropicalLongitude-a.ayanamsha.trueDegrees)<1e-10);
 assert.ok(circular(a.siderealTime.localApparentDegrees,a.siderealTime.greenwichApparentDegrees+base.longitude)<1e-10);
 assert.ok(Math.abs(a.ayanamsha.nutationDegrees)>0.001);
 assert.equal(a.birthTimeStability,'not-evaluated');assert.equal(a.model.refraction,false);
 const elevated=lagnaAtInstant({...base,elevationMetres:3500});assert.equal(a.siderealLongitude,elevated.siderealLongitude);
});
test('modelled UT1 drives Earth rotation and historical/future warnings remain explicit',async()=>{
 const {lagnaAtInstant}=await lagna;
 const {greenwichMeanSidereal1982}=await import('../packages/vedic/sidereal-time.mjs');
 const future=lagnaAtInstant({...base,utcInstant:'2098-06-15T06:30:00Z'});
 assert.equal(future.siderealTime.greenwichMeanDegrees,greenwichMeanSidereal1982(future.time.ut1JulianDayModelled));
 assert.ok(circular(future.siderealTime.greenwichMeanDegrees,greenwichMeanSidereal1982(future.time.civilJulianDay))*3600>60);
 assert.ok(future.warnings.includes('LEAP_SECOND_TABLE_EXPIRED_FOR_INSTANT'));
 const past=lagnaAtInstant({...base,utcInstant:'1950-06-15T06:30:00Z'});
 assert.ok(past.warnings.includes('PRE_1972_CIVIL_AS_UT1_APPROXIMATION'));
});
test('whole-sign houses use sign starts, preserve Pisces/Aries wrapping and exact half-open edges',async()=>{
 const {wholeSignHouses,wholeSignHouseForLongitude:h}=await charts;
 for(let rising=1;rising<=12;rising++){
  const a=(rising-1)*30+17,rows=wholeSignHouses(a);
  assert.equal(rows[0].rashi,rising);assert.equal(rows[0].startSiderealLongitude,(rising-1)*30);
  assert.notEqual(rows[0].startSiderealLongitude,a);assert.equal(new Set(rows.map(r=>r.rashi)).size,12);
  for(const row of rows){
   assert.equal(h({lagnaSiderealLongitude:a,siderealLongitude:row.startSiderealLongitude}),row.houseNumber);
   assert.equal(row.endInclusive,false);
   const before=row.startSiderealLongitude===0?-Number.MIN_VALUE:row.startSiderealLongitude-1e-10;
   assert.equal(h({lagnaSiderealLongitude:a,siderealLongitude:before}),(row.houseNumber+10)%12+1);
  }
 }
 assert.equal(h({lagnaSiderealLongitude:359.9,siderealLongitude:0}),2);
 assert.equal(h({lagnaSiderealLongitude:0,siderealLongitude:359.9}),12);
});
test('D1 planet table and twelve house occupancy agree including mean nodes',async()=>{
 const {d1ChartAtInstant}=await charts;const c=d1ChartAtInstant(base);
 assert.equal(c.chartType,'D1');assert.equal(c.houseSystem,'whole-sign');assert.equal(c.planets.length,9);
 const occupants=c.houses.flatMap(h=>h.bodies);assert.equal(new Set(occupants).size,9);
 for(const p of c.planets){assert.equal(c.houses[p.houseNumber-1].rashi,p.rashi);assert.ok(occupants.includes(p.body));}
 const rahu=c.planets.find(p=>p.body==='Rahu'),ketu=c.planets.find(p=>p.body==='Ketu');
 assert.equal(rahu.kind,'computed-mean-lunar-node');assert.equal(rahu.eclipticLatitude,null);
 assert.equal((ketu.houseNumber-rahu.houseNumber+12)%12,6);
 assert.ok(Object.isFrozen(c.houses[0].bodies));assert.ok(Object.isFrozen(c.planets));
});
test('minute-scale rising-sign boundaries change at +/-5 and +/-10 minutes; birth bridge withholds nearby minutes',async()=>{
 const {lagnaAtInstant}=await lagna;const start=Date.parse('2000-01-01T00:00:00Z');
 const at=ms=>lagnaAtInstant({...base,utcInstant:new Date(ms).toISOString()});
 let left=start,right,previous=at(left).rashi;
 for(let i=1;i<=144;i++){
  const ms=start+i*10*60000;
  if(at(ms).rashi!==previous){right=ms;break;}left=ms;
 }
 assert.ok(right);
 for(let i=0;i<25&&right-left>20;i++){const mid=Math.floor((left+right)/2);if(at(mid).rashi===previous)left=mid;else right=mid;}
 for(const minutes of [5,10])assert.notEqual(at(left-minutes*60000).rashi,at(right+minutes*60000).rashi);
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs');
 const local=new Date(right+330*60000).toISOString();
 const input={localDate:local.slice(0,10),localTime:local.slice(11,16),placeId:'geonames:1261481',
  timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:profile};
 assert.throws(()=>birthChartForBirth(input,{now:Date.parse('2026-10-24T12:00:00Z')}),code('UNSTABLE_BIRTH_TIME'));
});
test('birth bridge normalizes exact place/time and refuses approximate or unknown chart precision',async()=>{
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs');
 const input={localDate:'2000-01-01',localTime:'12:00',placeId:'geonames:1261481',
  timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:profile};
 const context={now:Date.parse('2026-10-24T12:00:00Z')};
 const r=birthChartForBirth(input,context);assert.equal(r.chart.houseSystem,'whole-sign');
 assert.equal(r.birth.precisionClass,'minute-resolution');assert.equal(r.chart.birthTimeStability,'not-evaluated');
 assert.ok(r.warnings.includes('APPROXIMATE_PLACE_COORDINATES'));
 assert.throws(()=>birthChartForBirth({...input,timeAccuracy:'approximate',precisionOfBirthTimeMinutes:5},context),code('UNSTABLE_BIRTH_TIME'));
 const unknown={...input,timeAccuracy:'unknown'};delete unknown.localTime;
 assert.throws(()=>birthChartForBirth(unknown,context),code('UNSTABLE_BIRTH_TIME'));
 assert.throws(()=>birthChartForBirth({...input,localDate:'2098-01-01'},context),code('OUT_OF_RANGE'));
 assert.throws(()=>birthChartForBirth({...input,latitude:28},context),code('INVALID_INPUT'));
});
test('polar/near-degenerate geometries are safely unavailable without an antipodal fallback',async()=>{
 const {ascendantGeometry,lagnaAtInstant}=await lagna;
 for(const latitude of [67,-67,90,-90,66.560708889])assert.throws(()=>ascendantGeometry({latitude,
  localApparentDegrees:270,trueObliquityDegrees:23.439291111}),code('LAGNA_UNAVAILABLE'));
 assert.throws(()=>lagnaAtInstant({...base,latitude:90}),code('LAGNA_UNAVAILABLE'));
});
test('strict fields and unsupported house systems fail safely without accessors or private input leaks',async()=>{
 const {d1ChartAtInstant}=await charts;const {lagnaAtInstant}=await lagna;
 for(const change of [{houseSystem:'placidus'},{calculationProfileId:'other'},{utcInstant:'private-name'},
  {latitude:NaN},{longitude:181},{elevationMetres:null},{elevationMetres:undefined},{elevationMetres:Infinity},
  {julianDay:2451545},{name:'private-name'}])assert.throws(()=>d1ChartAtInstant({...base,...change}),
  e=>e.name==='VedicInputError'&&!JSON.stringify(e).includes('private-name'));
 const accessor={...base};Object.defineProperty(accessor,'latitude',{get(){throw Error('must not run')}});
 assert.throws(()=>lagnaAtInstant(accessor),code('INVALID_INPUT'));
});
