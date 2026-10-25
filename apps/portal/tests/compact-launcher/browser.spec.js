const {test,expect}=require('../../../../tests/browser-fixture.js');
const {startPreview}=require('../../../../tests/organisation-preview-fixture.cjs');
let fixture,base;
test.beforeAll(async()=>{if(process.env.PORTAL_LIVE_ORIGIN)base=process.env.PORTAL_LIVE_ORIGIN;else{fixture=await startPreview({enabled:false});base=fixture.base;}});
test.afterAll(async()=>{await fixture?.stop();});
test('launcher delivery preserves compact cards, themes, shared languages and navigation',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route(/googlesyndication|doubleclick|google-analytics/,route=>route.abort());await page.goto(base+'/');await expect(page.locator('.compact-app')).toHaveCount(18);
 for(const width of [320,360,390,430,600,768,900,1024])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.evaluate(theme=>SynapseTheme.write(theme),theme);
  for(const selector of ['.public-apps','.workspace-grid']){const layout=await page.locator(selector).evaluate(grid=>({columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,overflow:grid.scrollWidth>grid.clientWidth,heights:[...grid.querySelectorAll('.compact-app')].map(card=>card.getBoundingClientRect().height)}));expect(layout.columns).toBe(width>=900?6:width>=600?5:width>=360?4:3);expect(layout.overflow).toBe(false);expect(layout.heights.every(height=>height===88)).toBe(true);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 for(const language of ['hi','gu','en']){await page.evaluate(language=>SynapseLanguage.set(language),language);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('.compact-app')).toHaveCount(18);}
 await page.setViewportSize({width:390,height:900});await page.locator('.public-apps').screenshot({path:test.info().outputPath('launcher-mobile-dark.png')});await expect(page.locator('.platform-shell')).toHaveCount(1);await expect(page.locator('.home-mobile-dock')).toBeVisible();await expect(page.locator('.public-app p,.public-app-arrow,.public-app-category,.workspace-card p')).toHaveCount(0);
 await page.locator('#home-search-input').fill('QR');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(1);await page.locator('#home-search-input').press('Escape');await expect(page.locator('.public-app:not([hidden])')).toHaveCount(14);await page.locator('.public-app[data-app-id=qr-maker]').click();await expect(page).toHaveURL(base+'/qr-maker');expect(errors).toEqual([]);
});
