const {createHash} = require('node:crypto');
const {normalize, validIsin} = require('../frontend/engine');
const {createProvider} = require('./provider');
const {createPublicApi} = require('./public-api');
const {createReferenceCache} = require('./reference-cache');
const DAY = 86400000;
const codeValid = code => /^\d{5,8}$/.test(String(code));
const fundIdValid = id => typeof id === 'string' && /^M_[A-Z0-9]{1,20}$/.test(id);
const securityIdValid = id => typeof id === 'string' && /^[A-Z0-9_-]{1,30}$/.test(id);
const textValid = value => typeof value === 'string' && value.trim() && value.length <= 300;
// Only plan/option words are removed. Never fuzzy-match different underlying funds.
const currentName = name => String(name).replace(/\((?:erstwhile|formerly|previously)\b[^)]*\)/gi, '');
const familyName = name => currentName(name).toLowerCase().replace(/\b(fund|direct|regular|plan|growth|option|idcw|dividend|payout|reinvestment|reinvest|reinv)\b/g, '').replace(/[^a-z0-9]/g, '');

function validateSnapshot(value) {
  if (!value || !/^amfi-\d{5,8}$/.test(value.schemeId) || !textValid(value.name) || !textValid(value.amc)) throw Error('Invalid fund identity');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.portfolioDate) || !Number.isFinite(Date.parse(value.portfolioDate)) || new Date(value.portfolioDate).toISOString().slice(0,10) !== value.portfolioDate) throw Error('Invalid portfolio date');
  const {total} = normalize(value.holdings);
  if (!Number.isFinite(value.unresolvedNavWeight) || value.unresolvedNavWeight < 0 || total + value.unresolvedNavWeight > 100.5) throw Error('Invalid portfolio coverage');
  if (Math.abs(total - value.includedNavWeight) > 0.00001) throw Error('Portfolio weights do not reconcile');
}

function createNationalProvider({fetchImpl = fetch, now = () => Date.now(), cacheDir, groww = createProvider({fetchImpl, now}), delayMs = 250} = {}) {
  const api = createPublicApi({fetchImpl, delayMs}), cache = createReferenceCache(cacheDir, {now});
  async function catalogue() {
    return cache.get('mfapi:catalogue', DAY, async () => {
      const {data} = await api.request('https://api.mfapi.in/mf');
      if (!Array.isArray(data) || !data.length || data.length > 100000) throw Error('Fund catalogue format changed');
      return data.filter(row => codeValid(row.schemeCode) && textValid(row.schemeName)).map(row => ({code: String(row.schemeCode), name: row.schemeName}));
    }, rows => {if (!Array.isArray(rows) || !rows.length || rows.some(r => !codeValid(r.code) || !textValid(r.name))) throw Error('Invalid fund catalogue');});
  }
  async function search(query, offset = 0) {
    const {value: rows, stale} = await catalogue();
    const term = query.toLowerCase().trim(), words = term.split(/\s+/);
    // Rank Direct Growth first within an exact family, while keeping code lookup exact.
    const matches = rows.filter(r => r.code === term || words.every(w => r.name.toLowerCase().includes(w) || r.name.toLowerCase().replace(/[^a-z0-9]/g,'').includes(w.replace(/[^a-z0-9]/g,''))));
    const exact = row => familyName(row.name) === familyName(term);
    const phrase = row => row.name.toLowerCase().replace(/[^a-z0-9]+/g,' ').includes(words.join(' '));
    matches.sort((a,b) => (b.code === term) - (a.code === term) || exact(b)-exact(a) || phrase(b)-phrase(a) || (/direct/i.test(b.name)*2 + /growth/i.test(b.name)) - (/direct/i.test(a.name)*2 + /growth/i.test(a.name)) || a.name.localeCompare(b.name) || a.code.localeCompare(b.code));
    const groups = new Map(); for (const row of matches) if (!groups.has(familyName(row.name))) groups.set(familyName(row.name), row);
    const funds = [...groups.values()].map(r => ({id:'amfi-'+r.code, name:r.name, amc:'Indian mutual fund · AMFI '+r.code, category:'Scheme catalogue', provider:'MFapi', holdingsPath:'/api/fund-overlap/scheme/'+r.code}));
    return {funds:funds.slice(offset,offset+20), nextOffset:offset+20<funds.length?offset+20:null, total:funds.length, catalogueCount:rows.length, warning:stale?'Fund catalogue refresh failed; saved catalogue shown. Retry shortly.':undefined};
  }
  async function metadata(code) {
    return (await cache.get('mfapi:meta:'+code, DAY, async () => {
      const {data} = await api.request('https://api.mfapi.in/mf/'+code+'/latest');
      if (data.status !== 'SUCCESS') throw Error('Scheme metadata is unavailable');
      return data.meta;
    }, meta => {if (String(meta?.scheme_code)!==code || !textValid(meta.scheme_name) || !textValid(meta.fund_house)) throw Error('Scheme identity mismatch');})).value;
  }
  async function tickerFund(meta) {
    const {value: rows} = await cache.get('tickertape:catalogue', DAY, async () => {
      const {data} = await api.request('https://api.tickertape.in/mutualfunds/list');
      if (!data.success || !Array.isArray(data.data?.universe)) throw Error('Holdings catalogue unavailable');
      return data.data.universe.filter(row => fundIdValid(row.mfId) && textValid(row.fullName) && typeof row.slug==='string' && /^\/mutualfunds\/[a-zA-Z0-9_-]+$/.test(row.slug) && row.slug.endsWith('-'+row.mfId));
    }, rows => {if (!Array.isArray(rows) || !rows.length || rows.some(r=>!fundIdValid(r.mfId)||!textValid(r.fullName)||!/^\/mutualfunds\/[a-zA-Z0-9_-]+$/.test(r.slug)||!r.slug.endsWith('-'+r.mfId))) throw Error('Invalid holdings catalogue');});
    // This endpoint is capped at 1,000 rows: it is a holdings resolver, never our national catalogue.
    return rows.find(row => validIsin(row.isin) && [meta.isin_growth,meta.isin_div_reinvestment].includes(row.isin)) || rows.find(row => familyName(row.fullName) === familyName(meta.scheme_name));
  }
  async function tickerStock(sid) {
    return (await cache.get('tickertape:stock:'+sid, 7*DAY, async () => {
      const {data, sha256} = await api.request('https://api.tickertape.in/stocks/info/'+sid);
      if (!data.success || data.data?.sid !== sid || data.data.type !== 'stock' || data.data.tradable !== true || !validIsin(data.data.isin)) throw Error('A stock identifier cannot be verified');
      return {sid, isin:data.data.isin, sector:data.data.info?.sector || 'Unknown', sha256};
    }, row => {if (row?.sid!==sid||!validIsin(row.isin)) throw Error('Invalid stock ISIN');})).value;
  }
  async function tickerSnapshot(meta, row) {
    const {data: infoBody} = await api.request('https://api.tickertape.in/mutualfunds/'+row.mfId+'/info');
    const info = infoBody.data;
    if (!infoBody.success || info?.mfId!==row.mfId || familyName(info.name)!==familyName(meta.scheme_name)) throw Error('Holdings fund identity mismatch');
    const {data: body, sha256} = await api.request('https://api.tickertape.in/mutualfunds/'+row.mfId+'/holdings');
    const data = body.data;
    if (!body.success || !Array.isArray(data?.currentAllocation) || !data.currentAllocation.length || data.currentAllocation.length>2000 || !Array.isArray(data.assetAllocationHistory)) throw Error('Holdings are unavailable');
    const latest = [...data.assetAllocationHistory].sort((a,b)=>b.date-a.date)[0];
    if (!latest || !Number.isFinite(latest.date) || latest.date>now() || !Array.isArray(latest.holdings)) throw Error('Portfolio date unavailable');
    const portfolioDate = new Date(latest.date).toISOString().slice(0,10);
    const equity = latest.holdings.find(h=>h.assetClass==='Equity')?.value;
    const equities = data.currentAllocation.filter(h=>h.type==='Equity' && h.rating==='Equity');
    if (!equities.length || !Number.isFinite(equity) || equity<=0) throw Error('No physical equity holdings are available for this scheme');
    for (const h of equities) if (!Number.isFinite(h.latest)||h.latest<0||h.latest>100||!textValid(h.title)) throw Error('Invalid disclosed equity weight');
    if (Math.abs(equities.reduce((sum,h)=>sum+h.latest,0)-equity)>0.1) throw Error('Current holdings do not reconcile with the dated equity allocation');
    const holdings=[], unresolvedHoldings=[], identifiers=[];
    for(let start=0;start<equities.length;start+=4) {
      await Promise.all(equities.slice(start,start+4).map(async h=>{
        if(!h.latest)return;
        if(!securityIdValid(h.sid)){unresolvedHoldings.push({name:h.title,weight:h.latest});return;}
        const stock=await tickerStock(h.sid);
        identifiers.push(stock);holdings.push({isin:stock.isin,name:h.title,sector:stock.sector,weight:h.latest});
      }));
    }
    const normalized=normalize(holdings);
    return {name:meta.scheme_name,amc:meta.fund_house,category:meta.scheme_category,portfolioDate,holdings:normalized.holdings,includedNavWeight:normalized.total,
      unresolvedHoldings,unresolvedNavWeight:unresolvedHoldings.reduce((s,h)=>s+h.weight,0),
      source:{publisher:'Tickertape',kind:'aggregator',url:'https://www.tickertape.in'+row.slug,indexUrl:'https://www.tickertape.in/mutualfunds',fetchedAt:new Date(now()).toISOString(),sha256,adapterVersion:1,identifiers,
        dateBasis:'Latest asset-allocation reporting date; current equity weights reconciled against that dated allocation.'}};
  }
  async function loadScheme(code) {
    const meta = await metadata(code); let source;
    try {const row=await tickerFund(meta); if(row)source=await tickerSnapshot(meta,row);} catch { /* Independent secondary source below; never mix rows or dates. */ }
    if(!source) {
      const query=currentName(meta.scheme_name).replace(/\b(direct|regular|plan|growth|option|idcw|dividend|payout|reinvestment|reinvest)\b/gi,'').replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
      const rows=await groww.search(query);
      const match=rows.find(r=>familyName(r.name)===familyName(meta.scheme_name));
      if(!match)throw Error('This scheme is in the national catalogue, but verified equity holdings are not available from the free sources. Try another scheme.');
      source=await groww.snapshot(match.id.slice(6));
      if(familyName(source.name)!==familyName(meta.scheme_name))throw Error('Holdings fund identity mismatch');
    }
    const result={...source,schemeId:'amfi-'+code,portfolioKey:'family-'+createHash('sha256').update(familyName(meta.scheme_name)).digest('hex').slice(0,20),
      name:meta.scheme_name,amc:meta.fund_house,category:meta.scheme_category,schemeCode:code,
      source:{...source.source,catalogueUrl:'https://api.mfapi.in/mf/'+code+'/latest'}};
    validateSnapshot(result); if(Date.parse(result.portfolioDate)>now())throw Error('Portfolio date is in the future');
    return result;
  }
  async function scheme(code,{force=false}={}) {
    code=String(code);if(!codeValid(code))throw Error('Invalid scheme code');
    const {value,stale,persisted}=await cache.get('scheme:'+code,DAY,()=>loadScheme(code),value=>{
      validateSnapshot(value);
      if(value.schemeId!=='amfi-'+code || Date.parse(value.portfolioDate)>now())throw Error('Invalid cached portfolio identity or date');
    },{force});
    return {...value,cacheStatus:stale?'stale':'current',cacheWarning:stale?'Source refresh failed. Showing the last verified saved portfolio with its original reporting date.':persisted===false?'Live data loaded, but saving the offline reference copy failed.':undefined};
  }
  return {search,scheme,snapshot:groww.snapshot,savedSchemeCodes:cache.savedSchemeCodes};
}
module.exports={createNationalProvider,familyName,codeValid,validateSnapshot};
