const {test}=require('node:test'),assert=require('node:assert/strict');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
const context={now:Date.parse('2026-10-24T12:00:00Z')};
test('birth report composes independently available exact features and preserves source provenance',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const r=calculateBirthReport(input,context);for(const f of Object.values(r.features))assert.equal(f.status,'available');
 assert.equal(r.birth.place.id,input.placeId);assert.equal(r.birth.timeZoneId,'Asia/Kolkata');assert.ok(Object.isFrozen(r.features.d1.value));
});
test('a withheld D9 leaves D1, positions and Dasha available',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const r=calculateBirthReport({...input,localTime:'12:00'},context);
 assert.equal(r.features.d1.status,'available');assert.equal(r.features.d9.status,'unavailable');
 assert.equal(r.features.d9.diagnostic.code,'UNSTABLE_BIRTH_TIME');assert.equal(r.features.positions.status,'available');assert.equal(r.features.dasha.status,'available');
});
test('unknown/approximate inputs retain intervals without an invented instant or precise feature',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 for(const timeAccuracy of ['unknown','approximate']){const p={...input,timeAccuracy};if(timeAccuracy==='unknown')delete p.localTime;else p.precisionOfBirthTimeMinutes=10;
  const r=calculateBirthReport(p,context);assert.equal(r.birth.utcInstant,null);assert.ok(r.birth.interval);
  for(const f of Object.values(r.features))assert.equal(f.status,'unavailable');
 }
});
test('all three interface languages have complete labels and identical numeric results',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const {languages,signName,bodyName,locale}=await import('../apps/rashifal-kundli/frontend/locale.mjs');
 const expected=calculateBirthReport(input,context);
 for(const language of ['en','hi','gu']){
  assert.deepEqual(Object.keys(languages[language]).sort(),Object.keys(languages.en).sort());
  const result=calculateBirthReport({...input,language},context);assert.deepEqual(result.features,expected.features);
  assert.ok(signName(1,language));assert.ok(bodyName('Rahu',language));
 }
 assert.throws(()=>locale('other'));
});
test('global admission errors remain errors rather than being masked as partial results',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 for(const change of [{localDate:'2098-01-01'},{placeId:'New Delhi'},{localDate:'2000-02-30'},{name:'private-name'}])
  assert.throws(()=>calculateBirthReport({...input,...change},context),e=>e.name==='VedicInputError'&&!JSON.stringify(e).includes('private-name'));
});
