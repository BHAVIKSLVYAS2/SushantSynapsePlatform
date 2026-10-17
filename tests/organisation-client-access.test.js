const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {startPreview}=require('./organisation-preview-fixture.cjs');
async function fixture(t){
 const f=await startPreview({chambers:true,multi:true});let db;
 t.after(async()=>{db?.close();await f.stop();});
 const cookies={};for(const id of ['master','member','super','outsider','client'])cookies[id]=await f.login(id);
 const call=async(route,{actor='master',method='GET',body}={})=>{
  const response=await fetch(f.base+'/api/'+route,{method,headers:{Cookie:cookies[actor],...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text()};
 };
 const base='chambers/'+f.organisationId,admin='organisation-admin/organisations/'+f.organisationId;
 const client=(await call(base+'/clients',{method:'POST',body:{name:'Private client',email:'client@example.com',notes:'Never released to portal'}})).data;
 const other=(await call('chambers/'+f.otherOrganisationId+'/clients',{actor:'outsider',method:'POST',body:{name:'Other private client'}})).data;
 const overview=async()=>await call(admin);
 const v=(await overview()).data.organisation.version;
 const invitation=(await call(admin+'/invite',{method:'POST',body:{email:'client@example.com',role:'Client',version:v,reason:'Client link fixture'}})).data;
 assert.equal((await call('organisation-admin/accept',{actor:'client',method:'POST',body:{token:invitation.invitation.token,primary:false}})).status,200);
 db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));db.exec('PRAGMA foreign_keys=ON');
 const link=async(patch={},actor='master')=>call(base+'/client-access',{actor,method:'POST',body:{userId:'client',clientId:client.id,status:'Active',version:(await overview()).data.organisation.version,reason:'Explicit client access link',...patch}});
 return {...f,call,db,base,admin,client,other,link};
}
test('explicit links are audited and revocable without opening any client-facing staff APIs',async t=>{
 const f=await fixture(t);
 assert.deepEqual((await f.call(f.base+'/client-access')).data.links,[]);
 const choices=(await f.call(f.base+'/client-access')).data;
 assert.deepEqual(choices.records,[{id:f.client.id,name:'Private client'}]);
 assert.equal(choices.members.length,1);assert.equal(choices.members[0].userId,'client');assert.equal(choices.readOnly,false);
 assert.equal(JSON.stringify(choices).includes('Never released'),false);assert.equal(JSON.stringify(choices).includes('Other private'),false);
 assert.equal((await f.call('organisation-admin/account')).data.memberships.find(m=>m.id===f.organisationId).clientAccessManagement,true);
 assert.equal((await f.link()).status,200);
 const links=(await f.call(f.base+'/client-access')).data.links;assert.equal(links.length,1);assert.equal(links[0].clientId,f.client.id);
 assert.equal(JSON.stringify(links).includes('Never released'),false);
 for(const route of ['state','clients','client-access','backup','files/guessed'])assert.equal((await f.call(f.base+'/'+route,{actor:'client'})).status,403);
 const account=(await f.call('organisation-admin/account',{actor:'client'})).data;assert.equal(account.memberships[0].clientPortal,'Unavailable');
 assert.equal((await f.link({status:'Revoked'})).status,200);
 assert.equal((await f.call(f.base+'/client-access')).data.links[0].status,'Revoked');
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM platform_organisation_audit WHERE action='ClientAccessUpdated'").get().n,2);
});
test('client links enforce primary plus Owner authority, own records, active Client membership and revisions',async t=>{
 const f=await fixture(t);
 for(const actor of ['super','member','outsider','client'])assert.equal((await f.link({},actor)).status,403,actor);
 assert.equal((await f.call('chambers/'+f.otherOrganisationId+'/client-access')).status,403);
 assert.equal((await f.link({clientId:f.other.id})).status,400);
 assert.equal((await f.link({userId:'member'})).status,400);
 assert.equal((await f.link({version:1})).status,409);
 assert.equal((await f.link({reason:''})).status,400);
 assert.equal((await f.link({actorUserId:'super'})).status,400);
 f.db.prepare("UPDATE users SET active=0 WHERE id='client'").run();assert.equal((await f.link()).status,400);
 f.db.prepare("UPDATE users SET active=1 WHERE id='client'").run();
 f.db.prepare("UPDATE records SET data=json_set(data,'$.archived',1) WHERE kind='clients' AND id=?").run(f.client.id);assert.equal((await f.link()).status,400);
 f.db.prepare("UPDATE records SET data=json_set(data,'$.archived',0) WHERE kind='clients' AND id=?").run(f.client.id);
 f.db.prepare("UPDATE platform_app_licences SET status='Suspended' WHERE organisationId=?").run(f.organisationId);assert.equal((await f.link()).status,403);
});
test('failed audit rolls back client links and foreign keys forbid cross-org ownership',async t=>{
 const f=await fixture(t);
 const before=f.db.prepare('SELECT version FROM platform_organisations WHERE id=?').get(f.organisationId).version;
 f.db.exec("CREATE TRIGGER fail_link BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='ClientAccessUpdated' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
 assert.equal((await f.link()).status,500);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM chambers_client_access').get().n,0);
 assert.equal(f.db.prepare('SELECT version FROM platform_organisations WHERE id=?').get(f.organisationId).version,before);
 assert.throws(()=>f.db.prepare('INSERT INTO chambers_client_access(organisationId,userId,clientId,status,createdAt,updatedAt) VALUES(?,?,?,?,0,0)').run(f.organisationId,'client',f.other.id,'Active'),/FOREIGN KEY/);
});
test('full SQL recovery retains links; scoped JSON restore discards them to prevent silent access rebinding',async t=>{
 const f=await fixture(t);assert.equal((await f.link()).status,200);
 const dump=await f.call('organisation-admin/recovery-export',{actor:'super',method:'POST',body:{password:f.password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Verify client link recovery'}});assert.equal(dump.status,200);
 const restored=new DatabaseSync(':memory:');
 try{restored.exec(dump.data);assert.equal(restored.prepare('SELECT COUNT(*) n FROM chambers_client_access').get().n,1);assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);}finally{restored.close();}
 const backup=(await f.call(f.base+'/backup')).data;
 assert.equal('chambers_client_access' in backup,false);
 assert.equal((await f.call(f.base+'/restore',{method:'POST',body:{confirm:'RESTORE',backup}})).status,200);
 assert.deepEqual((await f.call(f.base+'/client-access')).data.links,[]);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM platform_organisation_audit WHERE action='ClientAccessClearedForRestore'").get().n,1);
 assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('migration five upgrades version four without rewriting records and retains old recovery support',async()=>{
 const {organisationMigrations,migrateOrganisationSchema}=await import('../packages/database/organisation-repository.mjs');
 const {organisationRecovery}=require('../packages/database/organisation-recovery.cjs');
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(readFileSync('packages/database/schema.sql','utf8'));db.exec(readFileSync('apps/advocate/database/schema.sql','utf8'));db.exec('CREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL)');
  for(const m of organisationMigrations.slice(0,4)){db.exec(m.source);db.prepare('INSERT INTO platform_organisation_migrations VALUES(?,?)').run(m.id,m.checksum);}
  db.prepare('INSERT INTO records VALUES(?,?,?)').run('clients','kept','{"name":"Preserved"}');
  assert.equal(organisationRecovery(db,String).schema.includes('CREATE TABLE chambers_client_access'),false);
  assert.deepEqual(migrateOrganisationSchema(db).ids,['platform-organisations-005']);
  assert.equal(db.prepare("SELECT data FROM records WHERE id='kept'").get().data,'{"name":"Preserved"}');
 }finally{db.close();}
});
