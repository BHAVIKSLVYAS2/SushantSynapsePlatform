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

test('sponsorship invitation is quiet, dismissible and absent from sensitive apps',async({page,browser})=>{
 await page.setViewportSize({width:320,height:700});await page.goto(base);await expect(page.locator('[data-sponsor-slot=home]')).toBeVisible();await expect(page.locator('.synapse-sponsor-link')).toHaveAttribute('href','/sponsor');await expect(page.locator('.synapse-sponsor')).toHaveCount(1);
 expect(await page.locator('.synapse-sponsor').evaluate(el=>getComputedStyle(el).position)).toBe('static');await page.getByRole('button',{name:'Hide for this visit'}).click();await expect(page.locator('[data-sponsor-slot=home]')).toBeHidden();await page.reload();await expect(page.locator('[data-sponsor-slot=home]')).toBeHidden();
 for(const route of ['/team-mixer','/decision-wheel','/daily-spark','/timetable-lite','/news']){await page.goto(base+route);await expect(page.locator('[data-sponsor-slot]')).toBeHidden();}
 for(const route of ['/pocket-pause','/fund-overlap','/moment-studio','/moment-studio/certificates','/signin']){await page.goto(base+route);await expect(page.locator('[data-sponsor-slot]')).toHaveCount(0);}
 const context=await browser.newContext({javaScriptEnabled:false});try{const fallback=await context.newPage();await fallback.goto(base);await expect(fallback.getByRole('link',{name:'Explore sponsorship'})).toBeVisible();await fallback.goto(base+'/sponsor');await expect(fallback.getByRole('heading',{name:/Sponsor a little/})).toBeVisible();await expect(fallback.locator('#sponsor-enquiry-form')).toBeHidden();}finally{await context.close();}
});
test('reviewed sponsor cards use safe links and stay outside workflows and printouts',async({page})=>{
 const errors=[],outside=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base)outside.push(r.url());});
 const config={enabled:true,contact:null,campaigns:[{id:'browser-test',approved:true,sponsor:'Reviewed example',title:'<img src=x onerror=alert(1)>',description:'A reviewed text message.',url:'https://example.com/offer',pages:['home','teams','wheel','spark','timetable','news'],startsAt:'2020-01-01T00:00:00Z',endsAt:'2100-01-01T00:00:00Z'}]};
 await page.route('**/sponsor-config.mjs',route=>route.fulfill({contentType:'text/javascript',body:'export const sponsorConfig='+JSON.stringify(config)}));
 for(const route of ['/','/team-mixer','/decision-wheel','/daily-spark','/timetable-lite','/news']){
  await page.setViewportSize({width:320,height:700});await page.goto(base+route);await setTheme(page,'dark');const ad=page.locator('[data-sponsor-slot]');await expect(ad).toBeVisible();await expect(ad).toHaveCount(1);await expect(ad.locator('.synapse-sponsor-label')).toContainText('Advertisement');await expect(ad.locator('img,iframe')).toHaveCount(0);await expect(ad.locator('h2')).toHaveText(config.campaigns[0].title);await expect(ad.locator('a')).toHaveAttribute('rel','sponsored nofollow noopener noreferrer');await expect(ad.locator('a')).toHaveAttribute('target','_blank');
  expect(await ad.evaluate(el=>!el.closest('form,.workspace,.game,#saved-reader,#print-area'))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.emulateMedia({media:'print'});await expect(ad).toBeHidden();await page.emulateMedia({media:'screen'});
 }
 await page.goto(base+'/team-mixer');await page.locator('#mix').click();await expect(page.locator('#exports')).toBeVisible();await expect(page.locator('[data-sponsor-slot]')).toHaveCount(1);await page.locator('[data-sponsor-slot]').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/sponsor-mobile-dark.png'});await page.setViewportSize({width:1440,height:900});await setTheme(page,'light');await page.locator('[data-sponsor-slot]').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/sponsor-desktop-light.png'});
 expect(outside).toEqual([]);expect(errors).toEqual([]);
});
test('sponsorship enquiry downloads a local draft without submitting or storing it',async({page})=>{
 const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});await page.goto(base+'/sponsor');await expect(page.locator('#contact-status')).toContainText('being configured');await page.setViewportSize({width:320,height:700});await setTheme(page,'dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const kit=page.waitForEvent('download');await page.getByRole('button',{name:'Download sponsorship brief'}).click();expect((await kit).suggestedFilename()).toBe('sushant-synapse-sponsorship-brief.txt');
 await page.getByLabel('Your business name').fill('Example business');await page.getByLabel('Contact email').fill('business@example.com');await page.getByLabel('Website',{exact:true}).fill('http://example.com');await page.getByLabel('Message, preferred dates and budget').fill('A reviewed education offer.');await page.getByRole('button',{name:'Download enquiry draft'}).click();await expect(page.locator('#enquiry-status')).toContainText('HTTPS');await page.getByLabel('Website',{exact:true}).fill('https://example.com');const enquiry=page.waitForEvent('download');await page.getByRole('button',{name:'Download enquiry draft'}).click();const result=await enquiry;await result.saveAs(path.join(dir,'enquiry.txt'));expect(fs.readFileSync(path.join(dir,'enquiry.txt'),'utf8')).toContain('Example business');await expect(page.locator('#enquiry-status')).toContainText('Nothing has been sent');await expect(page.locator('#sponsor-email')).toBeHidden();
 await page.reload();await expect(page.getByLabel('Your business name')).toHaveValue('');expect(writes).toEqual([]);
 await page.route('**/sponsor-config.mjs',route=>route.fulfill({contentType:'text/javascript',body:'export const sponsorConfig={enabled:true,contact:{type:"email",value:"sponsor@example.com"},campaigns:[]}'}));await page.reload();await expect(page.locator('#contact-status')).toContainText('sponsor@example.com');
});
test('app finder stays usable across small screens, themes and empty results',async({page})=>{
 await page.goto(base);await expect(page.locator('#app-finder-trigger')).toBeVisible();
 for(const [width,height,theme] of [[320,568,'light'],[390,844,'dark'],[1440,900,'light']]){
  await page.setViewportSize({width,height});await setTheme(page,theme);await page.evaluate(()=>scrollTo(0,500));const position=await page.evaluate(()=>scrollY);
  await page.getByRole('button',{name:'Search apps',exact:true}).click();await expect(page.getByLabel('Search apps or activities')).toBeFocused();await expect(page.locator('.finder-result')).toHaveCount(7);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bounds=await page.locator('#app-finder-dialog').boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height+1);
  await page.getByLabel('Search apps or activities').fill('not-a-real-tool');await expect(page.locator('#finder-count')).toContainText('No matching apps');await expect(page.getByRole('button',{name:'Clear search',exact:true})).toBeVisible();await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await page.getByLabel('Search apps or activities').fill('condolence');await expect(page.locator('.finder-result')).toHaveCount(1);await expect(page.locator('.finder-result')).toContainText('Moment Studio');await page.getByLabel('Search apps or activities').fill('');
  await page.screenshot({path:`test-results/app-finder-${width}-${theme}.png`});await page.keyboard.press('Escape');await expect(page.locator('#app-finder-dialog')).not.toBeVisible();expect(await page.evaluate(()=>scrollY)).toBe(position);await expect(page.locator('#app-finder-trigger')).toBeFocused();
 }
 await page.locator('#app-finder-trigger').click();await page.getByLabel('Search apps or activities').fill('quilt');await page.locator('.finder-result').click();await expect(page).toHaveURL(base+'/take-a-break');
 await page.goto(base+'/signin');await expect(page.locator('#auth-form')).toBeVisible();await expect(page.locator('#app-finder-trigger')).toHaveCount(0);
});
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
 await page.getByRole('button',{name:'Search apps',exact:true}).click();await page.getByLabel('Search apps or activities').fill('Chambers');await expect(page.locator('.finder-result')).toHaveCount(1);await expect(page.locator('.finder-result')).toContainText('Chambers');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Search apps',exact:true})).toBeFocused();
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
 expect(await page.locator('#free-apps .public-app').evaluateAll(links=>links.map(a=>a.getAttribute('href')).sort())).toEqual(apps.filter(a=>a.public&&a.status==='Available'&&!a.catalogueParent).map(a=>a.path).sort());
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
