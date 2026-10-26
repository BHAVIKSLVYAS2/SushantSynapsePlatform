const {editBirth}=require('../../../tests/vedic-kundli-journey.cjs');
const {fillDate,fillTime,openKundliCalculations}=require('../../../tests/vedic-civil-input.cjs');
const {test,expect}=require('@playwright/test'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {headers}=require('../privacy.cjs');let server,origin;
test.beforeAll(async()=>{
 if(process.env.VEDIC_LIVE_ORIGIN){origin=process.env.VEDIC_LIVE_ORIGIN;return;}
 const pages=JSON.parse(fs.readFileSync('infrastructure/cloudflare/pages.json','utf8'));
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),target=pages[url.pathname]||url.pathname;
  const file=path.join(process.cwd(),'infrastructure/cloudflare/dist',target);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{...headers,'Content-Type':file.endsWith('.webp')?'image/webp':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});

test('shared platform header owns settings and navigation without making birth-page network calls',async({page})=>{
 const connections=[],errors=[];page.on('request',r=>{if(['fetch','xhr','ping'].includes(r.resourceType()))connections.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('synapse-language'))localStorage.setItem('synapse-language','hi');});
 await page.setViewportSize({width:320,height:900});await page.goto(origin+'/rashifal-kundli');
 await expect(page.locator('.platform-shell')).toHaveCount(1);await expect(page.locator('html')).toHaveAttribute('lang','hi');
 await expect(page.locator('.platform-shell [data-theme-toggle]')).toHaveCount(1);await expect(page.locator('#theme')).toHaveCount(0);
 await expect(page.locator('.platform-shell [data-language-control]')).toHaveCount(1);await expect(page.locator('#vedic-language')).toHaveCount(0);await expect(page.locator('main #birth-language')).toBeHidden();
 await page.locator('.platform-shell [data-theme-toggle]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await chooseLanguage(page,'gu');await expect(page.locator('html')).toHaveAttribute('lang','gu');
 await page.locator('.platform-switch').click();await expect(page.locator('#platform-switcher')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('.vedic-nav a[href="/rashifal-kundli/rashifal"]').click();await expect(page.locator('[data-interface-language=gu]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.vedic-nav [aria-current=page]')).toHaveAttribute('href','/rashifal-kundli/rashifal');
 await page.locator('#rashifal-rashi').selectOption('1');await expect(page.locator('.rashifal-planet[data-body]')).toHaveCount(9);
 await expect(page.locator('[data-category=career],[data-category=money],[data-category=relationships],[data-category=wellbeing]')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(connections).toEqual([]);expect(errors).toEqual([]);
});
test('built production Kundli computes privately, loads worker and preserves mobile themes',async({page})=>{
 const errors=[],requests=[],workers=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r));page.on('worker',w=>workers.push(w.url()));
 const r=await page.goto(origin+'/rashifal-kundli');expect(r.headers()['content-security-policy']).toContain("connect-src 'none'");
 await expect(page.locator('.platform-shell-brand')).toBeVisible();
 await editBirth(page,'#birth-date');await fillDate(page,'#birth-date','2000-01-01');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','12:15');await editBirth(page,'#birth-query');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();
 await page.locator('form button[type=submit]').click();await openKundliCalculations(page);await expect(page.locator('[data-feature=dasha] table tbody tr')).toHaveCount(9);
 for(const width of [320,390,1440])for(const theme of ['light','dark','system']){
  await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.screenshot({path:'.publish/vedic-production-preview.png',fullPage:true});
 await page.locator('.kundli-result-actions button').first().click();await editBirth(page,'#birth-accuracy');await page.locator('#birth-accuracy').selectOption('approximate');await editBirth(page,'#birth-precision');await page.locator('#birth-precision').fill('10');await page.locator('form button[type=submit]').click();await openKundliCalculations(page);
 await page.locator('#sensitivity-analyze').click();await expect(page.locator('#sensitivity-results [data-component=moonRashi]')).toBeVisible({timeout:30000});
 expect(workers.some(url=>url.includes('/rashifal-kundli/sensitivity-worker.mjs'))).toBe(true);expect(errors).toEqual([]);
 expect(requests.every(r=>r.method()==='GET'&&r.url().startsWith(origin)&&!new URL(r.url()).search)).toBe(true);
 expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
});
for(const route of ['rashifal','matching','time-machine'])test('built '+route+' entry mounts without third-party requests',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(origin+'/rashifal-kundli/'+route);
 await expect(page.locator('main')).not.toBeEmpty();await expect(page.locator('.vedic-nav')).toBeVisible();expect(errors).toEqual([]);expect(requests.every(url=>url.startsWith(origin))).toBe(true);
});

test('Rashifal reading-first production layout keeps translations, theme and privacy intact',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r));
 await page.setViewportSize({width:390,height:844});const response=await page.goto(origin+'/rashifal-kundli/rashifal');
 expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");
 await expect(page.locator('.rashifal-preview-info')).not.toHaveAttribute('open','');await page.locator('.rashifal-preview-info summary').click();
 await expect(page.locator('[data-vedic-text=warning]')).toBeVisible();await page.locator('.rashifal-preview-info summary').click();
 await page.locator('.rashifal-signs button').nth(4).click();await expect(page.locator('.rashifal-reading>section')).toHaveCount(2);
 await expect(page.locator('.rashifal-signs')).toBeHidden();
 for(const language of ['en','hi','gu']){
  await chooseLanguage(page,language);await expect(page.locator('.rashifal-reading')).toHaveAttribute('lang',language);
  for(const width of [320,390,768,1440])for(const theme of ['light','dark','system']){
   await page.setViewportSize({width,height:844});await page.evaluate(t=>SynapseTheme.write(t),theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 await chooseLanguage(page,'en');await page.setViewportSize({width:390,height:844});await page.evaluate(t=>SynapseTheme.write(t),'light');
 await page.screenshot({path:'.publish/rashifal-ux-mobile-light.png',fullPage:true});
 await page.evaluate(t=>SynapseTheme.write(t),'dark');await page.screenshot({path:'.publish/rashifal-ux-mobile-dark.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.publish/rashifal-ux-desktop-dark.png',fullPage:true});
 expect(errors).toEqual([]);expect(requests.every(r=>r.method()==='GET'&&r.url().startsWith(origin))).toBe(true);
 expect(await page.evaluate(()=>localStorage.getItem('synapse-vedic-rashi'))).toBeNull();
});

test('production Rashifal computes separate nine-graha evidence for every selected Moon sign',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.goto(origin+'/rashifal-kundli/rashifal');const readings=new Set();
 for(let rashi=1;rashi<=12;rashi++){
  await page.locator('#rashifal-rashi').selectOption(String(rashi));await expect(page.locator('.rashifal-transit-table tbody tr')).toHaveCount(9);await page.locator('.rashifal-calculations summary').click();readings.add(await page.locator('.rashifal-reading').innerText());
  const rows=await page.locator('.rashifal-transit-table tbody tr').evaluateAll(rows=>rows.map(r=>[Number(r.dataset.rashi),Number(r.dataset.house)]));
  for(const [sign,house]of rows)expect(house).toBe((sign-rashi+12)%12+1);
 }
 expect(readings.size).toBe(12);await page.locator('#rashifal-result summary').click();await expect(page.locator('#rashifal-observation option')).toHaveCount(8);
 await page.locator('[data-view=weekly]').click();await page.locator('#rashifal-result summary').click();await expect(page.locator('#rashifal-observation option')).toHaveCount(56);
});

async function chooseLanguage(page,language){await page.locator('.platform-language summary').click();await page.locator('[data-interface-language='+language+']').click();}

test('supplied sign illustrations follow shared themes and everyday reading keeps technical details optional',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.setViewportSize({width:390,height:900});await page.goto(origin+'/rashifal-kundli/rashifal');
 await expect(page.locator('.rashifal-signs img')).toHaveCount(24);
 for(const theme of ['light','dark']){
  await page.evaluate(value=>SynapseTheme.write(value),theme);
  const images=page.locator('.rashifal-signs .rashifal-sign-'+theme);await expect(images.first()).toBeVisible();
  await expect.poll(()=>images.evaluateAll(nodes=>nodes.every(img=>img.complete&&img.naturalWidth===190))).toBe(true);
  await page.locator('.rashifal-signs').screenshot({path:'.publish/moon-sign-picker-'+theme+'.png'});
 }
 await page.locator('[data-rashi="1"]').click();await expect(page.locator('.rashifal-life-areas>section')).toHaveCount(3);
 await expect(page.locator('.rashifal-calculations')).not.toHaveAttribute('open','');await expect(page.locator('.rashifal-reading')).toBeHidden();
 await expect(page.locator('.rashifal-prediction')).not.toContainText(/Vedha|graha|H12|boundary-screening/);
 for(const language of ['hi','gu','en']){
  await chooseLanguage(page,language);await expect(page.locator('.rashifal-prediction')).toHaveAttribute('lang',language);
  await expect(page.locator('.rashifal-life-areas>section')).toHaveCount(3);
 }
 for(const theme of ['light','dark']){await page.evaluate(value=>SynapseTheme.write(value),theme);await page.locator('.rashifal-prediction').screenshot({path:'.publish/rashifal-everyday-'+theme+'.png'});}
 await page.locator('.rashifal-calculations summary').click();await expect(page.locator('.rashifal-reading')).toBeVisible();await expect(page.locator('.rashifal-planet[data-body]')).toHaveCount(9);
});

test('calculated timeline shows IST roots and rule reasons across every Rashi, period and language',async({page})=>{
 const workers=[],errors=[];page.on('worker',w=>workers.push(w.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.goto(origin+'/rashifal-kundli/rashifal');
 for(let rashi=1;rashi<=12;rashi++){
  await page.locator('#rashifal-rashi').selectOption(String(rashi));const timeline=page.locator('.rashifal-timeline');
  await expect(timeline).toHaveAttribute('data-status','available');await expect(timeline.locator('li')).toHaveCount(3);
  const ingress=timeline.locator('li[data-kind=ingress]');await expect(ingress).toHaveAttribute('data-body','Moon');
  await expect(ingress).toHaveAttribute('data-from-house',String((12-rashi+12)%12+1));await expect(ingress).toHaveAttribute('data-to-house',String((1-rashi+12)%12+1));
  await expect(ingress.locator('time')).toHaveAttribute('datetime',/^2026-10-25T13:52:/);await expect(ingress.locator('time')).toContainText('19:22');
  await expect(timeline.locator('li[data-kind=guard-enter] [data-affected]')).not.toHaveCount(0);
 }
 await page.locator('[data-view=weekly]').click();await page.locator('.platform-shell [data-theme-toggle]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('.rashifal-timeline h3')).toHaveText('Changes this week');
 for(const language of ['hi','gu','en']){await chooseLanguage(page,language);await expect(page.locator('.rashifal-reading')).toHaveAttribute('lang',language);await expect(page.locator('.rashifal-timeline')).toHaveAttribute('data-status','available');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
 await page.locator('[data-view=tomorrow]').click();await expect(page.locator('.rashifal-timeline h3')).toHaveText('Changes tomorrow');
 await expect(page.locator('.rashifal-timeline li')).toHaveCount(0);await expect(page.locator('.rashifal-timeline')).toContainText('No sign or boundary-screening changes found');
 expect(workers.some(url=>url.includes('/rashifal-worker.mjs'))).toBe(true);expect(errors).toEqual([]);
 await page.setViewportSize({width:390,height:900});await page.locator('[data-view=today]').click();await expect(page.locator('.rashifal-timeline li')).toHaveCount(3);
 await page.locator('.rashifal-calculations summary').click();await page.locator('.rashifal-timeline').screenshot({path:'.publish/rashifal-timeline-mobile-dark.png'});
 await page.locator('#rashifal-clear').click();await expect(page.locator('#rashifal-result')).toBeEmpty();
});

test('blocked calculation worker falls back to the same actual on-device roots',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.route('**/*rashifal-worker.mjs*',route=>route.abort());await page.goto(origin+'/rashifal-kundli/rashifal');
 await page.locator('#rashifal-rashi').selectOption('1');await expect(page.locator('.rashifal-timeline')).toHaveAttribute('data-status','available');
 await expect(page.locator('.rashifal-timeline li')).toHaveCount(3);await expect(page.locator('.rashifal-timeline [data-kind=ingress] time')).toHaveAttribute('datetime',/^2026-10-25T13:52:/);
 await page.locator('#rashifal-clear').click();await expect(page.locator('#rashifal-result')).toBeEmpty();
});

test('human daily prediction appears before the calculation summary and timeline',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.setViewportSize({width:390,height:900});await page.goto(origin+'/rashifal-kundli/rashifal');
 const copies=new Set();for(let rashi=1;rashi<=12;rashi++){
  await page.locator('#rashifal-rashi').selectOption(String(rashi));await expect(page.locator('.rashifal-prediction')).toBeVisible();
  await expect(page.locator('.rashifal-prediction h3')).toHaveText('Your daily prediction');copies.add(await page.locator('.rashifal-prediction').innerText());
  expect(await page.locator('#rashifal-result').evaluate(root=>root.querySelector('.rashifal-prediction').compareDocumentPosition(root.querySelector('.rashifal-reading'))&Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await expect(page.locator('.rashifal-transit-table tbody tr')).toHaveCount(9);await expect(page.locator('.rashifal-timeline')).toHaveAttribute('aria-labelledby','rashifal-timeline-title');await expect(page.locator('#rashifal-timeline-title')).toHaveCount(1);
 }
 expect(copies.size).toBeGreaterThan(4);
 for(const language of ['hi','gu','en']){await chooseLanguage(page,language);await expect(page.locator('.rashifal-prediction')).toHaveAttribute('lang',language);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>SynapseTheme.write('light'));await page.locator('.rashifal-prediction').screenshot({path:'.publish/rashifal-outlook-mobile-light.png'});
 await page.evaluate(()=>SynapseTheme.write('dark'));await page.locator('.rashifal-prediction').screenshot({path:'.publish/rashifal-outlook-mobile-dark.png'});
 await page.locator('[data-view=tomorrow]').click();await expect(page.locator('.rashifal-prediction h3')).toHaveText('Your outlook for tomorrow');
 await page.locator('[data-view=weekly]').click();await expect(page.locator('.rashifal-prediction h3')).toHaveText('Your weekly outlook');
});
