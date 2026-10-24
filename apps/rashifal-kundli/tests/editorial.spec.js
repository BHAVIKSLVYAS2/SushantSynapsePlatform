const {test,expect}=require('@playwright/test');
const {createPreviewServer}=require('../../../infrastructure/preview-vedic-charts.cjs');let server;
test.beforeAll(async()=>{server=await createPreviewServer(0,{rashifal:true});});test.afterAll(async()=>{await server?.close();});
test('P12 manual sign/period factors, native draft translations, mobile themes and privacy',async({page})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(server.origin);
 await expect(page.locator('#rashifal-rashi option')).toHaveCount(13);await expect(page.getByRole('status')).toContainText('Choose a Rashi');
 await expect(page.locator('input[type=date],input[type=time]')).toHaveCount(0);await page.locator('#rashifal-rashi').selectOption('1');
 await expect(page.locator('.rashifal-reading>section')).toHaveCount(5);await expect(page.locator('#rashifal-result')).toContainText('draft-not-published');
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
 await page.evaluate(()=>localStorage.setItem('synapse-vedic-rashi','{"version":1,"rashi":99}'));await page.reload();await expect(page.locator('#rashifal-rashi')).toHaveValue('');
});

test('P12 active page refreshes its editorial day at the next minute after IST midnight',async({page})=>{
 await page.clock.install({time:new Date('2026-10-24T18:29:40Z')});await page.goto(server.origin);await page.locator('#rashifal-rashi').selectOption('1');await page.clock.runFor(10);
 await expect(page.locator('#rashifal-result')).toContainText('2026-10-24 → 2026-10-24');
 await page.clock.runFor(60000);await expect(page.locator('#rashifal-result')).toContainText('2026-10-25 → 2026-10-25');
 await page.locator('#rashifal-clear').click();await page.clock.runFor(60000);await expect(page.locator('#rashifal-result')).toBeEmpty();
});
