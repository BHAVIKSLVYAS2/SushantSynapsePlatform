import test from 'node:test';import assert from 'node:assert/strict';
import {localIntent,validateIntent} from '../packages/nishi/planner.mjs';
import {nishi} from '../apps/portal/backend/nishi.mjs';
import {sendDraft,takeDraft} from '../packages/nishi/handoff.mjs';
const request=(message,extra={})=>new Request('https://example.test/api/nishi/plan',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify({message,...extra})});
test('three supported workflows use canonical content and leave ambiguous fields missing',()=>{
 const jap=localIntent('Create 21,000-jap Gayatri for Amit');assert.equal(jap.target,21000);assert.equal(jap.name,'Amit');assert.equal(jap.mantraId,'gayatri');assert.equal(localIntent('108 malas Gayatri mantra for Amit').target,11664);
 const ritual=localIntent('Prepare Ganesh puja on 2026-12-01');assert.equal(ritual.guideId,'ganesh-puja');assert.ok(ritual.items.includes('Durva grass'));assert.equal(ritual.date,'2026-12-01');
 const birth=localIntent('Birth kundali 1990-04-12 10:30 exact birthplace Delhi');assert.equal(birth.date,'1990-04-12');assert.equal(birth.place,'Delhi');assert.equal(birth.accuracy,'exact');assert.equal(localIntent('Birth kundali 12/04/1990').date,'');
 assert.ok(localIntent('Prepare puja').missing.includes('ritual'));assert.equal(localIntent('hi').kind,'unsupported');
});
test('model output cannot invent navigation, mantra text, checklist items or valid counts',()=>{
 const p=validateIntent({kind:'japseva',mantraId:'evil',target:-1,path:'https://evil.test',text:'invented'});assert.equal(p.path,'/japseva');assert.equal(p.mantraId,'');assert.equal(p.target,null);assert.equal(p.text,undefined);
 assert.equal(validateIntent({kind:'kundali',date:'2026-02-30',time:'25:99',accuracy:'certain'}).date,'');assert.equal(validateIntent({kind:'kundali',accuracy:'certain'}).accuracy,'unknown');
 assert.equal(validateIntent({kind:'ritual',guideId:'invented'}).path,undefined);
});
test('public endpoint validates origin/body and reports local capability without AI setup',async()=>{
 assert.equal((await(await nishi(new Request('https://example.test/api/nishi/plan'))).json()).ai,false);
 const r=await nishi(request('Create 108 jap Gayatri for Amit'));assert.equal(r.status,200);assert.equal((await r.json()).source,'local');
 assert.equal((await nishi(new Request('https://example.test/api/nishi/plan',{method:'POST',headers:{Origin:'https://evil.test'}}))).status,403);
 assert.equal((await nishi(request('x'.repeat(601)))).status,400);assert.equal((await nishi(request('x'.repeat(5000)))).status,413);
});
test('AI requires explicit submission opt-in, rate limit and atomic pilot budget; failures fall back',async()=>{
 let calls=0,usage=0;const env={NISHI_AI_ENABLED:'true',AI:{run:async()=>{calls++;return {response:JSON.stringify({kind:'japseva',name:'Amit',mantraId:'gayatri',target:108})};}},NISHI_LIMITER:{limit:async()=>({success:true})},PLATFORM_DB:{prepare:()=>({bind:()=>({first:async()=>{usage++;return {calls:usage};}})})}};
 await nishi(request('108 jap Gayatri for Amit'),env);assert.equal(calls,0);
 const unbound={...env,AI:undefined};assert.equal((await(await nishi(request('108 jap Gayatri for Amit',{useAI:true}),unbound)).json()).source,'local');assert.equal(calls,0);
 let r=await(await nishi(request('108 jap Gayatri for Amit',{useAI:true}),env)).json();assert.equal(r.source,'cloudflare');assert.equal(calls,1);
 env.PLATFORM_DB.prepare=()=>({bind:()=>({first:async()=>null})});r=await(await nishi(request('108 jap Gayatri for Amit',{useAI:true}),env)).json();assert.equal(r.source,'local');assert.equal(calls,1);
 env.NISHI_LIMITER.limit=async()=>({success:false});assert.equal((await nishi(request('108 jap Gayatri',{useAI:true}),env)).status,429);
 env.NISHI_LIMITER.limit=async()=>({success:true});env.PLATFORM_DB.prepare=()=>({bind:()=>({first:async()=>({calls:1})})});env.AI.run=async()=>({response:JSON.stringify({kind:'kundali',name:'Invented Name',date:'2050-01-01',time:'12:00',place:'Invented City',accuracy:'exact'})});const invented=(await(await nishi(request('Prepare birth kundali 1990-04-12',{useAI:true}),env)).json()).plan;assert.equal(invented.name,'');assert.equal(invented.date,'');assert.equal(invented.time,'');assert.equal(invented.place,'');assert.equal(invented.accuracy,'unknown');
});
test('draft transfer is one-time, expires and carries no conversation or saved-record identifiers',()=>{
 const old=globalThis.sessionStorage,storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 try{sendDraft({kind:'japseva',name:'Amit',target:108,mantraId:'gayatri',history:'secret'});assert.equal(takeDraft('ritual'),null);const p=takeDraft('japseva');assert.equal(p.target,108);assert.equal(p.history,undefined);assert.equal(takeDraft('japseva'),null);sendDraft({kind:'kundali'});const [key,raw]=[...storage][0];storage.set(key,JSON.stringify({...JSON.parse(raw),at:Date.now()-400000}));assert.equal(takeDraft('kundali'),null);}finally{globalThis.sessionStorage=old;}
});
test('Workers composition exposes the capability endpoint before private database services',async()=>{
 const {edgeApi}=await import('../server/edge-index.mjs');const r=await edgeApi(new Request('https://example.test/api/nishi/plan'),{PUBLIC_ORIGIN:'https://example.test'});assert.equal(r.status,200);assert.equal((await r.json()).ai,false);
});
