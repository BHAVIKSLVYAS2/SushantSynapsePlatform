const {setTheme}=require('../../../tests/browser-theme');
const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-certificates-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('anonymous local generation, all designs, exports, privacy and responsive print',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!(r.method()==='GET'&&new URL(r.url()).pathname==='/api/auth/status'))requests.push(r.url());});
 await page.goto(base+'/moment-studio');await expect(page.locator('#certificate')).toBeVisible();
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeHidden();
 await page.getByLabel('Recipient Name',{exact:true}).fill('Aarav Sharma');await page.getByLabel('Appreciation / Contribution Description').fill('supporting education for children in our community');
 await page.getByLabel('Organization Name').fill('The Kindness Foundation');
 await page.getByText('Personalize wording & signing').click();await page.getByLabel('Signatory Name').fill('Ananya Rao');await page.getByLabel('Signatory Designation').fill('Programme Director');await page.getByLabel('Location',{exact:true}).fill('Pune, Maharashtra');
 await expect(page.getByLabel('Certificate ID',{exact:true})).toHaveValue(/^SS-\d{4}-[A-F0-9]{8}$/);
 await expect(page.locator('#templates input')).toHaveCount(5);
 for(const name of ['Laurel','Nocturne','Summit','Jubilee','Fun Card']){await page.getByRole('radio',{name,exact:true}).check();await expect(page.getByLabel('Recipient Name',{exact:true})).toHaveValue('Aarav Sharma');await page.locator('#certificate').screenshot({path:`test-results/certificate-${name}.png`});}
 await page.getByRole('radio',{name:'Laurel',exact:true}).check();
 await page.getByLabel('Certificate Type').selectOption('Volunteer Appreciation');await expect(page.locator('#preview-description')).toContainText('selfless service');
 await page.getByText('Add logo & signature').click();
 const image=await page.locator('#certificate').screenshot();await page.locator('#logo').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:image});await expect(page.locator('#status')).toHaveText('Image added locally.');
 await page.locator('[data-remove="logo"]').click();await page.locator('#signature').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('invalid')});await expect(page.locator('#status')).not.toHaveText('Image added locally.');
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();
 for(const format of ['PDF','PNG']){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download '+format,exact:true}).click();const dl=await event;const target=`test-results/certificate.${format.toLowerCase()}`;await dl.saveAs(target);const bytes=fs.readFileSync(target);if(format==='PDF'){expect(bytes.subarray(0,8).toString()).toBe('%PDF-1.4');expect(bytes.toString('latin1')).toContain('/MediaBox [0 0 841.889764 595.275591]');expect(bytes.toString('latin1')).toContain('/Width 3508 /Height 2480');const pdf=bytes.toString('latin1'),offset=Number(pdf.match(/startxref\n(\d+)/)[1]);expect(pdf.slice(offset,offset+4)).toBe('xref');}else{expect(bytes.readUInt32BE(16)).toBe(7016);expect(bytes.readUInt32BE(20)).toBe(4961);}}
 await page.getByLabel('Recipient Name',{exact:true}).fill('Changed recipient');await expect(page.locator('#downloads')).toBeHidden();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await setTheme(page,'light');await page.screenshot({path:'test-results/certificates-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await setTheme(page,'dark');await page.screenshot({path:'test-results/certificates-mobile.png',fullPage:true});
 await page.emulateMedia({media:'print'});for(const header of await page.locator('header').all())await expect(header).toBeHidden();await expect(page.locator('#certificate')).toBeVisible();await page.pdf({path:'test-results/certificate-print.pdf',preferCSSPageSize:true,printBackground:true});
 expect(requests.filter(url=>url.includes('/api/'))).toEqual([]);expect(errors).toEqual([]);await page.emulateMedia({media:'screen'});await page.reload();await expect(page.getByLabel('Recipient Name',{exact:true})).toHaveValue('');
});

test('fun awards provide wording and preserve personal edits when switching types',async({page})=>{
 await page.goto(base+'/moment-studio');
 await page.getByLabel('Recipient Name',{exact:true}).fill('Priya');
 for(const name of ['Best Friend','Best Wife','Best Husband','Best Partner','Best Mom','Best Dad','Best Sibling','Office MVP','Chai Champion','Legendary Latecomer']){
  await page.getByLabel('Certificate Type').selectOption(name);
  await expect(page.locator('#certificate')).toHaveAttribute('aria-label',new RegExp(name+' Award presented to Priya'));
  await expect(page.locator('#donation-fields')).toBeHidden();
  await page.getByRole('button',{name:'Generate certificate'}).click();
  await expect(page.locator('#downloads')).toBeVisible();
 }
 await page.getByLabel('Certificate Type').selectOption('Best Wife');
 await expect(page.locator('#preview-description')).toContainText('trophy budget improves');
 await page.getByRole('button',{name:'Generate certificate'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();expect((await download).suggestedFilename()).toBe('Priya-certificate.pdf');
 await page.getByLabel('Certificate Type').selectOption('General Appreciation');
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeHidden();
 await page.getByLabel('Appreciation / Contribution Description').fill('always cheering me on');
 await page.getByText('Personalize wording & signing').click();
 await page.getByLabel('Certificate Title').fill('My favourite human');
 await page.getByLabel('Custom Appreciation Message').fill('Thanks for every adventure.');
 await page.getByLabel('Certificate Type').selectOption('Best Friend');
 await expect(page.locator('#preview-description')).toContainText('My favourite human presented to Priya for always cheering me on. Thanks for every adventure.');
 await page.setViewportSize({width:320,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('purposeful template defaults, preserved manual choices and lossless PNG densities',async({page})=>{
 await page.goto(base+'/moment-studio');
 await expect(page.locator('[name=type] option')).toHaveCount(14);
 for(const name of ['Social Service','Sponsorship Appreciation','Outstanding Contribution','Custom'])await expect(page.locator('[name=type] option').filter({hasText:new RegExp('^'+name+'$')})).toHaveCount(0);
 await page.getByLabel('Recipient Name',{exact:true}).fill('Priya Sharma');
 for(const [type,template]of [['Donation Appreciation','Laurel'],['Teaching / Mentoring','Summit'],['General Appreciation','Laurel']]){
  await page.getByLabel('Certificate Type').selectOption(type);await expect(page.getByRole('radio',{name:template,exact:true})).toBeChecked();
  if(template==='Summit')await expect(page.getByLabel('Accent colour')).toBeVisible();else await expect(page.locator('[name=accent]')).toBeHidden();
 }
 for(const [award,template] of [['Best Friend','Fun Card'],['Best Wife','Fun Card'],['Best Dad','Fun Card']]){
  await page.getByLabel('Certificate Type').selectOption(award);await expect(page.getByRole('radio',{name:template,exact:true})).toBeChecked();
  await expect(page.locator('[name=accent]')).toBeHidden();
  await page.locator('#certificate').screenshot({path:`test-results/playful-${template}.png`});
 }
 await page.getByRole('radio',{name:'Nocturne',exact:true}).check();await page.getByLabel('Certificate Type').selectOption('Chai Champion');await expect(page.getByRole('radio',{name:'Nocturne',exact:true})).toBeChecked();await expect(page.locator('[name=accent]')).toBeHidden();
 await page.getByRole('button',{name:'Generate certificate'}).click();
 for(const [dpi,width,height] of [['600',7016,4961],['300',3508,2480]]){
  await page.getByLabel('PNG quality').selectOption(dpi);
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG',exact:true}).click();const download=await event;
  const filename=`test-results/playful-${dpi}.png`;await download.saveAs(filename);const bytes=fs.readFileSync(filename);
  expect(bytes.readUInt32BE(16)).toBe(width);expect(bytes.readUInt32BE(20)).toBe(height);
  let densities=0;
  for(let offset=8;offset<bytes.length;){const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);if(type==='pHYs'){
   densities++;expect(bytes.readUInt32BE(offset+8)).toBe(Math.round(Number(dpi)/.0254));expect(bytes.readUInt32BE(offset+12)).toBe(Math.round(Number(dpi)/.0254));expect(bytes[offset+16]).toBe(1);
   let crc=0xffffffff;for(const byte of bytes.subarray(offset+4,offset+8+length)){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}expect(bytes.readUInt32BE(offset+8+length)).toBe((crc^0xffffffff)>>>0);
  }offset+=length+12;}expect(densities).toBe(1);
  const decoded=await page.evaluate(async base64=>{const blob=new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/png'}),bitmap=await createImageBitmap(blob);const size=[bitmap.width,bitmap.height];bitmap.close();return size;},bytes.toString('base64'));expect(decoded).toEqual([width,height]);
 }
 await page.getByRole('radio',{name:'Summit',exact:true}).check();await expect(page.getByLabel('Accent colour')).toBeVisible();
 await page.setViewportSize({width:320,height:900});await page.getByRole('button',{name:'Generate certificate'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('five authored certificate designs keep achievement content and optional artwork in the print area',async({page})=>{
 await page.goto(base+'/moment-studio');
 const result=await page.evaluate(async()=>{
  const {render,templates}=await import('/moment-studio/certificate-renderer.mjs');
  const logo=document.createElement('canvas');logo.width=logo.height=40;logo.getContext('2d').fillRect(0,0,40,40);
  const signature=document.createElement('canvas');signature.width=140;signature.height=40;signature.getContext('2d').fillRect(0,0,140,40);
  return templates.map(template=>{
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),texts=[],images=[],fill=ctx.fillText.bind(ctx),draw=ctx.drawImage.bind(ctx);
   ctx.fillText=(text,x,y,...args)=>{texts.push({text,x,y,align:ctx.textAlign});fill(text,x,y,...args);};
   ctx.drawImage=(img,...args)=>{if(img===logo||img===signature)images.push({kind:img===logo?'logo':'signature',args});draw(img,...args);};
   render(canvas,{template,type:'General Appreciation',recipient:'Achievement Recipient',description:'Creating opportunities and inspiring the whole community.',organization:'Community Foundation',signatory:'Programme Director',date:'2026-10-12',reference:'SS-ACHIEVEMENT'},{logo,signature},1);
   return {template,width:canvas.width,height:canvas.height,texts,images,pixels:canvas.toDataURL()};
  });
 });
 expect(result.map(row=>row.template)).toEqual(['Laurel','Nocturne','Summit','Jubilee','Fun Card']);expect(new Set(result.map(row=>row.pixels)).size).toBe(5);
 const layouts=[];
 for(const row of result){
  expect([row.width,row.height]).toEqual([1122,793]);
  for(const text of ['Achievement Recipient','Community Foundation','Programme Director'])expect(row.texts.some(item=>item.text===text)).toBe(true);
  const recipient=row.texts.find(item=>item.text==='Achievement Recipient');layouts.push(JSON.stringify([recipient.x,recipient.y,recipient.align]));
  expect(row.images.map(item=>item.kind).sort()).toEqual(['logo','signature']);
  for(const {args}of row.images){const [x,y,w,h]=args;expect(x).toBeGreaterThanOrEqual(70);expect(y).toBeGreaterThanOrEqual(60);expect(x+w).toBeLessThanOrEqual(1052);expect(y+h).toBeLessThanOrEqual(785);}
 }
 expect(new Set(layouts).size).toBeGreaterThanOrEqual(3);
});

test('saved organisations restore branding only and can be reused and deleted',async({page})=>{
 await page.goto(base+'/moment-studio');
 await page.getByLabel('Organization Name').fill('Community Trust');
 await page.getByLabel('Recipient Name',{exact:true}).fill('Private recipient');
 await page.getByLabel('Appreciation / Contribution Description').fill('Private contribution');
 await page.getByText('Add logo & signature').click();
 const logo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=40;const ctx=c.getContext('2d');ctx.fillStyle='#00ff00';ctx.fillRect(0,0,40,40);return c.toDataURL().split(',')[1];});
 await page.locator('#logo').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:Buffer.from(logo,'base64')});
 await expect(page.locator('#status')).toHaveText('Image added locally.');
 await page.getByLabel('Logo position').selectOption('left');
 await page.getByRole('button',{name:'Save organisation',exact:true}).click();
 await expect(page.locator('#organisation-status')).toContainText('Organisation saved');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('synapse.certificates.organisations.v1')));
 expect(Object.keys(saved.entries[0]).sort()).toEqual(['id','logo','name','position']);expect(JSON.stringify(saved)).not.toContain('Private');
 await page.reload();await expect(page.getByLabel('Organization Name')).toHaveValue('Community Trust');await expect(page.getByLabel('Recipient Name',{exact:true})).toHaveValue('');await expect(page.getByLabel('Appreciation / Contribution Description')).toHaveValue('');
 await expect.poll(()=>page.evaluate(()=>{const c=document.querySelector('#certificate'),s=c.width/1122;return Array.from(c.getContext('2d').getImageData(Math.round(130*s),Math.round(100*s),1,1).data);})).toEqual([0,255,0,255]);
 await page.getByLabel('Organization Name').fill('Another Trust');await page.getByRole('button',{name:'Save organisation',exact:true}).click();
 await expect(page.locator('#saved-organisation option')).toHaveCount(3);
 await page.getByLabel('Saved organisations').selectOption({label:'Community Trust'});await expect(page.getByLabel('Organization Name')).toHaveValue('Community Trust');
 await page.getByRole('button',{name:'Delete saved organisation',exact:true}).click();await expect(page.locator('#organisation-status')).toContainText('deleted');await expect(page.locator('#saved-organisation option')).toHaveCount(2);
 await page.reload();await expect(page.getByLabel('Organization Name')).toHaveValue('');
 await expect(page.locator('#certificate-disclaimer')).toContainText('Issuer is responsible for content');
 const disclaimers=await page.evaluate(async()=>{const {render,templates,disclaimer}=await import('/moment-studio/certificate-renderer.mjs');return templates.map(template=>{const c=document.createElement('canvas'),ctx=c.getContext('2d'),texts=[];const fill=ctx.fillText.bind(ctx);ctx.fillText=(text,...args)=>{texts.push(text);fill(text,...args);};render(c,{template},{},3508/1122);return texts.includes(disclaimer);});});expect(disclaimers).toEqual(Array(5).fill(true));
});

test('invalid and unavailable browser storage do not block certificate creation',async({page})=>{
 await page.goto(base+'/moment-studio');await page.evaluate(()=>localStorage.setItem('synapse.certificates.organisations.v1','{bad JSON'));await page.reload();
 await expect(page.locator('#organisation-status')).toContainText('could not be read');
 await page.getByLabel('Organization Name').fill('Local organisation');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await page.getByRole('button',{name:'Save organisation',exact:true}).click();await expect(page.locator('#organisation-status')).toContainText('Could not save changes');
 await page.getByLabel('Recipient Name',{exact:true}).fill('Aarav');await page.getByLabel('Appreciation / Contribution Description').fill('helping the community');await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();
});

test('maximum-length and multilingual text stays within the certificate content areas',async({page})=>{
 await page.goto(base+'/moment-studio');
 const result=await page.evaluate(async()=>{
  const {render,templates}=await import('/moment-studio/certificate-renderer.mjs');const failures=[];
  for(const template of templates)for(const type of ['Donation Appreciation','General Appreciation','Best Friend'])for(const recipient of ['आदित्य शर्मा '.repeat(8).slice(0,100),'W'.repeat(100)]){const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),original=ctx.fillText.bind(ctx);ctx.fillText=(text,x,y)=>{const width=ctx.measureText(text).width,left=['left','start'].includes(ctx.textAlign)?x:['right','end'].includes(ctx.textAlign)?x-width:x-width/2;if(left<70||left+width>1052||y<60||y>785)failures.push({template,type,text,x,y,width});original(text,x,y);};
   render(canvas,{template,type,donationAmount:'999999999.99',accent:'plum',recipient,organization:'Community '.repeat(10),title:'Appreciation '.repeat(6),description:'W'.repeat(400),message:'Grateful for your thoughtful service. '.repeat(7).slice(0,250),signatory:'A'.repeat(70),designation:'Director '.repeat(8).slice(0,70),location:'Maharashtra '.repeat(7).slice(0,80),reference:'SS-2026-'+'X'.repeat(32),date:'2026-09-27'},{},1);
  }return failures;
 });expect(result).toEqual([]);
});


test('optional donation amounts use exact Indian wording and stay out of other types',async({page})=>{
 await page.goto(base+'/moment-studio');
 const amounts=await page.evaluate(async()=>{const {donationAmount}=await import('/moment-studio/certificate-renderer.mjs');return ['5000','100000','10000000','1.01','0.50','999999999.99','','0','-1','1.001','1e3','1000000000'].map(donationAmount);});
 expect(amounts.slice(0,6)).toEqual([
  {number:'₹5,000',words:'Five Thousand Rupees Only'},
  {number:'₹1,00,000',words:'One Lakh Rupees Only'},
  {number:'₹1,00,00,000',words:'One Crore Rupees Only'},
  {number:'₹1.01',words:'One Rupee and One Paisa Only'},
  {number:'₹0.50',words:'Zero Rupees and Fifty Paise Only'},
  {number:'₹99,99,99,999.99',words:'Ninety Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Rupees and Ninety Nine Paise Only'}
 ]);expect(amounts.slice(6)).toEqual(Array(6).fill(null));
 await page.getByLabel('Recipient Name',{exact:true}).fill('Aarav Sharma');await page.getByLabel('Appreciation / Contribution Description').fill('supporting our community education programme');
 const amount=page.locator('[name=donationAmount]');await amount.fill('5000');await expect(page.getByLabel('Amount in words',{exact:true})).toHaveValue('Five Thousand Rupees Only');await expect(page.locator('#certificate')).toHaveAttribute('aria-label',/Donation of ₹5,000/);
 for(const template of ['Laurel','Nocturne','Summit','Jubilee','Fun Card']){await page.getByRole('radio',{name:template,exact:true}).check();await expect(amount).toHaveValue('5000');}
 await page.getByRole('radio',{name:'Laurel',exact:true}).check();await page.locator('#certificate').screenshot({path:'test-results/certificate-donation.png'});
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();for(const format of ['PDF','PNG']){const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download '+format,exact:true}).click()]);expect(await download.failure()).toBeNull();}
 await amount.fill('-1');await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeHidden();
 await page.getByLabel('Certificate Type').selectOption('Volunteer Appreciation');await expect(amount).toBeHidden();await expect(amount).toBeDisabled();await expect(page.locator('#certificate')).not.toHaveAttribute('aria-label',/Donation of/);await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();
 await page.getByLabel('Certificate Type').selectOption('Donation Appreciation');await expect(amount).toHaveValue('');await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();await expect(page.locator('#certificate')).not.toHaveAttribute('aria-label',/Donation of/);
});

test('donation panel is exclusive and type changes discard the amount',async({page})=>{
 await page.goto(base+'/moment-studio');await page.getByLabel('Recipient Name',{exact:true}).fill('Aarav Sharma');await page.getByLabel('Organization Name').fill('The Kindness Foundation');await page.getByLabel('Appreciation / Contribution Description').fill('education and brighter futures for children in our community');
 await page.locator('[name=donationAmount]').fill('5000');await expect(page.locator('#preview-description')).not.toContainText('5,000');
 await page.locator('#certificate').screenshot({path:'test-results/donation-refined-classic.png'});
 const rendering=await page.evaluate(async()=>{
  const {render,templates}=await import('/moment-studio/certificate-renderer.mjs');const types=[...document.querySelectorAll('[name=type] option')].map(o=>o.value),results=[];
  for(const template of templates)for(const type of types){const c=document.createElement('canvas'),ctx=c.getContext('2d'),texts=[];ctx.fillText=(text)=>texts.push(text);render(c,{template,type,donationAmount:'5000'},{},1);results.push({template,type,numbers:texts.filter(t=>t.includes('₹5,000')).length,words:texts.filter(t=>t.includes('Five Thousand')).length,panel:texts.includes('DONATION · INR')});}return results;
 });
 for(const row of rendering){const present=row.type==='Donation Appreciation';expect(row.numbers).toBe(present?1:0);expect(row.words).toBe(present?1:0);expect(row.panel).toBe(present);}
 const types=await page.locator('[name=type] option').evaluateAll(options=>options.map(o=>o.value));
 for(const type of types.filter(t=>t!=='Donation Appreciation')){
  await page.getByLabel('Certificate Type').selectOption('Donation Appreciation');await page.locator('[name=donationAmount]').fill('5000');await page.getByLabel('Certificate Type').selectOption(type);
  await expect(page.locator('#donation-fields')).toBeHidden();await expect(page.locator('[name=donationAmount]')).toHaveValue('');await expect(page.locator('#donation-words')).toHaveValue('');await expect(page.locator('#certificate')).not.toHaveAttribute('aria-label',/₹|Five Thousand/);
  expect(await page.locator('#details').evaluate(form=>new FormData(form).has('donationAmount'))).toBe(false);
 }
 await page.getByLabel('Certificate Type').selectOption('Donation Appreciation');await expect(page.locator('[name=donationAmount]')).toHaveValue('');
});
