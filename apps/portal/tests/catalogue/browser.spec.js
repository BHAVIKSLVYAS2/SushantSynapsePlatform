const {test,expect}=require('../../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeEach(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-catalogue-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',DATA_DIR:dir,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{
  let out='';const timer=setTimeout(()=>reject(Error('Catalogue fixture startup timeout: '+out)),15000);
  child.stdout.on('data',chunk=>{out+=chunk;const match=/localhost:(\d+)/.exec(out);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});
  child.stderr.on('data',chunk=>out+=chunk);child.once('error',error=>{clearTimeout(timer);reject(error);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Catalogue fixture exited '+code));});
 });
});
test.afterEach(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
const owner={name:'Catalogue Owner',firmName:'Isolated workspace',email:'owner@catalogue.example',password:'Catalogue test password!'};

test('Rashifal feature replaces Daily Satire with a live calendar and working app links',async({page})=>{
 const errors=[],editorial=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/arena-editorial'))editorial.push(r.url());});
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.goto(base+'/');
 await expect(page.locator('.public-app[data-app-id="rashifal-kundli"]')).toHaveCount(0);
 const card=page.locator('[data-home-vedic]');await card.scrollIntoViewIfNeeded();await expect(card).toHaveAttribute('data-calendar-ready','true');
 await expect(card.locator('h2')).toHaveText('RITVAYAM');await expect(card.locator('.ritvayam-mark')).toHaveCount(1);
 await expect(card.locator('[data-vedic-samvat]')).toHaveText('2083');await expect(card.locator('[data-vedic-month]')).toHaveText('Ashvina');
 await expect(card.locator('[data-vedic-date]')).toContainText('25 October 2026');await expect(card.locator('[data-vedic-tithi]')).not.toHaveText('—');
 await expect(card.getByRole('link',{name:'Read your Rashifal'})).toHaveAttribute('href','/rashifal-kundli/rashifal');await expect(card.getByRole('link',{name:'Explore Kundli'})).toHaveAttribute('href','/rashifal-kundli');
 await expect(page.locator('.arena-discovery,[data-home-satire]')).toHaveCount(0);expect(editorial).toEqual([]);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark','system']){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>SynapseTheme.write('light'));await card.screenshot({path:'.publish/home-vedic-mobile-light.png'});
 await page.evaluate(()=>SynapseTheme.write('dark'));await card.screenshot({path:'.publish/home-vedic-mobile-dark.png'});
 await page.setViewportSize({width:1440,height:1000});await card.screenshot({path:'.publish/home-vedic-desktop-dark.png'});
 await page.evaluate(()=>localStorage.setItem('synapse-language','hi'));await page.reload();await card.scrollIntoViewIfNeeded();await expect(card.locator('[data-vedic-month]')).toContainText('आश्विन');await expect(card.locator('[data-vedic-samvat-label]')).toHaveText('विक्रम संवत');
 await page.evaluate(()=>SynapseLanguage.set('gu'));await expect(card.locator('[data-vedic-month]')).toContainText('આસો');await expect(card.locator('[data-vedic-samvat-label]')).toHaveText('વિક્રમ સંવત');await expect(card.locator('[data-vedic-date]')).toContainText('ઑક્ટોબર');await card.screenshot({path:'.publish/ritvayam-home-gu.png'});
 const retired=await page.request.get(base+'/satire-arena/daily',{maxRedirects:0});expect(retired.status()).toBe(308);expect(retired.headers().location).toBe('/satire-arena');
 expect(errors).toEqual([]);
});

test('Explore starts immediately with compact Featured badges and one search',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:1050});await page.goto(base+'/');
 await expect(page.locator('#home-search-input')).toHaveCount(1);await expect(page.locator('.home-featured,.home-feature-grid,.home-carousel-dots,.home-carousel-arrows,#app-finder-trigger')).toHaveCount(0);
 expect(await page.locator('.public-app').evaluateAll(cards=>cards.slice(0,4).map(a=>a.dataset.appId))).toEqual(['ritual-assist','moment-studio','daily-spark','satire-arena']);await expect(page.locator('.home-feature-badge svg')).toHaveCount(4);await expect(page.locator('.home-feature-badge')).toHaveCount(4);expect(await page.locator('.public-app.is-featured').evaluateAll(cards=>cards.map(a=>a.dataset.appId))).toEqual(['ritual-assist','moment-studio','daily-spark','satire-arena']);
 await page.locator('#home-search-input').fill('QR');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(1);await page.locator('#home-search-input').press('Escape');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(14);
 await page.locator('#home-search-input').fill('nonexistent-home-app');await expect(page.locator('.home-search-empty')).toBeVisible();await expect(page.locator('#home-tool-grid')).toBeHidden();await page.getByRole('button',{name:'Clear app search'}).click();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1050});await page.evaluate(t=>window.SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const layout=await page.locator('.public-apps').evaluate(el=>({columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,direct:el.querySelectorAll(':scope > .catalogue-item').length}));expect(layout).toEqual({columns:width>1000?3:width>=360?2:1,direct:14});
  const gap=await page.evaluate(()=>document.querySelector('#free-title').getBoundingClientRect().top-document.querySelector('.home-filters').getBoundingClientRect().bottom);expect(gap).toBeGreaterThanOrEqual(0);expect(gap).toBeLessThanOrEqual(24);
  expect(await page.locator('.public-app.is-featured').evaluateAll(cards=>cards.every(card=>{const badge=card.querySelector('.home-feature-badge').getBoundingClientRect(),title=card.querySelector('h2').getBoundingClientRect(),box=card.getBoundingClientRect();return badge.right<=box.right&&badge.top>=box.top&&badge.bottom<=title.top;}))).toBe(true);
 }
 await page.setViewportSize({width:390,height:1050});await page.evaluate(()=>{window.SynapseTheme.write('light');scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(300);await page.screenshot({path:'.publish/explore-badges-local.png'});expect(errors).toEqual([]);
});
test('public tools open if recent tracking is offline while private launch failures remain blocked',async({page})=>{
 await page.request.post(base+'/api/auth/setup',{data:owner});await page.goto(base+'/');await expect(page.locator('#catalogue-account')).toBeVisible();await page.route('**/api/platform/apps/qr-maker/launch',r=>r.fulfill({status:503,json:{error:'Recent tracking offline.'}}));await page.locator('.public-app[data-app-id=qr-maker]').click();await expect(page).toHaveURL(base+'/qr-maker');await page.goto(base+'/');await page.route('**/api/platform/apps/advocate/launch',r=>r.fulfill({status:503,json:{error:'Workspace offline.'}}));await page.getByRole('button',{name:'Open Chambers',exact:true}).click();await expect(page.locator('#notice')).toContainText('Workspace offline.');await expect(page).toHaveURL(base+'/');
});
test('compact mobile entry cards keep Explore heading clear of the bottom dock',async({page})=>{
 await page.setViewportSize({width:390,height:446});await page.goto(base+'/');
 const entry=await page.locator('.home-entry-paths').boundingBox(),featured=await page.locator('#free-title').boundingBox(),dock=await page.locator('.home-mobile-dock').boundingBox();
 expect(entry.height).toBeLessThanOrEqual(100);expect(featured.y+featured.height).toBeLessThanOrEqual(dock.y);
});
test('one catalogue survives sign-in, favourites, recent apps and sign-out',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/');await expect(page.locator('.public-app')).toHaveCount(14);
 const snapshot=()=>page.locator('.public-app').evaluateAll(cards=>cards.map(a=>({id:a.dataset.appId,name:a.querySelector('h2').textContent,copy:a.querySelector('p').textContent,href:a.getAttribute('href')})));const before=await snapshot();
 expect((await page.request.post(base+'/api/auth/setup',{data:owner})).status()).toBe(201);await page.reload();await expect(page.locator('#catalogue-account')).toBeVisible();await expect(page.locator('.public-home')).toHaveCount(1);await expect(page.locator('.app-grid,.app-card')).toHaveCount(0);expect(await snapshot()).toEqual(before);
 await expect(page.getByRole('button',{name:'Open Chambers',exact:true})).toBeVisible();await page.getByRole('button',{name:'Add QR Maker to favourites'}).click();await expect(page.getByRole('button',{name:'Remove QR Maker from favourites'})).toBeVisible();await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Favourites',exact:true}).click();await expect(page.locator('.public-app')).toHaveCount(1);await expect(page.locator('.public-app')).toHaveAttribute('href','/qr-maker');
 await page.locator('.public-app').click();await expect(page).toHaveURL(base+'/qr-maker');await page.goto(base+'/');await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'Recent',exact:true}).click();await expect(page.locator('.public-app')).toHaveCount(1);
 await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name:'All apps',exact:true}).click();await page.getByRole('searchbox',{name:'Search web apps'}).fill('Chambers');await expect(page.locator('.workspace-card:visible')).toHaveCount(1);await expect(page.getByRole('button',{name:'Open Chambers',exact:true})).toBeVisible();await page.getByRole('button',{name:'Clear app search'}).click();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>window.SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.locator('#catalogue-account')).toHaveCount(0);await expect(page.locator('.public-app')).toHaveCount(14);await expect(page.locator('[data-action=favorite]')).toHaveCount(0);await expect(page.getByRole('link',{name:/Sign in to Chambers/})).toBeVisible();expect(errors).toEqual([]);
});
test('missing access stays locked, unavailable apps stay unavailable, and public apps survive outages',async({page,browser})=>{
 await page.request.post(base+'/api/auth/setup',{data:owner});await page.request.post(base+'/api/users',{data:{name:'Restricted Member',email:'member@catalogue.example',password:'Member catalogue password!',role:'Clerk',appIds:[]}});await page.request.post(base+'/api/auth/logout');await page.request.post(base+'/api/auth/login',{data:{email:'member@catalogue.example',password:'Member catalogue password!'}});
 await page.goto(base+'/');await expect(page.locator('#catalogue-account')).toBeVisible();await expect(page.getByRole('button',{name:'Open Chambers',exact:true})).toHaveCount(0);await expect(page.locator('.workspace-card[data-app-id=advocate]')).toContainText('Access required');expect((await page.request.post(base+'/api/platform/apps/advocate/launch',{data:{}})).status()).toBe(403);
 await page.route('**/api/platform',async route=>{const response=await route.fetch(),data=await response.json();data.apps=data.apps.map(a=>a.public?a:{...a,accessible:false,status:'Unavailable',description:'Organisation integration is unavailable.'});await route.fulfill({json:data});});await page.reload();await expect(page.locator('.workspace-card[data-app-id=advocate]')).toContainText('Unavailable');await expect(page.locator('.workspace-card[data-app-id=advocate] [data-action=launch]')).toHaveCount(0);
 const guest=await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser);try{const fallback=await guest.newPage();await fallback.route('**/api/auth/status',r=>r.abort());await fallback.goto(base+'/');await expect(fallback.locator('.public-app')).toHaveCount(14);await expect(fallback.locator('.public-app[href="/qr-maker"]')).toBeVisible();}finally{await guest.close();}
 const nojs=await require('../../../../tests/browser-fixture.js').acknowledgedContext(browser,{javaScriptEnabled:false});try{const fallback=await nojs.newPage();await fallback.goto(base+'/');await expect(fallback.locator('.public-app')).toHaveCount(14);await expect(fallback.locator('.home-featured')).toHaveCount(0);await expect(fallback.locator('.home-feature-badge')).toHaveCount(4);await expect(fallback.getByRole('link',{name:/Sign in to Chambers/})).toBeVisible();}finally{await nojs.close();}
});
