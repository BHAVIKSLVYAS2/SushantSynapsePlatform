const {test}=require('node:test'),assert=require('node:assert/strict');
test('shared HTTP handles empty responses, scoped GET deduplication and status errors without retrying writes',async()=>{
 const {requestJson}=await import('../packages/http/request.mjs'),original=global.fetch;let calls=0,release;
 try{global.fetch=async()=>{calls++;await new Promise(r=>release=r);return Response.json({ok:true});};
  const a=requestJson('https://example.test/a',{dedupeKey:'fixture-user'}),b=requestJson('https://example.test/a',{dedupeKey:'fixture-user'});assert.equal(a,b);release();assert.deepEqual(await a,{ok:true});assert.equal(calls,1);
  global.fetch=async()=>{calls++;return new Response(null,{status:204});};assert.equal(await requestJson('https://example.test/write',{method:'PUT'}),null);
  global.fetch=async()=>{calls++;return Response.json({error:'Conflict',code:'changed'},{status:409});};await assert.rejects(requestJson('https://example.test/write',{method:'PUT'}),e=>e.status===409&&e.code==='changed');assert.equal(calls,3);
  assert.throws(()=>requestJson('https://example.test/write',{method:'PUT',dedupeKey:'invalid'}));
 }finally{global.fetch=original;}
});
test('shared HTTP preserves caller cancellation and rejects malformed success bodies',async()=>{
 const {requestJson}=await import('../packages/http/request.mjs'),original=global.fetch;
 try{global.fetch=async(_url,{signal})=>{if(signal.aborted)throw signal.reason;return new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));};const controller=new AbortController(),task=requestJson('https://example.test/a',{signal:controller.signal,timeoutMs:1000});controller.abort();await assert.rejects(task,e=>e.name==='AbortError');
 global.fetch=async()=>new Response('Not JSON');await assert.rejects(requestJson('https://example.test/a'),e=>e.status===502);
 }finally{global.fetch=original;}
});
test('shared Chambers summary matches legacy derivation without mutating transaction records',()=>{
 const {summarizeState}=require('../apps/advocate/backend/state-summary.cjs'),state={cases:[{id:'a'},{id:'b'}],hearings:[{caseId:'a',date:'2026-11-02',time:'09:00',status:'Scheduled'},{caseId:'a',date:'2026-11-01',time:'12:00',status:'Scheduled'},{caseId:'a',date:'2026-10-01',time:'09:00',status:'Scheduled'},{caseId:'b',date:'2026-11-01',time:'09:00',status:'Scheduled',archived:true}],invoices:[{id:'i',amount:10.1},{id:'j',amount:20}],payments:[{invoiceId:'i',amount:3.1},{invoiceId:'i',amount:7},{invoiceId:'j',amount:5,archived:true}]};const originals=JSON.stringify([state.hearings,state.payments]);summarizeState(state,'2026-10-24');assert.equal(state.cases[0].nextDate,'2026-11-01');assert.equal(state.cases[1].nextDate,'');assert.deepEqual(state.invoices.map(i=>[i.paid,i.balance,i.status]),[[10.1,0,'Paid'],[0,20,'Unpaid']]);assert.equal(JSON.stringify([state.hearings,state.payments]),originals);
});
test('public Arena and editorial reads avoid unrelated global revision and session reads',async()=>{
 const {edgeApi}=await import('../server/edge-index.mjs'),queries=[];const db={prepare(sql){queries.push(sql);return{bind(){return this;},async first(){return sql.includes('settings')?{data:JSON.stringify({version:0,posts:[],characters:[]})}:null;},async all(){return {results:[]};}};},async batch(statements){return Promise.all(statements.map(s=>s.all()));}};
 const env={PUBLIC_ORIGIN:'https://example.test',FREE_MODE:'true',FULL_APPS:'true',PLATFORM_DB:db,ARENA_COOKIE_SECRET:'isolated-fixture-secret'};
 assert.equal((await edgeApi(new Request('https://example.test/api/satire-arena'),env)).status,200);assert.equal(queries.length,2);assert(!queries.some(q=>/edge_revision|users|sessions/.test(q)));
 queries.length=0;assert.equal((await edgeApi(new Request('https://example.test/api/arena-editorial/today'),env)).status,200);assert.equal(queries.length,1);assert(queries[0].includes('settings'));
});

test('Worker bundle keeps public reference tables out of executable startup code',()=>{
 const {buildSync}=require('esbuild'),bundle=buildSync({entryPoints:['infrastructure/cloudflare/fullstack-worker.mjs'],bundle:true,write:false,platform:'node',format:'esm',metafile:true,logLevel:'silent'});
 assert(bundle.outputFiles[0].contents.length<5*1024*1024,'Worker source bundle exceeds the 5 MiB budget');
 assert(!Object.keys(bundle.metafile.inputs).some(name=>name.endsWith('fund-runtime-references.json')),'Monolithic reference data returned to executable startup');
});
