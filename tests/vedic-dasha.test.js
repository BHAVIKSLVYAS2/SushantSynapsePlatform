const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const kernel=import('../packages/vedic/dasha.mjs');
const base={birthUtcInstant:'2000-01-01T00:00:00Z',moonSiderealLongitude:0,
 calculationProfileId:'IN_LAHIRI_DEFAULT_V1',yearConventionId:'VIMSHOTTARI_365_25_DAY_V1',timeZoneId:'Asia/Kolkata'};
const code=expected=>e=>e.name==='VedicInputError'&&e.code===expected;
function adjacent(n,up){if(n===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;
 const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,n);v.setBigUint64(0,v.getBigUint64(0)+(up?1n:-1n));return v.getFloat64(0);}

test('all nine lords and 81 Antardashas match independent BigInt rational midpoint fixtures within 1ms',async()=>{
 const run=spawnSync(process.execPath,['infrastructure/prepare-vedic-dasha.cjs','--check'],{encoding:'utf8',windowsHide:true});assert.equal(run.status,0,run.stderr);
 const fixture=require('./fixtures/vedic-dasha/rational.json'),{vimshottariTimeline}=await kernel;
 for(const example of fixture.cases){
  const r=example.moonLongitudeRational,t=vimshottariTimeline({...base,moonSiderealLongitude:r.numerator/r.denominator});
  assert.equal(t.balance.lord,example.lord);assert.equal(t.balance.nakshatra,example.nakshatra);
  assert.ok(Math.abs(t.balance.remainingYears-example.remainingYearsRational.numerator/example.remainingYearsRational.denominator)<1e-12);
  assert.ok(Math.abs(t.birthMahadasha.start.milliseconds-example.startMilliseconds)<=1);
  assert.ok(Math.abs(t.birthMahadasha.end.milliseconds-example.endMilliseconds)<=1);
  for(let i=0;i<9;i++)for(const key of ['start','end'])assert.ok(Math.abs(t.mahadashas[0].antardashas[i][key].milliseconds-example.antardashas[i][key+'Milliseconds'])<=1);
 }
});
test('every Nakshatra edge and its adjacent doubles preserves canonical lord ownership including submillisecond balances',async()=>{
 const {vimshottariBirthBalance,vimshottariTimeline,vimshottariModel}=await kernel;
 for(let i=0;i<27;i++){
  const edge=i*360/27;
  for(const [angle,index]of [[adjacent(edge,false),(i+26)%27],[edge,i],[adjacent(edge,true),i]]){
   const balance=vimshottariBirthBalance(angle);assert.equal(balance.nakshatra,index+1);
   assert.equal(balance.lord,vimshottariModel.lords[index%9].lord);assert.ok(balance.remainingMilliseconds>=1);
   const t=vimshottariTimeline({...base,moonSiderealLongitude:angle});assert.equal(t.active.mahadashaLord,balance.lord);
   assert.ok(t.birthMahadasha.end.milliseconds>Date.parse(base.birthUtcInstant));
  }
 }
 const almost=vimshottariBirthBalance(adjacent(360/27,false));assert.equal(almost.subMillisecondBalanceQuantized,true);
});
test('all periods share exact integer boundaries and sum to the 120-year cycle without Gregorian year addition',async()=>{
 const {vimshottariTimeline,vimshottariModel}=await kernel;
 for(let i=0;i<9;i++){
  const timeline=vimshottariTimeline({...base,moonSiderealLongitude:(i+.37)*360/27});
  assert.equal(timeline.cycle.durationMilliseconds,120*31557600000);
  let total=0;for(let j=0;j<9;j++){
   const m=timeline.mahadashas[j];total+=m.durationMilliseconds;
   assert.equal(m.antardashas.reduce((s,p)=>s+p.durationMilliseconds,0),m.durationMilliseconds);
   assert.equal(m.antardashas[0].lord,m.lord);assert.equal(m.antardashas[0].start.milliseconds,m.start.milliseconds);
   assert.equal(m.antardashas[8].end.milliseconds,m.end.milliseconds);
   if(j)assert.strictEqual(timeline.mahadashas[j-1].end,m.start);
   for(let k=0;k<9;k++){const a=m.antardashas[k];assert.ok(Number.isSafeInteger(a.start.milliseconds));assert.ok(a.start.milliseconds<a.end.milliseconds);
    assert.equal(a.endInclusive,false);if(k)assert.strictEqual(m.antardashas[k-1].end,a.start);}
  }
  assert.equal(total,timeline.cycle.durationMilliseconds);assert.equal(vimshottariModel.daysPerYear,365.25);
 }
 const t=vimshottariTimeline(base);assert.notEqual(t.mahadashas[0].end.utcInstant,'2007-01-01T00:00:00.000Z');
});
test('Antardashas begin at the full pre-birth Mahadasha origin rather than restarting at birth',async()=>{
 const {vimshottariTimeline}=await kernel;
 const t=vimshottariTimeline({...base,moonSiderealLongitude:20/3});
 assert.equal(t.active.mahadashaLord,'Ketu');assert.equal(t.active.antardashaLord,'Rahu');
 assert.equal(t.birthMahadasha.start.utcInstant,'1996-07-01T15:00:00.000Z');
 assert.equal(t.birthMahadasha.end.utcInstant,'2003-07-02T09:00:00.000Z');
 assert.ok(t.mahadashas[0].antardashas[0].end.milliseconds<Date.parse(base.birthUtcInstant));
});
test('all 81 child transitions select the new side exactly at the boundary and report the right next lords',async()=>{
 const {vimshottariTimeline}=await kernel,t=vimshottariTimeline(base);
 for(const major of t.mahadashas)for(const minor of major.antardashas){
  const boundary=minor.end.milliseconds;
  const before=vimshottariTimeline({...base,atUtcInstant:new Date(boundary-1).toISOString()});
  const at=vimshottariTimeline({...base,atUtcInstant:new Date(boundary).toISOString()});
  assert.equal(before.active.mahadashaLord,major.lord);assert.equal(before.active.antardashaLord,minor.lord);
  assert.equal(at.active.mahadashaLord,before.active.nextTransition.nextMahadashaLord);
  assert.equal(at.active.antardashaLord,before.active.nextTransition.nextAntardashaLord);
  assert.equal(before.active.nextTransition.boundary.milliseconds,boundary);
  assert.deepEqual(before.active.nextTransition.changes,minor.index===8?['mahadasha','antardasha']:['antardasha']);
 }
 const nextCycle=vimshottariTimeline({...base,atUtcInstant:t.cycle.end.utcInstant});
 assert.equal(nextCycle.cycleIndex,1);assert.equal(nextCycle.active.mahadashaLord,'Ketu');assert.equal(nextCycle.active.antardashaLord,'Ketu');
});
test('UTC labels are uniform-day arithmetic projections; local boundaries outside pinned civil rules stay unavailable',async()=>{
 const {vimshottariTimeline}=await kernel;
 const t=vimshottariTimeline({...base,moonSiderealLongitude:20/3});
 assert.equal(t.birthMahadasha.start.local.localDateTime,'1996-07-01T20:30:00.000');
 assert.equal(t.birthMahadasha.start.local.timeZoneId,'Asia/Kolkata');assert.equal(t.birthMahadasha.start.local.tzdbVersion,'2025b');
 const past=vimshottariTimeline({...base,birthUtcInstant:'1949-12-31T18:30:00Z',moonSiderealLongitude:20});
 assert.equal(past.birthMahadasha.start.local.status,'unavailable');assert.equal(past.birthMahadasha.start.local.diagnostic.code,'TIME_DATA_UNAVAILABLE');
 const future=vimshottariTimeline({...base,birthUtcInstant:'2098-06-15T00:00:00Z'});
 assert.ok(future.mahadashas.some(m=>m.end.local.status==='unavailable'));
 assert.ok(future.warnings.includes('DASHA_LOCAL_PROJECTION_OUTSIDE_PINNED_CIVIL_RANGE'));
 assert.match(future.model.utcMeaning,/no SI elapsed-time/);
});
test('pure timeline is clock independent, locale independent, immutable and bounded',async()=>{
 const {vimshottariTimeline}=await kernel;const t=vimshottariTimeline(base);
 assert.deepEqual(vimshottariTimeline(base),t);assert.ok(Object.isFrozen(t.mahadashas[0].antardashas[0].start.local));
 assert.equal(t.mahadashas.length,9);assert.equal(t.mahadashas.flatMap(m=>m.antardashas).length,81);
 assert.throws(()=>vimshottariTimeline({...base,atUtcInstant:'1999-12-31T23:59:59.999Z'}),code('OUT_OF_RANGE'));
 assert.throws(()=>vimshottariTimeline({...base,atUtcInstant:t.queryCoverage.endUtcInstant}),code('OUT_OF_RANGE'));
 assert.throws(()=>vimshottariTimeline({...base,birthUtcInstant:'2098-12-31T18:30:00Z'}),code('OUT_OF_RANGE'));
});
test('birth bridge admits exact Moon with provenance, defaults query to explicit now and withholds unknown/approximate inputs',async()=>{
 const {vimshottariForBirth}=await import('../packages/vedic/birth-dasha.mjs');
 const input={localDate:'2000-01-01',localTime:'12:00',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:base.calculationProfileId};
 const context={now:Date.parse('2026-10-24T12:00:00Z')};
 const result=vimshottariForBirth(input,context);assert.equal(result.moon.positions.length,1);
 assert.equal(result.timeline.active.atUtcInstant,'2026-10-24T12:00:00.000Z');
 assert.equal(result.timeline.birthTimeStability,'not-evaluated');assert.ok(result.warnings.includes('APPROXIMATE_PLACE_COORDINATES'));
 for(const language of ['hi','gu'])assert.deepEqual(vimshottariForBirth({...input,language},context).timeline,result.timeline);
 for(const accuracy of ['approximate','unknown']){const p={...input,timeAccuracy:accuracy};if(accuracy==='unknown')delete p.localTime;else p.precisionOfBirthTimeMinutes=5;
  assert.throws(()=>vimshottariForBirth(p,context),code('UNSTABLE_BIRTH_TIME'));}
 assert.throws(()=>vimshottariForBirth(input,context,{yearConventionId:null}),code('MODEL_UNAVAILABLE'));
 assert.throws(()=>vimshottariForBirth({...input,localDate:'2098-01-01'},context),code('OUT_OF_RANGE'));
});
test('birth bridge withholds minute-resolution Moon near a Nakshatra crossing',async()=>{
 const {panchangSnapshot}=await import('../packages/vedic/panchang.mjs');
 const {vimshottariForBirth}=await import('../packages/vedic/birth-dasha.mjs');
 const event=panchangSnapshot({timeScale:'UTC',utcInstant:'2000-01-01T00:00:00Z',calculationProfileId:base.calculationProfileId}).nextTransitions.nakshatra;
 const local=new Date(Date.parse(event.utcInstant)+330*60000).toISOString();
 const input={localDate:local.slice(0,10),localTime:local.slice(11,16),placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:base.calculationProfileId};
 assert.throws(()=>vimshottariForBirth(input,{now:Date.parse('2026-10-24T12:00:00Z')}),code('UNSTABLE_BIRTH_TIME'));
});
test('unsupported conventions, malformed instants, extra fields and accessors use fixed safe diagnostics',async()=>{
 const {vimshottariTimeline}=await kernel;
 for(const change of [{yearConventionId:'360-day'},{yearConventionId:undefined},{timeZoneId:'UTC'},
  {calculationProfileId:'other'},{moonSiderealLongitude:NaN},{birthUtcInstant:'private-name'},
  {birthUtcInstant:'2000-02-30T00:00:00Z'},{atUtcInstant:'2016-12-31T23:59:60Z'},{name:'private-name'}]){
  assert.throws(()=>vimshottariTimeline({...base,...change}),e=>e.name==='VedicInputError'&&!JSON.stringify(e).includes('private-name'));
 }
 const getter={...base};Object.defineProperty(getter,'moonSiderealLongitude',{get(){throw Error('must not run');}});
 assert.throws(()=>vimshottariTimeline(getter),code('INVALID_INPUT'));
});
test('saved independent arithmetic report reproduces across 27 starts and all annual birth Moon samples',async()=>{
 assert.deepEqual(await require('../infrastructure/verify-vedic-dasha.cjs').buildReport(),JSON.parse(fs.readFileSync('docs/vedic/P08_REFERENCE_RESULTS.json')));
});
