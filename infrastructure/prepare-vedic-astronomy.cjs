'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../packages/vedic');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const engineHash = '6257fd34e7a74370767a98bf26d1724d748e5f71c1530be6730ff21336cc6607';
assert.equal(hash(fs.readFileSync(path.join(root, 'vendor/astronomy-engine-2.1.19.mjs'))), engineHash);
const raw = fs.readFileSync(path.join(root, 'data/sources/iana-leap-seconds-20261024.list'));
assert.equal(hash(raw), 'db5a895f16853b03bfc865e8d68f9fc8710ef1740e3400c701cd46a5bbbc3433');
const text = raw.toString('utf8'), ntpEpoch = Date.parse('1900-01-01T00:00:00Z');
const entries = text.split(/\r?\n/).filter(line => /^\d/.test(line)).map(line => {
 const [ntp, offset] = line.trim().split(/\s+/).map(Number);
 return {effectiveUtc: new Date(ntpEpoch + ntp * 1000).toISOString(), taiMinusUtcSeconds: offset};
});
assert.equal(entries.length, 28); assert.equal(entries.at(-1).taiMinusUtcSeconds, 37);
const expiry = new Date(ntpEpoch + Number(text.match(/^#@\s*(\d+)/m)[1]) * 1000).toISOString();
const data = {version: 'iana-leap-seconds-20261024-v1',
 source: 'https://data.iana.org/time-zones/tzdb/leap-seconds.list', retrieved: '2026-10-24',
 sourceSha256: hash(raw), sourceLicense: 'public-domain', expiresUtc: expiry, entries};
const output = JSON.stringify(data, null, 2) + '\n';
const target = path.join(root, 'data/leap-seconds.json');
if (process.argv[2] === '--check') assert.equal(fs.readFileSync(target, 'utf8'), output);
else {assert.equal(process.argv.length, 2); fs.writeFileSync(target, output);}
console.log(JSON.stringify({engineHash, leapEntries: entries.length, expiresUtc: expiry}));
