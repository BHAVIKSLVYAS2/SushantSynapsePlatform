const {test}=require('node:test');
const assert=require('node:assert/strict');
const {startPreview}=require('./organisation-preview-fixture.cjs');
const provision=email=>({newAccount:true,name:'New identity Chambers',type:'Legal',timezone:'Asia/Kolkata',masterAdminEmail:email,staffLimit:2,clientLimit:0,licences:[{appId:'advocate',status:'Active',startsAt:'2026-10-01T00:00:00.000Z',endsAt:null,readOnlyUntil:null,staffLimit:2,clientLimit:0}]});
test('guarded new-primary API activates only invited identities and permits normal sign-in without app access',async t=>{
 const f=await startPreview();t.after(f.stop);
 const post=(path,body,cookie='',headers={})=>fetch(f.base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,...headers},body:JSON.stringify(body)});
 const superCookie=await f.login('super'),master=await f.login('master');
 assert.equal((await post('organisation-admin/provision',provision('new@example.com'),master)).status,403);
 assert.equal((await post('organisation-admin/provision',provision('master@example.com'),superCookie)).status,400);
 const response=await post('organisation-admin/provision',provision('new@example.com'),superCookie);assert.equal(response.status,201);
 const created=await response.json(),body={token:created.invitation.token,email:'new@example.com',name:'New Master',password:'Recipient chosen password 2026!'};
 const route='organisation-admin/activate-new-master';
 assert.equal((await post(route,body,superCookie)).status,409);
 assert.equal((await post(route,body,'',{Origin:'https://other.invalid'})).status,403);
 const invalid=await post(route,{...body,email:'wrong@example.com'});assert.equal(invalid.status,400);assert.equal((await invalid.json()).code,'invalid-invitation');
 assert.equal((await post('auth/login',{email:body.email,password:body.password})).status,401);
 assert.equal((await post(route,body)).status,200);
 assert.equal((await post(route,body)).status,400);
 const login=await post('auth/login',{email:body.email,password:body.password});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const overview=await fetch(f.base+'/api/organisation-admin/organisations/'+created.organisationId,{headers:{Cookie:cookie}});assert.equal(overview.status,200);
 const view=await overview.json();assert.equal(view.organisation.status,'Active');assert.equal(view.members[0].role,'MasterAdmin');assert.deepEqual(view.assignments,[]);
 assert.equal((await fetch(f.base+'/api/chambers/'+created.organisationId+'/state',{headers:{Cookie:cookie}})).status,403);
 assert.equal((await fetch(f.base+'/api/organisation-admin/organisations/'+f.organisationId,{headers:{Cookie:cookie}})).status,403);
});
test('activation has bounded request size and global attempt rate; default runtime exposes no endpoint',async t=>{
 const f=await startPreview();t.after(f.stop);
 const url=f.base+'/api/organisation-admin/activate-new-master';
 const post=body=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await post({token:'x'.repeat(5000)})).status,413);
 for(let i=0;i<19;i++)assert.equal((await post({token:'bad'})).status,400);
 assert.equal((await fetch(f.base+'/api/organisation-admin/activate-new-member',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"token":"bad"}'})).status,429);
 const normal=await startPreview({enabled:false});t.after(normal.stop);
 assert.equal((await fetch(normal.base+'/api/organisation-admin/activate-new-master',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,404);
 assert.equal((await fetch(normal.base+'/api/organisation-admin/activate-new-member',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,404);
});

test('new staff/client API activation preserves separate pools and requires explicit staff app assignment',async t=>{
 const f=await startPreview({chambers:true});t.after(f.stop);const master=await f.login('master');
 const post=(path,body,cookie='')=>fetch(f.base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 const base='organisation-admin/organisations/'+f.organisationId;
 const overview=async()=>await(await fetch(f.base+'/api/'+base,{headers:{Cookie:master}})).json();
 for(const role of ['Staff','Client']){
  const email=role.toLowerCase()+'-new@example.com',v=await overview();
  const invite=await post(base+'/invite',{email,role,newAccount:true,version:v.organisation.version,reason:'New member onboarding'},master);
  assert.equal(invite.status,201);const result=await invite.json();
  const body={token:result.invitation.token,email,name:'New '+role,password:'Recipient selected password 2026!'};
  assert.equal((await post('organisation-admin/activate-new-member',body,master)).status,409);
  assert.equal((await post('organisation-admin/activate-new-member',body)).status,200);
  assert.equal((await post('organisation-admin/activate-new-member',body)).status,400);
  const login=await post('auth/login',{email,password:body.password});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  let view=await overview();const member=view.members.find(m=>m.email===email);assert.equal(member.status,'Active');assert.equal(member.role,role);
  assert.equal(view.assignments.some(a=>a.userId===member.userId),false);
  assert.equal((await fetch(f.base+'/api/chambers/'+f.organisationId+'/state',{headers:{Cookie:cookie}})).status,403);
  const assignment=await post(base+'/assignment',{userId:member.userId,role:'Clerk',status:'Active',version:view.organisation.version,reason:'Explicit staff app access'},master);
  assert.equal(assignment.status,role==='Staff'?200:400);
  if(role==='Staff')assert.equal((await fetch(f.base+'/api/chambers/'+f.organisationId+'/state',{headers:{Cookie:cookie}})).status,200);
 }
});
