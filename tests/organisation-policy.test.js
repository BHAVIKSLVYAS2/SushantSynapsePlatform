const {test}=require('node:test');
const assert=require('node:assert/strict');
const policy=import('../packages/auth/organisation-policy.mjs');
function context(){return {
  user:{id:'u1',active:true},organisation:{id:'org1',status:'Active',masterAdminUserId:'u1'},
  membership:{organisationId:'org1',userId:'u1',status:'Active',role:'MasterAdmin'},
  app:{id:'advocate',status:'Available'},
  licence:{organisationId:'org1',appId:'advocate',status:'Active',startsAt:'2026-10-01T00:00:00Z',endsAt:'2026-11-01T00:00:00Z',readOnlyUntil:'2026-11-08T00:00:00Z'},
  assignment:{organisationId:'org1',userId:'u1',appId:'advocate',status:'Active'},
  permissions:['advocate:read','advocate:write'],action:'read',now:Date.parse('2026-10-17T00:00:00Z')
};}
test('organisation access requires matching user, organisation, app and permission',async()=>{
  const {evaluateAppAccess:check}=await policy;
  assert.equal(check(context()).allowed,true);
  for(const [part,key,value] of [
    ['user','active',false],['user','active','false'],['organisation','status','Suspended'],['membership','organisationId','org2'],
    ['membership','userId','u2'],['membership','status','Invited'],['membership','role','Owner'],
    ['licence','organisationId','org2'],['licence','appId','batchfee-lite'],['licence','status','Suspended'],
    ['assignment','organisationId','org2'],['assignment','userId','u2'],['assignment','appId','batchfee-lite'],
    ['assignment','status','Revoked'],['app','status','Planned'],['app','public',true]
  ]){const c=context();c[part][key]=value;assert.equal(check(c).allowed,false,`${part}.${key}`);}
  for(const patch of [{permissions:[]},{action:'delete'},{now:NaN},{assignment:null},{licence:null},{membership:null}])assert.equal(check({...context(),...patch}).allowed,false);
});
test('licence windows and explicit read-only grace have exact boundaries',async()=>{
  const {evaluateAppAccess:check}=await policy,c=context();
  c.now=Date.parse(c.licence.startsAt)-1;assert.equal(check(c).allowed,false);
  c.now=Date.parse(c.licence.startsAt);assert.equal(check(c).allowed,true);
  c.now=Date.parse(c.licence.endsAt);assert.equal(check(c).mode,'read-only');
  c.action='write';assert.equal(check(c).reason,'licence-read-only');
  c.action='read';c.now=Date.parse(c.licence.readOnlyUntil);assert.equal(check(c).allowed,false);
  c.now=Date.parse('2026-10-17T00:00:00Z');c.licence.endsAt=null;assert.equal(check(c).allowed,true);
  c.licence.status='Expired';assert.equal(check(c).allowed,false);
  c.licence.status='Active';c.licence.startsAt='invalid';assert.equal(check(c).allowed,false);
  c.licence.startsAt='2026-02-30T00:00:00Z';assert.equal(check(c).allowed,false);
  c.licence.startsAt='2026-10-01T00:00:00Z';c.licence.endsAt=c.licence.startsAt;assert.equal(check(c).allowed,false);
  c.licence.endsAt='2026-11-01T00:00:00Z';c.now=Date.parse(c.licence.endsAt);
  c.licence.readOnlyUntil=null;assert.equal(check(c).allowed,false);
  c.licence.status='Revoked';assert.equal(check(c).allowed,false);
});
test('platform and organisation administrators have distinct authority',async()=>{
  const {canManageOrganisation:manage,canProvisionOrganisation:provision,evaluateAppAccess:access}=await policy,c=context();
  assert.equal(manage(c).scope,'organisation');assert.equal(provision(c).allowed,false);
  c.membership.role='Administrator';assert.equal(manage(c).allowed,false);
  c.platformRole={userId:'u1',role:'SuperAdmin',active:true};assert.equal(provision(c).allowed,true);assert.equal(manage(c).scope,'platform');
  c.assignment=null;assert.equal(access(c).allowed,false);
  c.platformRole.userId='u2';assert.equal(provision(c).allowed,false);
  c.membership.role='MasterAdmin';c.organisation.masterAdminUserId='u2';assert.equal(manage(c).allowed,false);
  c.user.active=false;assert.equal(manage(c).allowed,false);
});
test('staff and client seat admission rejects exhausted and invalid capacity',async()=>{
  const {evaluateSeatAdmission:check}=await policy;
  for(const memberType of ['Staff','Client']){
    assert.equal(check({memberType,limit:2,used:1}).allowed,true);
    assert.equal(check({memberType,limit:2,used:2}).reason,'seat-limit-reached');
    assert.equal(check({memberType,limit:2,used:3,alreadyCounted:true}).allowed,true);
    assert.equal(check({memberType,limit:null,used:100}).allowed,true);
    assert.equal(check({memberType,limit:0,used:0}).allowed,false);
  }
  for(const patch of [{used:-1},{used:1.5},{limit:-1},{limit:undefined},{memberType:'Owner'},{alreadyCounted:'yes'}])assert.equal(check({memberType:'Staff',used:0,limit:2,...patch}).allowed,false);
});
