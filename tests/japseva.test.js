const {test}=require('node:test'),assert=require('node:assert/strict');
test('local practice enforces target, daily history, completion and backup integrity',async()=>{
 const {empty,command,validate,certificate}=await import('../apps/japseva/frontend/storage.mjs');let s=command(empty(),'/clients',{name:'Meera'});const clientId=s.clients[0].id;
 for(const target of [0,-1,1.2,100000001,'108'])assert.throws(()=>command(s,'/sankalps',{clientId,mantra:'Om',target,practitioner:'Practitioner'}));
 s=command(s,'/sankalps',{clientId,mantra:'ॐ नमः शिवाय',mantraId:'shiva',target:108,practitioner:'Practitioner'});const id=s.sankalps[0].id;assert.throws(()=>certificate(s,id));
 for(const amount of [-1,0,1.1,109,'108'])assert.throws(()=>command(s,'/'+id+'/count',{amount}));
 s=command(s,'/'+id+'/count',{amount:1},'2026-11-12T18:20:00Z');s=command(s,'/'+id+'/count',{amount:107},'2026-11-12T18:25:00Z');assert.equal(s.sankalps[0].history.length,1);assert.equal(certificate(s,id).client,'Meera');
 assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);for(const change of [r=>r.count=107,r=>r.target=109,r=>r.clientId=crypto.randomUUID(),r=>r.history[0].amount=1]){const bad=structuredClone(s);change(bad.sankalps[0]);assert.throws(()=>validate(bad));}
 assert.throws(()=>command(s,'/'+id+'/count',{amount:1}));assert.equal(empty().clients.length,0);
});
test('IST day boundaries and backup schema/duplicate validation preserve practice records',async()=>{
 const {empty,command,validate}=await import('../apps/japseva/frontend/storage.mjs');let s=command(empty(),'/clients',{name:'Client'});s=command(s,'/sankalps',{clientId:s.clients[0].id,mantra:'Om',target:3,practitioner:'A'});const id=s.sankalps[0].id;
 s=command(s,'/'+id+'/count',{amount:1},'2026-11-12T18:29:00Z');s=command(s,'/'+id+'/count',{amount:1},'2026-11-12T18:31:00Z');assert.deepEqual(s.sankalps[0].history.map(h=>h.day),['2026-11-12','2026-11-13']);
 for(const bad of [{}, {...s,schemaVersion:2},{...s,clients:[s.clients[0],s.clients[0]]},{...s,sankalps:[s.sankalps[0],s.sankalps[0]]}])assert.throws(()=>validate(bad));
});
