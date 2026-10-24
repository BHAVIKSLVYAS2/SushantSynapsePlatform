const {test} = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const engine = import('../packages/vedic/index.mjs');
const now = Date.parse('2026-10-24T00:00:00Z');
const request = changes => ({localDate: '2000-02-29', localTime: '12:00',
 placeId: 'geonames:1261481', timeZoneId: 'Asia/Kolkata', timeAccuracy: 'exact',
 calculationProfileId: 'IN_LAHIRI_DEFAULT_V1', ...changes});
const code = expected => error => error.name === 'VedicInputError' && error.code === expected;

test('pinned source extracts reproduce the complete generated offline data', async () => {
 const result = spawnSync(process.execPath, ['infrastructure/prepare-vedic-data.cjs', '--check'], {encoding: 'utf8', windowsHide: true});
 assert.equal(result.status, 0, result.stderr);
 const {placeDirectory, getPlace} = await engine;
 assert.equal(placeDirectory.count, 3786);
 const data = JSON.parse(fs.readFileSync('packages/vedic/data/india-places.json', 'utf8'));
 const ids = new Set();
 for (const place of data.places) {
  assert.ok(!ids.has(place.id)); ids.add(place.id);
  const resolved = getPlace(place.id);
  assert.equal(resolved.countryCode, 'IN'); assert.equal(resolved.timeZoneId, 'Asia/Kolkata');
  assert.ok(resolved.state && resolved.label.endsWith(', India'));
  assert.equal(resolved.coordinatePrecision, 'approximate-settlement-point');
  assert.ok(Number.isFinite(resolved.latitude) && Number.isFinite(resolved.longitude));
 }
});

test('civil conversion matches explicit synthetic references and source identity', async () => {
 const {resolveCivilTime, civilTimeProfile} = await engine;
 const fixture = JSON.parse(fs.readFileSync('tests/fixtures/vedic-civil-time.json', 'utf8'));
 const raw = fs.readFileSync('packages/vedic/data/sources/iana-2025b-asia.txt');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), fixture.sourceSha256);
 assert.equal(civilTimeProfile.sourceSha256, fixture.sourceSha256);
 for (const example of fixture.cases) {
  const result = resolveCivilTime({localDate: example.localDate, localTime: example.localTime, timeZoneId: 'Asia/Kolkata'});
  assert.equal(result.utcInstant, example.utcInstant, example.id);
  assert.equal(result.offset, '+05:30'); assert.equal(result.tzdbVersion, '2025b');
  assert.equal(result.inputResolutionSeconds, 60);
 }
});

test('every supported year has a deterministic civil offset, independently checked using Intl', async () => {
 const {resolveCivilTime} = await engine;
 const formatter = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
 for (let year = 1950; year <= 2098; year++) {
  for (const suffix of ['01-01', '07-01', '12-31']) {
   const localDate = year + '-' + suffix;
   const result = resolveCivilTime({localDate, localTime: '00:17', timeZoneId: 'Asia/Kolkata'});
   const parts = Object.fromEntries(formatter.formatToParts(new Date(result.utcInstant)).map(p => [p.type, p.value]));
   assert.equal(`${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`, localDate + ' 00:17');
  }
 }
});

test('search is bounded, multilingual, state-labelled and canonical-name ranked', async () => {
 const {searchPlaces, getPlace} = await engine;
 assert.equal(searchPlaces('New Delhi').matches[0].id, 'geonames:1261481');
 for (const name of ['Ahmedabad', 'Chennai', 'Kolkata', 'Leh']) {
  assert.ok(searchPlaces(name).matches.some(place => place.name === name), name);
 }
 assert.ok(searchPlaces('અમદાવાદ').matches.some(place => place.id === 'geonames:1279233'));
 assert.ok(searchPlaces('दिल्ली').total > 0);
 assert.deepEqual(searchPlaces('a'), {matches: [], total: 0, truncated: false});
 const short = searchPlaces('Delhi', {limit: 2});
 assert.equal(short.matches.length, 2); assert.equal(short.truncated, true); assert.ok(short.total > 2);
 assert.ok(searchPlaces('Srinagar', {stateCode: 'IN.39'}).matches.every(place => place.state === 'Uttarakhand'));
 assert.deepEqual(searchPlaces('not-a-real-settlement-xyz').matches, []);
 assert.ok(Object.isFrozen(getPlace('geonames:1261481')));
 for (const limit of [0, 21, 1.2, '10', NaN]) assert.throws(() => searchPlaces('Delhi', {limit}), code('INVALID_INPUT'));
 assert.throws(() => searchPlaces('x'.repeat(101)), code('INVALID_INPUT'));
 assert.throws(() => searchPlaces('Delhi\n'), code('INVALID_INPUT'));
});

test('colliding names require explicit IDs, even inside the same state', async () => {
 const {resolvePlaceName, searchPlaces, getPlace} = await engine;
 for (const name of ['Aurangabad', 'Srinagar', 'Rampur']) assert.throws(() => resolvePlaceName(name), code('AMBIGUOUS_PLACE'));
 assert.throws(() => resolvePlaceName('Rampur', {stateCode: 'IN.36'}), code('AMBIGUOUS_PLACE'));
 assert.equal(resolvePlaceName('Aurangabad', {stateCode: 'IN.34'}).state, 'Bihar');
 const candidates = searchPlaces('Aurangabad');
 assert.ok(candidates.matches.some(place => place.state === 'Bihar'));
 assert.ok(candidates.matches.some(place => place.state === 'Maharashtra'));
 assert.equal(getPlace('geonames:1278149').state, 'Maharashtra');
 assert.throws(() => resolvePlaceName('Unknown village xyz'), code('UNKNOWN_PLACE'));
 for (const foreign of ['geonames:1283240', '../../data', null, 1261481]) assert.throws(() => getPlace(foreign), code('UNKNOWN_PLACE'));
});

test('normalization returns reviewed civil input and source precision without chart claims', async () => {
 const {normalizeInput} = await engine;
 const input = request(), copy = structuredClone(input);
 const result = normalizeInput(input, {now});
 assert.deepEqual(input, copy);
 assert.equal(result.utcInstant, '2000-02-29T06:30:00.000Z'); assert.equal(result.interval, null);
 assert.equal(result.precisionClass, 'minute-resolution'); assert.equal(result.place.elevationBasis, 'assumed-sea-level');
 assert.ok(result.warnings.includes('APPROXIMATE_PLACE_COORDINATES'));
 assert.ok(result.warnings.includes('SEA_LEVEL_ASSUMED'));
 assert.ok(Object.isFrozen(result) && Object.isFrozen(result.place.aliases));
 assert.equal(result.positions, undefined); assert.equal(result.lagna, undefined); assert.equal(result.ephemerisId, undefined);
 const high = normalizeInput(request({elevationMetres: 3500}), {now});
 assert.equal(high.place.elevationMetres, 3500); assert.ok(!high.warnings.includes('SEA_LEVEL_ASSUMED'));
 const early = normalizeInput(request({localDate: '1950-01-01'}), {now});
 assert.ok(early.warnings.includes('PROLEPTIC_CIVIL_TIMESTAMP'));
});

test('approximate intervals cross civil midnight without manufacturing an exact instant', async () => {
 const {normalizeInput} = await engine;
 const result = normalizeInput(request({localDate: '2000-03-01', localTime: '00:10',
  timeAccuracy: 'approximate', precisionOfBirthTimeMinutes: 20}), {now});
 assert.equal(result.utcInstant, null);
 assert.deepEqual(result.interval, {startUtc: '2000-02-29T18:20:00.000Z', endUtc: '2000-02-29T19:00:00.000Z',
  startInclusive: true, endInclusive: true});
 assert.equal(result.precisionClass, 'explicit-interval');
 for (const precision of [0, -1, 721, 1.5, '20', Infinity]) {
  assert.throws(() => normalizeInput(request({timeAccuracy: 'approximate', precisionOfBirthTimeMinutes: precision}), {now}), code('INVALID_INPUT'));
 }
});

test('unknown time is an entire half-open local day and never noon', async () => {
 const {normalizeInput} = await engine;
 const input = request({timeAccuracy: 'unknown'}); delete input.localTime;
 const result = normalizeInput(input, {now});
 assert.equal(result.localTime, null); assert.equal(result.utcInstant, null);
 assert.equal(result.inputResolutionSeconds, null);
 assert.deepEqual(result.interval, {startUtc: '2000-02-28T18:30:00.000Z', endUtc: '2000-02-29T18:30:00.000Z',
  startInclusive: true, endInclusive: false});
 for (const extra of [{localTime: ''}, {localTime: '12:00'}, {precisionOfBirthTimeMinutes: 10}]) {
  assert.throws(() => normalizeInput({...input, ...extra}, {now}), code('INVALID_INPUT'));
 }
});

test('strict dates, historical coverage and unsupported zones never silently coerce', async () => {
 const {resolveCivilTime} = await engine;
 for (const localDate of ['2000-02-30', '2001-02-29', '1900-02-29', '2026-13-01', '2026-00-01',
  '2026-01-00', '2026-1-01', '2026-01-01Z', '', null, {}, 'x'.repeat(3000)]) {
  assert.throws(() => resolveCivilTime({localDate, localTime: '12:00', timeZoneId: 'Asia/Kolkata'}), code('INVALID_INPUT'));
 }
 for (const localDate of ['1942-10-01', '1949-12-31', '2099-01-01']) {
  assert.throws(() => resolveCivilTime({localDate, localTime: '12:00', timeZoneId: 'Asia/Kolkata'}), code('OUT_OF_RANGE'));
 }
 for (const localTime of ['24:00', '23:59:60', '12:00:00', '1:00', '00:60', '', null]) {
  assert.throws(() => resolveCivilTime({localDate: '2000-01-01', localTime, timeZoneId: 'Asia/Kolkata'}), code('INVALID_INPUT'));
 }
 for (const timeZoneId of ['Asia/Calcutta', 'America/New_York', 'Europe/London', 'UTC', null]) {
  assert.throws(() => resolveCivilTime({localDate: '2000-01-01', localTime: '12:00', timeZoneId}), code('UNSUPPORTED_TIMEZONE'));
 }
});

test('coverage and future-birth checks include the full interval and allow exploration', async () => {
 const {normalizeInput} = await engine;
 assert.throws(() => normalizeInput(request()), code('INVALID_INPUT'));
 assert.throws(() => normalizeInput(request({localDate: '2098-12-31'}), {now}), code('OUT_OF_RANGE'));
 assert.ok(normalizeInput(request({localDate: '2098-12-31', purpose: 'exploration'})));
 assert.throws(() => normalizeInput(request({localDate: '1950-01-01', localTime: '00:00',
  timeAccuracy: 'approximate', precisionOfBirthTimeMinutes: 1}), {now}), code('OUT_OF_RANGE'));
 assert.throws(() => normalizeInput(request({localDate: '2098-12-31', localTime: '23:59', purpose: 'exploration',
  timeAccuracy: 'approximate', precisionOfBirthTimeMinutes: 1})), code('OUT_OF_RANGE'));
 const end = request({localDate: '2098-12-31', timeAccuracy: 'unknown', purpose: 'exploration'}); delete end.localTime;
 assert.equal(normalizeInput(end).interval.endUtc, '2098-12-31T18:30:00.000Z');
 const today = request({localDate: '2026-10-24', timeAccuracy: 'unknown'}); delete today.localTime;
 assert.throws(() => normalizeInput(today, {now}), code('OUT_OF_RANGE'));
 const same = request({localDate: '2026-10-24', localTime: '05:30'});
 assert.ok(normalizeInput(same, {now}));
 assert.throws(() => normalizeInput({...same, timeAccuracy: 'approximate', precisionOfBirthTimeMinutes: 1}, {now}), code('OUT_OF_RANGE'));
});

test('locales affect presentation metadata only and host timezone cannot change conversion', async () => {
 const {normalizeInput} = await engine;
 const values = ['en', 'hi', 'gu'].map(language => normalizeInput(request({language}), {now}));
 assert.equal(new Set(values.map(result => result.utcInstant)).size, 1);
 const script = "import {resolveCivilTime} from './packages/vedic/index.mjs'; process.stdout.write(resolveCivilTime({localDate:'2000-01-01',localTime:'00:00',timeZoneId:'Asia/Kolkata'}).utcInstant);";
 for (const TZ of ['UTC', 'America/New_York', 'Asia/Tokyo']) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {env: {...process.env, TZ}, encoding: 'utf8', windowsHide: true});
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, '1999-12-31T18:30:00.000Z');
 }
});

test('coordinates are strictly numeric and never establish country eligibility', async () => {
 const {validateCoordinates, normalizeInput} = await engine;
 assert.deepEqual(validateCoordinates(0, 0), {latitude: 0, longitude: 0});
 for (const pair of [[NaN, 77], [Infinity, 77], [91, 77], [20, 181], ['28', 77], [null, 77]]) {
  assert.throws(() => validateCoordinates(...pair), code('INVALID_INPUT'));
 }
 // Kathmandu lies inside a crude India rectangle: client coordinates/country are not trusted.
 assert.throws(() => normalizeInput(request({latitude: 27.7172, longitude: 85.324, countryCode: 'IN'}), {now}), code('INVALID_INPUT'));
});

test('private fields, accessors and malformed values produce safe typed diagnostics', async () => {
 const {normalizeInput, VedicInputError} = await engine;
 const secret = 'PRIVATE-BIRTH-NAME-123';
 const bad = [request({name: secret}), request({localDate: secret}), request({localTime: secret}),
  request({placeId: secret}), request({timeZoneId: secret}), request({calculationProfileId: secret}),
  request({timeAccuracy: secret}), request({language: secret}), request({purpose: secret}),
  request({elevationMetres: secret}), null, [], new Date()];
 const getter = request(); Object.defineProperty(getter, 'localDate', {get() {throw Error(secret);}}); bad.push(getter);
 const nested = request({localDate: {toString() {throw Error(secret);}}}); bad.push(nested);
 for (const input of bad) {
  assert.throws(() => normalizeInput(input, {now}), error => {
   assert.ok(error instanceof VedicInputError); assert.ok(!error.message.includes(secret));
   assert.ok(!JSON.stringify(error).includes(secret)); assert.ok(!error.stack.includes(secret)); return true;
  });
 }
 for (const accuracy of ['exact', 'unknown']) assert.throws(() => normalizeInput(request({timeAccuracy: accuracy,
  precisionOfBirthTimeMinutes: 1}), {now}), code('INVALID_INPUT'));
 for (const height of [-501, 9001, NaN, Infinity, '0']) assert.throws(() => normalizeInput(request({elevationMetres: height}), {now}), code('INVALID_INPUT'));
});

test('normalization modules import no persistence, network, logging or astronomy facilities', () => {
 for (const name of ['normalize.mjs', 'places.mjs', 'civil-time.mjs', 'diagnostics.mjs']) {
  const source = fs.readFileSync(path.join('packages/vedic', name), 'utf8');
  assert.doesNotMatch(source, /\b(?:fetch|console|localStorage|sessionStorage|indexedDB)\s*[.(]|node:|astronomy-engine|database/);
 }
});
