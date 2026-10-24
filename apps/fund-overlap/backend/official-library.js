'use strict';

const {createHash} = require('node:crypto');
const {normalize,portfolioFamily:familyName} = require('../frontend/engine');
const {codeValid} = require('./national-provider');
const {matchesWords,renamedFunds} = require('./search-names');
const {buildSearchIndex,queryIndex,buildCatalogueSearch,hydrateSearchIndex}=require('./official-search');
const PREFIX = '/api/fund-overlap/';
const snapshotPath = /^\/api\/fund-overlap\/holdings\/[a-z0-9-]{1,80}\/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function validateEntryPath(entry){if(!entry || !/^[a-z0-9-]{1,80}$/.test(entry.id) || !snapshotPath.test(entry.holdingsPath) || !entry.holdingsPath.startsWith(PREFIX+'holdings/'+entry.id+'/'))throw Error('Invalid official snapshot path');}
const lookups = new WeakMap();
function lookup(references) {
  let value=lookups.get(references);
  if(value)return value;
  if(references.__officialLookup){
    const compiled=references.__officialLookup,funds=references[PREFIX+'fund-index.json'].funds,report=references.__officialCoverage || references[PREFIX+'coverage.json'];
    value={codes:{get:code=>Object.hasOwn(compiled.codes,code)?[funds[compiled.codes[code]]]:undefined},families:{get:name=>Object.hasOwn(compiled.families,name)?funds[compiled.families[name]]:undefined},coverage:{get:code=>Object.hasOwn(compiled.coverage,code)?report.schemes[compiled.coverage[code]]:undefined}};
    lookups.set(references,value);return value;
  }
  value={codes:new Map(),families:new Map(),coverage:new Map()};
  for(const entry of references[PREFIX+'fund-index.json'].funds){
    value.families.set(familyName(entry.name),entry);
    for(const code of entry.schemeCodes || []){const key=String(code),items=value.codes.get(key)||[];items.push(entry);value.codes.set(key,items);}
  }
  for(const row of (references.__officialCoverage || references[PREFIX+'coverage.json']).schemes)value.coverage.set(String(row.schemeCode),row);
  lookups.set(references,value);
  return value;
}

function validateEntry(entry, bytes, now = Date.now()) {
  validateEntryPath(entry);
  for (const field of ['name', 'amc', 'category']) if (typeof entry[field] !== 'string' || !entry[field].trim() || entry[field].length > 400) throw Error('Invalid official fund '+field);
  if (!validDate(entry.portfolioDate) || Date.parse(entry.portfolioDate) > now || !/^[a-f0-9]{64}$/.test(entry.sourceSha256) || !/^[a-f0-9]{64}$/.test(entry.snapshotSha256) || sha(bytes) !== entry.snapshotSha256) throw Error('Official snapshot integrity check failed');
  if (!entry.holdingsPath.endsWith('-'+entry.snapshotSha256.slice(0,16)+'.json')) throw Error('Official version path does not match its content');
  const value = JSON.parse(bytes.toString());
  const normalized = normalize(value.holdings);
  if (value.schemeId !== entry.id || value.name !== entry.name || value.amc !== entry.amc || value.portfolioDate !== entry.portfolioDate || value.source?.sha256 !== entry.sourceSha256 || normalized.total !== entry.includedNavWeight || value.includedNavWeight !== entry.includedNavWeight || value.holdings.length !== entry.holdingsCount) throw Error('Official snapshot metadata does not reconcile');
  for (const url of [value.source?.url, value.source?.indexUrl]) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw Error('Invalid official disclosure source');
  }
  if (entry.schemeCodes && (!Array.isArray(entry.schemeCodes) || entry.schemeCodes.length > 500 || entry.schemeCodes.some(code => !codeValid(code)))) throw Error('Invalid official scheme mapping');
  return value;
}

// No business state is stored here. The maintainer publishes audited public files.
function compileReferences({baseIndex, officialIndex, readSnapshot, now = Date.now(),searchIndexes=true}) {
  if (!baseIndex || !Array.isArray(baseIndex.funds) || baseIndex.funds.length > 10000 || officialIndex && (!Array.isArray(officialIndex.funds) || officialIndex.funds.length > 10000)) throw Error('Invalid official library');
  const references = {}, byId = new Map();
  for (const entry of [...baseIndex.funds, ...(officialIndex?.funds || [])]) {
    validateEntryPath(entry);
    const bytes = readSnapshot(entry.holdingsPath.slice(PREFIX.length));
    const snapshot = validateEntry(entry, bytes, now);
    if (references[entry.holdingsPath] && JSON.stringify(references[entry.holdingsPath]) !== JSON.stringify(snapshot)) throw Error('Conflicting official version');
    references[entry.holdingsPath] = snapshot;
    const old = byId.get(entry.id);
    if (!old || entry.portfolioDate >= old.portfolioDate) byId.set(entry.id, {...entry, official:true, provider:'official'});
  }
  const byFamily = new Map();
  for (const entry of byId.values()) {
    const key = familyName(entry.name), old = byFamily.get(key);
    if (!old) byFamily.set(key, entry);
    else {
      const latest = entry.portfolioDate > old.portfolioDate ? entry : old;
      byFamily.set(key, {...latest, schemeCodes:[...new Set([...(old.schemeCodes || []), ...(entry.schemeCodes || [])])]});
    }
  }
  const funds = [...byFamily.values()].map(entry => ({...entry, coverageStatus:entry.failureStatus || entry.coverageStatus==='stale' || now-Date.parse(entry.portfolioDate)>45*86400000?'stale':'verified'})).sort((a,b)=>a.name.localeCompare(b.name));
  const mappedCodes=new Map();
  for(const fund of funds)for(const code of fund.schemeCodes || []){const key=String(code);if(mappedCodes.has(key)&&mappedCodes.get(key)!==fund.id)throw Error('Ambiguous official scheme mapping');mappedCodes.set(key,fund.id);}
  const generation = officialIndex?.generation || null;
  let report = officialIndex?.coverageReport;
  if (report && (report.generation !== generation || !Array.isArray(report.sources) || !Array.isArray(report.schemes) || !report.summary)) throw Error('Official coverage generation mismatch');
  if (!report) {
    report = {version:1, generation, generatedAt:baseIndex.generatedAt, summary:{fundHouses:new Set(funds.map(f=>f.amc)).size,totalSchemes:null,verifiedSchemes:funds.filter(f=>f.coverageStatus==='verified').length,unsupportedSchemes:0,unavailableSchemes:0,staleSchemes:funds.filter(f=>f.coverageStatus==='stale').length},sources:[...new Set(funds.map(f=>f.amc))].map(amc=>({id:'ppfas',amc,status:'verified',checkedAt:baseIndex.generatedAt,portfolioDate:funds.filter(f=>f.amc===amc).map(f=>f.portfolioDate).sort().at(-1),verifiedSchemes:funds.filter(f=>f.amc===amc).length,message:'Official reference snapshots; national official-source audit has not been published.'})),schemes:[],warning:'National official-source coverage has not been published. Discovery is available separately.'};
  }
  // Detailed acquisition diagnostics belong to the source audit, rather than
  // being repeated for thousands of unavailable catalogue options at runtime.
  report={...report,schemes:report.schemes.map(row=>row.status==='unavailable'&&row.message?.length>220?{...row,message:'Official holdings are unavailable for this catalogue option. Review its fund-house status for source availability.'}:row)};
  const index = {...baseIndex, version:2, generation, generatedAt:officialIndex?.generatedAt || baseIndex.generatedAt,coverage:'Verified official equity portfolios across the fund houses shown. National discovery includes schemes whose holdings are not verified.',funds,coverageSummary:report.summary};
  references[PREFIX+'fund-index.json'] = index;
  // A national option catalogue is large. Publish its audit in bounded pages,
  // keeping the initial coverage response small enough for the Free Worker.
  references.__officialCoverage = report;
  references[PREFIX+'coverage.json'] = {...report,schemes:[],schemeRows:report.schemes.length,schemeAuditPath:PREFIX+'coverage/schemes'};
  references.__officialLookup={codes:{},families:{},coverage:{}};
  funds.forEach((fund,i)=>{references.__officialLookup.families[familyName(fund.name)]=i;for(const code of fund.schemeCodes || [])references.__officialLookup.codes[String(code)]=i;});
  report.schemes.forEach((row,i)=>{references.__officialLookup.coverage[String(row.schemeCode)]=i;});
  if(searchIndexes){
  references.__officialAuditSearch=buildSearchIndex(report.schemes);
  references.__officialCatalogueSearch=buildCatalogueSearch(report.schemes);
  // Status and source evidence already live in the audit, keyed by scheme code.
  // Keep only display identity beside grouped search postings in the Worker.
  references.__officialCatalogueSearch.rows=references.__officialCatalogueSearch.rows.map(({schemeCode,name,amc})=>({schemeCode,name,amc}));
  }
  return references;
}

function coveragePage(references, params) {
  const offset=Number(params.get('offset') || 0),limit=Number(params.get('limit') || 100),query=(params.get('q') || '').trim(),status=params.get('status') || 'all';
  if(!Number.isInteger(offset)||offset<0||offset>100000||!Number.isInteger(limit)||limit<1||limit>200||query.length>100||/[\x00-\x1f]/.test(query)||!['all','verified','stale','unsupported','unavailable','unchecked'].includes(status))throw Error('Invalid coverage query');
  const report=references.__officialCoverage || references[PREFIX+'coverage.json'],words=query.toLowerCase().split(/\s+/).filter(Boolean);
  const indexed=references.__officialAuditSearch;
  let positions;
  if(query && Object.hasOwn(references.__officialLookup?.coverage || {},query))positions=[references.__officialLookup.coverage[query]];
  else if(indexed)positions=queryIndex(indexed,query);
  const rows=positions?positions.map(i=>report.schemes[i]).filter(row=>status==='all'||row.status===status):report.schemes.filter(row=>(status==='all'||row.status===status)&&(!words.length||String(row.schemeCode)===query||matchesWords(`${row.name} ${row.amc || ''}`,words)));
  return {generation:report.generation,generatedAt:report.generatedAt,schemes:rows.slice(offset,offset+limit),total:rows.length,nextOffset:offset+limit<rows.length?offset+limit:null};
}

function searchPublishedCatalogue(references,query,offset=0) {
  const report=references.__officialCoverage || references[PREFIX+'coverage.json'];
  if(!report.schemes.length)return null;
  const catalogueDate=String(report.catalogue?.checkedAt || report.asOf || report.generatedAt).slice(0,10);
  const published=references.__officialCatalogueSearch;
  if(published){
    const exact=references.__exactRows?.[query]||(Object.hasOwn(references.__officialLookup?.coverage || {},query)?report.schemes[references.__officialLookup.coverage[query]]:null);
    const positions=exact?null:queryIndex(published.index,query),rows=exact?[exact]:positions.map(i=>published.rows[i]);
    return {funds:rows.slice(offset,offset+20).map(row=>enrichDiscovery({id:'amfi-'+row.schemeCode,name:row.name,amc:row.amc || 'Indian mutual fund',category:'Scheme catalogue',provider:'MFapi',holdingsPath:PREFIX+'scheme/'+row.schemeCode},references)),total:rows.length,nextOffset:offset+20<rows.length?offset+20:null,catalogueCount:report.schemes.length,warning:'Live national search is unavailable. Showing the published catalogue checked on '+catalogueDate+'. Holdings availability is shown separately.'};
  }
  const words=query.toLowerCase().split(/\s+/),aliases=renamedFunds.filter(fund=>fund.previousNames.some(name=>matchesWords(name,words))).map(fund=>familyName(fund.name));
  const matched=report.schemes.filter(row=>String(row.schemeCode)===query||matchesWords(row.name,words)||aliases.length&&aliases.includes(familyName(row.name)));
  matched.sort((a,b)=>(String(b.schemeCode)===query)-(String(a.schemeCode)===query)||(/direct/i.test(b.name)*2+/growth/i.test(b.name))-(/direct/i.test(a.name)*2+/growth/i.test(a.name))||a.name.localeCompare(b.name));
  const families=new Map();
  for(const row of matched){const family=familyName(row.name);if(!families.has(family))families.set(family,row);}
  const rows=[...families.values()];
  return {funds:rows.slice(offset,offset+20).map(row=>enrichDiscovery({id:'amfi-'+row.schemeCode,name:row.name,amc:row.amc || 'Indian mutual fund',category:'Scheme catalogue',provider:'MFapi',holdingsPath:PREFIX+'scheme/'+row.schemeCode},references)),total:rows.length,nextOffset:offset+20<rows.length?offset+20:null,catalogueCount:report.schemes.length,warning:'Live national search is unavailable. Showing the published catalogue checked on '+catalogueDate+'. Holdings availability is shown separately.'};
}

function prepareReferenceSearch(references){
  if(references.__officialAuditSearch)hydrateSearchIndex(references.__officialAuditSearch);
  if(references.__officialCatalogueSearch?.index)hydrateSearchIndex(references.__officialCatalogueSearch.index);
  if(references.__officialAuditSearch)queryIndex(references.__officialAuditSearch,'fund');
  if(references.__officialCatalogueSearch?.index)queryIndex(references.__officialCatalogueSearch.index,'fund');
}

function officialEntryForCode(references,code){
  const candidates = lookup(references).codes.get(String(code)) || [];
  if (candidates.length > 1) throw Error('Ambiguous official scheme mapping');
  return candidates[0] || null;
}
function officialForCode(references, code, loadedSnapshot) {
  const entry = officialEntryForCode(references,code);
  if (!entry) return null;
  const snapshot = loadedSnapshot || references[entry.holdingsPath];
  if(!snapshot || snapshot.schemeId!==entry.id || snapshot.portfolioDate!==entry.portfolioDate || snapshot.source?.sha256!==entry.sourceSha256)throw Error('Official snapshot metadata does not reconcile');
  const stale=Date.now()-Date.parse(entry.portfolioDate)>45*86400000 || entry.coverageStatus==='stale';
  return {...snapshot,schemeId:'amfi-'+code,portfolioKey:snapshot.portfolioKey || 'official-'+entry.id,unresolvedNavWeight:snapshot.unresolvedNavWeight || 0,source:{...snapshot.source,kind:'official'},cacheStatus:stale?'stale':'current',...(stale?{cacheWarning:entry.latestAttemptMessage?'Official source refresh failed. Showing its last verified portfolio: '+entry.latestAttemptMessage:'Official portfolio is over 45 days old. Its original reporting date is preserved.'}:{})};
}

function enrichDiscovery(fund, references) {
  const maps=lookup(references);
  const code = /^amfi-(\d{5,8})$/.exec(fund.id)?.[1];
  const mapped = code && maps.codes.get(code);
  if (mapped?.length > 1) return {...fund,coverageStatus:'unavailable'};
  const official = mapped?.[0] || maps.families.get(familyName(fund.name));
  if (official) return official;
  const row = code && maps.coverage.get(code);
  return {...fund,coverageStatus:row?.status || 'unchecked',coverageMessage:row?.message};
}

module.exports = {compileReferences,validateEntry,officialForCode,officialEntryForCode,enrichDiscovery,coveragePage,searchPublishedCatalogue,prepareReferenceSearch,snapshotPath};
