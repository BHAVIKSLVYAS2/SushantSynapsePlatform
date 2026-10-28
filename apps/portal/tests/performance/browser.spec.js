const {test,expect}=require('../../../../tests/browser-fixture.js'),{spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
// Style parity injects the original sheet in test contexts only; production CSP stays intact.
test.use({bypassCSP:true});

test('shared chrome does not rescan translations for arena score mutations',async({page})=>{
 await page.goto(base+'/satire-arena/news-anchors');await expect(page.locator('.arena-card')).toHaveCount(6);
 const walks=await page.evaluate(async()=>{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const original=document.createTreeWalker;let count=0;document.createTreeWalker=function(...args){count++;return original.apply(this,args);};
  try{document.querySelector('.card-total').textContent='Updated score';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return count;}
  finally{document.createTreeWalker=original;}
 });
 expect(walks).toBe(0);
});
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-performance-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',chunk=>{out+=chunk;const m=out.match(/localhost:(\d+)/);if(m)resolve('http://127.0.0.1:'+m[1]);});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});

test('settled discovery and almanac do not mutate unchanged content',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-25T08:30:00Z'));const response=await page.goto(base+'/');expect(await response.text()).toContain('class="home-discovery-toolbar"');await expect(page.locator('.home-discovery-toolbar')).toHaveCount(1);
 await page.locator('[data-home-vedic]').scrollIntoViewIfNeeded();await expect(page.locator('[data-home-vedic]')).toHaveAttribute('data-calendar-ready','true');
 const mutations=await page.evaluate(()=>{const home=document.querySelector('.public-home'),panel=home.querySelector('.daily-almanac'),input=home.querySelector('#home-search-input');const records=node=>{const o=new MutationObserver(()=>{});o.observe(node,{subtree:true,childList:true,characterData:true,attributes:true});return o;};const search=records(home);for(let n=0;n<5;n++)input.dispatchEvent(new Event('input',{bubbles:true}));const count=search.takeRecords().length;search.disconnect();const almanac=records(panel);for(let n=0;n<5;n++)window.dispatchEvent(new Event('pageshow'));const result={search:count,almanac:almanac.takeRecords().length};almanac.disconnect();return result;});
 expect(mutations).toEqual({search:0,almanac:0});
});

test('consolidated Vedic CSS preserves the complete original cascade',async({page})=>{
 test.setTimeout(120000);const {stylesheetFiles}=require('../../../rashifal-kundli/build.cjs');const original=stylesheetFiles.map(file=>fs.readFileSync(path.resolve('apps/rashifal-kundli',file),'utf8')).join('\n');
 for(const route of ['/rashifal-kundli','/rashifal-kundli/matching','/rashifal-kundli/rashifal','/rashifal-kundli/time-machine']){
  await page.goto(base+route);await expect(page.locator('main :is(h1,h2)').first()).toBeVisible();await expect(page.locator('link[rel=stylesheet]')).toHaveCount(1);await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  for(const width of [320,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
   const differences=await page.evaluate(original=>{const nodes=[...document.querySelectorAll('body,body *')].filter(n=>!n.matches('script,style,link'));const snap=()=>nodes.map(n=>{const c=getComputedStyle(n),r=n.getBoundingClientRect();return JSON.stringify([[...c].map(p=>[p,c.getPropertyValue(p)]),[r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100)]);});const before=snap(),link=document.querySelector('link[href*="application.css"]'),style=document.createElement('style');style.textContent=original;link.after(style);link.sheet.disabled=true;const after=snap();style.remove();link.sheet.disabled=false;return nodes.flatMap((n,i)=>before[i]===after[i]?[]:[n.tagName+'.'+n.className]);},original);expect(differences,route+' '+width+' '+theme).toEqual([]);
  }
 }
});
test('home stylesheet cleanup preserves computed appearance across widths and themes',async({page})=>{
 const files=['apps/portal/frontend/platform.css','packages/ui/platform-header.css','packages/ui/legal-footer.css','packages/ui/whatsapp.css','packages/ui/premium.bundle.css','apps/portal/frontend/home.css','packages/ui/platform-shell.css'];
 const original=require('esbuild').transformSync(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),{loader:'css',minify:true,target:'chrome114'}).code;
 await page.goto(base+'/');await expect(page.locator('.home-entry')).toHaveCount(0);
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  const differences=await page.evaluate(original=>{
   const nodes=[...document.querySelectorAll('body,body *')].filter(node=>!node.matches('script,style,link'));
   const properties=['display','position','font-family','font-size','font-weight','line-height','color','background-color','background-image','border-radius','padding','margin','gap','grid-template-columns','box-shadow'];
   function snapshot(){return nodes.map(node=>{const css=getComputedStyle(node),r=node.getBoundingClientRect();return JSON.stringify([properties.map(p=>css.getPropertyValue(p)),[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100)]);});}
   const before=snapshot(),link=document.querySelector('link[href*="home.bundle.css"]'),style=document.createElement('style');style.textContent=original;link.after(style);link.sheet.disabled=true;
   const after=snapshot();style.remove();link.sheet.disabled=false;
   return nodes.flatMap((node,i)=>before[i]===after[i]?[]:[{node:node.tagName+'.'+node.className,before:JSON.parse(before[i]),after:JSON.parse(after[i])}]).slice(0,3);
  },original);
  expect(differences,`${width}px ${theme}`).toEqual([]);
 }
});
test('home arrives complete, fetches premium CSS once and language settles after changes',async({page})=>{
 const response=await page.goto(base+'/');const html=await response.text();for(const name of ['home-filters','home-search'])expect(html).toContain('class="'+name+'"');
 await expect(page.locator('.home-entry')).toHaveCount(0);await expect(page.locator('.platform-language')).toBeVisible();
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/home.bundle.css').length)).toBe(1);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/shared/premium.css').length)).toBe(0);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname==='/shared/app-catalogue.js').length)).toBe(0);
 async function idleMutations(){return page.locator('[data-language-help]').evaluate(async node=>{let count=0;const observer=new MutationObserver(records=>count+=records.length);observer.observe(node,{childList:true,characterData:true,subtree:true});await new Promise(resolve=>setTimeout(resolve,250));observer.disconnect();return count;});}
 expect(await idleMutations()).toBe(0);await page.locator('.platform-language summary').click();await page.locator('[data-interface-language=hi]').click();await expect(page.locator('html')).toHaveAttribute('lang','hi');expect(await idleMutations()).toBe(0);await page.locator('.platform-language summary').click();await page.locator('[data-interface-language=en]').click();await expect(page.locator('html')).toHaveAttribute('lang','en');expect(await idleMutations()).toBe(0);
});

test('deferred game loading preserves newer choices and never loads unused controllers',async({page})=>{
 const loaded=[];page.on('request',r=>loaded.push(new URL(r.url()).pathname));await page.goto(base+'/take-a-break');await expect(page.locator('.break-card')).toHaveCount(7);
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
