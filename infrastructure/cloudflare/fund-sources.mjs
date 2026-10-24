import national from '../../apps/fund-overlap/backend/national-provider.js';
import legacy from '../../apps/fund-overlap/backend/provider.js';
import official from '../../apps/fund-overlap/backend/official-library.js';
import referenceManifest from './fund-runtime-manifest.json' with {type:'json'};
import archives from './fund-archives.json' with {type:'json'};
// Only Fund Lens requests load reference data. Cache is isolated by asset binding.
const referenceStores=new WeakMap();
function referenceStore(assets){if(!assets)throw Object.assign(Error('Official reference storage is temporarily unavailable.'),{status:503});let store=referenceStores.get(assets);if(!store){store=new Map();referenceStores.set(assets,store);}return store;}
function loadPartition(assets,origin,name,path=referenceManifest[name]){
 const store=referenceStore(assets);if(!store.has(name))store.set(name,(async()=>{const response=await assets.fetch(new Request(new URL(path,origin)));if(!response.ok)throw Object.assign(Error('Official reference storage is temporarily unavailable.'),{status:503});return response.json();})().catch(error=>{store.delete(name);throw error;}));return store.get(name);
}
export async function loadReferences(assets,origin,kind='base'){
 const store=referenceStore(assets),key='joined:'+kind;
 if(!store.has(key))store.set(key,Promise.all([loadPartition(assets,origin,'base'),kind==='base'?{}:loadPartition(assets,origin,kind)]).then(([base,extra])=>{
  const references={...base,...extra},report=base.__officialCoverage;
  if(report.compact){const {statuses,messages}=report.compact;const {compact,...metadata}=report;base.__officialCoverage={...metadata,schemes:report.schemes.map(([schemeCode,status,message])=>({schemeCode,status:statuses[status],message:messages[message]}))};references.__officialCoverage=base.__officialCoverage;}
  return references;
 }).catch(error=>{store.delete(key);throw error;}));return store.get(key);
}
async function fullCoverageRows(assets,origin,references,rows){
 const chunks=new Map();for(const row of rows){const position=references.__officialLookup.coverage[String(row.schemeCode)],chunk=Math.floor(position/referenceManifest.chunkSize);if(!chunks.has(chunk))chunks.set(chunk,loadPartition(assets,origin,'rows:'+chunk,referenceManifest.rows[chunk]));}
 await Promise.all(chunks.values());return Promise.all(rows.map(async row=>{const position=references.__officialLookup.coverage[String(row.schemeCode)],chunk=Math.floor(position/referenceManifest.chunkSize);return (await chunks.get(chunk))[position%referenceManifest.chunkSize];}));
}

// Public reference data only. Cache eviction may remove last-good copies.
export function edgeReferenceCache(cache, now = () => Date.now()) {
  const pending = new Map();
  return {async get(key, ttl, load, validate = () => {}) {
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      const url = 'https://apps.sushantsynapse.com/_fund-cache/v1/' + encodeURIComponent(key);
      let previous;
      try { previous = await (await cache?.match(url))?.json(); if (previous) { validate(previous.value); if (!Number.isFinite(previous.savedAt) || previous.savedAt > now()) previous = null; } } catch { previous = null; }
      if (previous && now() - previous.savedAt < ttl) return {value: previous.value, stale: false};
      try {
        const value = await load(); validate(value);
        if (previous?.value.portfolioDate && value.portfolioDate < previous.value.portfolioDate) throw Error('Portfolio date regressed');
        try { await cache?.put(url, Response.json({value, savedAt: now()}, {headers: {'Cache-Control': 'public, max-age=2592000'}})); } catch { /* Best-effort public cache. */ }
        return {value, stale: false};
      } catch (error) { if (previous) return {value: previous.value, stale: true}; throw error; }
    })().finally(() => pending.delete(key));
    pending.set(key, task); return task;
  }};
}
// One cache read/write per invocation keeps large portfolios within Free-plan limits.
// Partial verification is public reference work, never an incomplete comparison.
export async function boundedProvider(request, cache = globalThis.caches?.default, fetchImpl = fetch) {
  const path = new URL(request.url).pathname;
  // Search needs one catalogue read, not the holdings progress envelope. The
  // envelope repeatedly parsed/stringified the entire national catalogue and
  // rewrote it even on cache hits, exhausting the Worker's CPU budget.
  if (path === '/api/fund-overlap/search') {
    return {source: national.createNationalProvider({fetchImpl, referenceCache: edgeReferenceCache(cache), delayMs: 0}), save: async () => {}};
  }
  const key = 'https://apps.sushantsynapse.com/_fund-progress/v1/' + encodeURIComponent(path);
  let entries = {}, dirty = false;
  try { entries = await (await cache?.match(key))?.json() || {}; } catch { /* Cold cache. */ }
  // Keep progress as plain values. Response bodies are single-use streams;
  // cloning/re-reading them across nested cache loads can lose saved progress.
  const pending = new Map();
  const referenceCache = {async get(name, ttl, load, validate = () => {}) {
    if (pending.has(name)) return pending.get(name);
    const task = (async () => {
      const key = 'https://apps.sushantsynapse.com/_fund-cache/v1/' + encodeURIComponent(name);
      let previous = entries[key];
      try { if (previous) {validate(previous.value); if (!Number.isFinite(previous.savedAt) || previous.savedAt > Date.now()) previous = null;} } catch {previous = null;}
      if (previous && Date.now() - previous.savedAt < ttl) return {value:previous.value, stale:false};
      try {
        const value = await load(); validate(value);
        if (previous?.value.portfolioDate && value.portfolioDate < previous.value.portfolioDate) throw Error('Portfolio date regressed');
        entries[key] = {value, savedAt:Date.now()};
        dirty = true;
        return {value, stale:false};
      } catch (error) {if (previous) return {value:previous.value, stale:true}; throw error;}
    })().finally(() => pending.delete(name));
    pending.set(name, task); return task;
  }};
  let count = 0;
  const limitedFetch = (...args) => {
    if (++count > 36) {const error = Error('Continuing holdings verification'); error.code = 'FUND_CONTINUE'; throw error;}
    return fetchImpl(...args);
  };
  const source = national.createNationalProvider({fetchImpl: limitedFetch, referenceCache, groww: legacy.createProvider({fetchImpl: limitedFetch, referenceCache}), delayMs: 0});
  return {source, async save() {
    if (cache && dirty) {
      await cache.put(key, Response.json(entries, {headers: {'Cache-Control': 'public, max-age=2592000'}}));
      dirty = false;
    }
  }};
}
export async function fundSources(request, env, options = {}) {
  const url = new URL(request.url), path = url.pathname;
  const headers = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Fund-Lens-Service': 'cloudflare'};
  const reply = (status, body) => new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {status, headers});
  const snapshotAsset=async(path,method=request.method,conditional=true)=>{
    if(!env.ASSETS || !Object.hasOwn(archives,path))return null;
    const assetHeaders=new Headers();if(conditional)for(const name of ['If-None-Match','If-Modified-Since'])if(request.headers.has(name))assetHeaders.set(name,request.headers.get(name));
    return env.ASSETS.fetch(new Request(new URL(archives[path],url),{method,headers:assetHeaders}));
  };
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, {status: 405, headers: {...headers, Allow: 'GET, HEAD'}});
  if(Object.hasOwn(archives,path)){
    if(!env.ASSETS)return reply(503,{error:'Historical reference storage is unavailable.'});
    const response=await snapshotAsset(path);
    const archiveHeaders=new Headers(response.headers);archiveHeaders.set('Content-Type','application/json; charset=utf-8');archiveHeaders.set('X-Fund-Lens-Service','cloudflare');archiveHeaders.set('X-Content-Type-Options','nosniff');archiveHeaders.set('Cache-Control','public, max-age=31536000, immutable');
    return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers:archiveHeaders});
  }
  let references;try{references=await loadReferences(env.ASSETS,url.origin,path==='/api/fund-overlap/coverage/schemes'&&url.searchParams.get('q')&&!/^\d+$/.test(url.searchParams.get('q'))?'coverage':'base');}catch(error){return reply(503,{error:error.message});}
  if(Object.hasOwn(references,path))return reply(200,references[path]);
  if(path==='/api/fund-overlap/coverage/schemes'){
    try{const page=official.coveragePage(references,url.searchParams);page.schemes=await fullCoverageRows(env.ASSETS,url.origin,references,page.schemes);return reply(200,page);}catch(error){return reply(error.status||400,{error:error.message});}
  }
  const search = path === '/api/fund-overlap/search';
  const scheme = /^\/api\/fund-overlap\/scheme\/(\d{5,8})$/.exec(path);
  const remote = /^\/api\/fund-overlap\/remote\/([a-z0-9-]{1,160})$/.exec(path);
  if (!search && !scheme && !(remote && legacy.slugValid(remote[1]))) return reply(404, {error: 'Fund reference not found'});
  const query = (url.searchParams.get('q') || '').trim(), offset = Number(url.searchParams.get('offset') || 0);
  if (search && (query.length < 2 || query.length > 100 || /[\x00-\x1f]/.test(query) || !Number.isInteger(offset) || offset < 0 || offset > 100000)) return reply(400, {error: 'Enter 2–100 characters to search funds'});
  if (scheme) {
    try {
      const entry=official.officialEntryForCode(references,scheme[1]);
      if(entry){
        const response=await snapshotAsset(entry.holdingsPath,'GET',false);
        if(!response?.ok)return reply(503,{error:'Official reference storage is temporarily unavailable.'});
        return reply(200,official.officialForCode(references,scheme[1],await response.json()));
      }
    }catch(error){return reply(503,{error:error.message});}
  }
  if (!env.FUND_LIMITER || !(await env.FUND_LIMITER.limit({key: request.headers.get('CF-Connecting-IP') || 'anonymous'})).success) return reply(429, {error: 'Fund data is busy. Please retry in a minute.'});
  const bounded = options.provider ? null : await boundedProvider(request);
  const source = options.provider || bounded.source;
  try {
    if (!search) {
      const value = scheme ? await source.scheme(scheme[1]) : await source.snapshot(remote[1]);
      try { await bounded?.save(); } catch { /* Live validated response remains usable. */ }
      return reply(200, value);
    }
    const local = references['/api/fund-overlap/fund-index.json'].funds;
    const words = query.toLowerCase().split(/\s+/);
    const funds = offset ? [] : local.filter(f => words.every(w => `${f.name} ${f.amc} ${f.category}`.toLowerCase().includes(w)));
    let page;
    try { page = await source.search(query, offset); }
    catch {references=await loadReferences(env.ASSETS,url.origin,'search');if(Object.hasOwn(references.__officialLookup.coverage,query)){const position=references.__officialLookup.coverage[query],row=references.__officialCoverage.schemes[position];const [full]=await fullCoverageRows(env.ASSETS,url.origin,references,[row]);references={...references,__exactRows:{[query]:full}};}const page=official.searchPublishedCatalogue(references,query,offset) || {funds, nextOffset: null, warning: 'National search is temporarily unavailable. Official reference matches are shown.'};for(const entry of funds)if(!page.funds.some(f=>f.id===entry.id))page.funds.unshift(entry);return reply(200,page);}
    for (const fund of page.funds) {
      const entry = official.enrichDiscovery(fund,references);
      if (!funds.some(f => f.id === entry.id)) funds.push(entry);
    }
    try { await bounded?.save(); } catch { /* Search remains usable. */ }
    return reply(200, {...page, funds});
  } catch (error) {
    if (error.code === 'FUND_CONTINUE') {
      try { await bounded.save(); return reply(202, {code: 'FUND_CONTINUE'}); }
      catch { return reply(503, {error: 'Holdings verification could not be saved. Please retry shortly.'}); }
    }
    // Preserve successful identifier checks when an upstream request fails, so
    // the user's explicit retry does not have to start verification from zero.
    try { await bounded?.save(); } catch { /* Original source error remains actionable. */ }
    return reply(503, {error: error.message || 'Fund source unavailable. Please retry shortly.'});
  }
}
