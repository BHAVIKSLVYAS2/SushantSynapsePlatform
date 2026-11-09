const {test}=require('node:test'),assert=require('node:assert/strict');

test('shared assignment vocabulary preserves every app role and rejects cross-app or unknown values',async()=>{
 const {assignmentAppIds,assignmentRoles,isAssignmentRole,isMembershipAppRole}=await import('../packages/auth/app-roles.mjs');
 const expected={advocate:['Clerk','Advocate','Owner'],'tournament-lite':['Advocate','Owner'],'batchfee-lite':['Viewer','Collector','Manager','Owner'],'digital-samaj':['Member','Owner'],'pandit-booking':['Customer','Pandit','Dispatcher','Reviewer','Owner']};
 assert.deepEqual(assignmentAppIds,Object.keys(expected));
 for(const [appId,roles] of Object.entries(expected)){
  assert.deepEqual(assignmentRoles(appId).map(role=>role.id),roles);
  for(const role of roles){
   assert.equal(isAssignmentRole(appId,role),true);
   for(const membership of ['MasterAdmin','Administrator','Staff','Client'])assert.equal(isMembershipAppRole(appId,role,membership),role==='Customer'?membership==='Client':membership!=='Client');
  }
  assert.equal(isAssignmentRole(appId,'SuperAdmin'),false);
  for(const membership of [undefined,null,'Owner','SuperAdmin','Guest','toString'])assert.equal(isMembershipAppRole(appId,roles[0],membership),false);
  assert(Object.isFrozen(assignmentRoles(appId)));assert(assignmentRoles(appId).every(role=>Object.isFrozen(role)&&role.description));
 }
 for(const appId of ['unknown','__proto__','constructor','toString',undefined]){
  assert.deepEqual(assignmentRoles(appId),[]);assert.equal(isAssignmentRole(appId,'Owner'),false);assert.equal(isMembershipAppRole(appId,'Owner','Staff'),false);
 }
 assert.equal(isAssignmentRole('batchfee-lite','Customer'),false);
 assert.equal(isAssignmentRole('pandit-booking','Collector'),false);
 // Chambers client access is deliberately a separate entitlement workflow.
 assert.deepEqual(assignmentRoles('advocate','Client'),[]);
 assert.deepEqual(assignmentRoles('pandit-booking','Client').map(role=>role.id),['Customer']);
});
