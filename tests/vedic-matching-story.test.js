const {test}=require('node:test'),assert=require('node:assert/strict');
test('matching stories follow actual factor results, preserve input and localize every outcome',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');
 const seen=new Set();
 for(let a=0;a<27;a++)for(let b=0;b<27;b++){
  const result=ashtakoota({personAMoonLongitude:(a+.5)*360/27,personBMoonLongitude:(b+.5)*360/27,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'}),before=JSON.stringify(result);
  for(const language of ['en','hi','gu']){const story=matchingStory(result,language);assert.equal(story.items.length,3);assert.ok(story.title&&story.note);
   for(const item of story.items){const c=result.components.find(c=>c.id===item.id);assert.equal(item.component,c);assert.equal(item.state,c.score===c.maximum?'full':c.score===0?'zero':'partial');assert.ok(item.text&&item.prompt);if(language==='hi')assert.match(item.text,/[\u0900-\u097f]/);if(language==='gu')assert.match(item.text,/[\u0a80-\u0aff]/);seen.add(item.id+':'+item.state);}
   const connection=story.connection;assert.equal(Object.values(connection.groups).flat().length,8);for(const c of result.components)assert.ok(connection.groups[c.score===c.maximum?'full':c.score===0?'zero':'partial'].includes(c.id));assert.ok(connection.headline&&connection.takeaway);if(connection.takeawayFactor)assert.ok(story.items.some(i=>i.id===connection.takeawayFactor&&i.prompt===connection.takeaway));
  }assert.equal(JSON.stringify(result),before);
 }for(const key of ['graha-maitri:full','graha-maitri:partial','graha-maitri:zero','tara:full','tara:partial','bhakoot:full','bhakoot:zero'])assert.ok(seen.has(key),key);
});
test('boundary-dependent factors never receive a fixed story or nominal factor assertion',async()=>{
 const {screenedMatching}=await import('../packages/vedic/matching-screen.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');
 for(const a of [0,30,40/3])for(const b of [15,105,225]){
  const result=screenedMatching({personAMoonLongitude:a,personBMoonLongitude:b,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'});
  for(const language of ['en','hi','gu']){const story=matchingStory(result,language);if(result.components.some(c=>c.score===null)){assert.equal(story.connection.pattern,'uncertain');assert.equal(story.connection.takeawayFactor,null);}for(const item of story.items)if(item.component.score===null){assert.equal(item.state,'uncertain');assert.ok(item.component.scoreRange.min<item.component.scoreRange.max);}}
 }assert.deepEqual(matchingStory({components:[]}).items,[]);
});
test('same total with different component patterns has a different connected reading',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');const seen=new Map();let checked=false;
 for(let a=0;a<27&&!checked;a++)for(let b=0;b<27&&!checked;b++){
  const r=ashtakoota({personAMoonLongitude:(a+.5)*360/27,personBMoonLongitude:(b+.5)*360/27,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'}),story=matchingStory(r),key=JSON.stringify(story.connection.groups),previous=seen.get(r.total);
  if(previous&&previous.key!==key){assert.notDeepEqual(story.connection.paragraphs,previous.paragraphs);checked=true;}else seen.set(r.total,{key,paragraphs:story.connection.paragraphs});
 }assert.ok(checked);
});
