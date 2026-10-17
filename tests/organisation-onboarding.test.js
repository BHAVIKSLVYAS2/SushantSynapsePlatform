const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {readFileSync}=require('node:fs');
const {scryptSync}=require('node:crypto');
const epoch=Date.parse('2026-10-17T00:00:00.000Z');
const password='Recipient selected password 2026!';
const code=value=>error=>error.code===value;
async function fixture(t){
  // Entirely isolated SQLite; no filesystem database or live account is opened.
  const db=new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec(readFileSync('packages/database/schema.sql','utf8'));
  db.exec(readFileSync('apps/advocate/database/schema.sql','utf8'));
  const mod=await import('../packages/database/organisation-repository.mjs');
  mod.migrateOrganisationSchema(db);
  for(const [id,active] of [['super',1],['other',1],['disabled',0]])db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id,id,id+'@example.com','Owner','original-hash',active);
  let now=epoch;const repo=new mod.OrganisationRepository(db,{clock:()=>now});
  repo.bootstrapSuperAdmin({userId:'super'});
  const input={actorUserId:'super',name:'New Chambers',type:'Legal',masterAdminEmail:' NEW@example.com ',staffLimit:2,clientLimit:0,
    licences:[{appId:'advocate',status:'Active',startsAt:'2026-10-01T00:00:00.000Z',endsAt:null,readOnlyUntil:null,staffLimit:2,clientLimit:0}]};
  const accept=token=>({token,email:'new@example.com',name:'New Master',password});
  return {db,repo,input,accept,setNow:value=>{now=value;},mod};
}
test('new primary identity starts disabled and activation grants only its intended membership',async t=>{
  const {db,repo,input,accept}=await fixture(t);
  const result=repo.provisionNewMaster(input),user=db.prepare("SELECT * FROM users WHERE email='new@example.com'").get();
  assert.equal(result.newAccount,true);assert.equal(user.active,0);assert.equal(user.role,'Clerk');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM app_access WHERE userId=?').get(user.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_app_assignments WHERE userId=?').get(user.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_super_admins WHERE userId=?').get(user.id).n,0);
  assert.equal(db.prepare('SELECT tokenHash FROM platform_organisation_invitations WHERE userId=?').get(user.id).tokenHash.includes(result.invitation.token),false);
  assert.equal(repo.activateNewMaster(accept(result.invitation.token)).status,'Active');
  const activated=db.prepare('SELECT * FROM users WHERE id=?').get(user.id),[salt,key]=activated.password.split(':');
  assert.equal(activated.active,1);assert.equal(activated.name,'New Master');assert.equal(activated.role,'Clerk');
  assert.equal(scryptSync(password,salt,64).toString('hex'),key);
  assert.equal(repo.organisation({actorUserId:user.id,organisationId:result.organisationId}).status,'Active');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM app_access WHERE userId=?').get(user.id).n,0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_app_assignments WHERE userId=?').get(user.id).n,0);
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM platform_organisation_audit').all()).includes(password),false);
  assert.throws(()=>repo.activateNewMaster(accept(result.invitation.token)),code('invalid-invitation'));
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('provisioning enforces Super Admin and cannot claim existing active, disabled or pending identities',async t=>{
  const {db,repo,input}=await fixture(t);
  assert.throws(()=>repo.provisionNewMaster({...input,actorUserId:'other'}),code('forbidden'));
  for(const email of ['SUPER@example.com','disabled@example.com'])assert.throws(()=>repo.provisionNewMaster({...input,masterAdminEmail:email}),code('invalid-user'));
  repo.provisionNewMaster(input);
  assert.throws(()=>repo.provisionNewMaster(input),code('invalid-user'));
  assert.equal(db.prepare("SELECT password FROM users WHERE id='disabled'").get().password,'original-hash');
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,4);
});
test('failed provisioning rolls back the identity, pending marker and organisation',async t=>{
  const {db,repo,input}=await fixture(t);
  assert.throws(()=>repo.provisionNewMaster({...input,staffLimit:0}),code('invalid-input'));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM users').get().n,3);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_pending_identities').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM platform_organisations').get().n,0);
});
test('wrong email, expired token and invalid password leave all activation state untouched',async t=>{
  const {db,repo,input,accept,setNow}=await fixture(t),result=repo.provisionNewMaster(input);
  assert.throws(()=>repo.activateNewMaster({...accept(result.invitation.token),email:'other@example.com'}),code('invalid-invitation'));
  assert.throws(()=>repo.activateNewMaster({...accept(result.invitation.token),password:'short'}),code('invalid-input'));
  setNow(result.invitation.expiresAt);
  assert.throws(()=>repo.activateNewMaster(accept(result.invitation.token)),code('invalid-invitation'));
  assert.equal(db.prepare("SELECT active FROM users WHERE email='new@example.com'").get().active,0);
  assert.equal(db.prepare('SELECT activatedAt FROM platform_pending_identities').get().activatedAt,null);
  assert.equal(db.prepare('SELECT consumedAt FROM platform_organisation_invitations').get().consumedAt,null);
});
test('pending primary invitations can rotate and revoke without activating an identity',async t=>{
  const {db,repo,input,accept}=await fixture(t),first=repo.provisionNewMaster(input);
  const second=repo.updateMasterInvitation({actorUserId:'super',organisationId:first.organisationId,version:1});
  assert.throws(()=>repo.activateNewMaster(accept(first.invitation.token)),code('invalid-invitation'));
  repo.updateMasterInvitation({actorUserId:'super',organisationId:first.organisationId,version:2,revokeOnly:true});
  assert.throws(()=>repo.activateNewMaster(accept(second.invitation.token)),code('invalid-invitation'));
  assert.equal(db.prepare("SELECT active FROM users WHERE email='new@example.com'").get().active,0);
  const third=repo.updateMasterInvitation({actorUserId:'super',organisationId:first.organisationId,version:3});
  repo.activateNewMaster(accept(third.invitation.token));
});
test('activation is atomic even if a later audit write fails',async t=>{
  const {db,repo,input,accept}=await fixture(t),result=repo.provisionNewMaster(input);
  db.exec("CREATE TRIGGER fail_activation BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='InvitationIdentityActivated' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
  assert.throws(()=>repo.activateNewMaster(accept(result.invitation.token)),/fixture failure/);
  assert.equal(db.prepare("SELECT active FROM users WHERE email='new@example.com'").get().active,0);
  assert.equal(db.prepare('SELECT activatedAt FROM platform_pending_identities').get().activatedAt,null);
  assert.equal(db.prepare('SELECT consumedAt FROM platform_organisation_invitations').get().consumedAt,null);
  assert.equal(db.prepare('SELECT status FROM platform_organisations').get().status,'PendingActivation');
});
test('version-three recovery remains supported and pending identities survive full recovery',async t=>{
  const {db,repo,input,mod}=await fixture(t);
  const {organisationRecovery}=require('../packages/database/organisation-recovery.cjs');
  const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
  repo.provisionNewMaster(input);
  const dump=organisationRecovery(db,literal),restored=new DatabaseSync(':memory:');
  try{
    restored.exec(readFileSync('packages/database/schema.sql','utf8'));restored.exec(readFileSync('apps/advocate/database/schema.sql','utf8'));
    for(const row of db.prepare('SELECT * FROM users').all())restored.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(...Object.values(row));
    restored.exec(dump.schema);restored.exec('BEGIN;'+dump.inserts.join('\n')+'COMMIT;');
    assert.equal(restored.prepare('SELECT COUNT(*) n FROM platform_pending_identities').get().n,1);
    assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{restored.close();}
  const old=new DatabaseSync(':memory:');
  try{
    old.exec(readFileSync('packages/database/schema.sql','utf8'));old.exec(readFileSync('apps/advocate/database/schema.sql','utf8'));
    old.exec('CREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL)');
    for(const m of mod.organisationMigrations.slice(0,3)){old.exec(m.source);old.prepare('INSERT INTO platform_organisation_migrations VALUES(?,?)').run(m.id,m.checksum);}
    assert.equal(organisationRecovery(old,literal).schema.includes('CREATE TABLE platform_pending_identities'),false);
    assert.deepEqual(mod.migrateOrganisationSchema(old).ids,['platform-organisations-004','platform-organisations-005']);
  }finally{old.close();}
});
