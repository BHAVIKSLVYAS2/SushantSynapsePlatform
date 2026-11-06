const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const {acknowledgedContext}=require('../tests/browser-fixture');
const root=path.resolve(process.env.COMPANY_PUBLIC_DIR||'C:/Code/WebsitesApps/sushant-synapse-static/public');
 const live=process.argv.includes('--live');
const appOrigin=process.env.AUDIT_APP_ORIGIN||'https://apps.sushantsynapse.com';
const verifyApps=!process.argv.includes('--company-only')&&(live||process.env.AUDIT_APP_ORIGIN);
const ids=['qr-maker','photo-resize','bill-splitter','moment-studio','focus','decision-wheel','team-mixer','timetable-lite'];
const cardIds=['ritual-assist','rashifal-kundli',...ids];
let server,browser;
async function run(){
 let origin='https://sushantsynapse.com';
 if(!live){server=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/')p='/index.html';else if(!path.extname(p))p+='.html';let file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}let status=200;if(!fs.existsSync(file)){file=path.join(root,'404.html');status=404;}res.writeHead(status,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;}
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await acknowledgedContext(browser),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('https://**/*',r=>new URL(r.request().url()).origin===new URL(origin).origin||new URL(r.request().url()).origin===new URL(appOrigin).origin?r.continue():r.abort());
 const titles=new Set(),descriptions=new Set();
 for(const route of ['/','/about','/contact','/privacy','/terms']){
  const response=await page.goto(origin+route);assert.equal(response.status(),200,route);
  assert.equal(await page.locator('h1').count(),1,route+' h1');
  const title=await page.title(),desc=await page.locator('meta[name=description]').getAttribute('content');assert(!titles.has(title));titles.add(title);assert(desc?.length>40&&!descriptions.has(desc));descriptions.add(desc);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://sushantsynapse.com'+route);
  assert.equal(await page.locator('meta[name=robots][content*=noindex]').count(),0);
  assert.equal(await page.locator('footer nav a').count(),5);
  assert.equal(await page.locator('script[src*="adsbygoogle"]').count(),route==='/'?1:0);
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:900});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow '+width+' '+theme+' '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right})).slice(0,12))));
   if(route==='/'&&width===390){await page.locator('#apps h2').scrollIntoViewIfNeeded();await page.screenshot({path:'.publish/adsense-company-'+theme+'-mobile.png'});}
   if(route==='/'&&width===1440&&theme==='dark'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.publish/adsense-company-desktop.png',fullPage:true});}
  }
  const urls=await page.locator('a[href],link[rel=stylesheet],script[src],img[src]').evaluateAll(nodes=>nodes.map(n=>n.href||n.src));
  for(const url of new Set(urls)){const u=new URL(url);if(u.origin!==new URL(origin).origin)continue;const response=await page.request.get(url);assert(response.ok(),'Broken local link '+url);if(u.hash){assert((await response.text()).includes('id="'+u.hash.slice(1)+'"'),'Missing fragment '+url);}}
 }
 await page.goto(origin+'/');assert.equal(await page.locator('.app-card').count(),cardIds.length);
 for(const id of cardIds)assert.equal(await page.locator('.app-card h3 a[href="https://apps.sushantsynapse.com/'+id+'"]').count(),1);
 await page.locator('.app-card summary').first().click();assert(await page.locator('.app-card details').first().getAttribute('open')!==null);
 await page.locator('.theme-toggle').click();const saved=await page.evaluate(()=>localStorage.getItem('theme'));await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),saved);
 await page.setViewportSize({width:390,height:844});await page.locator('.menu').click();assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'true');await page.locator('.nav nav a[href="#apps"]').click();assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'false');
 const xml=await (await page.request.get(origin+'/sitemap.xml')).text();assert.equal((xml.match(/<loc>/g)||[]).length,5);for(const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)){assert((await page.request.get(match[1].replace('https://sushantsynapse.com',origin))).ok());}
 assert((await (await page.request.get(origin+'/robots.txt')).text()).includes('Sitemap: https://sushantsynapse.com/sitemap.xml'));
 assert.equal((await page.request.get(origin+'/audit-missing-page')).status(),404);
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false});await nojs.route('https://pagead2.googlesyndication.com/**',r=>r.abort());const staticPage=await nojs.newPage();await staticPage.goto(origin+'/');assert.equal(await staticPage.locator('.app-card h3 a').count(),cardIds.length);assert(await staticPage.locator('#apps h2').isVisible());assert(await staticPage.locator('.hero h1').isVisible());await nojs.close();
 const blocked=await browser.newContext();await blocked.route('https://pagead2.googlesyndication.com/**',r=>r.abort());await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('Blocked')};Storage.prototype.setItem=()=>{throw Error('Blocked')};});const p=await blocked.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/');const initial=await p.locator('html').getAttribute('data-theme');await p.locator('.theme-toggle').click();assert.notEqual(await p.locator('html').getAttribute('data-theme'),initial);await blocked.close();
 if(verifyApps){const c=await acknowledgedContext(browser),p=await c.newPage();await c.route('**/*',r=>new URL(r.request().url()).origin===new URL(appOrigin).origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());p.on('pageerror',e=>errors.push(e.message));for(const id of ['',...ids]){await p.goto(appOrigin+'/'+id,{waitUntil:'domcontentloaded'});assert.equal(await p.locator('link[rel=canonical]').getAttribute('href'),'https://apps.sushantsynapse.com/'+id);assert.equal(await p.locator('.synapse-legal-footer a[href="https://sushantsynapse.com/"]').count(),1);for(const width of [390,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'App overflow '+id);}if(id==='qr-maker'){await p.locator('#content').fill('https://example.com/readiness');await p.locator('#editor button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#download').disabled);const download=p.waitForEvent('download');await p.locator('#download').click();const d=await download;await d.saveAs('.publish/adsense-qr.png');assert.equal(fs.readFileSync('.publish/adsense-qr.png').subarray(1,4).toString(),'PNG');}}await c.close();}
 assert.deepEqual(errors,[]);console.log('PASS: 5 pages; unique metadata/canonicals; 40 layouts; internal links/assets/fragments; '+cardIds.length+' real app links; theme/storage/menu; no-JS content; sitemap/robots; 404'+(verifyApps?'; 9 Curio pages, footer/canonical/mobile and real QR PNG':''));
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
