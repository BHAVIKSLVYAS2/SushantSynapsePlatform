const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');

test('theme toggle supports keyboard, system default, cross-tab sharing and blocked storage',async({browser})=>{
 const context=await browser.newContext({colorScheme:'dark'});
 try{
  const page=await context.newPage(),other=await context.newPage();
  await page.goto(base+'/certificates');await other.goto(base+'/news');
  const toggle=page.getByRole('button',{name:'Dark mode',exact:true});await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('select#theme')).toHaveCount(0);await toggle.focus();await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed','false');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(other.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();await expect(toggle).toHaveAttribute('aria-pressed','false');await page.goto(base+'/timetable-lite');await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(other.locator('html')).toHaveAttribute('data-theme','dark');
 }finally{await context.close();}
 const blocked=await browser.newContext();try{
  await blocked.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new Error('Storage blocked');};});
  const page=await blocked.newPage();await page.goto(base+'/certificates');const toggle=page.getByRole('button',{name:'Dark mode',exact:true});await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','true');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 }finally{await blocked.close();}
});
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-browser-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m){base='http://127.0.0.1:'+m[1];resolve();}});child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});});
test.afterAll(async()=>{if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});fs.rmSync(dir,{recursive:true,force:true});});

test('homepage ships real cards without JavaScript and ignores obsolete login query',async({browser,page})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 try{const fallback=await context.newPage();const response=await fallback.goto(base);expect(response.headers()['cache-control']).toBe('no-store');await expect(fallback.locator('.public-app')).toHaveCount(7);await expect(fallback.getByRole('link',{name:'Fund Lens',exact:true})).toBeVisible();await expect(fallback.getByRole('link',{name:'Open News'})).toBeVisible();await expect(fallback.getByRole('link',{name:'Sign in to Tournament Lite'})).toBeVisible();}finally{await context.close();}
 await page.goto(base+'/?signin=1');await expect(page.locator('.public-app')).toHaveCount(7);await expect(page.locator('#auth-form')).toHaveCount(0);await page.getByRole('link',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(base+'/signin');await expect(page.locator('#auth-form')).toBeVisible();
});
test('platform setup, favourites, app launch with shared sign-in, team access and responsive themes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.goto(base);
 await expect(page.locator('#auth-form')).toHaveCount(0);await expect(page.getByRole('link',{name:'Fund Lens',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Open News'})).toBeVisible();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'Sign in',exact:true}).click();
 await page.getByLabel('Your name',{exact:true}).fill('Sushant Owner');await page.getByLabel('Workspace name',{exact:true}).fill('Synapse Chambers');await page.getByLabel('Email address').fill('owner@synapse.example');await page.getByLabel('Password',{exact:true}).fill('Platform browser password!');await page.getByRole('button',{name:'Create platform'}).click();
 await expect(page.getByRole('heading',{name:'Welcome, Sushant.'})).toBeVisible();await expect(page.getByRole('button',{name:'Open Chambers'})).toBeVisible();await expect(page.getByText('Planned',{exact:true})).toHaveCount(3);
 await page.getByRole('searchbox',{name:'Search apps'}).fill('Chambers');await expect(page.locator('.app-card')).toHaveCount(1);await page.getByRole('searchbox',{name:'Search apps'}).fill('');
 await page.getByRole('button',{name:'Add Chambers to favourites'}).click();await page.getByRole('navigation',{name:'Mobile platform navigation'}).getByRole('button',{name:'Favourites',exact:true}).click();await expect(page.locator('.app-card')).toHaveCount(1);
 await page.getByRole('button',{name:'Open Chambers'}).click();await expect(page).toHaveURL(base+'/advocate');await expect(page.getByRole('heading',{name:'A clear view. A better day.'})).toBeVisible();
 await page.getByRole('link',{name:'Back to Sushant Synapse apps'}).click();await page.getByRole('navigation',{name:'Mobile platform navigation'}).getByRole('button',{name:'Recent',exact:true}).click();await expect(page.getByRole('heading',{name:'Chambers',exact:true})).toBeVisible();
 await page.getByRole('navigation',{name:'Mobile platform navigation'}).getByRole('button',{name:'All apps',exact:true}).click();await setTheme(page,'dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'test-results/platform-mobile-dark.png',fullPage:true});
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await setTheme(page,'light');await page.screenshot({path:'test-results/platform-desktop-light.png',fullPage:true});
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Team access'}).click();await page.getByRole('button',{name:'Add member'}).click();await page.getByLabel('Name',{exact:true}).fill('Member One');await page.getByLabel('Email',{exact:true}).fill('member@synapse.example');await page.getByLabel('Initial password').fill('Member browser password!');await page.getByRole('button',{name:'Save member'}).click();await expect(page.getByText('Member One',{exact:true})).toBeVisible();
 const row=page.locator('.team-row').filter({hasText:'Member One'});await row.getByRole('checkbox',{name:'Chambers'}).uncheck();await expect(row.getByRole('checkbox',{name:'Chambers'})).not.toBeChecked();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('#auth-form')).toHaveCount(0);await page.getByRole('link',{name:'Sign in',exact:true}).click();await page.getByLabel('Email address').fill('member@synapse.example');await page.getByLabel('Password',{exact:true}).fill('Member browser password!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByText('Access required',{exact:true})).toHaveCount(4);await expect(page.getByRole('button',{name:'Open Fund Lens'})).toBeVisible();await expect(page.getByRole('button',{name:'Open Sushant Synapse Times'})).toBeVisible();await expect(page.getByRole('button',{name:'Open Chambers'})).toHaveCount(0);expect((await page.request.get(base+'/api/state')).status()).toBe(403);
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'My profile',exact:true}).click();await page.locator('#profile-form').getByLabel('Name',{exact:true}).fill('Updated Member');await page.getByRole('button',{name:'Save profile'}).click();await expect(page.locator('#profile-form input[name="name"]')).toHaveValue('Updated Member');expect(errors).toEqual([]);
});
test('public tools and private destinations stay distinct through sign-in',async({page})=>{
 await page.goto(base);
 await expect(page.locator('#free-apps .public-app')).toHaveCount(7);
 await expect(page.locator('#workspace-apps .workspace-card')).toHaveCount(4);
 await expect(page.locator('#free-apps a[href*="tournament"]')).toHaveCount(0);
 const {apps}=require('../../../packages/app-registry');
 expect(await page.locator('#free-apps .public-app').evaluateAll(links=>links.map(a=>a.getAttribute('href')).sort())).toEqual(apps.filter(a=>a.public&&a.status==='Available').map(a=>a.path).sort());
 for(const [width,theme] of [[390,'dark'],[1440,'light']]){
  await page.setViewportSize({width,height:1000});
  await setTheme(page,theme);
  await page.screenshot({path:'test-results/public-home-'+theme+'.png',fullPage:true});
 }
 for(const app of ['advocate','tournament-lite','batchfee-lite','digital-samaj']){
  await page.goto(base+'/signin?next='+app);
  await expect(page.locator('#auth-form')).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Public apps'}).locator('.auth-public-links a')).toHaveCount(7);
  for(const theme of ['light','dark','system']){
   await setTheme(page,theme);
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   }
  }
  await page.screenshot({path:'test-results/signin-'+app+'.png',fullPage:true});
  await page.getByLabel('Email address').fill('owner@synapse.example');
  await page.getByLabel('Password',{exact:true}).fill('Platform browser password!');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(base+'/'+app);
  await page.goto(base+'/signin?next='+app);
  await expect(page).toHaveURL(base+'/'+app);
  await page.request.post(base+'/api/auth/logout');
 }
 await page.goto(base+'/signin?next=https://example.com');
 await page.getByLabel('Email address').fill('owner@synapse.example');
 await page.getByLabel('Password',{exact:true}).fill('Platform browser password!');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(base+'/');
});
