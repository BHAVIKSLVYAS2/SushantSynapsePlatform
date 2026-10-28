// Reproducible local lab measurements; never accesses production business data.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {chromium}=require('playwright');
const {startPreview}=require('../tests/organisation-preview-fixture.cjs');
const {acknowledgeBeta,interceptAds}=require('../tests/browser-fixture.js');
async function main(){
 const label=process.argv[2]||'baseline',out=path.resolve('.publish/frontend-performance');fs.mkdirSync(out,{recursive:true});
 const fixture=await startPreview({enabled:false}),browser=await chromium.launch({channel:'chrome'}),results=[];
 try{
  for(const route of ['/','/ritual-assist?guide=day-11','/rashifal-kundli/matching','/take-a-break','/news'])for(let sample=0;sample<3;sample++){
   const context=await browser.newContext({viewport:{width:390,height:844}});await acknowledgeBeta(context);await interceptAds(context);
   const page=await context.newPage(),client=await context.newCDPSession(page);
   await client.send('Network.enable');await client.send('Network.setCacheDisabled',{cacheDisabled:true});
   await client.send('Emulation.setCPUThrottlingRate',{rate:4});
   await client.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:200000,uploadThroughput:100000});
   await client.send('Performance.enable');await page.coverage.startCSSCoverage();
   await page.addInitScript(()=>{window.__lab={lcp:0,cls:0,longTasks:[]};for(const [type,apply]of [['largest-contentful-paint',e=>window.__lab.lcp=e.startTime],['layout-shift',e=>{if(!e.hadRecentInput)window.__lab.cls+=e.value;}],['longtask',e=>window.__lab.longTasks.push(e.duration)]])try{new PerformanceObserver(list=>list.getEntries().forEach(apply)).observe({type,buffered:true});}catch{}});
   await page.goto(fixture.base+route);await page.waitForTimeout(1200);
   const metrics=(await client.send('Performance.getMetrics')).metrics;
   const measurement=await page.evaluate(()=>({ ...window.__lab,dom:document.querySelectorAll('*').length,resources:performance.getEntriesByType('resource').map(r=>({url:new URL(r.name).pathname,bytes:r.decodedBodySize,encoded:r.encodedBodySize,duration:r.duration})),navigation:performance.getEntriesByType('navigation').map(n=>({dcl:n.domContentLoadedEventEnd,load:n.loadEventEnd})),paint:performance.getEntriesByType('paint').map(p=>({name:p.name,start:p.startTime}))}));
   const css=await page.coverage.stopCSSCoverage();measurement.css=css.map(s=>({url:new URL(s.url).pathname,bytes:s.text.length,used:s.ranges.reduce((sum,r)=>sum+r.end-r.start,0)}));
   measurement.cpu=Object.fromEntries(metrics.filter(m=>['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','JSHeapUsedSize'].includes(m.name)).map(m=>[m.name,m.value]));
   if(route==='/'){
    measurement.search=await page.evaluate(()=>{const input=document.querySelector('#home-search-input');let mutations=0;const observer=new MutationObserver(records=>mutations+=records.length);observer.observe(document.querySelector('.public-home'),{subtree:true,childList:true,attributes:true,characterData:true});const start=performance.now();for(let i=0;i<30;i++){input.value=i%2?'QR':'kundli';input.dispatchEvent(new Event('input',{bubbles:true}));}const duration=performance.now()-start;mutations+=observer.takeRecords().length;observer.disconnect();input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));return {duration,mutations};});
    await page.locator('[data-home-vedic]').scrollIntoViewIfNeeded();await page.waitForSelector('[data-calendar-ready=true]');
    measurement.almanac=await page.evaluate(()=>{const panel=document.querySelector('.daily-almanac');let count=0;const observer=new MutationObserver(records=>count+=records.length);observer.observe(panel,{subtree:true,childList:true,characterData:true});for(let i=0;i<5;i++)window.dispatchEvent(new Event('pageshow'));count+=observer.takeRecords().length;observer.disconnect();return {sameStateMutations:count};});
   }
   results.push({route,sample,...measurement});console.log('Measured',route,'sample',sample+1);await context.close();
  }
  const cssFile='apps/portal/frontend/home.bundle.css',css=fs.readFileSync(cssFile);
  const report={label,metricNotes:{cls:'Unexpected layout-shift sum during capture; not the official session-window maximum.',search:'Synchronous synthetic workload, not INP.'},conditions:{cpuSlowdown:4,latencyMs:100,downloadBytesPerSecond:200000,coldCache:true,samplesPerRoute:3,externalAds:'blocked',origin:'isolated local Node fixture'},assets:{homeCss:{bytes:css.length,gzip:zlib.gzipSync(css).length}},results};
  fs.writeFileSync(path.join(out,label+'.json'),JSON.stringify(report,null,2));
  const median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)];
  for(const route of [...new Set(results.map(r=>r.route))]){const rows=results.filter(r=>r.route===route);console.log(JSON.stringify({route,lcpMs:median(rows.map(r=>r.lcp)),cls:median(rows.map(r=>r.cls)),scriptMs:median(rows.map(r=>r.cpu.ScriptDuration*1000)),bytes:rows[0].resources.reduce((n,r)=>n+r.bytes,0),searchMs:rows[0].search&&median(rows.map(r=>r.search.duration)),sameStateMutations:rows[0].almanac?.sameStateMutations}));}
 }finally{await browser.close();await fixture.stop();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
