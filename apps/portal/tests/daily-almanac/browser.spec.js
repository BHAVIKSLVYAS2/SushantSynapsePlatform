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
 await expect(panel).toHaveClass(/almanac-compact/);
 for(const width of [320,360,390,430,768,1280]){
  await page.setViewportSize({width,height:1000});
  const eventRows=await panel.locator('[data-almanac-event]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));
  expect(new Set(eventRows).size).toBe(1);
  expect((await panel.locator('.almanac-current').boundingBox()).height).toBeLessThan(90);
  const buttons=await page.locator('.home-vedic-actions a').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {top:r.top,height:r.height};}));
  if(width===390)expect((await page.locator('[data-home-vedic]').boundingBox()).height).toBeLessThan(650);
  expect(buttons[0].top).toBe(buttons[1].top);
  const headerLayout=await page.locator('.home-vedic-calendar-line').evaluate(node=>({column:getComputedStyle(node).gridColumnStart,row:getComputedStyle(node).gridRowStart}));expect(headerLayout).toEqual({column:'3',row:'1'});
  expect(buttons.every(button=>button.height>=44)).toBe(true);
  if(width<=699){
   const sizes=await page.locator('[data-home-vedic]').evaluate(card=>({labels:[...card.querySelectorAll('.home-vedic-facts dt')].map(n=>parseFloat(getComputedStyle(n).fontSize)),actions:[...card.querySelectorAll('.home-vedic-actions a')].map(n=>parseFloat(getComputedStyle(n).fontSize)),times:[...card.querySelectorAll('.almanac-events dd')].map(n=>({fits:n.scrollWidth<=n.clientWidth,wrap:getComputedStyle(n).whiteSpace}))}));
   expect(sizes.labels.every(size=>size>=11)).toBe(true);expect(sizes.actions.every(size=>size>=14)).toBe(true);expect(sizes.times.every(time=>time.fits&&time.wrap==='nowrap')).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if([390,1280].includes(width))for(const theme of ['light','dark']){
   await page.evaluate(theme=>SynapseTheme.write(theme),theme);
   await page.locator('[data-home-vedic]').screenshot({path:test.info().outputPath(`ritvayam-${width}-${theme}.png`)});
  }
 }
 await panel.locator('details').last().locator('summary').click();await expect(panel.locator('li')).toHaveCount(16);await expect(panel.locator('[aria-current=time]')).toHaveCount(1);
 const boundary=Number(await panel.locator('[aria-current=time]').getAttribute('data-end'));await page.clock.setFixedTime(new Date(boundary));await expect(panel.locator('.almanac-current')).toContainText('Rog');await expect(panel.locator('li[aria-current=time]')).toHaveAttribute('data-choghadiya','Rog');
 for(const language of ['hi','gu','en']){await page.evaluate(language=>SynapseLanguage.set(language),language);await expect(panel).toHaveAttribute('lang',language);await expect(panel.locator('[data-almanac-event=sunrise] dt')).toHaveText(({en:'Sunrise',hi:'सूर्योदय',gu:'સૂર્યોદય'})[language]);await expect(panel.locator('li[aria-current=time]')).toHaveCount(1);}
 for(const width of [320,360,390,430,768,1024])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});await panel.screenshot({path:test.info().outputPath('almanac-mobile-dark.png')});
 const previous=await panel.locator('[data-almanac-event=sunset] dd').textContent();await page.locator('.home-vedic-calendar-line details summary').click();await page.locator('.almanac-location-dialog input').fill('Mumbai');await page.locator('[data-almanac-place="geonames:1275339"]').click();await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');await expect(panel.locator('[data-almanac-event=sunset] dd')).not.toHaveText(previous);
 await page.reload();await page.locator('[data-home-vedic]').scrollIntoViewIfNeeded();await expect(panel).toHaveAttribute('data-place-id','geonames:1275339',{timeout:15000});
 await page.goto(base+'/rashifal-kundli/rashifal');await expect(panel).toHaveAttribute('data-ready','true');await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');await expect(page).toHaveTitle(/Ritvayam/);await expect(page.locator('.platform-language')).toHaveCount(1);expect(errors).toEqual([]);
});
test('city dialog preserves the tile and device detection handles success, denial and stale callbacks',async({page})=>{
 await page.addInitScript(()=>{window.geoRequests=[];Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success,error){window.geoRequests.push({success,error});}}});});
 await home(page);const panel=page.locator('.daily-almanac'),card=page.locator('[data-home-vedic]'),trigger=page.locator('.home-vedic-calendar-line summary'),dialog=page.locator('.almanac-location-dialog'),detect=dialog.locator('.almanac-detect-location');
 expect(await page.evaluate(()=>window.geoRequests.length)).toBe(0);
 for(const language of ['hi','gu','en'])for(const width of [320,393,1024]){
  await page.evaluate(l=>SynapseLanguage.set(l),language);await page.setViewportSize({width,height:852});await card.scrollIntoViewIfNeeded();const before=await card.boundingBox();
  await trigger.click();await expect(dialog).toBeVisible();await expect(dialog.locator('input')).toBeFocused();const after=await card.boundingBox();expect(after.height).toBeCloseTo(before.height,1);expect(after.width).toBeCloseTo(before.width,1);
  expect(await dialog.evaluate(n=>n.scrollWidth<=n.clientWidth)).toBe(true);await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();
 }
 await page.setViewportSize({width:393,height:852});await trigger.click();await detect.click();await expect(detect).toBeDisabled();await page.evaluate(()=>window.geoRequests.at(-1).error({code:1}));await expect(dialog.locator('.almanac-location-status')).toContainText('denied');await expect(detect).toBeEnabled();
 await detect.click();await page.evaluate(()=>window.geoRequests.at(-1).error({code:3}));await expect(dialog.locator('.almanac-location-status')).toContainText('could not');
 await detect.click();await page.evaluate(()=>window.geoRequests.at(-1).success({coords:{latitude:51.5,longitude:-.12}}));await expect(dialog.locator('.almanac-location-status')).toContainText('No supported city');
 await dialog.screenshot({path:test.info().outputPath('location-dialog-mobile.png')});
 await detect.click();await page.evaluate(()=>window.geoRequests.at(-1).success({coords:{latitude:19.07283,longitude:72.88261}}));await expect(dialog).toBeHidden();await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');expect(await page.evaluate(()=>localStorage.getItem('ritvayam.almanac-city.v1'))).toBe('geonames:1275339');
 await trigger.click();await detect.click();await page.keyboard.press('Escape');await page.evaluate(()=>window.geoRequests.at(-1).success({coords:{latitude:28.63576,longitude:77.22445}}));await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');
 await trigger.click();await dialog.locator('input').fill('Dungarpur');await dialog.locator('[data-almanac-place="geonames:1272201"]').click();await expect(dialog).toBeHidden();await expect(panel).toHaveAttribute('data-place-id','geonames:1272201');
 await page.goto(base+'/rashifal-kundli/rashifal');await expect(panel).toHaveAttribute('data-ready','true');await panel.locator('.almanac-heading summary').click();const appDetect=panel.locator('.almanac-detect-location');await appDetect.click();await panel.locator('.almanac-heading input').fill('Mumbai');await panel.locator('[data-almanac-place="geonames:1275339"]').click();await expect(appDetect).toBeEnabled();await page.evaluate(()=>window.geoRequests.at(-1).success({coords:{latitude:28.63576,longitude:77.22445}}));await expect(panel).toHaveAttribute('data-place-id','geonames:1275339');
});

test('pre-sunrise night, civil midnight rollover and lunar no-event remain explicit',async({page})=>{
 await home(page,'2026-10-25T23:30:00+05:30');const panel=page.locator('.daily-almanac');await panel.locator('details').last().locator('summary').click();await expect(panel.locator('[aria-current=time]')).toHaveCount(1);await expect(panel.locator('.almanac-current')).toHaveAttribute('data-period','night');
 await page.clock.setFixedTime(new Date('2026-10-26T00:00:01+05:30'));await expect(panel.locator('.almanac-locality')).toContainText('26 Oct 2026');await expect(panel.locator('h4')).toContainText(['Day Choghadiya','Previous night']);await expect(panel.locator('[aria-current=time]')).toHaveCount(1);
 await page.clock.setFixedTime(new Date('2026-10-26T05:00:00+05:30'));await expect(panel.locator('.almanac-current')).toHaveAttribute('data-period','night');
 await page.clock.setFixedTime(new Date('2026-10-04T12:00:00+05:30'));await expect(panel.locator('[data-almanac-event=moonrise] dd')).toHaveText('No event today');await expect(panel.locator('[data-almanac-event=sunrise] dd')).not.toHaveText('No event today');await expect(panel).toHaveAttribute('data-ready','true');
});
