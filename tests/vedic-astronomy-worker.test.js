const {test} = require('node:test'), assert = require('node:assert/strict');
const {createRequire} = require('node:module'), {performance} = require('node:perf_hooks');

test('actual local workerd astronomy matches Node at TT anchors, monthly samples and leap boundaries', {timeout: 60000}, async t => {
 const {astronomySnapshot} = await import('../packages/vedic/astronomy.mjs');
 const toolsRequire = createRequire(require.resolve('wrangler/package.json'));
 const {Miniflare, convertV4MiniflareOptions} = toolsRequire('miniflare');
 const bundled = await require('esbuild').build({stdin: {contents: `
  import {astronomySnapshot} from './packages/vedic/astronomy.mjs';
  export default {async fetch(request) {
   const inputs = await request.json();
   if (!Array.isArray(inputs) || inputs.length > 64) return new Response('Fixture limit', {status:400});
   return Response.json(inputs.map(input => {
    try {return {result: astronomySnapshot(input)};}
    catch (error) {return {error: error.toJSON()};}
   }));
  }};`, resolveDir: process.cwd()}, bundle: true, write: false, format: 'esm', platform: 'neutral',
  target: 'es2022', minify: true, conditions: ['workerd', 'worker', 'browser']});
 const script = bundled.outputFiles[0].text;
 assert.ok(Buffer.byteLength(script) < 200000, 'Astronomy-only bundle must not include the place catalogue');
 const options = {workers: [{name: 'isolated-vedic-astronomy', modules: true, script,
  compatibilityDate: '2026-10-01', outboundService: () => new Response('No external references at runtime', {status: 503})}]};
 const mf = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
 t.after(() => mf.dispose());
 const epochs = [2433280.5, 2433283, 2451545, 2461338, 2487704, 2487706.5];
 for (let month = 0; month < 12; month++) epochs.push(Date.UTC(2026, month, 1, 12) / 86400000 + 2440587.5);
 const inputs = epochs.flatMap(julianDay => ['geometric', 'apparent'].map(correction => ({timeScale: 'TT', julianDay, correction})));
 for (const utcInstant of ['1972-01-01T00:00:00Z', '2016-12-31T23:59:59Z', '2017-01-01T00:00:00Z',
  '2026-10-24T12:00:00Z', '2098-12-31T12:00:00Z']) inputs.push({timeScale: 'UTC', utcInstant});
 inputs.push({timeScale: 'TT', julianDay: 2451545, bodies: ['Rahu']});
 await mf.ready;
 const started = performance.now();
 const response = await mf.dispatchFetch('http://vedic.test/', {method: 'POST',
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify(inputs)});
 const results = await response.json();
 const roundTripMs = performance.now() - started;
 assert.equal(response.status, 200); assert.equal(results.length, inputs.length);
 let maxAngleDifference = 0, maxVectorDifference = 0, vectors = 0;
 for (let i = 0; i < inputs.length - 1; i++) {
  const expected = astronomySnapshot(inputs[i]), actual = results[i].result;
  assert.deepEqual(actual.model, expected.model); assert.deepEqual(actual.time, expected.time);
  assert.deepEqual(actual.warnings, expected.warnings);
  for (let k = 0; k < expected.positions.length; k++) {
   const a = actual.positions[k], b = expected.positions[k]; vectors++;
   assert.equal(a.body, b.body);
   maxAngleDifference = Math.max(maxAngleDifference, Math.abs(a.tropicalLongitude - b.tropicalLongitude), Math.abs(a.eclipticLatitude - b.eclipticLatitude));
   for (let j = 0; j < 3; j++) maxVectorDifference = Math.max(maxVectorDifference, Math.abs(a.vectorAu[j] - b.vectorAu[j]));
  }
 }
 assert.ok(maxAngleDifference <= 1e-9); assert.ok(maxVectorDifference <= 1e-12);
 assert.deepEqual(results.at(-1).error, {code: 'INVALID_INPUT', message: 'Check the supplied place and civil-time fields.'});
 console.log(JSON.stringify({fixture: 'local-workerd-parity', snapshots: inputs.length - 1, vectors,
  maxAngleDifferenceDegrees: maxAngleDifference, maxVectorDifferenceAu: maxVectorDifference,
  bundleBytes: Buffer.byteLength(script), roundTripMs: Math.round(roundTripMs),
  timingMeaning: 'local batch wall time, not production CPU usage'}));
});
