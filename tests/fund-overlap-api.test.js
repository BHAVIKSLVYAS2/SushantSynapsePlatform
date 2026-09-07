const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

test('Fund Lens authentication, app grants, ETags, allowlist and read-only routes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-lens-api-'));
 const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir,NODE_ENV:'test',SETUP_TOKEN:''},stdio:['ignore','pipe','pipe']});
 try{
  const base=await new Promise((resolve,reject)=>{let out='';const timeout=setTimeout(()=>reject(Error('Startup timeout')),10000);child.stdout.on('data',c=>{out+=c;const m=out.match(/localhost:(\d+)/);if(m){clearTimeout(timeout);resolve('http://127.0.0.1:'+m[1]);}});child.on('error',reject);child.stderr.on('data',()=>{});});
  async function req(route,{cookie='',method='GET',body,headers={}}={}){return fetch(base+route,{method,headers:{Cookie:cookie,'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});}
  const api='/api/fund-overlap/fund-index.json';
  assert.equal((await req('/fund-overlap')).status,200);assert.equal((await req(api)).status,401);
  const setup=await req('/api/auth/setup',{method:'POST',body:{name:'Test owner',email:'owner@lens.test',password:'Strong test password 2026!',firmName:'Test'}});
  assert.equal(setup.status,201);const owner=setup.headers.get('set-cookie').split(';')[0];
  const indexResponse=await req(api,{cookie:owner});assert.equal(indexResponse.status,200);assert.match(indexResponse.headers.get('cache-control'),/private.*must-revalidate/);
  const etag=indexResponse.headers.get('etag'),index=await indexResponse.json();assert.equal(index.funds.length,5);
  assert.equal((await req(api,{cookie:owner,headers:{'If-None-Match':etag}})).status,304);
  const snapshot=await req(index.funds[0].holdingsPath,{cookie:owner});assert.equal(snapshot.status,200);assert.ok((await snapshot.json()).holdings.length);
  assert.equal((await req(index.funds[0].holdingsPath,{cookie:owner,method:'HEAD'})).status,200);
  assert.equal((await req(api,{cookie:owner,method:'POST',body:{}})).status,405);
  assert.equal((await req('/api/fund-overlap/holdings/unknown/2026-07-31-1234567890123456.json',{cookie:owner})).status,404);
  assert.equal((await req('/apps/fund-overlap/data/fund-index.json',{cookie:owner})).status,404);
  assert.equal((await req('/api/fund-overlap/%2e%2e%2fdata/chambers.sqlite',{cookie:owner})).status,404);
  const member=await req('/api/users',{cookie:owner,method:'POST',body:{name:'Lens clerk',email:'clerk@lens.test',password:'Strong test password 2026!',role:'Clerk',appIds:[]}});
  assert.equal(member.status,201);const user=await member.json();
  const login=await req('/api/auth/login',{method:'POST',body:{email:'clerk@lens.test',password:'Strong test password 2026!'}});const clerk=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await req(api,{cookie:clerk})).status,403);
  assert.equal((await req('/api/platform/access/'+user.id,{cookie:owner,method:'PATCH',body:{appIds:['fund-overlap']}})).status,200);
  assert.equal((await req(api,{cookie:clerk})).status,200);
  const launch=await req('/api/platform/apps/fund-overlap/launch',{cookie:clerk,method:'POST',body:{}});assert.deepEqual(await launch.json(),{path:'/fund-overlap'});
  await req('/api/platform/access/'+user.id,{cookie:owner,method:'PATCH',body:{appIds:[]}});
  assert.equal((await req(api,{cookie:clerk,headers:{'If-None-Match':etag}})).status,403);
  assert.equal((await req(index.funds[0].holdingsPath,{cookie:clerk})).status,403);
 }finally{if(child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill();});fs.rmSync(dir,{recursive:true,force:true});}
});
