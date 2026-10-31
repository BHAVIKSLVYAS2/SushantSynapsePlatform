const {test}=require('node:test'),assert=require('node:assert/strict');
const modulePromise=import('../apps/moment-studio/frontend/local-writing.mjs');
const respond=instruction=>{if(instruction.startsWith('Correct the grammar.'))return 'She was happy to invite her friends.';const data=JSON.parse(instruction.split('\n').at(-1));return 'With warm wishes. '+[...new Set(JSON.stringify(data).match(/MSDETAIL\d+END/g)||[])].join(' ');};

test('local writing assets are served and unavailable/unverified states remain honest',async()=>{
 const {createLocalWriter}=await modulePromise,{staticAssets}=require('../server/static-assets');for(const name of ['local-writing.mjs','writing-ui.mjs','writing.css'])assert.ok(staticAssets['/moment-studio/'+name]);assert.equal(staticAssets['/moment-studio/ai.mjs'],undefined);
 assert.equal((await createLocalWriter({api:null}).availability()).state,'unavailable');
 for(const language of ['hi','gu','hinglish'])assert.equal((await createLocalWriter({api:{}}).availability(language)).state,'unverified');
 for(const state of ['available','downloadable','downloading','unavailable','unexpected'])assert.equal((await createLocalWriter({api:{availability:async()=>state,create(){}}}).availability()).state,state==='unexpected'?'unavailable':state);
 assert.equal((await createLocalWriter({api:{availability:async()=>{throw Error('policy');},create(){}}}).availability()).state,'unavailable');
 const pending=createLocalWriter({api:{availability:async()=>'available',create(){throw Error('must not run');}}});assert.equal((await pending.availability()).qualityApproved,false);await assert.rejects(()=>pending.write({prompt:'Write a greeting.'}),/quality review/);
});

test('all writing actions carry actual requests and protect supplied personal/event details',async()=>{
 const {writingActions,prepareWritingRequest,validateWritingResult}=await modulePromise;
 for(const action of Object.keys(writingActions)){
  const request=prepareWritingRequest({action,prompt:'A professional invitation, ticket 500.',text:'Meet Meera at Lotus Hall at 18:30.',context:{recipient:'Meera',sender:'Aarav',location:'Lotus Hall',date:'2026-12-12',time:'18:30'},length:'long'});
  assert.ok(request.instruction.includes(writingActions[action]));assert.ok(!request.instruction.includes('Meera'));assert.ok(!request.instruction.includes('Lotus Hall'));
  const output=validateWritingResult(respond(request.instruction),request);for(const detail of ['Meera','Aarav','Lotus Hall','2026-12-12','18:30','500'])assert.ok(output.includes(detail));
 }
});

test('writing rejects invented numbers/calendar facts, omitted tokens, excessive output and invalid inputs',async()=>{
 const {prepareWritingRequest,validateWritingResult}=await modulePromise;
 const request=prepareWritingRequest({prompt:'Write a birthday greeting.',context:{recipient:'Meera'}});
 assert.throws(()=>validateWritingResult('Happy birthday!',request),/omitted/);
 assert.throws(()=>validateWritingResult('MSDETAIL0END, meet at 18:30.',request),/number or date/);
 assert.throws(()=>validateWritingResult('MSDETAIL0END, see you on Sunday.',request),/calendar/);
 assert.throws(()=>validateWritingResult('MSDETAIL0END '+'.'.repeat(400),request),/too long/);
 assert.throws(()=>validateWritingResult('MSDETAIL0END MSDETAIL999END',request),/protected detail/);
 for(const options of [{prompt:''},{action:'bad'},{action:'grammar',text:''},{prompt:'hi',language:'hi'},{prompt:'hi',language:'gu'},{prompt:'hi',language:'hinglish'},{prompt:'hi',tone:'bad'},{prompt:'x'.repeat(1001)},{prompt:'MSDETAIL0END'}])assert.throws(()=>prepareWritingRequest(options));
 assert.equal(prepareWritingRequest({prompt:'Write a greeting.'}).tokens.length,0);
 const freeform=prepareWritingRequest({prompt:'Write a wedding invitation for Meera and Aarav at Lotus Hall.'});
 const safe=validateWritingResult(respond(freeform.instruction),freeform);for(const detail of ['Meera','Aarav','Lotus Hall'])assert.ok(safe.includes(detail));
 assert.equal(validateWritingResult('May your day be wonderful.',prepareWritingRequest({prompt:'Write a birthday greeting.'})),'May your day be wonderful.');
 const dated=prepareWritingRequest({prompt:'Write an invitation.',context:{date:'2026-12-12'}});assert.equal(validateWritingResult('Please join us on MSDETAIL0END.',dated),'Please join us on 2026-12-12.');
});

test('adapter performs real inference calls, quality checks and cleanup without template fallback',async()=>{
 const {createLocalWriter}=await modulePromise;let destroyed=0,created,requests=[];
 const writer=createLocalWriter({evaluation:true,api:{create:async options=>{created=options;return {prompt:async instruction=>{requests.push(instruction);return respond(instruction);},destroy:()=>destroyed++};}}});
 const output=await writer.write({prompt:'Write a retirement farewell for my colleague.',context:{recipient:'Meera'}});
 assert.equal(output.source,'on-device-model');assert.ok(output.text.includes('Meera'));assert.equal(requests.length,3);assert.ok(requests[2].includes('retirement farewell'));assert.deepEqual(created.expectedOutputs,[{type:'text',languages:['en']}]);assert.equal(destroyed,1);
 const bad=createLocalWriter({evaluation:true,api:{create:async()=>({prompt:async()=>'She were happy.',destroy:()=>destroyed++})}});
 await assert.rejects(()=>bad.write({prompt:'Write a greeting.'}),/grammar check/);assert.equal(destroyed,2);
});

test('local model cancellation, initialization failure and concurrent requests never return stale text',async()=>{
 const {createLocalWriter}=await modulePromise;const controller=new AbortController();let destroyed=0,release;
 const writer=createLocalWriter({evaluation:true,api:{create:async()=>({prompt:()=>new Promise(resolve=>release=resolve),destroy:()=>destroyed++})}});
 const running=writer.write({prompt:'Write a greeting.'},{signal:controller.signal});await new Promise(resolve=>setImmediate(resolve));
 await assert.rejects(()=>writer.write({prompt:'Another greeting.'}),/current suggestion/);controller.abort();release('She was happy to invite her friends.');await assert.rejects(()=>running,{name:'AbortError'});assert.ok(destroyed>=1);
 await assert.rejects(()=>createLocalWriter({evaluation:true,api:{create:async()=>{throw Error('download failed');}}}).write({prompt:'Write a greeting.'}),/download failed/);
});
