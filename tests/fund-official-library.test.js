'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createHash}=require('node:crypto');
const {compileReferences,officialForCode,enrichDiscovery,coveragePage,searchPublishedCatalogue}=require('../apps/fund-overlap/backend/official-library');
const {createFundOverlap}=require('../apps/fund-overlap/backend/routes');
const prefix='/api/fund-overlap/';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

function fixture() {
  const files=new Map();
  const make=(id,name,codes=[],date='2026-09-30')=>{
    const snapshot={schemeId:id,name,amc:'Fixture Mutual Fund',category:'Equity',portfolioDate:date,includedNavWeight:80,source:{kind:'official',publisher:'Fixture Mutual Fund',url:'https://amc.ppfas.com/fixture.xlsx',indexUrl:'https://amc.ppfas.com/downloads/portfolio-disclosure/',sha256:'a'.repeat(64)},holdings:[{isin:'INE040A01034',name:'HDFC Bank',sector:'Banks',weight:50},{isin:'INE090A01021',name:'ICICI Bank',sector:'Banks',weight:30}]};
    const bytes=Buffer.from(JSON.stringify(snapshot,null,2)+'\n'),digest=hash(bytes),relative=`holdings/${id}/${date}-${digest.slice(0,16)}.json`;
    files.set(relative,bytes);
    return {id,name,amc:snapshot.amc,category:'Equity',portfolioDate:date,includedNavWeight:80,holdingsCount:2,holdingsPath:prefix+relative,sourceSha256:snapshot.source.sha256,snapshotSha256:digest,schemeCodes:codes};
  };
  const baseIndex={version:1,generatedAt:'2026-10-12T00:00:00Z',funds:[make('legacy-example','Fixture Equity Fund',[123456])]};
  const coverageReport={version:1,generation:'generation-one',generatedAt:baseIndex.generatedAt,summary:{fundHouses:2,totalSchemes:4,verifiedSchemes:2,unsupportedSchemes:1,unavailableSchemes:1,staleSchemes:0},sources:[],schemes:[{schemeCode:123458,name:'Fixture Debt Fund',status:'unsupported',message:'No physical equities.'}]};
  const officialIndex={version:1,generation:'generation-one',generatedAt:baseIndex.generatedAt,funds:[make('official-second','Fixture Second Equity Fund',[123457])],coverageReport};
  const compile=()=>compileReferences({baseIndex,officialIndex,readSnapshot:r=>files.get(r),now:Date.parse('2026-10-12')});
  return {files,make,baseIndex,officialIndex,compile};
}

test('official references combine sources, preserve exact snapshots and map AMFI without upstream requests',()=>{
  const f=fixture(),refs=f.compile();
  assert.equal(refs[prefix+'fund-index.json'].funds.length,2);
  assert.equal(refs[prefix+'coverage.json'].generation,'generation-one');
  const value=officialForCode(refs,'123457');
  assert.equal(value.schemeId,'amfi-123457');assert.equal(value.source.kind,'official');assert.equal(value.portfolioDate,'2026-09-30');
  assert.equal(officialForCode(refs,'999999'),null);
  assert.equal(enrichDiscovery({id:'amfi-123457',name:'Different display name'},refs).id,'official-second');
  assert.equal(enrichDiscovery({id:'amfi-123458',name:'Fixture Debt Fund'},refs).coverageStatus,'unsupported');
  assert.equal(enrichDiscovery({id:'amfi-123459',name:'Fixture Third Fund'},refs).coverageStatus,'unchecked');
});

test('official publication rejects altered bytes, metadata, generations, traversal and ambiguous identities',()=>{
  let f=fixture();f.files.set(f.officialIndex.funds[0].holdingsPath.slice(prefix.length),Buffer.from('{}'));assert.throws(f.compile,/integrity/);
  f=fixture();f.officialIndex.funds[0].includedNavWeight=90;assert.throws(f.compile,/reconcile/);
  f=fixture();f.officialIndex.coverageReport.generation='wrong';assert.throws(f.compile,/generation/);
  f=fixture();f.officialIndex.funds[0].holdingsPath=prefix+'holdings/../secrets.json';assert.throws(f.compile,/path/);
  let reads=0;assert.throws(()=>compileReferences({baseIndex:{funds:[]},officialIndex:f.officialIndex,readSnapshot:()=>{reads++;return Buffer.from('{}');}}),/path/);assert.equal(reads,0);
  f=fixture();f.officialIndex.funds[0].schemeCodes=[123456];assert.throws(f.compile,/Ambiguous/);
});

test('retained source failures and older dates never masquerade as a fresh official refresh',()=>{
  const f=fixture();f.officialIndex.funds[0].failureStatus='unavailable';f.officialIndex.funds[0].latestAttemptMessage='Download unavailable';
  const refs=f.compile(),entry=refs[prefix+'fund-index.json'].funds.find(x=>x.id==='official-second');
  assert.equal(entry.coverageStatus,'stale');
  const snapshot=officialForCode(refs,'123457');assert.equal(snapshot.cacheStatus,'stale');assert.equal(snapshot.portfolioDate,'2026-09-30');assert.match(snapshot.cacheWarning,/last verified/);
  const old=f.make('legacy-example','Fixture Equity Fund',[123456],'2026-08-31');f.officialIndex.funds.push(old);
  assert.equal(f.compile()[prefix+'fund-index.json'].funds.find(x=>x.id==='legacy-example').portfolioDate,'2026-09-30');
});

test('national audit pages are bounded and published discovery remains usable when MFapi is offline',()=>{
  const f=fixture();f.officialIndex.coverageReport.asOf='2026-10-10';f.officialIndex.coverageReport.schemes.push({schemeCode:123460,name:'Fixture Debt Fund - Direct Growth',status:'unsupported'},{schemeCode:123461,name:'Fixture New Equity Fund - Direct Growth',status:'unavailable'});
  const refs=f.compile();assert.equal(refs[prefix+'coverage.json'].schemes.length,0);assert.equal(refs[prefix+'coverage.json'].schemeRows,3);
  const page=coveragePage(refs,new URLSearchParams('status=unsupported&limit=1'));assert.equal(page.schemes.length,1);assert.equal(page.total,2);assert.equal(page.nextOffset,1);
  for(const query of ['limit=201','offset=-1','status=unknown','q=%00'])assert.throws(()=>coveragePage(refs,new URLSearchParams(query)),/Invalid/);
  const found=searchPublishedCatalogue(refs,'fixture debt');assert.equal(found.funds.length,1);assert.equal(found.funds[0].id,'amfi-123460');assert.equal(found.funds[0].coverageStatus,'unsupported');assert.match(found.warning,/published catalogue checked on 2026-10-10/);
});

test('official identities retain interior Growth words and never merge distinct investment mandates',()=>{
  const f=fixture();f.baseIndex.funds=[f.make('growth-fund','Fixture Growth Fund',[123456])];f.officialIndex.funds=[f.make('another-fund','Fixture Fund',[123457])];
  const refs=f.compile();assert.equal(refs[prefix+'fund-index.json'].funds.length,2);
  assert.equal(enrichDiscovery({id:'amfi-123499',name:'Fixture Fund - Direct Plan - Growth Option'},refs).id,'another-fund');
  const engine=require('../apps/fund-overlap/frontend/engine');
  const a=refs[f.baseIndex.funds[0].holdingsPath],b=refs[f.officialIndex.funds[0].holdingsPath];assert.equal(engine.analyze([a,b]).pairs.length,1);
  assert.throws(()=>engine.analyze([a,{...a,schemeId:'variant',name:'Fixture Growth Fund - Direct Plan - Growth Option'}]),/underlying/);
});

test('Node discovery can scan published names without constructing the edge search tables',()=>{
  const f=fixture();f.officialIndex.coverageReport.catalogue={checkedAt:'2026-10-09T00:00:00Z'};
  f.officialIndex.coverageReport.schemes.push({schemeCode:123460,name:'SBI Large Cap Fund - Direct Growth',status:'unavailable',message:'Detailed workbook diagnostics. '.repeat(40)});
  const refs=compileReferences({baseIndex:f.baseIndex,officialIndex:f.officialIndex,readSnapshot:relative=>f.files.get(relative),searchIndexes:false});
  assert.equal(refs.__officialAuditSearch,undefined);assert.equal(refs.__officialCatalogueSearch,undefined);
  const page=searchPublishedCatalogue(refs,'sbi bluechip');assert.equal(page.funds[0].id,'amfi-123460');assert.match(page.warning,/2026-10-09/);
  assert.ok(page.funds[0].coverageMessage.length<220);assert.ok(f.officialIndex.coverageReport.schemes.at(-1).message.length>220);
  assert.equal(coveragePage(refs,new URLSearchParams('q=large&limit=1')).schemes[0].schemeCode,123460);
});

test('public coverage and official scheme routes work offline and preserve private role boundaries',async()=>{
  const f=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-official-api-'));
  try{
    for(const [relative,bytes]of f.files){const target=path.join(dir,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
    fs.writeFileSync(path.join(dir,'fund-index.json'),JSON.stringify(f.baseIndex));fs.writeFileSync(path.join(dir,'official-index.json'),JSON.stringify(f.officialIndex));
    let calls=0;const handle=createFundOverlap({referenceRoot:dir,auth:{hasAppAccess:()=>false},provider:{scheme:async()=>{calls++;throw Error('offline');},search:async()=>{calls++;throw Error('offline');}}});
    const invoke=async(route,method='GET',headers={})=>{const res={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status){this.status=status;},end(body){this.body=body;}};await handle({route:'fund-overlap/'+route,method,req:{url:prefix+route,headers},res,user:null});return res;};
    const coverage=await invoke('coverage.json');assert.equal(coverage.status,200);assert.equal(JSON.parse(coverage.body).summary.totalSchemes,4);
    assert.equal((await invoke('coverage.json','GET',{'if-none-match':coverage.headers.ETag})).status,304);
    assert.equal((await invoke('coverage.json','HEAD')).body,undefined);
    assert.equal(JSON.parse((await invoke('scheme/123457')).body).source.kind,'official');assert.equal(calls,0);
    await assert.rejects(invoke('coverage.json','POST'),e=>e.status===405);
    await assert.rejects(invoke('portfolio'),e=>e.status===401);
    const relative=f.officialIndex.funds[0].holdingsPath.slice(prefix.length);assert.deepEqual((await invoke(relative)).body,f.files.get(relative));
    fs.writeFileSync(path.join(dir,relative),'{}');await assert.rejects(invoke(relative),e=>e.status===503);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('Node retains its last validated publication on an invalid new pointer while release builds fail closed',()=>{
  const f=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-official-recovery-'));
  try{
    for(const [relative,bytes]of f.files){const target=path.join(dir,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
    fs.writeFileSync(path.join(dir,'fund-index.json'),JSON.stringify(f.baseIndex));const pointer=path.join(dir,'official-index.json');fs.writeFileSync(pointer,JSON.stringify(f.officialIndex));
    const {createOfficialReferenceStore}=require('../apps/fund-overlap/backend/official-reference-store'),store=createOfficialReferenceStore(dir,{strict:false});
    const before=store.read();fs.writeFileSync(pointer,'{"funds":');
    const retained=store.read();assert.deepEqual(retained[prefix+'fund-index.json'].funds,before[prefix+'fund-index.json'].funds);assert.match(retained[prefix+'coverage.json'].warning,/last valid library/);
    assert.throws(()=>createOfficialReferenceStore(dir).read());assert.equal(fs.readFileSync(pointer,'utf8'),'{"funds":');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
