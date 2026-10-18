const {test,expect}=require('@playwright/test'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-performance-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',chunk=>{out+=chunk;const m=out.match(/localhost:(\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test.beforeEach(async({context})=>{await context.route('https://pagead2.googlesyndication.com/**',r=>r.fulfill({contentType:'text/javascript',body:''}));});

test('home arrives complete, fetches premium CSS once and language settles after changes',async({page})=>{
 const response=await page.goto(base+'/');const html=await response.text();for(const name of ['home-entry-paths','home-featured','home-search'])expect(html).toContain('class="'+name+'"');
 await expect(page.locator('.home-feature-card')).toHaveCount(2);await expect(page.locator('.synapse-legal-footer [data-language-control]')).toBeVisible();
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/home.bundle.css').length)).toBe(1);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/shared/premium.css').length)).toBe(0);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/shared/app-catalogue.js').length)).toBe(0);
 async function idleMutations(){return page.locator('[data-language-help]').evaluate(async node=>{let count=0;const observer=new MutationObserver(records=>count+=records.length);observer.observe(node,{childList:true,characterData:true,subtree:true});await new Promise(resolve=>setTimeout(resolve,250));observer.disconnect();return count;});}
 expect(await idleMutations()).toBe(0);await page.locator('[data-interface-language=hi]').click();await expect(page.locator('.home-entry-explore strong')).toHaveText('ऐप देखें');expect(await idleMutations()).toBe(0);await page.locator('[data-interface-language=en]').click();await expect(page.locator('.home-entry-explore strong')).toHaveText('Explore Apps');expect(await idleMutations()).toBe(0);
});

test('deferred game loading preserves newer choices and never loads unused controllers',async({page})=>{
 const loaded=[];page.on('request',r=>loaded.push(new URL(r.url()).pathname));await page.goto(base+'/take-a-break');await expect(page.locator('.break-card')).toHaveCount(8);
 for(const url of ['/take-a-break/chaos.mjs','/daily-spark/play.mjs','/daily-spark/view.mjs'])expect(loaded).not.toContain(url);
 let release,arrived;const gate=new Promise(resolve=>release=resolve),arrival=new Promise(resolve=>arrived=resolve);
 await page.route('**/daily-spark/play.mjs',async route=>{arrived();await gate;await route.continue();});
 try{await page.locator('[data-game="24"]').click();await arrival;await page.locator('[data-game=code]').click();await expect(page.locator('#play-title')).toHaveText('Crack the Code');release();await expect(page.locator('[data-game="24"]')).not.toHaveAttribute('aria-busy','true');await expect(page.locator('#play-title')).toHaveText('Crack the Code');}finally{release();}
 await page.locator('#all-breaks').click();await page.locator('[data-game="24"]').click();await expect(page.locator('[data-pane="24"] #numbers button')).toHaveCount(4);
});

test('Newsroom remains visible while status is pending and fallback stays available',async({page})=>{
 let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/api/news/status',async route=>{await gate;await route.fulfill({status:503,json:{error:'Offline fixture'}});});
 try{await page.goto(base+'/news');await expect(page.locator('.masthead h1')).toHaveText('Newsroom');await expect(page.locator('#reading-mode')).toBeVisible();await expect(page.locator('#edition-date')).toBeDisabled();release();await expect(page.locator('#device-note')).toBeVisible();}finally{release();}
});

test('failed game module keeps the catalogue usable without an unhandled error',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/take-a-break/chaos.mjs',route=>route.fulfill({status:503,body:'Unavailable fixture'}));await page.goto(base+'/take-a-break');await page.locator('[data-game=chaos]').click();await expect(page.locator('#break-filter-status')).toContainText('Reload the page');await expect(page.locator('#hub')).toBeVisible();await expect(page.locator('[data-game=chaos]')).not.toHaveAttribute('aria-busy','true');await page.locator('[data-game=lights]').click();await expect(page.locator('#play-title')).toHaveText('Lights Out');expect(errors).toEqual([]);
});
