const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
const referenceIndex = require('../data/fund-index.json');
const coverageFixture = {
 version:1,generatedAt:'2026-10-12T08:00:00Z',
 summary:{fundHouses:4,totalSchemes:10,verifiedSchemes:5,unsupportedSchemes:1,unavailableSchemes:3,staleSchemes:1},
 sources:[
  {id:'ppfas',amc:'PPFAS Mutual Fund',status:'verified',checkedAt:'2026-10-12T08:00:00Z',portfolioDate:'2026-09-30',verifiedSchemes:5,message:'Published equity disclosures verified.'},
  {id:'hdfc',amc:'HDFC Mutual Fund',status:'failed',checkedAt:'2026-10-12T08:00:00Z',verifiedSchemes:0,message:'Official holdings are not available in this check.'},
  {id:'axis',amc:'Axis Mutual Fund',status:'unsupported',checkedAt:'2026-10-12T08:00:00Z',verifiedSchemes:0,message:'This fixture covers a debt scheme outside equity comparison.'},
  {id:'sbi',amc:'SBI Mutual Fund',status:'stale',checkedAt:'2026-10-12T08:00:00Z',portfolioDate:'2026-06-30',verifiedSchemes:0,message:'The original reporting date is retained.'},
 ],
 schemes:referenceIndex.funds.map((fund,i)=>({schemeCode:String(120000+i),name:fund.name,amc:fund.amc,status:'verified',officialFundId:fund.id,portfolioDate:fund.portfolioDate})),
};
test.beforeEach(async({page})=>{
 // Reference fixtures keep browser verification independent of upstream services
 // and newly published reference snapshots. No workspace records are changed.
 await page.route('**/api/fund-overlap/fund-index.json',route=>route.fulfill({json:referenceIndex}));
 await page.route('**/api/fund-overlap/coverage.json',route=>route.fulfill({json:coverageFixture}));
 await page.route('**/api/fund-overlap/holdings/*/*.json',route=>{
  const relative=new URL(route.request().url()).pathname.replace('/api/fund-overlap/','');
  const file=path.join(__dirname,'../data',relative);
  return route.fulfill({contentType:'application/json',body:fs.readFileSync(file)});
 });
});
test('transient gateway errors recover once without retrying rate limits', async ({page}) => {
 await page.goto(base+'/fund-overlap');
 let calls=0;
 await page.route('**/api/fund-overlap/scheme/123456',route=>++calls===1 ? route.fulfill({status:503,contentType:'text/html',body:'Gateway unavailable'}) : route.fulfill({json:{schemeId:'amfi-123456'}}));
 expect(await page.evaluate(()=>jsonFetch('/api/fund-overlap/scheme/123456'))).toEqual({schemeId:'amfi-123456'});
 expect(calls).toBe(2);
 calls=0;
 await page.route('**/api/fund-overlap/scheme/123457',route=>{calls++;return route.fulfill({status:429,json:{error:'Retry in a minute'}});});
 await expect(page.evaluate(()=>jsonFetch('/api/fund-overlap/scheme/123457'))).rejects.toThrow('Retry in a minute');
 expect(calls).toBe(1);
});
test('comparison retry reuses successful funds when one source fails', async ({page}) => {
 await page.goto(base+'/fund-overlap');
 let good=0,bad=0,recovered=false;
 await page.route('**/api/fund-overlap/holdings/ppfas-flexi-cap/*.json',async route=>{good++;await route.fallback();});
 await page.route('**/api/fund-overlap/holdings/ppfas-elss/*.json',async route=>{bad++;if(recovered)await route.fallback();else await route.fulfill({status:503,json:{error:'Source unavailable'}});});
 await page.getByRole('button',{name:'Add Parag Parikh Flexi Cap Fund',exact:true}).click();
 await page.getByRole('button',{name:'Add Parag Parikh ELSS Tax Saver Fund',exact:true}).click();
 await page.locator('#compare').click();
 await expect(page.locator('#load-error')).toContainText('Source unavailable');
 recovered=true;
 await page.locator('#compare').click();
 await expect(page.getByRole('heading',{name:'Your funds, under the lens.'})).toBeVisible();
 expect(good).toBe(1);expect(bad).toBe(3);
});
test('HTML search failures and rate limits recover on retry and retain selection', async ({page}) => {
 await page.goto(base+'/fund-overlap');
 await page.getByRole('button',{name:'Add Parag Parikh Flexi Cap Fund',exact:true}).click();
 let status=503;
 await page.route('**/api/fund-overlap/search?**',route=>status===200 ? route.fulfill({json:{funds:[],nextOffset:null}}) : route.fulfill({status,contentType:'text/html',body:'<!DOCTYPE html><html>Unavailable</html>'}));
 await page.locator('#fund-search').fill('mirae large and midcap');
 await expect(page.locator('#search-status')).toContainText('Please retry shortly');
 await expect(page.locator('#search-status')).not.toContainText('DOCTYPE');
 await expect(page.locator('#selection-count')).toContainText('1 of 8');
 status=429;
 await page.locator('#retry-search').click();
 await expect(page.locator('#search-status')).toContainText('retry in a minute');
 status=200;
 await page.locator('#retry-search').click();
 await expect(page.locator('#retry-search')).toBeHidden();
 await expect(page.locator('#search-status')).toContainText('matching portfolios shown');
 await expect(page.locator('#selection-count')).toContainText('1 of 8');
});
test.beforeAll(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-lens-browser-'));
 child=spawn(process.execPath,['--require',path.join(__dirname,'fixtures/mock-nav.cjs'),'server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,NODE_ENV:'test',SETUP_TOKEN:''},stdio:['ignore','pipe','pipe']});
 base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});child.on('error',reject);child.stderr.on('data',()=>{});});
});
test.afterAll(async()=>{if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});fs.rmSync(dir,{recursive:true,force:true});});

test('Cloudflare verification continues before returning a complete snapshot', async ({page}) => {
 await page.goto(base+'/fund-overlap');
 let calls=0;
 await page.route('**/api/fund-overlap/scheme/123456',route=>route.fulfill({status:++calls===1?202:200,json:calls===1?{code:'FUND_CONTINUE'}:{schemeId:'amfi-123456',holdings:[]}}));
 const value=await page.evaluate(()=>{window.verificationRounds=[];return jsonFetch('/api/fund-overlap/scheme/123456',0,{onProgress:round=>window.verificationRounds.push(round)});});
 expect(value.schemeId).toBe('amfi-123456'); expect(calls).toBe(2);
 expect(await page.evaluate(()=>window.verificationRounds)).toEqual([1]);
 await expect(page.evaluate(()=>jsonFetch('/api/fund-overlap/scheme/123456',0,{deadline:Date.now()-1}))).rejects.toThrow('taking longer than expected');
});

test('Fund Lens: selection, analysis, simulation, share, export, themes and responsive layout',async({page,context})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/fund-overlap');
 await expect(page.locator('#fund-search')).toBeVisible();
 await expect(page.locator('#my-portfolio, #fund-analytics, input[type=file]')).toHaveCount(0);
 await page.goto(base);await page.getByRole('link',{name:'Fund Lens',exact:true}).click();
 await expect(page.locator('.fund-card')).toHaveCount(5);await expect(page.getByRole('button',{name:'Compare funds →'})).toBeDisabled();
 await page.route('**/api/fund-overlap/search?**',route=>route.fulfill({json:{funds:[],nextOffset:null}}));
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('not in library');await expect(page.getByText('No matching funds found.',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('');
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/holdings/'))).toHaveLength(0);
 await page.getByRole('button',{name:'Explore a comparison'}).click();
 await expect(page.getByRole('heading',{name:'Your funds, under the lens.'})).toBeVisible();
 await expect(page.locator('.pair')).toHaveCount(3);await expect(page.locator('.matrix tbody tr')).toHaveCount(3);
 await page.getByRole('navigation',{name:'Comparison sections'}).getByRole('button',{name:'Sources',exact:true}).click();
 await expect(page.locator('#result-sources')).toBeInViewport();
 await expect(page.locator('.source code').first()).toBeHidden();
 await page.locator('#result-sources').getByText('Source verification details',{exact:true}).first().click();
 await expect(page.locator('.source code').first()).toBeVisible();
 await page.getByRole('button',{name:'Edit funds',exact:false}).click();
 await expect(page.getByRole('searchbox',{name:'Search funds',exact:true})).toBeFocused();
 await page.locator('#fund-grid').scrollIntoViewIfNeeded();
 await expect(page.locator('#compare')).toBeInViewport();
 await page.locator('#results').scrollIntoViewIfNeeded();
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/holdings/'))).toHaveLength(3);
 const before=await page.locator('.stat').first().locator('.number').innerText();await page.getByLabel('Weight basis').selectOption('nav');
 const after=await page.locator('.stat').first().locator('.number').innerText();expect(before).not.toBe(after);
 await page.getByLabel('Holdings view').selectOption('unique');await page.getByRole('searchbox',{name:'Search holdings',exact:true}).fill('No such security');await expect(page.getByText('No holdings match this view.',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search holdings',exact:true}).fill('');await page.getByLabel('Holdings view').selectOption('common');
 await page.locator('[data-simulate="ppfas-large-cap"]').uncheck();await expect(page.locator('.pair')).toHaveCount(1);
 await page.locator('[data-simulate="ppfas-flexi-cap"]').click();await expect(page.locator('[data-simulate="ppfas-flexi-cap"]')).toBeChecked();
 await page.getByRole('button',{name:'Restore all funds'}).click();await expect(page.locator('.pair')).toHaveCount(3);
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.getByRole('button',{name:'Copy comparison link'}).click();const shared=await page.evaluate(()=>navigator.clipboard.readText());expect(shared).toContain('#funds=');expect(shared).toContain('basis=nav');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export holdings CSV'}).click();const download=await downloadPromise;const csv=fs.readFileSync(await download.path(),'utf8');expect(csv).toContain('ISIN');expect(csv).toContain('Portfolio date');expect(csv).toContain('ppfas.com');
 await page.evaluate(()=>window.print=()=>{window.printInvoked=true;});await page.getByRole('button',{name:'Print report'}).click();expect(await page.evaluate(()=>window.printInvoked)).toBe(true);
 await page.goto(shared);await expect(page.locator('.pair')).toHaveCount(3);await expect(page.getByLabel('Weight basis')).toHaveValue('nav');
 await setTheme(page,'dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('.pair')).toHaveCount(3);
 await page.screenshot({path:'test-results/fund-lens-mobile-dark.png',fullPage:true});
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await setTheme(page,'light');await page.screenshot({path:'test-results/fund-lens-desktop-light.png',fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await setTheme(page,'system');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/')).every(r=>r.method==='GET'&&!r.body)).toBe(true);expect(errors).toEqual([]);
});

test('invalid share links, missing snapshot retry and selection changes clear obsolete results',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 await page.goto(base+'/fund-overlap#funds=unknown,ppfas-elss');await expect(page.locator('#notice')).toContainText('unavailable');
 await page.route('**/api/fund-overlap/holdings/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Disclosure temporarily unavailable"}'}));
 await page.getByRole('button',{name:'Explore a comparison'}).click();await expect(page.locator('#load-error')).toContainText('temporarily unavailable');await expect(page.locator('.selected')).toHaveCount(3);
 await page.unroute('**/api/fund-overlap/holdings/**');await page.getByRole('button',{name:'Compare funds →'}).click();await expect(page.locator('.pair')).toHaveCount(3);
 await page.getByRole('button',{name:'Remove Parag Parikh ELSS Tax Saver Fund'}).click();await expect(page.locator('#results')).toBeEmpty();await expect(page.locator('#selection-count')).toContainText('2 of 8');
});

test('national search compares another fund house with an official snapshot and restores its share link',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const {createProvider}=require('../backend/provider');
 const fixture=require('./fixtures/groww-excerpt.json');
 const provider=createProvider({now:()=>Date.parse('2026-09-15'),fetchImpl:async url=>Response.json(url.includes('/scheme/search/')?fixture.fund:{header:{searchId:url.split('/').at(-1),isin:fixture.identifiers[url.split('/').at(-1)]}})});
 const snapshot=await provider.snapshot(fixture.fund.search_id);
 const entry={id:snapshot.schemeId,name:snapshot.name,amc:snapshot.amc,category:snapshot.category,provider:'Groww',holdingsPath:'/api/fund-overlap/remote/'+fixture.fund.search_id};
 await page.route('**/api/fund-overlap/search?**',route=>route.fulfill({json:{funds:[entry],nextOffset:null}}));
 await page.route('**/api/fund-overlap/remote/**',route=>route.fulfill({json:snapshot}));
 await page.goto(base+'/fund-overlap');
 await page.getByRole('button',{name:'Add Parag Parikh Flexi Cap Fund',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('hdfc');
 await page.getByRole('button',{name:'Add '+snapshot.name,exact:true}).click();
 await page.locator('#compare').click();
 await expect(page.locator('.pair')).toHaveCount(1);
 await expect(page.locator('#results')).toContainText(snapshot.name);
 await expect(page.locator('#results')).toContainText('secondary source');
 await page.goto(base+'/fund-overlap#funds=ppfas-flexi-cap,'+snapshot.schemeId+'&basis=nav');
 await expect(page.locator('.pair')).toHaveCount(1);
 await expect(page.getByLabel('Weight basis')).toHaveValue('nav');
});

test('AMFI search pagination, retry, shared portfolios, duplicate plans and stale coverage',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const localIndex=require('../data/fund-index.json');
 const original=require('../data/'+localIndex.funds[0].holdingsPath.split('/api/fund-overlap/')[1]);
 const snapshot={...original,schemeId:'amfi-118955',portfolioKey:'fixture-hdfc',name:'HDFC Flexi Cap Fund Direct Growth',amc:'HDFC Mutual Fund',cacheStatus:'stale',cacheWarning:'Source refresh failed. Showing the last verified saved portfolio with its original reporting date.',source:{...original.source,publisher:'Tickertape',kind:'aggregator'}};
 const entry={id:snapshot.schemeId,name:snapshot.name,amc:snapshot.amc,category:'Flexi Cap',provider:'MFapi',holdingsPath:'/api/fund-overlap/scheme/118955'};
 const second={...entry,id:'amfi-101762',name:'HDFC Flexi Cap Fund Regular Growth',holdingsPath:'/api/fund-overlap/scheme/101762'};
 let failed=true;
 await page.route('**/api/fund-overlap/search?**',route=>{
  if(failed){failed=false;return route.fulfill({json:{funds:[],nextOffset:null,warning:'National search is temporarily unavailable.'}});}
  const offset=new URL(route.request().url()).searchParams.get('offset');
  return route.fulfill({json:{funds:offset==='20'?[second]:[entry],nextOffset:offset==='20'?null:20,total:2}});
 });
 await page.route('**/api/fund-overlap/scheme/**',route=>route.fulfill({json:route.request().url().endsWith('101762')?{...snapshot,schemeId:second.id,name:second.name}:snapshot}));
 await page.goto(base+'/fund-overlap');
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('hdfc');
 await expect(page.locator('#search-status')).toContainText('temporarily unavailable');
 await page.getByRole('button',{name:'Retry fund search'}).click();
 await page.getByRole('button',{name:'Add '+entry.name,exact:true}).click();
 await page.getByRole('button',{name:'Show more matches'}).click();
 await expect(page.locator('.fund-card')).toHaveCount(2);
 await page.getByRole('button',{name:'Add '+second.name,exact:true}).click();
 await page.locator('#compare').click();await expect(page.locator('#load-error')).toContainText('share a portfolio');
 await page.goto(base+'/fund-overlap#funds=amfi-118955,ppfas-elss&basis=nav');
 await expect(page.locator('.pair')).toHaveCount(1);await expect(page.getByLabel('Weight basis')).toHaveValue('nav');
 await expect(page.locator('#results')).toContainText('Source refresh failed');
 await page.reload();await expect(page.locator('.pair')).toHaveCount(1);
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('HDFC selection survives switching to Parag Parikh, clearing search and retrying without selecting other funds',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const hdfc={id:'amfi-118955',name:'HDFC Flexi Cap Fund Direct Growth',amc:'HDFC Mutual Fund',category:'Flexi Cap',provider:'MFapi',holdingsPath:'/api/fund-overlap/scheme/118955'};
 const parag=require('../data/fund-index.json').funds;
 await page.route('**/api/fund-overlap/search?**',route=>{
  const q=new URL(route.request().url()).searchParams.get('q');
  return route.fulfill({json:q==='offline'?{funds:[],nextOffset:null,warning:'Search temporarily unavailable'}:{funds:q==='hdfc'?[hdfc]:parag,nextOffset:null}});
 });
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/fund-overlap');
 const search=page.getByRole('searchbox',{name:'Search funds',exact:true});
 await search.fill('hdfc');await page.getByRole('button',{name:'Add '+hdfc.name,exact:true}).click();
 await search.fill('parag parikh');await expect(page.locator('.fund-card')).toHaveCount(5);
 await expect(page.locator('#selected-funds [data-select]')).toHaveCount(1);
 await expect(page.locator('#selected-funds')).toContainText(hdfc.name);
 await expect(page.locator('#selected-funds')).toBeInViewport();
 await expect(page.locator('#fund-grid [aria-pressed="true"]')).toHaveCount(0);
 await expect(page.locator('#explore')).toBeHidden();
 await page.getByRole('button',{name:'Add Parag Parikh Flexi Cap Fund',exact:true}).click();
 await expect(page.locator('#selected-funds [data-select]')).toHaveCount(2);
 await expect(page.locator('#fund-grid [aria-pressed="true"]')).toHaveCount(1);
 await search.fill('');await expect(page.locator('#selected-funds [data-select]')).toHaveCount(2);
 await search.fill('hdfc');await expect(page.locator('#fund-grid [aria-pressed="true"]')).toHaveCount(1);
 await search.fill('offline');await expect(page.locator('#retry-search')).toBeVisible();
 await page.locator('#retry-search').click();await expect(page.locator('#selected-funds [data-select]')).toHaveCount(2);
 await page.getByRole('button',{name:'Remove selected '+hdfc.name,exact:true}).click();
 await expect(page.locator('#selected-funds [data-select]')).toHaveCount(1);
 await expect(page.locator('#selected-funds')).toContainText('Parag Parikh Flexi Cap Fund');
 await page.getByRole('button',{name:'Clear selected funds',exact:true}).click();
 await expect(page.locator('#selection-count')).toHaveText('0 of 8 funds selected');
});

test('official coverage separates verified holdings from discovery and preserves reporting dates',async({page})=>{
 const hdfc={id:'official-hdfc-flexi-cap',name:'HDFC Flexi Cap Fund',amc:'HDFC Mutual Fund',category:'Flexi Cap',official:true,provider:'official',coverageStatus:'verified',portfolioDate:'2026-09-30',includedNavWeight:96,holdingsCount:40,holdingsPath:'/api/fund-overlap/holdings/fixture-hdfc.json'};
 const older={...hdfc,id:'official-sbi-flexi-cap',name:'SBI Flexi Cap Fund',amc:'SBI Mutual Fund',coverageStatus:'stale',portfolioDate:'2026-06-30'};
 const debt={id:'amfi-198765',name:'Axis Debt Fund Direct Growth',amc:'Axis Mutual Fund',category:'Debt',provider:'MFapi',coverageStatus:'unsupported',coverageMessage:'Debt holdings are outside this equity comparison.',holdingsPath:'/api/fund-overlap/scheme/198765'};
 const partial={id:'kotak',amc:'Kotak Mutual Fund',status:'partial',checkedAt:'2026-10-12T08:00:00Z',portfolioDate:'2026-09-30',verifiedSchemes:1,message:'One equity scheme is verified; other schemes await official holdings.'};
 // Published coverage summaries may omit the large scheme audit. Index and
 // discovery metadata must still identify verified, older and unsupported data.
 const data={...coverageFixture,summary:{...coverageFixture.summary,fundHouses:5,verifiedSchemes:6},sources:[...coverageFixture.sources,partial],schemes:[]};
 await page.route('**/api/fund-overlap/fund-index.json',route=>route.fulfill({json:{...referenceIndex,funds:[...referenceIndex.funds,hdfc,older]}}));
 await page.route('**/api/fund-overlap/coverage.json',route=>route.fulfill({json:data}));
 let nationalCalls=0;
 await page.route('**/api/fund-overlap/search?**',route=>{nationalCalls++;return route.fulfill({json:{funds:[debt],total:1,nextOffset:null}});});
 await page.setViewportSize({width:320,height:844});await page.goto(base+'/fund-overlap');
 const panel=page.getByRole('region',{name:'Official data coverage'});
 await expect(panel).toContainText('6');await expect(panel).toContainText('10');
 await expect(panel).toContainText('National discovery helps you find funds');
 await page.getByRole('button',{name:'Add Parag Parikh Flexi Cap Fund',exact:true}).click();
 await page.getByRole('button',{name:'Verified official library',exact:true}).click();
 await expect(page.locator('#official-library')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.fund-card')).toHaveCount(6);
 await expect(page.locator('#fund-grid')).not.toContainText(older.name);
 const search=page.getByRole('searchbox',{name:'Search funds',exact:true});
 await search.fill('HDFC');await expect(page.locator('.fund-card')).toHaveCount(1);
 await expect(page.locator('#fund-grid')).toContainText('Verified official');
 await expect(page.locator('#fund-grid')).toContainText('30 Sept 2026');
 await expect(page.locator('#selected-funds')).toContainText('Parag Parikh Flexi Cap Fund');
 expect(nationalCalls).toBe(0);
 await page.getByRole('button',{name:'Nationwide search',exact:true}).click();
 await expect(page.locator('#fund-grid')).toContainText(debt.name);
 await expect(page.locator('#fund-grid')).toContainText('Outside equity comparison');
 await expect(page.locator('#fund-grid')).toContainText(debt.coverageMessage);
 await expect(page.getByRole('button',{name:'Add '+debt.name,exact:true})).toBeDisabled();
 await expect(page.locator('#selected-funds')).toContainText('Parag Parikh Flexi Cap Fund');
 await panel.locator('.coverage-details>summary').click();
 await expect(panel).toContainText('30 Jun 2026');
 await expect(panel).toContainText('Checked 12 Oct 2026');
 for(const [status,amc] of [['verified','PPFAS'],['unavailable','HDFC'],['unsupported','Axis'],['stale','SBI'],['partial','Kotak']]) {
  await page.getByLabel('Show fund houses', {exact:true}).selectOption(status);
  await expect(panel.locator('.coverage-source')).toContainText(amc);
  await expect(panel.locator('.coverage-source')).toHaveCount(status==='verified'?1:1);
 }
 await expect(panel.locator('.coverage-source>p').last()).toHaveText('Some official portfolios are verified; others await usable disclosures.');
 await expect(panel.getByText(partial.message,{exact:true})).toBeHidden();
 await panel.locator('.source-audit-details>summary').click();
 await expect(panel.getByText(partial.message,{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await setTheme(page,'dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('coverage register failure is recoverable and does not block comparison',async({page})=>{
 let unavailable=true;
 await page.route('**/api/fund-overlap/coverage.json',route=>unavailable?route.fulfill({status:503,json:{error:'Coverage unavailable'}}):route.fulfill({json:coverageFixture}));
 await page.goto(base+'/fund-overlap');
 await expect(page.getByRole('button',{name:'Retry coverage check',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Official data coverage'})).toContainText('You can still select funds and compare');
 await page.getByRole('button',{name:'Explore a comparison'}).click();
 await expect(page.locator('.pair')).toHaveCount(3);
 unavailable=false;await page.getByRole('button',{name:'Retry coverage check',exact:true}).click();
 await expect(page.getByRole('region',{name:'Official data coverage'})).toContainText('Know what is covered.');
 await expect(page.locator('.pair')).toHaveCount(3);
 await expect(page.locator('#selection-count')).toHaveText('3 of 8 funds selected');
});

test('recent retained official portfolios show source refresh failures in preview and comparison',async({page})=>{
 const reason='Publisher returned an incomplete disclosure; the last valid portfolio is retained.';
 const retained={...referenceIndex.funds[0],official:true,provider:'official',coverageStatus:'stale',latestAttemptMessage:reason+' '+ 'Worksheet validation details. '.repeat(40)};
 const other={...referenceIndex.funds[1],official:true,provider:'official',coverageStatus:'verified'};
 const original=require('../data/'+retained.holdingsPath.split('/api/fund-overlap/')[1]);
 const otherSnapshot=require('../data/'+other.holdingsPath.split('/api/fund-overlap/')[1]);
 await page.clock.install({time:new Date(Date.parse(retained.portfolioDate)+15*86400000)});
 await page.route('**/api/fund-overlap/fund-index.json',route=>route.fulfill({json:{...referenceIndex,funds:[retained,other]}}));
 await page.route('**/api/fund-overlap/coverage.json',route=>route.fulfill({json:{...coverageFixture,schemes:[]}}));
 let snapshotRequests=0;
 await page.route('**'+retained.holdingsPath,route=>{snapshotRequests++;return route.fulfill({json:original});});
 await page.route('**'+other.holdingsPath,route=>route.fulfill({json:otherSnapshot}));
 await page.goto(base+'/fund-overlap');
 await expect(page.locator('.fund-card').filter({hasText:retained.name})).toContainText(reason);
 await page.getByRole('button',{name:'Add '+retained.name,exact:true}).click();
 await page.getByRole('button',{name:'Check coverage',exact:true}).click();
 await expect(page.locator('#selected-funds')).toContainText('Saved data');
 expect(await page.evaluate(id=>({date:snapshots.get(id).portfolioDate,status:snapshots.get(id).cacheStatus,warning:snapshots.get(id).cacheWarning}),retained.id)).toEqual({date:retained.portfolioDate,status:'stale',warning:expect.stringContaining(reason)});
 expect(await page.evaluate(id=>snapshots.get(id).cacheWarning.length,retained.id)).toBeLessThan(340);
 await page.getByRole('button',{name:'Add '+other.name,exact:true}).click();
 await page.locator('#compare').click();
 await expect(page.locator('.pair')).toHaveCount(1);
 await expect(page.locator('#results')).toContainText('Official source refresh failed');
 await expect(page.locator('#results')).toContainText(reason);
 await expect(page.locator('#results')).not.toContainText('over 45 days old');
 await expect(page.locator('#result-sources')).toContainText('30 Sept 2026');
 expect(snapshotRequests).toBe(2);
});

test('large official libraries paginate locally and match separate complete search words',async({page})=>{
 const funds=Array.from({length:240},(_,i)=>({id:'official-meridian-'+i,name:`Meridian ${i+1} Equity Fund`,amc:'Meridian Mutual Fund',category:'Equity',official:true,provider:'official',coverageStatus:'verified',portfolioDate:'2026-09-30',includedNavWeight:95,holdingsPath:'/api/fund-overlap/holdings/meridian-'+i+'.json'}));
 const lookalike={...funds[0],id:'official-meridianity',name:'Meridianity Equity Fund',amc:'Another Mutual Fund'};
 await page.route('**/api/fund-overlap/fund-index.json',route=>route.fulfill({json:{...referenceIndex,funds:[...funds,lookalike]}}));
 let requests=0;await page.route('**/api/fund-overlap/search?**',route=>{requests++;return route.fulfill({json:{funds:[],nextOffset:null}});});
 await page.setViewportSize({width:320,height:844});await page.goto(base+'/fund-overlap');
 await page.getByRole('button',{name:'Verified official library',exact:true}).click();
 await expect(page.locator('.fund-card')).toHaveCount(12);
 await expect(page.locator('#search-status')).toContainText('12 of 241');
 await page.getByRole('button',{name:'Show more matches'}).click();await expect(page.locator('.fund-card')).toHaveCount(24);
 await page.getByRole('button',{name:'Add Meridian 1 Equity Fund',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('meridian equity');
 await expect(page.locator('.fund-card')).toHaveCount(12);await expect(page.locator('#search-status')).toContainText('12 of 240');
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('meridian 219');
 await expect(page.locator('.fund-card')).toHaveCount(1);await expect(page.locator('#fund-grid')).toContainText('Meridian 219 Equity Fund');
 await expect(page.getByRole('button',{name:'Show more matches'})).toBeHidden();
 await expect(page.locator('#selected-funds')).toContainText('Meridian 1 Equity Fund');expect(requests).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('official labels age on opening the page while coverage counts retain their audit date',async({page})=>{
 await page.clock.install({time:new Date('2027-01-01T00:00:00Z')});
 await page.goto(base+'/fund-overlap');
 await expect(page.locator('.fund-card .coverage-stale')).toHaveCount(5);
 await expect(page.getByRole('region',{name:'Official data coverage'})).toContainText('12 Oct 2026');
 await expect(page.getByRole('region',{name:'Official data coverage'})).toContainText('Counts reflect the dated coverage check above');
 await page.getByRole('button',{name:'Verified official library',exact:true}).click();
 await expect(page.locator('.fund-card')).toHaveCount(0);
 await expect(page.locator('#fund-grid')).toContainText('No current verified official portfolios match');
 await page.getByRole('button',{name:'Nationwide search',exact:true}).click();
 await expect(page.locator('.fund-card .coverage-stale')).toHaveCount(5);
});
