const {test,expect}=require('../../../../tests/browser-fixture');
const {start}=require('../production-server.cjs');
const {fillDate,fillTime}=require('../../../../tests/vedic-civil-input.cjs');
let server;test.beforeAll(async()=>{server=await start();});test.afterAll(async()=>{await server.close();});
async function generate(page){await page.goto(server.origin+'/rashifal-kundli');await fillDate(page,'#birth-date','1990-08-15');await fillTime(page,'#birth-time','10:30');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();await page.locator('#birth-calculate').click();await expect(page.locator('.vedic-charts')).toBeVisible();}
test('practitioner workspace compares charts, shows every graha, links table selection and preserves native-language state',async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1280,height:900});await generate(page);
 const charts=page.locator('.vedic-charts');await expect(page.locator('[data-kundli-section=calculations]')).toHaveAttribute('aria-pressed','true');
 await expect(charts.locator('figure')).toHaveCount(2);for(const type of ['D1','D9'])await expect(charts.locator(`figure[data-chart=${type}]`)).toBeVisible();
 expect((await charts.locator('svg').first().boundingBox()).y).toBeLessThan(650);
 await expect(charts.locator('.vedic-chart-table tbody tr')).toHaveCount(9);await expect(page.locator('.kundli-current-dasha')).toContainText('Jupiter / Venus');
 await page.screenshot({path:'.publish/jyotish-desktop.png'});
 const crowded=charts.locator('figure[data-chart=D1] [data-house="11"] .vedic-cell-bodies');await expect(crowded).toHaveCount(2);expect(await crowded.allTextContents()).toEqual(['Su Ve Ju','Ke']);
 await charts.locator('.vedic-chart-table [data-body=Ketu] button').click();await expect(charts.locator('figure[data-chart=D1] [data-house="11"]')).toHaveAttribute('aria-pressed','true');
 await charts.locator('[data-value=D9]').click();await charts.locator('[data-value=south]').click();await page.evaluate(()=>SynapseLanguage.set('hi'));await expect(charts).toHaveAttribute('data-chart','D9');await expect(charts).toHaveAttribute('data-style','south');await expect(charts.locator('[data-value=D9]')).toHaveAttribute('aria-pressed','true');
 await expect(charts.locator('figure[data-chart=D1] [data-house="11"] .vedic-cell-bodies').last()).toHaveText('के');
 for(const lang of ['en','hi','gu'])for(const theme of ['light','dark'])for(const width of [320,390,768,1280]){
  await page.evaluate(({lang,theme})=>{SynapseLanguage.set(lang);SynapseTheme.write(theme);},{lang,theme});await page.setViewportSize({width,height:900});await expect(charts).toHaveAttribute('data-chart','D9');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(charts.locator('figure[data-chart=D9]')).toBeVisible();if(width<800)await expect(charts.locator('figure[data-chart=D1]')).toBeHidden();
 }
 await charts.locator('.vedic-chart-expand').click();await expect(charts).toHaveClass(/is-expanded/);await expect(charts).toHaveAttribute('aria-modal','true');const last=charts.locator('.vedic-chart-notes>summary');await last.focus();await page.keyboard.press('Tab');await expect(charts.locator('.vedic-chart-controls button').first()).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(last).toBeFocused();await page.keyboard.press('Escape');await expect(charts).not.toHaveClass(/is-expanded/);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/jyotish-mobile.png'});expect(errors).toEqual([]);
});
test('unknown time keeps unavailable charts withheld and useful planetary data accessible',async({page})=>{
 await page.goto(server.origin+'/rashifal-kundli');await fillDate(page,'#birth-date','1990-08-15');await page.locator('#birth-accuracy').selectOption('unknown');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();await page.locator('#birth-calculate').click();await expect(page.locator('.vedic-charts')).toHaveCount(0);await expect(page.locator('[data-feature=d1][data-status=unavailable]')).toBeVisible();await page.locator('[data-kundli-section=planets]').click();await expect(page.locator('#kundli-planets')).toBeVisible();
});
test('Dasha selection survives language changes and exact boundaries and reports remain reachable',async({page})=>{
 await generate(page);await page.locator('[data-kundli-section=timing]').click();const major=page.locator('.vedic-dasha>label select');await major.selectOption('0');await page.evaluate(()=>SynapseLanguage.set('hi'));await expect(major).toHaveValue('0');await expect(page.locator('.vedic-dasha')).not.toContainText(/As of \d{4}-\d\d-\d\dT/);
 await page.locator('.vedic-dasha>details>summary').click();await expect(page.locator('.vedic-dasha>details')).toContainText('+05:30');
 await page.locator('.vedic-current-period').click();await expect(page.locator('.vedic-current-period')).toBeDisabled();
 for(const section of ['advanced','checks','sensitivity','transits']){await page.locator('.kundli-more-nav>summary').click();await page.locator(`[data-kundli-section=${section}]`).click();await expect(page.locator('#kundli-'+section)).toBeVisible();}
 await page.locator('.kundli-more-nav>summary').click();await page.locator('[data-kundli-section=report]').click();await expect(page.locator('#kundli-export')).toBeVisible();
 const download=page.waitForEvent('download');await page.locator('#export-download').click();expect((await download).suggestedFilename()).toBe('kundli-report.html');
});
