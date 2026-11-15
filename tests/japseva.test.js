const {test}=require('node:test'),assert=require('node:assert/strict');
test('collection entries have three-language meanings and reading aids without invented recordings',async()=>{
 const {mantras,recordings,audioMantraIds}=await import('../apps/japseva/frontend/library.mjs');
 assert.equal(mantras.length,104);assert.equal(new Set(mantras.map(m=>m.id)).size,104);
 assert.deepEqual(audioMantraIds,['gayatri','shiva','vasudeva']);
 for(const m of mantras){assert.match(m.text,/[\u0900-\u097f]/);for(const lang of ['en','hi','gu'])for(const field of ['names','meanings','aids'])assert.ok(m[field][lang]?.trim(),m.id+' '+field+' '+lang);
  assert.match(m.aids.hi,/[\u0900-\u097f]/);assert.match(m.aids.gu,/[\u0a80-\u0aff]/);
  if(m.audio)assert.equal(m.audio,recordings[m.id].asset);else assert.equal(recordings[m.id],undefined);
 }
 for(const m of mantras.slice(4)){assert.ok(m.sourceUrl.startsWith('https://'));assert.equal(m.audio,undefined);}
});
test('audio plays persist separately, stop at target and accept older backups',async()=>{
 const {empty,command,validate}=await import('../apps/japseva/frontend/storage.mjs');const legacy=empty();delete legacy.audioPlays;assert.deepEqual(validate(legacy).audioPlays,{});
 let s=command(empty(),'/audio/gayatri',{action:'target',target:2});s=command(s,'/audio/gayatri',{action:'increment'});s=command(s,'/audio/gayatri',{action:'increment'});assert.deepEqual(s.audioPlays.gayatri,{target:2,count:2});assert.equal(s.sankalps.length,0);assert.throws(()=>command(s,'/audio/gayatri',{action:'increment'}));assert.throws(()=>command(s,'/audio/gayatri',{action:'target',target:1}));assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);
 for(const target of [0,-1,1.1,'3',1000001])assert.throws(()=>command(s,'/audio/gayatri',{action:'target',target}));assert.throws(()=>validate({...s,audioPlays:{unknown:{count:1,target:2}}}));s=command(s,'/audio/gayatri',{action:'reset'});assert.equal(s.audioPlays.gayatri.count,0);
 for(const key of ['shiva','vasudeva']){s=command(s,'/audio/'+key,{action:'target',target:1});s=command(s,'/audio/'+key,{action:'increment'});assert.deepEqual(s.audioPlays[key],{count:1,target:1});assert.throws(()=>command(s,'/audio/'+key,{action:'increment'}));}assert.equal(s.audioPlays.gayatri.count,0);assert.equal(s.sankalps.length,0);assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);assert.throws(()=>command(s,'/audio/ganesha',{action:'increment'}));
});

test('complete Rudram retains all 22 anuvakas and counts whole recitations without oversized records',async()=>{
 const {fullRudram:m}=await import('../apps/japseva/frontend/rudram-full.mjs');
 for(const book of ['namakam','chamakam'])assert.deepEqual(m.chapters.filter(c=>c.book===book).map(c=>c.number),Array.from({length:11},(_,i)=>i+1));
 assert.equal(m.chapters.reduce((n,c)=>n+c.citations.length,0),47);
 assert.match(m.chapters[0].text,/नमस्ते रुद्र मन्यव उतोत इषवे नमः/);
 assert.match(m.chapters[9].text,/अस्मिन्ननातुरम्/);assert.doesNotMatch(m.chapters[9].text,/अस्मि न्न/);
 assert.match(m.chapters[10].text,/तं वो जम्भे दधामि/);
 assert.match(m.chapters[11].text,/मेऽपानश्च/);assert.doesNotMatch(m.chapters[11].text,/अपान श्च/);
 assert.match(m.chapters[21].text,/एकत्रिꣳशच्च/);assert.match(m.chapters[21].text,/भुवनश्चाधिपतिश्च/);
 assert.doesNotMatch(m.aids.en,/[\u0900-\u0963ꣳ]/);assert.doesNotMatch(m.aids.gu,/[\u0900-\u0963ꣳ]/);
 const {empty,command,validate,certificate}=await import('../apps/japseva/frontend/storage.mjs');
 let s=command(empty(),'/clients',{name:'Client'});s=command(s,'/sankalps',{clientId:s.clients[0].id,mantra:m.practiceText,mantraId:m.id,practitioner:'A',target:1});const id=s.sankalps[0].id;
 assert.throws(()=>certificate(s,id));s=command(s,'/'+id+'/count',{amount:1});assert.equal(certificate(s,id).mantra,m.practiceText);assert.equal(certificate(s,id).count,1);assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);assert.ok(s.sankalps[0].mantra.length<1000);
});
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
 for(const bad of [{}, {...s,schemaVersion:99},{...s,clients:[s.clients[0],s.clients[0]]},{...s,sankalps:[s.sankalps[0],s.sankalps[0]]}])assert.throws(()=>validate(bad));
});

test('corrections preserve original history, reopen certificates and survive legacy backup upgrades',async()=>{
 const {empty,command,validate,certificate}=await import('../apps/japseva/frontend/storage.mjs');let s=command(empty(),'/clients',{name:'Client'});s=command(s,'/sankalps',{clientId:s.clients[0].id,mantra:'Om',target:108,practitioner:'A'});const id=s.sankalps[0].id;
 s=command(s,'/'+id+'/count',{amount:108});const legacy=structuredClone(s);legacy.schemaVersion=1;delete legacy.sankalps[0].corrections;assert.equal(validate(legacy).sankalps[0].count,108);
 for(const body of [{amount:109,reason:'Mistake'},{amount:1,reason:''},{amount:-1,reason:'Mistake'}])assert.throws(()=>command(s,'/'+id+'/correct',body));
 s=command(s,'/'+id+'/correct',{amount:8,reason:'Accidental taps'});assert.equal(s.sankalps[0].count,100);assert.equal(s.sankalps[0].history[0].amount,108);assert.equal(s.sankalps[0].completedAt,null);assert.throws(()=>certificate(s,id));assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);
 s=command(s,'/'+id+'/count',{amount:8});assert.equal(certificate(s,id).count,108);const bad=structuredClone(s);bad.sankalps[0].corrections[0].amount=1;assert.throws(()=>validate(bad));
});
