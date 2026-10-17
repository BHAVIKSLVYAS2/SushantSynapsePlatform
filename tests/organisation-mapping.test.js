const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {organisationRecovery}=require('../packages/database/organisation-recovery.cjs');
const modules=Promise.all([import('../packages/database/organisation-repository.mjs'),import('../packages/database/legacy-chambers-mapping.mjs')]);
const epoch=Date.parse('2026-10-17T00:00:00.000Z');
const code=expected=>error=>error.code===expected;
async function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'organisation-mapping-'));
  const store=new Store(dir,{provider:'sqlite'}),db=new DatabaseSync(path.join(dir,'chambers.sqlite'));
  db.exec('PRAGMA foreign_keys=ON');
  t.after(()=>{db.close();store.sql.close();fs.rmSync(dir,{recursive:true,force:true});});
  for(const [id,role,active] of [['super','Owner',1],['master','Owner',1],['staff','Clerk',1],['inactive','Advocate',0]]){
    db.prepare('INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,?,?,?)').run(id,id,`${id}@example.com`,role,'preserved-hash',active);
  }
  for(const id of ['staff','inactive'])store.setAccess(id,['advocate']);
  store.setPreferences('staff',{favorites:['advocate'],recent:[]});
  store.create('clients',{id:'client1',name:'Preserved client'});
  store.create('documents',{id:'file1',name:'Preserved document',caseId:'',clientId:'client1'});
  store.addFile('file1',"A 'special' order.bin",'application/octet-stream',Buffer.from([0,1,127,255]));
  db.prepare('INSERT INTO sessions(token,userId,expires) VALUES(?,?,?)').run('live-session','master',epoch+100000);
  const [mod,mappingMod]=await modules;
  mod.migrateOrganisationSchema(db);
  const repo=new mod.OrganisationRepository(db,{clock:()=>epoch});repo.bootstrapSuperAdmin({userId:'super'});
  const provisioned=repo.provision({actorUserId:'super',name:'Original Chambers',type:'Legal',masterAdminUserId:'master',staffLimit:3,clientLimit:0,
    licences:[{appId:'advocate',status:'Active',startsAt:'2026-01-01T00:00:00.000Z',endsAt:null,readOnlyUntil:null,staffLimit:2,clientLimit:0}]});
  repo.acceptInvitation({actorUserId:'master',token:provisioned.invitation.token});
  const mapping=new mappingMod.LegacyChambersMapping(repo);
  const input={actorUserId:'super',organisationId:provisioned.organisationId,accounts:[
    {userId:'super',role:null,appRole:null},{userId:'master',role:'MasterAdmin',appRole:'Owner'},
    {userId:'staff',role:'Staff',appRole:'Clerk'},{userId:'inactive',role:'Staff',appRole:'Advocate'}]};
  return {db,store,mod,repo,mapping,input};
}
function rows(db,table){return db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();}
function legacySnapshot(db){return Object.fromEntries(['users','records','files','settings','audit','app_access','platform_preferences','sessions'].map(table=>[table,rows(db,table)]));}

test('legacy preview and explicit mapping preserve all existing bytes and access data',async t=>{
  const {db,mapping,input}=await fixture(t),before=legacySnapshot(db);
  const preview=mapping.preview(input);
  assert.deepEqual(preview.counts,{records:2,files:1,members:3,activeMembers:2,activeAssignments:2,excluded:1});
  assert.deepEqual(legacySnapshot(db),before);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM chambers_record_ownership').get().n,0);
  mapping.apply({...input,fingerprint:preview.fingerprint});
  assert.deepEqual(legacySnapshot(db),before);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM chambers_record_ownership').get().n,2);
  assert.equal(db.prepare('SELECT organisationId FROM chambers_file_ownership').get().organisationId,input.organisationId);
  assert.equal(db.prepare('SELECT status FROM platform_memberships WHERE userId=?').get('inactive').status,'Inactive');
  assert.equal(db.prepare('SELECT status FROM platform_app_assignments WHERE userId=?').get('inactive').status,'Inactive');
  assert.equal(db.prepare('SELECT userId FROM platform_memberships WHERE userId=?').get('super'),undefined);
  assert.throws(()=>mapping.apply({...input,fingerprint:preview.fingerprint}),code('already-mapped'));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('mapping requires Super Admin, exhaustive explicit decisions and preserved app roles',async t=>{
  const {db,mapping,input}=await fixture(t);
  assert.throws(()=>mapping.preview({...input,actorUserId:'master'}),code('forbidden'));
  assert.throws(()=>mapping.preview({...input,accounts:input.accounts.slice(1)}),code('invalid-mapping'));
  for(const patch of [{userId:'super',role:'MasterAdmin',appRole:'Owner'},{userId:'staff',role:'Staff',appRole:'Owner'},
    {userId:'master',role:null,appRole:null},{userId:'staff',role:'Client',appRole:'Clerk'}]){
    const accounts=input.accounts.map(a=>a.userId===patch.userId?patch:a);
    assert.throws(()=>mapping.preview({...input,accounts}),code('invalid-mapping'));
  }
  db.prepare('DELETE FROM app_access WHERE userId=?').run('staff');
  assert.throws(()=>mapping.preview(input),code('invalid-mapping'));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_legacy_workspaces').get().n,0);
});
test('stale previews reject document, account and requested mapping changes',async t=>{
  const {db,mapping,input}=await fixture(t);
  let preview=mapping.preview(input);
  db.prepare('UPDATE files SET content=? WHERE id=?').run(Buffer.from([10,20]),'file1');
  assert.throws(()=>mapping.apply({...input,fingerprint:preview.fingerprint}),code('conflict'));
  preview=mapping.preview(input);db.prepare('UPDATE users SET password=? WHERE id=?').run('new-hash','staff');
  assert.throws(()=>mapping.apply({...input,fingerprint:preview.fingerprint}),code('conflict'));
  preview=mapping.preview(input);
  const accounts=input.accounts.map(a=>a.userId==='staff'?{...a,role:null,appRole:null}:a);
  assert.throws(()=>mapping.apply({...input,accounts,fingerprint:preview.fingerprint}),code('conflict'));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_legacy_workspaces').get().n,0);
});
test('mapping checks capacity and licence eligibility before applying',async t=>{
  const {db,mapping,input}=await fixture(t);
  db.prepare('UPDATE platform_app_licences SET staffLimit=1').run();
  assert.throws(()=>mapping.preview(input),code('seat-limit-reached'));
  db.prepare('UPDATE platform_app_licences SET staffLimit=2').run();
  db.prepare('UPDATE platform_organisations SET staffLimit=1').run();
  assert.throws(()=>mapping.preview(input),code('seat-limit-reached'));
  db.prepare('UPDATE platform_organisations SET staffLimit=3').run();
  db.prepare("UPDATE platform_app_licences SET status='Suspended'").run();
  assert.throws(()=>mapping.preview(input),code('invalid-licence'));
});
test('failed mapping audit rolls back memberships, assignments and ownership',async t=>{
  const {db,mapping,input}=await fixture(t),preview=mapping.preview(input);
  db.exec("CREATE TRIGGER reject_mapping BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='LegacyChambersMapped' BEGIN SELECT RAISE(ABORT,'mapping audit failed'); END");
  assert.throws(()=>mapping.apply({...input,fingerprint:preview.fingerprint}),/mapping audit failed/);
  for(const table of ['platform_legacy_workspaces','chambers_record_ownership','chambers_file_ownership','platform_app_assignments'])assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0,table);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_memberships').get().n,1);
  db.exec('DROP TRIGGER reject_mapping');mapping.apply({...input,fingerprint:preview.fingerprint});
});
test('full SQLite recovery round-trips organisation state and ownership, excludes sessions',async t=>{
  const {db,store,mod,mapping,input}=await fixture(t);
  const preview=mapping.preview(input);mapping.apply({...input,fingerprint:preview.fingerprint});
  const sql=store.exportSql();assert.equal(sql.includes('live-session'),false);
  const restored=new DatabaseSync(':memory:');
  try{
    restored.exec(sql);
    for(const table of [...mod.organisationTables,'users','records','files','app_access','platform_preferences','settings','audit'])assert.deepEqual(rows(restored,table),rows(db,table),table);
    assert.equal(restored.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);
    assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
    assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.equal(mod.migrateOrganisationSchema(restored).applied,false);
    const repo=new mod.OrganisationRepository(restored);
    assert.equal(repo.organisation({actorUserId:'master',organisationId:input.organisationId}).status,'Active');
    assert.equal(store.backup().format,'chambers-backup');
    assert.equal(Object.hasOwn(store.backup(),'organisations'),false);
  }finally{restored.close();}
});
test('ordered migration upgrades a populated version-one foundation without rewriting it',async t=>{
  const {mod}=await fixture(t),db=new DatabaseSync(':memory:');
  try{
    db.exec(fs.readFileSync('packages/database/schema.sql','utf8'));
    db.exec(fs.readFileSync('apps/advocate/database/schema.sql','utf8'));
    db.exec('CREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL)');
    const first=mod.organisationMigrations[0];db.exec(first.source);
    db.prepare('INSERT INTO platform_organisation_migrations VALUES(?,?)').run(first.id,first.checksum);
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('kept','kept','kept@example.com','Owner','hash');
    db.prepare('INSERT INTO platform_super_admins VALUES(?,1,?)').run('kept',epoch);
    const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
    const old=organisationRecovery(db,literal);
    assert.equal(old.schema.includes('chambers_record_ownership'),false);
    const restored=new DatabaseSync(':memory:');
    try{
      restored.exec(fs.readFileSync('packages/database/schema.sql','utf8'));
      restored.exec(old.schema);
      restored.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('kept','kept','kept@example.com','Owner','hash');
      restored.exec('BEGIN;'+old.inserts.join('\n')+'COMMIT;');
      assert.equal(restored.prepare('SELECT userId FROM platform_super_admins').get().userId,'kept');
      assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
    }finally{restored.close();}
    assert.deepEqual(mod.migrateOrganisationSchema(db).ids,['platform-organisations-002','platform-organisations-003','platform-organisations-004','platform-organisations-005']);
    assert.equal(db.prepare('SELECT userId FROM platform_super_admins').get().userId,'kept');
    assert.equal(mod.migrateOrganisationSchema(db).applied,false);
  }finally{db.close();}
});
test('full export fails closed on drift or partial organisation metadata',async t=>{
  const {db,store}=await fixture(t);
  db.prepare('UPDATE platform_organisation_migrations SET checksum=? WHERE id=?').run('bad','platform-organisations-002');
  assert.throws(()=>store.exportSql(),/unknown or modified/);
  assert.equal(db.isTransaction,false);
  const second=(await modules)[0].organisationMigrations[1];
  db.prepare('UPDATE platform_organisation_migrations SET checksum=? WHERE id=?').run(second.checksum,second.id);
  db.exec('DROP TABLE chambers_file_ownership');
  assert.throws(()=>store.exportSql(),/incomplete or inconsistent/);
  assert.equal(db.isTransaction,false);
});
