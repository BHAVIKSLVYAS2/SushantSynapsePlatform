'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../packages/vedic/data');
const sources = path.join(root, 'sources/erfa-2.0.1');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(sources, 'manifest.json'), 'utf8'));
for (const file of manifest.sources) assert.equal(sha(fs.readFileSync(path.join(sources, file.name))), file.sha256, file.name);
const raw = fs.readFileSync(path.join(sources, 'nut80.c'), 'utf8');
const table = raw.split('} x[] = {')[1].split('};')[0];
const rows = [...table.matchAll(/\{\s*([^{}]+)\}/g)].map(match => match[1].split(',').map(value => Number(value.trim())));
assert.equal(rows.length, 106); assert.ok(rows.every(row => row.length === 9 && row.every(Number.isFinite)));
const data = {version: 'iau1980-erfa-2.0.1-106-term-v1', source: manifest.sources.find(file => file.name === 'nut80.c'),
 license: 'ERFA BSD-3-Clause; see data/sources/erfa-2.0.1/LICENSE',
 units: 'coefficients in 0.1 milliarcsecond and per TT Julian century', terms: rows};
const output = JSON.stringify(data, null, 2) + '\n', target = path.join(root, 'iau1980-nutation.json');
if (process.argv[2] === '--check') assert.equal(fs.readFileSync(target, 'utf8'), output);
else {assert.equal(process.argv.length, 2); fs.writeFileSync(target, output);}
const testSource = fs.readFileSync(path.join(sources, 't_erfa_c.c'), 'utf8');
const section = name => {
 const start = testSource.indexOf('static void ' + name + '(');
 assert.ok(start >= 0); return testSource.slice(start, testSource.indexOf('\n}', start) + 2);
};
const pmat = section('t_pmat76'), matrix = [[], [], []];
for (const match of pmat.matchAll(/vvd\(rmatp\[(\d)\]\[(\d)\],\s*([^,]+),/g)) matrix[Number(match[1])][Number(match[2])] = Number(match[3]);
assert.ok(matrix.every(row => row.length === 3));
const nut = section('t_nut80');
const fixture = {version: 'erfa-2.0.1-independent-p04-reference',
 source: manifest.sources.find(file => file.name === 't_erfa_c.c'),
 method: 'Published ERFA expected values, extracted without executing the implementation under test.',
 precession: {ttJulianDay: 2400000.5 + 50123.9999, matrix},
 obliquity: {ttJulianDay: 2400000.5 + 54388, radians: Number(section('t_obl80').match(/vvd\(eps0,\s*([^,]+)/)[1])},
 nutation: {ttJulianDay: 2400000.5 + 53736,
  longitudeRadians: Number(nut.match(/vvd\(dpsi,\s*([^,]+)/)[1]), obliquityRadians: Number(nut.match(/vvd\(deps,\s*([^,]+)/)[1])},
 meanNode: {ttJulianDay: 2451545 + .8 * 36525,
  signedRadians: Number(section('t_faom03').match(/vvd\(eraFaom03\(0\.80\),\s*([^,]+)/)[1])}};
const fixtureText = JSON.stringify(fixture, null, 2) + '\n';
const fixturePath = path.resolve(__dirname, '../tests/fixtures/vedic-sidereal/erfa-reference.json');
if (process.argv[2] === '--check') assert.equal(fs.readFileSync(fixturePath, 'utf8'), fixtureText);
else fs.writeFileSync(fixturePath, fixtureText);
console.log(JSON.stringify({terms: rows.length, sources: manifest.sources.length, sourceSha256: data.source.sha256}));
