const {test}=require('node:test'),assert=require('node:assert/strict');
test('matching stories follow actual factor results, preserve input and localize every outcome',async()=>{
 const {ashtakoota}=await import('../packages/vedic/matching.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');
 const seen=new Set();
 for(let a=0;a<27;a++)for(let b=0;b<27;b++){
  const result=ashtakoota({personAMoonLongitude:(a+.5)*360/27,personBMoonLongitude:(b+.5)*360/27,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'}),before=JSON.stringify(result);
  for(const language of ['en','hi','gu']){const story=matchingStory(result,language);assert.equal(story.items.length,3);assert.ok(story.title&&story.note);
   for(const item of story.items){const c=result.components.find(c=>c.id===item.id);assert.equal(item.component,c);assert.equal(item.state,c.score===c.maximum?'full':c.score===0?'zero':'partial');assert.ok(item.text&&item.prompt);if(language==='hi')assert.match(item.text,/[\u0900-\u097f]/);if(language==='gu')assert.match(item.text,/[\u0a80-\u0aff]/);seen.add(item.id+':'+item.state);}
  }assert.equal(JSON.stringify(result),before);
 }for(const key of ['graha-maitri:full','graha-maitri:partial','graha-maitri:zero','tara:full','tara:partial','bhakoot:full','bhakoot:zero'])assert.ok(seen.has(key),key);
});
test('boundary-dependent factors never receive a fixed story or nominal factor assertion',async()=>{
 const {screenedMatching}=await import('../packages/vedic/matching-screen.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');
 for(const a of [0,30,40/3])for(const b of [15,105,225]){
  const result=screenedMatching({personAMoonLongitude:a,personBMoonLongitude:b,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'});
  for(const language of ['en','hi','gu'])for(const item of matchingStory(result,language).items)if(item.component.score===null){assert.equal(item.state,'uncertain');assert.ok(item.component.scoreRange.min<item.component.scoreRange.max);}
 }assert.deepEqual(matchingStory({components:[]}).items,[]);
});
