const {test,expect}=require('@playwright/test'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {headers}=require('../privacy.cjs');let server,origin;
test.beforeAll(async()=>{
 if(process.env.VEDIC_LIVE_ORIGIN){origin=process.env.VEDIC_LIVE_ORIGIN;return;}
 const pages=JSON.parse(fs.readFileSync('infrastructure/cloudflare/pages.json','utf8'));
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),target=pages[url.pathname]||url.pathname;
  const file=path.join(process.cwd(),'infrastructure/cloudflare/dist',target);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{...headers,'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
test('built production Kundli computes privately, loads worker and preserves mobile themes',async({page})=>{
 const errors=[],requests=[],workers=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r));page.on('worker',w=>workers.push(w.url()));
 const r=await page.goto(origin+'/rashifal-kundli');expect(r.headers()['content-security-policy']).toContain("connect-src 'none'");
 await expect(page.getByRole('heading',{name:'Rashifal & Kundli · verification preview'})).toBeVisible();
 await page.locator('#birth-date').fill('2000-01-01');await page.locator('#birth-time').fill('12:15');await page.locator('#birth-query').fill('New Delhi');await page.locator('#birth-place').selectOption('geonames:1261481');
 await page.locator('form button[type=submit]').click();await page.locator('#birth-calculate').click();await expect(page.locator('[data-feature=dasha] table tbody tr')).toHaveCount(9);
 for(const width of [320,390,1440])for(const theme of ['light','dark','system']){
  await page.setViewportSize({width,height:900});await page.locator('#theme').selectOption(theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.screenshot({path:'.publish/vedic-production-preview.png',fullPage:true});
 await page.locator('#birth-accuracy').selectOption('approximate');await page.locator('#birth-precision').fill('10');await page.locator('form button[type=submit]').click();await page.locator('#birth-calculate').click();
 await page.locator('#sensitivity-analyze').click();await expect(page.locator('#sensitivity-results [data-component=moonRashi]')).toBeVisible({timeout:30000});
 expect(workers.some(url=>url.includes('/rashifal-kundli/sensitivity-worker.mjs'))).toBe(true);expect(errors).toEqual([]);
 expect(requests.every(r=>r.method()==='GET'&&r.url().startsWith(origin)&&!new URL(r.url()).search)).toBe(true);
 expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
});
for(const route of ['rashifal','matching','time-machine'])test('built '+route+' entry mounts without third-party requests',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto(origin+'/rashifal-kundli/'+route);
 await expect(page.locator('main')).not.toBeEmpty();await expect(page.locator('header nav')).toBeVisible();expect(errors).toEqual([]);expect(requests.every(url=>url.startsWith(origin))).toBe(true);
});
