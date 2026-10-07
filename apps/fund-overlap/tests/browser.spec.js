const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
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
 const value=await page.evaluate(()=>jsonFetch('/api/fund-overlap/scheme/123456'));
 expect(value.schemeId).toBe('amfi-123456'); expect(calls).toBe(2);
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
 await page.getByText('Source verification details',{exact:true}).first().click();
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
