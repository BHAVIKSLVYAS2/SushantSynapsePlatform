const {test,expect}=require('../../../tests/browser-fixture.js');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
let child,base,dir;
test.beforeAll(async()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-android-export-'));
 child=spawn(process.execPath,['server/index.js'],{env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test',PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout')),20000);child.stdout.on('data',data=>{output+=data;const match=output.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}});child.once('error',reject);});
});
test.afterAll(async()=>{if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});if(dir)fs.rmSync(dir,{recursive:true,force:true});});
test('Android bridge exports real donation certificates with uploaded logo/signature under production CSP',async({page,context})=>{
 test.setTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // All website traffic goes to a disposable local workspace, never production.
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='https://apps.sushantsynapse.com')return route.abort();
  const response=await route.fetch({url:base+url.pathname+url.search});
  await route.fulfill({response});
 });
 const response=await page.goto('https://apps.sushantsynapse.com/moment-studio');
 expect(response.headers()['content-security-policy']).toContain("connect-src 'self'");
 await expect(page.locator('#certificate')).toBeVisible();
 await page.evaluate(fs.readFileSync(path.join(__dirname,'../app/src/main/assets/wrapper.js'),'utf8'));
 await page.evaluate(()=>{const channel=new MessageChannel();window.nativeMessages=[];channel.port1.onmessage=e=>nativeMessages.push(JSON.parse(e.data));window.postMessage('synapse-native-ready',location.origin,[channel.port2]);});
 await page.waitForFunction(()=>window.__synapseWrapper.port);
 const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=32;c.height=32;const ctx=c.getContext('2d');ctx.fillStyle='#135';ctx.fillRect(0,0,32,32);return c.toDataURL('image/png').split(',')[1];});
 for(const id of ['logo','signature']){
  await page.locator('#'+id).setInputFiles({name:id+'.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await expect(page.locator('#status')).toHaveText('Image added locally.');
 }
 await page.getByLabel('Recipient Name',{exact:true}).fill('Android Donation Check');
 await page.getByLabel('Certificate Type').selectOption('Donation Appreciation');
 await page.getByLabel('Appreciation / Contribution Description').fill('supporting education');
 await page.locator('[name=donationAmount]').fill('5000');
 await page.getByRole('button',{name:'Generate certificate'}).click();
 await expect(page.locator('#downloads')).toBeVisible();
 for(const [format,quality] of [['pdf','300'],['png','300'],['png','600']]){
  await page.getByLabel('PNG quality').selectOption(quality);
  await page.evaluate(()=>nativeMessages.length=0);
  await page.getByRole('button',{name:format==='pdf'?'Download PDF':'Download PNG',exact:true}).click();
  await page.waitForFunction(()=>nativeMessages.some(m=>m.type==='end'),null,{timeout:60000});
  const messages=await page.evaluate(()=>nativeMessages);
  expect(messages.some(m=>m.type==='error')).toBe(false);
  expect(messages[0].name).toBe('Android Donation Check-certificate.'+format);
  const bytes=Buffer.concat(messages.filter(m=>m.type==='chunk').map(m=>Buffer.from(m.data,'base64')));
  expect(bytes.length).toBe(messages[0].size);
  if(format==='pdf')expect(bytes.subarray(0,8).toString()).toContain('%PDF-1.4');
  else{expect(bytes.readUInt32BE(16)).toBe(quality==='600'?7016:3508);expect(bytes.readUInt32BE(20)).toBe(quality==='600'?4961:2480);}
 }
 await page.locator('#logo').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
 await expect(page.locator('#status')).toContainText('Choose a PNG');
 expect(errors).toEqual([]);
});
