const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const modulePromise=import('../packages/database/organisation-repository.mjs');
const epoch=Date.parse('2026-10-17T00:00:00.000Z');
async function fixture(t,{migrate=true}={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'organisation-foundation-'));
  const filename=path.join(dir,'chambers.sqlite'),db=new DatabaseSync(filename);
  t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
  db.exec(fs.readFileSync('packages/database/schema.sql','utf8'));
  db.exec(fs.readFileSync('apps/advocate/database/schema.sql','utf8'));
  for(const [id,role] of [['super','Owner'],['master','Clerk'],['other','Owner'],['inactive','Advocate']]){
    db.prepare('INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,?,?,?)').run(id,id,`${id}@example.com`,role,'unchanged-password-hash',id==='inactive'?0:1);
  }
  db.prepare('INSERT INTO records(kind,id,data) VALUES(?,?,?)').run('clients','legacy-client',JSON.stringify({name:'Preserved client'}));
  db.prepare('INSERT INTO files(id,name,mime,content) VALUES(?,?,?,?)').run('legacy-file','kept.bin','application/octet-stream',Buffer.from([0,1,127,255]));
  db.prepare('INSERT INTO platform_preferences(userId,data) VALUES(?,?)').run('master','{"favorites":["advocate"]}');
  db.prepare('INSERT INTO app_access(userId,appId) VALUES(?,?)').run('master','advocate');
  const mod=await modulePromise;
  if(migrate)mod.migrateOrganisationSchema(db);
  let now=epoch;
  const repo=migrate?new mod.OrganisationRepository(db,{clock:()=>now}):null;
  return {db,repo,mod,filename,setNow:value=>{now=value;}};
}
const request=(patch={})=>({actorUserId:'super',name:'Test Chambers',type:'Legal',masterAdminUserId:'master',staffLimit:5,clientLimit:20,
  licences:[{appId:'advocate',status:'Active',startsAt:'2026-10-01T00:00:00.000Z',endsAt:'2027-10-01T00:00:00.000Z',readOnlyUntil:null,staffLimit:5,clientLimit:20}],...patch});
const code=expected=>error=>error.code===expected;
function count(db,table){return db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;}

test('opt-in migration preserves existing accounts, records, blobs, grants and preferences',async t=>{
  const {db,mod}=await fixture(t,{migrate:false});
  const before=Object.fromEntries(['users','records','files','app_access','platform_preferences'].map(name=>[name,db.prepare(`SELECT * FROM ${name}`).all()]));
  assert.equal(mod.migrateOrganisationSchema(db).applied,true);
  assert.equal(mod.migrateOrganisationSchema(db).applied,false);
  for(const [table,rows] of Object.entries(before))assert.deepEqual(db.prepare(`SELECT * FROM ${table}`).all(),rows,table);
  assert.equal(count(db,'platform_super_admins'),0);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  db.prepare('UPDATE platform_organisation_migrations SET checksum=?').run('modified');
  assert.throws(()=>mod.migrateOrganisationSchema(db),code('migration-drift'));
});
test('migration rolls back conflicting DDL and requires foreign keys',async t=>{
  const {db,mod}=await fixture(t,{migrate:false});
  assert.throws(()=>new mod.OrganisationRepository(db),code('migration-required'));
  assert.throws(()=>new mod.OrganisationRepository({}),code('unsupported-database'));
  db.exec('PRAGMA foreign_keys=OFF');assert.throws(()=>mod.migrateOrganisationSchema(db),code('foreign-keys-required'));
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE platform_app_licences (existing TEXT)');
  assert.throws(()=>mod.migrateOrganisationSchema(db),/already exists/);
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='platform_organisations'").get(),undefined);
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='platform_organisation_migrations'").get(),undefined);
  assert.equal(count(db,'users'),4);
});
test('Super Admin bootstrap is explicit, single-use, audited and independent of Owner role',async t=>{
  const {db,repo}=await fixture(t);
  assert.throws(()=>repo.provision(request()),code('forbidden'));
  assert.throws(()=>repo.bootstrapSuperAdmin({userId:'inactive'}),code('invalid-user'));
  repo.bootstrapSuperAdmin({userId:'master'});
  assert.equal(repo.authority('master').platformRole.role,'SuperAdmin');
  assert.equal(repo.authority('other').platformRole,null);
  assert.throws(()=>repo.bootstrapSuperAdmin({userId:'super'}),code('already-bootstrapped'));
  assert.equal(count(db,'platform_organisation_audit'),1);
  assert.equal(db.prepare('SELECT role FROM users WHERE id=?').get('master').role,'Clerk');
});
test('provisioning and activation persist together without granting legacy app access',async t=>{
  const {db,repo,filename,mod}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});
  const result=repo.provision(request());
  assert.equal(result.status,'PendingActivation');assert.match(result.invitation.token,/^[a-f0-9]{64}$/);
  assert.equal(count(db,'platform_app_assignments'),0);
  const invite=db.prepare('SELECT * FROM platform_organisation_invitations').get();
  assert.notEqual(invite.tokenHash,result.invitation.token);
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM platform_organisation_audit').all()).includes(result.invitation.token),false);
  assert.throws(()=>repo.organisation({actorUserId:'master',organisationId:result.organisationId}),code('forbidden'));
  assert.throws(()=>repo.acceptInvitation({actorUserId:'other',token:result.invitation.token}),code('invalid-invitation'));
  assert.equal(repo.acceptInvitation({actorUserId:'master',token:result.invitation.token}).status,'Active');
  const organisation=repo.organisation({actorUserId:'master',organisationId:result.organisationId});
  assert.equal(organisation.version,2);assert.equal(organisation.licences[0].appId,'advocate');
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:result.invitation.token}),code('invalid-invitation'));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  const second=new DatabaseSync(filename);
  try{
    second.exec('PRAGMA foreign_keys=ON');const reopened=new mod.OrganisationRepository(second);
    assert.equal(reopened.organisation({actorUserId:'master',organisationId:result.organisationId}).status,'Active');
    assert.throws(()=>reopened.acceptInvitation({actorUserId:'master',token:result.invitation.token}),code('invalid-invitation'));
  }finally{second.close();}
});
test('two organisations have scoped administration and distinct app entitlements',async t=>{
  const {repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});
  const a=repo.provision(request()),b=repo.provision(request({masterAdminUserId:'other',licences:[{...request().licences[0],appId:'batchfee-lite'}]}));
  repo.acceptInvitation({actorUserId:'master',token:a.invitation.token});repo.acceptInvitation({actorUserId:'other',token:b.invitation.token});
  assert.throws(()=>repo.organisation({actorUserId:'master',organisationId:b.organisationId}),code('forbidden'));
  assert.throws(()=>repo.organisation({actorUserId:'other',organisationId:a.organisationId}),code('forbidden'));
  assert.equal(repo.organisation({actorUserId:'super',organisationId:b.organisationId}).licences[0].appId,'batchfee-lite');
  assert.throws(()=>repo.provision(request({actorUserId:'master'})),code('forbidden'));
});
test('provisioning validates licences, dates, capacities and users without partial writes',async t=>{
  const {db,repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});
  const licence=request().licences[0];
  const invalid=[{name:' '},{type:''},{timezone:'invalid/timezone'},{staffLimit:0},{clientLimit:-1},{masterAdminUserId:'inactive'},{licences:[]},
    ...[{appId:'projects'},{appId:'qr-maker'},{status:'Revoked'},{startsAt:'2026-02-30T00:00:00.000Z'},
      {endsAt:licence.startsAt},{endsAt:null,readOnlyUntil:licence.endsAt},{staffLimit:1.5},{clientLimit:undefined}].map(patch=>({licences:[{...licence,...patch}]})),
    {licences:[licence,licence]}];
  for(const patch of invalid){assert.throws(()=>repo.provision(request(patch)));assert.equal(count(db,'platform_organisations'),0);}
  assert.equal(count(db,'platform_organisation_audit'),1);
  db.exec("CREATE TRIGGER fail_provision BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='OrganisationProvisioned' BEGIN SELECT RAISE(ABORT,'forced audit failure'); END");
  assert.throws(()=>repo.provision(request()),/forced audit failure/);
  for(const table of ['platform_organisations','platform_memberships','platform_app_licences','platform_organisation_invitations'])assert.equal(count(db,table),0,table);
});
test('invitation expiry, identity changes, suspension and revocation fail closed',async t=>{
  const {db,repo,setNow}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});
  const a=repo.provision(request());setNow(a.invitation.expiresAt);
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:a.invitation.token}),code('invalid-invitation'));
  setNow(epoch);const b=repo.provision(request());
  db.prepare('UPDATE users SET email=? WHERE id=?').run('changed@example.com','master');
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:b.invitation.token}),code('invalid-invitation'));
  db.prepare('UPDATE users SET email=? WHERE id=?').run('master@example.com','master');
  db.prepare("UPDATE platform_organisations SET status='Suspended' WHERE id=?").run(b.organisationId);
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:b.invitation.token}),code('invalid-invitation'));
  assert.equal(db.prepare('SELECT consumedAt FROM platform_organisation_invitations WHERE organisationId=?').get(b.organisationId).consumedAt,null);
});
test('invitation reissue revokes old secrets, rejects stale changes and audits no token',async t=>{
  const {db,repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});const a=repo.provision(request());
  assert.throws(()=>repo.updateMasterInvitation({actorUserId:'master',organisationId:a.organisationId,version:1}),code('forbidden'));
  const renewed=repo.updateMasterInvitation({actorUserId:'super',organisationId:a.organisationId,version:1});
  assert.throws(()=>repo.updateMasterInvitation({actorUserId:'super',organisationId:a.organisationId,version:1}),code('conflict'));
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:a.invitation.token}),code('invalid-invitation'));
  repo.updateMasterInvitation({actorUserId:'super',organisationId:a.organisationId,version:2,revokeOnly:true});
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:renewed.invitation.token}),code('invalid-invitation'));
  assert.equal(count(db,'platform_organisation_invitations'),2);
  const fresh=repo.updateMasterInvitation({actorUserId:'super',organisationId:a.organisationId,version:3});
  repo.acceptInvitation({actorUserId:'master',token:fresh.invitation.token});
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM platform_organisation_audit').all()).includes(fresh.invitation.token),false);
});
test('activation and reissue roll back if audit persistence fails',async t=>{
  const {db,repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});const a=repo.provision(request());
  db.exec("CREATE TRIGGER fail_activation BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='OrganisationActivated' BEGIN SELECT RAISE(ABORT,'activation audit failed'); END");
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:a.invitation.token}),/activation audit failed/);
  assert.equal(db.prepare('SELECT consumedAt FROM platform_organisation_invitations').get().consumedAt,null);
  assert.equal(db.prepare('SELECT status FROM platform_memberships').get().status,'Invited');
  assert.equal(db.prepare('SELECT version FROM platform_organisations').get().version,1);
  db.exec("CREATE TRIGGER fail_reissue BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='MasterInvitationReissued' BEGIN SELECT RAISE(ABORT,'reissue audit failed'); END");
  assert.throws(()=>repo.updateMasterInvitation({actorUserId:'super',organisationId:a.organisationId,version:1}),/reissue audit failed/);
  assert.equal(db.prepare('SELECT revokedAt FROM platform_organisation_invitations').get().revokedAt,null);
  assert.equal(db.prepare('SELECT version FROM platform_organisations').get().version,1);
  db.exec('DROP TRIGGER fail_activation; DROP TRIGGER fail_reissue');
  assert.equal(repo.acceptInvitation({actorUserId:'master',token:a.invitation.token}).status,'Active');
});
test('authority changes are re-read rather than cached by a repository instance',async t=>{
  const {db,repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});
  db.prepare('UPDATE platform_super_admins SET active=0 WHERE userId=?').run('super');
  assert.throws(()=>repo.provision(request()),code('forbidden'));
  db.prepare('UPDATE platform_super_admins SET active=1 WHERE userId=?').run('super');
  const a=repo.provision(request());
  db.prepare('UPDATE users SET active=0 WHERE id=?').run('master');
  assert.throws(()=>repo.acceptInvitation({actorUserId:'master',token:a.invitation.token}),code('invalid-invitation'));
  db.prepare('UPDATE users SET active=1 WHERE id=?').run('master');
  repo.acceptInvitation({actorUserId:'master',token:a.invitation.token});
  db.prepare("UPDATE platform_memberships SET status='Inactive' WHERE userId=?").run('master');
  assert.throws(()=>repo.organisation({actorUserId:'master',organisationId:a.organisationId}),code('forbidden'));
});
test('database enforces one primary Master Admin and matching membership/app references',async t=>{
  const {db,repo}=await fixture(t);repo.bootstrapSuperAdmin({userId:'super'});const {organisationId}=repo.provision(request());
  assert.throws(()=>db.prepare('INSERT INTO platform_memberships(organisationId,userId,role,status,createdAt) VALUES(?,?,?,?,?)').run(organisationId,'other','MasterAdmin','Active',epoch),/UNIQUE/);
  assert.throws(()=>db.prepare("UPDATE platform_memberships SET role='Staff' WHERE organisationId=?").run(organisationId),/FOREIGN KEY/);
  assert.throws(()=>db.prepare('INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,?,?,?)').run(organisationId,'other','advocate','Advocate','Active'),/FOREIGN KEY/);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
