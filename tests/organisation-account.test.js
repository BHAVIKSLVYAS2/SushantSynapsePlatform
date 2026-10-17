const {test}=require('node:test');
const assert=require('node:assert/strict');
const {startPreview}=require('./organisation-preview-fixture.cjs');
test('account lists only own memberships and derives app/admin destinations from current authority',async t=>{
 const f=await startPreview({chambers:true,multi:true});t.after(f.stop);
 const get=async cookie=>fetch(f.base+'/api/organisation-admin/account',{headers:{Cookie:cookie}});
 assert.equal((await get('')).status,401);
 const master=await(await get(await f.login('master'))).json();
 assert.equal(master.memberships.length,2);assert.equal(master.memberships.filter(m=>m.administration).length,1);
 assert.equal(master.memberships.filter(m=>m.apps[0].available).length,2);
 const member=await(await get(await f.login('member'))).json();assert.equal(member.memberships.length,1);assert.equal(member.memberships[0].administration,false);
 const superAccount=await(await get(await f.login('super'))).json();assert.equal(superAccount.superAdmin,true);assert.deepEqual(superAccount.memberships,[]);
 for(const secret of ['password','tokenHash','masterAdminUserId','staffLimit'])assert.equal(JSON.stringify(master).includes(secret),false);
});
test('client and unassigned memberships never produce staff access and revocation updates account destinations',async t=>{
 const f=await startPreview({chambers:true});t.after(f.stop);const master=await f.login('master'),client=await f.login('client');
 const base=f.base+'/api/organisation-admin',org=base+'/organisations/'+f.organisationId;
 const headers={Cookie:master,'Content-Type':'application/json'};
 const view=async()=>await(await fetch(org,{headers})).json();
 let v=await view();const invite=await(await fetch(org+'/invite',{method:'POST',headers,body:JSON.stringify({email:'client@example.com',role:'Client',version:v.organisation.version,reason:'Client account navigation'})})).json();
 assert.equal((await fetch(base+'/accept',{method:'POST',headers:{Cookie:client,'Content-Type':'application/json'},body:JSON.stringify({primary:false,token:invite.invitation.token})})).status,200);
 const clientView=await(await fetch(base+'/account',{headers:{Cookie:client}})).json();assert.equal(clientView.memberships[0].clientPortal,'Unavailable');assert.equal(clientView.memberships[0].apps[0].available,false);assert.equal(clientView.memberships[0].administration,false);
 v=await view();assert.equal((await fetch(org+'/assignment',{method:'POST',headers,body:JSON.stringify({userId:'member',role:'Clerk',status:'Inactive',version:v.organisation.version,reason:'Revoke assigned access'})})).status,200);
 const member=await(await fetch(base+'/account',{headers:{Cookie:await f.login('member')}})).json();assert.equal(member.memberships[0].apps[0].available,false);assert.equal(member.memberships[0].membershipStatus,'Active');
});
