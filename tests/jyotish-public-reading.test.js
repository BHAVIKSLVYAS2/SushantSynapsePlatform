const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},now=Date.parse('2026-11-23T06:00Z');
const jargon=/चंद्र राशि से भाव|भाव \d|भावेश|गणना-बिंदु|पूर्ण-राशि|अस्त-सीमा|गोचर-संदर्भ|\dवें भाव/;
test('mixed readings use both stable observations and only order distinct weekly samples',async()=>{
 const {leadingTransit}=await import('../apps/rashifal-kundli/frontend/jyotish-public-reading.mjs');
 const samples=[{house:3,status:'supportive',at:'2026-11-23T06:00Z'},{house:4,status:'obstructed',at:'2026-11-25T06:00Z'}];
 const mixed=()=>leadingTransit([{body:'Mars',observations:samples}],'mixed','weekly','en');
 assert.match(mixed(),/Earlier observations.*support.*communication.*Nov 25.*caution.*home responsibilities/);
 samples.push({...samples[0],at:'2026-11-26T06:00Z'});
 assert.doesNotMatch(mixed(),/Earlier observations/);
 samples[1].nearBoundary=true;
 assert.doesNotMatch(mixed(),/home responsibilities/);
});
test('unresolved evidence stays visible beside supportive outcomes and in the overview',async()=>{
 const {publicRashiSections}=await import('../apps/rashifal-kundli/frontend/jyotish-public-reading.mjs');
 const sections=['overall','work','money','relationships','wellbeing'].map(id=>({id,title:id,paragraphs:[{findingIds:['known','pending']}]}));
 const counts=(supportive,uncertain)=>({supportive,uncertain,obstructed:0,'rule-unresolved':0});
 const result=publicRashiSections(sections,[{id:'known',counts:counts(8,0)},{id:'pending',counts:counts(0,8)}]);
 assert.equal(result[1].publicState,'support');assert.equal(result[1].publicUncertain,true);
 assert.match(result[1].publicParagraphs[0].text,/अनिश्चित/);
 assert.match(result[0].publicParagraphs[0].text,/अनिश्चित/);
 assert.doesNotMatch(result[0].publicParagraphs[0].text,/तैयार बात को आगे/);
});
test('public natal interpretation is substantive, traceable and different from the technical placement list',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs'),{buildJyotishIntelligence}=await import('../apps/rashifal-kundli/frontend/jyotish-intelligence.mjs');
 const careers=new Set();for(const hour of [0,4,8,12,16,20]){const model=buildJyotishIntelligence(calculateBirthReport({...input,localTime:String(hour).padStart(2,'0')+':15'},{now}));assert(model.quality.valid);const sections=model.sections.filter(s=>s.publicParagraphs.length);assert.equal(sections.length,12);for(const s of sections)for(const p of s.publicParagraphs){assert.doesNotMatch(p.text,jargon);assert(p.findingIds.length);assert(p.findingIds.every(id=>model.findings.some(f=>f.id===id)));}const career=sections.find(s=>s.id==='career');assert.match(career.publicParagraphs[0].text,/दसवें भाव के स्वामी/);assert.notEqual(career.publicParagraphs[0].text,career.paragraphs[0].text);careers.add(career.publicParagraphs.map(p=>p.text).join(' '));assert.equal(model.sections.find(s=>s.id==='stages').publicParagraphs.length,0);assert.equal(model.sections.find(s=>s.id==='conclusion').publicParagraphs.length,0);}
 assert(careers.size>=3);
});
test('Rashifal public outcomes preserve supportive/mixed/neutral/uncertain distinctions without presenting neutral as bad',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs'),{rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs'),{publicRashiSections}=await import('../apps/rashifal-kundli/frontend/jyotish-public-reading.mjs');
 const service=createRashifalService();for(const view of ['today','tomorrow','weekly'])for(let rashi=1;rashi<=12;rashi++){const m=service.getReading({rashi,view,language:'hi',ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId},{now}).reading.intelligence;assert(m.quality.valid);assert.equal(m.sections.length,5);assert.equal(m.sections[0].publicTitle,{today:'आज की दिशा',tomorrow:'कल की दिशा',weekly:'सप्ताह की दिशा'}[view]);for(const s of m.sections){assert(s.publicParagraphs.length);assert.doesNotMatch(s.publicParagraphs.map(p=>p.text).join(' '),jargon);if(view==='weekly')assert.doesNotMatch(s.publicParagraphs[0].text,/आज/);}}
 const m=service.getReading({rashi:1,view:'today',language:'hi',ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId},{now}).reading.intelligence;let texts=new Set();for(const status of ['supportive','obstructed','outside-favorable','uncertain']){const findings=structuredClone(m.findings);for(const f of findings){for(const k of Object.keys(f.counts))f.counts[k]=0;f.counts[status]=8;}const sections=publicRashiSections(m.sections,findings),work=sections.find(s=>s.id==='work');texts.add(work.publicParagraphs[0].text);assert.equal(work.publicState,{supportive:'support',obstructed:'review','outside-favorable':'neutral',uncertain:'uncertain'}[status]);}assert.equal(texts.size,4);
});
test('public and practitioner exports explicitly select their reading and retain identical chart values',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs'),{projectExport,reportMarkup}=await import('../apps/rashifal-kundli/frontend/export-report.mjs'),report=calculateBirthReport(input,{now}),before=JSON.stringify(report),simple=projectExport(report,{language:'hi'}),detailed=projectExport(report,{language:'hi',readingAudience:'pandit'});
 assert.equal(simple.everyday.topics.length,12);assert.equal(detailed.everyday.topics.length,14);assert.deepEqual(simple.features,detailed.features);assert.doesNotMatch(simple.everyday.topics.map(s=>s.paragraphs.join(' ')).join(' '),jargon);assert(!reportMarkup(simple).includes('report-reading-basis'));assert(reportMarkup(simple).includes('report-simple-chart'));assert(reportMarkup(detailed).includes('report-reading-basis'));assert.equal(JSON.stringify(report),before);assert.throws(()=>projectExport(report,{readingAudience:'wrong'}));
 const unknown=projectExport(calculateBirthReport({...input,timeAccuracy:'unknown',localTime:undefined},{now}),{language:'hi'});assert.equal(unknown.everyday.topics.length,1);assert.equal(unknown.everyday.topics[0].status,'unavailable');assert.equal(unknown.everyday.topics[0].id,'availability');
});
test('public future reports show which subjects carry over instead of repeating their advice',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const {projectExport,reportMarkup}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const report=calculateBirthReport(input,{now});
 for(const language of ['hi','en','gu']){
  const simple=projectExport(report,{language}),pandit=projectExport(report,{language,readingAudience:'pandit'});
  const future=language==='hi'?simple.everyday.topics.find(t=>t.id==='future'):simple.everyday.future;
  assert.equal(future.paragraphs.length,3);
  if(language==='hi'){
   assert.match(future.paragraphs[0],/^वर्तमान अवधि .*अंतर्दशा चल रही है।/u);
   for(const paragraph of future.paragraphs.slice(1))assert.match(paragraph,/^आगामी अवधि .*अंतर्दशा रहेगी।/u);
  }
  assert.equal(new Set(future.paragraphs.map(text=>text.slice(text.indexOf('·')+1).replace(/\p{Number}+/gu,''))).size,3);
  assert.match(reportMarkup(simple),/data-reading-topic="future"/);
  assert.doesNotMatch(reportMarkup(simple),/data-report-section="dasha"/);
  assert.match(reportMarkup(pandit),/data-report-section="dasha"/);
 }
});
test('Hindi tomorrow and today on the same IST date share calculations and keep their own titles',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');
 const {rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const request={rashi:1,language:'hi',ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId};
 const service=createRashifalService();
 const tomorrow=service.getReading({...request,view:'tomorrow'},{now});
 const today=service.getReading({...request,view:'today'},{now:now+86400000});
 assert.equal(tomorrow.reading.period.editorialDate,today.reading.period.editorialDate);
 assert.deepEqual(tomorrow.reading.samples,today.reading.samples);
 assert.equal(today.cache.factorCount,tomorrow.cache.factorCount);
 assert.equal(tomorrow.reading.intelligence.sections[0].publicTitle,'कल की दिशा');
 assert.equal(today.reading.intelligence.sections[0].publicTitle,'आज की दिशा');
});

test('a secondary house alone cannot trigger a home prediction',async()=>{
 const {rankedPeriodTopics}=await import('../apps/rashifal-kundli/frontend/jyotish-synthesis.mjs');
 const topics=[{id:'home',houses:[4,9,12],priority:1},{id:'spirituality',houses:[9,12],priority:1}];
 const snapshot={houses:[{number:4,ruler:'Mercury'},{number:9,ruler:'Saturn'}],planets:[{body:'Rahu',house:9}]};
 const calculate=()=>rankedPeriodTopics(snapshot,topics,{major:'Rahu',minor:'Rahu'});
 assert.deepEqual(calculate().map(t=>t.topic),['spirituality']);
 snapshot.planets[0].house=4;
 const home=calculate().find(t=>t.topic==='home');
 assert.deepEqual(home.connections[0].links,[{kind:'occupant',house:4}]);
 snapshot.planets[0].house=9;
 assert.equal(calculate().some(t=>t.topic==='home'),false);
});

test('shared placements retain distinct meanings for career, partnership, money and family',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const {projectExport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const report=calculateBirthReport({...input,localDate:'1989-03-11',localTime:'14:00',placeId:'geonames:1272201'},{now});
 const topics=projectExport(report,{language:'hi'}).everyday.topics;
 const paragraph=id=>topics.find(t=>t.id===id).paragraphs[0];
 assert.match(paragraph('career'),/गुरु.*बारहवें भाव.*दूर बैठी टीम/);
 assert.match(paragraph('relationships'),/गुरु.*बारहवें भाव.*निजी समय और दूरी/);
 assert.match(paragraph('money'),/चंद्र.*ग्यारहवें भाव.*आय संचित धन/);
 assert.match(paragraph('family'),/चंद्र.*ग्यारहवें भाव.*परिवार का सहारा/);
});
