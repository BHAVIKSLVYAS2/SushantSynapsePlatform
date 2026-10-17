const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const {startPreview}=require('./organisation-preview-fixture.cjs');
async function fixture(t){
 const f=await startPreview();let db;t.after(async()=>{db?.close();await f.stop();});
 const cookies={};for(const id of ['super','master','member','outsider'])cookies[id]=await f.login(id);
 db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));
 const get=(query='',actor='master',org=f.organisationId)=>fetch(f.base+'/api/organisation-admin/organisations/'+org+'/audit'+query,{headers:{Cookie:cookies[actor]||''}});
 const add=(action,details={},org=f.organisationId)=>db.prepare('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)').run(org,'super',action,Date.now(),JSON.stringify(details));
 const platform=(query='',actor='super')=>fetch(f.base+'/api/organisation-admin/platform-audit'+query,{headers:{Cookie:cookies[actor]||''}});
 return {...f,db,get,add,platform};
}
test('audit rechecks authority and scopes before pagination; unknown and excessive queries fail',async t=>{
 const f=await fixture(t);
 assert.equal((await f.get('', 'anonymous')).status,401);assert.equal((await f.get('', 'member')).status,403);assert.equal((await f.get('', 'outsider')).status,403);
 assert.equal((await f.get('', 'master',f.otherOrganisationId)).status,403);assert.equal((await f.get('', 'super',f.otherOrganisationId)).status,200);
 for(const query of ['?limit=51','?limit=0','?limit=-1','?before=0','?before=1.5','?before=99999999999999999999','?action=NotKnown','?limit=1&limit=2','?actorUserId=super'])assert.equal((await f.get(query)).status,400,query);
 f.db.prepare("UPDATE platform_organisations SET status='Suspended' WHERE id=?").run(f.organisationId);assert.equal((await f.get()).status,403);assert.equal((await f.get('','super')).status,200);
 f.db.prepare("UPDATE platform_super_admins SET active=0 WHERE userId='super'").run();assert.equal((await f.get('','super')).status,403);
});

test('platform audit permits only active Super Admin and projects only null-org metadata',async t=>{
 const f=await fixture(t);
 for(const actor of ['master','member','outsider'])assert.equal((await f.platform('?limit=0',actor)).status,403);
 assert.equal((await f.platform('','anonymous')).status,401);
 f.add('PlatformRecoveryExportCreated',{reason:'Review password=HiddenValue',scope:'AllOrganisations',includesAccountHashes:true,includesDocuments:true,excludesSessions:true,records:'PRIVATE'},null);
 f.add('FutureGlobalEvent',{reason:'PRIVATE'},null);
 const count=f.db.prepare('SELECT COUNT(*) AS n FROM platform_organisation_audit').get().n;
 const response=await f.platform();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const data=await response.json();assert.equal(data.scope,'platform');assert.equal(data.organisation,undefined);
 assert.deepEqual(data.events[0].details,{});assert.equal(data.events[0].action,'Other governance event');
 assert.deepEqual(data.events[1].details,{reason:'Review password=[redacted]',scope:'AllOrganisations',includesAccountHashes:true,includesDocuments:true,excludesSessions:true});
 assert.equal(JSON.stringify(data).includes('PRIVATE'),false);assert.equal(data.events.some(e=>e.action==='OrganisationProvisioned'),false);
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM platform_organisation_audit').get().n,count);
 assert.equal((await(await f.get('','super')).json()).events.some(e=>e.action==='PlatformRecoveryExportCreated'),false);
 for(const query of ['?organisationId=x','?limit=51','?before=0','?action=MemberUpdated','?limit=1&limit=2'])assert.equal((await f.platform(query)).status,400);
 f.db.prepare("UPDATE platform_super_admins SET active=0 WHERE userId='super'").run();assert.equal((await f.platform()).status,403);
});

test('platform audit keyset pagination and action filters remain isolated',async t=>{
 const f=await fixture(t);for(let i=0;i<25;i++)f.add('PlatformRecoveryExportCreated',{reason:'Export '+i},null);
 const first=await(await f.platform('?limit=10&action=PlatformRecoveryExportCreated')).json();assert.equal(first.events.length,10);
 f.add('PlatformRecoveryExportCreated',{reason:'Newest'},null);
 const second=await(await f.platform('?limit=10&action=PlatformRecoveryExportCreated&before='+first.nextBefore)).json();assert.equal(second.events.length,10);assert.ok(second.events.every(e=>e.id<first.nextBefore));
 assert.equal(second.events.some(e=>first.events.some(old=>e.id===old.id)),false);
 assert.equal((await f.get('?action=PlatformRecoveryExportCreated','super')).status,400);
});
test('audit projection excludes nested/raw private data and masks credential-shaped reason text',async t=>{
 const f=await fixture(t),token='a'.repeat(64);
 f.add('LicenceUpdated',{reason:'Review token='+token+' password=TopSecret! authorization=Bearer private.jwt.value secret="Two words"',userId:'master',tokenHash:token,password:'RawPassword',clientId:'PRIVATE-CLIENT-ID',before:{status:'Active',staffLimit:4,clientLimit:1,notes:'PRIVATE NOTES',password:'NestedPassword'},after:{status:'Suspended',clientLimit:1,records:[{name:'PRIVATE RECORD'}]}});
 f.add('FuturePrivateAction',{reason:'PRIVATE FUTURE',secret:token});
 const response=await f.get('?limit=2');assert.equal(response.headers.get('cache-control'),'no-store');const data=await response.json();
 assert.equal(data.events[0].action,'Other governance event');assert.deepEqual(data.events[0].details,{});
 assert.equal(data.events[1].details.after.status,'Suspended');assert.equal(data.events[1].details.before.staffLimit,4);
 const encoded=JSON.stringify(data);for(const value of [token,'TopSecret','RawPassword','PRIVATE','NestedPassword','tokenHash','records','private.jwt.value','Two words'])assert.equal(encoded.includes(value),false,value);
});
test('keyset pagination is bounded and avoids duplicates when newer events arrive',async t=>{
 const f=await fixture(t);for(let i=0;i<32;i++)f.add('MemberUpdated',{reason:'Audit fixture '+i,userId:'member',before:{role:'Staff',status:'Active'},after:{role:'Staff',status:'Inactive'}});
 const first=await(await f.get('?limit=10&action=MemberUpdated')).json();assert.equal(first.events.length,10);assert.ok(first.nextBefore);
 f.add('MemberUpdated',{reason:'New event'});
 const second=await(await f.get('?limit=10&action=MemberUpdated&before='+first.nextBefore)).json();assert.equal(second.events.length,10);
 assert.equal(second.events.some(e=>first.events.some(old=>e.id===old.id)),false);assert.ok(second.events.every(e=>e.id<first.nextBefore));
 const other=await(await f.get('','super',f.otherOrganisationId)).json();assert.equal(JSON.stringify(other).includes('Audit fixture'),false);
});
