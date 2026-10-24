const {test,expect}=require('@playwright/test');
const {createPreviewServer}=require('../../../infrastructure/preview-vedic-charts.cjs');
let server,charts;
test.beforeAll(async()=>{server=await createPreviewServer();const {divisionalChartsAtInstant}=await import('../../../packages/vedic/d9.mjs');
 charts=divisionalChartsAtInstant({timeScale:'UTC',utcInstant:'2000-01-01T06:30:00Z',latitude:28.6139,longitude:77.209,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});});
test.afterAll(async()=>{await server?.close();});
test('D1/D9 North/South graphics agree with numeric tables across mobile and shared themes',async({page})=>{
 const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(server.origin))external.push(r.url());});
 await page.goto(server.origin);await expect(page.getByRole('heading',{name:'Chart explorer'})).toBeVisible();
 for(const division of ['D1','D9'])for(const style of ['North','South']){
  await page.getByRole('button',{name:division==='D1'?'D1 · Rashi':'D9 · Navamsa',exact:true}).click();
  await page.getByRole('button',{name:style+' Indian',exact:true}).click();
  const expected=charts[division.toLowerCase()];
  const actual=await page.locator('tbody tr').evaluateAll(rows=>rows.map(r=>({body:r.dataset.body,rashi:Number(r.dataset.rashi),house:Number(r.dataset.house)})));
  expect(actual).toEqual(expected.planets.map(p=>({body:p.body,rashi:p.rashi,house:p.houseNumber})));
  const groups=page.locator('svg g[data-house]');await expect(groups).toHaveCount(12);
  for(const h of expected.houses)await expect(page.locator(`svg g[data-house="${h.houseNumber}"]`)).toHaveAttribute('data-rashi',String(h.rashi));
  for(const width of [320,390,1440])for(const theme of ['light','dark','system']){
   await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:'dark'});await page.locator('#theme').selectOption(theme);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const box=await page.locator('svg').boundingBox();expect(box.width).toBeGreaterThan(250);
   await expect(page.locator('tbody tr')).toHaveCount(9);
   expect(await page.locator('html').getAttribute('data-theme')).toBe(theme==='light'?'light':'dark');
  }
 }
 await page.locator('#theme').selectOption('system');await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'North Indian',exact:true}).click();await page.setViewportSize({width:390,height:1100});await page.screenshot({path:'.publish/vedic-p07-north-390-light.png',fullPage:true});
 await page.getByRole('button',{name:'South Indian',exact:true}).click();await page.locator('#theme').selectOption('dark');await page.setViewportSize({width:320,height:1100});await page.screenshot({path:'.publish/vedic-p07-south-320-dark.png',fullPage:true});
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('keyboard house selection, full names, exclusive toggles and source-longitude labels remain accessible',async({page})=>{
 await page.goto(server.origin);const house=page.locator('svg [data-house="6"]');await house.focus();await page.keyboard.press('Enter');
 await expect(house).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('region',{name:'Selected house details'})).toContainText('House 6');
 await page.getByRole('button',{name:'D9 · Navamsa',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Source longitude'})).toBeVisible();
 await expect(page.getByRole('button',{name:'D1 · Rashi',exact:true})).toHaveAttribute('aria-pressed','false');
 await expect(page.getByRole('button',{name:'D9 · Navamsa',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'South Indian',exact:true}).click();
 const svg=page.locator('svg');const aries=svg.locator('[data-rashi="1"] rect');await expect(aries).toHaveAttribute('x','100');await expect(aries).toHaveAttribute('y','0');
 await expect(svg.locator('[data-rashi="12"] rect')).toHaveAttribute('x','0');
 await page.locator('svg [data-house="1"]').focus();await page.keyboard.press('Space');await expect(page.getByRole('region',{name:'Selected house details'})).toContainText('House 1');
 expect(await page.evaluate(()=>Object.keys(localStorage).every(k=>['synapse-theme','chambers-theme'].includes(k)))).toBe(true);
});
test('all twelve ascendants and crowded houses preserve every occupant in table and accessible labels',async({page})=>{
 await page.goto(server.origin);
 for(let ascendant=1;ascendant<=12;ascendant++){
  const stress=structuredClone(charts);
  for(const c of [stress.d1,stress.d9]){
   c.ascendant.rashi=ascendant;
   c.houses=Array.from({length:12},(_,i)=>({houseNumber:i+1,rashi:(ascendant-1+i)%12+1,bodies:i===1?c.planets.map(p=>p.body):[]}));
   for(const p of c.planets){p.rashi=c.houses[1].rashi;p.houseNumber=2;}
  }
  await page.evaluate(async input=>{const {mountCharts}=await import('/preview.mjs');mountCharts(document.querySelector('#charts'),input);},stress);
  for(const style of ['North','South']){
   await page.getByRole('button',{name:style+' Indian',exact:true}).click();
   await expect(page.locator('svg [data-house="1"]')).toHaveAttribute('data-rashi',String(ascendant));
   await expect(page.locator('svg [data-house="2"]')).toHaveAccessibleName(/Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu/);
   await expect(page.locator('svg [data-house="2"]')).toContainText('+6');await expect(page.locator('tbody tr')).toHaveCount(9);
  }
 }
});
