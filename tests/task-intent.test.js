const {test}=require('node:test'),assert=require('node:assert/strict');
test('sign-in intent permits only known products and safe task hashes, discarding external URLs and scope',async()=>{
 const {taskIntent,accountIntentPath}=await import('../packages/ui/task-intent.mjs');
 assert.equal(accountIntentPath(new URL('https://example.test/signin?next=advocate&returnTo='+encodeURIComponent('/advocate?organisation=other#hearings'))),'/account?next=advocate&returnTo=%2Fadvocate%23hearings');
 for(const next of ['','unknown','super-admin','__proto__'])assert.equal(accountIntentPath('https://example.test/signin?next='+next),'/account');
 for(const target of ['https://evil.test/advocate#hearings','//evil.test/advocate','javascript:alert(1)','/super-admin#hearings','/advocate#<script>'])assert.equal(taskIntent('https://example.test/signin?next=advocate&returnTo='+encodeURIComponent(target)).hash,'');
});
test('task continuation requires live eligible membership and product access, with explicit multi-workspace choice',async()=>{
 const {taskIntent,taskDestinations}=await import('../packages/ui/task-intent.mjs'),intent=taskIntent('https://example.test/account?next=advocate&returnTo=%2Fadvocate%23hearings');
 const org={id:'own',name:'My workspace',status:'Active',membershipStatus:'Active',role:'Staff',apps:[{id:'advocate',available:true,mode:'read-only'}]};
 assert.deepEqual(taskDestinations({memberships:[org]},intent),[{name:org.name,path:'/advocate?organisation=own#hearings'}]);
 for(const changed of [{status:'Suspended'},{membershipStatus:'Inactive'},{apps:[{id:'advocate',available:false}]},{apps:[{id:'batchfee-lite',available:true}]}])assert.deepEqual(taskDestinations({memberships:[{...org,...changed}]},intent),[]);
 assert.equal(taskDestinations({memberships:[org,{...org,id:'two'}]},intent).length,2);
 const client={...org,role:'Client',clientPortal:'Available',apps:[{id:'advocate',available:false}]};assert.equal(taskDestinations({memberships:[client]},intent)[0].path,'/client-portal?organisation=own');assert.deepEqual(taskDestinations({memberships:[{...client,clientPortal:'Unavailable'}]},intent),[]);
});
