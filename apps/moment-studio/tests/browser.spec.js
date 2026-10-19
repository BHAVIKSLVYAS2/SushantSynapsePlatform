const {test,expect}=require('../../../tests/browser-fixture.js');const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');let child,base,dir;
test.beforeEach(async({page})=>{page.on('dialog',dialog=>dialog.accept());});
test('reference workspace keeps the artboard visible while controls scroll and exports directly',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/moment-studio');
 await expect(page.locator('#quick-png')).toBeInViewport();await expect(page.locator('#quick-pdf')).toBeInViewport();
 const before=await page.locator('#certificate').boundingBox();
 const scroll=await page.locator('#details').evaluate(el=>{el.scrollTop=500;return {top:el.scrollTop,scroll:el.scrollHeight,height:el.clientHeight};});
 expect(scroll.top).toBe(500);expect(scroll.scroll).toBeGreaterThan(scroll.height);expect(Math.abs((await page.locator('#certificate').boundingBox()).y-before.y)).toBeLessThan(2);
 await page.getByLabel('Recipient Name',{exact:true}).fill('Meera');await page.getByLabel('Appreciation / Contribution Description').fill('bringing the team together');
 await page.locator('#quick-quality').selectOption('300');await expect(page.locator('#downloads')).toBeHidden();
 const event=page.waitForEvent('download');await page.locator('#quick-png').click();const output=await event,target=path.join(dir,'reference-direct.png');await output.saveAs(target);const bytes=fs.readFileSync(target);expect(bytes.readUInt32BE(16)).toBe(3508);expect(bytes.readUInt32BE(20)).toBe(2480);
 await expect(page.locator('#export-status')).toContainText('PNG ready');await expect(page.locator('#quick-png')).toBeEnabled();
});
test('certificate entry keeps desktop preview beside the editor and supports expanded inspection',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/moment-studio');
 await expect(page.locator('#certificate')).toBeVisible();await expect(page.locator('#templates input')).toHaveCount(5);
 const layout=await page.evaluate(()=>{const form=document.querySelector('#details').getBoundingClientRect(),preview=document.querySelector('.preview-column').getBoundingClientRect();return {children:[...document.querySelector('.workspace').children].map(e=>e.tagName),sameRow:Math.abs(form.top-preview.top)<3,right:preview.left>=form.right};});
 expect(layout).toEqual({children:['FORM','SECTION'],sameRow:true,right:true});
 await expect(page.locator('#details #batch-file')).toHaveCount(1);
 await page.locator('[name=recipient]').fill('Meera Sharma');await page.getByLabel('Appreciation / Contribution Description').fill('bringing the whole team together');
 await expect(page.locator('#certificate')).toHaveAttribute('aria-label',/Meera Sharma/);
 await page.locator('#expand-preview').click();await expect(page.locator('#preview-dialog')).toBeVisible();await expect(page.locator('#expanded-certificate')).toHaveAttribute('aria-label',/Meera Sharma/);
 await expect(page.locator('#close-preview')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#preview-dialog')).not.toBeVisible();await expect(page.locator('#expand-preview')).toBeFocused();
 await page.locator('#details').scrollIntoViewIfNeeded();await page.locator('#details').evaluate(el=>el.scrollTop=900);
 expect(await page.locator('.preview-column').evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:900});await page.evaluate(t=>SynapseTheme.write(t),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:900});
 const mobile=await page.evaluate(()=>document.querySelector('#details').getBoundingClientRect().top<document.querySelector('.preview-column').getBoundingClientRect().top);expect(mobile).toBe(true);
 await page.goto(base+'/moment-studio/cards?occasion=birthday');await expect(page.locator('#occasion')).toHaveValue('birthday');await expect(page.locator('#download')).toBeEnabled();expect(errors).toEqual([]);
});
test('simple cards preserve styling, validate photos and keep responsive exports',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/moment-studio/cards');
 await expect(page.locator('.tool-tile,#open-command,.studio-toolbar')).toHaveCount(0);
 await expect(page.locator('.workspace > *')).toHaveCount(2);
 await expect(page.locator('#occasion option')).toHaveCount(7);
 await page.locator('#design-options').evaluate(el=>el.open=true);
 await page.getByRole('radio',{name:'Bloom',exact:true}).check();
 await page.locator('#personalise').evaluate(el=>el.open=true);await page.locator('#palette').selectOption('rose');
 await page.locator('#occasion').selectOption('invitation');
 await expect(page.getByRole('radio',{name:'Bloom',exact:true})).toBeChecked();await expect(page.locator('#palette')).toHaveValue('rose');
 await page.locator('#event-date').fill('2026-10-18');await page.locator('#event-time').fill('18:00');await page.locator('#event-venue').fill('Community Hall');
 await expect(page.locator('#card')).toHaveAttribute('aria-label',/18 October 2026 · 18:00 · Community Hall/);
 await page.locator('[name=details]').fill('Please arrive early');
 await page.locator('#suggest').click();
 await expect(page.locator('[name=details]')).toHaveValue('Please arrive early');
 await expect(page.locator('#card')).toHaveAttribute('aria-label',/Community Hall · Please arrive early/);
 await page.locator('#photo-drop').evaluate(el=>{const dt=new DataTransfer();dt.items.add(new File(['invalid'],'bad.txt',{type:'text/plain'}));el.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));});
 await expect(page.locator('#photo-status')).toContainText('Choose a PNG');await expect(page.locator('#download')).toBeEnabled();
 for(const theme of ['light','dark']){await page.evaluate(value=>window.SynapseTheme.write(value),theme);for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
 await page.setViewportSize({width:1440,height:950});await page.screenshot({path:'test-results/moment-simple-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await expect(page.locator('#editor')).toBeInViewport();
 await page.evaluate(()=>window.SynapseTheme.write('light'));await page.screenshot({path:'test-results/moment-simple-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-moment-studio-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});

test('mobile creation starts at the form with visible wording and task-specific fields',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const occasion of ['birthday','invitation','condolence','remembrance']){
  await page.goto(base+'/moment-studio/cards?occasion='+occasion);
  await expect(page.locator('#editor')).toBeInViewport();
  await expect(page.locator('[name=name]')).toBeInViewport();await expect(page.locator('#design-options')).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.querySelector('#editor').getBoundingClientRect().top<document.querySelector('.preview-column').getBoundingClientRect().top)).toBe(true);
  await expect(page.locator('#language')).toBeVisible();await expect(page.locator('#language option')).toHaveText(['English','Hindi / हिन्दी']);
  for(const field of ['title','message','name','from','details'])await expect(page.locator('[name='+field+']')).toBeVisible();
  await expect(page.locator('#photo')).toBeVisible();await expect(page.locator('#personalise')).not.toHaveAttribute('open','');
  await expect(page.locator('#wording,#condolence-tools,#message-tone,#connection,#generate-message,.edit-shortcut')).toHaveCount(0);
  if(occasion==='remembrance'){await expect(page.locator('#remembrance-gathering')).not.toHaveAttribute('open','');for(const field of ['event-date','event-time','event-venue'])await expect(page.locator('#'+field)).toBeHidden();await page.locator('#remembrance-gathering summary').click();}
  const event=['invitation','remembrance'].includes(occasion);
  for(const field of ['event-date','event-time','event-venue'])if(event)await expect(page.locator('#'+field)).toBeVisible();else await expect(page.locator('#'+field)).toBeHidden();
  if(occasion==='invitation'){await expect(page.getByLabel('Event name',{exact:true})).toBeVisible();await expect(page.getByLabel('Guest name',{exact:false})).toBeVisible();await expect(page.getByLabel('Host',{exact:false})).toBeVisible();}
  await expect(page.locator('#download')).toBeEnabled();
 }
});

test('language and occasion follow untouched starters while personal wording survives until confirmed replacement',async({page})=>{
 let automaticDialogs=0;page.on('dialog',()=>automaticDialogs++);
 await page.goto(base+'/moment-studio/cards?occasion=birthday');
 const english=await page.locator('[name=message]').inputValue();await page.locator('#language').selectOption('hi');
 await expect(page.locator('[name=message]')).toHaveValue(/\p{Script=Devanagari}/u);await page.locator('#language').selectOption('en');await expect(page.locator('[name=message]')).toHaveValue(english);
 await page.locator('[name=title]').fill('Our community celebration');await page.locator('[name=message]').fill('A message written for this family.');await page.locator('[name=name]').fill('Private recipient');await page.locator('[name=from]').fill('Private sender');await page.locator('[name=details]').fill('Bring your favourite memory');
 await page.locator('#occasion').selectOption('invitation');await page.locator('#language').selectOption('hi');
 await expect(page.locator('[name=title]')).toHaveValue('Our community celebration');await expect(page.locator('[name=message]')).toHaveValue('A message written for this family.');
 expect(automaticDialogs).toBe(0);
 await page.locator('#event-date').fill('2026-10-18');await page.locator('#event-time').fill('18:00');await page.locator('#event-venue').fill('Community Hall');
 page.removeAllListeners('dialog');let replacements=0;page.once('dialog',async dialog=>{replacements++;expect(dialog.type()).toBe('confirm');await dialog.dismiss();});await page.locator('#suggest').click();
 await expect(page.locator('[name=message]')).toHaveValue('A message written for this family.');await expect(page.locator('[name=title]')).toHaveValue('Our community celebration');
 page.once('dialog',async dialog=>{replacements++;await dialog.accept();});await page.locator('#suggest').click();await expect(page.locator('[name=message]')).toHaveValue(/\p{Script=Devanagari}/u);expect(replacements).toBe(2);
 await expect(page.locator('[name=title]')).toHaveValue('Our community celebration');
 for(const [field,value]of [['name','Private recipient'],['from','Private sender'],['details','Bring your favourite memory']])await expect(page.locator('[name='+field+']')).toHaveValue(value);
 await expect(page.locator('#event-date')).toHaveValue('2026-10-18');await expect(page.locator('#event-time')).toHaveValue('18:00');await expect(page.locator('#event-venue')).toHaveValue('Community Hall');
 await page.reload();await expect(page.locator('[name=name]')).toHaveValue('');await expect(page.locator('[name=from]')).toHaveValue('');await expect(page.locator('#event-date')).toHaveValue('');
});

test('all studio sections are discoverable on mobile with exactly one current section',async({page})=>{
 await page.setViewportSize({width:320,height:850});await page.goto(base+'/moment-studio');
 const nav=page.getByRole('navigation',{name:'Moment Studio sections'});
 for(const link of await nav.getByRole('link').all()){await expect(link).toBeVisible();const box=await link.boundingBox();expect(box.y+box.height).toBeLessThan(850);}
 await expect(nav.locator('[aria-current=page]')).toHaveCount(1);
 await expect(nav.locator('[aria-current=page]')).toHaveAttribute('data-studio-section','certificates');
 await expect(nav.getByRole('link').first()).toHaveAttribute('data-studio-section','certificates');
 await nav.getByRole('link',{name:'Condolences & remembrance',exact:true}).click();
 await expect(page.locator('#language')).toBeVisible();await expect(page.locator('[name=message]')).toBeVisible();
 await expect(page.locator('#wording,#condolence-tools,#message-tone,#connection,#generate-message,.edit-shortcut')).toHaveCount(0);
 await expect(nav.locator('[aria-current=page]')).toHaveCount(1);
 await expect(nav.locator('[aria-current=page]')).toHaveAttribute('data-studio-section','condolences');
 await page.screenshot({path:'test-results/moment-navigation-mobile.png'});
 await page.getByRole('link',{name:'Cards & greetings',exact:true}).click();
 await expect(nav.locator('[aria-current=page]')).toHaveCount(1);
 await expect(nav.locator('[aria-current=page]')).toHaveAttribute('data-studio-section','cards');
 await nav.getByRole('link',{name:'Certificates & awards',exact:true}).click();
 await expect(nav.locator('[aria-current=page]')).toHaveAttribute('data-studio-section','certificates');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('editable bilingual condolences, all branded card designs and real PNG export, merged navigation and private copying',async({page})=>{
const api=[],errors=[];page.on('request',r=>{if(r.url().includes('/api/')&&new URL(r.url()).pathname!=='/api/platform/visitors'&&!(r.method()==='GET'&&new URL(r.url()).pathname==='/api/auth/status'))api.push(r.url());});page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:undefined}));await page.goto(base+'/moment-studio/cards?occasion=condolence');await expect(page).toHaveTitle(/Moment Studio/);await expect(page.locator('#occasion')).toHaveValue('condolence');await expect(page.getByRole('radio',{name:'Quiet remembrance',exact:true})).toBeChecked();await expect(page.locator('#palette')).toHaveValue('slate');
await page.locator('#personalise').evaluate(el=>el.open=true);
for(const language of ['en','hi']){await page.locator('#language').selectOption(language);await expect(page.locator('#download')).toBeEnabled();if(language==='hi')await expect(page.locator('[name=message]')).toHaveValue(/\p{Script=Devanagari}/u);}await page.locator('#message-help summary').click();await page.locator('#copy-message').click();await expect(page.locator('#message-copy')).toHaveValue(/Sushant Synapse/);await expect(page.locator('#message-copy')).toHaveValue(/Moment Studio/);await page.locator('[name=name]').fill('आदरणीय अनन्या');
const branded=await page.evaluate(async()=>{const {render,occasions,designs,palettes}=await import('/moment-studio/card-renderer.mjs'),{brandReady}=await import('/moment-studio/branding.mjs');const result=[];for(const occasion of Object.keys(occasions))for(const design of Object.keys(designs))for(const format of ['square','story']){const c=document.createElement('canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage.bind(ctx),fill=ctx.fillText.bind(ctx),logos=[],credits=[];ctx.drawImage=(image,...args)=>{if(image.src?.endsWith('/logo-adaptive-192.png'))logos.push(args);return draw(image,...args);};ctx.fillText=(text,...args)=>{if(text.includes('Sushant Synapse'))credits.push(text);return fill(text,...args);};const d={...occasions[occasion].hi,occasion,language:'hi',design,palette:'slate',format,name:'अनन्या',from:'आपके मित्र'};const r=render(c,d);result.push({occasion,design,format,fits:r.fits,logos:logos.length,credits:credits.length});}return {brandReady,result};});expect(branded.brandReady).toBe(true);for(const row of branded.result){expect(row.fits).toBe(true);expect(row.logos).toBe(1);expect(row.credits).toBe(1);}expect(branded.result).toHaveLength(90);
for(const [format,height] of [['square',1080],['story',1920]]){await page.getByLabel('Card size').selectOption(format);const event=page.waitForEvent('download');await page.locator('#download').click();const download=await event,file='test-results/moment-condolence-'+format+'.png';await download.saveAs(file);const bytes=fs.readFileSync(file);expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(height);const match=await page.evaluate(async b64=>{const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'})),c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;c.getContext('2d').drawImage(bitmap,0,0);bitmap.close();const current=document.querySelector('#card'),y=c.height-104,a=current.getContext('2d').getImageData(60,y,960,64).data,b=c.getContext('2d').getImageData(60,y,960,64).data;return a.every((v,i)=>v===b[i]);},bytes.toString('base64'));expect(match).toBe(true);}
await page.getByLabel('Card size').selectOption('square');await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Dark mode',exact:true}).click();await page.screenshot({path:'test-results/moment-condolence-mobile.png',fullPage:true});for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.getByRole('link',{name:'Certificates & awards',exact:true}).click();await expect(page).toHaveURL(base+'/moment-studio/certificates');await expect(page.locator('[name=type] option')).toHaveCount(14);await page.getByRole('link',{name:'Condolences & remembrance',exact:true}).click();await expect(page.locator('#occasion')).toHaveValue('condolence');await page.reload();await expect(page.locator('[name=name]')).toHaveValue('');expect(errors).toEqual([]);expect(api).toEqual([]);
});
test('certificates brand every template, PDF/PNG/print and preserved organisations; missing logo blocks outputs',async({page,browser})=>{
await page.goto(base+'/moment-studio/certificates');await page.getByLabel('Recipient Name',{exact:true}).fill('Priya Sharma');await page.getByLabel('Certificate Type').selectOption('Best Friend');const brand=await page.evaluate(async()=>{const {render,templates}=await import('/moment-studio/certificate-renderer.mjs');return templates.map(template=>{const c=document.createElement('canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage.bind(ctx),fill=ctx.fillText.bind(ctx);let logos=0,credits=0;ctx.drawImage=(img,...args)=>{if(img.src?.endsWith('/logo-adaptive-192.png'))logos++;return draw(img,...args);};ctx.fillText=(t,...args)=>{if(t.includes('Sushant Synapse')&&t.includes('Moment Studio'))credits++;return fill(t,...args);};render(c,{template,recipient:'Priya',description:'being a wonderful friend'},{});return {logos,credits};});});for(const row of brand){expect(row.logos).toBe(1);expect(row.credits).toBe(1);}await page.getByRole('button',{name:'Generate certificate'}).click();await page.getByLabel('PNG quality').selectOption('300');for(const [button,format]of [['Download PNG','png'],['Download PDF','pdf']]){const event=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();const d=await event,p='test-results/moment-award.'+format;await d.saveAs(p);const b=fs.readFileSync(p);if(format==='png'){expect(b.readUInt32BE(16)).toBe(3508);expect(b.readUInt32BE(20)).toBe(2480);}else expect(b.subarray(0,8).toString()).toContain('%PDF-1.4');}await page.getByLabel('Organization Name').fill('Kindness Foundation');await page.locator('#save-organisation').click();await page.getByRole('link',{name:'Cards & greetings',exact:true}).click();await page.getByRole('link',{name:'Certificates & awards',exact:true}).click();await expect(page.getByLabel('Organization Name')).toHaveValue('Kindness Foundation');await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await expect(page.locator('#certificate')).toHaveAttribute('width','3508');
const blocked=await require('../../../tests/browser-fixture.js').acknowledgedContext(browser),bp=await blocked.newPage();await bp.route('**/logo-adaptive-192.png',r=>r.abort());await bp.goto(base+'/moment-studio/cards');await expect(bp.locator('#fit-status')).toContainText('logo could not load');await expect(bp.locator('#download')).toBeDisabled();await expect(bp.locator('#share')).toBeDisabled();await bp.goto(base+'/moment-studio/certificates');await bp.getByLabel('Recipient Name',{exact:true}).fill('Priya');await bp.getByLabel('Certificate Type').selectOption('Best Friend');await bp.getByRole('button',{name:'Generate certificate'}).click();await expect(bp.locator('#downloads')).toBeHidden();await expect(bp.locator('#status')).toContainText('logo could not load');await bp.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await expect(bp.locator('body')).toHaveClass(/\bbrand-unavailable\b/);await blocked.close();
});

test('unified catalogue shows one Moment Studio with canonical saved preferences',async({page})=>{const user={id:'owner',name:'Studio Owner',email:'owner@example.com',role:'Owner'},catalog=require('../../../packages/app-registry').apps.find(a=>a.id==='moment-studio'),old={...catalog,id:'certificates',name:'Appreciation Certificate Generator',path:'/moment-studio',accessible:true};let launch='';await page.route('**/api/auth/status',r=>r.fulfill({json:{user,setupRequired:false}}));await page.route('**/api/platform',r=>r.fulfill({json:{user,apps:[old,{...old,id:'celebration-studio',name:'Celebration Studio',path:'/moment-studio/cards'}],preferences:{favorites:['moment-studio'],recent:[{id:'moment-studio',at:'2026-10-09'}]},team:[]}}));await page.route('**/api/platform/apps/*/launch',r=>{launch=r.request().url();return r.fulfill({json:{path:'/moment-studio'}});});await page.goto(base+'/signin');const studio=page.locator('article[data-app-id=moment-studio]');await expect(studio).toHaveCount(1);await expect(studio.getByRole('heading',{name:'Moment Studio',exact:true})).toBeVisible();await expect(studio.locator('.favorite')).toHaveAttribute('aria-pressed','true');await studio.locator('a[data-action=launch]').click();await expect(page).toHaveURL(base+'/moment-studio');expect(launch).toContain('/moment-studio/launch');await expect(page.locator('#certificate')).toBeVisible();});

test('personal awards suggest a fun card and memorial gatherings keep separate export regions',async({page})=>{
 await page.goto(base+'/moment-studio/certificates');
 const options=await page.locator('[name=type] option').allTextContents();
 for(const removed of ['Blood Donation','Community Service','Event Contribution'])expect(options).not.toContain(removed);
 for(const award of ['Best Friend','Best Wife','Best Dad']){await page.locator('[name=type]').selectOption(award);await expect(page.getByRole('radio',{name:'Fun Card',exact:true})).toBeChecked();}
 await page.getByRole('radio',{name:'Laurel',exact:true}).check();await page.locator('[name=type]').selectOption('Best Mom');await expect(page.getByRole('radio',{name:'Laurel',exact:true})).toBeChecked();
 await page.goto(base+'/moment-studio/cards?occasion=condolence');
 await page.locator('#remembrance-gathering summary').click();
 await page.locator('#event-name').fill('Prayer meeting');await page.locator('#event-venue').fill('Community Hall, Pune');await page.locator('#event-date').fill('2026-10-20');
 await page.locator('[name=name]').fill('Meera Sharma');await page.locator('[name=from]').fill('Sharma family');
 await expect(page.locator('#card')).toHaveAttribute('aria-label',/Prayer meeting.*Community Hall, Pune.*Sharma family/);
 await expect(page.locator('#download')).toBeEnabled();
 await page.locator('#remembrance-gathering summary').click();await expect(page.locator('#card')).not.toHaveAttribute('aria-label',/Prayer meeting/);
 const results=await page.evaluate(async()=>{
  const {render,occasions}=await import('/moment-studio/card-renderer.mjs');
  const photo=document.createElement('canvas');photo.width=200;photo.height=300;photo.getContext('2d').fillRect(0,0,200,300);
  const results=[];
  for(const language of ['en','hi'])for(const format of ['square','story'])for(const withPhoto of [false,true]){
   const c=document.createElement('canvas'),ctx=c.getContext('2d'),draw=ctx.fillText.bind(ctx),runs=[];
   ctx.fillText=(text,x,y)=>{const m=ctx.measureText(text);runs.push({text,top:y-m.actualBoundingBoxAscent,bottom:y+m.actualBoundingBoxDescent});draw(text,x,y);};
   const data={...occasions.condolence[language],occasion:'condolence',language,format,design:'quiet',palette:'slate',name:language==='hi'?'आदरणीय मीरा शर्मा':'In loving memory of Meera Sharma',message:language==='hi'?'आपकी यादें हमेशा हमारे साथ रहेंगी।':'Your kindness and memories will stay with us always.',event:'Prayer meeting',when:'20 October 2026 · 18:00',place:'Community Hall, Pune',from:'Sharma family',details:'Family and friends are welcome.'};
   const result=render(c,data,withPhoto?photo:null);
   const ordered=['Prayer meeting','20 October 2026 · 18:00','Community Hall, Pune',language==='hi'?'प्रेषक: Sharma family':'From: Sharma family'].map(t=>runs.find(r=>r.text===t));
   results.push({fits:result.fits,ordered,watermarkTop:c.height-104,preview:language==='en'&&format==='square'&&withPhoto?c.toDataURL():''});
  }
  return results;
 });
 for(const result of results){expect(result.fits).toBe(true);for(let i=0;i<result.ordered.length;i++){expect(result.ordered[i]).toBeTruthy();expect(result.ordered[i].bottom).toBeLessThan(i===3?result.watermarkTop:result.ordered[i+1].top);}if(result.preview)fs.writeFileSync('.publish/moment-memorial-preview.png',Buffer.from(result.preview.split(',')[1],'base64'));}
});

test('retired URLs return 404 and root occasion queries keep the certificate entry',async({page,request})=>{
 for(const route of ['/certificates','/certificates/','/certificates/app.js','/certificates/renderer.js','/certificates/export.js','/certificates/style.css','/certificates/branding.mjs','/celebration-studio','/celebration-studio/','/celebration-studio/app.js','/celebration-studio/renderer.mjs','/celebration-studio/style.css','/celebration-studio/branding.mjs','/arena','/arena/'])expect((await request.get(base+route)).status()).toBe(404);
 await page.goto(base+'/moment-studio?occasion=birthday');await expect(page.locator('#certificate')).toBeVisible();await expect(page.locator('#occasion')).toHaveCount(0);
});
