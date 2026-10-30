const {test}=require('node:test'),assert=require('node:assert/strict');

test('setup guidance uses only actual role-scoped progress and never invents completion',async()=>{
 const {setupSteps}=await import('../apps/pandit-booking/frontend/setup.mjs');
 const base={role:'Owner',userId:'owner',services:[],profiles:[],bookings:[]};
 assert.ok(setupSteps(base).every(step=>!step.done));
 assert.deepEqual(setupSteps({...base,role:'Visitor'}),[]);
 const customer=setupSteps({...base,role:'Customer'});
 assert.ok(customer.every(step=>!['manage','moderation','audit'].includes(step.tab)));
 const pandit={...base,role:'Pandit',userId:'pandit',services:[{active:true}],profiles:[{id:'pandit',status:'Pending',windows:[{start:'future',end:'future'}]}]};
 assert.equal(setupSteps(pandit).find(s=>s.label==='Wait for operator approval').done,false);
 assert.equal(setupSteps(pandit).find(s=>s.label==='Add available time slots').done,true);
 const approved={...pandit,profiles:[{...pandit.profiles[0],status:'Approved'}],bookings:[{status:'Confirmed'}]};
 assert.ok(setupSteps(approved).every(step=>step.done));
 assert.equal(setupSteps({...base,role:'Dispatcher'})[1].tab,null);
});
