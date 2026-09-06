const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
function fetch(url,options={}){return new Promise((resolve,reject)=>{const req=http.request(url,options,res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,json:async()=>JSON.parse(body),headers:{get:name=>[].concat(res.headers[name]||[]).join('; ')}}));});req.on('error',reject);req.end(options.body);});}

test('production origin enforcement, protected setup and secure session cookies',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-production-'));
 const token='Isolated-test-setup-token-2026';
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,NODE_ENV:'production',PUBLIC_ORIGIN:'https://apps.sushantsynapse.com',SETUP_TOKEN:token},stdio:['ignore','pipe','pipe']});
 try {
  const base=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);child.stdout.on('data',c=>{const m=String(c).match(/localhost:(\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code));});});
  const headers={Host:'apps.sushantsynapse.com',Origin:'https://apps.sushantsynapse.com','Content-Type':'application/json'};
  const status=await fetch(base+'/api/auth/status',{headers});assert.equal(status.status,200);assert.equal((await status.json()).setupProtected,true);
  const input={name:'Production Owner',email:'owner@example.com',password:'Production test password!',firmName:'Test'};
  const setup=body=>fetch(base+'/api/auth/setup',{method:'POST',headers,body:JSON.stringify(body)});
  assert.equal((await setup(input)).status,403);
  assert.equal((await fetch(base+'/api/auth/status',{headers:{...headers,Origin:'https://untrusted.example'}})).status,403);
  const created=await setup({...input,setupToken:token});assert.equal(created.status,201);assert.match(created.headers.get('set-cookie'),/; Secure/);
  assert.equal((await setup({...input,setupToken:token})).status,409);
 } finally {if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});fs.rmSync(dir,{recursive:true,force:true});}
});
