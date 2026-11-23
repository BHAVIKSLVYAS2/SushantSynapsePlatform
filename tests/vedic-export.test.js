const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
const context={now:Date.parse('2026-10-24T12:00Z')};

test('consultation prose covers every sign, house ruler and Dasha pair without broken fragments',async()=>{
 const {composeKundliTopic,composeKundliPeriod}=await import('../apps/rashifal-kundli/frontend/kundli-reading-prose.mjs');
 const {signRulers}=await import('../apps/rashifal-kundli/frontend/kundli-reading.mjs');
 const lords=[...new Set(signRulers),'Rahu','Ketu'];
 for(const language of ['en','hi','gu']){
  const script=language==='hi'?/[\u0900-\u097f]/:language==='gu'?/[\u0a80-\u0aff]/:/[a-z]/i;
  const check=text=>{assert.match(text,script);assert.match(text,/[.!।]$/);assert.doesNotMatch(text,/undefined|null|\[object Object\]|: *[.।]/);};
  for(let sign=1;sign<=12;sign++)for(const id of ['personality','appearance','career','money','relationships','learning','home']){
   const data={sign,moon:sign,rising:sign,ruler:signRulers[sign-1]};
   const prose=composeKundliTopic(id,data,language);prose.paragraphs.forEach(check);
   assert.equal(prose.action,null);assert.ok(prose.paragraphs.join(' ').length>80);
   assert.doesNotMatch(prose.paragraphs.join(' '),/traditional theme for your resources|पारंपरिक विषय है:|પરંપરાગત વિષય છે:/);
  }
  for(const major of lords)for(const minor of lords)check(composeKundliPeriod({major,minor},language));
  assert.equal(composeKundliTopic('career',null,language).paragraphs.length,1);
 }
 assert.throws(()=>composeKundliTopic('career',{},'fr'),/Unsupported/);
});
test('Hindi and Gujarati exports include the same everyday reading as the screen without changing chart values',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const {buildKundliReading}=await import('../apps/rashifal-kundli/frontend/kundli-reading.mjs');
 const {composeKundliTopic}=await import('../apps/rashifal-kundli/frontend/kundli-reading-prose.mjs');
 const report=await setup(),before=JSON.stringify(report),baseline=projectExport(report),reading=buildKundliReading(report);
 for(const language of ['hi','gu']){const model=projectExport(report,{language}),html=standaloneReport(model),script=language==='hi'?/[\u0900-\u097f]/:/[\u0a80-\u0aff]/;
  assert.equal(model.everyday.topics.length,language==='hi'?12:7);if(language==='hi')assert(model.everyday.version.includes('public-consultation'));else assert.equal(model.everyday.version,'kundli-prose-5');assert.deepEqual(model.features,baseline.features);
  for(const topic of model.everyday.topics){assert.match(topic.title,script);if(language==='hi'){const {buildJyotishIntelligence}=await import('../apps/rashifal-kundli/frontend/jyotish-intelligence.mjs');assert.deepEqual(topic.paragraphs,buildJyotishIntelligence(report).sections.find(s=>s.id===topic.id).publicParagraphs.map(p=>p.text));}else assert.deepEqual(topic.paragraphs,composeKundliTopic(topic.id,reading.topics[topic.id],language).paragraphs);for(const text of topic.paragraphs){assert.match(text,script);assert.match(text,/[.!।]$/);assert.ok(html.includes(text));}}
  assert.ok(html.includes('lang="'+language+'"'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('Private Person'));
 }assert.equal(JSON.stringify(report),before);
});
async function setup(p=input){const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');return calculateBirthReport(p,context);}
test('redacted export projects no birth identity, observer coordinates or hidden time objects',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');const r=await setup();
 const model=projectExport(r,{name:'Private Person'}),serialized=JSON.stringify(model),html=standaloneReport(model);
 for(const secret of ['Private Person',input.localDate,input.localTime,input.placeId,r.birth.place.label,r.birth.utcInstant]){assert.ok(!serialized.includes(secret),secret);assert.ok(!html.includes(secret),secret);}
 for(const field of ['identity','observer','ttJulianDay','localDate','latitude','longitude'])assert.ok(!Object.hasOwn(model,field));
 assert.ok(!serialized.includes('ttJulianDay'));assert.ok(!serialized.includes('latitude'));
 assert.equal(model.redacted,true);assert.equal(model.provenance.profile,input.calculationProfileId);
 assert.ok(html.includes('engineSha256'));assert.ok(html.includes('not chart values'));
 assert.ok(!html.includes('<script'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));
});
test('identifiable export is explicit, safely escaped and does not modify original report',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');const r=await setup(),before=JSON.stringify(r);
 const m=projectExport(r,{includeIdentity:true,name:'<img src=x onerror=alert(1)>'});
 assert.equal(m.identity.utc,r.birth.utcInstant);assert.equal(m.identity.localTime,'12:15');assert.equal(m.redacted,false);
 const html=standaloneReport(m);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.equal(JSON.stringify(r),before);
 assert.throws(()=>projectExport(r,{includeIdentity:'true'}));assert.throws(()=>projectExport(r,{name:'bad\nname'}));
 assert.equal(projectExport(r).identity,undefined);
});
test('export retains numeric chart and all 81 child-period boundaries without recomputation',async()=>{
 const {projectExport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');const r=await setup(),m=projectExport(r);
 for(const key of ['d1','d9']){const source=r.features[key].value,target=m.features[key];assert.equal(target.houses.length,12);assert.equal(target.planets.length,9);
  source.planets.forEach((p,i)=>{assert.equal(target.planets[i].house,p.houseNumber);assert.equal(target.planets[i].longitude,key==='d1'?p.siderealLongitude:p.sourceSiderealLongitude);});}
 const ds=r.features.dasha.value;assert.equal(m.features.dasha.majors.flatMap(m=>m.children).length,81);
 ds.mahadashas.forEach((p,i)=>p.antardashas.forEach((c,j)=>assert.equal(m.features.dasha.majors[i].children[j].start.utc,c.start.utcInstant)));
});
test('partial and unknown reports preserve safe withholding and optional identity intervals',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const partial=projectExport(await setup({...input,localTime:'12:00'}));assert.equal(partial.features.d1.status,'available');assert.equal(partial.features.d9.status,'unavailable');
 const unknown={...input,timeAccuracy:'unknown'};delete unknown.localTime;const r=await setup(unknown),m=projectExport(r);
 assert.ok(Object.values(m.features).every(f=>f.status==='unavailable'));assert.ok(standaloneReport(m).includes('UNSTABLE_BIRTH_TIME'));
 const identity=projectExport(r,{includeIdentity:true}).identity;assert.equal(identity.utc,null);assert.equal(identity.localTime,null);assert.ok(identity.interval.start);
});
test('all report languages preserve numbers and complete labels',async()=>{
 const {projectExport,standaloneReport,exportLabels}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');const r=await setup(),expected=projectExport(r);
 for(const language of ['en','hi','gu']){const m=projectExport(r,{language});assert.deepEqual(m.features,expected.features);assert.deepEqual(Object.keys(exportLabels[language]),Object.keys(exportLabels.en));assert.ok(!standaloneReport(m).includes('undefined'));assert.doesNotMatch(standaloneReport(m),/docs\/vedic|acceptance evidence|repository/i);assert.match(standaloneReport(m),/GeoNames/);}
});

test('report charts reuse selected layout and include new calculated sections in all languages',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const {advancedForBirth}=await import('../packages/vedic/birth-advanced.mjs');
 const report=await setup(),before=JSON.stringify(report),advanced=advancedForBirth(input,context);
 for(const language of ['en','hi','gu'])for(const chartStyle of ['north','south']){
  const model=projectExport(report,{language,chartStyle,selectedChart:'Chandra',includeAdvanced:true,advanced}),html=standaloneReport(model);
  assert.equal(model.chartStyle,chartStyle);assert.equal(model.extras.calendar.status,'available');assert.equal(model.extras.future.length,3);
  assert.ok(model.extras.strength.uccha.length);assert.equal(model.extras.strength.av.bav.length,7);
  for(const key of ['chandra','d2','d16','d7','d10','d12'])assert.ok(model.extras.charts[key]);
  assert.ok(html.includes('data-chart="chandra" data-style="'+chartStyle+'"'));
  assert.ok(html.includes(chartStyle==='north'?'<polygon points=':'<rect x='));
  assert.ok(!html.includes(chartStyle==='north'?'<rect x=':'<polygon points='));
  assert.ok(html.indexOf('data-report-section="chandra"')<html.indexOf('data-report-section="d1"'));
  for(const key of ['panchang','future','advanced'])assert.ok(html.includes('data-report-section="'+key+'"'));
  assert.doesNotMatch(html,/undefined|NaN|\[object Object\]/);assert.ok(!JSON.stringify(model).includes(input.placeId));
 }
 assert.equal(JSON.stringify(report),before);assert.equal(projectExport(report,{advanced}).extras.strength,null);
 assert.throws(()=>projectExport(report,{chartStyle:'unsupported'}));
});

test('time-sensitive export previews require explicit inclusion and keep strict feature withholding',async()=>{
 const {projectExport,standaloneReport}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');
 const report=await setup({...input,localTime:'12:00'}),strict=projectExport(report),preview=projectExport(report,{includePreviews:true});
 assert.equal(strict.features.d9.status,'unavailable');assert.equal(strict.extras.charts.d9,undefined);
 assert.equal(preview.features.d9.status,'unavailable');assert.equal(preview.extras.charts.d9.sensitive,true);
 assert.match(standaloneReport(preview),/Recorded-instant preview only/);
 const unknown=await setup({...input,timeAccuracy:'unknown',localTime:undefined});
 assert.equal(projectExport(unknown,{includePreviews:true}).extras.charts.d9,undefined);
});
