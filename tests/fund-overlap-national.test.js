const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises'), os = require('node:os'), path = require('node:path');
const {createNationalProvider, familyName} = require('../apps/fund-overlap/backend/national-provider');
const {createReferenceCache} = require('../apps/fund-overlap/backend/reference-cache');
const {createPublicApi} = require('../apps/fund-overlap/backend/public-api');
const {createFundOverlap} = require('../apps/fund-overlap/backend/routes');

// Synthetic weights, using the independently observed public response schema.
function fixture() {
  return {
    meta:{scheme_code:118955,scheme_name:'HDFC Flexi Cap Fund - Direct Plan - Growth Option',fund_house:'HDFC Mutual Fund',scheme_category:'Equity Scheme - Flexi Cap Fund',isin_growth:'INF179K01UT0'},
    universe:[{mfId:'M_HDEN',isin:'INF179K01VL5',fullName:'HDFC Flexi Cap Fund - Dividend - Direct Plan',slug:'/mutualfunds/hdfc-flexi-cap-fundidcw-M_HDEN'}],
    info:{mfId:'M_HDEN',name:'HDFC Flexi Cap Fund'},
    holdings:{assetAllocationHistory:[{date:Date.parse('2026-08-31'),holdings:[{assetClass:'Equity',value:90},{assetClass:'Cash & Equivalents',value:10}]}],currentAllocation:[
      {type:'Equity',rating:'Equity',title:'ICICI Bank Limited',sid:'ICBK',latest:60},
      {type:'Equity',rating:'Equity',title:'HDFC Bank Limited',sid:'HDBK',latest:30},
      {type:'Others',rating:'Cash',title:'Cash',sid:null,latest:10}]},
    stocks:{ICBK:{sid:'ICBK',type:'stock',tradable:true,isin:'INE090A01021',info:{sector:'Private Banks'}},HDBK:{sid:'HDBK',type:'stock',tradable:true,isin:'INE040A01034',info:{sector:'Private Banks'}}},
  };
}
function harness({data=fixture(),cacheDir,now=()=>Date.parse('2026-09-15'),offline=false,groww}={}) {
  const calls=[];
  const provider=createNationalProvider({cacheDir,now,delayMs:0,groww:groww||{search:async()=>[],snapshot:async()=>{throw Error('unavailable');}},fetchImpl:async(url,options)=>{
    calls.push(url);assert.equal(options.redirect,'manual');assert.equal(options.headers.Cookie,undefined);
    if(offline)throw Error('offline');
    if(url==='https://api.mfapi.in/mf')return Response.json([
      {schemeCode:118955,schemeName:data.meta.scheme_name},
      {schemeCode:101762,schemeName:'HDFC Flexi Cap Fund - Regular Plan - Growth Option'},
      {schemeCode:101763,schemeName:'HDFC Flexi Cap Fund - Regular Plan - IDCW Option'},
      {schemeCode:120596,schemeName:'ICICI Prudential Large & Mid Cap Fund Direct Growth'},
      {schemeCode:120586,schemeName:'ICICI Prudential Large Cap Fund Direct Growth'},
      {schemeCode:119018,schemeName:'HDFC Large Cap Fund - Direct Plan - Growth Option'},
      {schemeCode:119598,schemeName:'SBI Large Cap Fund - Direct Plan - Growth'},
      {schemeCode:106806,schemeName:'HDFC FMP 181D OCTOBER 2007 RETAIL PLAN DIVIDEND PAYOUT OPTION'},
      {schemeCode:123414,schemeName:'HDFC FMP 1001D August 2013 (1)-Direct Option-Growth Option'},
      ...Array.from({length:45},(_,i)=>({schemeCode:200000+i,schemeName:'Example '+String(i).padStart(2,'0')+' Fund Direct Growth'})),
    ]);
    if(url.includes('/mf/118955/latest'))return Response.json({status:'SUCCESS',meta:data.meta});
    if(url.endsWith('/mutualfunds/list'))return Response.json({success:true,data:{universe:data.universe}});
    if(url.endsWith('/M_HDEN/info'))return Response.json({success:true,data:data.info});
    if(url.endsWith('/M_HDEN/holdings'))return Response.json({success:true,data:data.holdings});
    const stock=data.stocks[url.split('/').at(-1)];
    if(stock)return Response.json({success:true,data:stock});
    throw Error('Unexpected URL '+url);
  }});
  return {provider,calls};
}

test('national catalogue searches words/codes, groups plans, and paginates without duplicate entries',async()=>{
  const {provider}=harness();
  const hdfc=await provider.search('hdfc flexi');assert.equal(hdfc.funds.length,1);assert.equal(hdfc.funds[0].id,'amfi-118955');
  assert.equal((await provider.search('hdfc flexicap')).funds[0].id,'amfi-118955');
  assert.equal((await provider.search('101762')).funds[0].id,'amfi-101762');
  assert.equal((await provider.search('sbi gold')).funds.length,0);
  assert.equal((await provider.search('icici prudential large cap fund')).funds[0].id,'amfi-120586');
  const pages=await Promise.all([0,20,40].map(offset=>provider.search('example',offset)));
  assert.deepEqual(pages.map(p=>p.funds.length),[20,20,5]);assert.deepEqual(pages.map(p=>p.nextOffset),[20,40,null]);
  assert.equal(new Set(pages.flatMap(p=>p.funds.map(f=>f.id))).size,45);
  assert.notEqual(familyName('Example Large Cap Fund'),familyName('Example Mid Cap Fund'));
  assert.equal(familyName('ICICI Prudential Large Cap Fund (erstwhile Bluechip Fund) - Direct Plan - Growth'),familyName('ICICI Prudential Large Cap Fund'));
});

test('old names discover verified current families without unrelated historical substring matches', async () => {
  const {provider} = harness();
  for (const query of ['HDFC Top 100', 'HDFC Top 200']) {
    const page = await provider.search(query);
    assert.deepEqual(page.funds.map(f => f.id), ['amfi-119018']);
    assert.ok(page.funds[0].previousNames.includes('HDFC Top 200 Fund'));
  }
  assert.equal((await provider.search('SBI Bluechip')).funds[0].id, 'amfi-119598');
  assert.equal((await provider.search('SBI blue chip')).funds[0].id, 'amfi-119598');
  assert.equal((await provider.search('HDFC October 2007')).funds[0].id, 'amfi-106806');
  assert.equal((await provider.search('HDFC 100')).funds.length, 1);
  assert.equal((await provider.search('123414')).funds[0].id, 'amfi-123414');
  assert.notEqual(familyName('SBI Bluechip Fund'), familyName('SBI Large Cap Fund'));
});

test('free holdings adapter reconciles dated totals, verifies ISINs, excludes cash and coalesces requests',async()=>{
  const {provider,calls}=harness();
  const [a,b]=await Promise.all([provider.scheme('118955'),provider.scheme('118955')]);
  assert.deepEqual(a,b);assert.equal(a.holdings.length,2);assert.equal(a.includedNavWeight,90);
  assert.equal(a.portfolioDate,'2026-08-31');assert.equal(a.source.publisher,'Tickertape');
  assert.equal(a.unresolvedNavWeight,0);assert.match(a.source.sha256,/^[a-f0-9]{64}$/);
  assert.ok(a.source.url.startsWith('https://www.tickertape.in/mutualfunds/'));
  assert.equal(calls.filter(u=>u.endsWith('/holdings')).length,1);
  await provider.scheme('118955');assert.equal(calls.length,6);
});

test('adapter rejects future/mismatched dates, incorrect identities, malformed weights and ISINs',async()=>{
  const changes=[
    f=>f.holdings.assetAllocationHistory[0].date=Date.parse('2030-01-01'),
    f=>f.holdings.assetAllocationHistory[0].holdings[0].value=50,
    f=>f.holdings.currentAllocation[0].latest=-1,
    f=>f.holdings.currentAllocation[0].latest='60',
    f=>f.stocks.ICBK.isin='INE090A01022',
    f=>f.stocks.ICBK.sid='OTHER',
    f=>f.info.name='HDFC Small Cap Fund',
    f=>f.meta.scheme_code=999999,
    f=>f.universe[0].slug='@evil.example/path',
  ];
  for(const mutate of changes){const data=fixture();mutate(data);await assert.rejects(harness({data}).provider.scheme('118955'));}
  await assert.rejects(harness().provider.scheme('../secrets'),/code/);
});

test('unidentified equities are partial; fallback accepts only an exact matching family',async()=>{
  const data=fixture();data.holdings.currentAllocation[1].sid=null;
  const partial=await harness({data}).provider.scheme('118955');assert.equal(partial.unresolvedNavWeight,30);assert.equal(partial.includedNavWeight,60);
  const good=await harness().provider.scheme('118955'), missing=fixture();missing.universe=[];
  let loaded=0;
  const groww={search:async()=>[{id:'groww-hdfc-flexi',name:'HDFC Flexi Cap Direct Plan-Growth'}],snapshot:async()=>{loaded++;return {...good,name:'HDFC Flexi Cap Direct Plan Growth',source:{...good.source,publisher:'Groww'}};}};
  const fallback=await harness({data:missing,groww}).provider.scheme('118955');assert.equal(fallback.source.publisher,'Groww');assert.equal(loaded,1);
  groww.search=async()=>[{id:'groww-wrong',name:'HDFC Small Cap Fund'}];
  await assert.rejects(harness({data:missing,groww}).provider.scheme('118955'),/not available/);assert.equal(loaded,1);
});

test('saved portfolios survive restart and source failure with explicit stale status and original dates',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'national-reference-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const initial=await harness({cacheDir:dir}).provider.scheme('118955');
  const {provider}=harness({cacheDir:dir,now:()=>Date.parse('2026-09-18'),offline:true});
  const saved=await provider.scheme('118955');assert.equal(saved.cacheStatus,'stale');assert.match(saved.cacheWarning,/refresh failed/);
  assert.deepEqual(saved.holdings,initial.holdings);assert.equal(saved.portfolioDate,'2026-08-31');
  assert.deepEqual(await provider.savedSchemeCodes(),['118955']);
});

test('reference publication retains last good data on date regression and detects corrupted versions',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'reference-atomic-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  let time=1000;const cache=createReferenceCache(dir,{now:()=>time});
  await cache.get('example',10,async()=>({portfolioDate:'2026-08-31'}));time=2000;
  const regressed=await cache.get('example',10,async()=>({portfolioDate:'2026-07-31'}));assert.equal(regressed.stale,true);assert.equal(regressed.value.portfolioDate,'2026-08-31');
  for(const name of (await fs.readdir(dir)).filter(n=>n.endsWith('.snapshot.json')))await fs.writeFile(path.join(dir,name),'corrupt');
  const restarted=createReferenceCache(dir,{now:()=>time});
  await assert.rejects(restarted.get('example',10,async()=>{throw Error('offline');}),/offline/);
});

test('public API rate limiting cools down and URLs stay within the source allowlist',async()=>{
  let calls=0;const api=createPublicApi({delayMs:0,fetchImpl:async()=>{calls++;return new Response('',{status:429});}});
  await assert.rejects(api.request('https://api.tickertape.in/mutualfunds/list'),/rate limited/);
  await assert.rejects(api.request('https://api.tickertape.in/mutualfunds/list'),/rate limited/);assert.equal(calls,1);
  await assert.rejects(api.request('https://evil.example/'),/Unsupported/);
});

test('public national scheme routes validate codes before upstream reads',async()=>{
  let calls=0,allowed=false,user={id:'owner'};
  const handler=createFundOverlap({auth:{hasAppAccess:()=>allowed,session:()=>user},provider:{scheme:async()=>{calls++;return {schemeId:'amfi-118955'};},search:async()=>({funds:[],nextOffset:40,total:55})}});
  const invoke=async(route,url='/api/fund-overlap/'+route)=>{const res={setHeader(){},writeHead(status){this.status=status;},end(body){this.body=body;}};await handler({route:'fund-overlap/'+route,method:'GET',req:{url,headers:{}},res,user});return res;};
  await assert.rejects(invoke('scheme/../secret'),e=>e.status===404);assert.equal(calls,0);
  const ok=await invoke('scheme/118955');assert.equal(ok.status,200);assert.equal(calls,1);
  const page=await invoke('search','/api/fund-overlap/search?q=example&offset=20');assert.equal(JSON.parse(page.body).nextOffset,40);
  user=null;assert.equal((await invoke('scheme/118955')).status,200);
});
