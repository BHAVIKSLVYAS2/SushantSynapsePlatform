const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const live=process.argv.includes('--live'),root=path.resolve(__dirname,'../.publish/company-feature/public');
let server,browser;
async function main(){
 let origin='https://sushantsynapse.com';
 if(!live){server=http.createServer((req,res)=>{let p=new URL(req.url,'http://localhost').pathname;if(p==='/')p='/index.html';else if(!path.extname(p))p+='.html';const file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webm':'video/webm','.vtt':'text/vtt'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;}
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext(),page=await context.newPage(),errors=[],media=[];
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(origin).origin?r.continue():r.abort());
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('.webm'))media.push(r.url());});
 await page.goto(origin+'/',{waitUntil:'networkidle'});assert.equal(await page.locator('.app-card').count(),10);assert.equal(await page.locator('.app-card-featured').count(),2);
 assert.equal(media.length,0,'No video bytes requested before user playback');
 assert.equal(await page.locator('video[autoplay]').count(),0);assert.equal(await page.locator('video[preload="none"]').count(),2);
 for(const [i,id]of ['ritual-assist','ritvayam'].entries()){
  await page.locator('[data-demo-index="'+i+'"]').click();assert.equal(await page.locator('.demo-slide:not([hidden])').count(),1);
  assert(await page.locator('#demo-'+id).isVisible());assert.equal(await page.locator('[data-demo-index="'+i+'"]').getAttribute('aria-pressed'),'true');
  const slide=page.locator('#demo-'+id),video=slide.locator('video');await slide.locator('[data-play-demo]').click();
  await page.waitForFunction(id=>{const v=document.getElementById('video-'+id);return v.currentTime>.6&&!v.paused&&v.videoWidth===960},id,{timeout:20000});
  const info=await video.evaluate(v=>({duration:v.duration,captions:v.textTracks[0]?.cues?.length,error:v.error}));assert(info.duration>8&&info.duration<45,JSON.stringify(info));assert.equal(info.captions,4);assert.equal(info.error,null);console.log(id+' video decoded: '+info.duration.toFixed(1)+' seconds, '+info.captions+' caption cues');
  await page.locator('[data-demo-next]').click();assert(await video.evaluate(v=>v.paused),'Hidden slide must pause');
 }
 await page.locator('[data-demo-index="0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-demo-index="1"]').getAttribute('aria-pressed'),'true');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('[data-demo-index="0"]').getAttribute('aria-pressed'),'true');
 for(const width of [320,390,768,1440])for(const theme of ['light','dark'])for(const i of [0,1]){
  await page.setViewportSize({width,height:950});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-demo-index="'+i+'"]').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width+' '+theme+' '+i);
  await page.locator('.hero-showcase').scrollIntoViewIfNeeded();
  if(width===390||width===1440)await page.screenshot({path:'.publish/company-feature-'+width+'-'+theme+'-'+i+'.png'});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();assert(await page.locator('video').evaluateAll(videos=>videos.every(v=>v.paused)));
 for(const route of ['ritual-assist','rashifal-kundli'])assert.equal(await page.locator('.app-card-featured h3 a[href="https://apps.sushantsynapse.com/'+route+'"]').count(),1);
 await context.close();
 const nojs=await browser.newContext({javaScriptEnabled:false}),p=await nojs.newPage();await nojs.route('**/*',r=>new URL(r.request().url()).origin===new URL(origin).origin?r.continue():r.abort());await p.goto(origin+'/');assert.equal(await p.locator('.app-card').count(),10);assert(await p.locator('noscript a[href="/assets/demos/ritvayam.webm"]').isVisible());assert(await p.locator('#video-ritual-assist').isVisible());await nojs.close();
 assert.deepEqual(errors,[]);console.log('PASS: ten cards; two genuine playable videos/captions; no initial media fetch/autoplay; switch/pause/keyboard controls; 32 width/theme/slide states; reduced motion; no-JS fallback; zero page errors.');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
