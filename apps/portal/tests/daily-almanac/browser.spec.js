const {test,expect}=require('../../../../tests/browser-fixture.js');
const {startPreview}=require('../../../../tests/organisation-preview-fixture.cjs');
let fixture,base;
test.beforeAll(async()=>{if(process.env.PORTAL_LIVE_ORIGIN)base=process.env.PORTAL_LIVE_ORIGIN;else{fixture=await startPreview({enabled:false});base=fixture.base;}});
test.afterAll(async()=>{await fixture?.stop();});
async function home(page,instant='2026-10-25T08:30:00Z'){
 await page.clock.setFixedTime(new Date(instant));await page.goto(base+'/');await page.locator('[data-home-vedic]').scrollIntoViewIfNeeded();await expect(page.locator('.daily-almanac')).toHaveAttribute('data-ready','true');
}
test('local events, live highlight, city retention, shared languages and compact responsive delivery',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await home(page);const panel=page.locator('.daily-almanac');
 await expect(page.locator('#home-vedic-title')).toHaveText('Ritvayam');await expect(panel.locator('[data-almanac-event]')).toHaveCount(4);await expect(panel.locator('.almanac-locality')).toContainText('New Delhi');await expect(panel.locator('.almanac-current')).toContainText('Shubh');
 await panel.locator('details').last().locator('summary').click();await expect(panel.locator('li')).toHaveCount(16);await expect(panel.locator('[aria-current=time]')).toHaveCount(1);
 const boundary=Number(await panel.locator('[aria-current=time]').getAttribute('data-end'));await page.clock.setFixedTime(new Date(boundary));await expect(panel.locator('.almanac-current')).toContainText('Rog');await expect(panel.locator('li[aria-current=time]')).toHaveAttribute('data-choghadiya','Rog');
 for(const language of ['hi','gu','en']){await page.evaluate(language=>SynapseLanguage.set(language),language);await expect(panel).toHaveAttribute('lang',language);await expect(panel.locator('[data-almanac-event=sunrise] dt')).toHaveText(({en:'Sunrise',hi:'सूर्योदय',gu:'સૂર્યોદય'})[language]);await expect(panel.locator('li[aria-current=time]')).toHaveCount(1);}
 for(const width of [320,360,390,430,768,1024])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});await panel.screenshot({path:test.info().outputPath('almanac-mobile-dark.png')});
 const previous=await panel.locator('[data-almanac-event=sunset] dd').textContent();await panel.locator('details').first().locator('summary').click();await panel.locator('input').fill('Mumbai');await panel.locator('[data-almanac-place="geonames:1275339"]').click();await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');await expect(panel.locator('[data-almanac-event=sunset] dd')).not.toHaveText(previous);
 await page.reload();await page.locator('[data-home-vedic]').scrollIntoViewIfNeeded();await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');
 await page.goto(base+'/rashifal-kundli/rashifal');await expect(panel).toHaveAttribute('data-ready','true');await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');await expect(page).toHaveTitle(/Ritvayam/);await expect(page.locator('.platform-language')).toHaveCount(1);expect(errors).toEqual([]);
});
test('pre-sunrise night, civil midnight rollover and lunar no-event remain explicit',async({page})=>{
 await home(page,'2026-10-25T23:30:00+05:30');const panel=page.locator('.daily-almanac');await panel.locator('details').last().locator('summary').click();await expect(panel.locator('[aria-current=time]')).toHaveCount(1);await expect(panel.locator('.almanac-current')).toHaveAttribute('data-period','night');
 await page.clock.setFixedTime(new Date('2026-10-26T00:00:01+05:30'));await expect(panel.locator('.almanac-locality')).toContainText('26 Oct 2026');await expect(panel.locator('h4')).toContainText(['Day Choghadiya','Previous night']);await expect(panel.locator('[aria-current=time]')).toHaveCount(1);
 await page.clock.setFixedTime(new Date('2026-10-26T05:00:00+05:30'));await expect(panel.locator('.almanac-current')).toHaveAttribute('data-period','night');
 await page.clock.setFixedTime(new Date('2026-10-04T12:00:00+05:30'));await expect(panel.locator('[data-almanac-event=moonrise] dd')).toHaveText('No event today');await expect(panel.locator('[data-almanac-event=sunrise] dd')).not.toHaveText('No event today');await expect(panel).toHaveAttribute('data-ready','true');
});
