const {fillDate,fillTime,openKundliCalculations}=require('../../../tests/vedic-civil-input.cjs');
const {test,expect}=require('@playwright/test');
const {createPreviewServer}=require('../../../infrastructure/preview-vedic-charts.cjs');
const fs=require('node:fs/promises');
let server;

test('P17 private preview headers and Ritual guide navigation carry no birth details in every language',async({page})=>{
 const requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));const response=await page.goto(server.origin);expect(response.headers()['referrer-policy']).toBe('no-referrer');expect(response.headers()['permissions-policy']).toContain('geolocation=()');await fill(page);await calculate(page);
 for(const language of ['en','hi','gu']){await page.locator('#birth-language').selectOption(language);const link=page.locator('#vedic-ritual-guides');await expect(link).toHaveAttribute('href','https://apps.sushantsynapse.com/ritual-assist');await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('referrerpolicy','no-referrer');await expect(link).toHaveAttribute('target','_blank');}
 expect(requests.every(r=>r.url.startsWith(server.origin)&&r.method==='GET')).toBe(true);expect(requests.some(r=>/2000|geonames/.test(r.url))).toBe(false);await page.locator('form button[type=button]').click();await expect(page.locator('#vedic-ritual-guides')).toHaveCount(0);
});

test.describe('P16 advanced candidates',()=>{
 async function analyze(page){await page.locator('#advanced-analyze').click();await expect(page.locator('#advanced-results table[data-kind=uccha] tbody tr')).toHaveCount(7);}
 test('D7/D10/D12 graphics agree with numbers, raw counts and locale/theme/print privacy',async({page})=>{
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));await page.goto(server.origin);await fill(page);await calculate(page);await analyze(page);
  for(const type of ['D7','D10','D12'])await expect(page.locator(`#advanced-results [data-chart=${type}]`)).toHaveAttribute('data-status','available');
  await expect(page.locator('.vedic-advanced')).toContainText('Full Shadbala is unavailable');const chart=page.locator('.vedic-advanced .vedic-charts');
  const numbers=()=>page.locator('#advanced-results table[data-kind] tbody tr').evaluateAll(rows=>rows.map(r=>[r.dataset.body,r.dataset.values]));const original=await numbers();
  for(const type of ['D7','D10','D12']){await chart.locator(`button[data-value=${type}]`).click();const table=await chart.locator('.vedic-chart-table tbody tr').evaluateAll(rows=>rows.map(r=>[Number(r.dataset.house),Number(r.dataset.rashi)]));for(const style of ['north','south']){await chart.locator(`button[data-value=${style}]`).click();const graphic=await chart.locator('svg [data-house]').evaluateAll(cells=>Object.fromEntries(cells.map(c=>[c.dataset.house,Number(c.dataset.rashi)])));for(const [house,rashi]of table)expect(graphic[house]).toBe(rashi);}}
  await expect(page.locator('table[data-kind=ashtakavarga] tr[data-body=SAV]')).toContainText('337');
  for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await analyze(page);expect(await numbers()).toEqual(original);}
  for(const width of [320,390,1440])for(const theme of ['light','dark','system']){await page.setViewportSize({width,height:1000});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:1000});await page.locator('#theme').selectOption('light');await page.locator('.vedic-advanced').screenshot({path:'.publish/vedic-p16-advanced-390-gu.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});await expect(page.locator('.vedic-advanced')).toBeHidden();await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  expect(requests.every(r=>r.url.startsWith(server.origin)&&r.method==='GET')).toBe(true);expect(requests.some(r=>/2000|geonames/.test(r.url))).toBe(false);expect(errors).toEqual([]);expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);
 });
 test('independent withholding, unknown birth, pending clear and parent edits remove private advanced results',async({page})=>{
  await page.goto(server.origin);await fill(page);await fillTime(page,'#birth-time','12:00');await calculate(page);await analyze(page);await expect(page.locator('[data-chart=D7]')).toHaveAttribute('data-status','unavailable');await expect(page.locator('[data-chart=D10]')).toHaveAttribute('data-status','available');await expect(page.locator('table[data-kind=ashtakavarga]')).toBeVisible();
  await page.evaluate(()=>{document.querySelector('#advanced-analyze').click();document.querySelector('#advanced-clear').click();});await expect(page.locator('#advanced-results')).toBeEmpty();await expect(page.locator('#advanced-analyze')).toBeEnabled();
  await page.locator('#birth-accuracy').selectOption('unknown');await calculate(page);await page.locator('#advanced-analyze').click();await expect(page.locator('.vedic-advanced [role=status]')).toContainText('Unavailable');await expect(page.locator('#advanced-results')).toBeEmpty();
  await fillDate(page,'#birth-date','2001-01-01');await expect(page.locator('.vedic-advanced')).toHaveCount(0);await page.locator('form button[type=button]').click();await expect(page.locator('#birth-date')).toHaveValue('');expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
 });
});

test.describe('P15 private rulebook previews',()=>{
 let matchingServer;test.beforeAll(async()=>{matchingServer=await createPreviewServer(0,{matching:true});});test.afterAll(async()=>{await matchingServer?.close();});
 async function enterPair(page){await page.locator('#matching-consent').check();for(const axis of ['a','b']){await fillDate(page,`#match-${axis}-date`,'2000-01-01');await fillTime(page,`#match-${axis}-time`,'12:15');await page.locator(`#match-${axis}-query`).fill('New Delhi');await page.locator(`#match-${axis}-place`).selectOption('geonames:1261481');}}
 async function compare(page){await page.locator('#matching-review-button').click();await expect(page.locator('#matching-review')).toContainText('2000-01-01T06:45:00.000Z');await page.locator('#matching-calculate').click();await expect(page.locator('#matching-results tbody tr')).toHaveCount(8);}
 test('consented dual review, eight factors, locale parity, themes and no birth requests/storage',async({page})=>{
  const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(e.message));await page.goto(matchingServer.origin);
  await expect(page.locator('#match-b-date')).toBeDisabled();await expect(page.locator('#matching-review-button')).toBeDisabled();await enterPair(page);await expect(page.locator('#matching-results')).toBeEmpty();await compare(page);await expect(page.locator('#matching-results h2')).toContainText('28 / 36');await expect(page.locator('#matching-results')).toContainText('No marriage verdict');
  const values=()=>page.locator('#matching-results tbody tr').evaluateAll(rows=>rows.map(r=>[r.dataset.component,r.dataset.score]));const original=await values();expect(original.map(r=>Number(r[1]))).toEqual([1,2,3,4,5,6,7,0]);
  for(const language of ['hi','gu']){await page.locator('#matching-language').selectOption(language);expect(await values()).toEqual(original);}
  for(const width of [320,390,1440])for(const theme of ['light','dark','system']){await page.setViewportSize({width,height:1000});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:1000});await page.locator('#theme').selectOption('light');await page.locator('#matching-app').screenshot({path:'.publish/vedic-p15-matching-390-gu.png'});
  await page.locator('#matching-swap').click();await expect(page.locator('#matching-results')).toBeEmpty();await expect(page.locator('#matching-review')).toBeEmpty();await compare(page);
  await page.locator('#matching-clear').click();await expect(page.locator('#match-a-date')).toHaveValue('');await expect(page.locator('#match-b-date')).toHaveValue('');await expect(page.locator('#matching-results')).toBeEmpty();await expect(page.locator('#matching-consent')).not.toBeChecked();
  expect(requests.every(r=>r.url.startsWith(matchingServer.origin)&&r.method==='GET')).toBe(true);expect(requests.some(r=>/2000|geonames/.test(r.url))).toBe(false);expect(errors).toEqual([]);expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
 });
 test('unknown/approximate birth stays withheld, edits remove stale scores and revocation clears both records',async({page})=>{
  await page.goto(matchingServer.origin);await enterPair(page);await page.locator('#match-b-accuracy').selectOption('unknown');await page.locator('#matching-review-button').click();await expect(page.getByRole('status')).toContainText('Unknown/approximate');await expect(page.locator('#matching-calculate')).toHaveCount(0);
  await page.locator('#match-b-accuracy').selectOption('approximate');await fillTime(page,'#match-b-time','12:15');await page.locator('#matching-review-button').click();await expect(page.locator('#matching-calculate')).toHaveCount(0);
  await page.locator('#match-b-accuracy').selectOption('exact');await compare(page);await fillTime(page,'#match-b-time','12:16');await expect(page.locator('#matching-results')).toBeEmpty();await expect(page.locator('#matching-review')).toBeEmpty();
  await page.locator('#matching-consent').uncheck();await expect(page.locator('#match-a-date')).toHaveValue('');await expect(page.locator('#match-b-date')).toHaveValue('');await expect(page.locator('#match-b-place')).toHaveValue('');await expect(page.locator('#match-b-date')).toBeDisabled();await expect(page.locator('#matching-results')).toBeEmpty();
  await enterPair(page);await page.locator('#matching-review-button').click();await page.evaluate(()=>{document.querySelector('#matching-calculate').click();document.querySelector('#matching-clear').click();});await expect(page.locator('#matching-results')).toBeEmpty();await expect(page.locator('#matching-review')).toBeEmpty();await expect(page.locator('#match-b-date')).toHaveValue('');
  await enterPair(page);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect(page.locator('#matching-consent')).not.toBeChecked();await expect(page.locator('#match-a-date')).toHaveValue('');
 });
 test('birth Yoga/Mangal panel exposes geometric bases, resets variants, excludes print and withholds uncertain input',async({page})=>{
  await page.goto(server.origin);await fill(page);await calculate(page);await page.locator('#rules-evaluate').click();await expect(page.locator('#rules-results [data-rule]')).toHaveCount(2);await expect(page.locator('#rules-results [data-reference]')).toHaveCount(3);await expect(page.locator('#rules-results')).toContainText('Final Yoga/Dosha assessment withheld');
  const values=()=>page.locator('#rules-results [data-rule]').evaluateAll(rows=>rows.map(r=>[r.dataset.rule,r.dataset.matches]));const original=await values();
  for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await page.locator('#rules-evaluate').click();expect(await values()).toEqual(original);}
  await page.locator('#rules-variant').selectOption('mangal-six');await expect(page.locator('#rules-results')).toBeEmpty();await page.locator('#rules-evaluate').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});await expect(page.locator('.vedic-rulebook')).toBeHidden();await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.locator('#birth-accuracy').selectOption('unknown');await calculate(page);await page.locator('#rules-evaluate').click();await expect(page.locator('#rules-results [data-rule]')).toHaveCount(0);await expect(page.locator('#rules-results')).not.toBeEmpty();await page.locator('form button[type=button]').click();await expect(page.locator('.vedic-rulebook')).toHaveCount(0);
 });
});

test.describe('P14 interval sensitivity',()=>{
 async function analyze(page){await page.locator('#sensitivity-analyze').click();await expect(page.locator('#sensitivity-results [data-component=moonRashi]')).toBeVisible({timeout:30000});}
 test('candidate interval statuses, numeric locale parity, mobile themes and print isolation',async({page})=>{
  const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(e.message));await page.goto(server.origin);await fill(page);await page.locator('#birth-accuracy').selectOption('approximate');await page.locator('#birth-precision').fill('10');await calculate(page);await analyze(page);
  await expect(page.locator('[data-component=moonRashi]')).toHaveAttribute('data-status','stable');await expect(page.locator('[data-component=d9]')).toHaveAttribute('data-status','changes-within-interval');await expect(page.locator('#sensitivity-results')).toContainText('precise Dasha timeline remains withheld');
  const values=()=>page.locator('#sensitivity-results [data-component]').evaluateAll(rows=>rows.map(r=>[r.dataset.component,r.dataset.status,r.dataset.values]));const original=await values();
  for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await analyze(page);expect(await values()).toEqual(original);}
  for(const width of [320,390,1440])for(const theme of ['light','dark','system']){await page.setViewportSize({width,height:1000});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:1000});await page.locator('#theme').selectOption('light');await page.locator('.vedic-sensitivity').screenshot({path:'.publish/vedic-p14-sensitivity-390-gu.png'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});await expect(page.locator('.vedic-sensitivity')).toBeHidden();await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  expect(requests.every(r=>r.url.startsWith(server.origin)&&r.method==='GET')).toBe(true);expect(requests.some(r=>/2000|geonames|private/.test(r.url))).toBe(false);expect(errors).toEqual([]);
 });
 test('unknown-day changes, responsive Worker cancellation and birth clear remove private analysis',async({page})=>{
  await page.goto(server.origin);await fill(page);await page.locator('#birth-accuracy').selectOption('unknown');await calculate(page);await analyze(page);
  await expect(page.locator('[data-component=lagnaRashi]')).toHaveAttribute('data-status','changes-within-interval');await expect(page.locator('#sensitivity-results')).toContainText('No single birth epoch');await expect(page.locator('svg')).toHaveCount(0);await expect(page.locator('.vedic-dasha')).toHaveCount(0);
  await page.locator('#sensitivity-analyze').click();await page.locator('#sensitivity-clear').click();await expect(page.locator('#sensitivity-results')).toBeEmpty();await expect(page.locator('#sensitivity-analyze')).toBeEnabled();
  await page.locator('#sensitivity-analyze').click();await page.locator('form button[type=button]').click();await expect(page.locator('.vedic-sensitivity')).toHaveCount(0);await expect(page.locator('#birth-date')).toHaveValue('');
  expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
 });
});

test.describe('P13 Time Machine',()=>{
 let tmServer;test.beforeAll(async()=>{tmServer=await createPreviewServer(0,{timeMachine:true});});test.afterAll(async()=>{await tmServer?.close();});
 async function fillExploration(page){await fillDate(page,'#tm-date','2030-01-01');await fillTime(page,'#tm-time','12:15');await page.locator('#tm-query').fill('New Delhi');await page.locator('#tm-place').selectOption('geonames:1261481');}
 test('explicit future exploration, reference counts, locale/theme parity and stale-input clearing',async({page})=>{
  const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));await page.goto(tmServer.origin);
  await expect(page.locator('#tm-date')).toHaveValue('');await expect(page.locator('#tm-time')).toHaveValue('');await page.locator('#tm-review-button').click();await expect(page.locator('#tm-calculate')).toHaveCount(0);
  await fillExploration(page);await page.locator('#tm-reference').selectOption('manual-moon');await page.locator('#tm-referenceRashi').selectOption('12');
  await page.locator('#tm-review-button').click();await expect(page.locator('section#tm-review')).toContainText('2030-01-01T06:45:00.000Z');await expect(page.locator('#tm-results')).toBeEmpty();await page.locator('#tm-calculate').click();
  await expect(page.locator('#tm-results .tm-table')).toHaveCount(2);await expect(page.locator('#tm-results')).toContainText('manual-moon');
  const values=()=>page.locator('#tm-results .tm-table').first().locator('tbody tr').evaluateAll(rows=>rows.map(r=>[r.dataset.body,...[...r.querySelectorAll('td')].slice(1).map(c=>c.textContent.match(/\((\d+)\)$/)?.[1]??c.textContent)]));const original=await values();
  for(const language of ['hi','gu']){await page.locator('#tm-language').selectOption(language);expect(await values()).toEqual(original);}
  for(const width of [320,390,1440])for(const theme of ['light','dark','system']){await page.setViewportSize({width,height:1000});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:1000});await page.locator('#theme').selectOption('light');await page.locator('section#tm-review').screenshot({path:'.publish/vedic-p13-review-390-gu.png'});await page.locator('#tm-results').screenshot({path:'.publish/vedic-p13-results-390-gu.png'});
  await page.locator('#tm-next').click();await expect(page.locator('#tm-date')).toHaveValue('2030-01-02');await expect(page.locator('#tm-results')).toBeEmpty();await expect(page.locator('#tm-calculate')).toHaveCount(0);
  await page.locator('#tm-query').fill('Rampur');await expect(page.locator('#tm-place')).toHaveValue('');expect(await page.locator('#tm-place option').count()).toBeGreaterThan(2);
  expect(requests.every(url=>url.startsWith(tmServer.origin))).toBe(true);expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);expect(page.url()).toBe(tmServer.origin+'/');expect(errors).toEqual([]);
  await page.reload();await expect(page.locator('#tm-date')).toHaveValue('');await expect(page.locator('#tm-time')).toHaveValue('');
 });
 test('birth comparison is opt-in, invalid birth reference stays withheld, and print excludes exploration',async({page})=>{
  await page.goto(server.origin);await fill(page);await calculate(page);await fillExploration(page);await page.locator('#tm-reference').selectOption('birth-moon');
  await page.locator('#tm-review-button').click();await page.locator('#tm-calculate').click();await expect(page.locator('#tm-results .tm-table')).toHaveCount(3);await expect(page.locator('#tm-results')).toContainText('birth-moon');
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});await expect(page.locator('.vedic-time-machine')).toBeHidden();await expect(page.locator('.vedic-export article')).toBeVisible();await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.locator('#birth-accuracy').selectOption('unknown');await calculate(page);await fillExploration(page);await page.locator('#tm-reference').selectOption('birth-lagna');await page.locator('#tm-review-button').click();await page.locator('#tm-calculate').click();
  await expect(page.locator('#tm-results')).toContainText('UNSTABLE_BIRTH_TIME');await expect(page.locator('#tm-results .tm-table')).toHaveCount(1);
  await page.locator('form button[type=button]').click();await expect(page.locator('.vedic-time-machine')).toHaveCount(0);
 });
 test('clear cancels pending exploration and history navigation restores no input',async({page})=>{
  await page.goto(tmServer.origin);await fillExploration(page);await page.locator('#tm-review-button').click();await page.evaluate(()=>{document.querySelector('#tm-calculate').click();document.querySelector('#tm-clear').click();});await expect(page.locator('#tm-results')).toBeEmpty();
  await fillExploration(page);await page.locator('#tm-review-button').click();await page.locator('#tm-calculate').click();await expect(page.locator('#tm-results .tm-table').first()).toBeVisible();await page.goto('about:blank');await page.goBack();await expect(page.locator('#tm-date')).toHaveValue('');await expect(page.locator('#tm-results')).toBeEmpty();
 });
});

test('P11 birth Panchang, sourced names, explicit yearly candidates and private ICS work locally',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.origin);await fill(page);await page.locator('#birth-name').fill('P11 Secret');await calculate(page);
 const panel=page.locator('.vedic-traditions');await expect(panel).toContainText('Margashirsha');await expect(panel).toContainText('Krishna · Ekadashi (11)');
 await expect(panel).toContainText('Tara');await panel.getByRole('button',{name:'Copy name',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('Tara');
 await page.locator('#name-match').uncheck();await page.locator('#name-query').fill('sun');await expect(panel).toContainText('Ravi');await page.locator('#name-script').selectOption('gu');await expect(panel).toContainText('રવિ');
 await page.locator('#observance-year').fill('2027');await page.locator('#observance-calculate').click();await expect(page.locator('#observance-ics')).toHaveCount(0);
 await page.locator('#observance-rule').selectOption('AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1');await page.locator('#observance-calculate').click();
 await expect(panel).toContainText('2027-01-03',{timeout:15000});await expect(panel).toContainText('2027-12-23');
 const downloadEvent=page.waitForEvent('download');await page.locator('#observance-ics').click();const download=await downloadEvent;
 expect(download.suggestedFilename()).toBe('tithi-candidates.ics');const ics=await fs.readFile(await download.path(),'utf8');
 expect(ics).toContain('DTSTART;VALUE=DATE:20270103');for(const secret of ['P11 Secret','2000-01-01','12:15','New Delhi','geonames'])expect(ics).not.toContain(secret);
 await page.locator('#observance-query').fill('Rampur');await expect(page.locator('#observance-place')).toHaveValue('');await expect(page.locator('#observance-ics')).toHaveCount(0);
 for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await expect(page.locator('#observance-rule')).toHaveValue('');await page.setViewportSize({width:320,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('#theme').selectOption('dark');await panel.screenshot({path:'.publish/vedic-p11-traditions-320-gu.png'});
 expect(requests.every(url=>url.startsWith(server.origin))).toBe(true);expect(errors).toEqual([]);
 await page.locator('form button[type=button]').click();await expect(panel).toHaveCount(0);await expect(page.locator('#birth-date')).toHaveValue('');
});

test('P11 unknown time withholds exact Panchang/calendar while allowing curated-name browsing',async({page})=>{
 await page.goto(server.origin);await fill(page);await page.locator('#birth-accuracy').selectOption('unknown');await calculate(page);
 const panel=page.locator('.vedic-traditions');await expect(panel).toContainText('UNSTABLE_BIRTH_TIME');await expect(page.locator('#observance-calculate')).toBeDisabled();
 await expect(page.locator('#name-match')).toBeDisabled();await expect(panel).toContainText('Ravi');await expect(panel).toContainText('Tara');
 await page.locator('#birth-accuracy').selectOption('exact');await fillTime(page,'#birth-time','12:15');await calculate(page);
 await page.locator('#observance-rule').selectOption('AMANTA_FIRST_SUNRISE_SKIP_MISSING_V1');await page.locator('#observance-year').fill('2027');
 await page.evaluate(()=>{document.querySelector('#observance-calculate').click();document.querySelector('form button[type=button]').click();});
 await expect(page.locator('#birth-results')).toBeEmpty();
});

test('P10 download is redacted, standalone, offline and printable; identity is explicit',async({page,context})=>{
 await page.goto(server.origin);await fill(page);await page.locator('#birth-name').fill('Private Export Person');await calculate(page);
 const exportRoot=page.locator('.vedic-export');await expect(page.locator('#export-identity')).not.toBeChecked();
 await exportRoot.locator('summary').click();await expect(exportRoot.locator('article')).not.toContainText('Private Export Person');
 let event=page.waitForEvent('download');await page.locator('#export-download').click();let download=await event;
 expect(download.suggestedFilename()).toBe('kundli-report.html');const html=await fs.readFile(await download.path(),'utf8');
 for(const value of ['Private Export Person','2000-01-01','12:15','geonames:1261481','New Delhi'])expect(html).not.toContain(value);
 expect(html).not.toContain('<script');expect(html).toContain('engineSha256');expect(html).toContain('365.25');
 const offline=await context.newPage();const requests=[];offline.on('request',r=>requests.push(r.url()));await offline.setContent(html);
 await expect(offline.locator('.vedic-report-chart')).toHaveCount(2);expect(await offline.locator('table tbody tr').count()).toBeGreaterThan(100);
 await offline.setViewportSize({width:390,height:900});expect(await offline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await offline.screenshot({path:'.publish/vedic-p10-report-390.png',fullPage:true});
 await offline.locator('.vedic-report-chart').first().screenshot({path:'.publish/vedic-p10-chart-390.png'});
 const pdf=await offline.pdf({path:'.publish/vedic-p10-redacted.pdf',format:'A4',printBackground:true});expect(pdf.subarray(0,5).toString()).toBe('%PDF-');expect(pdf.length).toBeGreaterThan(10000);expect(requests).toEqual([]);await offline.close();
 await page.locator('#export-identity').check();await expect(exportRoot.locator('article')).toContainText('Private Export Person');
 event=page.waitForEvent('download');await page.locator('#export-download').click();download=await event;
 const identified=await fs.readFile(await download.path(),'utf8');expect(identified).toContain('Private Export Person');expect(identified).toContain('2000-01-01');
 await fillTime(page,'#birth-time','12:00');await calculate(page);await expect(page.locator('#export-identity')).not.toBeChecked();
 await expect(page.locator('.vedic-export article')).toContainText('UNSTABLE_BIRTH_TIME');
 await page.getByRole('button',{name:'Clear form',exact:true}).click();await expect(page.locator('.vedic-export')).toHaveCount(0);
});

test('P10 native print isolates redacted report and restores preview; locales preserve export',async({page})=>{
 await page.goto(server.origin);await fill(page);await page.locator('#birth-name').fill('Print Secret');await calculate(page);
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});
 await expect(page.locator('form')).toBeHidden();await expect(page.locator('#birth-review')).toBeHidden();
 await expect(page.locator('#birth-results>h2').first()).toBeHidden();await expect(page.locator('.vedic-export article')).toBeVisible();
 await expect(page.locator('.vedic-export article')).not.toContainText('Print Secret');
 await page.pdf({path:'.publish/vedic-p10-app-print.pdf',format:'A4',printBackground:true});
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await expect(page.locator('.vedic-export details')).not.toHaveAttribute('open','');
 for(const language of ['hi','gu']){await page.locator('#birth-language').selectOption(language);await expect(page.locator('#export-identity')).not.toBeChecked();
  await page.locator('.vedic-export summary').click();await expect(page.locator('.vedic-export article')).toHaveAttribute('lang',language);
  expect(await page.locator('.vedic-export article table').count()).toBeGreaterThan(10);
  await page.setViewportSize({width:320,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.locator('.vedic-export-preview').screenshot({path:'.publish/vedic-p10-gujarati-320.png'});
});
test.beforeAll(async()=>{server=await createPreviewServer(0,{birth:true});});
test.afterAll(async()=>{await server?.close();});
async function fill(page,time='12:15'){
 await fillDate(page,'#birth-date','2000-01-01');await fillTime(page,'#birth-time',time);
 await page.locator('#birth-query').fill('New Delhi');await page.locator('[data-place-id="geonames:1261481"]').click();
}
async function calculate(page){await page.locator('form button[type=submit]').click();await page.locator('#birth-calculate').click();await openKundliCalculations(page);await expect(page.locator('#birth-results h2').first()).toBeVisible();}
test('explicit review, complete charts/Dasha, keyboard controls and privacy across mobile themes',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto(server.origin);await page.locator('#birth-name').fill('<img src=x onerror=alert(1)>');await fill(page);
 await page.locator('form button[type=submit]').click();await expect(page.locator('#birth-review')).toContainText('2000-01-01T06:45:00.000Z');
 await expect(page.locator('#birth-results')).toBeEmpty();await page.locator('#birth-calculate').click();await openKundliCalculations(page);
 await expect(page.locator('[data-feature=dasha] table tbody tr')).toHaveCount(9);
 await expect(page.locator('.vedic-dasha')).toContainText('Balance at birth');await expect(page.locator('.vedic-dasha')).toContainText('Antardashas do not restart at birth');
 await expect(page.locator('#birth-results h2').first()).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#birth-results img')).toHaveCount(0);
 await page.locator('#birth-name').fill('Sample');await calculate(page);
 await page.getByRole('button',{name:'D9 · Navamsa',exact:true}).click();await page.getByRole('button',{name:'South Indian',exact:true}).click();
 await page.locator('svg [data-house="3"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.vedic-house-details')).toContainText('House 3');
 const initial=await page.locator('.vedic-dasha select').inputValue();await page.locator('.vedic-dasha select').selectOption(initial==='0'?'1':'0');await expect(page.locator('.vedic-dasha tbody tr')).toHaveCount(9);
 for(const width of [320,390,1440])for(const theme of ['light','dark','system']){
  await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:'dark'});await page.locator('#theme').selectOption(theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:390,height:1000});await page.locator('#theme').selectOption('light');await page.screenshot({path:'.publish/vedic-p09-birth-390-light.png',fullPage:true});
 await page.locator('form').screenshot({path:'.publish/vedic-p09-form-390-light.png'});await page.locator('.vedic-charts').screenshot({path:'.publish/vedic-p09-chart-390-light.png'});
 expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);
 expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);expect(page.url()).toBe(server.origin+'/');
 expect(requests.every(r=>r.url.startsWith(server.origin)&&r.method==='GET')).toBe(true);expect(requests.some(r=>/2000|private|geonames|img/.test(r.url))).toBe(false);expect(errors).toEqual([]);
 await page.reload();await expect(page.locator('#birth-date')).toHaveValue('');await expect(page.locator('#birth-name')).toHaveValue('');await expect(page.locator('#birth-results')).toBeEmpty();
});
test('D1 remains usable when D9 is withheld; input edits remove stale results and place choice',async({page})=>{
 await page.goto(server.origin);await fill(page,'12:00');await calculate(page);
 await expect(page.locator('[data-feature=d9][data-status=unavailable]')).toContainText('Withheld');
 await expect(page.getByRole('button',{name:'D9 · Navamsa',exact:true})).toBeDisabled();await expect(page.locator('svg')).toBeVisible();
 await fillTime(page,'#birth-time','12:15');await expect(page.locator('#birth-results')).toBeEmpty();await expect(page.locator('#birth-review')).toBeEmpty();
 await page.locator('#birth-query').fill('Rampur');await expect(page.locator('#birth-place')).toHaveValue('');
 expect(await page.locator('#birth-place option').count()).toBeGreaterThan(2);
});
test('unknown and approximate times disclose intervals and withhold precise features; future dates fail',async({page})=>{
 await page.goto(server.origin);await fill(page);
 await page.locator('#birth-accuracy').selectOption('unknown');await expect(page.locator('#birth-time')).toBeHidden();await calculate(page);
 await expect(page.locator('#birth-review')).toContainText('Possible UTC interval');await expect(page.locator('svg')).toHaveCount(0);
 await expect(page.locator('#birth-results .vedic-feature-state[data-status=unavailable]')).toHaveCount(4);await expect(page.locator('.vedic-dasha')).toHaveCount(0);
 await page.locator('#birth-accuracy').selectOption('approximate');await fillTime(page,'#birth-time','12:00');await page.locator('#birth-precision').fill('15');await calculate(page);
 await expect(page.locator('#birth-results .vedic-feature-state[data-status=unavailable]')).toHaveCount(4);
 await fillDate(page,'#birth-date','2098-01-01');await page.locator('form button[type=submit]').click();await expect(page.getByRole('status').last()).toContainText('future');await expect(page.locator('#birth-review')).toBeEmpty();
});
test('Hindi/Gujarati rerender without changing numbers, then clear removes all birth details',async({page})=>{
 await page.goto(server.origin);await fill(page);await calculate(page);
 const values=()=>page.locator('[data-feature=positions] tbody tr').evaluateAll(rows=>rows.map(r=>[r.dataset.body,r.dataset.rashi,r.dataset.nakshatra]));
 const expected=await values();
 for(const [language,title]of [['hi','जन्म विवरण और कुंडली'],['gu','જન્મ વિગતો અને કુંડળી']]){
  await page.locator('#birth-language').selectOption(language);await expect(page.getByRole('heading',{level:1})).toHaveText(title);expect(await values()).toEqual(expected);
  await expect(page.locator('#birth-time')).toHaveValue('12:15');await expect(page.locator('.vedic-dasha tbody tr')).toHaveCount(9);
 }
 await page.setViewportSize({width:320,height:1000});await page.locator('#theme').selectOption('dark');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'.publish/vedic-p09-gujarati-320-dark.png',fullPage:true});
 await page.locator('form button[type=button]').click();await expect(page.locator('#birth-date')).toHaveValue('');await expect(page.locator('#birth-place')).toHaveValue('');await expect(page.locator('#birth-results')).toBeEmpty();
});
test('clearing cancels pending calculation and history navigation restores no birth data',async({page})=>{
 await page.goto(server.origin);await fill(page);await page.locator('form button[type=submit]').click();
 await page.evaluate(()=>{document.querySelector('#birth-calculate').click();document.querySelector('form button[type=button]').click();});
 await expect(page.locator('#birth-results')).toBeEmpty();await expect(page.locator('#birth-review')).toBeEmpty();
 await fill(page);await calculate(page);await page.goto('about:blank');await page.goBack();
 await expect(page.locator('#birth-date')).toHaveValue('');await expect(page.locator('#birth-results')).toBeEmpty();
});
