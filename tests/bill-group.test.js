const test=require('node:test'),assert=require('node:assert/strict');
const engine=import('../apps/bill-splitter/frontend/engine.mjs');
function conserved(result){
 assert.equal(result.people.reduce((n,p)=>n+p.paid,0),result.total);
 assert.equal(result.people.reduce((n,p)=>n+p.share,0),result.total);
 const balances=new Map(result.people.map(p=>[p.name,p.paid-p.share]));
 for(const transfer of result.transfers){assert.ok(Number.isSafeInteger(transfer.amount)&&transfer.amount>0);balances.set(transfer.from,balances.get(transfer.from)+transfer.amount);balances.set(transfer.to,balances.get(transfer.to)-transfer.amount);}
 assert.ok([...balances.values()].every(n=>n===0));
}
test('each expense has its own participants, including a payer excluded from their purchase',async()=>{
 const {splitGroup}=await engine,rows=['A','B','C'].map(name=>({name}));
 const result=splitGroup(rows,[{payer:0,amount:'1200',title:'Dinner'},{payer:1,amount:'300',title:'Taxi',members:[0,1]},{payer:0,amount:'100',title:'Gift',members:[1,2]}]);
 assert.deepEqual(result.people.map(p=>p.share),[55000,60000,45000]);
 assert.deepEqual(result.people.map(p=>p.paid),[130000,30000,0]);conserved(result);
 assert.deepEqual(result.expenses[2].members,['B','C']);
});
test('individual expense rounding is stable, conserves each paise and does not depend on checkbox order',async()=>{
 const {splitGroup}=await engine,rows=['A','B','C'].map(name=>({name}));
 const expense={payer:2,amount:'0.01',members:[1,0]};
 const result=splitGroup(rows,[expense,{...expense}]);assert.deepEqual(result.people.map(p=>p.share),[2,0,0]);conserved(result);
 assert.deepEqual(splitGroup(rows,[expense]),splitGroup(rows,[{...expense,members:[0,1]}]));
});
test('invalid participants, payers, names and amounts cannot produce settlements',async()=>{
 const {splitGroup}=await engine,rows=[{name:'A'},{name:'B'}],base={payer:0,amount:'10'};
 for(const members of [[],[0,0],[-1],[2],[0.5],['0'],null,{}])assert.throws(()=>splitGroup(rows,[{...base,members}]));
 for(const payer of [-1,2,'0',null])assert.throws(()=>splitGroup(rows,[{...base,payer}]));
 for(const amount of ['0','-1','0.001','x','10000000'])assert.throws(()=>splitGroup(rows,[{...base,amount}]));
 assert.throws(()=>splitGroup([{name:'A'},{name:'a'}],[base]));assert.throws(()=>splitGroup(rows,[]));assert.throws(()=>splitGroup(rows,Array(101).fill(base)));
});
test('hundreds of mixed group expenses conserve paise without mutating their inputs',async()=>{
 const {splitGroup}=await engine;let seed=17;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let run=0;run<500;run++){
  const rows=Array.from({length:2+random(19)},(_,i)=>({name:'Person '+i}));
  const expenses=Array.from({length:1+random(100)},()=>{const members=rows.flatMap((_,i)=>random(2)?[i]:[]);if(!members.length)members.push(random(rows.length));return {payer:random(rows.length),amount:((1+random(1000000))/100).toFixed(2),members};});
  const before=JSON.stringify({rows,expenses});conserved(splitGroup(rows,expenses));assert.equal(JSON.stringify({rows,expenses}),before);
 }
});
test('maximum supported group totals and already-settled groups remain exact',async()=>{
 const {splitGroup}=await engine;
 conserved(splitGroup([{name:'A'},{name:'B'}],Array.from({length:100},()=>({payer:0,amount:'9999999.99',members:[1]}))));
 assert.deepEqual(splitGroup([{name:'A'},{name:'B'}],[{payer:0,amount:'1'},{payer:1,amount:'1'}]).transfers,[]);
});
