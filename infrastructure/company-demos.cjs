// Record real public app workflows from the existing static production export.
// No accounts, personal inputs, business API calls or external providers.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('@playwright/test');
const {acknowledgeBeta}=require('../tests/browser-fixture');
const dist=path.resolve(__dirname,'cloudflare/dist'),out=path.resolve(__dirname,'../.publish/company-feature/public/assets/demos');
const pages=JSON.parse(fs.readFileSync(path.resolve(__dirname,'cloudflare/pages.json'),'utf8'));
const privacy=require('../apps/rashifal-kundli/privacy.cjs');
fs.mkdirSync(out,{recursive:true});
let server,browser;
async function main(){
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),file=path.resolve(dist,'.'+(pages[u.pathname]||u.pathname));if(req.method!=='GET'||!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{...(privacy.isVedic(u.pathname)?privacy.headers:{}),'Content-Type':type});res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const id of ['ritual-assist','ritvayam']){
  const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:1,colorScheme:'light',recordVideo:{dir:path.resolve(__dirname,'../.publish/company-feature/raw'),size:{width:960,height:640}}});
  await acknowledgeBeta(context);await context.addInitScript(()=>{localStorage.setItem('synapse-theme','light');localStorage.setItem('synapse-language','en')});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')&&r.request().method()==='GET'?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const video=page.video();
  if(id==='ritual-assist'){
   await page.goto(origin+'/ritual-assist',{waitUntil:'networkidle'});await page.locator('#calendar-launch-title').waitFor();
   await page.screenshot({path:path.join(out,id+'-poster.jpg'),type:'jpeg',quality:78});
   await page.waitForTimeout(2200);await page.locator('[data-guide="ganesh-puja"]').click();
   await page.locator('#guide-title').waitFor();await page.waitForTimeout(2400);
   const checks=page.locator('#guide input[data-item]');await checks.first().check();await page.waitForTimeout(1400);await checks.nth(1).check();await page.waitForTimeout(1700);
   await page.locator('#download').scrollIntoViewIfNeeded();const pending=page.waitForEvent('download');await page.locator('#download').click();await pending;await page.waitForTimeout(2200);
   console.log('Ritual Assist: real guide, two checked items and actual checklist download.');
  }else{
   await page.goto(origin+'/rashifal-kundli/rashifal',{waitUntil:'networkidle'});await page.locator('.rashifal-signs button').first().waitFor();
   await page.screenshot({path:path.join(out,id+'-poster.jpg'),type:'jpeg',quality:78});await page.waitForTimeout(2200);
   await page.locator('.rashifal-signs button').nth(4).click();await page.locator('.rashifal-prediction').waitFor();await page.waitForTimeout(2600);
   await page.locator('.rashifal-prediction').scrollIntoViewIfNeeded();await page.waitForTimeout(2600);
   await page.locator('.rashifal-calculations summary').click();await page.locator('.rashifal-transit-table').scrollIntoViewIfNeeded();await page.waitForTimeout(2600);
   console.log('Ritvayam: real Moon-sign selection, traditional reading and calculation table.');
  }
  if(errors.length)throw Error(errors.join('\n'));await context.close();await video.saveAs(path.join(out,id+'.webm'));console.log(id+' clip: '+fs.statSync(path.join(out,id+'.webm')).size+' bytes');
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
