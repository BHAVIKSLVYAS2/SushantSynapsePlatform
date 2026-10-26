const {editBirth}=require('../../../../tests/vedic-kundli-journey.cjs');
const {test,expect}=require('@playwright/test');
const {fillDate,fillTime}=require('../../../../tests/vedic-civil-input.cjs');
let server;
test.beforeAll(async()=>{server=await require('../production-server.cjs').start();});
test.afterAll(async()=>server.close());
async function enter(page){await editBirth(page,'#birth-date');await fillDate(page,'#birth-date','2000-01-01');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','12:15');await editBirth(page,'#birth-query');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();}
async function generate(page){await page.locator('form button[type=submit]').click();await expect(page.locator('#kundli-reading-title')).toBeVisible();await expect(page.locator('.kundli-input-panel')).not.toHaveAttribute('open','');}
async function edit(page){await page.locator('.kundli-result-actions button').first().click();await expect(page.locator('.kundli-input-panel')).toHaveAttribute('open','');}
for(const language of ['en','hi','gu'])test(`one Generate action, direct insights and editable details in ${language}`,async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(language=>localStorage.setItem('synapse-language',language),language);await page.setViewportSize({width:390,height:900});await page.goto(server.origin+'/rashifal-kundli');
 await expect(page.locator('#birth-name')).toHaveValue('');const generateBox=await page.locator('#birth-calculate').boundingBox();expect(generateBox.y+generateBox.height).toBeLessThanOrEqual(900);await page.screenshot({path:test.info().outputPath('entry-'+language+'.png')});await enter(page);await generate(page);await page.screenshot({path:test.info().outputPath('results-'+language+'.png')});
 await expect(page.locator('#kundli-reading-title')).toBeFocused();await expect(page.locator('.kundli-topic[data-status=available]')).toHaveCount(7);
 await page.locator('.kundli-quick-topics a[href="#kundli-career"]').click();await expect(page.locator('#kundli-career')).toBeFocused();
 await page.locator('.kundli-report-nav a[href="#kundli-calculations"]').click();await expect(page.locator('.vedic-charts')).toBeVisible();
 const numbers=await page.locator('[data-feature=positions] tr[data-body]').evaluateAll(rows=>rows.map(row=>[row.dataset.body,row.dataset.rashi]));
 await page.evaluate(()=>SynapseLanguage.set('gu'));expect(await page.locator('[data-feature=positions] tr[data-body]').evaluateAll(rows=>rows.map(row=>[row.dataset.body,row.dataset.rashi]))).toEqual(numbers);
 for(const width of [320,360,390,430,768,1024])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await edit(page);await expect(page.locator('#birth-date-year')).toHaveValue('2000');await editBirth(page,'#birth-name');await page.locator('#birth-name').fill('Updated');await expect(page.locator('#birth-results')).toBeEmpty();await generate(page);await expect(page.locator('#kundli-reading-title')).toContainText('Updated');
 const download=page.waitForEvent('download');await page.locator('.kundli-result-actions button').last().click();expect((await download).suggestedFilename()).toBe('kundli-report.html');expect(errors).toEqual([]);
});
test('saved profiles reopen in one tap, stay input-only and can be reused for matching after consent',async({page})=>{
 await page.goto(server.origin+'/rashifal-kundli');await editBirth(page,'#birth-name');await page.locator('#birth-name').fill('Family');await enter(page);await generate(page);await page.locator('#birth-save').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ritvayam.saved-kundli.v1')));expect(Object.keys(saved.records[0]).sort()).toEqual(['id','input','name']);
 await page.reload();await expect(page.locator('#birth-date')).toHaveValue('');await page.locator('.kundli-recent button').click();await expect(page.locator('#kundli-reading-title')).toContainText('Family');await expect(page.locator('.kundli-input-panel')).not.toHaveAttribute('open','');
 await page.goto(server.origin+'/rashifal-kundli/matching');await expect(page.locator('#match-a-saved')).toBeDisabled();await page.locator('#matching-consent').check();
 await page.locator('#match-a-saved').selectOption(saved.records[0].id);await page.locator('#match-b-saved').selectOption(saved.records[0].id);await expect(page.locator('#match-a-date-year')).toHaveValue('2000');await expect(page.locator('#match-b-place')).toHaveValue('geonames:1261481');
 await page.locator('#matching-review-button').click();await page.locator('#matching-calculate').click();await expect(page.locator('#matching-results')).not.toBeEmpty();await page.locator('#matching-consent').uncheck();await expect(page.locator('#matching-results')).toBeEmpty();await expect(page.locator('#match-a-date')).toHaveValue('');
});
test('unknown time remains explicit, invalid dates fail and rapid Generate/Clear cannot leave stale results',async({page})=>{
 await page.goto(server.origin+'/rashifal-kundli');await enter(page);await editBirth(page,'#birth-date-day');await page.locator('#birth-date-day').fill('32');await page.locator('form button[type=submit]').click();await expect(page.locator('#birth-results')).toBeEmpty();await expect(page.locator('#birth-date-day')).toBeFocused();
 await editBirth(page,'#birth-date-day');await page.locator('#birth-date-day').fill('1');await editBirth(page,'#birth-accuracy');await page.locator('#birth-accuracy').selectOption('unknown');await generate(page);await expect(page.locator('.kundli-topic[data-status=unavailable]')).toHaveCount(7);await expect(page.locator('.kundli-periods li')).toHaveCount(0);
 await edit(page);await editBirth(page,'#birth-accuracy');await page.locator('#birth-accuracy').selectOption('exact');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','12:15');await page.evaluate(()=>{document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit();document.querySelector('#birth-clear').click();});await expect(page.locator('#birth-results')).toBeEmpty();await expect(page.locator('#birth-date')).toHaveValue('');await expect(page.locator('.vedic-birth-app')).not.toHaveAttribute('aria-busy','true');await expect(page.locator('#birth-calculate')).toBeEnabled();
});
