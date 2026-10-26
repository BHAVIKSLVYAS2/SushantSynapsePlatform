const {fillDate,fillTime,openKundliCalculations}=require('../../../../tests/vedic-civil-input.cjs');
const {test,expect}=require('@playwright/test'),fs=require('node:fs');
let server,origin;test.beforeAll(async()=>{server=await require('../production-server.cjs').start();origin=server.origin;});test.afterAll(async()=>{await server.close();});
const script={hi:/[\u0900-\u097f]/,gu:/[\u0a80-\u0aff]/};
test('legacy Vedic preference migrates to the one shared header setting',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('synapse-language'))localStorage.setItem('synapse-vedic-language','gu');});
 await page.goto(origin+'/rashifal-kundli');await expect(page.locator('html')).toHaveAttribute('lang','gu');await expect(page.locator('[data-language-control]')).toHaveCount(1);
 expect(await page.evaluate(()=>localStorage.getItem('synapse-language'))).toBe('gu');expect(await page.evaluate(()=>localStorage.getItem('synapse-vedic-language'))).toBeNull();
});
async function birth(page){await page.locator('#birth-name').fill('Sun');await fillDate(page,'#birth-date','2000-01-01');await fillTime(page,'#birth-time','12:15');await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();await page.locator('form button[type=submit]').click();await page.locator('#birth-calculate').click();await openKundliCalculations(page);await expect(page.locator('[data-feature=dasha] table tbody tr')).toHaveCount(9);}
test('one three-option language preference covers every production page, navigation and reload',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r));
 await page.goto(origin+'/rashifal-kundli');await expect(page.locator('[data-interface-language]')).toHaveCount(3);await expect(page.locator('#vedic-language')).toHaveCount(0);
 for(const language of ['hi','gu','en']){
  await chooseLanguage(page,language);
  for(const route of ['','/rashifal','/matching','/time-machine']){
   await page.goto(origin+'/rashifal-kundli'+route);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('[data-interface-language='+language+']')).toHaveAttribute('aria-pressed','true');
   if(script[language]){expect(await page.locator('header').innerText()).toMatch(script[language]);expect(await page.locator('main h1,main h2').first().innerText()).toMatch(script[language]);expect(await page.title()).toMatch(script[language]);}
   for(const node of await page.locator('#birth-language,#rashifal-language,#matching-language,#tm-language').all())await expect(node).toBeHidden();
   await page.setViewportSize({width:320,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.reload();await expect(page.locator('html')).toHaveAttribute('lang',language);
 }
 expect(errors).toEqual([]);expect(requests.every(r=>r.method()==='GET'&&r.url().startsWith(origin)&&!new URL(r.url()).search)).toBe(true);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual(['synapse-language']);expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
});
for(const language of ['hi','gu'])test(language+' Kundli details, advanced factors, warnings and offline export use native text without changing numbers',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/rashifal-kundli');await birth(page);
 const values=()=>page.locator('[data-feature=positions] tr[data-body]').evaluateAll(rows=>rows.map(r=>[r.dataset.body,r.dataset.rashi,r.dataset.nakshatra]));const before=await values();
 await chooseLanguage(page,language);expect(await values()).toEqual(before);await expect(page.locator('#birth-name')).toHaveValue('Sun');await expect(page.locator('#birth-results h2').first()).toContainText('Sun');
 await expect(page.locator('#tm-language')).toBeHidden();expect(await page.locator('#birth-place option:checked').innerText()).toMatch(script[language]);
 await page.locator('#rules-evaluate').click();expect(await page.locator('#rules-results').innerText()).toMatch(script[language]);for(const p of await page.locator('#rules-results>p').all())await expect(p).not.toContainText('geometric base');
 await page.locator('#advanced-analyze').click();await expect(page.locator('[data-kind=ashtakavarga]')).toBeVisible();await page.locator('.vedic-advanced details').filter({has:page.locator('summary')}).first().locator('summary').click();
 expect(await page.locator('.vedic-advanced details').first().innerText()).toMatch(script[language]);await expect(page.locator('.vedic-advanced')).not.toContainText('Contributor');await expect(page.locator('.vedic-advanced')).not.toContainText('individual contribution details (English)');
 await page.locator('#kundli-provenance').locator('summary').click();expect(await page.locator('#kundli-provenance li').first().innerText()).toMatch(script[language]);
 const download=page.waitForEvent('download');await page.locator('.vedic-export button').filter({hasText:language==='hi'?'डाउनलोड':'ડાઉનલોડ'}).click();const file=await (await download).path(),html=fs.readFileSync(file,'utf8');expect(html).toContain('lang="'+language+'"');expect(html).toMatch(script[language]);expect(html).not.toContain('<title>Kundli report</title>');expect(html).not.toContain('New Delhi');expect(html).not.toContain('<dt>profile</dt>');expect(html).not.toContain('Longitude °');
 await page.setViewportSize({width:390,height:1000});await page.evaluate(t=>SynapseTheme.write(t),'dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'.publish/vedic-language-'+language+'.png',fullPage:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/vedic-language-'+language+'-viewport.png'});expect(errors).toEqual([]);
});
test('Rashifal reading language changes while prompt identity and planetary factors remain unchanged',async({page})=>{
 await page.goto(origin+'/rashifal-kundli/rashifal');await page.locator('#rashifal-rashi').selectOption('1');await page.locator('[data-view=weekly]').click();await expect(page.locator('.rashifal-reading section')).toHaveCount(2);
 const ids=()=>page.locator('[data-sentence]').evaluateAll(n=>n.map(x=>x.dataset.sentence)),before=await ids();
 for(const language of ['hi','gu','en']){await chooseLanguage(page,language);await expect(page.locator('.rashifal-reading')).toHaveAttribute('lang',language);await page.locator('.rashifal-calculations summary').click();expect(await ids()).toEqual(before);if(script[language])expect(await page.locator('.rashifal-reading').innerText()).toMatch(script[language]);await expect(page.locator('#rashifal-fallback')).not.toBeEmpty();}
});
test('Matching native rule definitions preserve consent, raw scores and both private records',async({page})=>{
 await page.goto(origin+'/rashifal-kundli/matching');await page.locator('#matching-consent').check();for(const axis of ['a','b']){await fillDate(page,`#match-${axis}-date`,'2000-01-01');await fillTime(page,`#match-${axis}-time`,'12:15');await page.locator(`#match-${axis}-query`).fill('New Delhi');await page.locator(`#match-${axis}-query-options [data-place-id="geonames:1261481"]`).click();}
 await page.locator('#matching-review-button').click();await page.locator('#matching-calculate').click();await expect(page.locator('#matching-results tbody tr')).toHaveCount(8);
 const scores=()=>page.locator('#matching-results [data-score]').evaluateAll(n=>n.map(x=>[x.dataset.component,x.dataset.score])),before=await scores();
 for(const language of ['hi','gu']){await chooseLanguage(page,language);expect(await scores()).toEqual(before);await expect(page.locator('#matching-consent')).toBeChecked();expect(await page.locator('#matching-results tbody').innerText()).toMatch(script[language]);await expect(page.locator('#matching-results tbody')).not.toContainText('Moon-sign lords');await expect(page.locator('#match-a-date')).toHaveValue('2000-01-01');}
 await page.locator('#matching-consent').uncheck();await expect(page.locator('#matching-results')).toBeEmpty();expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
});
test('Time Machine native Panchang and statuses preserve the selected instant; validation and denied storage stay usable',async({page})=>{
 await page.goto(origin+'/rashifal-kundli/time-machine');await fillDate(page,'#tm-date','2027-01-01');await fillTime(page,'#tm-time','12:15');await page.locator('#tm-query').fill('New Delhi');await page.locator('#tm-query-options [data-place-id="geonames:1261481"]').click();await page.locator('#tm-review-button').click();await page.locator('#tm-calculate').click();await expect(page.locator('#tm-results table').first()).toBeVisible();const before=await page.locator('#tm-results tbody').first().innerText();
 for(const language of ['hi','gu']){await chooseLanguage(page,language);await expect(page.locator('#tm-date')).toHaveValue('2027-01-01');await expect(page.locator('#tm-time')).toHaveValue('12:15');expect(await page.locator('#tm-results').innerText()).toMatch(script[language]);await expect(page.locator('#tm-results')).not.toContainText('Longitude °');await expect(page.locator('#tm-results')).not.toContainText('Friday');}
 expect(before).toContain('Sun');await fillDate(page,'#tm-date','');await page.locator('#tm-review-button').click();expect(await page.locator('#tm-date-day').evaluate(n=>n.validationMessage)).toMatch(script.gu);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('blocked');};});await chooseLanguage(page,'hi');await expect(page.locator('html')).toHaveAttribute('lang','hi');
});

async function chooseLanguage(page,language){await page.locator('.platform-language summary').click();await page.locator('[data-interface-language='+language+']').click();}
