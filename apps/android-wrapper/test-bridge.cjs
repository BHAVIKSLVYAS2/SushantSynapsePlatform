const {chromium}=require('@playwright/test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const context=await browser.newContext();
  await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Disposable wrapper fixture</title><body></body>'}));
  const page=await context.newPage(),script=fs.readFileSync(path.join(__dirname,'app/src/main/assets/wrapper.js'),'utf8');
  await page.goto('https://apps.sushantsynapse.com/');await page.evaluate(script);await page.evaluate(script);
  await page.evaluate(()=>{const channel=new MessageChannel();window.nativeMessages=[];channel.port1.onmessage=e=>window.nativeMessages.push(JSON.parse(e.data));window.postMessage('synapse-native-ready',location.origin,[channel.port2]);});
  await page.waitForFunction(()=>window.__synapseWrapper.port);
  await page.evaluate(()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([new Uint8Array([0,255,10,42])],{type:'application/zip'}));a.download='fixture.zip';a.click();});
  await page.waitForFunction(()=>nativeMessages.some(m=>m.type==='end'));
  let messages=await page.evaluate(()=>nativeMessages);assert.deepEqual(messages.map(m=>m.type),['start','chunk','end']);assert.equal(messages[0].name,'fixture.zip');assert.equal(messages[0].mime,'application/zip');assert.deepEqual([...Buffer.from(messages[1].data,'base64')],[0,255,10,42]);
  await page.evaluate(()=>{nativeMessages.length=0;const a=document.createElement('a');a.href='data:text/plain;base64,aGVsbG8=';a.download='hello.txt';a.textContent='Save fixture';document.body.append(a);});
  await page.getByText('Save fixture').click();await page.waitForFunction(()=>nativeMessages.some(m=>m.type==='end'));messages=await page.evaluate(()=>nativeMessages);assert.equal(messages.filter(m=>m.type==='start').length,1);assert.equal(Buffer.from(messages.find(m=>m.type==='chunk').data,'base64').toString(),'hello');
  await page.evaluate(()=>{nativeMessages.length=0;window.print();});await page.waitForFunction(()=>nativeMessages.length===1);assert.equal((await page.evaluate(()=>nativeMessages))[0].type,'print');
  await page.evaluate(()=>{nativeMessages.length=0;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([new Uint8Array(100000)]));a.download='chunked.bin';a.click();});await page.waitForFunction(()=>nativeMessages.some(m=>m.type==='end'));messages=await page.evaluate(()=>nativeMessages);assert.equal(messages.filter(m=>m.type==='chunk').reduce((n,m)=>n+Buffer.from(m.data,'base64').length,0),100000);assert.ok(messages.filter(m=>m.type==='chunk').every(m=>m.data.length<=65536));
  await page.goto('https://untrusted.example/');await page.evaluate(script);assert.equal(await page.evaluate(()=>typeof window.__synapseWrapper),'undefined');
  console.log('Wrapper bridge passed: detached/connected downloads, exact bytes, chunk bounds, print, repeat injection and origin restriction.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
