const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const modules=Promise.all([import('../packages/database/organisation-repository.mjs'),import('../packages/database/organisation-administration.mjs')]);
const code=value=>error=>error.code===value;
const recipient=token=>({token,email:'new@example.com',name:'New Member',password:'Recipient selected password 2026!'});

test('organisation lifecycle is Super Admin-only, revision checked and preserves other configuration',async t=>{
 const f=await fixture(t),name=f.db.prepare('SELECT name FROM platform_organisations WHERE id=?').get(f.orgId).name;
 const input=()=>f.input({actorUserId:'super',status:'Suspended',confirmation:name});
 assert.throws(()=>f.admin.updateOrganisationStatus({...input(),actorUserId:'master'}),code('forbidden'));
 assert.throws(()=>f.admin.updateOrganisationStatus({...input(),version:1}),code('conflict'));
 assert.throws(()=>f.admin.updateOrganisationStatus({...input(),confirmation:'wrong'}),code('invalid-input'));
 const before=Object.fromEntries(['users','platform_memberships','platform_app_assignments','platform_app_licences','platform_organisation_invitations','records','files'].map(table=>[table,f.db.prepare(`SELECT * FROM ${table}`).all()]));
 const result=f.admin.updateOrganisationStatus(input());assert.equal(result.status,'Suspended');
 assert.throws(()=>f.admin.overview({actorUserId:'master',organisationId:f.orgId}),code('forbidden'));
 f.admin.updateOrganisationStatus({...input(),status:'Active'});
 for(const [table,rows]of Object.entries(before))assert.deepEqual(f.db.prepare(`SELECT * FROM ${table}`).all(),rows,table);
 const events=f.db.prepare("SELECT actorUserId,details FROM platform_organisation_audit WHERE action='OrganisationStatusUpdated'").all();
 assert.equal(events.length,2);assert.equal(events[0].actorUserId,'super');assert.equal(JSON.parse(events[0].details).after,'Suspended');
 assert.equal(f.admin.overview({actorUserId:'master',organisationId:f.orgId}).organisation.status,'Active');
});

test('lifecycle rejects no-op, unsupported states and failed audit atomically',async t=>{
 const f=await fixture(t),name=f.db.prepare('SELECT name FROM platform_organisations WHERE id=?').get(f.orgId).name;
 const input=()=>f.input({actorUserId:'super',status:'Suspended',confirmation:name});
 for(const status of ['Active','Closed','Draft','PendingActivation'])assert.throws(()=>f.admin.updateOrganisationStatus({...input(),status}),code('invalid-state'));
 for(const status of ['Closed','Draft','PendingActivation']){
  f.db.prepare('UPDATE platform_organisations SET status=? WHERE id=?').run(status,f.orgId);
  assert.throws(()=>f.admin.updateOrganisationStatus({...input(),status:'Active'}),code('invalid-state'));
 }
 f.db.prepare("UPDATE platform_organisations SET status='Active' WHERE id=?").run(f.orgId);
 assert.throws(()=>f.admin.updateOrganisationStatus({...input(),reason:''}),code('invalid-input'));
 const version=input().version;
 f.db.exec("CREATE TRIGGER fail_status BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='OrganisationStatusUpdated' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
 assert.throws(()=>f.admin.updateOrganisationStatus(input()),/fixture failure/);
 const row=f.db.prepare('SELECT status,version FROM platform_organisations WHERE id=?').get(f.orgId);assert.equal(row.status,'Active');assert.equal(row.version,version);
});
const epoch=Date.parse('2026-10-17T00:00:00.000Z');
async function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'org-administration-'));
  const store=new Store(root,{provider:'sqlite'}),filename=path.join(root,'chambers.sqlite'),db=new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON');
  t.after(()=>{db.close();store.sql.close();fs.rmSync(root,{recursive:true,force:true});});
  for(const id of ['super','master','staff','second','client','outsider'])db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,id,`${id}@example.com`,id==='super'?'Owner':'Clerk','preserved-password-hash');
  const [repoModule,adminModule]=await modules;repoModule.migrateOrganisationSchema(db);
  let now=epoch;const repo=new repoModule.OrganisationRepository(db,{clock:()=>now}),admin=new adminModule.OrganisationAdministration(repo);
  repo.bootstrapSuperAdmin({userId:'super'});
  const provision=masterAdminUserId=>repo.provision({actorUserId:'super',name:masterAdminUserId+' org',type:'Legal',masterAdminUserId,staffLimit:4,clientLimit:2,
    licences:[{appId:'advocate',status:'Active',startsAt:'2026-01-01T00:00:00.000Z',endsAt:'2027-01-01T00:00:00.000Z',readOnlyUntil:'2027-01-08T00:00:00.000Z',staffLimit:2,clientLimit:0}]});
  const a=provision('master'),b=provision('outsider');
  repo.acceptInvitation({actorUserId:'master',token:a.invitation.token});repo.acceptInvitation({actorUserId:'outsider',token:b.invitation.token});
  const orgId=a.organisationId;
  function input(patch={}){return {actorUserId:'master',organisationId:orgId,version:db.prepare('SELECT version FROM platform_organisations WHERE id=?').get(orgId).version,reason:'Test requested change',...patch};}
  function invite(userId,role='Staff'){return admin.inviteMember(input({userId,role}));}
  function join(userId,role='Staff'){const inviteResult=invite(userId,role);admin.acceptMemberInvitation({actorUserId:userId,token:inviteResult.invitation.token});return inviteResult;}
  function licence(patch={}){const row=db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(orgId);return input({actorUserId:'super',appId:'advocate',status:row.status,startsAt:row.startsAt,endsAt:row.endsAt,readOnlyUntil:row.readOnlyUntil,staffLimit:row.staffLimit,clientLimit:row.clientLimit,licenceVersion:row.version,...patch});}
  return {db,store,filename,repo,admin,orgId,otherOrgId:b.organisationId,input,join,invite,licence,setNow:value=>{now=value;},repoModule,adminModule};
}

test('Master Admin overview is scoped and excludes credentials and invitation hashes',async t=>{
  const f=await fixture(t);f.invite('staff');
  const view=f.admin.overview({actorUserId:'master',organisationId:f.orgId});
  assert.equal(view.usage.members.staff,2);assert.equal(view.members.length,2);
  const encoded=JSON.stringify(view);assert.equal(encoded.includes('preserved-password-hash'),false);assert.equal(encoded.includes('tokenHash'),false);
  assert.throws(()=>f.admin.overview({actorUserId:'master',organisationId:f.otherOrgId}),code('forbidden'));
  assert.throws(()=>f.admin.overview({actorUserId:'outsider',organisationId:f.orgId}),code('forbidden'));
});

test('new member invitation reserves the right pool, rotates secrets and activates without any app grants',async t=>{
 const f=await fixture(t),invite=role=>f.admin.inviteNewMember(f.input({email:' NEW@example.com ',role}));
 const first=invite('Client'),user=f.db.prepare("SELECT * FROM users WHERE email='new@example.com'").get();
 assert.equal(user.active,0);assert.equal(user.role,'Clerk');assert.equal(f.admin.usage(f.orgId).members.client,1);
 const second=invite('Client');assert.equal(f.admin.usage(f.orgId).members.client,1);
 assert.throws(()=>f.admin.activateNewMember(recipient(first.invitation.token)),code('invalid-invitation'));
 assert.throws(()=>f.admin.activateNewMember({...recipient(second.invitation.token),email:'other@example.com'}),code('invalid-invitation'));
 f.admin.activateNewMember(recipient(second.invitation.token));
 assert.equal(f.db.prepare('SELECT active FROM users WHERE id=?').get(user.id).active,1);
 assert.equal(f.admin.member(f.orgId,user.id).role,'Client');assert.equal(f.admin.member(f.orgId,user.id).status,'Active');
 for(const table of ['app_access','platform_app_assignments','platform_super_admins'])assert.equal(f.db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE userId=?`).get(user.id).n,0);
 assert.throws(()=>f.admin.activateNewMember(recipient(second.invitation.token)),code('invalid-invitation'));
 assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('pending identities can receive separate org invitations; activation never consumes or resets another invitation',async t=>{
 const f=await fixture(t),first=f.admin.inviteNewMember(f.input({email:'new@example.com',role:'Staff'}));
 const other=()=>f.input({actorUserId:'outsider',organisationId:f.otherOrgId,version:f.db.prepare('SELECT version FROM platform_organisations WHERE id=?').get(f.otherOrgId).version,email:'new@example.com',role:'Client'});
 const second=f.admin.inviteNewMember(other());
 const user=f.db.prepare("SELECT id FROM users WHERE email='new@example.com'").get();
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM users WHERE email=?').get('new@example.com').n,1);
 f.admin.activateNewMember(recipient(first.invitation.token));
 const credential=f.db.prepare('SELECT password FROM users WHERE id=?').get(user.id).password;
 assert.equal(f.admin.member(f.otherOrgId,user.id).status,'Invited');
 assert.throws(()=>f.admin.activateNewMember({...recipient(second.invitation.token),password:'Another password to reset!'}),code('invalid-invitation'));
 f.admin.acceptMemberInvitation({actorUserId:user.id,token:second.invitation.token});
 assert.equal(f.db.prepare('SELECT password FROM users WHERE id=?').get(user.id).password,credential);
 assert.equal(f.admin.member(f.otherOrgId,user.id).status,'Active');
});

test('revoking one pending identity membership releases its seat without disabling another invitation',async t=>{
 const f=await fixture(t),first=f.admin.inviteNewMember(f.input({email:'new@example.com',role:'Staff'}));
 const user=f.db.prepare("SELECT id FROM users WHERE email='new@example.com'").get();
 const second=f.admin.inviteNewMember(f.input({actorUserId:'outsider',organisationId:f.otherOrgId,version:2,email:'new@example.com',role:'Client'}));
 f.admin.revokeMemberInvitation(f.input({userId:user.id}));
 assert.equal(f.admin.usage(f.orgId).members.staff,1);
 assert.throws(()=>f.admin.activateNewMember(recipient(first.invitation.token)),code('invalid-invitation'));
 f.admin.activateNewMember(recipient(second.invitation.token));
 assert.equal(f.admin.member(f.orgId,user.id).status,'Inactive');
});

test('new identities cannot bypass authority, disabled accounts, capacity or optimistic revisions',async t=>{
 const f=await fixture(t),call=patch=>f.admin.inviteNewMember(f.input({email:'new@example.com',role:'Staff',...patch}));
 assert.throws(()=>call({actorUserId:'staff'}),code('forbidden'));
 assert.throws(()=>call({organisationId:f.otherOrgId}),code('forbidden'));
 assert.throws(()=>call({version:1}),code('conflict'));
 f.db.prepare("UPDATE users SET active=0 WHERE id='staff'").run();
 assert.throws(()=>call({email:'staff@example.com'}),code('invalid-user'));
 assert.throws(()=>call({email:'master@example.com'}),code('invalid-user'));
 f.db.prepare('UPDATE platform_organisations SET staffLimit=1 WHERE id=?').run(f.orgId);
 const before=f.db.prepare('SELECT COUNT(*) n FROM users').get().n;
 assert.throws(()=>call({}),code('seat-limit-reached'));
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM users').get().n,before);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM platform_pending_identities').get().n,0);
});

test('new member expiry, suspended org and failed audit leave identity and membership activation atomic',async t=>{
 const f=await fixture(t),invite=f.admin.inviteNewMember(f.input({email:'new@example.com',role:'Administrator'}));
 f.setNow(invite.invitation.expiresAt);assert.throws(()=>f.admin.activateNewMember(recipient(invite.invitation.token)),code('invalid-invitation'));
 f.setNow(epoch);f.db.prepare("UPDATE platform_organisations SET status='Suspended' WHERE id=?").run(f.orgId);
 assert.throws(()=>f.admin.activateNewMember(recipient(invite.invitation.token)),code('invalid-invitation'));
 f.db.prepare("UPDATE platform_organisations SET status='Active' WHERE id=?").run(f.orgId);
 f.db.exec("CREATE TRIGGER fail_identity BEFORE INSERT ON platform_organisation_audit WHEN NEW.action='InvitationIdentityActivated' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");
 assert.throws(()=>f.admin.activateNewMember(recipient(invite.invitation.token)),/fixture failure/);
 const user=f.db.prepare("SELECT * FROM users WHERE email='new@example.com'").get();assert.equal(user.active,0);
 assert.equal(f.admin.member(f.orgId,user.id).status,'Invited');
 assert.equal(f.db.prepare('SELECT activatedAt FROM platform_pending_identities WHERE userId=?').get(user.id).activatedAt,null);
 assert.equal(f.db.prepare('SELECT consumedAt FROM platform_organisation_invitations WHERE userId=?').get(user.id).consumedAt,null);
});

test('new invitation revisions prevent competing connections overbooking the last staff seat',async t=>{
 const f=await fixture(t);f.db.prepare('UPDATE platform_organisations SET staffLimit=2 WHERE id=?').run(f.orgId);
 const secondDb=new DatabaseSync(f.filename);secondDb.exec('PRAGMA foreign_keys=ON');
 try{
  const second=new f.adminModule.OrganisationAdministration(new f.repoModule.OrganisationRepository(secondDb,{clock:()=>epoch}));
  const request=f.input({email:'first-new@example.com',role:'Staff'});
  f.admin.inviteNewMember(request);
  assert.throws(()=>second.inviteNewMember({...request,email:'loser@example.com'}),code('conflict'));
  assert.throws(()=>second.inviteNewMember({...request,email:'loser@example.com',version:request.version+1}),code('seat-limit-reached'));
  assert.equal(f.db.prepare("SELECT id FROM users WHERE email='loser@example.com'").get(),undefined);
  assert.equal(f.admin.usage(f.orgId).members.staff,2);
 }finally{secondDb.close();}
});

test('new pending membership pool conversion and revoke/reissue retain exactly one reservation',async t=>{
 const f=await fixture(t),invite=role=>f.admin.inviteNewMember(f.input({email:'new@example.com',role}));
 const first=invite('Staff');assert.deepEqual(f.admin.usage(f.orgId).members,{staff:2,client:0});
 f.setNow(first.invitation.expiresAt);assert.deepEqual(f.admin.usage(f.orgId).members,{staff:2,client:0});
 const second=invite('Client');assert.deepEqual(f.admin.usage(f.orgId).members,{staff:1,client:1});
 const user=f.db.prepare("SELECT id FROM users WHERE email='new@example.com'").get();
 f.admin.revokeMemberInvitation(f.input({userId:user.id}));assert.deepEqual(f.admin.usage(f.orgId).members,{staff:1,client:0});
 assert.throws(()=>f.admin.activateNewMember(recipient(second.invitation.token)),code('invalid-invitation'));
 const third=invite('Staff');f.admin.activateNewMember(recipient(third.invitation.token));
 assert.deepEqual(f.admin.usage(f.orgId).members,{staff:2,client:0});
});
test('staff invitations reserve seats, rotate secrets, enforce identity and accept once',async t=>{
  const f=await fixture(t),first=f.invite('staff'),next=f.invite('staff');
  assert.equal(f.admin.usage(f.orgId).members.staff,2);
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:first.invitation.token}),code('invalid-invitation'));
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'second',token:next.invitation.token}),code('invalid-invitation'));
  f.admin.acceptMemberInvitation({actorUserId:'staff',token:next.invitation.token});
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:next.invitation.token}),code('invalid-invitation'));
  assert.equal(f.admin.usage(f.orgId).members.staff,2);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM platform_app_assignments WHERE organisationId=?").get(f.orgId).n,0);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM platform_organisation_audit').all()).includes(next.invitation.token),false);
});
test('expired invitations can be revoked to release reserved capacity',async t=>{
  const f=await fixture(t),inv=f.invite('staff');
  f.setNow(inv.invitation.expiresAt);
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:inv.invitation.token}),code('invalid-invitation'));
  assert.equal(f.admin.usage(f.orgId).members.staff,2);
  f.admin.revokeMemberInvitation(f.input({userId:'staff'}));
  assert.equal(f.admin.usage(f.orgId).members.staff,1);
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:inv.invitation.token}),code('invalid-invitation'));
});
test('only Super Admin transfers primary authority, preserving app roles and unrelated orgs',async t=>{
  const f=await fixture(t);f.join('staff');
  const transfer=f.input({userId:'staff',previousMasterRole:'Staff'});
  assert.throws(()=>f.admin.transferMasterAdmin(transfer),code('forbidden'));
  assert.throws(()=>f.admin.transferMasterAdmin({...transfer,actorUserId:'super',userId:'outsider'}),code('invalid-member'));
  const before=f.db.prepare('SELECT role FROM users WHERE id=?').get('staff');
  f.admin.transferMasterAdmin({...transfer,actorUserId:'super'});
  assert.equal(f.repo.organisation({actorUserId:'staff',organisationId:f.orgId}).masterAdminUserId,'staff');
  assert.throws(()=>f.repo.organisation({actorUserId:'master',organisationId:f.orgId}),code('forbidden'));
  assert.deepEqual(f.db.prepare('SELECT role FROM users WHERE id=?').get('staff'),before);
  assert.equal(f.repo.organisation({actorUserId:'outsider',organisationId:f.otherOrgId}).masterAdminUserId,'outsider');
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM platform_memberships WHERE organisationId=? AND role='MasterAdmin'").get(f.orgId).n,1);
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('primary Master Admin cannot be deactivated through membership controls',async t=>{
  const f=await fixture(t);
  assert.throws(()=>f.admin.updateMember(f.input({userId:'master',role:'Staff',status:'Inactive'})),code('invalid-member'));
  assert.throws(()=>f.admin.inviteMember(f.input({userId:'master',role:'Staff'})),code('invalid-member'));
  assert.throws(()=>f.admin.revokeMemberInvitation(f.input({userId:'master'})),code('invalid-member'));
});
test('licence creation, renewal, suspension and revocation require Super Admin and revisions',async t=>{
  const f=await fixture(t);
  assert.throws(()=>f.admin.updateLicence(f.licence({actorUserId:'master'})),code('forbidden'));
  const stale=f.licence();
  f.admin.updateLicence(f.licence({status:'Suspended'}));
  assert.throws(()=>f.admin.updateLicence(stale),code('conflict'));
  f.join('staff');assert.throws(()=>f.admin.assignChambers(f.input({userId:'staff',role:'Clerk',status:'Active'})),code('invalid-licence'));
  f.admin.updateLicence(f.licence({status:'Active',endsAt:'2028-01-01T00:00:00.000Z',readOnlyUntil:null}));
  f.admin.assignChambers(f.input({userId:'staff',role:'Clerk',status:'Active'}));
  f.admin.updateLicence(f.licence({status:'Revoked'}));
  assert.equal(f.admin.usage(f.orgId).apps.advocate.staff,1);
  f.admin.updateLicence(f.licence({status:'Active'}));
  f.admin.updateLicence(f.licence({appId:'batchfee-lite',licenceVersion:0}));
  assert.equal(f.repo.organisation({actorUserId:'master',organisationId:f.orgId}).licences.length,2);
});
test('licence validation rejects planned/public apps, malformed dates and undersized capacity',async t=>{
  const f=await fixture(t);f.join('staff');f.admin.assignChambers(f.input({userId:'staff',role:'Advocate',status:'Active'}));
  for(const patch of [{appId:'projects'},{appId:'qr-maker'},{startsAt:'2026-02-30T00:00:00.000Z'},{endsAt:null,readOnlyUntil:'2028-01-01T00:00:00.000Z'},
    {status:'Expired'},{staffLimit:-1},{clientLimit:1.5},{status:'invented'}])assert.throws(()=>f.admin.updateLicence(f.licence(patch)));
  assert.throws(()=>f.admin.updateLicence(f.licence({staffLimit:0})),code('seat-limit-reached'));
  f.admin.assignChambers(f.input({userId:'staff',role:'Advocate',status:'Inactive'}));
  f.admin.updateLicence(f.licence({staffLimit:0}));
});
test('organisation staff/client limits count reservations separately and block unsafe reductions',async t=>{
  const f=await fixture(t);f.invite('staff');f.invite('client','Client');
  assert.deepEqual(f.admin.usage(f.orgId).members,{staff:2,client:1});
  assert.throws(()=>f.admin.updateOrganisationLimits(f.input({staffLimit:4,clientLimit:2})),code('forbidden'));
  assert.throws(()=>f.admin.updateOrganisationLimits(f.input({actorUserId:'super',staffLimit:1,clientLimit:2})),code('seat-limit-reached'));
  f.admin.updateOrganisationLimits(f.input({actorUserId:'super',staffLimit:2,clientLimit:1}));
  assert.throws(()=>f.invite('second'),code('seat-limit-reached'));
  assert.throws(()=>f.invite('second','Client'),code('seat-limit-reached'));
});
test('deactivation revokes scoped assignments; reactivation needs invitation and explicit assignment',async t=>{
  const f=await fixture(t);f.join('staff');
  f.admin.assignChambers(f.input({userId:'staff',role:'Clerk',status:'Active'}));
  const other=f.admin.inviteMember(f.input({actorUserId:'outsider',organisationId:f.otherOrgId,version:f.db.prepare('SELECT version FROM platform_organisations WHERE id=?').get(f.otherOrgId).version,userId:'staff',role:'Staff'}));
  f.admin.acceptMemberInvitation({actorUserId:'staff',token:other.invitation.token});
  f.admin.updateMember(f.input({userId:'staff',role:'Staff',status:'Inactive'}));
  assert.equal(f.db.prepare('SELECT active FROM users WHERE id=?').get('staff').active,1);
  assert.equal(f.db.prepare('SELECT status FROM platform_memberships WHERE organisationId=? AND userId=?').get(f.otherOrgId,'staff').status,'Active');
  assert.equal(f.admin.usage(f.orgId).apps.advocate,undefined);
  assert.throws(()=>f.admin.updateMember(f.input({userId:'staff',role:'Staff',status:'Active'})),code('invitation-required'));
  f.join('staff');
  assert.equal(f.db.prepare('SELECT status FROM platform_app_assignments WHERE organisationId=? AND userId=?').get(f.orgId,'staff').status,'Inactive');
});
test('clients and unlicensed users cannot receive staff Chambers assignments',async t=>{
  const f=await fixture(t);f.join('client','Client');
  assert.throws(()=>f.admin.assignChambers(f.input({userId:'client',role:'Clerk',status:'Active'})),code('invalid-member'));
  f.join('staff');
  assert.throws(()=>f.admin.updateMember(f.input({userId:'staff',role:'Client',status:'Active'})),code('invitation-required'));
  assert.throws(()=>f.admin.assignChambers(f.input({userId:'outsider',role:'Clerk',status:'Active'})),code('invalid-input'));
});
test('audit failure rolls back licence changes, member invitations and Master Admin transfer',async t=>{
  const f=await fixture(t);f.join('staff');
  const version=f.input().version;
  f.db.exec("CREATE TRIGGER reject_admin_audit BEFORE INSERT ON platform_organisation_audit WHEN NEW.action IN ('LicenceUpdated','MemberInvited','MasterAdminTransferred') BEGIN SELECT RAISE(ABORT,'audit failed'); END");
  assert.throws(()=>f.admin.updateLicence(f.licence({status:'Suspended'})),/audit failed/);
  assert.equal(f.licence().status,'Active');
  assert.throws(()=>f.invite('second'),/audit failed/);
  assert.equal(f.db.prepare('SELECT status FROM platform_memberships WHERE organisationId=? AND userId=?').get(f.orgId,'second'),undefined);
  assert.throws(()=>f.admin.transferMasterAdmin(f.input({actorUserId:'super',userId:'staff',previousMasterRole:'Staff'})),/audit failed/);
  assert.equal(f.input().version,version);
  assert.equal(f.repo.organisation({actorUserId:'master',organisationId:f.orgId}).masterAdminUserId,'master');
  assert.deepEqual(f.db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('stale competing assignments cannot overbook the final app seat across connections',async t=>{
  const f=await fixture(t);f.join('staff');f.join('second');f.admin.updateLicence(f.licence({staffLimit:1}));
  const stale=f.input();
  const db2=new DatabaseSync(f.filename);db2.exec('PRAGMA foreign_keys=ON');
  try{
    const secondAdmin=new f.adminModule.OrganisationAdministration(new f.repoModule.OrganisationRepository(db2,{clock:()=>epoch}));
    f.admin.assignChambers({...stale,userId:'staff',role:'Clerk',status:'Active'});
    assert.throws(()=>secondAdmin.assignChambers({...stale,userId:'second',role:'Clerk',status:'Active'}),code('conflict'));
    assert.throws(()=>secondAdmin.assignChambers(f.input({userId:'second',role:'Clerk',status:'Active'})),code('seat-limit-reached'));
    assert.equal(f.admin.usage(f.orgId).apps.advocate.staff,1);
  }finally{db2.close();}
});
test('administration state survives full SQL recovery with global accounts untouched',async t=>{
  const f=await fixture(t),original=f.db.prepare('SELECT * FROM users ORDER BY id').all();f.join('staff');
  f.admin.assignChambers(f.input({userId:'staff',role:'Advocate',status:'Active'}));
  f.admin.transferMasterAdmin(f.input({actorUserId:'super',userId:'staff',previousMasterRole:'Staff'}));
  const restored=new DatabaseSync(':memory:');
  try{
    restored.exec(f.store.exportSql());
    assert.deepEqual(restored.prepare('SELECT * FROM users ORDER BY id').all(),original);
    const service=new f.adminModule.OrganisationAdministration(new f.repoModule.OrganisationRepository(restored));
    assert.equal(service.overview({actorUserId:'staff',organisationId:f.orgId}).usage.apps.advocate.staff,1);
    assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
    assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
  }finally{restored.close();}
});
test('expired licences block new assignments through grace; Super Admin renewal restores eligibility',async t=>{
  const f=await fixture(t);f.join('staff');
  f.setNow(Date.parse('2027-01-02T00:00:00.000Z'));
  assert.throws(()=>f.admin.assignChambers(f.input({userId:'staff',role:'Clerk',status:'Active'})),code('invalid-licence'));
  f.admin.updateLicence(f.licence({status:'Expired'}));
  f.admin.updateLicence(f.licence({status:'Active',endsAt:'2028-01-01T00:00:00.000Z',readOnlyUntil:null}));
  f.admin.assignChambers(f.input({userId:'staff',role:'Clerk',status:'Active'}));
  assert.equal(f.admin.usage(f.orgId).apps.advocate.staff,1);
});
test('current authority and account identity are rechecked, and missing change reasons roll back',async t=>{
  const f=await fixture(t),inv=f.invite('staff');
  f.db.prepare('UPDATE users SET email=? WHERE id=?').run('different@example.com','staff');
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:inv.invitation.token}),code('invalid-invitation'));
  f.db.prepare('UPDATE users SET email=? WHERE id=?').run('staff@example.com','staff');
  f.db.prepare('UPDATE users SET active=0 WHERE id=?').run('staff');
  assert.throws(()=>f.admin.acceptMemberInvitation({actorUserId:'staff',token:inv.invitation.token}),code('invalid-invitation'));
  f.db.prepare('UPDATE users SET active=1 WHERE id=?').run('staff');
  f.admin.acceptMemberInvitation({actorUserId:'staff',token:inv.invitation.token});
  const version=f.input().version;
  assert.throws(()=>f.admin.updateMember(f.input({userId:'staff',role:'Staff',status:'Inactive',reason:' '})),code('invalid-input'));
  assert.equal(f.input().version,version);assert.equal(f.admin.member(f.orgId,'staff').status,'Active');
  f.db.prepare('UPDATE platform_super_admins SET active=0 WHERE userId=?').run('super');
  assert.throws(()=>f.admin.updateLicence(f.licence()),code('forbidden'));
  f.db.prepare("UPDATE platform_organisations SET status='Suspended' WHERE id=?").run(f.orgId);
  assert.throws(()=>f.admin.inviteMember(f.input({userId:'second',role:'Staff'})),code('forbidden'));
});
