const {editBirth}=require('../../../../tests/vedic-kundli-journey.cjs');
const {test,expect}=require('@playwright/test');const {fillDate,fillTime}=require('../../../../tests/vedic-civil-input.cjs');let server;

for(const language of ['hi','gu'])test(`Kundali generates a complete ${language} reading and matching private printable download`,async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(language=>localStorage.setItem('synapse-language',language),language);await page.setViewportSize({width:390,height:900});await page.goto(server.origin+'/rashifal-kundli');
 await expect(page.locator('html')).toHaveAttribute('lang',language);await editBirth(page,'#birth-name');await page.locator('#birth-name').fill('Private Sample');await editBirth(page,'#birth-date');await fillDate(page,'#birth-date','2000-01-01');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','12:15');await editBirth(page,'#birth-query');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();await page.locator('form button[type=submit]').click();if(language==='hi')await expect(page.locator('.jyotish-granth')).toHaveAttribute('data-audience','public');else await expect(page.locator('.kundli-reading')).toHaveAttribute('data-reading-prose','kundli-prose-6');
 const script=language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/;
 const prose=await page.locator(language==='hi'?'.reading-public p':'.kundli-topic>p:not(.kundli-topic-action)').allTextContents();
 for(const paragraph of prose){expect(paragraph).toMatch(/[.!।]$/);expect(paragraph).not.toMatch(/undefined|\[object Object\]/);}
 await expect(page.locator('.kundli-topic-action')).toHaveCount(0);
 if(language==='hi')await expect(page.locator('#kundli-future .reading-public p')).toHaveCount(3);else expect(await page.locator('.kundli-periods li').first().locator('p').last().innerText()).toMatch(script);
 await openSection(page,'topics');await page.locator('#kundli-career').screenshot({path:test.info().outputPath('consultation-career-'+language+'.png')});
 for(const card of await page.locator('.kundli-topic[data-status=available]:visible').all()){expect(await card.locator('h3').innerText()).toMatch(script);expect(await card.locator(language==='hi'?'.reading-public p':'.kundli-topic-lead').first().innerText()).toMatch(script);}
 for(const width of [320,360,390,430,768,1024])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});await page.locator('#kundli-relationships').screenshot({path:test.info().outputPath('relationships-'+language+'.png')});
 await openSection(page,'report');
 await page.locator('.vedic-export details>summary').click();
 const preview=page.locator('.vedic-export-preview');
 await expect(preview.locator('[data-reading-topic]')).toHaveCount(language==='hi'?12:8);
 await expect(preview).not.toContainText('Private Sample');
 await expect(preview).not.toContainText('undefined');
 if(language==='hi'){
  const periods=await page.locator('#kundli-future .reading-public p').allTextContents();
  for(const paragraph of periods)await expect(preview.locator('[data-reading-topic=future]')).toContainText(paragraph);
 }
 const pending=page.waitForEvent('download');await page.locator('#export-download').click();
 const download=await pending;expect(download.suggestedFilename()).toBe('kundli-report.pdf');
 const file=test.info().outputPath('kundali-'+language+'.pdf');await download.saveAs(file);
 expect(require('node:fs').readFileSync(file).subarray(0,5).toString()).toBe('%PDF-');
 await page.emulateMedia({media:'print'});await expect(page.locator('.kundli-reading')).toBeHidden();await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));await expect(page.locator('.report-everyday')).toBeVisible();await expect(page.locator('.report-everyday [data-reading-topic]')).toHaveCount(language==='hi'?12:8);await page.emulateMedia({media:'screen'});await page.evaluate(()=>dispatchEvent(new Event('afterprint')));expect(errors).toEqual([]);
});
async function openSection(page,id){
 const button=page.locator(`[data-kundli-section=${id}]`);
 if(!await button.isVisible())await page.locator('.kundli-more-nav>summary').click();
 await button.click();
}
test.beforeAll(async()=>{server=await require('../production-server.cjs').start();});test.afterAll(async()=>{await server.close();});

test('production matching explains eight factors and private partnership placements in every language and theme',async({page})=>{
 test.setTimeout(120000);const sent=[],errors=[];page.on('request',r=>{if(['fetch','xhr','ping'].includes(r.resourceType()))sent.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.origin+'/rashifal-kundli/matching');await page.locator('#matching-consent').check();
 for(const axis of ['a','b']){await fillDate(page,'#match-'+axis+'-date','2000-01-01');await fillTime(page,'#match-'+axis+'-time','12:15');await page.locator('#match-'+axis+'-query').fill('New Delhi');await page.locator('#match-'+axis+'-query-options [data-place-id="geonames:1261481"]').click();}
 await page.locator('#matching-review-button').click();await page.locator('#matching-calculate').click();await expect(page.locator('[data-matching-story]')).toHaveCount(8);await expect(page.locator('[data-matching-chart][data-status=available]')).toHaveCount(2);
 const scores=await page.locator('#matching-results tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.score));
 await expect(page.locator('[data-matching-behaviour][data-status=available]')).toHaveCount(2);
 const behaviourRules=await page.locator('[data-behaviour-rule]').evaluateAll(rows=>rows.map(r=>r.dataset.behaviourRule));expect(behaviourRules).toHaveLength(4);
 for(const language of ['en','hi','gu']){
  await page.evaluate(l=>SynapseLanguage.set(l),language);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('[data-matching-story]')).toHaveCount(8);
  await expect(page.locator('.matching-scope-note')).toHaveCount(1);await expect(page.locator('.matching-scope-note')).toBeVisible();
  await expect(page.locator('#matching-results')).not.toContainText({en:'verdict',hi:'फैसला नहीं',gu:'ચુકાદો નથી'}[language]);
  await expect(page.locator('#matching-results')).not.toContainText({en:'fertility',hi:'संतान',gu:'સંતાન'}[language]);
  expect(await page.locator('[data-behaviour-rule]').evaluateAll(rows=>rows.map(r=>r.dataset.behaviourRule))).toEqual(behaviourRules);
  for(const axis of ['0','1']){const person=page.locator('[data-matching-behaviour="'+axis+'"]');await expect(person.locator('[data-behaviour-rule]')).toHaveCount(2);await expect(person.locator('small')).toHaveCount(2);expect(await person.innerText()).toMatch(language==='hi'?/[\u0900-\u097f]/:language==='gu'?/[\u0a80-\u0aff]/:/Moon/);}
  const text=await page.locator('.matching-chart-context').innerText();expect(text).toMatch(language==='hi'?/[\u0900-\u097f]/:language==='gu'?/[\u0a80-\u0aff]/:/Mercury/);expect(text).not.toMatch(/undefined|NaN|\[object Object\]/);
  expect(await page.locator('#matching-results tbody tr').evaluateAll(rows=>rows.map(r=>r.dataset.score))).toEqual(scores);
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:900});await page.locator('[data-matching-chart="0"]').screenshot({path:test.info().outputPath('planet-matching-'+language+'.png')});
 }
 await page.locator('#matching-consent').uncheck();await expect(page.locator('#matching-results')).toBeEmpty();expect(sent).toEqual([]);expect(errors).toEqual([]);
});
test('production Kundli presents native everyday readings before calculations and preserves private saved inputs',async({page})=>{
 const sent=[],errors=[];page.on('request',r=>{if(['fetch','xhr','ping'].includes(r.resourceType()))sent.push(r.url());});page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('synapse-language','gu'));await page.setViewportSize({width:390,height:900});await page.goto(server.origin+'/rashifal-kundli');
 await editBirth(page,'#birth-date');await fillDate(page,'#birth-date','2000-01-01');await editBirth(page,'#birth-time');await fillTime(page,'#birth-time','12:15');await editBirth(page,'#birth-query');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();await page.locator('form button[type=submit]').click();await page.locator('#birth-save').click();
 await openSection(page,'overview');await expect(page.locator('#kundli-reading-title')).toBeVisible();expect(await page.locator('#kundli-reading-title').innerText()).toMatch(/[\u0a80-\u0aff]/);await expect(page.locator('.kundli-topic[data-status=available]')).toHaveCount(7);await expect(page.locator('.kundli-periods li').first()).toHaveAttribute('data-major','Saturn');await expect(page.locator('details[data-kundli-group][open]')).toHaveCount(1);await expect(page.locator('.vedic-charts')).toBeHidden();await expect(page.locator('#birth-language')).toBeHidden();
 for(const width of [320,360,390,430,768,1024])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});await openSection(page,'overview');await page.locator('#kundli-reading-title').evaluate(node=>node.scrollIntoView({block:'start'}));await page.screenshot({path:test.info().outputPath('kundli-everyday-gu-mobile.png')});
 await page.locator('[data-kundli-section=calculations]').click();await expect(page.locator('.vedic-charts')).toBeVisible();const numbers=await page.locator('[data-feature=positions] tr[data-body]').evaluateAll(rows=>rows.map(row=>[row.dataset.body,row.dataset.rashi]));await page.evaluate(()=>SynapseLanguage.set('hi'));await expect(page.locator('html')).toHaveAttribute('lang','hi');await expect(page.locator('#kundli-calculations')).toHaveAttribute('open','');expect(await page.locator('[data-feature=positions] tr[data-body]').evaluateAll(rows=>rows.map(row=>[row.dataset.body,row.dataset.rashi]))).toEqual(numbers);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ritvayam.saved-kundli.v1')));expect(Object.keys(saved.records[0]).sort()).toEqual(['id','input','name']);expect(JSON.stringify(saved)).not.toContain('readingModel');expect(sent).toEqual([]);expect(errors).toEqual([]);
});
