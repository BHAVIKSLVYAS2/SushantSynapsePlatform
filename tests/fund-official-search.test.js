'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {gzipSync}=require('node:zlib');
const {buildSearchIndex,queryIndex,buildCatalogueSearch,hydrateSearchIndex}=require('../apps/fund-overlap/backend/official-search');
const {matchesWords}=require('../apps/fund-overlap/backend/search-names');

test('published search matches complete numeric tokens, prefixes, joined names and common fund spellings',()=>{
 const rows=[
  {name:'Parag Parikh Flexi Cap Fund - Direct Growth',amc:'PPFAS Mutual Fund'},
  {name:'Mirae Asset Large & Midcap Fund Direct Growth'},
  {name:'SBI Bluechip Fund Direct Growth'},
  {name:'HDFC Top 100 Fund Direct Growth'},
  {name:'HDFC October 1001D Fund Direct Growth'},
  {name:'Historical Example 42 Equity Fund Direct Growth'},
 ];
 const index=JSON.parse(JSON.stringify(buildSearchIndex(rows)));
 for(const query of ['parag flexi','paragparikh flexicap','ppfas','mirae large and midcap','large & midcap','sbi bluechip','blue chip','hdfc top 100','hdfc 100','1001','top','hist','historicalexample42','example42equity','missing','']) {
  const words=query.toLowerCase().split(/\s+/).filter(Boolean);
  assert.deepEqual(queryIndex(index,query),rows.flatMap((row,i)=>matchesWords(`${row.name} ${row.amc || ''}`,words)?[i]:[]),query);
 }
 assert.deepEqual(queryIndex(index,'100'),[3]);
 assert.deepEqual(queryIndex(index,'oct'),[4]);
 assert.deepEqual(queryIndex(index,['PARAGPARIKH','flexicap']),[0]);
});

test('serialized aliases support previous fund names without inventing cross-name joined phrases',()=>{
 const rows=[{name:'HDFC Large Cap Fund Direct Growth'},{name:'SBI Large Cap Fund Direct Growth'}];
 const index=JSON.parse(JSON.stringify(buildSearchIndex(rows,{aliases:[['HDFC Top 100 Fund'],['SBI Blue Chip Fund']]})));
 assert.deepEqual(queryIndex(index,'hdfc top 100'),[0]);
 assert.deepEqual(queryIndex(index,'sbibluechip'),[1]);
 assert.deepEqual(queryIndex(index,'growthhdfc'),[]);
 assert.deepEqual(queryIndex(index,'1001'),[]);
});

test('compact binary indexes preserve legacy matching, hydrate once and reject truncated metadata',()=>{
 const rows=[{name:'Parag Parikh Flexi Cap Fund Direct Growth'}, {name:'SBI Blue Chip Fund Regular Growth'}, {name:'HDFC Top 100 Fund Direct Growth'}, {name:'HDFC 1001D Fund'}, {name:'Axis Smallcap Fund'}];
 const legacy=buildSearchIndex(rows,{compact:false}),packed=JSON.parse(JSON.stringify(buildSearchIndex(rows)));
 assert.equal(legacy.version,1);assert.equal(packed.version,2);assert.equal(typeof packed.postings,'string');
 const ready=hydrateSearchIndex(packed);assert.strictEqual(hydrateSearchIndex(packed),ready);
 for(const query of ['paragparikh flexicap','bluechip','smallcap','hdfc 100','1001','s','fund','']) {
  assert.deepEqual(queryIndex(packed,query),queryIndex(legacy,query),query);
  assert.deepEqual(queryIndex(ready,query),queryIndex(legacy,query),query+' hydrated');
 }
 const malformed=JSON.parse(JSON.stringify(packed));malformed.triples=malformed.triples.slice(0,-4);
 assert.throws(()=>hydrateSearchIndex(malformed),/Truncated|Unexpected|Invalid/);
});

test('catalogue groups only strict portfolio families, prefers Direct Growth and retains searchable plans and former names',()=>{
 const rows=[
  {schemeCode:123401,name:'Fixture Growth Fund Regular Growth'},
  {schemeCode:123402,name:'Fixture Fund Regular Growth'},
  {schemeCode:123403,name:'Fixture Fund Direct IDCW'},
  {schemeCode:123404,name:'Fixture Fund Direct Growth'},
  {schemeCode:123405,name:'SBI Large Cap Fund Regular Growth'},
  {schemeCode:123406,name:'SBI Large Cap Fund Direct Growth'},
 ];
 const catalogue=JSON.parse(JSON.stringify(buildCatalogueSearch(rows)));
 assert.equal(catalogue.rows.length,3);
 assert.ok(catalogue.rows.some(row=>row.schemeCode===123401));
 assert.ok(catalogue.rows.some(row=>row.schemeCode===123404));
 assert.ok(catalogue.rows.some(row=>row.schemeCode===123406));
 assert.deepEqual(queryIndex(catalogue.index,'sbi bluechip').map(i=>catalogue.rows[i].schemeCode),[123406]);
 assert.deepEqual(queryIndex(catalogue.index,'fixture idcw').map(i=>catalogue.rows[i].schemeCode),[123404]);
 assert.deepEqual(catalogue.sourceRows.map(i=>rows[i]),catalogue.rows);
 assert.deepEqual(catalogue.rows.map(row=>row.name),catalogue.rows.map(row=>row.name).slice().sort((a,b)=>a.localeCompare(b)));
});

test('40,000-row audit and grouped search preserve matching after serialization and reuse broad/rare queries',t=>{
 const rows=Array.from({length:40000},(_,i)=>({schemeCode:200000+i,name:`Historical Example ${Math.floor(i/2)} Equity Fund ${i%2?'Direct':'Regular'} Growth`,amc:'Historical Mutual Fund',status:i%7?'unavailable':'unsupported'}));
 rows[19999]={schemeCode:219999,name:'HDFC Flexi Cap Fund Direct Growth',amc:'HDFC Mutual Fund',status:'verified'};
 const started=performance.now();
 const index=JSON.parse(JSON.stringify(buildSearchIndex(rows)));
 const catalogue=JSON.parse(JSON.stringify(buildCatalogueSearch(rows)));
 const buildMs=Math.round(performance.now()-started);
 const hydrateStarted=performance.now();hydrateSearchIndex(index);hydrateSearchIndex(catalogue.index);
 t.diagnostic(JSON.stringify({hydrateMs:Math.round(performance.now()-hydrateStarted)}));
 for(const query of ['hdfc flexicap','historical example 1234','example1234equity','fund','historical']) {
  const words=query.split(/\s+/),expected=rows.flatMap((row,i)=>matchesWords(`${row.name} ${row.amc}`,words)?[i]:[]);
  const cpu=process.cpuUsage(),start=performance.now(),actual=queryIndex(index,query),wallMs=performance.now()-start,used=process.cpuUsage(cpu);
  assert.deepEqual(actual,expected,query);
  assert.strictEqual(queryIndex(index,query),actual,'Repeated queries reuse the published-index result');
  t.diagnostic(JSON.stringify({query,total:actual.length,wallMs:Math.round(wallMs*100)/100,cpuMs:Math.round((used.user+used.system)/10)/100}));
 }
 assert.equal(queryIndex(catalogue.index,'fund').length,catalogue.rows.length);
 assert.equal(queryIndex(catalogue.index,'hdfc flexicap').length,1);
 assert.ok(catalogue.rows.every(row=>/Direct Growth$/.test(row.name)||row.schemeCode===219998));
 t.diagnostic(JSON.stringify({rows:rows.length,groups:catalogue.rows.length,buildMs,auditIndexGzipBytes:gzipSync(JSON.stringify(index)).length,catalogueIndexGzipBytes:gzipSync(JSON.stringify(catalogue.index)).length}));
});
