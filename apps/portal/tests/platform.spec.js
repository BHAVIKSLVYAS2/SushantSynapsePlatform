const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');
const {noAdsContext}=require('../../../tests/browser-ads');
// Never generate real advertising traffic from disposable test accounts.
test.beforeEach(async({context})=>{await context.route('https://pagead2.googlesyndication.com/**',r=>r.fulfill({contentType:'text/javascript',body:''}));});

test('hub search combines categories, clears empty results and keeps mobile destinations usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/');const search=page.getByRole('searchbox',{name:'Search web apps'});
 await search.fill('QR');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(1);await expect(page.locator('.public-app:not([hidden])')).toHaveAttribute('href','/qr-maker');await expect(page.locator('.home-featured')).toBeHidden();
 await page.locator('[data-tool-filter=games]').click();await expect(page.locator('.public-app:not([hidden])')).toHaveCount(0);await expect(page.locator('.home-search-empty')).toBeVisible();await page.getByRole('button',{name:'Clear app search'}).click();await expect(search).toBeFocused();await expect(page.locator('.public-app:not([hidden])')).toHaveCount(5);
 await page.locator('[data-tool-filter=all]').click();await expect(page.locator('.public-app:not([hidden])')).toHaveCount(14);await expect(page.locator('.home-featured')).toBeVisible();expect(await page.locator('.home-feature-card').evaluateAll(cards=>cards.map(c=>c.getAttribute('href')))).toEqual(['/moment-studio','/take-a-break']);await expect(page.locator('.home-entry-workspace')).toHaveAttribute('href','/signin');
 for(const width of [320,360,375,390,412,430,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await setTheme(page,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+theme).toBe(true);expect(await page.locator('.home-search input').evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);}
 await page.setViewportSize({width:390,height:900});await page.locator('[data-home-games]').click();await expect(page.locator('[data-tool-filter=games]')).toHaveAttribute('aria-pressed','true');await page.locator('.home-mobile-dock a').nth(1).click();await expect(page.locator('.public-app:not([hidden])')).toHaveCount(14);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/home-hub-mobile-dark.png'});await page.locator('#free-apps').screenshot({path:'test-results/home-hub-catalogue-dark.png'});await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/home-hub-desktop-dark.png'});expect(errors).toEqual([]);
});
test('AdSense loads asynchronously only for an anonymous home and retains tool navigation',async({page,context})=>{
 const requests=[],violations=[];page.on('request',r=>{if(r.url().includes('adsbygoogle.js'))requests.push(r.url());});
 await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.effectiveDirective));});
 const response=await page.goto(base+'/');await expect(page.locator('head script[src*="adsbygoogle.js"]')).toHaveCount(1);
 const ad=page.locator('head script[src*="adsbygoogle.js"]');await expect(ad).toHaveAttribute('async','');await expect(ad).toHaveAttribute('crossorigin','anonymous');
 const nonce=await ad.evaluate(e=>e.nonce);expect(response.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
 await page.getByRole('button',{name:'Search apps',exact:true}).click();await page.getByLabel('Search apps or activities').fill('teams');await expect(page.locator('.finder-result')).toHaveCount(1);
 violations.push(...await page.evaluate(()=>window.cspViolations));
 for(const route of ['/signin','/team-mixer','/ritual-assist/calendar','/privacy']){await page.goto(base+route);await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);}
 await context.addCookies([{name:'chambers_session',value:'invalid-test-session',url:base}]);await page.goto(base+'/');await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
 expect(requests).toHaveLength(1);expect(violations).toEqual([]);
 const txt=await page.request.get(base+'/ads.txt');expect(txt.headers()['content-type']).toContain('text/plain');expect(await txt.text()).toContain('pub-1894051755496526');
});

test('glossy hub keeps direct apps, shared navigation and a no-JavaScript catalogue',async({page,browser})=>{
 await page.goto(base+'/');await expect(page.locator('.home-welcome')).toHaveCount(0);await expect(page.locator('.home-features')).toHaveCount(0);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:844});await setTheme(page,theme);await page.evaluate(()=>scrollTo(0,0));expect((await page.locator('#free-apps .public-app').first().boundingBox()).y).toBeLessThan(1250);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('.public-apps').evaluate(e=>getComputedStyle(e).overflowY)).toBe('visible');}
 await page.locator('.platform-switch').click();await expect(page.locator('#platform-switcher a[href="/take-a-break?game=24"]')).toBeVisible();await page.locator('#platform-switcher input').fill('chance');await expect(page.locator('#platform-switcher a:not([hidden])')).toHaveCount(1);await page.locator('#platform-switcher input').fill('');await page.keyboard.press('Escape');await expect(page.locator('.platform-switch')).toBeFocused();
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/home-apps-first-mobile.png'});
 const context=await noAdsContext(browser,{javaScriptEnabled:false});try{const p=await context.newPage();await p.setViewportSize({width:390,height:844});await p.goto(base+'/');await expect(p.locator('.home-welcome')).toHaveCount(0);expect(await p.locator('.public-app').evaluateAll(cards=>cards.slice(0,3).map(c=>c.getAttribute('href')))).toEqual(['/fund-overlap','/decision-wheel','/ritual-assist']);await expect(p.locator('.home-features')).toHaveCount(0);await expect(p.locator('.public-app')).toHaveCount(14);expect((await p.locator('.public-app').first().boundingBox()).y).toBeLessThan(1250);}finally{await context.close();}
});

test('home categories filter without nested scrolling and phone swipes move the page',async({page,browser})=>{
 await page.goto(base+'/');for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});for(const [key,count]of [['utility',4],['games',5],['planning',4],['media',2],['all',14]]){const pill=page.locator('[data-tool-filter="'+key+'"]');await pill.click();await expect(pill).toHaveAttribute('aria-pressed','true');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(count);expect(await page.locator('.public-apps').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 const context=await noAdsContext(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});try{const p=await context.newPage();await p.goto(base+'/');const cdp=await context.newCDPSession(p);for(const target of ['.public-apps','.home-filters']){await p.evaluate(()=>scrollTo(0,0));const box=await p.locator(target).boundingBox(),x=box.x+Math.min(box.width/2,180),y=Math.min(box.y+40,650);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let step=1;step<=8;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*15}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>p.evaluate(()=>scrollY)).toBeGreaterThan(0);expect(await p.locator('.public-apps').evaluate(e=>e.scrollTop)).toBe(0);}}finally{await context.close();}
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/home-apps-first-desktop.png'});
});

test('premium bento keeps all tools discoverable across touch layouts and both themes',async({page})=>{
 test.setTimeout(120000); // This cross-app regression opens seventeen destinations after the layout matrix.
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const theme of ['light','dark']){
   await setTheme(page,theme);
   expect(await page.locator('.public-app').first().evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px ${theme}`).toBe(true);
   expect(await page.locator('#free-apps .public-app').evaluateAll(links=>links.map(a=>({path:a.getAttribute('href'),box:a.getBoundingClientRect()})).sort((a,b)=>Math.abs(a.box.top-b.box.top)>2?a.box.top-b.box.top:a.box.left-b.box.left).slice(0,4).map(a=>a.path))).toEqual(['/fund-overlap','/decision-wheel','/ritual-assist','/confessions']);
   const columns=await page.locator('.public-apps').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
   expect(columns).toBe(width>1000?3:width>=360?2:1);
   await expect(page.locator('.platform-shell')).toBeVisible();
   await expect(page.locator('#free-apps .access-heading #app-finder-trigger')).toBeVisible();
   await expect(page.locator('.public-app .home-sculpture')).toHaveCount(13);
   for(const href of ['/timetable-lite','/ritual-assist','/team-mixer']){
    const tile=page.locator(`.public-app[href="${href}"]`);
    await expect(tile).toBeVisible();expect(await tile.evaluate(el=>getComputedStyle(el).gridColumnStart)).toBe('auto');
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});await setTheme(page,'light');await page.screenshot({path:'test-results/premium-home-desktop.png',fullPage:true});
 await setTheme(page,'dark');await page.screenshot({path:'test-results/mint-home-desktop-dark.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await setTheme(page,'dark');await page.screenshot({path:'test-results/premium-home-mobile-dark.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.home-welcome')).toHaveCount(0);
 for(const route of ['/timetable-lite','/ritual-assist','/ritual-assist/calendar','/team-mixer','/decision-wheel','/moment-studio','/moment-studio/certificates','/take-a-break','/pocket-pause','/daily-spark','/news','/fund-overlap','/advocate','/digital-samaj','/batchfee-lite','/tournament-lite','/satire-arena']){
  await page.goto(base+route);await expect(page.locator('link[href*="/shared/premium.css"],link[href*="/home.bundle.css"]')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Dark mode',exact:true})).toBeVisible();
  await expect(page.locator('html'),route).toHaveAttribute('data-theme','dark');
  // App-owned dark palettes may differ while retaining a readable dark canvas.
  await expect.poll(async()=>page.locator('body').evaluate(el=>{
   const channels=getComputedStyle(el).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number);
   return Math.max(...channels);
  }),{message:route+' dark canvas'}).toBeLessThan(64);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route).toBe(true);
 }
 expect(errors).toEqual([]);
});

test('legal information works without JavaScript, has real notices and fits mobile themes',async({browser,page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/privacy','/terms','/contact','/legal','/legal/third-party-notices']){const response=await page.goto(base+route);expect(response.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.synapse-legal-footer')).toBeVisible();for(const width of [320,1440]){await page.setViewportSize({width,height:900});for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}}
 await page.goto(base+'/legal/third-party-notices');await expect(page.locator('article')).toContainText('Copyright (c) 2012 Ryan Day');await expect(page.locator('article')).toContainText('Wyatt Baldwin');await expect(page.locator('article')).toContainText('Don Cross');
 const context=await noAdsContext(browser,{javaScriptEnabled:false});try{const nojs=await context.newPage();for(const route of ['/','/signin','/ritual-assist','/moment-studio','/advocate','/digital-samaj','/news','/support','/privacy']){await nojs.goto(base+route);await expect(nojs.locator('.synapse-legal-footer a[href="/privacy"]')).toBeVisible();await expect(nojs.locator('.synapse-legal-footer a[href="/contact"]')).toBeVisible();}}finally{await context.close();}
 for(const route of ['/','/signin','/advocate','/digital-samaj','/batchfee-lite','/tournament-lite','/fund-overlap','/news','/ritual-assist','/ritual-assist/calendar','/moment-studio','/moment-studio/certificates','/timetable-lite','/take-a-break','/pocket-pause','/daily-spark','/decision-wheel','/team-mixer','/support','/sponsor']){await page.setViewportSize({width:320,height:850});await page.goto(base+route);await expect(page.locator('.synapse-legal-footer')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto(base+'/showcase?screen=1');await expect(page.locator('.synapse-legal-footer')).toBeHidden();expect(errors).toEqual([]);
});

test('theme toggle supports light default, saved system preference, keyboard, cross-tab sharing and blocked storage',async({browser})=>{
 const context=await noAdsContext(browser,{colorScheme:'dark'});
 try{
  const page=await context.newPage(),other=await context.newPage();
  await page.goto(base+'/');await other.goto(base+'/news');
  const toggle=page.getByRole('button',{name:'Dark mode',exact:true});await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await setTheme(page,'system');await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('select#theme')).toHaveCount(0);await toggle.focus();await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed','false');await expect(page.locator('html')).toHaveAttribute('data-theme','light');await expect(other.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();await expect(toggle).toHaveAttribute('aria-pressed','false');await page.goto(base+'/timetable-lite');await expect(page.locator('body')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(other.locator('html')).toHaveAttribute('data-theme','dark');
 }finally{await context.close();}
 const blocked=await noAdsContext(browser,);try{
  await blocked.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new Error('Storage blocked');};});
  const page=await blocked.newPage();await page.goto(base+'/');const toggle=page.getByRole('button',{name:'Dark mode',exact:true});await toggle.click();await expect(toggle).toHaveAttribute('aria-pressed','true');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
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
 const context=await noAdsContext(browser,{javaScriptEnabled:false});try{const fallback=await context.newPage();await fallback.goto(base);await expect(fallback.getByRole('link',{name:'Explore sponsorship'})).toBeVisible();await fallback.goto(base+'/sponsor');await expect(fallback.getByRole('heading',{name:/Sponsor a little/})).toBeVisible();await expect(fallback.locator('#sponsor-enquiry-form')).toBeHidden();}finally{await context.close();}
});
test('reviewed sponsor cards use safe links and stay outside workflows and printouts',async({page})=>{
 const errors=[],outside=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base&&!r.url().startsWith('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1894051755496526'))outside.push(r.url());});
 const config={enabled:true,contact:null,campaigns:[{id:'browser-test',approved:true,sponsor:'Reviewed example',title:'<img src=x onerror=alert(1)>',description:'A reviewed text message.',url:'https://example.com/offer',pages:['home','teams','wheel','spark','timetable','news'],startsAt:'2020-01-01T00:00:00Z',endsAt:'2100-01-01T00:00:00Z'}]};
 await page.route('**/sponsor-config.mjs',route=>route.fulfill({contentType:'text/javascript',body:'export const sponsorConfig='+JSON.stringify(config)}));
 for(const route of ['/','/team-mixer','/decision-wheel','/daily-spark','/timetable-lite','/news']){
  await page.setViewportSize({width:320,height:700});await page.goto(base+route);await setTheme(page,'dark');const ad=page.locator('[data-sponsor-slot]');await expect(ad).toBeVisible();await expect(ad).toHaveCount(1);await expect(ad.locator('.synapse-sponsor-label')).toContainText('Advertisement');await expect(ad.locator('img,iframe')).toHaveCount(0);await expect(ad.locator('h2')).toHaveText(config.campaigns[0].title);await expect(ad.locator('a')).toHaveAttribute('rel','sponsored nofollow noopener noreferrer');await expect(ad.locator('a')).toHaveAttribute('target','_blank');
  expect(await ad.evaluate(el=>!el.closest('form,.workspace,.game,#saved-reader,#print-area'))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.emulateMedia({media:'print'});await expect(ad).toBeHidden();await page.emulateMedia({media:'screen'});
 }
 await page.goto(base+'/team-mixer');await page.locator('#mix').click();await expect(page.locator('#exports')).toBeVisible();await expect(page.locator('[data-sponsor-slot]')).toHaveCount(1);await page.locator('[data-sponsor-slot]').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/sponsor-mobile-dark.png'});await page.setViewportSize({width:1440,height:900});await setTheme(page,'light');await page.locator('[data-sponsor-slot]').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/sponsor-desktop-light.png'});
 expect(outside).toEqual([]);expect(errors).toEqual([]);
});
test('sponsorship enquiry prepares WhatsApp details without platform writes or downloads',async({page,context})=>{
 await context.route('https://wa.me/**',r=>r.fulfill({contentType:'text/html',body:'Draft intercepted; not sent'}));const writes=[];page.on('request',r=>{if(r.url().startsWith(base)&&!r.url().endsWith('/api/platform/visitors')&&!['GET','HEAD'].includes(r.method()))writes.push(r.url());});await page.goto(base+'/sponsor');await expect(page.locator('#contact-status')).toContainText('WhatsApp');await page.setViewportSize({width:320,height:700});await setTheme(page,'dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const form=page.locator('#sponsor-enquiry-form');await form.locator('[name=name]').fill('Sponsor');await form.locator('[name=business]').fill('Example business');await form.locator('[name=email]').fill('business@example.com');await form.locator('[name=website]').fill('https://example.com');await form.locator('[name=message]').fill('A reviewed education offer.');const opened=page.waitForEvent('popup');await form.getByRole('button',{name:'Continue on WhatsApp'}).click();const popup=await opened;await popup.waitForLoadState();const target=new URL(popup.url());expect(target.origin+target.pathname).toBe('https://wa.me/917874166009');for(const value of ['Sponsor','Example business','business@example.com','https://example.com','A reviewed education offer.'])expect(target.searchParams.get('text')).toContain(value);await popup.close();await expect(page.getByRole('button',{name:/Download.*(brief|draft)/})).toHaveCount(0);await page.reload();await expect(form.locator('[name=business]')).toHaveValue('');expect(writes).toEqual([]);
});
test('app finder stays usable across small screens, themes and empty results',async({page})=>{
 await page.goto(base);await expect(page.locator('#app-finder-trigger')).toBeVisible();
 for(const [width,height,theme] of [[320,568,'light'],[390,844,'dark'],[1440,900,'light']]){
  await page.setViewportSize({width,height});await setTheme(page,theme);await page.evaluate(()=>scrollTo(0,500));await page.locator('#app-finder-trigger').scrollIntoViewIfNeeded();let position;
  await page.getByRole('button',{name:'Search apps',exact:true}).click();await expect(page.getByLabel('Search apps or activities')).toBeFocused();position=await page.evaluate(()=>scrollY);await expect(page.locator('.finder-result')).toHaveCount(21);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bounds=await page.locator('#app-finder-dialog').boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height+1);
  await page.getByLabel('Search apps or activities').fill('not-a-real-tool');await expect(page.locator('#finder-count')).toContainText('No matching apps');await expect(page.getByRole('button',{name:'Clear search',exact:true})).toBeVisible();await page.getByRole('button',{name:'Clear search',exact:true}).click();
  await page.getByLabel('Search apps or activities').fill('condolence');await expect(page.locator('.finder-result')).toHaveCount(1);await expect(page.locator('.finder-result')).toContainText('Moment Studio');await page.getByLabel('Search apps or activities').fill('');
  await page.screenshot({path:`test-results/app-finder-${width}-${theme}.png`});await page.keyboard.press('Escape');await expect(page.locator('#app-finder-dialog')).not.toBeVisible();expect(await page.evaluate(()=>scrollY)).toBe(position);await expect(page.locator('#app-finder-trigger')).toBeFocused();
 }
 await page.locator('#app-finder-trigger').click();await page.getByLabel('Search apps or activities').fill('quilt');await page.locator('.finder-result').click();await expect(page).toHaveURL(base+'/take-a-break');
 await page.goto(base+'/signin');await expect(page.locator('#auth-form')).toBeVisible();await expect(page.locator('#app-finder-trigger')).toHaveCount(0);
});
async function expectWorkspaceDiscovery(page){
 await expect(page.locator('.workspace-card-art .home-sculpture use')).toHaveCount(7);
 await expect(page.locator('.workspace-card-art[aria-hidden=true]')).toHaveCount(7);
 for(const [name,destination]of [['DIGITAL SAMAJ','digital-samaj'],['Chambers','advocate'],['Tournament Lite','tournament-lite'],['BatchFee Lite','batchfee-lite']]){
  await expect(page.getByRole('link',{name:'Sign in to '+name,exact:true})).toHaveAttribute('href','/signin?next='+destination);
 }
}
test('homepage ships real cards without JavaScript and ignores obsolete login query',async({browser,page})=>{
 const context=await noAdsContext(browser,{javaScriptEnabled:false});
 try{const fallback=await context.newPage();const response=await fallback.goto(base);expect(response.headers()['cache-control']).toBe('no-store');await expect(fallback.locator('.public-app')).toHaveCount(14);await expect(fallback.getByRole('link',{name:'Decision Wheel',exact:true})).toBeVisible();await expect(fallback.getByRole('link',{name:'Fund Lens',exact:true})).toBeVisible();await expect(fallback.getByRole('link',{name:'Sushant Synapse Times',exact:true})).toBeVisible();await expect(fallback.getByRole('link',{name:'Sign in to Tournament Lite',exact:true})).toBeVisible();await expectWorkspaceDiscovery(fallback);}finally{await context.close();}
 await page.goto(base+'/?signin=1');await expectWorkspaceDiscovery(page);await expect(page.locator('.public-app')).toHaveCount(14);await expect(page.locator('#auth-form')).toHaveCount(0);await page.goto(base+'/signin');await expect(page).toHaveURL(base+'/signin');await expect(page.locator('#auth-form')).toBeVisible();
});
test('platform setup, favourites, app launch with shared sign-in, team access and responsive themes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.goto(base);
 await expect(page.locator('#auth-form')).toHaveCount(0);await expect(page.getByRole('link',{name:'Fund Lens',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Sushant Synapse Times',exact:true})).toBeVisible();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/signin');
 await page.getByLabel('Your name',{exact:true}).fill('Sushant Owner');await page.getByLabel('Workspace name',{exact:true}).fill('Synapse Chambers');await page.getByLabel('Email address').fill('owner@synapse.example');await page.getByLabel('Password',{exact:true}).fill('Platform browser password!');await page.getByRole('button',{name:'Create platform'}).click();
 await expect(page.locator('#catalogue-account strong')).toBeVisible();await expect(page.getByRole('button',{name:'Open Chambers'})).toBeVisible();await expect(page.getByText('Planned',{exact:true})).toHaveCount(3);
 await expect(page.locator('.public-home')).toHaveCount(1);await expect(page.locator('.app-card,.app-grid')).toHaveCount(0);
 await expect(page.locator('.workspace-card[data-app-id=projects] [data-action],.workspace-card[data-app-id=finance] [data-action],.workspace-card[data-app-id=knowledge] [data-action]')).toHaveCount(0);
 await expect(page.locator('.workspace-card[data-app-id="advocate"] use')).toHaveAttribute('href',/home-art\.svg.*#chambers$/);
 await page.getByRole('button',{name:'Search apps',exact:true}).click();await page.getByLabel('Search apps or activities').fill('Chambers');await expect(page.locator('.finder-result')).toHaveCount(1);await expect(page.locator('.finder-result')).toContainText('Chambers');await expect(page.locator('.finder-result .finder-sculpture')).toHaveAttribute('aria-hidden','true');await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Search apps',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Add Chambers to favourites'}).click();await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Favourites',exact:true}).click();await expect(page.locator('.catalogue-item')).toHaveCount(1);
 await page.getByRole('button',{name:'Open Chambers'}).click();await expect(page).toHaveURL(base+'/advocate');await expect(page.getByRole('heading',{name:'Chambers overview'})).toBeVisible();
 await page.locator('.platform-shell-brand').click();await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Recent',exact:true}).click();await expect(page.getByRole('heading',{name:'Chambers',exact:true})).toBeVisible();
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'All apps',exact:true}).click();await setTheme(page,'dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:'test-results/platform-mobile-dark.png',fullPage:true});
 for(const width of [320,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await setTheme(page,'light');await page.screenshot({path:'test-results/platform-desktop-light.png',fullPage:true});
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Team access'}).click();await page.getByRole('button',{name:'Add member'}).click();await page.getByLabel('Name',{exact:true}).fill('Member One');await page.getByLabel('Email',{exact:true}).fill('member@synapse.example');await page.getByLabel('Initial password').fill('Member browser password!');await page.getByRole('button',{name:'Save member'}).click();await expect(page.getByText('Member One',{exact:true})).toBeVisible();
 const row=page.locator('.team-row').filter({hasText:'Member One'});await row.getByRole('checkbox',{name:'Chambers'}).uncheck();await expect(row.getByRole('checkbox',{name:'Chambers'})).not.toBeChecked();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('#auth-form')).toHaveCount(0);await page.goto(base+'/signin');await page.getByLabel('Email address').fill('member@synapse.example');await page.getByLabel('Password',{exact:true}).fill('Member browser password!');await page.locator('#auth-form button[type=submit]').click();await expect(page.getByText('Access required',{exact:true})).toHaveCount(4);await expect(page.getByRole('link',{name:'Fund Lens',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Sushant Synapse Times',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Open Chambers'})).toHaveCount(0);expect((await page.request.get(base+'/api/state')).status()).toBe(403);
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'My profile',exact:true}).click();await page.locator('#profile-form').getByLabel('Name',{exact:true}).fill('Updated Member');await page.getByRole('button',{name:'Save profile'}).click();await expect(page.locator('#profile-form input[name="name"]')).toHaveValue('Updated Member');expect(errors).toEqual([]);
});
test('public tools and private destinations stay distinct through sign-in',async({page})=>{
 const status=await (await page.request.get(base+'/api/auth/status')).json();
 if(status.setupRequired){const setup=await page.request.post(base+'/api/auth/setup',{data:{name:'Sushant Owner',firmName:'Synapse Chambers',email:'owner@synapse.example',password:'Platform browser password!'}});expect(setup.ok()).toBe(true);await page.request.post(base+'/api/auth/logout');}
 await page.goto(base);
 await expect(page.locator('#free-apps .public-app')).toHaveCount(14);
 expect(await page.locator('#free-apps .public-app').evaluateAll(links=>links.slice(0,4).map(a=>a.getAttribute('href')))).toEqual(['/fund-overlap','/decision-wheel','/ritual-assist','/confessions']);
 expect(await page.locator('#platform-switcher nav a:not(.platform-switcher-home)').evaluateAll(links=>links.slice(0,4).map(a=>a.getAttribute('href')))).toEqual(['/take-a-break?game=24','/decision-wheel','/fund-overlap','/decision-wheel']);
 await expect(page.locator('#workspace-apps .workspace-card')).toHaveCount(7);
 await expect(page.locator('#free-apps a[href*="tournament"]')).toHaveCount(0);
 const {apps,visibleApps}=require('../../../packages/app-registry');expect(visibleApps().slice(0,4).map(a=>a.path)).toEqual(['/fund-overlap','/decision-wheel','/ritual-assist','/confessions']);
 expect(await page.locator('#free-apps .public-app').evaluateAll(links=>links.map(a=>a.getAttribute('href')).sort())).toEqual(apps.filter(a=>a.public&&a.status==='Available'&&!a.catalogueParent).map(a=>a.path).sort());
 for(const [width,theme] of [[390,'dark'],[1440,'light']]){
  await page.setViewportSize({width,height:1000});
  await setTheme(page,theme);
  await page.screenshot({path:'test-results/public-home-'+theme+'.png',fullPage:true});
 }
 for(const app of ['advocate','tournament-lite','batchfee-lite','digital-samaj']){
  await page.goto(base+'/signin?next='+app);
  await expect(page.locator('#auth-form')).toBeVisible();
  await expect(page.getByRole('link',{name:/Back to all apps/})).toBeVisible();
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
  await page.locator('#auth-form button[type=submit]').click();
  await expect(page).toHaveURL(base+'/'+app);
  await page.goto(base+'/signin?next='+app,{waitUntil:'commit'});
  await expect(page).toHaveURL(base+'/'+app);
  // Leave the loading private document before invalidating its session.
  await page.goto('about:blank');
  await page.request.post(base+'/api/auth/logout');
 }
 await page.goto(base+'/signin?next=https://example.com');
 await page.getByLabel('Email address').fill('owner@synapse.example');
 await page.getByLabel('Password',{exact:true}).fill('Platform browser password!');
 await page.locator('#auth-form button[type=submit]').click();
 await expect(page).toHaveURL(base+'/');
});
