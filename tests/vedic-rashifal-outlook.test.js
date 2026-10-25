const {test}=require('node:test'),assert=require('node:assert/strict');
const profile='IN_LAHIRI_DEFAULT_V1',now=Date.parse('2026-10-25T08:30Z');

test('human outlook follows each Rashi’s calculated Moon and planetary factors in every supported language',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs'),{rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const service=createRashifalService(),readings=new Set();
 for(let rashi=1;rashi<=12;rashi++)for(const language of ['en','hi','gu']){
  const r=service.getReading({rashi,language,view:'today',ruleVersion:rashifalLibrary.version,calculationProfileId:profile},{now}).reading,o=r.outlook;
  assert.equal(o.paragraphs.length,3);assert.ok(o.headline.length>0);assert.deepEqual(o.trace.moonCounts,r.grahas.find(g=>g.body==='Moon').counts);
  for(const body of o.trace.focusBodies){assert.ok(!['Moon','Rahu','Ketu'].includes(body));assert.ok(r.grahas.find(g=>g.body===body).counts[o.trace.focusKind==='support'?'supportive':'obstructed']>0);}
  if(o.trace.timingUtc)assert.ok(r.timeline.events.some(e=>e.utcInstant===o.trace.timingUtc&&e.intervalMembership==='inside'));
  if(language==='en')readings.add(JSON.stringify(o.paragraphs));else assert.match(o.paragraphs.join(' '),language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/);
  assert.doesNotMatch(o.paragraphs.join(' '),/\bH\d+\b|\d\/8|probability|guaranteed success/);
  assert.ok(Object.isFrozen(o));
  assert.deepEqual(o.everyday.houses,r.grahas.find(g=>g.body==='Moon').houses);
  assert.doesNotMatch(JSON.stringify(o.everyday),/Vedha|\bH\d+\b|probability|guaranteed success/);
  assert.ok(o.everyday.headline&&o.everyday.summary&&o.everyday.notice);
 }
 assert.ok(readings.size>4,'Distinct calculated patterns must not collapse into the former four editorial groups.');
});

test('everyday themes cover twelve computed houses in three languages and withhold precise themes when uncertain',async()=>{
 const {composeEveryday}=await import('../apps/rashifal-kundli/frontend/rashifal-everyday.mjs');
 for(const language of ['en','hi','gu']){
  const headlines=new Set();for(let house=1;house<=12;house++){
   const reading=composeEveryday({moon:{houses:[house]},mood:'supportive',language});
   headlines.add(reading.headline);assert.equal(reading.areas.length,3);assert.equal(reading.mode,'single');
   for(const area of reading.areas)assert.ok(area.label&&area.text);
  }assert.equal(headlines.size,12);
  for(const [houses,mood,mode] of [[[1,2],'mixed','mixed'],[[1,2,3,4],'mixed','broad'],[[1],'uncertain','uncertain'],[[],'neutral','uncertain']]){
   const r=composeEveryday({moon:{houses},mood,language});assert.equal(r.mode,mode);assert.ok(r.headline&&r.summary);assert.equal(r.areas.length,mode==='mixed'?3:0);
  }
 }
});

test('uncertain inputs, partial timing and an edge-only event never produce a confident prediction or false no-change claim',async()=>{
 const {composeOutlook}=await import('../apps/rashifal-kundli/frontend/rashifal-outlook.mjs');
 const grahas=[{body:'Moon',sampleCount:8,counts:{supportive:7,uncertain:1,'rule-unresolved':0,obstructed:0,'outside-favorable':0}}];
 const partial=composeOutlook({grahas,language:'en',timeline:{status:'partial',events:[]}});assert.equal(partial.mood,'uncertain');assert.equal(partial.trace.timingUtc,null);assert.match(partial.paragraphs[2],/not clear enough/);
 const edge={body:'Moon',kind:'ingress',utcInstant:'2026-10-25T18:30:00Z',intervalMembership:'boundary-uncertain',affected:[]};
 const near=composeOutlook({grahas,language:'en',timeline:{status:'available',events:[edge]}});assert.equal(near.trace.timingUtc,null);assert.doesNotMatch(near.paragraphs[2],/No Moon-sign/);
 const guard={...edge,kind:'guard-enter',intervalMembership:'inside'};
 const boundary=composeOutlook({grahas,language:'en',timeline:{status:'available',events:[guard]}});assert.match(boundary.paragraphs[2],/less settled/);assert.doesNotMatch(boundary.paragraphs[2],/changes sign/);
});
