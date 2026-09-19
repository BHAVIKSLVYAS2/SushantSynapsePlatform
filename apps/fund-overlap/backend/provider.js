const {createHash} = require('node:crypto');
const {normalize, validIsin} = require('../frontend/engine');
const {fail} = require('../../../server/http');

const ORIGIN = 'https://groww.in';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugValid = value => typeof value === 'string' && value.length <= 160 && SLUG.test(value);
const digest = value => createHash('sha256').update(value).digest('hex');
const canonicalName = value => value.toLowerCase().replace(/\b(direct|regular|plan|growth|option|idcw|dividend|payout|reinvestment)\b/g, '').replace(/[^a-z0-9]/g, '');

function parseSearch(payload) {
  const rows = payload?.data?.content;
  if (!Array.isArray(rows)) throw Error('Fund search format changed');
  return rows.filter(row => row.entity_type === 'Scheme' && slugValid(row.search_id) && typeof row.title === 'string' && row.title.length <= 250).map(row => ({
    id: 'groww-' + row.search_id, name: row.title, amc: 'Across Indian fund houses', category: 'Mutual fund',
    holdingsPath: '/api/fund-overlap/remote/' + row.search_id, provider: 'Groww',
  }));
}

// No user-supplied URLs, cookies or credentials are forwarded to the provider.
function createProvider({fetchImpl = fetch, now = () => Date.now()} = {}) {
  const cache = new Map(), pending = new Map(), queue = [];
  let active = 0;
  async function limited(fn) {
    if (active >= 4) {
      if (queue.length >= 300) fail(503, 'Fund data is busy. Please retry shortly.');
      await new Promise(resolve => queue.push(resolve));
    } else active++;
    try { return await fn(); }
    finally { const next = queue.shift(); if (next) next(); else active--; }
  }
  async function cached(key, ttl, fn) {
    const hit = cache.get(key);
    if (hit && hit.expires > now()) return hit.value;
    if (pending.has(key)) return pending.get(key);
    const task = Promise.resolve().then(fn).then(value => {
      if (cache.size >= 2500) cache.delete(cache.keys().next().value);
      cache.set(key, {value, expires: now() + ttl}); return value;
    }).finally(() => pending.delete(key));
    pending.set(key, task); return task;
  }
  async function request(path) {
    return limited(async () => {
      const response = await fetchImpl(ORIGIN + path, {redirect: 'error', signal: AbortSignal.timeout(15000), headers: {'Accept': 'application/json', 'User-Agent': 'FundLens/1.0'}});
      if (!response.ok) throw Error('Fund data source is temporarily unavailable');
      let size = 0; const chunks = [];
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 5_000_000) throw Error('Fund data response is too large');
        chunks.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks);
      return {data: JSON.parse(raw.toString('utf8')), sha256: digest(raw)};
    });
  }
  async function search(query, offset = 0) {
    return cached('search:' + query.toLowerCase() + ':' + offset, 300000, async () => {
      const params = new URLSearchParams({query, from: String(offset), size: '20', entity_type: 'scheme', web: 'true'});
      return parseSearch((await request('/v1/api/search/v3/query/global/st_query?' + params)).data);
    });
  }
  async function stock(slug) {
    if (!slugValid(slug)) throw Error('A holding has no verifiable security identifier');
    return cached('stock:' + slug, 86400000, async () => {
      const {data, sha256} = await request('/v1/api/stocks_data/v1/company/search_id/' + slug);
      if (data?.header?.searchId !== slug || !validIsin(data.header.isin)) throw Error('A holding has no verifiable ISIN');
      return {isin: data.header.isin, sha256, url: ORIGIN + '/stocks/' + slug};
    });
  }
  async function snapshot(slug) {
    if (!slugValid(slug)) fail(400, 'Invalid fund identifier');
    return cached('fund:' + slug, 3600000, async () => {
      const {data: fund, sha256} = await request('/v1/api/data/mf/web/v5/scheme/search/' + slug);
      if (fund.search_id !== slug || !Array.isArray(fund.holdings) || !fund.holdings.length || fund.holdings.length > 2000 || !/^\d{5,8}$/.test(String(fund.direct_scheme_code || fund.scheme_code))) throw Error('Holdings are unavailable for this fund');
      const dates = new Set(fund.holdings.map(h => {
        const time = Date.parse(h.portfolio_date);
        if (!Number.isFinite(time)) throw Error('Portfolio date is unavailable');
        // Source timestamps encode the reporting date at midnight in India.
        return new Date(time + 19800000).toISOString().slice(0, 10);
      }));
      if (dates.size !== 1) throw Error('The source contains mixed portfolio dates');
      const portfolioDate = [...dates][0];
      if (Date.parse(portfolioDate) > now()) throw Error('The source portfolio date is in the future');
      const equities = fund.holdings.filter(h => h.nature_name === 'EQUITY' && h.instrument_name === 'Equity');
      if (!equities.length) throw Error('This fund has no disclosed physical equities to compare. Debt, gold and fund-of-funds look-through are not supported.');
      const identifiers = new Map(), unresolved = [];
      const holdings = [];
      // Small batches bound upstream work, including when a fund cannot be resolved.
      for (let start = 0; start < equities.length; start += 4) {
        const batch = await Promise.all(equities.slice(start, start + 4).map(async h => {
          if (typeof h.corpus_per !== 'number' || !Number.isFinite(h.corpus_per) || h.corpus_per < 0 || h.corpus_per > 100) throw Error('Invalid disclosed equity weight');
          if (h.corpus_per === 0) return null;
          if (!slugValid(h.stock_search_id)) {
            unresolved.push({name: h.company_name, weight: h.corpus_per}); return null;
          }
          const identifier = await stock(h.stock_search_id);
          identifiers.set(h.stock_search_id, identifier);
          return {isin: identifier.isin, name: h.company_name, sector: h.sector_name || 'Unknown', weight: h.corpus_per};
        }));
        holdings.push(...batch.filter(Boolean));
      }
      const normalized = normalize(holdings);
      const name = fund.scheme_name;
      if (typeof name !== 'string' || name.length > 250 || typeof fund.fund_house !== 'string') throw Error('Fund identity is unavailable');
      return {
        schemeId: 'groww-' + slug, portfolioKey: 'amfi-' + (fund.direct_scheme_code || fund.scheme_code), name,
        amc: fund.fund_house, category: fund.sub_category || fund.category || 'Mutual fund', portfolioDate,
        includedNavWeight: normalized.total, holdings: normalized.holdings,
        unresolvedHoldings: unresolved, unresolvedNavWeight: unresolved.reduce((sum, h) => sum + h.weight, 0),
        policy: 'Provider-reported physical equities with verified ISINs; excludes debt, cash, derivatives and fund units. No hedge netting or look-through.',
        source: {publisher: 'Groww', kind: 'aggregator', url: ORIGIN + '/mutual-funds/' + slug, indexUrl: ORIGIN + '/mutual-funds', fetchedAt: new Date(now()).toISOString(), sha256, adapterVersion: 1,
          identifiers: [...identifiers].map(([searchId, item]) => ({searchId, ...item}))},
      };
    });
  }
  return {search, snapshot};
}
module.exports = {createProvider, parseSearch, canonicalName, slugValid};
