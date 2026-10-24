const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), crypto = require('node:crypto'), {spawnSync} = require('node:child_process');
const engine = import('../packages/vedic/astronomy.mjs');
const time = import('../packages/vedic/astronomy-time.mjs');
const code = expected => error => error.name === 'VedicInputError' && error.code === expected;
const tt = changes => ({timeScale: 'TT', julianDay: 2451545, ...changes});

test('P03 sources and 25,116 independent JPL rows reproduce the checked-in report offline', async () => {
 const {loadReferences} = require('../infrastructure/vedic-jpl-fixtures.cjs');
 const entries = loadReferences();
 assert.equal(entries.length, 28); assert.equal(entries.reduce((sum, entry) => sum + entry.rows.length, 0), 25116);
 const {verify} = require('../infrastructure/verify-vedic-astronomy.cjs');
 const report = await verify();
 const retained = JSON.parse(fs.readFileSync('docs/vedic/P03_REFERENCE_RESULTS.json', 'utf8'));
 assert.deepEqual(report, retained);
 assert.equal(report.allProposedGatesPass, true); assert.equal(report.rows.length, 14);
 assert.ok(Math.max(...report.rows.map(row => row.separationArcsec.max)) < 60);
 assert.match(report.acceptance, /not approved/);
 assert.ok(report.rows.find(row => row.body === 'Jupiter').targetSources.includes('jup365_merged'));
});

test('vendored MIT engine retains its pinned hash and Ritual compatibility import shares its exports', async () => {
 const {astronomyModel} = await engine;
 const bytes = fs.readFileSync('packages/vedic/vendor/astronomy-engine-2.1.19.mjs');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), astronomyModel.engineSha256);
 const ritual=await import('../apps/ritual-assist/frontend/astronomy-engine.mjs'),shared=await import('../packages/vedic/vendor/astronomy-engine-2.1.19.mjs');
 assert.deepEqual(Object.keys(ritual),Object.keys(shared));for(const key of Object.keys(shared))assert.equal(ritual[key],shared[key]);
 assert.equal(require('../server/static-assets').staticAssets['/ritual-assist/astronomy-engine.mjs'],'packages/vedic/vendor/astronomy-engine-2.1.19.mjs');
 assert.match(bytes.toString('utf8').slice(0, 1600), /MIT License/);
 const result = spawnSync(process.execPath, ['infrastructure/prepare-vedic-astronomy.cjs', '--check'], {encoding: 'utf8', windowsHide: true});
 assert.equal(result.status, 0, result.stderr);
});

test('explicit TT is preserved while modelled UT1 and unsupported TDB stay distinct', async () => {
 const {resolveAstronomyTime, astronomyCoverage} = await time;
 const result = resolveAstronomyTime(tt());
 assert.equal(result.ttJulianDay, 2451545); assert.equal(result.utcInstant, null);
 assert.equal(result.tdbJulianDay, null); assert.notEqual(result.ut1JulianDayModelled, result.ttJulianDay);
 assert.ok(result.warnings.includes('MODELLED_UT1_NOT_OBSERVED_EOP'));
 assert.ok(result.warnings.includes('TDB_NOT_COMPUTED'));
 for (const julianDay of [astronomyCoverage.startJulianDay, astronomyCoverage.endJulianDay]) {
  assert.equal(resolveAstronomyTime(tt({julianDay})).ttJulianDay, julianDay);
 }
 for (const julianDay of [astronomyCoverage.startJulianDay - 1e-6, astronomyCoverage.endJulianDay + 1e-6]) {
  assert.throws(() => resolveAstronomyTime(tt({julianDay})), code('OUT_OF_RANGE'));
 }
});

test('UTC to TT uses source-backed leap offsets and flags unconfirmed future/old civil time', async () => {
 const {resolveAstronomyTime} = await time;
 const cases = [['1972-01-01T00:00:00Z', 42.184], ['2000-01-01T12:00:00.000Z', 64.184],
  ['2016-12-31T23:59:59Z', 68.184], ['2017-01-01T00:00:00Z', 69.184], ['2026-10-24T12:00:00Z', 69.184]];
 for (const [utcInstant, seconds] of cases) {
  const result = resolveAstronomyTime({timeScale: 'UTC', utcInstant});
  assert.equal(result.ttMinusCivilSeconds, seconds);
  assert.ok(Math.abs((result.ttJulianDay - result.civilJulianDay) * 86400 - seconds) < 0.00005);
  assert.ok(!result.warnings.includes('LEAP_SECOND_TABLE_EXPIRED_FOR_INSTANT'));
 }
 const future = resolveAstronomyTime({timeScale: 'UTC', utcInstant: '2098-12-31T12:00:00Z'});
 assert.ok(future.warnings.includes('LEAP_SECOND_TABLE_EXPIRED_FOR_INSTANT'));
 assert.match(future.timeConversionModel, /unconfirmed-last-offset/);
 const early = resolveAstronomyTime({timeScale: 'UTC', utcInstant: '1950-01-01T12:00:00Z'});
 assert.ok(early.warnings.includes('PRE_1972_CIVIL_AS_UT1_APPROXIMATION'));
 assert.equal(early.leapSecondTableExpiresUtc, '2027-06-28T00:00:00.000Z');
});

test('snapshot returns finite tropical vectors with reproducible frozen provenance and no Vedic claims', async () => {
 const {astronomySnapshot, astronomyModel} = await engine;
 const result = astronomySnapshot(tt());
 assert.equal(result.positions.length, 7); assert.equal(result.model.id, astronomyModel.id);
 assert.equal(result.model.downloadedJplKernel, false); assert.equal(result.model.dataKind, 'bundled-analytic-coefficients');
 assert.equal(result.correction, 'apparent'); assert.ok(Object.isFrozen(result.positions[0].vectorAu));
 for (const p of result.positions) {
  assert.ok(p.vectorAu.every(Number.isFinite)); assert.ok(p.tropicalLongitude >= 0 && p.tropicalLongitude < 360);
  assert.ok(Math.abs(p.eclipticLatitude) <= 90); assert.equal(p.rashi, undefined); assert.equal(p.siderealLongitude, undefined);
 }
 assert.equal(result.lagna, undefined); assert.equal(result.ayanamsha, undefined);
 assert.deepEqual(result, astronomySnapshot(tt()));
 const selected = astronomySnapshot(tt({bodies: ['Moon', 'Sun']}));
 assert.deepEqual(selected.positions.map(p => p.body), ['Moon', 'Sun']);
});

test('light-time and aberration are explicit and lunar correction is not silently omitted', async () => {
 const {astronomySnapshot} = await engine;
 const {engineTime} = await time;
 const native = await import('../packages/vedic/vendor/astronomy-engine-2.1.19.mjs');
 const geo = astronomySnapshot(tt({correction: 'geometric'}));
 const app = astronomySnapshot(tt({correction: 'apparent'}));
 const t = engineTime(2451545);
 for (let i = 0; i < app.positions.length; i++) {
  const body = app.positions[i].body;
  const back = native.BackdatePosition(t, native.Body.Earth, native.Body[body], true);
  assert.deepEqual(app.positions[i].vectorAu, [back.x, back.y, back.z]);
  assert.notDeepEqual(app.positions[i].vectorAu, geo.positions[i].vectorAu);
 }
 const moon = app.positions.find(p => p.body === 'Moon');
 const uncorrectedMoon = native.GeoVector(native.Body.Moon, t, true);
 assert.notDeepEqual(moon.vectorAu, [uncorrectedMoon.x, uncorrectedMoon.y, uncorrectedMoon.z]);
});

test('TT/UTC contracts reject malformed, mixed, out-of-coverage and uncertain input safely', async () => {
 const {astronomySnapshot} = await engine, {resolveAstronomyTime} = await time;
 for (const bad of [null, [], {}, tt({julianDay: NaN}), tt({julianDay: '2451545'}), tt({utcInstant: '2000-01-01T12:00:00Z'}),
  {timeScale: 'TDB', julianDay: 2451545}, {timeScale: 'UTC', utcInstant: '2000-02-30T12:00:00Z'},
  {timeScale: 'UTC', utcInstant: '2016-12-31T23:59:60Z'}, {timeScale: 'UTC', utcInstant: '2000-01-01T12:00:00+05:30'},
  {timeScale: 'UTC', utcInstant: '2000-01-01'}, {timeScale: 'UTC', utcInstant: '2000-01-01T24:00:00Z'}]) {
  assert.throws(() => resolveAstronomyTime(bad), code('INVALID_INPUT'));
 }
 assert.throws(() => astronomySnapshot(tt({modelId: 'unknown'})), code('MODEL_UNAVAILABLE'));
 for (const bodies of [[], ['Sun', 'Sun'], ['Rahu'], ['Earth'], ['Sun', 'Moon', 'Mars', 'Venus', 'Mercury', 'Jupiter', 'Saturn', 'Neptune'], 'Sun']) {
  assert.throws(() => astronomySnapshot(tt({bodies})), code('INVALID_INPUT'));
 }
 assert.throws(() => astronomySnapshot(tt({correction: 'silent-fallback'})), code('INVALID_INPUT'));
 assert.throws(() => astronomySnapshot(tt({interval: {startUtc: '2000-01-01'}})), code('INVALID_INPUT'));
});

test('invalid personal values/accessors are never echoed or sent to vendor error logging', async () => {
 const {astronomySnapshot} = await engine;
 const secret = 'PRIVATE-BIRTH-INPUT-SECRET'; let traces = 0;
 const old = console.trace; console.trace = () => {traces++;};
 try {
  const bad = [tt({name: secret}), tt({julianDay: secret}), tt({utcInstant: secret}), tt({bodies: [secret]}),
   {timeScale: 'UTC', utcInstant: secret}, tt({modelId: secret})];
  const getter = tt(); Object.defineProperty(getter, 'julianDay', {get() {throw Error(secret);}}); bad.push(getter);
  const array = ['Sun']; Object.defineProperty(array, '0', {get() {throw Error(secret);}}); bad.push(tt({bodies: array}));
  for (const input of bad) assert.throws(() => astronomySnapshot(input), error => {
   assert.equal(error.name, 'VedicInputError'); assert.ok(!error.message.includes(secret));
   assert.ok(!JSON.stringify(error).includes(secret)); return true;
  });
  assert.equal(traces, 0);
 } finally {console.trace = old;}
});

test('IAU frame-bias reference is orthogonal and comparisons do not mistake ICRF for mean J2000', () => {
 const {matrix} = JSON.parse(fs.readFileSync('tests/fixtures/vedic-jpl/frame-bias.json', 'utf8'));
 const {bias} = require('../infrastructure/verify-vedic-astronomy.cjs');
 for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
  const dot = matrix[i].reduce((sum, value, k) => sum + value * matrix[j][k], 0);
  assert.ok(Math.abs(dot - Number(i === j)) < 1e-14);
 }
 assert.notDeepEqual(bias([1, 0, 0]), [1, 0, 0]);
 assert.ok(Math.abs(Math.hypot(...bias([1, 2, 3])) - Math.sqrt(14)) < 1e-14);
});
