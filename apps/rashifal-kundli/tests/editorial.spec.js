const {test,expect}=require('@playwright/test');
const {createPreviewServer}=require('../../../infrastructure/preview-vedic-charts.cjs');let server;
test.beforeAll(async()=>{server=await createPreviewServer(0,{rashifal:true});});test.afterAll(async()=>{await server?.close();});
test('P12 manual sign/period factors, native draft translations, mobile themes and privacy',async({page})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(server.origin);
 await expect(page.locator('#rashifal-rashi option')).toHaveCount(13);await expect(page.getByRole('status')).toContainText('Choose a Rashi');
 await expect(page.locator('input[type=date],input[type=time]')).toHaveCount(0);
 await expect(page.locator('.rashifal-signs button')).toHaveCount(12);await page.locator('button[data-rashi="1"]').click();
 await expect(page.locator('#rashifal-rashi')).toHaveValue('1');await expect(page.locator('button[data-rashi="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.rashifal-reading>section')).toHaveCount(2);await expect(page.locator('#rashifal-result')).toContainText('draft-not-published');
 await page.locator('[data-view=weekly]').click();await page.locator('#rashifal-result summary').click();await expect(page.locator('#rashifal-result li[data-date]')).toHaveCount(7);
 const factors=await page.locator('li[data-date]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.date,n.dataset.moonRashi,n.dataset.relativeHouse]));
 for(const language of ['hi','gu']){await page.locator('#rashifal-language').selectOption(language);await expect(page.locator('.rashifal-reading')).toHaveAttribute('lang',language);await expect(page.locator('#rashifal-fallback')).not.toBeEmpty();
  expect(await page.locator('li[data-date]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.date,n.dataset.moonRashi,n.dataset.relativeHouse]))).toEqual(factors);
 }
 for(const width of [320,390,1440])for(const theme of ['light','dark','system']){await page.setViewportSize({width,height:900});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});await page.locator('#theme').selectOption('light');await page.screenshot({path:'.publish/vedic-p12-rashifal-gu-390.png',fullPage:true});
 await page.locator('#rashifal-language').selectOption('en');await page.locator('#rashifal-result').screenshot({path:'.publish/vedic-p12-reading-en-390.png'});
 await page.locator('[data-view=tomorrow]').click();await expect(page.locator('li[data-date]')).toHaveCount(1);
 expect(await page.evaluate(()=>localStorage.getItem('synapse-vedic-rashi'))).toBeNull();expect(requests.every(url=>url.startsWith(server.origin))).toBe(true);expect(page.url()).toBe(server.origin+'/');expect(errors).toEqual([]);
});
test('P12 sign preference is opt-in, validates stored input and clear removes it',async({page})=>{
 await page.goto(server.origin);await page.locator('#rashifal-rashi').selectOption('12');await expect(page.locator('.rashifal-reading')).toBeVisible();await page.reload();await expect(page.locator('#rashifal-rashi')).toHaveValue('');
 await page.locator('#rashifal-rashi').selectOption('4');await page.locator('#rashifal-remember').check();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('synapse-vedic-rashi')))).toEqual({version:1,rashi:4});
 await page.reload();await expect(page.locator('#rashifal-rashi')).toHaveValue('4');await expect(page.locator('#rashifal-remember')).toBeChecked();
 await page.locator('#rashifal-clear').click();await expect(page.locator('#rashifal-result')).toBeEmpty();expect(await page.evaluate(()=>localStorage.getItem('synapse-vedic-rashi'))).toBeNull();
 await expect(page.locator('.rashifal-signs button[aria-pressed=true]')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('synapse-vedic-rashi','{"version":1,"rashi":99}'));await page.reload();await expect(page.locator('#rashifal-rashi')).toHaveValue('');
});

test('P12 active page refreshes its editorial day at the next minute after IST midnight',async({page})=>{
 await page.clock.install({time:new Date('2026-10-24T18:29:40Z')});await page.goto(server.origin);await page.locator('#rashifal-rashi').selectOption('1');await page.clock.runFor(10);
 await expect(page.locator('#rashifal-result')).toContainText('2026-10-24 → 2026-10-24');
 await page.clock.runFor(60000);await expect(page.locator('#rashifal-result')).toContainText('2026-10-25 → 2026-10-25');
 await page.locator('#rashifal-clear').click();await page.clock.runFor(60000);await expect(page.locator('#rashifal-result')).toBeEmpty();
});

test('reading-first setup, sign help and deduplicated observations preserve all reading content',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(server.origin);
 await expect(page.locator('.rashifal-picker')).toHaveAttribute('open','');
 await page.locator('.rashifal-help summary').click();await expect(page.locator('.rashifal-help')).toContainText('Western Sun sign');
 await expect(page.locator('.rashifal-help a')).toHaveAttribute('href','/rashifal-kundli');
 await page.locator('button[data-rashi="5"]').click();await expect(page.locator('.rashifal-picker')).not.toHaveAttribute('open','');
 await expect(page.locator('.rashifal-reading>section')).toHaveCount(2);
 await expect(page.locator('.rashifal-topics,[data-category=career],[data-category=money],[data-category=relationships],[data-category=wellbeing]')).toHaveCount(0);
 await expect(page.locator('.rashifal-planet[data-body]')).toHaveCount(9);
 await page.locator('.rashifal-picker summary').click();await page.locator('button[data-rashi="9"]').click();
 await expect(page.locator('#rashifal-rashi')).toHaveValue('9');await expect(page.locator('#rashifal-result h2')).toContainText('Dhanu');
 await page.locator('#rashifal-remember').check();await page.reload();await expect(page.locator('.rashifal-picker')).not.toHaveAttribute('open','');
 await expect(page.locator('#rashifal-rashi')).toHaveValue('9');await page.locator('#rashifal-clear').click();
 await expect(page.locator('.rashifal-picker')).toHaveAttribute('open','');await expect(page.locator('#rashifal-result')).toBeEmpty();
});

test('all twelve Rashis render calculated readings and nine-graha observation evidence',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));await page.goto(server.origin);const signatures=new Set();
 for(let rashi=1;rashi<=12;rashi++){
  await page.locator('#rashifal-rashi').selectOption(String(rashi));await expect(page.locator('.rashifal-transit-table tbody tr')).toHaveCount(9);
  signatures.add(await page.locator('.rashifal-reading').innerText());
  const rows=await page.locator('.rashifal-transit-table tbody tr').evaluateAll(rows=>rows.map(r=>({sign:Number(r.dataset.rashi),house:Number(r.dataset.house)})));
  for(const row of rows)expect(row.house).toBe((row.sign-rashi+12)%12+1);
 }expect(signatures.size).toBe(12);
 await page.locator('#rashifal-result summary').click();await expect(page.locator('#rashifal-observation option')).toHaveCount(8);
 await page.locator('#rashifal-observation').selectOption('0');await expect(page.locator('.rashifal-transit-table caption')).toContainText('00:00 IST');
 await page.locator('[data-view=weekly]').click();await page.locator('#rashifal-result summary').click();await expect(page.locator('#rashifal-observation option')).toHaveCount(56);
 await page.locator('#rashifal-observation').selectOption('55');await expect(page.locator('.rashifal-transit-table caption')).toContainText('21:00 IST');
 for(const language of ['hi','gu','en']){await page.locator('#rashifal-language').selectOption(language);await page.locator('#rashifal-result summary').click();await expect(page.locator('.rashifal-transit-table tbody tr')).toHaveCount(9);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
 await page.setViewportSize({width:390,height:900});await page.screenshot({path:'.publish/rashifal-calculated-mobile.png',fullPage:true});
});
