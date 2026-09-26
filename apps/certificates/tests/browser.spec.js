const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-certificates-'));child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Startup timed out')),15000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('anonymous local generation, all designs, exports, privacy and responsive print',async({page})=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(base+'/certificates');await expect(page.locator('#certificate')).toBeVisible();
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeHidden();
 await page.getByLabel('Recipient Name',{exact:true}).fill('Aarav Sharma');await page.getByLabel('Appreciation / Contribution Description').fill('supporting education for children in our community');
 await page.getByLabel('Organization Name').fill('The Kindness Foundation');
 await page.getByText('Personalize wording & signing').click();await page.getByLabel('Signatory Name').fill('Ananya Rao');await page.getByLabel('Signatory Designation').fill('Programme Director');await page.getByLabel('Location',{exact:true}).fill('Pune, Maharashtra');
 await expect(page.getByLabel('Certificate ID',{exact:true})).toHaveValue(/^SS-\d{4}-[A-F0-9]{8}$/);
 for(const name of ['Classic','Modern','Minimal','Elegant','Community','Corporate']){await page.getByRole('radio',{name,exact:true}).check();await expect(page.getByLabel('Recipient Name',{exact:true})).toHaveValue('Aarav Sharma');await page.locator('#certificate').screenshot({path:`test-results/certificate-${name}.png`});}
 await page.getByRole('radio',{name:'Classic',exact:true}).check();
 await page.getByLabel('Certificate Type').selectOption('Blood Donation');await expect(page.locator('#preview-description')).toContainText('life-saving gift');
 await page.getByText('Add logo & signature').click();
 const image=await page.locator('#certificate').screenshot();await page.locator('#logo').setInputFiles({name:'logo.png',mimeType:'image/png',buffer:image});await expect(page.locator('#status')).toHaveText('Image added locally.');
 await page.locator('[data-remove="logo"]').click();await page.locator('#signature').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('invalid')});await expect(page.locator('#status')).not.toHaveText('Image added locally.');
 await page.getByRole('button',{name:'Generate certificate'}).click();await expect(page.locator('#downloads')).toBeVisible();
 for(const format of ['PDF','PNG']){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download '+format,exact:true}).click();const dl=await event;const target=`test-results/certificate.${format.toLowerCase()}`;await dl.saveAs(target);const bytes=fs.readFileSync(target);if(format==='PDF'){expect(bytes.subarray(0,8).toString()).toBe('%PDF-1.4');expect(bytes.toString('latin1')).toContain('/MediaBox [0 0 841.889764 595.275591]');expect(bytes.toString('latin1')).toContain('/Width 3508 /Height 2480');const pdf=bytes.toString('latin1'),offset=Number(pdf.match(/startxref\n(\d+)/)[1]);expect(pdf.slice(offset,offset+4)).toBe('xref');}else{expect(bytes.readUInt32BE(16)).toBe(3508);expect(bytes.readUInt32BE(20)).toBe(2480);}}
 await page.getByLabel('Recipient Name',{exact:true}).fill('Changed recipient');await expect(page.locator('#downloads')).toBeHidden();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByLabel('Colour theme').selectOption('light');await page.screenshot({path:'test-results/certificates-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.getByLabel('Colour theme').selectOption('dark');await page.screenshot({path:'test-results/certificates-mobile.png',fullPage:true});
 await page.emulateMedia({media:'print'});await expect(page.locator('header')).toBeHidden();await expect(page.locator('#certificate')).toBeVisible();await page.pdf({path:'test-results/certificate-print.pdf',preferCSSPageSize:true,printBackground:true});
 expect(requests.filter(url=>url.includes('/api/'))).toEqual([]);expect(errors).toEqual([]);await page.emulateMedia({media:'screen'});await page.reload();await expect(page.getByLabel('Recipient Name',{exact:true})).toHaveValue('');
});

test('maximum-length and multilingual text stays within the certificate content areas',async({page})=>{
 await page.goto(base+'/certificates');
 const result=await page.evaluate(async()=>{
  const {render,templates}=await import('/certificates/renderer.js');const failures=[];
  for(const template of templates){const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),original=ctx.fillText.bind(ctx);ctx.fillText=(text,x,y)=>{const width=ctx.measureText(text).width;if(x-width/2<70||x+width/2>1052||y<60||y>785)failures.push({template,text,x,y,width});original(text,x,y);};
   render(canvas,{template,accent:'plum',recipient:'आदित्य शर्मा '.repeat(8).slice(0,100),organization:'Community '.repeat(10),title:'Appreciation '.repeat(6),description:'W'.repeat(400),message:'Grateful for your thoughtful service. '.repeat(7).slice(0,250),signatory:'A'.repeat(70),designation:'Director '.repeat(8).slice(0,70),location:'Maharashtra '.repeat(7).slice(0,80),reference:'SS-2026-'+'X'.repeat(32),date:'2026-09-27'},{},1);
  }return failures;
 });expect(result).toEqual([]);
});
