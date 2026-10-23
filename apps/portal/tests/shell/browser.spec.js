const {test,expect}=require('../../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeEach(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-shell-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m){base='http://127.0.0.1:'+m[1];resolve();}});child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});
});
test.afterEach(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('theme icons stay within their control and apart from account at every width',async({page})=>{
 const {setTheme}=require('../../../../tests/browser-theme');
 for(const route of ['/','/take-a-break','/decision-wheel','/satire-arena']){
  await page.goto(base+route);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const theme of ['light','dark']){
   await setTheme(page,theme);
   const layout=await page.locator('.platform-shell').evaluate(header=>{
    const toggle=header.querySelector('.theme-toggle'),box=toggle.getBoundingClientRect(),account=header.querySelector('.platform-account').getBoundingClientRect();
    return {gap:account.left-box.right,iconsFit:[...toggle.querySelectorAll('svg')].every(icon=>{const r=icon.getBoundingClientRect();return r.left>=box.left&&r.right<=box.right;}),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(layout.gap,route+' '+width+' '+theme).toBeGreaterThanOrEqual(10);expect(layout.iconsFit).toBe(true);expect(layout.overflow).toBe(false);
  }}
 }
 await page.setViewportSize({width:320,height:700});await page.goto(base+'/');await page.locator('.platform-shell').screenshot({path:'.publish/header-toggle-gap-mobile.png'});
});

test('branded transition follows native navigation and clears on return',async({page})=>{
 await page.goto(base+'/');const loader=page.locator('.platform-transition');await expect(loader).toBeHidden();
 await page.locator('.home-entry-explore').click();await expect(loader).toBeHidden();
 // Stop the default action after the document handler so the old-page cue is inspectable.
 await page.evaluate(()=>{window.holdTransition=event=>event.preventDefault();window.addEventListener('click',window.holdTransition);});
 await page.locator('a.public-app[href="/qr-maker"]').click();
 await expect(loader).toBeVisible();await expect(loader.locator('img')).toHaveAttribute('src','/logo-adaptive-192.png');
 await page.emulateMedia({reducedMotion:'reduce'});expect(await loader.locator('i').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await page.screenshot({path:'.publish/platform-transition.png'});
 await page.evaluate(()=>{window.removeEventListener('click',window.holdTransition);dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await expect(loader).toBeHidden();
 await page.locator('a.public-app[href="/qr-maker"]').click();await page.waitForURL(base+'/qr-maker');await expect(page.locator('.platform-transition')).toBeHidden();
 await page.goBack();await expect(page.locator('.platform-transition')).toBeHidden();
});

test('anonymous home retains its first render and shares only the initial auth request',async({page})=>{
 let calls=0,release;const gate=new Promise(resolve=>release=resolve);await page.route('**/api/auth/status',async route=>{calls++;await gate;await route.fulfill({json:{user:null,setupRequired:true,authMethod:'password',fullApps:true}});});await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>window.firstHome=document.querySelector('#free-apps'));await expect(page.locator('#free-apps')).toBeVisible();release();await expect(page.locator('.platform-account')).toHaveText('Sign in');await page.waitForFunction(()=>!!window.synapseInitialAuthStatus);await page.evaluate(()=>window.synapseInitialAuthStatus);expect(calls).toBe(1);expect(await page.evaluate(()=>window.firstHome===document.querySelector('#free-apps'))).toBe(true);await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect.poll(()=>calls).toBe(2);
});
test('account entry follows live sign-in, profile edits, navigation and sign-out',async({page})=>{
 const email='initials@example.com',password='Header initials password!';
 await page.goto(base+'/take-a-break');
 await expect(page.locator('.platform-account')).toHaveText('Sign in');
 await expect(page.locator('.platform-account')).toHaveAccessibleName('Sign in');
 await page.request.post(base+'/api/auth/setup',{data:{name:'Header Test',firmName:'Test',email,password}});
 await page.goto(base+'/take-a-break?game=code');
 await expect(page.locator('.platform-account')).toHaveText('HT');
 await expect(page.locator('.platform-account')).toHaveAccessibleName('My profile — Header Test');
 await page.locator('.platform-account').click();
 await expect(page.locator('#profile-form')).toBeVisible();
 await page.locator('#profile-form [name=name]').fill('Updated Name');
 await page.locator('#profile-form button[type=submit]').click();
 await expect(page.locator('.platform-account')).toHaveText('UN');
 await page.locator('[data-action=logout]').first().click();
 await expect(page.locator('.platform-account')).toHaveText('Sign in');
 await page.goto(base+'/signin');
 await page.locator('#auth-form [name=email]').fill(email);
 await page.locator('#auth-form [name=password]').fill(password);
 await page.locator('#auth-form button[type=submit]').click();
 await expect(page.locator('.platform-account')).toHaveText('UN');
 await page.request.post(base+'/api/auth/logout');
 await page.goto(base+'/news');await expect(page.locator('.platform-account')).toHaveText('Sign in');
});

test('account initials handle Unicode and auth outages without breaking public tools',async({page})=>{
 await page.route('**/api/auth/status',route=>route.fulfill({json:{user:{name:'किरण शर्मा'}}}));
 await page.goto(base+'/take-a-break?game=code');
 await expect(page.locator('.platform-account')).toHaveText('किश');
 await page.route('**/api/auth/status',route=>route.abort());
 await page.reload();await expect(page.locator('.platform-account')).toHaveText('Sign in');
 await expect(page.getByLabel('Your code guess')).toBeEnabled();
});

test('platform frame persists across public apps with usable mobile switching',async({page})=>{
 test.setTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const routes=['/','/signin','/moment-studio','/moment-studio/cards','/ritual-assist','/ritual-assist/calendar','/timetable-lite','/fund-overlap','/news','/satire-arena','/take-a-break','/daily-spark','/decision-wheel','/team-mixer','/support','/contact','/privacy','/terms','/legal/third-party-notices'];
 for(const route of routes){
  await page.goto(base+route,{waitUntil:'domcontentloaded'});await expect(page.locator('.platform-shell')).toHaveCount(1);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const theme of ['light','dark']){
    await page.evaluate(t=>window.SynapseTheme.write(t),theme);
    const shell=await page.locator('.platform-shell').boundingBox();expect(shell.y).toBe(0);expect(shell.height).toBe(72);await expect(page.locator('.platform-shell-brand>span')).toHaveText('Sushant SynapsePLATFORM');if(route==='/'||width>=760)await expect(page.locator('.platform-shell-brand>span')).toBeVisible();else await expect(page.locator('.platform-shell-brand>span')).toBeHidden();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} ${width} ${theme}`).toBe(true);
    for(const control of ['.platform-switch','.platform-account','.platform-shell .theme-toggle']){
     const r=await page.locator(control).boundingBox();expect(r.height).toBeGreaterThanOrEqual(44);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);
    }
   }
  }
 }
 await page.goto(base+'/');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();
 await page.goto(base+'/team-mixer');await page.setViewportSize({width:320,height:850});
 await page.locator('.platform-switch').click();await expect(page.getByRole('dialog',{name:'Switch app'})).toBeVisible();
 await page.locator('#platform-switcher input').fill('Chambers');await expect(page.locator('#platform-switcher nav a:visible')).toHaveCount(1);
 await expect(page.locator('#platform-switcher')).toContainText('Private workspaces require sign-in and assigned access.');
 await page.keyboard.press('Escape');await expect(page.locator('.platform-switch')).toBeFocused();
 await page.locator('.platform-switch').click();await page.locator('#platform-switcher input').fill('nothingmatches');await expect(page.locator('.platform-switcher-empty')).toBeVisible();
 await page.locator('#platform-switcher input').fill('Moment');await page.locator('#platform-switcher nav a:visible').click();await expect(page).toHaveURL(base+'/moment-studio');
 await page.locator('.platform-switch').click();await page.locator('.platform-switcher-home').click();await expect(page).toHaveURL(base+'/');
 await page.emulateMedia({media:'print'});await expect(page.locator('.platform-shell')).toBeHidden();await page.emulateMedia({media:'screen'});
 expect(errors).toEqual([]);
});

test('home, account, Chambers and switching retain the frame after authentication',async({page})=>{
 const setup=await page.request.post(base+'/api/auth/setup',{data:{name:'Shell Owner',firmName:'Test Chambers',email:'shell@example.com',password:'Platform shell password!'}});expect(setup.ok()).toBe(true);
 await page.goto(base+'/');await expect(page.locator('.public-home #free-apps')).toBeVisible();await expect(page.locator('#catalogue-account')).toBeVisible();
 await page.locator('.platform-switch').click();await page.locator('#platform-switcher input').fill('Chambers');await page.locator('#platform-switcher nav a:visible').click();
 await expect(page.getByRole('heading',{name:'Chambers overview',exact:true})).toBeVisible();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const theme of ['light','dark']){
   await page.evaluate(t=>window.SynapseTheme.write(t),theme);await expect(page.locator('.platform-shell')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(width>=1000){const sidebar=await page.locator('.sidebar').boundingBox();expect(sidebar.y).toBe(72);expect((await page.locator('[data-synapse-beta]').boundingBox()).x).toBeGreaterThanOrEqual(240);}
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/shell-chambers-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:850});await page.screenshot({path:'test-results/shell-chambers-mobile.png',fullPage:true});
 await page.locator('.platform-account').click();await expect(page.locator('#profile-form')).toBeVisible();await expect(page.locator('.platform-shell')).toBeVisible();
 await page.locator('.platform-shell-brand').click();await expect(page.locator('.public-home #free-apps')).toBeVisible();
 await page.goto(base+'/batchfee-lite');await page.setViewportSize({width:768,height:900});
 expect(await page.locator('body>aside').evaluate(el=>getComputedStyle(el).position)).toBe('static');
 await page.setViewportSize({width:1440,height:900});expect((await page.locator('body>aside').boundingBox()).y).toBe(72);
 expect((await page.locator('[data-synapse-beta]').boundingBox()).x).toBeGreaterThanOrEqual(240);
 await page.goto(base+'/digital-samaj');await page.getByLabel('Samaj name',{exact:true}).fill('Shell Test Samaj');await page.getByRole('button',{name:'Create Samaj',exact:true}).click();
 await page.getByRole('button',{name:'Shell Test Samaj',exact:true}).click();
 await expect(page.locator('#app>.nav')).toBeVisible();expect((await page.locator('#app>.nav').boundingBox()).y).toBe(72);
 expect((await page.locator('[data-synapse-beta]').boundingBox()).x).toBeGreaterThanOrEqual(240);
 await page.setViewportSize({width:768,height:900});expect(await page.locator('#app>.nav').evaluate(el=>getComputedStyle(el).position)).toBe('static');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.request.post(base+'/api/auth/logout');await page.goto(base+'/');
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>SynapseTheme.write('light'));await page.screenshot({path:'test-results/shell-home-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:850});await page.screenshot({path:'test-results/shell-home-mobile.png',fullPage:true});
});

test('Studio starts with the platform theme and system preferences follow the device',async({browser})=>{
 const context=await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser);try{
  const page=await context.newPage();await page.goto(base+'/moment-studio/cards');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.evaluate(()=>SynapseTheme.write('system'));await page.emulateMedia({colorScheme:'dark'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.goto(base+'/moment-studio');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.goto(base+'/moment-studio/cards');await page.locator('[name=title]').fill('Keep this draft');
  let warning='';page.once('dialog',async dialog=>{warning=dialog.message();await dialog.dismiss();});
  await page.locator('.platform-switch').click();await page.locator('#platform-switcher input').fill('Chambers');await page.locator('#platform-switcher nav a:visible').click();
  expect(warning).toContain('unfinished card');await expect(page).toHaveURL(base+'/moment-studio/cards');await expect(page.locator('[name=title]')).toHaveValue('Keep this draft');
 }finally{await context.close();}
});
