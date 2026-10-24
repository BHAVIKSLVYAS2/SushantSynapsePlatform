'use strict';
// Development-only synthetic reference capture. Normal tests only read pinned files.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../tests/fixtures/vedic-jpl');
const targets = {Sun: '10', Moon: '301', Mercury: '199', Venus: '299', Mars: '499', Jupiter: '599', Saturn: '699'};
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const julian = stamp => Date.parse(stamp) / 86400000 + 2440587.5;
const anchors = ['1949-12-30T00:00:00Z', '1950-01-01T12:00:00Z', '2000-01-01T12:00:00Z',
 '2026-10-24T12:00:00Z', '2098-12-31T12:00:00Z', '2099-01-03T00:00:00Z'].map(julian);
function plans() {
 const output = [];
 for (const [body, target] of Object.entries(targets)) for (const correction of ['NONE', 'LT+S']) {
  for (const grid of ['monthly', 'anchors']) {
   const parameters = {format: 'json', COMMAND: `'${target}'`, OBJ_DATA: "'YES'", MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'", CENTER: "'500@399'", REF_PLANE: "'FRAME'", REF_SYSTEM: "'ICRF'",
    OUT_UNITS: "'AU-D'", VEC_TABLE: "'1'", VEC_CORR: `'${correction}'`, TIME_TYPE: "'TT'",
    CAL_TYPE: "'GREGORIAN'", CSV_FORMAT: "'YES'",
    ...(grid === 'monthly' ? {START_TIME: "'1950-01-01 12:00'", STOP_TIME: "'2098-12-31 12:00'", STEP_SIZE: "'1 mo'"}
     : {TLIST: "'" + anchors.join(' ') + "'"})};
   const id = `${body.toLowerCase()}-${correction === 'NONE' ? 'geometric' : 'apparent'}-${grid}`;
   output.push({id, body, target, correction, grid, parameters,
    url: 'https://ssd.jpl.nasa.gov/api/horizons.api?' + new URLSearchParams(parameters)});
  }
 }
 return output;
}
function parse(raw, plan) {
 const payload = JSON.parse(raw);
 assert.ok(!payload.error, payload.error);
 assert.ok(payload.result && payload.result.includes('$$SOE'), 'Missing reference rows: ' + plan.id);
 const source = payload.result;
 assert.match(source, /Center body name: Earth \(399\)/);
 assert.match(source, /Reference frame\s*:\s*ICRF/);
 assert.match(source, /Output units\s*:\s*AU-D/);
 assert.match(source, /JDTT/);
 assert.ok(source.match(/Target body name:.*\n/)[0].includes(`(${plan.target})`), 'Unexpected target centre');
 assert.match(source, plan.correction === 'NONE' ? /GEOMETRIC cartesian states/ : /LT\+S/);
 const rows = source.split('$$SOE')[1].split('$$EOE')[0].trim().split(/\r?\n/).map(line => {
  const columns = line.split(',').map(value => value.trim());
  const values = [columns[0], ...columns.slice(2, 5)].map(Number);
  assert.ok(values.every(Number.isFinite));
  return {ttJulianDay: values[0], vector: values.slice(1)};
 });
 assert.equal(rows.length, plan.grid === 'monthly' ? 1788 : anchors.length, 'Unexpected grid coverage: ' + plan.id);
 return {rows, targetSource: source.match(/Target body name:.*\{source: ([^}]+)\}/)[1],
  centreSource: source.match(/Center body name:.*\{source: ([^}]+)\}/)[1], api: payload.signature,
  eop: source.match(/EOP file\s*:\s*([^\n]+)/)?.[1]?.trim() || null};
}
function loadReferences() {
 const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
 const expected = plans(); assert.equal(manifest.entries.length, expected.length);
 return manifest.entries.map((entry, i) => {
  assert.equal(entry.id, expected[i].id); assert.equal(entry.url, expected[i].url);
  const raw = fs.readFileSync(path.join(root, entry.path));
  assert.equal(sha(raw), entry.sha256, 'Reference bytes changed: ' + entry.id);
  const parsed = parse(raw.toString('utf8'), expected[i]);
  assert.equal(parsed.targetSource, entry.targetSource); assert.equal(parsed.centreSource, entry.centreSource);
  return {...entry, ...parsed};
 });
}
async function capture() {
 fs.mkdirSync(path.join(root, 'raw'), {recursive: true});
 const entries = [];
 for (const plan of plans()) {
  const target = path.join(root, 'raw', plan.id + '.json');
  let bytes;
  // Resume completed captures without contacting the service again.
  if (fs.existsSync(target)) { bytes = fs.readFileSync(target); parse(bytes.toString('utf8'), plan); }
  else {
   let failure;
   for (let attempt = 0; attempt < 3; attempt++) {
    try {
     if (attempt) await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
     const response = await fetch(plan.url, {signal: AbortSignal.timeout(45000),
      headers: {'User-Agent': 'SushantSynapseVedic/0.3.0 (+https://apps.sushantsynapse.com/contact)'}});
     assert.ok(response.ok, 'JPL HTTP ' + response.status);
     bytes = Buffer.from(await response.text()); assert.ok(bytes.length < 2000000);
     parse(bytes.toString('utf8'), plan); failure = null; break;
    } catch (error) { failure = error; }
   }
   if (failure) throw failure;
   fs.writeFileSync(target, bytes);
  }
  const parsed = parse(bytes.toString('utf8'), plan);
  entries.push({...plan, path: 'raw/' + plan.id + '.json', sha256: sha(bytes),
   rows: parsed.rows.length, targetSource: parsed.targetSource, centreSource: parsed.centreSource,
   api: parsed.api, eop: parsed.eop});
  console.log('Captured ' + plan.id + ': ' + parsed.rows.length + ' rows');
  fs.writeFileSync(path.join(root, 'capture-progress.json'), JSON.stringify({entries}, null, 2) + '\n');
 }
 fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({version: 'vedic-jpl-reference-1',
  retrieved: '2026-10-24', inputs: 'Synthetic monthly TT epochs and six explicit TT anchors; no user data.',
  frame: 'ICRF equatorial', centre: 'Earth geocenter 399', units: 'AU', timescale: 'TT',
  reviewStatus: 'captured-and-machine-verified; independent human review and production tolerance approval pending', entries}, null, 2) + '\n');
}
module.exports = {loadReferences, plans, parse};
if (require.main === module) {
 if (process.argv[2] === '--capture') capture().catch(error => {console.error(error); process.exitCode = 1;});
 else if (process.argv[2] === '--check') console.log(JSON.stringify({responses: loadReferences().length,
  rows: loadReferences().reduce((sum, entry) => sum + entry.rows.length, 0)}));
 else throw Error('Use --capture for deliberate network acquisition, or --check for offline verification.');
}
