const {test}=require('node:test');
const assert=require('node:assert/strict');
const {startPreview}=require('./organisation-preview-fixture.cjs');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
test('admin pages/API stay unavailable by default and never enter the cloud allowlist',async t=>{
 const f=await startPreview({enabled:false});t.after(f.stop);
 for(const route of ['/platform-audit','/api/organisation-admin/platform-audit','/organisation-audit','/admin/audit.mjs','/client-portal','/advocate/client-portal.mjs','/client-access','/advocate/client-access.mjs','/account','/admin','/super-admin','/admin/app.mjs','/api/organisation-admin','/api/organisation-admin/account'])assert.equal((await fetch(f.base+route)).status,404,route);
 const {staticAssets}=require('../server/static-assets');assert.equal(staticAssets['/admin'],undefined);assert.equal(staticAssets['/super-admin'],undefined);
 const result=spawnSync(process.execPath,['server/index.js'],{env:{...process.env,ORG_ADMIN_PREVIEW:'1',NODE_ENV:'test',DATA_DIR:process.cwd(),DATABASE_PROVIDER:'sqlite'},encoding:'utf8',windowsHide:true});
 assert.notEqual(result.status,0);assert.match(result.stderr,/disposable DATA_DIR/);
});
test('session identity and organisation boundaries protect administration endpoints',async t=>{
 const f=await startPreview();t.after(f.stop);
 const master=await f.login('master'),superCookie=await f.login('super'),member=await f.login('member');
 const call=(path='',{cookie=master,body,headers={}}={})=>fetch(f.base+'/api/organisation-admin'+path,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
 assert.equal((await call('',{cookie:''})).status,401);
 const own=await (await call()).json();assert.equal(own.superAdmin,false);assert.equal(own.organisations.length,1);
 assert.equal((await (await call('',{cookie:superCookie})).json()).organisations.length,2);
 assert.equal((await (await call('',{cookie:member})).json()).organisations.length,0);
 const path='/organisations/'+f.organisationId;
 const view=await (await call(path)).json(),version=view.organisation.version;
 const encoded=JSON.stringify(view);for(const secret of ['tokenHash','password','preserved-password'])assert.equal(encoded.includes(secret),false);
 assert.equal((await call('/organisations/'+f.otherOrganisationId)).status,403);
 assert.equal((await call(path+'/invite',{body:{actorUserId:'super',email:'client@example.com',role:'Client',version,reason:'test'}})).status,400);
 assert.equal((await call(path+'/limits',{body:{staffLimit:10,clientLimit:10,version,reason:'test'}})).status,403);
 assert.equal((await call(path+'/member',{body:{userId:'member',role:'Staff',status:'Inactive',version,reason:'test'},headers:{Origin:'https://other.invalid'}})).status,403);
 assert.equal((await call(path+'/invite',{body:{email:'client@example.com',role:'Client',version,reason:'Invite client'}})).status,201);
 assert.equal((await call(path+'/invite',{body:{email:'outsider@example.com',role:'Staff',version,reason:'stale'}})).status,409);
 assert.equal((await call(path+'/member',{cookie:member,body:{userId:'master',role:'Staff',status:'Inactive',version,reason:'spoof'}})).status,403);
 assert.equal((await call(path+'/member',{body:{},headers:{'Content-Type':'text/plain'}})).status,415);
});
test('HTTP licence and transfer mutations reach audited services using the signed-in actor',async t=>{
 const f=await startPreview();t.after(f.stop);const cookie=await f.login('super');
 const path='/api/organisation-admin/organisations/'+f.organisationId;
 const get=async()=>await (await fetch(f.base+path,{headers:{Cookie:cookie}})).json();
 const post=(command,body)=>fetch(f.base+path+'/'+command,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
 let v=await get(),licence=v.organisation.licences[0];
 assert.equal((await post('licence',{...Object.fromEntries(['appId','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'].map(k=>[k,licence[k]])),status:'Suspended',licenceVersion:licence.version,version:v.organisation.version,reason:'Temporary suspension'})).status,200);
 v=await get();assert.equal(v.organisation.licences[0].status,'Suspended');
 assert.equal((await post('transfer',{userId:'member',previousMasterRole:'Staff',version:v.organisation.version,reason:'New primary'})).status,200);
 const old=await f.login('master');assert.equal((await fetch(f.base+path,{headers:{Cookie:old}})).status,403);
 const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(require('node:path').join(f.dir,'chambers.sqlite'));
 try{const event=db.prepare("SELECT actorUserId FROM platform_organisation_audit WHERE action='MasterAdminTransferred'").get();assert.equal(event.actorUserId,'super');}finally{db.close();}
});
