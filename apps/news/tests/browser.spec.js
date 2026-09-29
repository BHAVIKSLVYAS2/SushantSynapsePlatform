const {test,expect}=require('@playwright/test');
const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
let child,base,dir;
test.beforeEach(async()=>{
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-news-'));
  child=spawn(process.execPath,['--require',path.join(__dirname,'mock-provider.cjs'),'server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{
    let out='';const timer=setTimeout(()=>reject(Error('Server startup timed out')),10000);
    child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});
    child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code));});
  });
});
test.afterEach(async()=>{
  if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});
  if(dir)fs.rmSync(dir,{recursive:true,force:true});
});

test('a pending publication does not replace a newly selected archive date',async({page})=>{
  execFileSync(process.execPath,[path.join(__dirname,'seed-fixtures.js'),dir]);
  const today=(await (await page.request.get(base+'/api/news/status')).json()).today;
  await page.goto(base+'/news?date='+today);
  let release,started;
  const arrived=new Promise(resolve=>{started=resolve;});
  const blocked=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/news/fetch',async route=>{
    expect(route.request().postDataJSON()).toEqual({date:today});
    const response=await route.fetch();started();await blocked;await route.fulfill({response});
  });
  await page.getByRole('button',{name:"Fetch today's newspaper"}).click();await arrived;
  await page.getByLabel('Edition date').fill('2025-01-03');
  await expect(page.locator('.saved-story h2').first()).toContainText('2025-01-03');
  release();
  await expect(page.locator('#fetch-news')).toBeEnabled();
  await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-03');
  await expect(page.locator('#preview-heading')).toHaveText('Newspaper for 2025-01-03');
  await expect(page.locator('.saved-story a').first()).toHaveAttribute('href','https://example.com/2025-01-03/1');
});

test('News public failures offer retry without asking for platform sign-in',async({page})=>{
 await page.route('**/api/news/status',route=>route.fulfill({status:401,json:{error:'stale upstream'}}));
 await page.goto(base+'/news');await expect(page.locator('#retry')).toBeVisible();await expect(page.locator('body')).not.toContainText('Sign in');await expect(page.locator('header .brand img')).toBeVisible();
 await page.unroute('**/api/news/status');await page.locator('#retry').click();await expect(page.locator('#newspaper')).toBeVisible();await expect(page.locator('#fetch-news')).toBeEnabled();
});

test('past dates generate comics and future dates show validation without fetching',async({page})=>{
 await page.goto(base+'/news?date=2099-01-01');
 await expect(page.locator('#reader-status')).toContainText('Future dates');await expect(page.locator('#fetch-news')).toBeDisabled();
 expect((await page.request.post(base+'/api/news/fetch',{data:{date:'2099-01-01'}})).status()).toBe(400);
 await page.getByLabel('Edition date').fill('2025-01-02');
 await page.getByRole('button',{name:'Generate newspaper for 2025-01-02'}).click();
 await expect(page.locator('.saved-story')).toHaveCount(10);await expect(page.locator('.comic-panel')).toHaveCount(3);
 await expect(page.locator('#saved-reader')).toContainText('Masala');
 await page.reload();await expect(page.locator('.comic-panel')).toHaveCount(3);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByLabel('Colour theme').selectOption('dark');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/news-comic-mobile.png',fullPage:true});
});
test('News access, available catalogue, empty states, responsive themes and print',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  expect((await page.request.get(base+'/api/news/status')).status()).toBe(200);
  await page.goto(base+'/news');
  await expect(page.getByRole('link',{name:'Sign in to the platform'})).toBeHidden();
  await expect(page.locator('#fetch-news')).toBeVisible();
  await expect(page.locator('#newspaper')).toBeVisible();
  const password='News isolated test password!';
  expect((await page.request.post(base+'/api/auth/setup',{data:{name:'News Owner',email:'owner@news.example',password}})).status()).toBe(201);
  const status=await page.request.get(base+'/api/news/status');
  expect(status.headers()['cache-control']).toBe('no-store');
  expect(await status.json()).toMatchObject({author:'Bhavik',generationAvailable:true,archiveAvailable:true});
  expect((await page.request.post(base+'/api/news/status',{data:{}})).status()).toBe(405);
  expect((await page.request.post(base+'/api/news/fetch',{data:{unsupported:true}})).status()).toBe(400);
  expect((await page.request.get(base+'/apps/news/backend/routes.js')).status()).toBe(404);
  expect((await page.request.post(base+'/api/platform/apps/news/launch',{data:{}})).status()).toBe(200);
  const catalog=await (await page.request.get(base+'/api/platform')).json();
  expect(catalog.apps.find(app=>app.id==='news')).toMatchObject({status:'Available',accessible:true});
  await page.goto(base+'/news/');await expect(page).toHaveURL(base+'/news');
  await expect(page.getByRole('heading',{name:'Sushant Synapse Times',exact:true})).toBeVisible();
  await expect(page.locator('.byline')).toHaveText('By Bhavik');
  await expect(page.getByRole('button',{name:"Fetch today's newspaper"})).toBeEnabled();
  await expect(page.getByLabel('Edition date')).toBeEnabled();
  await expect(page.getByRole('heading',{name:'Previous editions'})).toBeVisible();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByLabel('Colour theme').selectOption('light');
  await page.screenshot({path:'test-results/news-desktop-light.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByLabel('Colour theme').selectOption('dark');await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('#newspaper')).toBeVisible();
  await page.screenshot({path:'test-results/news-mobile-dark.png',fullPage:true});
  await page.getByLabel('Colour theme').selectOption('system');
  await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.emulateMedia({media:'print'});await expect(page.locator('.edition-tools')).toBeHidden();await expect(page.locator('.masthead')).toBeVisible();
  await page.emulateMedia({media:'screen'});
  expect((await page.request.post(base+'/api/users',{data:{name:'News Reader',email:'reader@news.example',password,role:'Clerk',appIds:[]}})).status()).toBe(201);
  await page.request.post(base+'/api/auth/logout',{data:{}});
  await page.request.post(base+'/api/auth/login',{data:{email:'reader@news.example',password}});
  expect((await page.request.get(base+'/api/news/status')).status()).toBe(200);
  await page.reload();await expect(page.locator('#newspaper')).toBeVisible();
  await expect(page.locator('#fetch-news')).toBeVisible();
  expect(errors).toEqual([]);
});

test('manual newspaper publishes ten stories and satire and reopens the stored edition',async({page})=>{
 await page.goto(base+'/news');await page.getByRole('button',{name:"Fetch today's newspaper"}).click();
 await expect(page.locator('.saved-story')).toHaveCount(10);
 await expect(page.locator('.saved-satire')).toContainText('Fictional commentary');
 await expect(page.locator('#fetch-status')).toContainText('published and saved');
 await page.getByRole('button',{name:"Open today's newspaper"}).click();await expect(page.locator('#fetch-status')).toContainText('No news request');
 await page.reload();await expect(page.locator('.saved-story')).toHaveCount(10);await expect(page.locator('#fetch-status')).toContainText('No news request');
 const today=(await (await page.request.get(base+'/api/news/status')).json()).today;
 expect((await page.request.get(base+'/api/news/editions/'+today)).status()).toBe(200);
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'test-results/news-published.png',fullPage:true});
 await page.request.post(base+'/api/auth/setup',{data:{name:'News Owner',email:'owner@news.example',password:'News isolated test password!'}});
 expect((await page.request.post(base+'/api/users',{data:{name:'Granted reader',email:'granted@news.example',password:'News reader password!',role:'Clerk',appIds:[]}})).status()).toBe(201);
 await page.request.post(base+'/api/auth/logout',{data:{}});
 await page.request.post(base+'/api/auth/login',{data:{email:'granted@news.example',password:'News reader password!'}});
 expect((await page.request.get(base+'/api/news/editions/'+today)).status()).toBe(200);
 const shared=await (await page.request.get(base+'/api/news/editions/'+today)).json();
 const repeated=await (await page.request.post(base+'/api/news/fetch',{data:{}})).json();expect(repeated.cached).toBe(true);expect(repeated.edition).toEqual(shared);
 expect((await page.request.get(base+'/api/news/preview/'+today)).status()).toBe(403);
 await page.reload();await expect(page.locator('.saved-story')).toHaveCount(10);await expect(page.locator('#fetch-news')).toBeVisible();
});

test('saved editions render ten stories and satire, reopen by date, handle gaps and suppress stale responses',async({page})=>{
  execFileSync(process.execPath,[path.join(__dirname,'seed-fixtures.js'),dir]);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/news?date=2025-01-03');
  await expect(page.locator('#fetch-news')).toBeVisible();
  expect((await page.request.get(base+'/api/news/preview/2025-01-03')).status()).toBe(401);
  await expect(page.locator('.saved-story')).toHaveCount(10);
  await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-03');
  await expect(page.locator('.saved-satire')).toContainText('Satire');
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
  await expect(page.locator('.saved-story a').first()).toHaveAttribute('href','https://example.com/2025-01-03/1');
  const fetchRequest=page.waitForRequest(request=>request.url().endsWith('/api/news/fetch'));
  await page.getByRole('button',{name:'Open newspaper for 2025-01-03',exact:true}).click();
  expect((await fetchRequest).postDataJSON()).toEqual({date:'2025-01-03'});
  await expect(page.locator('#fetch-news')).toBeEnabled();
  await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-03');
  await expect(page.locator('#preview-heading')).toHaveText('Newspaper for 2025-01-03');
  await page.getByRole('button',{name:'Previous edition',exact:true}).click();
  await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-01');
  await expect(page.locator('#reader-status')).toContainText('Opened from saved editions');
  await page.reload();await expect(page.locator('.saved-story')).toHaveCount(10);await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-01');
  await page.getByLabel('Edition date').fill('2025-01-02');
  await expect(page.locator('#reader-status')).toHaveText('No saved newspaper for 2025-01-02.');
  await expect(page.locator('#fetch-news')).toBeEnabled();
  await expect(page.locator('#fetch-note')).toContainText('Historical coverage');
  await expect(page.locator('#fetch-preview')).toBeHidden();
  await expect(page.locator('.saved-story')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Print / Save PDF'})).toBeDisabled();
  await page.locator('#archive-list').getByRole('button',{name:'2025-01-03',exact:true}).click();await expect(page.locator('.saved-story')).toHaveCount(10);
  let release,started;const arrived=new Promise(resolve=>{started=resolve;});const blocked=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/news/editions/2025-01-01',async route=>{const response=await route.fetch();started();await blocked;await route.fulfill({response});});
  await page.getByRole('button',{name:'Previous edition',exact:true}).click();await arrived;
  await page.locator('#archive-list').getByRole('button',{name:'2025-01-03',exact:true}).click();await expect(page.locator('.saved-story h2').first()).toContainText('2025-01-03');
  release();await expect(page.getByLabel('Edition date')).toHaveValue('2025-01-03');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.getByLabel('Colour theme').selectOption('light');await page.screenshot({path:'test-results/news-archive-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.getByLabel('Colour theme').selectOption('dark');await page.screenshot({path:'test-results/news-archive-mobile.png',fullPage:true});
  await page.emulateMedia({media:'print'});await expect(page.locator('.saved-story')).toHaveCount(10);await expect(page.locator('#edition-navigation')).toBeHidden();
  expect(errors).toEqual([]);
});
