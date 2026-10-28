// Read-only UI survey. All account/database activity uses disposable test fixtures.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {startPreview}=require('../tests/organisation-preview-fixture.cjs');
const {acknowledgeBeta,interceptAds}=require('../tests/browser-fixture.js');
const {staticAssets}=require('../server/static-assets');
async function main(){
 const phase=process.argv[2]||'before',only=process.argv[3],out=path.resolve('.publish/ui-ux-audit',phase);fs.mkdirSync(out,{recursive:true});
 const report={phase,generatedAt:new Date().toISOString(),screens:[],sourcePages:[]};
 const routes=[...new Set(Object.keys(staticAssets).filter(r=>staticAssets[r].endsWith('.html')&&(r==='/'||!r.endsWith('/'))))];
 for(const route of routes){const source=staticAssets[route],html=fs.readFileSync(source,'utf8');report.sourcePages.push({route,source,dialogs:(html.match(/<dialog\b/g)||[]).length,forms:(html.match(/<form\b/g)||[]).length,details:(html.match(/<details\b/g)||[]).length});}
 const fixture=await startPreview({enabled:false}),browser=await chromium.launch({channel:'chrome',headless:true});
 async function context(){const c=await browser.newContext();await acknowledgeBeta(c);await interceptAds(c);return c;}
 const c=await context(),page=await c.newPage();
 async function scan(route,{base=fixture.base,page:target=page,role='public'}={}){
  const errors=[],badResponses=[];const onError=e=>errors.push(e.message),onResponse=r=>{if(r.status()>=400&&r.url().startsWith(base))badResponses.push({path:new URL(r.url()).pathname,status:r.status()});};target.on('pageerror',onError);target.on('response',onResponse);
  try{
   // Hash navigation and background requests need not become network-idle.
   const response=await target.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
   if(!response||response.ok())await target.locator('.platform-shell,.admin-header').first().waitFor({timeout:10000});
   await target.waitForTimeout(300);
   const layouts=[];for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
    await target.setViewportSize({width,height:900});await target.evaluate(t=>window.SynapseTheme?.write(t),theme);
    layouts.push(await target.evaluate(({width,theme})=>({width,theme,overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth}),{width,theme}));
    if((width===390&&theme==='light')||(width===1440&&theme==='dark')){
     const fullPage=await target.evaluate(()=>document.documentElement.scrollHeight<18000);
     await target.screenshot({path:path.join(out,(role+'-'+route.replace(/[^a-z0-9]/gi,'_')+'-'+width+'-'+theme).slice(0,170)+'.png'),fullPage,animations:'disabled'});
    }
   }
   const inventory=await target.evaluate(()=>{
    const visible=n=>!!(n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');
    return {title:document.title,headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(n=>n.textContent.trim()),
     controls:[...document.querySelectorAll('button,input:not([type=hidden]),select,textarea,summary,[role=tab]')].map(n=>({tag:n.tagName,id:n.id,text:(n.getAttribute('aria-label')||n.labels?.[0]?.textContent||n.textContent||'').trim().slice(0,100),visible:visible(n),disabled:n.disabled||false})),
     dialogs:[...document.querySelectorAll('dialog,[role=dialog]')].map(n=>({id:n.id,label:n.getAttribute('aria-label')||n.getAttribute('aria-labelledby'),open:!!n.open})),
     links:[...document.querySelectorAll('a[href]')].filter(visible).map(n=>({text:n.textContent.trim().slice(0,80),href:n.getAttribute('href')})),
     smallTargets:[...document.querySelectorAll('button,a,summary,input:not([type=hidden]),select')].filter(visible).filter(n=>{const r=n.getBoundingClientRect();return r.width<24||r.height<24;}).map(n=>({tag:n.tagName,text:(n.getAttribute('aria-label')||n.textContent||n.id).trim().slice(0,80)}))};
   });
   report.screens.push({route,role,artifactPhase:phase,status:response?.status()??200,...inventory,layouts,errors,badResponses});
   process.stdout.write(JSON.stringify({route,role,status:response?.status(),overflow:layouts.filter(l=>l.overflow).length,errors:errors.length})+'\n');
  }catch(error){report.screens.push({route,role,error:error.message});process.stdout.write('Scan failed '+route+': '+error.message+'\n');}
  finally{target.off('pageerror',onError);target.off('response',onResponse);fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(report,null,2));}
 }
 let governance;
 try{
  for(const route of routes.filter(r=>(!only||r===only)&&!['/admin','/super-admin','/account','/organisation-audit','/platform-audit','/client-access','/client-portal'].includes(r)))await scan(route);
  if(only)return;
  for(const route of ['/satire-arena/results','/satire-arena/characters/namo-nimbus'])await scan(route);
  await page.request.post(fixture.base+'/api/auth/login',{data:{email:'super@example.com',password:fixture.password}});
  for(const route of ['/','/digital-samaj','/batchfee-lite','/tournament-lite',...['dashboard','cases','clients','hearings','tasks','documents','notes','billing','reports','activity','archive','settings','ledger'].map(r=>'/advocate#'+r)])await scan(route,{role:'legacy-owner'});
  governance=await startPreview({chambers:true,multi:true});const g=await context(),gp=await g.newPage();
  await gp.request.post(governance.base+'/api/auth/login',{data:{email:'master@example.com',password:governance.password}});
  for(const route of ['/account','/admin','/organisation-audit','/client-access','/client-portal','/super-admin','/platform-audit'])await scan(route+'?organisation='+governance.organisationId,{base:governance.base,page:gp,role:'master'});
  await gp.request.post(governance.base+'/api/auth/login',{data:{email:'super@example.com',password:governance.password}});
  for(const route of ['/super-admin','/platform-audit'])await scan(route,{base:governance.base,page:gp,role:'super'});
 }finally{await browser.close();await fixture.stop();await governance?.stop();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
