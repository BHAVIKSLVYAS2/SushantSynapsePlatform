const {test}=require('node:test'),assert=require('node:assert/strict');
const request={rashi:1,view:'today',language:'en',ruleVersion:'rashifal-gochar-4',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
const now=Date.parse('2026-10-24T12:00Z');
test('P12 IST day/tomorrow and Monday weeks cross UTC/year/leap boundaries explicitly',async()=>{
 const {rashifalPeriod:f}=await import('../packages/vedic/rashifal-factors.mjs');
 assert.equal(f({view:'today',now:Date.parse('2026-12-31T18:29:59.999Z')}).editorialDate,'2026-12-31');
 assert.equal(f({view:'today',now:Date.parse('2026-12-31T18:30:00Z')}).editorialDate,'2027-01-01');
 assert.equal(f({view:'tomorrow',now:Date.parse('2024-02-28T12:00Z')}).editorialDate,'2024-02-29');
 const week=f({view:'weekly',now:Date.parse('2027-01-03T12:00Z')});assert.equal(week.dates[0],'2026-12-28');assert.equal(week.dates[6],'2027-01-03');assert.equal(week.startUtc,'2026-12-27T18:30:00.000Z');
 assert.throws(()=>f({view:'tomorrow',now:Date.parse('2098-12-31T12:00Z')}),e=>e.code==='OUT_OF_RANGE');
 assert.throws(()=>f({view:'weekly',now:Date.parse('1950-01-01T12:00Z')}),e=>e.code==='OUT_OF_RANGE');
 assert.throws(()=>f({view:'today',now:NaN}));
});
test('P12 all twelve Chandra signs use the same P04 noon Moon and correct relative sign counts',async()=>{
 const {rashifalMoonFactor:f}=await import('../packages/vedic/rashifal-factors.mjs'),{siderealSnapshot}=await import('../packages/vedic/sidereal.mjs');
 const expected=siderealSnapshot({timeScale:'UTC',utcInstant:'2026-10-24T06:30:00Z',bodies:['Moon'],calculationProfileId:request.calculationProfileId}).positions[0];
 for(let rashi=1;rashi<=12;rashi++){const factor=f({localDate:'2026-10-24',rashi,calculationProfileId:request.calculationProfileId});assert.equal(factor.moonRashi,expected.rashi);assert.equal(factor.moonSiderealLongitude,expected.siderealLongitude);assert.equal(factor.relativeHouse,(expected.rashi-rashi+12)%12+1);}
});
test('calculated readings expose nine grahas, eight daily observations and stable evidence IDs',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');
 const a=createRashifalService(),b=createRashifalService();
 for(let rashi=1;rashi<=12;rashi++)for(const view of ['today','tomorrow','weekly']){const x=a.getReading({...request,rashi,view},{now}).reading,y=b.getReading({...request,rashi,view},{now}).reading;
  assert.deepEqual(x,y);assert.equal(x.sections.length,2);assert.equal(x.factors.length,view==='weekly'?7:1);assert.equal(x.publication.publishedAt,null);assert.equal(x.publication.status,'draft-not-published');
  assert.equal(x.grahas.length,9);assert.equal(x.samples.length,view==='weekly'?56:8);
  assert.deepEqual(x.sections.map(s=>s.category),['overview','observations']);
  assert.equal(x.sections[0].items.length,1);assert.equal(x.sections[1].items.length,9);
  assert.deepEqual(x.sections[1].items.map(i=>i.body),x.grahas.map(g=>g.body));
  for(const s of x.sections){assert.equal(new Set(s.items.map(x=>x.id)).size,s.items.length);}
 }
});

test('reading summary distinguishes stable, changing and withheld results without turning sample counts into predictions',async()=>{
 const {editorialSections}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs');
 const grahas=[{body:'Moon',houses:[1,2],counts:{supportive:4,uncertain:4},sampleCount:8,observations:[{blockers:[]}]},
  {body:'Mercury',houses:[11],counts:{'rule-unresolved':8},sampleCount:8,observations:[{blockers:[]}]}];
 const {sections}=editorialSections(grahas,'en'),summary=sections[0].items[0].text,items=sections[1].items;
 assert.match(summary,/Classifications vary across observations: Moon/);
 assert.match(summary,/Assessment withheld because the rule is unresolved: Mercury/);
 assert.match(items[0].text,/near a sign boundary/);assert.match(items[0].text,/exact change times are not calculated/);
 assert.doesNotMatch(summary,/Favourable and unobstructed at every observation: Moon/);
 assert.doesNotMatch(JSON.stringify(sections),/4\/8|50%|career|money|relationships|wellbeing/);
});
test('P12 cache keys separate locale/rashi/period/profile and reuse a canonical tomorrow/today day',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');const service=createRashifalService();
 const first=service.getReading(request,{now});assert.equal(first.cache.hit,false);assert.equal(service.getReading(request,{now:now+1}).cache.hit,true);
 for(const patch of [{rashi:2},{view:'weekly'},{language:'hi'}])assert.notEqual(service.getReading({...request,...patch},{now}).cache.key,first.cache.key);
 const tomorrow=service.getReading({...request,view:'tomorrow'},{now});const today=service.getReading(request,{now:now+86400000});assert.equal(today.cache.hit,true);assert.equal(tomorrow.cache.key,today.cache.key);assert.deepEqual(tomorrow.reading,today.reading);
 service.clear();assert.equal(service.getReading(request,{now}).cache.hit,false);
});
test('P12 cache remains bounded and immutable; admission rejects personal fields and unsupported models',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');const service=createRashifalService();let final;
 for(let i=0;i<11;i++)for(let rashi=1;rashi<=12;rashi++){final=service.getReading({...request,rashi},{now:now+i*86400000});assert.ok(final.cache.size<=120);assert.ok(final.cache.factorCount<=56);}
 assert.ok(Object.isFrozen(final.reading.sections));
 for(const patch of [{name:'private'},{localDate:'2000-01-01'},{rashi:0},{rashi:'1'},{language:'xx'}])assert.throws(()=>service.getReading({...request,...patch},{now}),e=>e.code==='INVALID_INPUT');
 for(const patch of [{ruleVersion:'unknown'},{calculationProfileId:'unknown'}])assert.throws(()=>service.getReading({...request,...patch},{now}),e=>e.code==='MODEL_UNAVAILABLE');
 assert.throws(()=>service.getReading({...request,get secret(){throw Error('private');}},{now}),e=>e.code==='INVALID_INPUT');
});
test('Authored Hindi/Gujarati drafts display natively with unchanged factors and explicit pending review',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs'),{rashifalLibrary}=await import('../apps/rashifal-kundli/frontend/rashifal-library.mjs'),{rashifalLabels}=await import('../apps/rashifal-kundli/frontend/rashifal-view.mjs');
 const service=createRashifalService(),english=service.getReading(request,{now}).reading;
 for(const language of ['hi','gu']){const r=service.getReading({...request,language},{now}).reading;assert.equal(r.contentLanguage,language);assert.equal(r.fallback,false);assert.equal(r.translationStatus,'draft-awaiting-independent-review');assert.deepEqual(r.factors,english.factors);assert.deepEqual(r.sections.map(s=>s.items.map(i=>i.id)),english.sections.map(s=>s.items.map(i=>i.id)));assert.notDeepEqual(r.sections,english.sections);assert.deepEqual(Object.keys(rashifalLabels[language]),Object.keys(rashifalLabels.en));assert.doesNotMatch(r.sections.flatMap(s=>s.items.map(i=>i.text)).join(' '),/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)\b/);}
 assert.equal(rashifalLibrary.version,'rashifal-gochar-4');assert.ok(!('groups' in rashifalLibrary));
});

test('all twelve Rashis use their own nine-graha house vectors and never collapse to four generic readings',async()=>{
 const {createRashifalService}=await import('../apps/rashifal-kundli/frontend/rashifal-service.mjs');const service=createRashifalService();
 for(const date of ['2026-10-25T08:30Z','2026-12-31T20:00Z','2027-03-21T04:00Z'])for(const view of ['today','tomorrow','weekly']){
  const signatures=new Set();for(let rashi=1;rashi<=12;rashi++){const {reading:r}=service.getReading({...request,rashi,view},{now:Date.parse(date)});signatures.add(JSON.stringify(r.sections));
   for(const s of r.samples)for(const row of s.rows)assert.equal(row.relativeHouse,(row.rashi-rashi+12)%12+1);
   for(const g of r.grahas)assert.equal(Object.values(g.counts).reduce((a,b)=>a+b,0),r.samples.length);
  }assert.equal(signatures.size,12,date+' '+view);
 }
});
