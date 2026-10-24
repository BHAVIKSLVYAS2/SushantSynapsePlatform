const {test}=require('node:test'),assert=require('node:assert/strict');
const profile='IN_LAHIRI_DEFAULT_V1',site={latitude:28.6139,longitude:77.209,timeZoneId:'Asia/Kolkata'};
const kernel=import('../packages/vedic/panchang.mjs'),observer=import('../packages/vedic/panchang-observer.mjs');
function adjacent(value,up){
 if(value===0)return up?Number.MIN_VALUE:-Number.MIN_VALUE;
 const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,value);v.setBigUint64(0,v.getBigUint64(0)+(up?1n:-1n));return v.getFloat64(0);
}
test('every half-open tithi, nakshatra, Pada, yoga and Karana boundary uses unrounded angles',async()=>{
 const {classifyPanchangAngles:c}=await kernel;
 for(const [count,kind] of [[30,'tithi'],[27,'nakshatra'],[27,'yoga'],[60,'karana'],[108,'pada']])for(let i=0;i<count;i++){
  const edge=i*360/count;
  for(const [angle,expected] of [[adjacent(edge,false),(i+count-1)%count],[edge,i],[adjacent(edge,true),i]]){
   const p=c({elongation:angle,moonSidereal:angle,yogaAngle:angle});
   const actual=kind==='karana'?p.karana.halfTithiIndex:kind==='pada'?(p.nakshatra.number-1)*4+p.nakshatra.pada-1:p[kind].number-1;
   assert.equal(actual,expected,`${kind} ${i} ${angle}`);
  }
 }
});
test('all sixty Karana slots preserve fixed ends and eight seven-name cycles',async()=>{
 const {classifyPanchangAngles:c}=await kernel;
 const moving=['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
 const names=Array.from({length:60},(_,k)=>c({elongation:k*6+3,moonSidereal:0,yogaAngle:0}).karana.name);
 assert.equal(names[0],'Kimstughna');assert.deepEqual(names.slice(57),['Shakuni','Chatushpada','Naga']);
 for(const name of moving)assert.equal(names.filter(n=>n===name).length,8);
 for(let k=1;k<57;k++)assert.equal(names[k],moving[(k-1)%7]);
});
test('published facts and annual crossing brackets reproduce the saved P05 report offline',async()=>{
 const actual=await require('../infrastructure/verify-vedic-panchang.cjs').buildReport();
 assert.deepEqual(actual,require('../docs/vedic/P05_REFERENCE_RESULTS.json'));
 assert.equal(actual.published.length,15);assert.equal(actual.internalConsistency.crossings,596);
});
test('TT inversion round-trips civil UTC rather than treating engine UT1 as UTC',async()=>{
 const {resolveAstronomyTime,civilInstantFromTT,engineTime}=await import('../packages/vedic/astronomy-time.mjs');
 for(const utcInstant of ['1950-01-01T00:00:00Z','1965-06-15T12:34:56.789Z',
  '1972-01-01T00:00:00Z','2016-12-31T23:59:59.999Z','2017-01-01T00:00:00Z',
  '2026-09-26T00:41:32.662Z','2098-12-31T12:00:00Z']){
  const time=resolveAstronomyTime({timeScale:'UTC',utcInstant});
  const inverse=civilInstantFromTT(time.ttJulianDay);
  assert.ok(Math.abs(Date.parse(inverse.utcInstant)-Date.parse(utcInstant))<=1);
  assert.deepEqual(inverse.time.warnings,time.warnings);
 }
 const modern=resolveAstronomyTime({timeScale:'UTC',utcInstant:'2098-06-01T00:00:00Z'});
 assert.ok(Math.abs(+engineTime(modern.ttJulianDay).date-Date.parse(modern.utcInstant))>1000);
 const before=resolveAstronomyTime({timeScale:'UTC',utcInstant:'2016-12-31T23:59:59.999Z'});
 assert.throws(()=>civilInstantFromTT(before.ttJulianDay+0.5/86400),e=>e.code==='TIME_DATA_UNAVAILABLE');
});
test('instant civil Vara differs before sunrise and switches at the reported sunrise millisecond',async()=>{
 const {panchangAtInstant,sunriseOnCivilDay}=await observer;
 const rise=sunriseOnCivilDay({...site,localDate:'2026-09-26'}),ms=Date.parse(rise.utcInstant);
 for(const [delta,expected] of [[-1,true],[0,false],[1,false]]){
  const p=panchangAtInstant({...site,utcInstant:new Date(ms+delta).toISOString(),calculationProfileId:profile});
  assert.equal(p.beforeSunrise,expected);assert.equal(p.civilVara.name,'Saturday');
  assert.equal(p.sunriseVara.name,expected?'Friday':'Saturday');
  assert.equal(p.sunriseDate,expected?'2026-09-25':'2026-09-26');
  assert.equal(p.observanceRule,null);
 }
});
test('sunrise Panchang stays separate from instant Panchang and does not imply festival selection',async()=>{
 const {panchangAtInstant,panchangBySunrise}=await observer;
 const day=panchangBySunrise({...site,localDate:'2026-09-26',calculationProfileId:profile});
 const late=panchangAtInstant({...site,utcInstant:'2026-09-26T18:00:00Z',calculationProfileId:profile});
 assert.equal(day.basis,'sunrise-day');assert.equal(day.atSunrise.limbs.tithi.number,15);
 assert.equal(late.atInstant.limbs.tithi.number,16);assert.equal(day.sunriseVara.name,'Saturday');
 assert.equal(day.dayInterval.endInclusive,false);assert.ok(day.warnings.includes('NO_FESTIVAL_OR_BIRTHDAY_RULE_APPLIED'));
 assert.equal(day.observanceRule,null);assert.ok(Object.isFrozen(day.atSunrise.limbs));
});
test('polar missing sunrise and unsupported adjacent day withhold values with safe typed diagnostics',async()=>{
 const {sunriseOnCivilDay,panchangAtInstant,panchangBySunrise}=await observer;
 for(const latitude of [90,-90])assert.throws(()=>sunriseOnCivilDay({...site,latitude,localDate:'2026-06-21'}),e=>e.code==='SUNRISE_UNAVAILABLE');
 assert.throws(()=>panchangAtInstant({...site,utcInstant:'1949-12-31T19:00:00Z',calculationProfileId:profile}),e=>e.code==='OUT_OF_RANGE');
 assert.throws(()=>panchangBySunrise({...site,localDate:'2098-12-31',calculationProfileId:profile}),e=>e.code==='OUT_OF_RANGE');
});
test('declared elevation uses ground atmosphere, no invented horizon dip; model warnings survive',async()=>{
 const {sunriseOnCivilDay}=await observer;
 const low=sunriseOnCivilDay({...site,localDate:'2026-06-21'});
 const high=sunriseOnCivilDay({...site,localDate:'2026-06-21',elevationMetres:3500});
 assert.ok(low.warnings.includes('SEA_LEVEL_ASSUMED'));assert.ok(!high.warnings.includes('SEA_LEVEL_ASSUMED'));
 assert.equal(high.model.horizonDipDegrees,0);assert.notEqual(high.utcInstant,low.utcInstant);
 const future=sunriseOnCivilDay({...site,localDate:'2098-06-21'});
 assert.ok(future.warnings.includes('LEAP_SECOND_TABLE_EXPIRED_FOR_INSTANT'));
 const past=sunriseOnCivilDay({...site,localDate:'1950-06-21'});
 assert.ok(past.warnings.includes('PRE_1972_CIVIL_AS_UT1_APPROXIMATION'));
});
test('public place bridge admits supported IDs only and does not accept coordinate overrides',async()=>{
 const {panchangForPlace}=await import('../packages/vedic/panchang-place.mjs');
 const input={placeId:'geonames:1261481',localDate:'2026-09-26',calculationProfileId:profile};
 const result=panchangForPlace(input);assert.equal(result.place.countryCode,'IN');
 assert.ok(result.warnings.includes('APPROXIMATE_SETTLEMENT_COORDINATES'));
 assert.throws(()=>panchangForPlace({...input,latitude:28}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>panchangForPlace({...input,utcInstant:'2026-09-26T12:00:00Z'}),e=>e.code==='INVALID_INPUT');
 assert.throws(()=>panchangForPlace({...input,placeId:'New Delhi'}),e=>e.code==='UNKNOWN_PLACE');
});
test('strict fields, finite numbers, profile, timezone and date validation never echo inputs',async()=>{
 const {panchangSnapshot,classifyPanchangAngles}=await kernel;const {sunriseOnCivilDay}=await observer;
 const base={timeScale:'UTC',utcInstant:'2026-09-26T01:00:00Z',calculationProfileId:profile};
 for(const invalid of [{...base,name:'private-name'},{...base,calculationProfileId:'other'},
  {...base,utcInstant:'private-name'},{...base,julianDay:2451545}]){
  assert.throws(()=>panchangSnapshot(invalid),e=>e.name==='VedicInputError'&&!JSON.stringify(e).includes('private-name'));
 }
 for(const extra of [{latitude:NaN},{longitude:Infinity},{elevationMetres:'5'},{elevationMetres:null},
  {elevationMetres:undefined},{timeZoneId:'UTC'},{localDate:'2026-02-30'}])
  assert.throws(()=>sunriseOnCivilDay({...site,localDate:'2026-09-26',...extra}),e=>e.name==='VedicInputError');
 assert.throws(()=>classifyPanchangAngles({elongation:NaN,moonSidereal:1,yogaAngle:2}));
 const accessor={...base};Object.defineProperty(accessor,'utcInstant',{get(){throw Error('must not invoke')}});
 assert.throws(()=>panchangSnapshot(accessor),e=>e.code==='INVALID_INPUT');
});

test('three-day enumeration includes interior changes and all fixed Karana slots across new moon',async()=>{
 const {panchangChangesBetween,panchangSnapshot}=await kernel;
 const {resolveAstronomyTime}=await import('../packages/vedic/astronomy-time.mjs');
 const tt=utcInstant=>resolveAstronomyTime({timeScale:'UTC',utcInstant}).ttJulianDay;
 const args={startTtJulianDay:tt('2026-10-09T00:00:00Z'),endTtJulianDay:tt('2026-10-12T00:00:00Z'),calculationProfileId:profile};
 const result=panchangChangesBetween(args);
 const karanas=result.changes.filter(e=>e.limb==='karana');
 assert.deepEqual(karanas.map(e=>e.toIndex),[57,58,59,0,1,2]);
 const tithis=result.changes.filter(e=>e.limb==='tithi');assert.deepEqual(tithis.map(e=>e.toIndex),[29,0,1]);
 for(let i=0;i<result.changes.length;i++){
  const e=result.changes[i];assert.ok(e.ttJulianDay>=args.startTtJulianDay&&e.ttJulianDay<args.endTtJulianDay);
  if(i)assert.ok(e.ttJulianDay>=result.changes[i-1].ttJulianDay);
 }
 const snapshot=panchangSnapshot({timeScale:'TT',julianDay:args.startTtJulianDay,calculationProfileId:profile});
 assert.ok(snapshot.nextTransitions.tithi.ttJulianDay<args.endTtJulianDay);
 const root=snapshot.nextTransitions.karana;
 const clipped=panchangChangesBetween({...args,endTtJulianDay:(root.lowerTtJulianDay+root.upperTtJulianDay)/2});
 assert.equal(clipped.boundaryUncertain,true);
 assert.ok(clipped.changes.some(e=>e.limb==='karana'&&e.intervalMembership==='boundary-uncertain'));
 assert.throws(()=>panchangChangesBetween({...args,endTtJulianDay:args.startTtJulianDay+3.01}),e=>e.code==='OUT_OF_RANGE');
});
