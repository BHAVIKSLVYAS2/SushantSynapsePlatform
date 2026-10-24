const {test} = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const angles = import('../packages/vedic/angles.mjs'), iau = import('../packages/vedic/iau1976.mjs');
const sidereal = import('../packages/vedic/sidereal.mjs'), ayan = import('../packages/vedic/ayanamsha.mjs');
const profile = 'IN_LAHIRI_DEFAULT_V1';
const input = changes => ({timeScale: 'TT', julianDay: 2451545, calculationProfileId: profile, ...changes});
const code = expected => error => error.name === 'VedicInputError' && error.code === expected;
function next(value, direction) {
 if (value === 0) return direction > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
 const buffer = new ArrayBuffer(8), view = new DataView(buffer);
 view.setFloat64(0, value); const bits = view.getBigUint64(0);
 view.setBigUint64(0, bits + (value > 0 === direction > 0 ? 1n : -1n));
 return view.getFloat64(0);
}
const arcsecDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180) * 3600;
const dms = value => value[0] + value[1] / 60 + value[2] / 3600;

test('licensed coefficients and independently published ERFA expected values reproduce offline', async () => {
 const run = spawnSync(process.execPath, ['infrastructure/prepare-vedic-sidereal.cjs', '--check'], {encoding:'utf8',windowsHide:true});
 assert.equal(run.status, 0, run.stderr);
 const reference = JSON.parse(fs.readFileSync('tests/fixtures/vedic-sidereal/erfa-reference.json', 'utf8'));
 const {precession1976, meanObliquity1980, nutation1980, meanLunarNode2003, DEG} = await iau;
 const matrix = precession1976(reference.precession.ttJulianDay);
 for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) assert.ok(Math.abs(matrix[i][j] - reference.precession.matrix[i][j]) < 1e-14);
 assert.ok(Math.abs(meanObliquity1980(reference.obliquity.ttJulianDay) - reference.obliquity.radians) < 1e-14);
 const nut = nutation1980(reference.nutation.ttJulianDay);
 assert.ok(Math.abs(nut.longitudeRadians - reference.nutation.longitudeRadians) < 1e-13);
 assert.ok(Math.abs(nut.obliquityRadians - reference.nutation.obliquityRadians) < 1e-13);
 assert.ok(arcsecDiff(meanLunarNode2003(reference.meanNode.ttJulianDay), reference.meanNode.signedRadians / DEG) < 1e-7);
});

test('Lahiri uses a true 1956 anchor and matches published mean/true reference values', async () => {
 const {lahiriAyanamsha} = await ayan;
 const {resolveAstronomyTime} = await import('../packages/vedic/astronomy-time.mjs');
 const reference = JSON.parse(fs.readFileSync('tests/fixtures/vedic-sidereal/lahiri-published.json', 'utf8'));
 const anchor = lahiriAyanamsha(reference.definition.ttJulianDay);
 assert.ok(arcsecDiff(anchor.trueDegrees, dms(reference.definition.trueDms)) < 1e-8);
 assert.ok(Math.abs((anchor.trueDegrees - anchor.meanDegrees) * 3600) > 16);
 let max = 0;
 for (const row of reference.mean) max = Math.max(max, arcsecDiff(lahiriAyanamsha(row.ttJulianDay).meanDegrees, dms(row.dms)));
 for (const row of reference.true) {
  const t = resolveAstronomyTime({timeScale:'UTC', utcInstant:row.nominalUtc});
  max = Math.max(max, arcsecDiff(lahiriAyanamsha(t.ttJulianDay).trueDegrees, dms(row.dms)));
 }
 assert.ok(max <= reference.proposedToleranceArcsec, 'Measured Lahiri residual '+max);
 console.log(JSON.stringify({fixture:'published-lahiri',references:reference.mean.length+reference.true.length,maxArcsec:max,
  sourceStatus:'published secondary reproduction, original IAE review pending'}));
});

test('saved P04 reference/grid report reproduces without provider requests',async()=>{
 const {verify}=require('../infrastructure/verify-vedic-sidereal.cjs');
 const actual=await verify(),expected=JSON.parse(fs.readFileSync('docs/vedic/P04_REFERENCE_RESULTS.json','utf8'));
 assert.deepEqual(actual,expected);
 assert.equal(actual.invariantGrid.positions,16092);
 assert.ok(actual.invariantGrid.maxTrueMeanCancellationArcsec<1e-7);
 assert.ok(actual.invariantGrid.maxNodeOppositionArcsec<1e-7);
 assert.match(actual.acceptance,/remain pending/);
});

test('all sign and 108 Pada boundaries classify immediately below/exactly/above without epsilon', async () => {
 const {classifySidereal} = await angles;
 for (let i = 0; i < 108; i++) {
  const boundary = i * 360 / 108;
  for (const [value, expected] of [[next(boundary,-1),(i+107)%108],[boundary,i],[next(boundary,1),i]]) {
   const result = classifySidereal(value);
   assert.equal(result.nakshatra, Math.floor(expected/4)+1, `${i} ${value}`);
   assert.equal(result.pada, expected%4+1, `${i} ${value}`);
  }
 }
 for (let i = 0; i < 12; i++) {
  const boundary = i*30;
  assert.equal(classifySidereal(next(boundary,-1)).rashi, (i+11)%12+1);
  assert.equal(classifySidereal(boundary).rashi, i+1);
  assert.equal(classifySidereal(next(boundary,1)).rashi, i+1);
 }
 assert.equal(classifySidereal(360).rashi, 1); assert.equal(classifySidereal(next(360,-1)).rashi,12);
 assert.equal(classifySidereal(360).nakshatra,1); assert.equal(classifySidereal(next(360,-1)).pada,4);
});

test('angle normalization preserves near-turn values, ranges and periodicity', async () => {
 const {normalizeDegrees, classifySidereal} = await angles;
 assert.equal(normalizeDegrees(-0),0); assert.equal(Object.is(normalizeDegrees(-0),-0),false);
 assert.equal(normalizeDegrees(next(360,-1)),next(360,-1));
 assert.equal(normalizeDegrees(-Number.MIN_VALUE),next(360,-1));
 for (const bad of [NaN,Infinity,-Infinity,'30',null,{}]) assert.throws(()=>normalizeDegrees(bad),code('INVALID_INPUT'));
 let seed = 1976;
 for (let i=0;i<2000;i++) {
  seed=(1664525*seed+1013904223)>>>0; const value=(seed/2**32-.5)*20000;
  const result=classifySidereal(value);
  assert.ok(result.longitude>=0&&result.longitude<360);
  assert.ok(result.rashi>=1&&result.rashi<=12&&result.nakshatra>=1&&result.nakshatra<=27&&result.pada>=1&&result.pada<=4);
  assert.ok(result.degreeWithinRashi>=0&&result.degreeWithinRashi<30);
  assert.ok(arcsecDiff(normalizeDegrees(value+720),result.longitude)<1e-7);
 }
});

test('precession rotations are orthogonal and nutation cancels exactly once in sidereal longitude', async () => {
 const {precession1976, multiply, transpose} = await iau;
 const {siderealSnapshot} = await sidereal;
 for(const julianDay of [2433280.5,2435553.5,2451545,2461338,2487706.5]) {
  const matrix=precession1976(julianDay), v=[.2,-.7,.4];
  const returned=multiply(transpose(matrix),multiply(matrix,v));
  for(let k=0;k<3;k++)assert.ok(Math.abs(returned[k]-v[k])<1e-14);
  const result=siderealSnapshot(input({julianDay}));
  for(const p of result.positions) {
   assert.ok(arcsecDiff(p.siderealLongitude,p.tropicalLongitude-result.ayanamsha.trueDegrees)<1e-7);
   assert.ok(arcsecDiff(p.siderealLongitude,p.meanTropicalLongitude-result.ayanamsha.meanDegrees)<1e-7);
  }
 }
});

test('nine-graha snapshot distinguishes computed nodes and carries honest precision/provenance', async () => {
 const {siderealSnapshot}=await sidereal;
 const result=siderealSnapshot(input());
 assert.equal(result.positions.length,9); assert.equal(result.profile.id,profile);
 assert.equal(result.profile.ayanamsha.precession,'IAU1976');
 const rahu=result.positions.find(p=>p.body==='Rahu'),ketu=result.positions.find(p=>p.body==='Ketu');
 assert.equal(rahu.kind,'computed-mean-lunar-node'); assert.equal(rahu.eclipticLatitude,null);
 assert.equal(rahu.vectorAu,undefined); assert.equal(rahu.distanceAu,undefined);
 assert.ok(arcsecDiff(rahu.siderealLongitude+180,ketu.siderealLongitude)<1e-7);
 assert.ok(result.warnings.includes('BIRTH_TIME_STABILITY_NOT_EVALUATED'));
 assert.ok(Object.isFrozen(result.positions[0])&&Object.isFrozen(result.profile));
 assert.equal(result.lagna,undefined);assert.equal(result.houses,undefined);assert.equal(result.tithi,undefined);
 assert.deepEqual(result,siderealSnapshot(input()));
 assert.deepEqual(siderealSnapshot(input({bodies:['Ketu','Rahu']})).positions.map(p=>p.body),['Ketu','Rahu']);
});

test('boundary screening flags closeness without shifting nominal sectors or claiming stability', async () => {
 const {sectorBoundaryDistances,classifySidereal}=await angles;
 assert.deepEqual(sectorBoundaryDistances(0),{rashiArcsec:0,nakshatraArcsec:0,padaArcsec:0});
 assert.equal(sectorBoundaryDistances(30).rashiArcsec,0);
 assert.equal(classifySidereal(30).rashi,2);
 const {siderealSnapshot}=await sidereal;
 for (let k=0;k<24;k++) {
  const r=siderealSnapshot(input({julianDay:2451545+k*5}));
  for(const p of r.positions) assert.equal(p.nearBoundary,Object.values(p.boundaryDistances).some(d=>d<=61));
 }
});

test('P02 birth bridge requires an exact supplied time and preserves no-storage/source warnings',async()=>{
 const {siderealForBirth}=await import('../packages/vedic/birth-positions.mjs');
 const birth={localDate:'2000-02-29',localTime:'12:00',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',
  timeAccuracy:'exact',calculationProfileId:profile};
 const context={now:Date.parse('2026-10-24T00:00:00Z')};
 const result=siderealForBirth(birth,context);
 assert.equal(result.sidereal.time.utcInstant,result.birth.utcInstant);
 assert.ok(result.warnings.includes('APPROXIMATE_PLACE_COORDINATES'));
 assert.ok(result.warnings.includes('BIRTH_TIME_STABILITY_NOT_EVALUATED'));
 const unknown={...birth,timeAccuracy:'unknown'};delete unknown.localTime;
 assert.throws(()=>siderealForBirth(unknown,context),code('UNSTABLE_BIRTH_TIME'));
 assert.throws(()=>siderealForBirth({...birth,timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},context),code('UNSTABLE_BIRTH_TIME'));
});

test('unavailable profiles, invalid times/body selectors and private values fail safely',async()=>{
 const {siderealSnapshot}=await sidereal;
 const secret='PRIVATE-BIRTH-SECRET';
 for(const value of [null,[],{},input({name:secret}),input({calculationProfileId:secret}),input({julianDay:secret}),
  input({bodies:['Sun','Sun']}),input({bodies:['Pluto']}),input({bodies:[]}),input({timeScale:'TDB'})]) {
  assert.throws(()=>siderealSnapshot(value),error=>{
   assert.equal(error.name,'VedicInputError');assert.ok(!error.message.includes(secret));assert.ok(!JSON.stringify(error).includes(secret));return true;
  });
 }
 assert.throws(()=>siderealSnapshot(input({julianDay:2400000})),code('OUT_OF_RANGE'));
 const getter=input();Object.defineProperty(getter,'julianDay',{get(){throw Error(secret);}});
 assert.throws(()=>siderealSnapshot(getter),code('INVALID_INPUT'));
});
