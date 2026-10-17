const {test}=require('node:test');
const assert=require('node:assert/strict');
const {startPreview}=require('./organisation-preview-fixture.cjs');

test('offline recovery starts a fresh guarded app with records, licence restrictions and revoked memberships intact',async t=>{
 const source=await startPreview({chambers:true});t.after(source.stop);
 const cookies={};for(const id of ['super','master','member','outsider'])cookies[id]=await source.login(id);
 const call=(base,route,cookie,body)=>fetch(base+route,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const create=async(org,actor,kind,body)=>{
  const response=await call(source.base,`/api/chambers/${org}/${kind}`,cookies[actor],body);
  assert.equal(response.status,201);return response.json();
 };
 const first=source.organisationId,second=source.otherOrganisationId;
 const client=await create(first,'master','clients',{name:'Recovery drill private client'});
 const matter=await create(first,'master','cases',{title:'Recovery drill matter',clientId:client.id,court:'Delhi',cnr:'DLCT010000012026'});
 const bytes=Buffer.from([0,13,127,255,42]);
 const document=await create(first,'master','documents',{name:'Recovery drill order',caseId:matter.id,originalName:'order.bin',content:bytes.toString('base64')});
 const otherClient=await create(second,'outsider','clients',{name:'Other recovery workspace'});
 const adminPath=org=>'/api/organisation-admin/organisations/'+org;
 const overview=async org=>(await call(source.base,adminPath(org),cookies.super)).json();
 let view=await overview(first);
 assert.equal((await call(source.base,adminPath(first)+'/member',cookies.super,{userId:'member',role:'Staff',status:'Inactive',version:view.organisation.version,reason:'Recovery drill revocation'})).status,200);
 view=await overview(second);const licence=view.organisation.licences[0];
 assert.equal((await call(source.base,adminPath(second)+'/licence',cookies.super,{...Object.fromEntries(['appId','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'].map(key=>[key,licence[key]])),status:'Suspended',licenceVersion:licence.version,version:view.organisation.version,reason:'Recovery drill licence restriction'})).status,200);
 const exported=await call(source.base,'/api/organisation-admin/recovery-export',cookies.super,{password:source.password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Restart recovery drill'});
 assert.equal(exported.status,200);const sql=await exported.text();
 const restored=await startPreview({recoverySql:sql});t.after(restored.stop);
 assert.notEqual(restored.dir,source.dir);
 // Exported session cookies must not become authenticated on the restored app.
 for(const cookie of Object.values(cookies))assert.equal((await call(restored.base,'/api/organisation-admin/account',cookie)).status,401);
 const fresh={};for(const id of Object.keys(cookies))fresh[id]=await restored.login(id);
 const state=await call(restored.base,`/api/chambers/${first}/state`,fresh.master);assert.equal(state.status,200);
 const data=await state.json();assert.ok(data.clients.some(row=>row.id===client.id));assert.ok(data.cases.some(row=>row.id===matter.id));assert.equal(data.clients.some(row=>row.id===otherClient.id),false);
 const downloaded=await call(restored.base,`/api/chambers/${first}/documents/${document.id}/download`,fresh.master);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);
 for(const [org,actor]of [[first,'member'],[first,'outsider'],[first,'super'],[second,'outsider'],[second,'master']])assert.equal((await call(restored.base,`/api/chambers/${org}/state`,fresh[actor])).status,403,org+' '+actor);
 const recovered=await(await call(restored.base,adminPath(second),fresh.super)).json();assert.equal(recovered.organisation.licences[0].status,'Suspended');
 const history=await(await call(restored.base,'/api/organisation-admin/platform-audit?action=PlatformRecoveryExportCreated',fresh.super)).json();assert.equal(history.events[0].details.reason,'Restart recovery drill');
 assert.equal((await call(restored.base,'/api/state',fresh.super)).status,409);
 // Verification did not overwrite the original fixture or revive its revoked access.
 assert.equal((await call(source.base,`/api/chambers/${first}/state`,cookies.master)).status,200);
 assert.equal((await call(source.base,`/api/chambers/${first}/state`,cookies.member)).status,403);
});
