const {test}=require('node:test'),assert=require('node:assert/strict');
test('wheel lists enforce bounds, Unicode uniqueness and literal labels',async()=>{
 const {parseOptions}=await import('../apps/decision-wheel/frontend/engine.mjs');assert.deepEqual(parseOptions(' Dosa \r\n\n Poha '),['Dosa','Poha']);assert.deepEqual(parseOptions('नाश्ता\nदोपहर का खाना'),['नाश्ता','दोपहर का खाना']);assert.deepEqual(parseOptions('<img src=x>\nNormal'),['<img src=x>','Normal']);
 for(const list of ['','Only one','a\nA','Ａ\na',Array.from({length:31},(_,i)=>String(i)).join('\n'),'x'.repeat(61)+'\na','x'.repeat(4097)])assert.throws(()=>parseOptions(list));
 assert.equal(parseOptions(Array.from({length:30},(_,i)=>'Option '+i).join('\n')).length,30);
});
test('random selection rejects the biased tail, validates counts and bounds failed randomness',async()=>{
 const {chooseIndex}=await import('../apps/decision-wheel/frontend/engine.mjs');let values=[4294967295,4];assert.equal(chooseIndex(3,()=>values.shift()),1);for(let n=2;n<=30;n++)for(let i=0;i<n;i++)assert.equal(chooseIndex(n,()=>i),i);
 for(const n of [0,1,31,2.5])assert.throws(()=>chooseIndex(n,()=>0));assert.throws(()=>chooseIndex(3,()=>-1));assert.throws(()=>chooseIndex(3,()=>NaN));assert.throws(()=>chooseIndex(3,()=>4294967295),/failed/);
});
test('pointer lands at selected slice centre for every count and repeated rotation',async()=>{
 const {landingRotation}=await import('../apps/decision-wheel/frontend/engine.mjs');for(let n=2;n<=30;n++)for(let i=0;i<n;i++)for(const previous of [0,2167.3,4900]){const next=landingRotation(previous,i,n);assert.ok(next>=previous+1800);const angle=(next+(i+.5)*360/n)%360;assert.ok(Math.min(Math.abs(angle),Math.abs(angle-360))<1e-8);}
 assert.throws(()=>landingRotation(0,5,4));assert.throws(()=>landingRotation(NaN,0,2));
});
