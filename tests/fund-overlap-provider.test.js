const {test} = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('../apps/fund-overlap/tests/fixtures/groww-excerpt.json');
const {createProvider, parseSearch} = require('../apps/fund-overlap/backend/provider');
const {createFundOverlap} = require('../apps/fund-overlap/backend/routes');
const {analyze} = require('../apps/fund-overlap/frontend/engine');

function providerFor(fund = structuredClone(fixture.fund), stockTransform = x => x) {
  const calls = [];
  const provider = createProvider({now: () => Date.parse('2026-09-07'), fetchImpl: async (url, options) => {
    calls.push({url, options});
    assert.equal(new URL(url).origin, 'https://groww.in');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Cookie, undefined);
    if (url.includes('/scheme/search/')) return Response.json(fund);
    const slug = url.split('/').at(-1);
    return Response.json(stockTransform({header: {searchId: slug, isin: fixture.identifiers[slug]}}));
  }});
  return {provider, calls};
}

test('national provider resolves public source excerpt, IST date, NAV weights, provenance and request cache', async () => {
  const {provider, calls} = providerFor();
  const [a, b] = await Promise.all([provider.snapshot(fixture.fund.search_id), provider.snapshot(fixture.fund.search_id)]);
  assert.equal(a, b);
  assert.equal(a.portfolioDate, '2026-07-31');
  assert.equal(a.portfolioKey, 'amfi-118955');
  assert.equal(a.holdings.length, fixture.fund.holdings.filter(h => h.instrument_name === 'Equity').length);
  assert.equal(a.holdings.find(h => h.isin === 'INE090A01021').weight, 9.20908573);
  assert.ok(a.holdings.every(h => h.name !== 'Repo'));
  assert.equal(a.source.kind, 'aggregator');
  assert.match(a.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(calls.length, 1 + a.holdings.length);
  await provider.snapshot(fixture.fund.search_id);
  assert.equal(calls.length, 1 + a.holdings.length);
});

test('national provider rejects wrong identities, invalid dates/weights, bad ISINs and non-equity portfolios', async () => {
  const cases = [
    f => {f.search_id = 'wrong';},
    f => {f.holdings[0].portfolio_date = '2030-01-01';},
    f => {f.holdings.forEach(h => {h.portfolio_date = '2030-01-01';});},
    f => {f.holdings[0].corpus_per = -1;},
    f => {f.holdings[0].corpus_per = '9.2';},
    f => {f.holdings = f.holdings.filter(h => h.instrument_name === 'Repo');},
  ];
  for (const change of cases) {
    const fund = structuredClone(fixture.fund); change(fund);
    await assert.rejects(providerFor(fund).provider.snapshot(fixture.fund.search_id));
  }
  await assert.rejects(providerFor(undefined, x => ({header: {...x.header, isin: 'INE090A01022'}})).provider.snapshot(fixture.fund.search_id), /ISIN/);
  await assert.rejects(providerFor().provider.snapshot('../secrets'), /identifier/);
});

test('unidentified source equities are explicitly reported as omitted and duplicate portfolio variants are rejected', async () => {
  const fund = structuredClone(fixture.fund);
  fund.holdings.push({...fund.holdings[0], company_name: 'Unidentified fixture equity', corpus_per: 1.5, stock_search_id: null});
  const a = await providerFor(fund).provider.snapshot(fund.search_id);
  assert.equal(a.unresolvedNavWeight, 1.5); assert.equal(a.unresolvedHoldings.length, 1);
  const other = {...a, schemeId: 'other', portfolioKey: 'other', name: 'Another fixture fund'};
  assert.ok(analyze([a, other]).warnings.some(w => w.includes('partial comparison')));
  assert.throws(() => analyze([a, {...a, schemeId: 'regular', name: 'Regular variant'}]), /share a portfolio/);
});

test('search adapter excludes non-funds and unsafe identifiers; upstream failures are not cached', async () => {
  const rows = parseSearch({data: {content: [
    {entity_type: 'Scheme', search_id: 'hdfc-equity-fund-direct-growth', title: 'HDFC Flexi Cap'},
    {entity_type: 'Stock', search_id: 'icici-bank-ltd', title: 'ICICI Bank'},
    {entity_type: 'Scheme', search_id: '../escape', title: 'Unsafe'},
  ]}});
  assert.equal(rows.length, 1);
  let calls = 0;
  const provider = createProvider({fetchImpl: async () => {calls++; return new Response('', {status: 503});}});
  await assert.rejects(provider.search('hdfc')); await assert.rejects(provider.search('hdfc'));
  assert.equal(calls, 2);
});

function response() {
  return {headers: {}, setHeader(k, v) {this.headers[k] = v;}, writeHead(status) {this.status = status;}, end(body) {this.body = body;}};
}
test('public national routes validate input and survive session expiry; search failure retains local funds', async () => {
  let allowed = true, session = {id: 'fixture'}, calls = 0;
  const auth = {hasAppAccess: () => allowed, session: () => session};
  const provider = {search: async () => {calls++; throw Error('offline');}, snapshot: async () => {calls++; session = null; return {};}};
  const handle = createFundOverlap({auth, provider});
  const invoke = (route, url = '/api/fund-overlap/' + route) => {
    const res = response();
    return handle({route: 'fund-overlap/' + route, method: 'GET', req: {url, headers: {}}, res, user: {id: 'fixture'}}).then(() => res);
  };
  allowed = true; await assert.rejects(invoke('search', '/api/fund-overlap/search?q=x'), e => e.status === 400); assert.equal(calls, 0);
  const result = await invoke('search', '/api/fund-overlap/search?q=parag');
  assert.equal(JSON.parse(result.body).funds.length, 5); assert.match(JSON.parse(result.body).warning, /temporarily unavailable/);
  assert.match(result.headers['Cache-Control'], /private, no-store/);
  assert.equal((await invoke('remote/hdfc-equity-fund-direct-growth')).status,200);
  assert.equal(calls, 2);
});
