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
  assert.equal(model.everyday.topics.length,7);assert.equal(model.everyday.version,'kundli-prose-4');assert.deepEqual(model.features,baseline.features);
  for(const topic of model.everyday.topics){assert.match(topic.title,script);assert.deepEqual(topic.paragraphs,composeKundliTopic(topic.id,reading.topics[topic.id],language).paragraphs);for(const text of topic.paragraphs){assert.match(text,script);assert.match(text,/[.!।]$/);assert.ok(html.includes(text));}}
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
 for(const language of ['en','hi','gu']){const m=projectExport(r,{language});assert.deepEqual(m.features,expected.features);assert.deepEqual(Object.keys(exportLabels[language]),Object.keys(exportLabels.en));assert.ok(!standaloneReport(m).includes('undefined'));}
});
