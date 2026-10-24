'use strict';
// Offline development-time capture/build only. Runtime imports generated JSON.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../packages/vedic/data');
const sources = path.join(root, 'sources');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFileSync(path.join(sources, name));
const text = name => read(name).toString('utf8');
const args = process.argv.slice(2);
const capture = args[0] && args[0] !== '--check';
if (capture) {
 assert.equal(args.length, 2, 'Usage: node infrastructure/prepare-vedic-data.cjs <source-directory> <retrieval-date>');
 assert.match(args[1], /^\d{4}-\d{2}-\d{2}$/);
 const incoming = path.resolve(args[0]);
 const cityBytes = fs.readFileSync(path.join(incoming, 'cities15000.txt'));
 const adminBytes = fs.readFileSync(path.join(incoming, 'admin1CodesASCII.txt'));
 const rows = cityBytes.toString('utf8').split(/\r?\n/).filter(row => row.split('\t')[8] === 'IN');
 const states = adminBytes.toString('utf8').split(/\r?\n/).filter(row => row.startsWith('IN.'));
 assert.ok(rows.length > 500 && rows.length < 10000);
 fs.writeFileSync(path.join(sources, 'geonames-india-cities.tsv'), rows.join('\n') + '\n');
 fs.writeFileSync(path.join(sources, 'geonames-india-admin1.tsv'), states.join('\n') + '\n');
 fs.copyFileSync(path.join(incoming, 'geonames-readme.txt'), path.join(sources, 'geonames-readme.txt'));
 fs.writeFileSync(path.join(sources, 'capture.json'), JSON.stringify({retrieved: args[1],
  citySource: 'https://download.geonames.org/export/dump/cities15000.zip',
  cityZipSha256: hash(fs.readFileSync(path.join(incoming, 'cities15000.zip'))),
  cityTextSha256: hash(cityBytes),
  adminSource: 'https://download.geonames.org/export/dump/admin1CodesASCII.txt',
  adminTextSha256: hash(adminBytes),
  citySubsetSha256: hash(read('geonames-india-cities.tsv')),
  adminSubsetSha256: hash(read('geonames-india-admin1.tsv')),
  readmeSha256: hash(read('geonames-readme.txt'))}, null, 2) + '\n');
} else assert.ok(args.length === 0 || args.length === 1 && args[0] === '--check');

const captured = JSON.parse(text('capture.json'));
for (const [file, expected] of [['geonames-india-cities.tsv', captured.citySubsetSha256],
 ['geonames-india-admin1.tsv', captured.adminSubsetSha256], ['geonames-readme.txt', captured.readmeSha256]]) {
 assert.equal(hash(read(file)), expected, 'Pinned source changed: ' + file);
}
const states = new Map(text('geonames-india-admin1.tsv').trim().split('\n').map(row => {
 const [code, name] = row.split('\t'); return [code, name];
}));
const places = text('geonames-india-cities.tsv').trim().split('\n').map(row => {
 const c = row.split('\t');
 assert.equal(c.length, 19);
 const latitude = Number(c[4]), longitude = Number(c[5]), stateCode = 'IN.' + c[10];
 assert.equal(c[8], 'IN'); assert.equal(c[6], 'P');
 assert.ok(['Asia/Kolkata', 'Asia/Calcutta'].includes(c[17]));
 assert.ok(states.has(stateCode), 'Missing state for ' + c[0]);
 assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90);
 assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
 const aliases = [...new Set([c[2], ...c[3].split(',')])]
  .filter(name => name && name !== c[1] && name.length <= 100).sort();
 return {id: 'geonames:' + c[0], name: c[1], aliases, latitude, longitude,
  countryCode: c[8], stateCode, state: states.get(stateCode),
  timeZoneId: 'Asia/Kolkata', sourceTimeZoneId: c[17], population: Number(c[14]),
  sourceModified: c[18]};
}).sort((a, b) => Number(a.id.slice(9)) - Number(b.id.slice(9)));
assert.equal(new Set(places.map(place => place.id)).size, places.length);
const directory = {version: 'geonames-india-cities15000-' + captured.retrieved + '-v1',
 source: 'https://www.geonames.org/', license: 'CC-BY-4.0', retrieved: captured.retrieved,
 sourceSha256: captured.citySubsetSha256,
 coverage: 'GeoNames cities15000 India entries only; incomplete settlement coverage, approximate points, no accuracy warranty.',
 places};

const asia = text('iana-2025b-asia.txt');
assert.equal(hash(read('iana-2025b-asia.txt')), '9a8b7e640cb0692b9e50b9126f599bf89360a2f9ed9e54b722f3e5b6f631b419', 'Pinned IANA 2025b source changed');
const start = asia.indexOf('Zone\tAsia/Kolkata\t');
assert.ok(start >= 0);
const lines = asia.slice(start).split('\n');
const block = [lines[0]];
for (const line of lines.slice(1)) { if (!/^\s/.test(line)) break; block.push(line); }
assert.match(block.at(-1).trim(), /^5:30\s+-\s+IST$/);
assert.match(block.join('\n'), /1945 Oct 15/);
// Deliberately bounded to post-war India. Not a generic tzdb compiler.
const rules = {version: 'india-civil-2025b-1950-2098-v1', tzdbVersion: '2025b',
 timeZoneId: 'Asia/Kolkata', offsetMinutes: 330, localStart: '1950-01-01',
 localEndExclusive: '2099-01-01', source: 'https://data.iana.org/time-zones/tzdb-2025b/asia',
 sourceSha256: hash(read('iana-2025b-asia.txt')), sourceLicense: 'public-domain',
 sourceZoneBlock: block.join('\n')};

for (const [file, value] of [['india-places.json', directory], ['india-time.json', rules]]) {
 const output = JSON.stringify(value, null, 2) + '\n';
 if (args[0] === '--check') assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), output, file + ' must be regenerated');
 else fs.writeFileSync(path.join(root, file), output);
}
console.log(JSON.stringify({mode: args[0] === '--check' ? 'check' : 'build', places: places.length,
 timeRuleVersion: rules.version, sourceSha256: directory.sourceSha256}));
