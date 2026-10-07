const {createHash} = require('node:crypto');
const ALLOWED = new Set(['https://api.mfapi.in', 'https://api.tickertape.in']);

function createPublicApi({fetchImpl = fetch, delayMs = 250} = {}) {
  const queue = []; let active = 0, lastStart = 0, cooldown = 0;
  async function request(url) {
    if (!ALLOWED.has(new URL(url).origin)) throw Error('Unsupported reference source');
    if (Date.now() < cooldown) throw Error('Reference source rate limited. Retry shortly.');
    if (active >= 4) {
      if (queue.length >= 200) throw Error('Reference source is busy. Retry shortly.');
      await new Promise(resolve => queue.push(resolve));
    } else active++;
    try {
      const start = Math.max(Date.now(), lastStart + delayMs); lastStart = start;
      if (start > Date.now()) await new Promise(resolve => setTimeout(resolve, start - Date.now()));
      if (Date.now() < cooldown) throw Error('Reference source rate limited. Retry shortly.');
      const response = await fetchImpl(url, {redirect: 'manual', signal: AbortSignal.timeout(20000), headers: {Accept: 'application/json', 'User-Agent': 'FundLens/2.0'}});
      if (response.status === 429) {cooldown = Date.now() + 60000; throw Error('Reference source rate limited. Retry shortly.');}
      if (!response.ok) throw Error('Reference source is temporarily unavailable');
      const chunks = []; let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length; if (size > 20_000_000) throw Error('Reference response is too large');
        chunks.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks);
      return {data: JSON.parse(raw.toString('utf8')), sha256: createHash('sha256').update(raw).digest('hex')};
    } finally {const next = queue.shift(); if (next) next(); else active--;}
  }
  return {request};
}
module.exports = {createPublicApi};
