const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const {startPreview}=require('./organisation-preview-fixture.cjs');
async function fixture(t){
 const f=await startPreview({chambers:true});t.after(f.stop);
 const cookies={};for(const id of ['super','master','member','outsider','client'])cookies[id]=await f.login(id);
 const call=async(route,{actor='master',org=f.organisationId,method='GET',body}={})=>{
  const r=await fetch(f.base+'/api/chambers/'+org+'/'+route,{method,headers:{Cookie:cookies[actor],...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const contentType=r.headers.get('content-type')||'';return {status:r.status,data:contentType.includes('json')?await r.json():Buffer.from(await r.arrayBuffer())};
 };
 const create=async(kind,body,options={})=>{const r=await call(kind,{...options,method:'POST',body});assert.equal(r.status,201,JSON.stringify(r.data));return r.data;};
 const client=await create('clients',{name:'First private client'});
 const matter=await create('cases',{title:'First private matter',clientId:client.id,court:'Delhi',cnr:'DLCT010000012026'});
 const otherClient=await create('clients',{name:'Other private client'},{actor:'outsider',org:f.otherOrganisationId});
 const otherCase=await create('cases',{title:'Other private matter',clientId:otherClient.id,court:'Mumbai',cnr:'DLCT010000012026'},{actor:'outsider',org:f.otherOrganisationId});
 return {...f,cookies,call,create,client,matter,otherClient,otherCase};
}
test('Chambers state, staff directory, settings and activity are organisation-scoped',async t=>{
 const f=await fixture(t);let state=await f.call('state');assert.equal(state.status,200);assert.equal(state.data.currentUser.role,'Owner');
 assert.equal(state.data.clients.length,1);assert.equal(state.data.cases.length,1);assert.deepEqual(state.data.users.map(u=>u.id).sort(),['master','member']);
 assert.equal(JSON.stringify(state.data).includes('Other private'),false);
 assert.equal((await f.call('settings',{method:'PATCH',body:{name:'Private firm setting'}})).status,200);
 const other=await f.call('state',{actor:'outsider',org:f.otherOrganisationId});assert.notEqual(other.data.settings.name,'Private firm setting');
 assert.equal(JSON.stringify(other.data.activity).includes('First private'),false);
 for(const actor of ['super','outsider','client'])assert.equal((await f.call('state',{actor})).status,403,actor);
 assert.equal((await fetch(f.base+'/api/state',{headers:{Cookie:f.cookies.super}})).status,409);
 assert.equal((await fetch(f.base+'/api/backup.sql',{headers:{Cookie:f.cookies.super}})).status,409);
 assert.equal((await f.call('backup.sql')).status,403);
 const list=await (await fetch(f.base+'/api/chambers',{headers:{Cookie:f.cookies.master}})).json();assert.equal(list.organisations.length,1);
});
test('guessed IDs, cross-organisation references, assignees and document blobs stay private',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('cases/'+f.otherCase.id,{method:'PATCH',body:{version:1,title:'Overwrite'}})).status,404);
 assert.equal((await f.call('tasks',{method:'POST',body:{title:'Bad link',caseId:f.otherCase.id,due:'2027-01-01'}})).status,400);
 assert.equal((await f.call('tasks',{method:'POST',body:{title:'Bad assignee',caseId:f.matter.id,due:'2027-01-01',assigneeId:'outsider'}})).status,400);
 assert.equal((await f.call('clients',{method:'POST',body:{name:'Injected',organisationId:f.otherOrganisationId}})).status,400);
 const doc=await f.create('documents',{name:'Private order',caseId:f.matter.id,originalName:'order.bin',content:Buffer.from([0,127,255]).toString('base64')});
 const own=await f.call('documents/'+doc.id+'/download');assert.deepEqual(own.data,Buffer.from([0,127,255]));
 assert.equal((await f.call('documents/'+doc.id+'/download',{actor:'outsider',org:f.otherOrganisationId})).status,404);
 assert.equal((await f.call('documents/'+doc.id,{actor:'outsider',org:f.otherOrganisationId,method:'PATCH',body:{version:doc.version,name:'Replace',originalName:'replace.bin',content:'eA=='}})).status,404);
 const db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));try{assert.equal(db.prepare('SELECT organisationId FROM chambers_file_ownership WHERE fileId=?').get(doc.id).organisationId,f.organisationId);}finally{db.close();}
});
test('payment balances, app roles and atomic hearing updates survive the scoped facade',async t=>{
 const f=await fixture(t);
 const invoice=await f.create('invoices',{clientId:f.client.id,caseId:f.matter.id,description:'Fees',amount:100,date:'2020-01-01',due:'2020-01-01'});
 const replies=await Promise.all([60,60].map(amount=>f.call('payments',{method:'POST',body:{invoiceId:invoice.id,amount,date:'2020-01-02'}})));
 assert.deepEqual(replies.map(r=>r.status).sort(),[201,400]);
 assert.equal((await f.call('payments',{actor:'member',method:'POST',body:{invoiceId:invoice.id,amount:1,date:'2020-01-02'}})).status,403);
 const hearing=await f.create('hearings',{caseId:f.matter.id,date:'2027-01-01',time:'10:00',purpose:'Evidence'});
 assert.equal((await f.call('hearings/'+hearing.id+'/outcome',{method:'POST',body:{version:hearing.version,status:'Adjourned',outcome:'Next date',nextDate:'2026-01-01',nextTime:'10:00',nextPurpose:'Hearing'}})).status,400);
 let state=(await f.call('state')).data;assert.equal(state.hearings[0].status,'Scheduled');assert.equal(state.hearings.length,1);
 assert.equal((await f.call('hearings/'+hearing.id+'/outcome',{method:'POST',body:{version:hearing.version,status:'Adjourned',outcome:'Next date',nextDate:'2027-02-01',nextTime:'10:00',nextPurpose:'Hearing'}})).status,200);
 state=(await f.call('state')).data;assert.equal(state.hearings.length,2);assert.equal(state.invoices[0].balance,40);
});
test('scoped backup and restore preserve other organisations, audit, accounts and snapshots',async t=>{
 const f=await fixture(t);
 const doc=await f.create('documents',{name:'Order',caseId:f.matter.id,originalName:'order.bin',content:'AAH/'});
 const backup=(await f.call('backup')).data;assert.equal(backup.organisationId,f.organisationId);assert.equal(backup.records.clients.length,1);
 const beforeOther=(await f.call('backup',{actor:'outsider',org:f.otherOrganisationId})).data;
 assert.equal((await f.call('restore',{method:'POST',body:{confirm:'RESTORE',backup:beforeOther}})).status,400);
 await f.create('clients',{name:'Later client'});
 assert.equal((await f.call('restore',{method:'POST',body:{confirm:'RESTORE',backup}})).status,200);
 assert.equal((await f.call('state')).data.clients.length,1);
 assert.deepEqual((await f.call('documents/'+doc.id+'/download')).data,Buffer.from([0,1,255]));
 const afterOther=(await f.call('backup',{actor:'outsider',org:f.otherOrganisationId})).data;for(const key of ['records','files','settings'])assert.deepEqual(afterOther[key],beforeOther[key]);
 const collision=structuredClone(backup);collision.records.clients[0].id=f.otherClient.id;
 collision.records.cases[0].clientId=f.otherClient.id;
 assert.equal((await f.call('restore',{method:'POST',body:{confirm:'RESTORE',backup:collision}})).status,409);
 assert.equal((await f.call('state')).data.clients[0].id,f.client.id);
 const db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));try{
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,5);
  assert.ok(db.prepare('SELECT COUNT(*) n FROM chambers_snapshots WHERE organisationId=?').get(f.organisationId).n>=2);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{db.close();}
});
test('licence suspension, grace and membership revocation take effect on existing sessions',async t=>{
 const f=await fixture(t),db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));
 try{
  db.prepare("UPDATE platform_app_licences SET status='Suspended' WHERE organisationId=?").run(f.organisationId);assert.equal((await f.call('state')).status,403);
  const start='2020-01-01T00:00:00.000Z',end=new Date(Date.now()-60000).toISOString(),grace=new Date(Date.now()+3600000).toISOString();
  db.prepare("UPDATE platform_app_licences SET status='Active',startsAt=?,endsAt=?,readOnlyUntil=? WHERE organisationId=?").run(start,end,grace,f.organisationId);
  assert.equal((await f.call('state')).status,200);assert.equal((await f.call('clients',{method:'POST',body:{name:'Blocked'}})).status,403);
  db.prepare("UPDATE platform_memberships SET status='Inactive' WHERE organisationId=? AND userId='master'").run(f.organisationId);assert.equal((await f.call('state')).status,403);
 }finally{db.close();}
});
test('full offline SQL recovery preserves scoped workspace settings, audit and snapshots',async t=>{
 const f=await fixture(t);await f.call('settings',{method:'PATCH',body:{name:'Scoped recovery firm'}});
 const {Store}=require('../apps/advocate/backend/store');const store=new Store(f.dir,{provider:'sqlite'}),restored=new DatabaseSync(':memory:');
 try{
  restored.exec(store.exportSql());
  assert.equal(JSON.parse(restored.prepare('SELECT data FROM chambers_workspace_settings WHERE organisationId=?').get(f.organisationId).data).name,'Scoped recovery firm');
  assert.ok(restored.prepare('SELECT COUNT(*) n FROM chambers_activity WHERE organisationId=?').get(f.organisationId).n>0);
  assert.ok(restored.prepare('SELECT COUNT(*) n FROM chambers_snapshots WHERE organisationId=?').get(f.organisationId).n>0);
  assert.equal(restored.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);
  assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
  const {migrateOrganisationSchema}=await import('../packages/database/organisation-repository.mjs');assert.equal(migrateOrganisationSchema(restored).applied,false);
 }finally{restored.close();store.sql.close();}
});
test('workspace migration upgrades version two and copies only the explicitly mapped profile',async()=>{
 const {organisationMigrations,migrateOrganisationSchema}=await import('../packages/database/organisation-repository.mjs');
 const {organisationRecovery}=require('../packages/database/organisation-recovery.cjs');
 const fs=require('node:fs'),db=new DatabaseSync(':memory:');
 try{
  db.exec(fs.readFileSync('packages/database/schema.sql','utf8'));db.exec(fs.readFileSync('apps/advocate/database/schema.sql','utf8'));
  db.exec('CREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL)');
  for(const m of organisationMigrations.slice(0,2)){db.exec(m.source);db.prepare('INSERT INTO platform_organisation_migrations VALUES(?,?)').run(m.id,m.checksum);}
  db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('master','Master','master@example.com','Owner','kept-hash');
  db.exec('BEGIN');
  db.prepare("INSERT INTO platform_organisations(id,name,type,timezone,status,masterAdminUserId,staffLimit,clientLimit,createdAt) VALUES(?,?,?,?,?,?,?,?,?)").run('mapped','Mapped','Legal','Asia/Kolkata','Active','master',5,0,0);
  db.prepare("INSERT INTO platform_memberships VALUES(?,?,'MasterAdmin','Active',0)").run('mapped','master');
  db.exec('COMMIT');
  db.prepare("INSERT INTO platform_legacy_workspaces VALUES('advocate',?,0,?)").run('mapped','0'.repeat(64));
  db.prepare('INSERT INTO settings VALUES(?,?)').run('firm',JSON.stringify({name:'Preserved mapped profile'}));
  const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
  assert.equal(organisationRecovery(db,literal).schema.includes('CREATE TABLE chambers_snapshots'),false);
  assert.deepEqual(migrateOrganisationSchema(db).ids,['platform-organisations-003','platform-organisations-004','platform-organisations-005']);
  assert.equal(JSON.parse(db.prepare('SELECT data FROM chambers_workspace_settings WHERE organisationId=?').get('mapped').data).name,'Preserved mapped profile');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM chambers_activity').get().n,0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{db.close();}
});
