const {test,expect}=require('../../tests/browser-fixture.js');
const {startPreview}=require('../../tests/organisation-preview-fixture.cjs');
const fs=require('node:fs');
let fixture, core;
test.beforeAll(async()=>{
  fixture=await startPreview({enabled:false});
  // The upstream single-thread core expects a worker location even with supplied WASM bytes.
  global.self={location:{href:'http://localhost/'}};
  core=await require('@ffmpeg/core')({wasmBinary:fs.readFileSync(require.resolve('@ffmpeg/core/wasm'))});
});
test.afterAll(async()=>{await fixture?.stop();delete global.self;});
function sound(extension,seconds){
  const name='tone.'+extension;
  core.reset();
  expect(core.exec('-f','lavfi','-i','sine=duration='+seconds,name)).toBe(0);
  const buffer=Buffer.from(core.FS.readFile(name));core.FS.unlink(name);
  return {name,buffer,mimeType:extension==='mp3'?'audio/mpeg':'audio/wav'};
}
async function artwork(page,type,portrait){
  const data=await page.evaluate(({type,portrait})=>{
    const c=document.createElement('canvas');c.width=portrait?24:60;c.height=portrait?60:24;
    const g=c.getContext('2d');g.fillStyle='teal';g.fillRect(0,0,c.width,c.height);
    return c.toDataURL('image/'+type).split(',')[1];
  },{type,portrait});
  return {name:'cover.'+type,mimeType:'image/'+type,buffer:Buffer.from(data,'base64')};
}
async function encode(page){
  await page.locator('#generate').click();
  await expect(page.locator('#status')).toHaveText(/Completed|Failed/,{timeout:180000});
  expect(await page.locator('#status').innerText()).toBe('Completed');
  await expect.poll(()=>page.locator('video').evaluate(v=>v.readyState)).toBeGreaterThan(0);
  return page.locator('video').evaluate(v=>({w:v.videoWidth,h:v.videoHeight,time:v.duration}));
}
function audioPackets(mp4){
  core.FS.writeFile('movie.mp4',mp4);core.reset();
  expect(core.exec('-i','movie.mp4','-map','0:a:0','-c:a','copy','-f','adts','packets.aac')).toBe(0);
  const packets=Buffer.from(core.FS.readFile('packets.aac'));core.FS.unlink('packets.aac');core.FS.unlink('movie.mp4');
  return packets;
}
for(const [audio,cover,ratio,effect,w,h] of [
  ['wav','jpeg','16:9','static',854,480],['wav','png','9:16','waveform',480,854],
  ['mp3','webp','1:1','bars',480,480],['wav','png','1:1','circle',480,480]
]){
  test(audio+' + '+cover+' '+effect,async({page})=>{
    await page.goto(fixture.base+'/audio-to-video');
    await page.locator('#media').setInputFiles(sound(audio,1));
    await page.locator('#cover').setInputFiles(await artwork(page,cover,ratio==='9:16'));
    await page.locator('#resolution').selectOption('480');await page.locator('#ratio').selectOption(ratio);
    await page.locator('#effect').selectOption(effect);
    const result=await encode(page);expect([result.w,result.h]).toEqual([w,h]);expect(Math.abs(result.time-1)).toBeLessThan(.1);
    if(effect==='static'){
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
      const mp4=fs.readFileSync(await download.path());
      await page.locator('#mode').selectOption({index:1});
      await page.locator('#media').setInputFiles({name:'original.mp4',mimeType:'video/mp4',buffer:Buffer.from(mp4)});
      await page.locator('#cover').setInputFiles(await artwork(page,'png',true));
      expect((await encode(page)).w).toBe(w);
      const [replacement]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
      expect(audioPackets(fs.readFileSync(await replacement.path())).equals(audioPackets(mp4))).toBe(true);
    }
  });
}
test('long track, cancellation, invalid audio and small screen',async({page})=>{
  test.setTimeout(240000);
  await page.setViewportSize({width:320,height:800});
  await page.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{value:2}));
  await page.goto(fixture.base+'/audio-to-video');await page.locator('#cover').setInputFiles(await artwork(page,'png',false));
  await page.locator('#media').setInputFiles({name:'broken.wav',mimeType:'audio/wav',buffer:Buffer.from('invalid')});
  await expect(page.locator('#warning')).toContainText('memory');
  await page.locator('#generate').click();await expect(page.locator('#status')).toContainText('Failed');
  await page.locator('#media').setInputFiles(sound('wav',180));
  await page.locator('#resolution').selectOption('480');await page.locator('#generate').click();await page.locator('#cancel').click();
  await expect(page.locator('#status')).toContainText('Cancelled');
  expect(Math.abs((await encode(page)).time-180)).toBeLessThan(.1);
  for(const theme of ['dark','light']){
    await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});
test('optional isolated multithread export',async({page})=>{
  test.setTimeout(120000);
  const proxy=require('node:http').createServer(async(req,res)=>{
    try{
      const upstream=await fetch(fixture.base+req.url);
      res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type')||'application/octet-stream','content-security-policy':upstream.headers.get('content-security-policy')||"default-src 'self'",'cross-origin-opener-policy':'same-origin','cross-origin-embedder-policy':'require-corp'});
      res.end(Buffer.from(await upstream.arrayBuffer()));
    }catch{res.writeHead(502).end();}
  });
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  try{
  await page.goto('http://127.0.0.1:'+proxy.address().port+'/audio-to-video');
  await page.locator('#parallel').check();await page.locator('#resolution').selectOption('480');
  await page.locator('#media').setInputFiles(sound('wav',1));
  await page.locator('#cover').setInputFiles(await artwork(page,'png',false));
  expect((await encode(page)).h).toBe(480);
  }finally{proxy.closeAllConnections();proxy.close();}
});
