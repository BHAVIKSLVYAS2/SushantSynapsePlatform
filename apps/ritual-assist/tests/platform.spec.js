const {test,expect}=require('../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-simple-remembrance-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{child?.kill();});
async function calculate(page,date){await page.goto(base+'/ritual-assist/calendar?view=remembrance');await page.locator('#date').fill(date);await page.locator('#time').fill('12:00');await page.locator('#calendar-location-query').fill('New Delhi');await page.locator('#calendar-location-results button').first().click();await page.locator('#calculate').click();await expect(page.getByRole('tab',{name:'First year & early rites',exact:true})).toBeVisible({timeout:30000});}
test('compact remembrance details, paired dates, edit invalidation and one share action',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-05T06:00:00Z'));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/ritual-assist/calendar?view=remembrance');await expect(page.getByRole('button',{name:'Share result',exact:true})).toHaveCount(0);
 await calculate(page,'2025-10-01');await expect(page.locator('.remembrance-edit-action')).toHaveText('Edit details');await expect(page.locator('.remembrance-detail-fact')).toHaveCount(3);
 await page.locator('#remembrance-year').selectOption('2027');await expect(page.locator('#remembrance-panel-1 .remembrance-pair')).toHaveCount(1);await expect(page.locator('#remembrance-panel-1 .remembrance-entry')).toHaveCount(2);await expect(page.locator('.remembrance-next,.next-label,#shraddha-theme,.remembrance-downloads')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Share result',exact:true})).toHaveCount(1);
 for(const theme of ['light','dark','deep'])for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});await page.evaluate(t=>window.SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:950});const columns=await page.locator('#remembrance-panel-1 .remembrance-pair-column').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));expect(columns[0].y).toBe(columns[1].y);expect(columns[1].x).toBeGreaterThan(columns[0].x);
 await page.locator('.input-details>summary').click();await expect(page.locator('.remembrance-edit-action')).toHaveText('Close details');await page.locator('#date').fill('2025-10-02');await expect(page.locator('.ritual-result-share')).toHaveCount(0);expect(errors).toEqual([]);
});

test('recent and first-year deaths select the appropriate period',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-05T06:00:00Z'));await calculate(page,'2026-11-01');await expect(page.getByRole('tab',{name:'First year & early rites',exact:true})).toHaveAttribute('aria-selected','true');await calculate(page,'2026-05-01');await expect(page.getByRole('tab',{name:'First year & early rites',exact:true})).toHaveAttribute('aria-selected','true');
});
test('portrait PNG themes preserve uncertainty and fit bilingual exceptional rows without clipping',async({page})=>{
 const response=page.waitForResponse(r=>r.url().endsWith('/api/ritual-assist/calendar'));await calculate(page,'2025-10-01');const payload=await(await response).json();
 const checks=await page.evaluate(async calendar=>{
  await document.fonts.ready;const {renderShraddhaCard}=await import('/ritual-assist/shraddha-card.mjs');const results=[];
  for(const language of ['en','hi'])for(const theme of ['ivory','midnight'])for(const scenario of ['normal','conditional','empty','long']){
   const data=structuredClone(calendar),year=data.yearly.find(y=>y.annual.length&&y.pitru.length);if(!year)throw Error('Fixture has no eligible year');
   if(scenario==='conditional')for(const row of [...year.annual,...year.pitru]){row.conditional=true;row.date=null;row.status='two-day-tie';}
   if(scenario==='empty'){year.annual=[];year.pitru=[];}
   if(scenario==='long'){data.data.location.name='A long observance location with several words for wrapping across multiple lines in the card header';year.annual.push(structuredClone(year.annual[0]));}
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),fill=ctx.fillText.bind(ctx),overflow=[];
   ctx.fillText=(text,x,y,...rest)=>{const width=ctx.measureText(text).width,left=ctx.textAlign==='center'?x-width/2:ctx.textAlign==='right'?x-width:x;if(left<20||left+width>1060||y<20||y>canvas.height)overflow.push({text,left,y,width});return fill(text,x,y,...rest);};
   const size=renderShraddhaCard(canvas,data,language,year.year,theme);results.push({language,theme,scenario,...size,overflow,uncertain:scenario!=='conditional'||canvas.getAttribute('aria-label').includes(language==='hi'?'संभावित':'Candidate')});
  }return results;
 },payload.result);
 expect(checks).toHaveLength(16);for(const result of checks){expect(result.overflow,JSON.stringify(result)).toEqual([]);expect(result.width).toBe(1080);expect(result.height).toBeGreaterThanOrEqual(700);expect(result.uncertain).toBe(true);}
});
test('ten-year PNG is a compact readable table with complete dates and uncertainty',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-05T06:00:00Z'));
 const response=page.waitForResponse(r=>r.url().endsWith('/api/ritual-assist/calendar'));await calculate(page,'2025-10-01');const payload=await(await response).json();
 const checks=await page.evaluate(async calendar=>{
  await document.fonts.ready;const {renderShraddhaCard}=await import('/ritual-assist/shraddha-card.mjs');const checks=[];
  for(const language of ['en','hi'])for(const exceptional of [false,true]){
   const data=structuredClone(calendar);if(exceptional){const year=data.yearly.find(y=>y.annual.length&&y.pitru.length);year.annual.push({...year.annual[0],conditional:true});year.pitru[0]={...year.pitru[0],date:null,conditional:true,status:'two-day-tie'};}
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),draw=ctx.fillText.bind(ctx),overflow=[],texts=[];
   ctx.fillText=(text,x,y,...rest)=>{texts.push(String(text));const width=ctx.measureText(text).width,left=ctx.textAlign==='center'?x-width/2:ctx.textAlign==='right'?x-width:x;if(left<20||left+width>1060||y<20||y>canvas.height)overflow.push({text,left,y,width});return draw(text,x,y,...rest);};
   renderShraddhaCard(canvas,data,language,'next-10');checks.push({language,exceptional,width:canvas.width,height:canvas.height,layout:canvas.dataset.cardLayout,rows:canvas.dataset.cardRows,expected:data.yearly.slice(0,10).flatMap(y=>[...y.annual,...y.pitru]).length,overflow,years:data.yearly.slice(0,10).every(y=>texts.includes(String(y.year))),uncertain:!exceptional||texts.some(text=>text.includes(language==='hi'?'पुष्टि':'confirmation'))});
  }return checks;
 },payload.result);
 for(const result of checks){expect(result.layout).toBe('year-table');expect(result.width).toBe(1080);expect(result.height).toBeLessThanOrEqual(2200);expect(Number(result.rows)).toBe(result.expected);expect(result.years).toBe(true);expect(result.uncertain).toBe(true);expect(result.overflow,JSON.stringify(result)).toEqual([]);}
 await page.getByRole('tab',{name:'Upcoming / by year',exact:true}).click();await page.locator('#remembrance-year').selectOption('next-10');await expect(page.locator('.shraddha-share-canvas')).toHaveAttribute('data-card-layout','year-table');
 await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));const download=page.waitForEvent('download');await page.locator('.ritual-result-share>button').click();const file=await download;await file.saveAs('.publish/shraddh-ten-year-readable.png');const bytes=fs.readFileSync('.publish/shraddh-ten-year-readable.png');expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBeLessThanOrEqual(2200);
});

test('single PNG share follows first-year, year ranges, language and native cancellation',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-05T06:00:00Z'));await page.addInitScript(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});});
 await calculate(page,'2026-11-01');const canvas=page.locator('.shraddha-share-canvas'),share=page.locator('.ritual-result-share>button');await expect(canvas).toHaveAttribute('data-card-scope','first-year');await expect(share).toBeEnabled();
 const first=page.waitForEvent('download');await share.click();const file=await first;expect(file.suggestedFilename()).toBe('ritual-assist-first-year.png');await file.saveAs(path.join(dir,'first.png'));expect(fs.readFileSync(path.join(dir,'first.png')).subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
 await page.getByRole('tab',{name:'Upcoming / by year',exact:true}).click();for(const count of [2,5,10]){await page.locator('#remembrance-year').selectOption(`next-${count}`);await expect(canvas).toHaveAttribute('data-card-scope','year');await expect(page.locator('#remembrance-panel-1 .remembrance-year')).toHaveCount(count);await expect(share).toBeEnabled();}
 await page.locator('#remembrance-year').selectOption('2028');await expect(canvas).toHaveAttribute('data-card-rows','2');await page.evaluate(()=>{const s=document.getElementById('language');s.value='hi';s.dispatchEvent(new Event('change'));});await expect(canvas).toHaveAttribute('data-card-theme','ivory');await expect(share).toBeEnabled();
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared={name:data.files[0].name,type:data.files[0].type};}});});await share.click();expect(await page.evaluate(()=>window.shared)).toEqual({name:'ritual-assist-shraddha-barsi-2028.png',type:'image/png'});
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}}));await share.click();await expect(share).toBeEnabled();await expect(page.locator('.ritual-result-share [role=status]')).toBeEmpty();
});
