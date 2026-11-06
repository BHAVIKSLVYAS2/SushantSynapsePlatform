const {test,expect,acknowledgedContext}=require('../../../../tests/browser-fixture');
const {setTheme}=require('../../../../tests/browser-theme');
const {spawn}=require('child_process'),fs=require('fs'),os=require('os'),path=require('path');let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'theme-picker-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATA_DIR:dir,PORT:'0',DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'},stdio:['ignore','pipe','pipe'],windowsHide:true});base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',d=>{out+=d;const m=out.match(/localhost:(\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('three-choice popup keyboard, deep reload and cross-tab preference',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/');await expect(page.locator('html')).toHaveAttribute('data-theme','light');const trigger=page.getByRole('button',{name:'Theme',exact:true});await trigger.focus();await page.keyboard.press('Enter');await expect(page.getByRole('radio')).toHaveCount(3);await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await trigger.click();await page.getByRole('radio',{name:'Light',exact:true}).focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await expect(page.getByRole('radio',{name:'Deep Black',exact:true})).toBeFocused();await page.keyboard.press('Space');await expect(page.locator('html')).toHaveAttribute('data-theme-style','deep');expect(await page.evaluate(()=>SynapseTheme.read())).toBe('dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme-style','deep');const other=await context.newPage();await other.goto(base+'/ritual-assist');await expect(other.locator('html')).toHaveAttribute('data-theme-style','deep');await setTheme(page,'light');await expect(other.locator('html')).toHaveAttribute('data-theme','light');await expect(other.locator('html')).toHaveAttribute('data-theme-style','');await other.close();expect(errors).toEqual([]);
});
test('deep fits mobile and desktop and restores existing Light and Dark surfaces',async({page})=>{
 test.setTimeout(180000);
 for(const route of ['/','/ritual-assist','/take-a-break','/news','/moment-studio','/decision-wheel']){await page.goto(base+route);for(const value of ['light','dark']){await setTheme(page,value);const before=await page.locator('body').evaluate(el=>({background:getComputedStyle(el).background,color:getComputedStyle(el).color}));await setTheme(page,'deep');for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+width).toBe(true);await page.getByRole('button',{name:'Theme',exact:true}).click();const box=await page.locator('#synapse-theme-picker').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);await page.keyboard.press('Escape');}await setTheme(page,value);expect(await page.locator('body').evaluate(el=>({background:getComputedStyle(el).background,color:getComputedStyle(el).color}))).toEqual(before);}}
 await page.goto(base+'/');await setTheme(page,'deep');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.publish/deep-theme-mobile.png',fullPage:true});await page.getByRole('button',{name:'Theme',exact:true}).click();await page.screenshot({path:'.publish/deep-theme-picker.png'});
});
test('denied storage remains usable',async({browser})=>{
 const blocked=await acknowledgedContext(browser);try{await blocked.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw Error('blocked');};});const p=await blocked.newPage();await p.goto(base+'/');await setTheme(p,'deep');await expect(p.locator('html')).toHaveAttribute('data-theme-style','deep');await setTheme(p,'light');}finally{await blocked.close();}
});

test('saved themes survive OS changes and legacy app initializers',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto(base+'/');await setTheme(page,'dark');
 for(const route of ['/batchfee-lite','/tournament-lite','/digital-samaj','/news','/moment-studio/certificates']){await page.goto(base+route);await expect.poll(()=>page.evaluate(()=>SynapseTheme.preference())).toBe('dark');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');}
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await setTheme(page,'deep');
 for(const route of ['/batchfee-lite','/tournament-lite','/digital-samaj','/news','/moment-studio/certificates']){await page.goto(base+route);await expect.poll(()=>page.evaluate(()=>SynapseTheme.preference())).toBe('deep');await expect(page.locator('html')).toHaveAttribute('data-theme-style','deep');}
});

test('stale System preference migrates to Light and is not offered',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('synapse-theme','system');localStorage.setItem('chambers-theme','system');});
 await page.emulateMedia({colorScheme:'dark'});await page.goto(base+'/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect.poll(()=>page.evaluate(()=>SynapseTheme.preference())).toBe('light');
 expect(await page.evaluate(()=>[localStorage.getItem('synapse-theme'),localStorage.getItem('chambers-theme')])).toEqual(['light','light']);
 await page.getByRole('button',{name:'Theme',exact:true}).click();
 await expect(page.getByRole('radio')).toHaveCount(3);
 await expect(page.getByRole('radio',{name:'System'})).toHaveCount(0);
 await page.emulateMedia({colorScheme:'light'});await page.emulateMedia({colorScheme:'dark'});
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('localized picker and legacy app initialisers preserve Deep Black across navigation',async({page})=>{
 await page.goto(base+'/');await page.evaluate(()=>SynapseLanguage.set('hi'));await page.locator('[data-theme-toggle]:visible').click();await expect(page.locator('[data-theme-choice=deep]')).toHaveAccessibleName('गहरा काला');await page.locator('[data-theme-choice=deep]').click();
 for(const route of ['/moment-studio/cards','/moment-studio/certificates','/fund-overlap','/timetable-lite','/ritual-assist']){await page.goto(base+route);await expect(page.locator('html')).toHaveAttribute('data-theme-style','deep');await expect.poll(()=>page.evaluate(()=>SynapseTheme.preference())).toBe('deep');}
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(0, 0, 0)');await setTheme(page,'dark');await expect(page.locator('html')).toHaveAttribute('data-theme-style','');await expect(page.locator('html')).toHaveAttribute('lang','hi');
});
