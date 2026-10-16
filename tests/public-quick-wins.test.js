const test=require('node:test'),assert=require('node:assert/strict');
test('bill splitting conserves every paise for equal and individual shares',async()=>{
 const {split,paise}=await import('../apps/bill-splitter/frontend/engine.mjs');
 for(let amount=1;amount<1000;amount+=17)for(let count=2;count<=20;count++){
  const rows=Array.from({length:count},(_,i)=>({name:'Person '+i,paid:i===0?(amount/100).toFixed(2):'0'})),r=split(rows);
  assert.equal(r.people.reduce((s,p)=>s+p.share,0),amount);
  const balances=new Map(r.people.map(p=>[p.name,p.paid-p.share]));for(const t of r.transfers){assert(t.amount>0);balances.set(t.from,balances.get(t.from)+t.amount);balances.set(t.to,balances.get(t.to)-t.amount);}assert([...balances.values()].every(v=>v===0));
 }
 assert.equal(paise('9999999.99'),999999999);for(const bad of ['-1','1.001','1e3','NaN','99999999','1,000'])assert.throws(()=>paise(bad));
 assert.throws(()=>split([{name:'A',paid:'100',share:'20'},{name:'B',paid:'0',share:'70'}],'custom'));
 const custom=split([{name:'A',paid:'100',share:'20'},{name:'B',paid:'0',share:'80'}],'custom');assert.deepEqual(custom.transfers,[{from:'B',to:'A',amount:8000}]);
});
test('Focus backup merging preserves existing work and rejects malformed or conflicting tasks atomically',async()=>{
 const {validatePlan,mergeBackup}=await import('../apps/focus/frontend/backups.mjs');
 const task={id:'one',title:'Existing work',date:'2026-10-16',priority:'High',minutes:25,done:false,createdAt:'2026-10-16T00:00:00Z',order:0},current={revision:3,tasks:[task]},snapshot=JSON.stringify(current);
 const merged=mergeBackup(current,{format:'synapse-focus-v1',plan:{revision:0,tasks:[task,{...task,id:'two'}]}});assert.equal(merged.tasks.length,2);assert.equal(merged.revision,4);assert.equal(JSON.stringify(current),snapshot);
 assert.throws(()=>mergeBackup(current,{format:'synapse-focus-v1',plan:{revision:0,tasks:[{...task,title:'Conflicting edit'}]}}));assert.equal(JSON.stringify(current),snapshot);
 for(const patch of [{date:'2026-02-30'},{minutes:0},{priority:'urgent'},{done:'false'},{createdAt:'bad'}])assert.throws(()=>validatePlan({revision:0,tasks:[{...task,...patch}]}));
});
test('ritual custom state is bounded, per guide, and retains checks only by opt-in',async()=>{
 const {readState}=await import('../apps/ritual-assist/frontend/checklist-state.mjs');const guides=[{id:'puja',items:[{id:'water'}]}],entry={extras:[{id:'extra-one',label:'Family flowers'}],checked:['water','extra-one','unknown']};
 assert.deepEqual(readState(JSON.stringify({version:1,remember:false,guides:{puja:entry}}),guides).guides.puja.checked,[]);
 assert.deepEqual(readState(JSON.stringify({version:1,remember:true,guides:{puja:entry}}),guides).guides.puja.checked,['water','extra-one']);
 assert.throws(()=>readState(JSON.stringify({version:1,remember:true,guides:{puja:{...entry,extras:Array(41).fill(entry.extras[0])}}}),guides));assert.throws(()=>readState('{bad',guides));
});
