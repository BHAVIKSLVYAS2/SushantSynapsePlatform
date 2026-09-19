const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash, randomUUID} = require('node:crypto');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Public provider reference data only. No accounts, sessions or comparison selections.
function createReferenceCache(directory, {now = () => Date.now()} = {}) {
  const pending = new Map(), memory = new Map(), retryAfter = new Map();
  const keyName = key => hash(key);
  async function read(key) {
    if (memory.has(key)) return memory.get(key);
    if (!directory) return null;
    try {
      const pointer = JSON.parse(await fs.readFile(path.join(directory, keyName(key) + '.json'), 'utf8'));
      if (!/^[a-f0-9]{64}$/.test(pointer.sha256)) return null;
      const raw = await fs.readFile(path.join(directory, pointer.sha256 + '.snapshot.json'));
      if (raw.length > 20_000_000 || hash(raw) !== pointer.sha256) return null;
      const entry = JSON.parse(raw);
      if (entry.key !== key || !Number.isFinite(entry.savedAt) || entry.savedAt > now()) return null;
      return entry;
    } catch { return null; }
  }
  async function write(key, entry) {
    if (memory.size >= 1000) memory.delete(memory.keys().next().value);
    memory.set(key, entry);
    if (!directory) return;
    await fs.mkdir(directory, {recursive: true});
    const raw = JSON.stringify(entry), sha256 = hash(raw);
    // Immutable content first; publish its small pointer last.
    const version = path.join(directory, sha256 + '.snapshot.json');
    try { await fs.writeFile(version, raw, {flag: 'wx'}); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    const target = path.join(directory, keyName(key) + '.json'), temp = target + '.' + randomUUID() + '.tmp';
    try { await fs.writeFile(temp, JSON.stringify({sha256}), {flag: 'wx'}); await fs.rename(temp, target); }
    finally { await fs.unlink(temp).catch(() => {}); }
  }
  async function get(key, ttl, load, validate = () => {}, {force = false} = {}) {
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      let previous = await read(key);
      try { if (previous) validate(previous.value); } catch { previous = null; }
      if (!force && previous && now() - previous.savedAt < ttl) return {value: previous.value, stale: false};
      if (!force && (retryAfter.get(key) || 0) > now()) {
        if (previous) return {value: previous.value, stale: true};
        throw Error('Fund source is temporarily unavailable. Retry shortly.');
      }
      try {
        const value = await load(); validate(value);
        if (previous?.value.portfolioDate && value.portfolioDate < previous.value.portfolioDate) throw Error('Portfolio date regressed');
        const entry = {key, savedAt: now(), value};
        // A disk failure must not hide an otherwise validated live response.
        let persisted = true;
        try { await write(key, entry); } catch { persisted = false; }
        retryAfter.delete(key);
        return {value, stale: false, persisted};
      } catch (error) {
        if (retryAfter.size >= 1000) retryAfter.delete(retryAfter.keys().next().value);
        retryAfter.set(key, now() + 60000);
        if (previous) return {value: previous.value, stale: true};
        throw error;
      }
    })().finally(() => pending.delete(key));
    pending.set(key, task); return task;
  }
  async function savedSchemeCodes() {
    if (!directory) return [];
    const names = await fs.readdir(directory).catch(() => []), codes = new Set();
    for (const file of names.filter(n => /^[a-f0-9]{64}\.json$/.test(n))) {
      try {
        const pointer = JSON.parse(await fs.readFile(path.join(directory, file), 'utf8'));
        if (!/^[a-f0-9]{64}$/.test(pointer.sha256)) continue;
        const raw = await fs.readFile(path.join(directory, pointer.sha256 + '.snapshot.json'));
        if (hash(raw) !== pointer.sha256) continue;
        const entry = JSON.parse(raw), match = /^scheme:(\d{5,8})$/.exec(entry.key);
        if (match) codes.add(match[1]);
      } catch { /* Ignore incomplete/corrupt reference artifacts. */ }
    }
    return [...codes].sort();
  }
  return {get, savedSchemeCodes};
}
module.exports = {createReferenceCache};
