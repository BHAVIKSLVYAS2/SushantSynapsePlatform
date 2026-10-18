// Read-only post-deployment verification; never creates accounts or business records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'https://apps.sushantsynapse.com',root=path.resolve(process.argv[3]||path.join(__dirname,'../..')),output=path.resolve(process.argv[4]||path.join(root,'.publish'));
async function main(){
 fs.mkdirSync(output,{recursive:true});const assets=[],layouts=[],errors=[],writes=[];
 for(const [url,file] of [['/shared/platform-shell.js','packages/ui/platform-shell.js'],['/shared/platform-shell.css','packages/ui/platform-shell.css'],['/shared/premium.css','packages/ui/premium.bundle.css'],['/shared/language.js','packages/ui/language.js'],['/platform.js','apps/portal/frontend/platform.js'],['/app.js','apps/advocate/frontend/app.js'],['/moment-studio/card-app.js','apps/moment-studio/frontend/card-app.js']]){
  const response=await fetch(base+url+'?verify=platform-shell');assert.equal(response.status,200,url);assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(root,file)),url);assets.push(url);
 }
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext();await context.route('https://pagead2.googlesyndication.com/**',r=>r.fulfill({body:'',contentType:'text/javascript'}));
  // Forbid writes, including accidental application actions, on the live account/data origin.
  await context.route(base+'/api/**',async route=>{if(!['GET','HEAD'].includes(route.request().method())){writes.push(route.request().url());await route.abort();}else await route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/','/signin','/moment-studio','/moment-studio/cards','/ritual-assist','/ritual-assist/calendar','/timetable-lite','/fund-overlap','/news','/satire-arena','/take-a-break','/daily-spark','/decision-wheel','/team-mixer','/support','/sponsor','/contact','/privacy','/terms','/legal/third-party-notices','/advocate','/digital-samaj','/batchfee-lite','/tournament-lite']){
   await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.locator('.platform-shell').waitFor();assert.equal(await page.locator('.platform-shell').count(),1,route);
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} ${width} ${theme} overflow`);
    const box=await page.locator('.platform-shell').boundingBox();assert.equal(box.y,0);assert.equal(box.height,72);
    for(const selector of ['.platform-switch','.platform-account','.platform-shell .theme-toggle']){const r=await page.locator(selector).boundingBox();assert(r&&r.height>=44&&r.x>=0&&r.x+r.width<=width,route+' '+selector);}
    layouts.push({route,width,theme});
   }
  }
  await page.goto(base+'/');await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>SynapseTheme.write('light'));await page.screenshot({path:path.join(output,'shell-live-home-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:850});await page.screenshot({path:path.join(output,'shell-live-home-mobile.png'),fullPage:true});
  await page.locator('.platform-switch').click();await page.locator('#platform-switcher input').fill('Chambers');assert.equal(await page.locator('#platform-switcher nav a:visible').count(),1);await page.keyboard.press('Escape');assert(await page.locator('.platform-switch').evaluate(el=>el===document.activeElement));
  await page.locator('.platform-switch').click();await page.locator('#platform-switcher input').fill('Moment');await page.locator('#platform-switcher nav a:visible').click();await page.locator('#certificate').waitFor();await page.evaluate(()=>SynapseTheme.write('dark'));await page.screenshot({path:path.join(output,'shell-live-studio-mobile.png'),fullPage:true});
  for(const route of ['/api/state','/api/platform'])assert.equal((await page.request.get(base+route)).status(),401,route);
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('.platform-shell').isVisible(),false);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 }finally{await browser.close();}
 const report={base,assets,layouts,pageErrors:errors,businessWrites:writes};fs.writeFileSync(path.join(output,'shell-live-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({assets:assets.length,layouts:layouts.length,pageErrors:errors,businessWrites:writes}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
