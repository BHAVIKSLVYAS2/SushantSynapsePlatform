// First-visit tests deliberately bypass the returning-visitor workflow fixture.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const {key,version}=require('../../../../packages/ui/beta-html.cjs');
let child,base,dir;
test.beforeAll(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-beta-browser-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];resolve();}});child.once('error',reject);child.once('exit',code=>reject(Error('Fixture exited '+code)));});
});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir&&path.dirname(dir)===os.tmpdir())fs.rmSync(dir,{recursive:true,force:true});});
const dialog=page=>page.getByRole('dialog',{name:'Before you use this beta'});
async function accept(page){await dialog(page).getByRole('checkbox').check();await dialog(page).getByRole('button',{name:'Acknowledge & continue'}).click();}
test('first visit requires an unchecked acknowledgement and remembers it across apps',async({page})=>{
 const external=[];page.on('request',r=>{if(r.url().includes('wa.me'))external.push(r.url());});
 await page.goto(base+'/');await expect(dialog(page)).toBeVisible();await expect(dialog(page).getByRole('checkbox')).not.toBeChecked();await expect(dialog(page).getByRole('button',{name:'Acknowledge & continue'})).toBeDisabled();
 await page.keyboard.press('Escape');await expect(dialog(page)).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
 await expect(dialog(page)).toContainText('does not waive your rights');await expect(dialog(page).getByRole('link',{name:'Third-party notices',exact:true})).toHaveAttribute('target','_blank');
 await expect(dialog(page).getByRole('link',{name:'Report an issue on WhatsApp'})).toHaveAttribute('href',/wa.me\/917874166009/);expect(external).toEqual([]);
 await accept(page);await expect(dialog(page)).not.toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(version);
 await page.goto(base+'/qr-maker');await expect(dialog(page)).not.toBeVisible();await page.getByRole('button',{name:'Review beta notice',exact:true}).click();await expect(dialog(page)).toBeVisible();await dialog(page).getByRole('button',{name:'Close notice'}).click();await expect(dialog(page)).not.toBeVisible();
 await page.getByRole('button',{name:'Review beta notice',exact:true}).click();await dialog(page).getByRole('button',{name:'Forget this acknowledgement'}).click();await expect(dialog(page)).toBeVisible();await expect(dialog(page).getByRole('checkbox')).not.toBeChecked();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
});
test('declining opens readable information without remembering acceptance',async({page})=>{
 await page.goto(base+'/daily-spark');await dialog(page).getByRole('button',{name:'Not now — read information'}).click();await expect(page).toHaveURL(base+'/terms#beta-notice');await expect(dialog(page)).not.toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();await page.goto(base+'/daily-spark');await expect(dialog(page)).toBeVisible();
});
test('legal pages and no-JavaScript notice stay readable before acknowledgement',async({page,browser})=>{
 for(const route of ['/terms#beta-notice','/privacy','/legal/third-party-notices','/contact']){await page.goto(base+route);await expect(dialog(page)).not.toBeVisible();await expect(page.locator('[data-synapse-beta]')).toBeVisible();}
 const context=await browser.newContext({javaScriptEnabled:false});try{const plain=await context.newPage();await plain.goto(base+'/');await expect(plain.locator('[data-synapse-beta]')).toContainText('platform is in beta');await expect(plain.getByRole('link',{name:'Beta & third-party information',exact:true})).toHaveAttribute('href','/terms#beta-notice');await expect(plain.locator('[data-beta-review]')).toBeHidden();}finally{await context.close();}
});
test('English/Hindi, keyboard focus and responsive themes fit',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/news');await expect(dialog(page).locator('h2')).toBeFocused();
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:740});await page.evaluate(theme=>{SynapseTheme.write(theme);document.documentElement.dataset.theme=theme;},theme);
  for(const language of ['hi','en']){await page.locator('[data-beta-language="'+language+'"]').click();await expect(page.locator('#synapse-beta-dialog')).toHaveAttribute('lang',language);await expect(page.locator('#synapse-beta-title')).toHaveText(language==='hi'?'बीटा इस्तेमाल करने से पहले':'Before you use this beta');expect(await page.locator('#synapse-beta-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const box=await page.locator('#synapse-beta-dialog').boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(741);}
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/beta-notice-mobile-dark.png'});await page.locator('[data-beta-language=hi]').click();await page.screenshot({path:'.publish/beta-notice-mobile-hindi.png'});await page.locator('[data-beta-language=en]').click();await accept(page);expect(errors).toEqual([]);
});
test('homepage and Studio dialog controls remain within the viewport',async({page})=>{
 for(const route of ['/','/moment-studio']){await page.goto(base+route);await page.setViewportSize({width:320,height:740});await expect(dialog(page)).toBeVisible();const box=await dialog(page).boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(741);await dialog(page).locator('[data-beta-continue]').scrollIntoViewIfNeeded();const control=await dialog(page).locator('[data-beta-continue]').boundingBox();expect(control.y).toBeGreaterThanOrEqual(box.y);expect(control.y+control.height).toBeLessThanOrEqual(box.y+box.height);}
});
test('obsolete versions and local storage denial do not silently acknowledge',async({page})=>{
 await page.addInitScript(key=>{localStorage.setItem(key,'obsolete-version');Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked');}});},key);
 await page.goto(base+'/');await expect(dialog(page)).toBeVisible();await accept(page);expect(await page.evaluate(key=>sessionStorage.getItem(key),key)).toBe(version);await page.reload();await expect(dialog(page)).not.toBeVisible();
});
test('fully blocked storage uses tab memory and asks again after navigation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{for(const name of ['localStorage','sessionStorage'])Object.defineProperty(window,name,{get(){throw new Error('Storage blocked');}});});
 await page.goto(base+'/daily-spark');await expect(dialog(page)).toBeVisible();await accept(page);await expect(dialog(page)).not.toBeVisible();await page.reload();await expect(dialog(page)).toBeVisible();expect(errors).toEqual([]);
});
