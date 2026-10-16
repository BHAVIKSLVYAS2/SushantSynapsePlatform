const test=require('node:test'),assert=require('node:assert/strict');
function conserved(r){assert.equal(r.people.reduce((s,p)=>s+p.share,0),r.total);const balances=new Map(r.people.map(p=>[p.name,p.paid-p.share]));for(const t of r.transfers){assert(t.amount>0);balances.set(t.from,balances.get(t.from)+t.amount);balances.set(t.to,balances.get(t.to)-t.amount);}assert([...balances.values()].every(n=>n===0));}
test('percentage and relative shares conserve paise, exclude zero shares and break ties predictably',async()=>{
 const {split}=await import('../apps/bill-splitter/frontend/engine.mjs');
 for(let amount=1;amount<=999;amount+=13){const rows=[{name:'A',paid:(amount/100).toFixed(2),share:'50'},{name:'B',paid:'0',share:'30'},{name:'C',paid:'0',share:'20'}];conserved(split(rows,'percentage'));conserved(split(rows.map((p,i)=>({...p,share:['2','1','0'][i]})),'shares'));assert.equal(split(rows.map((p,i)=>({...p,share:['2','1','0'][i]})),'shares').people[2].share,0);}
 assert.deepEqual(split([{name:'A',paid:'.01',share:'1'},{name:'B',paid:'0',share:'1'}].map(p=>({...p,paid:p.paid==='.01'?'0.01':p.paid})),'shares').people.map(p=>p.share),[1,0]);
 for(const shares of [['50','49.99'],['100.01','0'],['-1','101'],['50.001','49.999']])assert.throws(()=>split([{name:'A',paid:'100',share:shares[0]},{name:'B',paid:'0',share:shares[1]}],'percentage'));
 assert.throws(()=>split([{name:'A',paid:'1',share:'0'},{name:'B',paid:'0',share:'0'}],'shares'));
});
test('trip expenses aggregate payers exactly, preserve inputs and validate deleted or invalid payers',async()=>{
 const {splitExpenses}=await import('../apps/bill-splitter/frontend/engine.mjs');const people=[{name:'A',share:'2'},{name:'B',share:'1'},{name:'C',share:'1'}],expenses=[{title:'Dinner',payer:0,amount:'600'},{title:'Travel',payer:1,amount:'200'}],before=JSON.stringify({people,expenses}),r=splitExpenses(people,expenses,'shares');
 assert.equal(r.total,80000);assert.deepEqual(r.people.map(p=>p.paid),[60000,20000,0]);assert.deepEqual(r.people.map(p=>p.share),[40000,20000,20000]);assert.deepEqual(r.transfers,[{from:'C',to:'A',amount:20000}]);conserved(r);assert.equal(JSON.stringify({people,expenses}),before);
 const large=splitExpenses([{name:'A',share:'9999999.99'},{name:'B',share:'9999999.98'}],Array.from({length:100},()=>({payer:0,amount:'9999999.99'})),'shares');conserved(large);
 for(const bad of [[],[{payer:3,amount:'10'}],[{payer:0,amount:'0'}],Array(101).fill({payer:0,amount:'1'})])assert.throws(()=>splitExpenses(people,bad));
});
test('ritual quantities and arrangers extend version-one state without losing extras or checks',async()=>{
 const {readState}=await import('../apps/ritual-assist/frontend/checklist-state.mjs');const guides=[{id:'puja',items:[{id:'water'}]}],legacy={version:1,remember:true,guides:{puja:{extras:[{id:'extra-one',label:'Flowers'}],checked:['water','extra-one']}}};
 const old=readState(JSON.stringify(legacy),guides);assert.deepEqual(old.guides.puja.checked,['water','extra-one']);assert.deepEqual(old.guides.puja.details,{});
 legacy.guides.puja.details={water:{quantity:'2 litres',arranger:'आकांक्षा'},'extra-one':{quantity:'1 basket',arranger:'Meera'},unknown:{quantity:'Ignore',arranger:'Unknown'}};const state=readState(JSON.stringify(legacy),guides);assert.equal(state.guides.puja.details.water.arranger,'आकांक्षा');assert.equal(state.guides.puja.extras[0].label,'Flowers');assert.equal(state.guides.puja.details.unknown,undefined);
 legacy.guides.puja.details.water.quantity='x'.repeat(61);assert.throws(()=>readState(JSON.stringify(legacy),guides));
});
