const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSatire}=require('../apps/news/frontend/engine');
const story=title=>({title,description:'Source details.',url:'https://example.com/news'});
const dialogue=comic=>comic.body.split('\n\n').slice(1,4).join('\n');
test('satire cycles distinct complete jokes, not just swapped headlines, and varies by date',()=>{
  const stories=['New film trailer released','Another film trailer released','New smartphone launched','Cricket team prepares for match'].map(story);
  const before=structuredClone(stories);
  const takes=Array.from({length:9},(_,variant)=>createSatire(stories,{date:'2026-10-07',variant}));
  assert.equal(new Set(takes.map(dialogue)).size,9);
  assert.deepEqual(createSatire(stories,{date:'2026-10-07',variant:9}),takes[0]);
  assert.notEqual(dialogue(createSatire(stories,{date:'2026-10-08'})),dialogue(takes[0]));
  for(const take of takes){assert.ok(take.body.includes(stories[take.storyPosition-1].title));assert.match(take.body,/Panel 3:/);assert.match(take.body,/fictional humour/);}
  assert.deepEqual(stories,before);
});
test('headline angle overrides desk and does not match partial words',()=>{
  const space=[{...story('Digital telescope maps distant stars'),category:'Tech'}];
  for(let variant=0;variant<3;variant++){
    const text=dialogue(createSatire(space,{variant}));
    assert.match(text,/Mars|telescope|Moon/);assert.doesNotMatch(text,/EMI|battery|new phone/i);
  }
  assert.match(createSatire([story('Chairperson explains local affairs')]).body,/Reading-room comic:/);
});
test('sensitive titles and descriptions are excluded; serious editions get an unlinked reading-room comic',()=>{
  const sensitive=['Film actor dies','Cricket player injured','Train crash','Concert attack','Flood victims await help'];
  for(const title of sensitive){
    const comic=createSatire([story(title)]);
    assert.match(comic.body,/Reading-room comic:/);assert.ok(!comic.body.includes(title));
  }
  const stories=[{...story('New film trailer released'),description:'The actor died yesterday.'},story('Smartphone launched')];
  assert.equal(createSatire(stories).storyPosition,2);
  assert.throws(()=>createSatire([]),/source story/);
});
