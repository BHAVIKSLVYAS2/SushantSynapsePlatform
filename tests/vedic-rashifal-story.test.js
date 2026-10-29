const {test}=require('node:test'),assert=require('node:assert/strict');
const g=(body,supportive,obstructed,uncertain=0)=>({body,sampleCount:8,counts:{supportive,obstructed,uncertain,'rule-unresolved':0}});
test('coherent Rashifal distinguishes simultaneous support, obstruction, variation and uncertainty without random prose',async()=>{
 const {composeRashifalStory}=await import('../apps/rashifal-kundli/frontend/rashifal-story.mjs'),{composeEveryday}=await import('../apps/rashifal-kundli/frontend/rashifal-everyday.mjs');
 const cases=[['support',[g('Venus',8,0)]],['resistance',[g('Mars',0,8)]],['both',[g('Venus',8,0),g('Mars',0,8)]],['variable',[g('Venus',4,4)]],['quiet',[]],['quiet',[g('Mercury',7,0,1)]],['quiet',[g('Rahu',8,0)]]];
 for(const language of ['en','hi','gu'])for(const [pattern,grahas]of cases){
  const base=composeEveryday({moon:{houses:[3]},mood:'supportive',language}),input={base,grahas,mood:'supportive',language};const before=JSON.stringify(input),r=composeRashifalStory(input);
  assert.equal(r.narrative.pattern,pattern);assert.equal(r.paragraphs.length,2);assert.ok(r.headline&&r.rhythm&&r.takeawayLabel);assert.equal(r.timing,null);assert.equal(JSON.stringify(input),before);assert.deepEqual(r,composeRashifalStory(input));
  if(pattern==='both'){assert.equal(r.narrative.supportBody,'Venus');assert.equal(r.narrative.obstructedBody,'Mars');}if(pattern==='variable')assert.equal(r.narrative.supportBody,r.narrative.obstructedBody);
  if(language!=='en')assert.match(r.paragraphs.join(' '),language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/);
  const uncertain=composeRashifalStory({...input,mood:'uncertain',base:composeEveryday({moon:{houses:[3]},mood:'uncertain',language})});assert.equal(uncertain.narrative.pattern,'uncertain');assert.equal(uncertain.narrative.supportBody,null);assert.equal(uncertain.areas.length,0);
 }
});
test('all twelve themes have pattern-dependent headlines and weekly variation keeps its scope',async()=>{
 const {composeRashifalStory}=await import('../apps/rashifal-kundli/frontend/rashifal-story.mjs'),{composeEveryday}=await import('../apps/rashifal-kundli/frontend/rashifal-everyday.mjs');
 for(const language of ['en','hi','gu']){const titles=new Set();for(let house=1;house<=12;house++){
  const base=composeEveryday({moon:{houses:[house]},mood:'supportive',language});const input={base,grahas:[g('Venus',8,0)],mood:'supportive',language};const a=composeRashifalStory(input),b=composeRashifalStory({...input,grahas:[g('Venus',8,0),g('Mars',0,8)]});assert.notEqual(a.headline,b.headline);titles.add(a.headline);assert.equal(a.areas.length,3);
 }assert.equal(titles.size,12);
 const base=composeEveryday({moon:{houses:[1,2,3,4]},mood:'mixed',language});assert.equal(composeRashifalStory({base,grahas:[],mood:'mixed',language}).mode,'broad');
 }
});
test('only available, inside, classified Moon status changes receive narrative timing',async()=>{
 const {composeOutlook}=await import('../apps/rashifal-kundli/frontend/rashifal-outlook.mjs');const grahas=[{...g('Moon',4,4),houses:[3]}];const event={body:'Moon',kind:'ingress',utcInstant:'2026-10-25T13:52:00Z',intervalMembership:'inside',affected:[{body:'Moon',fromStatus:'supportive',toStatus:'obstructed'}]};
 const run=(status,events)=>composeOutlook({grahas,language:'en',timeline:{status,events}}).everyday;
 assert.ok(run('available',[event]).timing);assert.equal(run('partial',[event]).timing,null);assert.equal(run('available',[]).timing,null);assert.equal(run('available',[{...event,intervalMembership:'boundary-uncertain'}]).timing,null);assert.equal(run('available',[{...event,affected:[]}]).timing,null);
});
