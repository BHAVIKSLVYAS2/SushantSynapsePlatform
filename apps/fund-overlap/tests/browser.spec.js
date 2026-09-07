const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-lens-browser-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,NODE_ENV:'test',SETUP_TOKEN:''},stdio:['ignore','pipe','pipe']});
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
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('not in library');await expect(page.getByText('No supported funds match.',{exact:false})).toBeVisible();
 await page.getByRole('searchbox',{name:'Search funds',exact:true}).fill('');
 expect(requests.filter(r=>r.url.includes('/api/fund-overlap/holdings/'))).toHaveLength(0);
 await page.getByRole('button',{name:'Explore a comparison'}).click();
 await expect(page.getByRole('heading',{name:'Your funds, under the lens.'})).toBeVisible();
 await expect(page.locator('.pair')).toHaveCount(3);await expect(page.locator('.matrix tbody tr')).toHaveCount(3);
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

test('invalid share links, missing snapshot retry and selection changes clear obsolete results',async({page})=>{
 if((await (await page.request.get(base+'/api/auth/status')).json()).setupRequired)await page.request.post(base+'/api/auth/setup',{data:{name:'Lens owner',email:'owner@lens.test',password:'Browser test password 2026!',firmName:'Test'}});
 await page.request.post(base+'/api/auth/login',{data:{email:'owner@lens.test',password:'Browser test password 2026!'}});
 await page.goto(base+'/fund-overlap#funds=unknown,ppfas-elss');await expect(page.locator('#notice')).toContainText('unavailable');
 await page.route('**/api/fund-overlap/holdings/**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Disclosure temporarily unavailable"}'}));
 await page.getByRole('button',{name:'Explore a comparison'}).click();await expect(page.locator('#load-error')).toContainText('temporarily unavailable');await expect(page.locator('.selected')).toHaveCount(3);
 await page.unroute('**/api/fund-overlap/holdings/**');await page.getByRole('button',{name:'Compare funds →'}).click();await expect(page.locator('.pair')).toHaveCount(3);
 await page.getByRole('button',{name:'Remove Parag Parikh ELSS Tax Saver Fund'}).click();await expect(page.locator('#results')).toBeEmpty();await expect(page.locator('#selection-count')).toContainText('2 of 8');
});
