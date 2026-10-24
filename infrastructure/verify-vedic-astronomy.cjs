'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {loadReferences} = require('./vedic-jpl-fixtures.cjs');
const sourceRoot = path.resolve(__dirname, '../tests/fixtures/vedic-jpl');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const frameBias = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'frame-bias.json'), 'utf8'));
assert.equal(sha(fs.readFileSync(path.join(sourceRoot, 'erfa-bp00-reference.txt'))), frameBias.excerptSha256);
const bias = v => frameBias.matrix.map(row => row.reduce((sum, value, i) => sum + value * v[i], 0));
const circle = (a, b) => ((a - b + 540) % 360 - 180) * 3600;
function angular(a, b) {
 const al = Math.hypot(...a), bl = Math.hypot(...b);
 return 2 * Math.asin(Math.min(1, Math.hypot(...a.map((x, i) => x / al - b[i] / bl)) / 2)) * 180 / Math.PI * 3600;
}
function metrics(values) {
 const sorted = [...values].sort((a, b) => a - b);
 return {max: sorted.at(-1), rms: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length),
  p95: sorted[Math.ceil(sorted.length * .95) - 1]};
}
async function verify() {
 const {astronomySnapshot, astronomyModel} = await import('../packages/vedic/astronomy.mjs');
 const {engineTime} = await import('../packages/vedic/astronomy-time.mjs');
 const {Vector, Ecliptic} = await import('../packages/vedic/vendor/astronomy-engine-2.1.19.mjs');
 const groups = new Map();
 for (const entry of loadReferences()) {
  const correction = entry.correction === 'NONE' ? 'geometric' : 'apparent';
  const key = entry.body + ':' + correction;
  if (!groups.has(key)) groups.set(key, {body: entry.body, correction, samples: [], targetSources: new Set(), centreSources: new Set()});
  const group = groups.get(key); group.targetSources.add(entry.targetSource); group.centreSources.add(entry.centreSource);
  for (const row of entry.rows) {
   const position = astronomySnapshot({timeScale: 'TT', julianDay: row.ttJulianDay, bodies: [entry.body], correction}).positions[0];
   const vector = bias(row.vector), time = engineTime(row.ttJulianDay);
   // A common engine rotation compares positions, but does not independently certify that rotation.
   const referenceAngles = Ecliptic(new Vector(...vector, time));
   group.samples.push({ttJulianDay: row.ttJulianDay, referenceId: entry.id,
    separationArcsec: angular(position.vectorAu, vector),
    longitudeErrorArcsec: circle(position.tropicalLongitude, referenceAngles.elon),
    latitudeErrorArcsec: (position.eclipticLatitude - referenceAngles.elat) * 3600});
  }
 }
 const rows = [...groups.values()].map(group => {
  const worst = group.samples.reduce((a, b) => a.separationArcsec > b.separationArcsec ? a : b);
  return {body: group.body, correction: group.correction, count: group.samples.length,
   targetSources: [...group.targetSources], centreSources: [...group.centreSources],
   separationArcsec: metrics(group.samples.map(value => value.separationArcsec)),
   longitudeErrorArcsec: metrics(group.samples.map(value => Math.abs(value.longitudeErrorArcsec))),
   latitudeErrorArcsec: metrics(group.samples.map(value => Math.abs(value.latitudeErrorArcsec))), worst,
   proposed60ArcsecGatePass: group.samples.every(value => value.separationArcsec <= 60
    && Math.abs(value.longitudeErrorArcsec) <= 60 && Math.abs(value.latitudeErrorArcsec) <= 60)};
 });
 return {version: 'vedic-astronomy-reference-results-1', date: '2026-10-24',
  modelId: astronomyModel.id, engineSha256: astronomyModel.engineSha256,
  timeScale: 'TT', observer: 'Earth geocenter', inputFrame: 'JPL ICRF',
  comparisonFrame: 'mean J2000 equator/equinox via IAU2000 frame bias', frameBiasSource: frameBias.source,
  corrections: 'Separate NONE and LT+S vector tracks; no gravitational deflection/refraction.',
  angularTransformLimit: 'Longitude/latitude diagnostics use the same Ecliptic rotation on both vectors; transformation accuracy is not independently certified.',
  samples: rows.reduce((sum, row) => sum + row.count, 0), rows,
  allProposedGatesPass: rows.every(row => row.proposed60ArcsecGatePass),
  acceptance: 'Internal candidate passes sampled engineering target only; independent review, production tolerances and full Vedic conventions are not approved.'};
}
module.exports = {verify, angular, bias};
if (require.main === module) verify().then(report => {
 const file = path.resolve(__dirname, '../docs/vedic/P03_REFERENCE_RESULTS.json');
 const output = JSON.stringify(report, null, 2) + '\n';
 if (process.argv[2] === '--write') fs.writeFileSync(file, output);
 else if (process.argv[2] === '--check') assert.equal(fs.readFileSync(file, 'utf8'), output);
 else assert.equal(process.argv.length, 2);
 console.log(JSON.stringify({samples: report.samples, proposedGatesPass: report.allProposedGatesPass,
  maxSeparationArcsec: Math.max(...report.rows.map(row => row.separationArcsec.max))}));
 if (!report.allProposedGatesPass) process.exitCode = 1;
}).catch(error => {console.error(error); process.exitCode = 1;});
