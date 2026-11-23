const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},now=Date.parse('2026-11-23T06:00Z');
const jargon=/चंद्र राशि से भाव|भाव \d|भावेश|गणना-बिंदु|पूर्ण-राशि|अस्त-सीमा|गोचर-संदर्भ|\dवें भाव/;
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
 const careers=new Set();for(const hour of [0,4,8,12,16,20]){const model=buildJyotishIntelligence(calculateBirthReport({...input,localTime:String(hour).padStart(2,'0')+':15'},{now}));assert(model.quality.valid);const sections=model.sections.filter(s=>s.publicParagraphs.length);assert.equal(sections.length,12);for(const s of sections)for(const p of s.publicParagraphs){assert.doesNotMatch(p.text,jargon);assert(p.findingIds.length);assert(p.findingIds.every(id=>model.findings.some(f=>f.id===id)));}const career=sections.find(s=>s.id==='career');assert(career.publicParagraphs[0].text.length>120);assert.notEqual(career.publicParagraphs[0].text,career.paragraphs[0].text);careers.add(career.publicParagraphs.map(p=>p.text).join(' '));assert.equal(model.sections.find(s=>s.id==='stages').publicParagraphs.length,0);assert.equal(model.sections.find(s=>s.id==='conclusion').publicParagraphs.length,0);}
 assert(careers.size>=3);
});
test('Rashifal public outcomes preserve supportive/mixed/neutral/uncertain distinctions without presenting neutral as bad',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs'),{rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs'),{publicRashiSections}=await import('../apps/rashifal-kundli/frontend/jyotish-public-reading.mjs');
 const service=createRashifalService();for(const view of ['today','weekly'])for(let rashi=1;rashi<=12;rashi++){const m=service.getReading({rashi,view,language:'hi',ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId},{now}).reading.intelligence;assert(m.quality.valid);assert.equal(m.sections.length,5);for(const s of m.sections){assert(s.publicParagraphs.length);assert.doesNotMatch(s.publicParagraphs.map(p=>p.text).join(' '),jargon);if(view==='weekly')assert.doesNotMatch(s.publicParagraphs[0].text,/आज/);}}
 const m=service.getReading({rashi:1,view:'today',language:'hi',ruleVersion:rashifalLibrary.version,calculationProfileId:input.calculationProfileId},{now}).reading.intelligence;let texts=new Set();for(const status of ['supportive','obstructed','outside-favorable','uncertain']){const findings=structuredClone(m.findings);for(const f of findings){for(const k of Object.keys(f.counts))f.counts[k]=0;f.counts[status]=8;}const sections=publicRashiSections(m.sections,findings),work=sections.find(s=>s.id==='work');texts.add(work.publicParagraphs[0].text);assert.equal(work.publicState,{supportive:'support',obstructed:'review','outside-favorable':'neutral',uncertain:'uncertain'}[status]);}assert.equal(texts.size,4);
});
test('public and practitioner exports explicitly select their reading and retain identical chart values',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs'),{projectExport,reportMarkup}=await import('../apps/rashifal-kundli/frontend/export-report.mjs'),report=calculateBirthReport(input,{now}),before=JSON.stringify(report),simple=projectExport(report,{language:'hi'}),detailed=projectExport(report,{language:'hi',readingAudience:'pandit'});
 assert.equal(simple.everyday.topics.length,12);assert.equal(detailed.everyday.topics.length,14);assert.deepEqual(simple.features,detailed.features);assert.doesNotMatch(simple.everyday.topics.map(s=>s.paragraphs.join(' ')).join(' '),jargon);assert(!reportMarkup(simple).includes('report-reading-basis'));assert(reportMarkup(simple).includes('report-simple-chart'));assert(reportMarkup(detailed).includes('report-reading-basis'));assert.equal(JSON.stringify(report),before);assert.throws(()=>projectExport(report,{readingAudience:'wrong'}));
 const unknown=projectExport(calculateBirthReport({...input,timeAccuracy:'unknown',localTime:undefined},{now}),{language:'hi'});assert.equal(unknown.everyday.topics.length,1);assert.equal(unknown.everyday.topics[0].status,'unavailable');assert.equal(unknown.everyday.topics[0].id,'availability');
});
