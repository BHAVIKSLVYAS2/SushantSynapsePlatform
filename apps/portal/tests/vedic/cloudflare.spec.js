const {test,expect}=require('../../../../tests/browser-fixture.js');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');let server,origin;
test.beforeAll(async()=>{
 if(process.env.HOME_LIVE_ORIGIN){origin=process.env.HOME_LIVE_ORIGIN;return;}
 const root=path.resolve('infrastructure/cloudflare/dist'),pages=JSON.parse(fs.readFileSync('infrastructure/cloudflare/pages.json','utf8'));
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/auth/status'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({user:null}));return;}
  const file=path.resolve(root,'.'+(pages[url.pathname]||url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/javascript'});res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
test('exported home resolves the lazy calendar bundle and both Vedic entry points',async({page})=>{
 const errors=[],editorial=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/arena-editorial'))editorial.push(r.url());});
 await page.goto(origin+'/');const card=page.locator('[data-home-vedic]');await card.scrollIntoViewIfNeeded();await expect(card).toHaveAttribute('data-calendar-ready','true');
 await expect(card.locator('[data-vedic-samvat]')).toHaveText(/^\d{4}$/);await expect(card.locator('[data-vedic-note]')).toContainText('Chaitra-year');
 await expect(page.locator('[data-home-satire]')).toHaveCount(0);expect(editorial).toEqual([]);
 await card.getByRole('link',{name:'Read your Rashifal'}).click();await expect(page.locator('.vedic-rashifal')).toBeVisible();expect(errors).toEqual([]);
});
test('calendar-load failure leaves useful links and honest unavailable values',async({page})=>{
 await page.route('**/*home-calendar.mjs*',route=>route.abort());await page.goto(origin+'/');const card=page.locator('[data-home-vedic]');await card.scrollIntoViewIfNeeded();await expect(card).toHaveAttribute('data-calendar-ready','false');
 await expect(card.locator('[data-vedic-note]')).toContainText('temporarily unavailable');await expect(card.locator('[data-vedic-samvat]')).toHaveText('—');
 await expect(card.getByRole('link',{name:'Explore Kundli'})).toHaveAttribute('href','/rashifal-kundli');
});
