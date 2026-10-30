const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
const context={now:Date.parse('2026-10-30T12:00Z')};

test('Kundli prose changes with actual ruler placement and occupants, in all languages and exports',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const {buildKundliReading}=await import('../apps/rashifal-kundli/frontend/kundli-reading.mjs');
 const {composeKundliTopic,composeKundliPeriod}=await import('../apps/rashifal-kundli/frontend/kundli-reading-prose.mjs');
 const {projectExport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const {bodyName,signName}=await import('../apps/rashifal-kundli/frontend/locale.mjs');
 const report=calculateBirthReport(input,context),before=JSON.stringify(report),reading=buildKundliReading(report),chart=report.features.d1.value;
 for(const lang of ['en','hi','gu']){
  for(const [id,data]of Object.entries(reading.topics).filter(([id])=>id!=='personality')){
   const prose=composeKundliTopic(id,data,lang),text=prose.paragraphs.join(' '),changed=composeKundliTopic(id,{...data,rulerHouse:data.rulerHouse%12+1},lang);
   assert.notDeepEqual(prose.paragraphs,changed.paragraphs,'placement must affect '+id);
   assert.ok(text.includes(bodyName(data.ruler,lang)));assert.ok(text.includes(signName(data.rulerSign,lang)));
   for(const occupant of data.occupants)assert.ok(text.includes(bodyName(occupant,lang)));
   const exported=projectExport(report,{language:lang}).everyday.topics.find(t=>t.id===id);assert.deepEqual(exported.paragraphs,prose.paragraphs);
  }
  for(const period of reading.periods){
   const text=composeKundliPeriod(period,lang);
   for(const p of period.placements){const planet=chart.planets.find(v=>v.body===p.body);assert.equal(p.house,planet.houseNumber);assert.equal(p.sign,planet.rashi);assert.ok(text.includes(signName(p.sign,lang)));}
  }
 }
 const unknown=buildKundliReading(calculateBirthReport({...input,timeAccuracy:'unknown',localTime:undefined},context));
 assert.equal(unknown.limits.houseReading,false);assert.equal(unknown.topics.career,null);assert.ok(unknown.periods.every(p=>p.placements.length===0));
 assert.equal(JSON.stringify(report),before);
});

test('Rashifal planetary basis binds each house to its actual status and blockers rather than mixing samples',async()=>{
 const {transitReadingBasis}=await import('../apps/rashifal-kundli/frontend/planet-reading.mjs');
 const observations=[{status:'supportive',relativeHouse:2,blockers:[]},{status:'obstructed',relativeHouse:5,blockers:['Mars']},{status:'outside-favorable',relativeHouse:4,blockers:['Sun']}];
 for(const lang of ['en','hi','gu']){
  const result=transitReadingBasis([{body:'Jupiter',observations}],lang,['Jupiter','Jupiter']);
  assert.equal(result.items.length,1);assert.deepEqual(result.items[0].groups,[{status:'supportive',houses:[2]},{status:'obstructed',houses:[5]},{status:'outside-favorable',houses:[4]}]);
  assert.deepEqual(result.items[0].blockers,['Mars']);assert.doesNotMatch(result.items[0].text,/all week|throughout|percent|%/);
 }
});

test('daily and weekly readings for all twelve Moon signs retain a verifiable planet basis',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs'),{rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const service=createRashifalService();
 for(const view of ['today','weekly'])for(let rashi=1;rashi<=12;rashi++)for(const language of ['en','hi','gu']){
  const r=service.getReading({rashi,language,view,ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId},context).reading;
  const basis=r.outlook.everyday.planetaryBasis;assert.ok(basis.items.some(i=>i.body==='Moon'));
  for(const item of basis.items){const actual=r.grahas.find(g=>g.body===item.body);for(const group of item.groups)for(const house of group.houses)assert.ok(actual.observations.some(o=>o.status===group.status&&o.relativeHouse===house));}
 }
});

test('matching keeps classification alternatives even when their score is stable',async()=>{
 const {screenedMatching}=await import('../packages/vedic/matching-screen.mjs'),{matchingStory}=await import('../apps/rashifal-kundli/frontend/matching-story.mjs');
 let stableAlternative=false;
 for(const a of [0,30,40/3])for(const b of [15,105,225]){
  const result=screenedMatching({personAMoonLongitude:a,personBMoonLongitude:b,rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'});
  for(const language of ['en','hi','gu']){const story=matchingStory(result,language);assert.equal(story.items.length,8);assert.ok(story.limit);
   for(const item of story.items)if(item.component.factorOptions?.length>1){if(item.state!=='uncertain')stableAlternative=true;if(language==='en'){assert.match(item.text,/multiple possibilities/);assert.doesNotMatch(item.text,/Person A’s Moon-sign ruler is|The reduced Tara classes are|Person A:/);}}
  }
 }
 assert.ok(stableAlternative,'fixture must cover stable scores with changing factor classifications');
});

test('matching chart context has explicit consent, correct partnership placements and independent withholding',async()=>{
 const {buildMatchingChartContext,matchingChartReading}=await import('../apps/rashifal-kundli/frontend/matching-chart-reading.mjs');
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs');
 const {matchingForBirths}=await import('../packages/vedic/birth-matching.mjs');
 const nested=new Proxy([],{get(){throw Error('must not read');}});
 assert.throws(()=>buildMatchingChartContext({consent:false,inputs:nested},context),e=>e.code==='CONSENT_REQUIRED');
 const pair=[input,{...input,localDate:'2000-01-02',localTime:'14:34'}],result=buildMatchingChartContext({consent:true,inputs:pair},context),chart=birthChartForBirth(input,context).chart;
 assert.equal(result[0].status,'available');assert.equal(result[0].seventh.sign,chart.houses[6].rashi);
 for(const p of result[0].planets){const actual=chart.planets.find(v=>v.body===p.body);assert.equal(p.house,actual.houseNumber);assert.equal(p.sign,actual.rashi);}
 assert.deepEqual(result[1],{status:'unavailable'});
 const guna=matchingForBirths({consent:true,personA:pair[0],personB:pair[1],rulebookId:'SYNAPSE_ASHTAKOOTA_COMPOSITE_V1'},context);
 assert.equal(guna.matching.components.length,8);assert.ok(guna.matching.boundaryScreen);
 for(const language of ['en','hi','gu']){const reading=matchingChartReading(result,language);assert.equal(reading.people.length,2);assert.ok(reading.people[0].paragraphs.length>=4);assert.equal(reading.people[1].paragraphs.length,1);}
 const serialized=JSON.stringify(result);for(const secret of [input.localDate,input.localTime,input.placeId,'latitude','utcInstant'])assert.ok(!serialized.includes(secret));
});
