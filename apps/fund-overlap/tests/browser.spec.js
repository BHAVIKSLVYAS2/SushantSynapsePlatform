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

test('Fund Lens: selection, analysis, simulation, share, export, themes and responsive layout',async({page,context})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method(),body:r.postData()}));
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/fund-overlap');
 await expect(page.getByRole('heading',{name:'Sign in to open Fund Lens'})).toBeVisible();
 const setup=await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});expect(setup.status()).toBe(201);
 await page.goto(base);await page.getByRole('button',{name:'Open Fund Lens'}).click();await expect(page).toHaveURL(base+'/fund-overlap');
 await expect(page.locator('.fund-card')).toHaveCount(5);await expect(page.getByRole('button',{name:'Compare funds →'})).toBeDisabled();
 await page.route('**/api/fund-overlap/search?**',route=>route.fulfill({json:{funds:[],nextOffset:null}}));
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('not in library');await expect(page.getByText('No matching funds found.',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('');
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/holdings/'))).toHaveLength(0);
 await page.getByRole('button',{name:'Explore a comparison'}).click();
 await expect(page.getByRole('heading',{name:'Your funds, under the lens.'})).toBeVisible();
 await expect(page.locator('.pair')).toHaveCount(3);await expect(page.locator('.matrix tbody tr')).toHaveCount(3);
 await expect(page.locator('#exposure-output')).toContainText('₹30,000');
 await page.locator('[data-allocation="0"]').fill('20000');await expect(page.locator('#exposure-output')).toContainText('Amounts changed');
 await page.getByRole('button',{name:'Calculate exposure',exact:true}).click();await expect(page.locator('#exposure-output')).toContainText('₹40,000');
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
 await page.getByLabel('Colour theme').selectOption('dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('.pair')).toHaveCount(3);
 await page.screenshot({path:'test-results/fund-lens-mobile-dark.png',fullPage:true});
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByLabel('Colour theme').selectOption('light');await page.screenshot({path:'test-results/fund-lens-desktop-light.png',fullPage:true});
 await page.emulateMedia({colorScheme:'dark'});await page.getByLabel('Colour theme').selectOption('system');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/')).every(r=>r.method==='GET'&&!r.body)).toBe(true);expect(errors).toEqual([]);
});

test('exact-plan performance keeps Direct and Regular distinct, reports insufficient history and renders chart',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const plans=[{code:'118955',name:'Example Direct Growth'},{code:'101762',name:'Example Regular Growth'}];
 await page.route('**/api/fund-overlap/plans?**',r=>r.fulfill({json:{plans,total:2}}));
 await page.route('**/api/fund-overlap/nav/*',r=>{const p=plans.find(p=>r.request().url().endsWith(p.code));return r.fulfill({json:{...p,rows:[...Array.from({length:12},(_,i)=>({date:`2023-${String(i+1).padStart(2,'0')}-01`,nav:10})),{date:'2024-01-01',nav:p.code==='118955'?20:15}]}});});
 await page.goto(base+'/fund-overlap');await page.locator('#fund-analytics summary').click();
 await page.getByRole('searchbox',{name:'Search exact plans'}).fill('Example');await page.getByRole('button',{name:'Search plans',exact:true}).click();
 await page.locator('[data-add-plan="118955"]').click();await page.locator('[data-add-plan="101762"]').click();
 await page.getByRole('button',{name:'Compare performance',exact:true}).click();
 await expect(page.locator('#performance-output')).toContainText('100.00%');await expect(page.locator('#performance-output')).toContainText('50.00%');
 await expect(page.locator('.growth-chart polyline')).toHaveCount(2);
 await expect(page.locator('#risk-output')).toContainText('Unavailable: insufficient daily data');
 await expect(page.locator('#rolling-output')).toContainText('Need at least two completed monthly');
 await page.locator('#performance-years').selectOption('5');await expect(page.locator('#performance-output')).toContainText('Not enough shared history');
 await page.locator('#performance-years').selectOption('1');
 await page.getByRole('button',{name:'Simulate historical SIP',exact:true}).click();
 await expect(page.locator('#sip-output')).toContainText('13 contributions');await expect(page.locator('#sip-output')).toContainText('₹1,25,000');
 await page.locator('#sip-amount').fill('1000');await expect(page.locator('#sip-output')).toContainText('Inputs changed');
 await page.getByRole('button',{name:'Simulate historical SIP',exact:true}).click();await expect(page.locator('#sip-output')).toContainText('₹25,000');
 await page.getByRole('textbox',{name:'Watchlist name'}).fill('My comparison');await page.getByRole('button',{name:'Save selected plans',exact:true}).click();
 await expect(page.locator('.watchlist')).toContainText('My comparison');await page.reload();await page.locator('#fund-analytics summary').click();
 await expect(page.locator('.watchlist')).toContainText('My comparison');
 await page.getByRole('button',{name:'Latest NAV',exact:true}).click();await expect(page.locator('[data-watchlist-nav]')).toContainText('₹20.0000');
 await page.getByRole('button',{name:'Load plans',exact:true}).click();await expect(page.locator('.growth-chart polyline')).toHaveCount(2);
 await page.getByRole('button',{name:'Delete watchlist',exact:true}).click();await expect(page.locator('.watchlist')).toHaveCount(0);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/fund-analytics-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Colour theme').selectOption('dark');await page.screenshot({path:'test-results/fund-analytics-mobile.png',fullPage:true});
});

test('historical risk and rolling returns update periods, inspect shared windows and clear on selection change',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const plans=[{code:'118955',name:'Example Direct Growth'},{code:'101762',name:'Example Regular Growth'}];
 const rows=[];for(let date=Date.parse('2018-01-01'),i=0;date<=Date.parse('2025-08-31');date+=86400000,i++)rows.push({date:new Date(date).toISOString().slice(0,10),nav:100*Math.pow(1.08,i/365.25)*(1+0.1*Math.sin(i/45))});
 await page.route('**/api/fund-overlap/plans?**',r=>r.fulfill({json:{plans,total:2}}));
 await page.route('**/api/fund-overlap/nav/*',r=>{const p=plans.find(p=>r.request().url().endsWith(p.code));return r.fulfill({json:{...p,rows}});});
 await page.goto(base+'/fund-overlap');await page.locator('#fund-analytics > summary').click();
 await page.getByRole('searchbox',{name:'Search exact plans'}).fill('Example');await page.getByRole('button',{name:'Search plans',exact:true}).click();
 await page.locator('[data-add-plan="118955"]').click();await page.locator('[data-add-plan="101762"]').click();await page.locator('#load-performance').click();
 await expect(page.locator('#risk-output')).toContainText('Historical risk comparison');await expect(page.locator('#risk-output')).not.toContainText('Unavailable');
 await page.locator('#performance-years').selectOption('3');await expect(page.locator('#risk-output')).toContainText('2022-08-31');
 for(const years of ['1','3','5']){await page.locator('#rolling-years').selectOption(years);await expect(page.locator('#rolling-output caption')).toContainText(years+'-year rolling windows');}
 const detail=await page.locator('#rolling-detail').innerText();await page.locator('#rolling-observation').selectOption('0');await expect(page.locator('#rolling-detail')).not.toHaveText(detail);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#risk-output').screenshot({path:'test-results/fund-risk-desktop.png'});await page.locator('#rolling-panel').screenshot({path:'test-results/fund-rolling-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.getByLabel('Colour theme').selectOption('dark');await page.locator('#rolling-panel').screenshot({path:'test-results/fund-rolling-mobile.png'});
 let release;const pending=new Promise(resolve=>{release=resolve;});
 await page.route('**/api/fund-overlap/nav/*',async route=>{await pending;await route.fulfill({status:503,json:{error:'NAV refresh unavailable'}});});
 await page.locator('#load-performance').click();await page.locator('#performance-years').selectOption('1');
 await expect(page.locator('#risk-output')).toBeEmpty();await expect(page.locator('#rolling-panel')).toBeEmpty();release();
 await expect(page.locator('#plan-status')).toContainText('NAV refresh unavailable');await expect(page.locator('#performance-output')).toBeEmpty();
 await page.locator('[data-remove-plan="118955"]').click();await expect(page.locator('#risk-output')).toBeEmpty();await expect(page.locator('#rolling-panel')).toBeEmpty();expect(errors).toEqual([]);
});

test('personal portfolio persists manual transactions, previews CSV, rejects overselling, edits and exports',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/fund-overlap');await page.locator('#my-portfolio > summary').click();await expect(page.locator('#portfolio-status')).toHaveText('Portfolio loaded.');
 await page.getByText('Add or edit a transaction',{exact:true}).click();
 await page.locator('#portfolio-code').fill('118955');await page.locator('#portfolio-date').fill('2023-01-01');await page.locator('#portfolio-units').fill('100');await page.locator('#portfolio-amount').fill('1000');await page.locator('#portfolio-reference').fill('purchase');await page.locator('#portfolio-save').click();
 await expect(page.locator('#portfolio-status')).toHaveText('Transaction saved.');await expect(page.locator('#portfolio-value')).toContainText('₹2,000');
 await page.reload();await page.locator('#my-portfolio > summary').click();await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(1);
 await page.getByText('Import transaction CSV',{exact:true}).click();
 const csv='scheme_code,date,type,units,amount,reference\n118955,2023-01-01,BUY,100,1000,purchase\n118955,2024-01-01,SELL,50,750,redemption';
 await page.locator('#portfolio-file').setInputFiles({name:'transactions.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});await page.locator('#portfolio-check-import').click();
 await expect(page.locator('#portfolio-preview')).toContainText('1 new transactions ready · 1 duplicates skipped');await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(1);
 await page.locator('#portfolio-confirm-import').click();await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(2);await expect(page.locator('#portfolio-value')).toContainText('₹750');
 await page.locator('#portfolio-file').setInputFiles({name:'oversell.csv',mimeType:'text/csv',buffer:Buffer.from('scheme_code,date,type,units,amount\n118955,2024-01-01,SELL,80,800')});await page.locator('#portfolio-check-import').click();await expect(page.locator('#portfolio-status')).toContainText('exceeds recorded units');await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(2);
 await page.locator('#portfolio-transactions tbody tr').filter({hasText:'BUY'}).getByRole('button',{name:'Edit',exact:true}).click();await page.locator('#portfolio-amount').fill('1200');await page.locator('#portfolio-save').click();await expect(page.locator('#portfolio-value')).toContainText('₹550');
 const downloadPromise=page.waitForEvent('download');await page.locator('#portfolio-export').click();const exported=fs.readFileSync(await (await downloadPromise).path(),'utf8');expect(exported).toContain('1200');expect(exported).toContain('scheme_code');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/portfolio-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.getByLabel('Colour theme').selectOption('dark');await page.locator('#portfolio-value').screenshot({path:'test-results/portfolio-mobile.png'});
 page.on('dialog',d=>d.accept());await page.locator('#portfolio-transactions tbody tr').filter({hasText:'BUY'}).getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('#portfolio-status')).toContainText('exceeds recorded units');
 await page.locator('#portfolio-transactions tbody tr').filter({hasText:'SELL'}).getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(1);
 await page.locator('[data-delete-transaction]').click();await expect(page.locator('#portfolio-transactions tbody tr')).toHaveCount(0);expect(errors).toEqual([]);
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
