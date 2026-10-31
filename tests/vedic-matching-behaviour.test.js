const {test}=require('node:test'),assert=require('node:assert/strict');
const base={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
const context={now:Date.parse('2026-10-31T06:00:00Z')};

test('both relationship readings trace to admitted charts and the existing Kundali rules, not guna points',async()=>{
 const {buildMatchingChartContext}=await import('../apps/rashifal-kundli/frontend/matching-chart-reading.mjs');
 const {matchingBehaviourReading}=await import('../apps/rashifal-kundli/frontend/matching-behaviour.mjs');
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs');
 const {composeKundliTopic}=await import('../apps/rashifal-kundli/frontend/kundli-reading-prose.mjs');
 const {matchingForBirths}=await import('../packages/vedic/birth-matching.mjs');
 const inputs=[base,{...base,localDate:'2001-07-15',localTime:'18:00'}],payload={consent:true,personA:inputs[0],personB:inputs[1],rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'};
 const before=matchingForBirths(payload,context),charts=buildMatchingChartContext({consent:true,inputs},context),serialized=JSON.stringify(charts);
 for(const language of ['en','hi','gu']){
  const reading=matchingBehaviourReading(charts,language);assert.equal(reading.people.length,2);
  for(const [i,person]of reading.people.entries()){
   assert.equal(person.status,'available');assert.equal(person.items.length,2);
   const actual=birthChartForBirth(inputs[i],context).chart,moon=actual.planets.find(p=>p.body==='Moon'),seventh=actual.houses.find(h=>h.houseNumber===7);
   const [emotions,relationship]=person.items;
   assert.deepEqual(emotions.basis,{body:'Moon',sign:moon.rashi,house:moon.houseNumber});
   assert.equal(emotions.text,composeKundliTopic('personality',{moon:moon.rashi},language).paragraphs[1]);
   assert.deepEqual(relationship.basis,{house:7,sign:seventh.rashi,element:(seventh.rashi-1)%4});
   assert.equal(relationship.text,composeKundliTopic('relationships',{sign:seventh.rashi},language).paragraphs[0]);
  }
  const reversed=matchingBehaviourReading([...charts].reverse(),language);
  assert.deepEqual(reversed.people[0].items,reading.people[1].items);assert.deepEqual(reversed.people[1].items,reading.people[0].items);
  assert.deepEqual(reading,matchingBehaviourReading(charts,language));
 }
 assert.equal(JSON.stringify(charts),serialized);assert.deepEqual(matchingForBirths(payload,context),before);
 for(const secret of [base.localDate,base.localTime,base.placeId,'latitude','utcInstant'])assert.ok(!serialized.includes(secret));
});

test('missing, invalid and withheld chart factors never produce guessed behaviour',async()=>{
 const {buildMatchingChartContext}=await import('../apps/rashifal-kundli/frontend/matching-chart-reading.mjs');
 const {matchingBehaviourReading}=await import('../apps/rashifal-kundli/frontend/matching-behaviour.mjs');
 const charts=buildMatchingChartContext({consent:true,inputs:[base,{...base,localDate:'2000-01-02',localTime:'14:34'}]},context);
 assert.equal(charts[1].status,'unavailable');
 for(const language of ['en','hi','gu']){
  const result=matchingBehaviourReading(charts,language);assert.equal(result.people[0].items.length,2);assert.deepEqual(result.people[1].items,[]);
  for(const value of [{status:'unavailable',moon:{sign:1,house:1},seventh:{house:7,sign:1}},{status:'available'},{status:'available',moon:{sign:13,house:1},seventh:{house:6,sign:1}}]){
   const person=matchingBehaviourReading([value],language).people[0];assert.equal(person.status,'unavailable');assert.deepEqual(person.items,[]);
  }
 }
 const nested=new Proxy([],{get(){throw Error('must not read');}});
 assert.throws(()=>buildMatchingChartContext({consent:false,inputs:nested},context),error=>error.code==='CONSENT_REQUIRED');
});

test('all twelve sign rules stay distinct where the underlying tables are distinct',async()=>{
 const {matchingBehaviourReading}=await import('../apps/rashifal-kundli/frontend/matching-behaviour.mjs');
 for(const language of ['en','hi','gu']){
  const emotions=new Set(),relationships=new Set();
  for(let sign=1;sign<=12;sign++){
   const items=matchingBehaviourReading([{status:'available',moon:{sign,house:1},seventh:{house:7,sign}}],language).people[0].items;
   emotions.add(items[0].text);relationships.add(items[1].text);assert.equal(items[0].basis.sign,sign);assert.equal(items[1].basis.sign,sign);
  }
  assert.equal(emotions.size,12);assert.equal(relationships.size,4);
 }
});
