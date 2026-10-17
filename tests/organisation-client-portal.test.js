const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const {startPreview}=require('./organisation-preview-fixture.cjs');
async function fixture(t){
 const f=await startPreview({chambers:true,multi:true});let db;t.after(async()=>{db?.close();await f.stop();});
 const cookies={};for(const id of ['master','client','outsider','super','member'])cookies[id]=await f.login(id);
 const call=async(route,{actor='master',method='GET',body}={})=>{const response=await fetch(f.base+'/api/'+route,{method,headers:{Cookie:cookies[actor]||'',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};};
 const base='chambers/'+f.organisationId,admin='organisation-admin/organisations/'+f.organisationId;
 const overview=async()=>(await call(admin,{actor:'super'})).data;
 const client=(await call(base+'/clients',{method:'POST',body:{name:'Approved client',notes:'PRIVATE CLIENT NOTE',email:'private@example.com'}})).data;
 const hidden=(await call(base+'/clients',{method:'POST',body:{name:'HIDDEN CLIENT'}})).data;
 const matter=(await call(base+'/cases',{method:'POST',body:{title:'PRIVATE CASE TITLE',court:'Delhi',number:'CASE-1',cnr:'DLCT010000012026',clientId:client.id,notes:'PRIVATE CASE NOTE'}})).data;
 await call(base+'/cases',{method:'POST',body:{title:'HIDDEN CASE',court:'Mumbai',clientId:hidden.id}});
 const invite=async user=>{const v=await overview(),r=await call(admin+'/invite',{method:'POST',body:{email:user+'@example.com',role:'Client',version:v.organisation.version,reason:'Client portal fixture'}});assert.equal(r.status,201);assert.equal((await call('organisation-admin/accept',{actor:user,method:'POST',body:{primary:false,token:r.data.invitation.token}})).status,200);};
 await invite('client');
 const link=async(user='client',status='Active')=>call(base+'/client-access',{method:'POST',body:{userId:user,clientId:client.id,status,version:(await overview()).organisation.version,reason:'Explicit approved client record'}});
 assert.equal((await link()).status,200);
 const entitlement=async(user='client',status='Active',patch={})=>call(base+'/client-entitlement',{method:'POST',body:{userId:user,status,version:(await overview()).organisation.version,reason:'Explicit portal entitlement',...patch}});
 const licence=async(patch={})=>{const v=await overview(),l=v.organisation.licences[0];const body=Object.fromEntries(['appId','status','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'].map(key=>[key,l[key]]));return call(admin+'/licence',{actor:'super',method:'POST',body:{...body,...patch,version:v.organisation.version,licenceVersion:l.version,reason:'Client licence allocation'}});};
 db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));db.exec('PRAGMA foreign_keys=ON');
 const portal=(options={})=>call('client-portal/'+f.organisationId,{actor:'client',...options});
 return {...f,origin:f.base,db,call,base,admin,client,matter,hidden,invite,link,entitlement,licence,portal,overview};
}
test('portal returns only explicitly linked names and allowlisted own-case details; no staff or write access',async t=>{
 const f=await fixture(t);assert.equal((await f.portal()).status,403);
 assert.equal((await f.entitlement()).status,409); // Default licence grants zero client seats.
 assert.equal((await f.licence({clientLimit:1})).status,200);assert.equal((await f.entitlement()).status,200);
 const result=await f.portal();assert.equal(result.status,200);assert.equal(result.data.readOnly,true);
 assert.equal((await f.call('organisation-admin/account',{actor:'client'})).data.memberships[0].clientPortal,'Available');
 assert.deepEqual(result.data.clients,[{id:f.client.id,name:'Approved client'}]);
 assert.deepEqual(Object.keys(result.data.cases[0]).sort(),['id','clientId','number','cnr','court','stage','status'].sort());assert.equal(result.data.cases.length,1);assert.equal(result.data.cases[0].id,f.matter.id);
 for(const secret of ['PRIVATE','HIDDEN','private@example.com','assigneeId','password','notes','files','invoices'])assert.equal(JSON.stringify(result.data).includes(secret),false,secret);
 for(const actor of ['master','super','member'])assert.equal((await f.portal({actor})).status,403);
 assert.equal((await f.portal({actor:'anonymous'})).status,401);
 for(const method of ['POST','PATCH','DELETE'])assert.equal((await f.portal({method,body:{clientId:f.hidden.id}})).status,405);
 assert.equal((await f.call('client-portal/'+f.organisationId+'/files/guessed',{actor:'client'})).status,404);
 assert.equal((await f.call('client-portal/'+f.otherOrganisationId,{actor:'client'})).status,403);
 assert.equal((await f.call(f.base+'/state',{actor:'client'})).status,403);
 const normal=await startPreview({enabled:false});t.after(normal.stop);assert.equal((await fetch(normal.base+'/api/client-portal/'+normal.organisationId)).status,404);
});
test('client-seat reservations, revisions and independent staff capacity are enforced',async t=>{
 const f=await fixture(t);await f.licence({clientLimit:1});assert.equal((await f.entitlement('client','Active',{version:1})).status,409);
 assert.equal((await f.entitlement()).status,200);
 await f.invite('outsider');await f.link('outsider');assert.equal((await f.entitlement('outsider')).status,409);
 assert.equal((await f.licence({clientLimit:0})).status,409);
 assert.equal((await f.entitlement('client','Inactive')).status,200);assert.equal((await f.portal()).status,403);
 assert.equal((await f.entitlement('outsider')).status,200);
 const view=await f.overview();assert.equal(view.usage.apps.advocate.client,1);assert.equal(view.usage.apps.advocate.staff,2);
});
test('live links, membership, user, org and licence checks revoke existing sessions; grace remains read-only',async t=>{
 const f=await fixture(t);await f.licence({clientLimit:1});await f.entitlement();assert.equal((await f.portal()).status,200);
 await f.link('client','Revoked');assert.equal((await f.portal()).status,403);await f.link();
 for(const [sql,restore]of [
  ["UPDATE users SET active=0 WHERE id='client'","UPDATE users SET active=1 WHERE id='client'"],
  ["UPDATE platform_memberships SET status='Inactive' WHERE userId='client'","UPDATE platform_memberships SET status='Active' WHERE userId='client'"],
  ["UPDATE platform_memberships SET role='Staff' WHERE userId='client'","UPDATE platform_memberships SET role='Client' WHERE userId='client'"],
  ["UPDATE platform_organisations SET status='Suspended' WHERE id=?","UPDATE platform_organisations SET status='Active' WHERE id=?"]
 ]){sql.includes('?')?f.db.prepare(sql).run(f.organisationId):f.db.exec(sql);assert.ok([401,403].includes((await f.portal()).status));restore.includes('?')?f.db.prepare(restore).run(f.organisationId):f.db.exec(restore);}
 f.db.prepare("UPDATE records SET data=json_set(data,'$.archived',1) WHERE kind='clients' AND id=?").run(f.client.id);assert.equal((await f.portal()).status,403);
 f.db.prepare("UPDATE records SET data=json_set(data,'$.archived',0) WHERE kind='clients' AND id=?").run(f.client.id);
 await f.licence({status:'Expired',endsAt:new Date(Date.now()-86400000).toISOString(),readOnlyUntil:new Date(Date.now()+86400000).toISOString()});
 assert.equal((await f.portal()).data.licenceMode,'read-only');
 f.db.prepare("UPDATE platform_app_licences SET readOnlyUntil=? WHERE organisationId=?").run(new Date(Date.now()-1).toISOString(),f.organisationId);assert.equal((await f.portal()).status,403);
});
test('entitlement requires primary Owner, an explicit link and atomic audit',async t=>{
 const f=await fixture(t);await f.licence({clientLimit:1});
 assert.equal((await f.call(f.base+'/client-entitlement',{actor:'super',method:'POST',body:{userId:'client',status:'Active',version:(await f.overview()).organisation.version,reason:'No bypass'}})).status,403);
 await f.link('client','Revoked');assert.equal((await f.entitlement()).status,400);await f.link();
 f.db.exec("CREATE TRIGGER fail_entitlement BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='ClientEntitlementUpdated' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
 const version=(await f.overview()).organisation.version;assert.equal((await f.entitlement()).status,500);assert.equal((await f.overview()).organisation.version,version);
 assert.equal(f.db.prepare("SELECT * FROM platform_app_assignments WHERE userId='client'").get(),undefined);
});

test('full SQL recovery preserves explicit portal scope while organisation restore requires new link approval',async t=>{
 const f=await fixture(t);await f.licence({clientLimit:1});await f.entitlement();
 const cookie=await f.login('super');
 const response=await fetch(f.origin+'/api/organisation-admin/recovery-export',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({password:f.password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Verify client portal recovery'})});assert.equal(response.status,200);
 const restored=new DatabaseSync(':memory:');
 try{
  restored.exec(await response.text());const {OrganisationRepository}=await import('../packages/database/organisation-repository.mjs');
  const {clientPortalOverview}=await import('../apps/advocate/backend/client-portal.mjs');
  const result=clientPortalOverview(new OrganisationRepository(restored),{actorUserId:'client',organisationId:f.organisationId});assert.deepEqual(result.clients,[{id:f.client.id,name:'Approved client'}]);
  assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{restored.close();}
 const backup=(await f.call(f.base+'/backup')).data;assert.equal((await f.call(f.base+'/restore',{method:'POST',body:{confirm:'RESTORE',backup}})).status,200);
 assert.equal((await f.portal()).status,403);
 assert.equal((await f.entitlement('client','Inactive')).status,200);
});
