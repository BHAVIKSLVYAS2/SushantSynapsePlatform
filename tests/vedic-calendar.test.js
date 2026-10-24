const {test}=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./fixtures/vedic-calendar/published.json');
const input={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'},context={now:Date.parse('2026-10-24T12:00Z')};
test('P11 phase roots agree with twelve original PAC new-moon minute facts',async()=>{
 const {lunarPhaseCrossings}=await import('../packages/vedic/lunar-calendar.mjs'),{resolveAstronomyTime}=await import('../packages/vedic/astronomy-time.mjs');
 const jd=s=>resolveAstronomyTime({timeScale:'UTC',utcInstant:s}).ttJulianDay;
 const roots=lunarPhaseCrossings({startTtJulianDay:jd('2026-01-01T00:00:00Z'),endTtJulianDay:jd('2027-01-01T00:00:00Z'),phaseDegrees:0});assert.equal(roots.events.length,12);
 const residuals=roots.events.map((r,i)=>(Date.parse(r.utcInstant)-Date.parse(fixture.newMoonsIst[i]+':00+05:30'))/1000);
 assert.ok(Math.max(...residuals.map(Math.abs))<180,JSON.stringify(residuals));for(const r of roots.events)assert.ok(r.bracketWidthSeconds<=0.5);
 console.log(JSON.stringify({fixture:'PAC-2026-new-moons',residualSeconds:residuals,maxSeconds:Math.max(...residuals.map(Math.abs)),evaluations:roots.evaluations}));
});
test('P11 Amanta identifies PAC Adhika/Nija samples, brackets and search coverage',async()=>{
 const {amantaMonthAtInstant}=await import('../packages/vedic/lunar-calendar.mjs');
 for(const f of fixture.monthFacts){const m=amantaMonthAtInstant({utcInstant:f.instant});assert.equal(m.number,f.number);assert.equal(m.adhika,f.adhika);assert.ok(m.start.upperTtJulianDay<m.end.lowerTtJulianDay);}
 for(const s of ['1950-01-01T00:00:00Z','2098-12-01T00:00:00Z'])assert.throws(()=>amantaMonthAtInstant({utcInstant:s}),e=>e.code==='OUT_OF_RANGE');
 const m=amantaMonthAtInstant({utcInstant:'2026-06-01T12:00:00Z'});assert.throws(()=>amantaMonthAtInstant({utcInstant:m.start.utcInstant}),e=>e.code==='UNSTABLE_BIRTH_TIME');
});
test('P11 sunrise selector handles first/repeated/missing and uncertain endpoints',async()=>{
 const {selectSunriseObservance:s}=await import('../packages/vedic/birth-observance.mjs');
 const base={startMilliseconds:1000,endMilliseconds:5000,guardMilliseconds:0};
 assert.equal(s({...base,sunrises:[]}).status,'missing-at-sunrise');assert.equal(s({...base,sunrises:[]}).selectedDate,null);
 const rises=[{localDate:'2000-01-02',milliseconds:4000},{localDate:'2000-01-01',milliseconds:2000}];
 const r=s({...base,sunrises:rises});assert.equal(r.status,'repeated-at-sunrise');assert.equal(r.selectedDate,'2000-01-01');
 assert.equal(s({...base,sunrises:[{localDate:'2000-01-01',milliseconds:1000}]}).status,'boundary-uncertain');
 assert.equal(s({...base,sunrises:[{localDate:'2000-01-01',milliseconds:5000}]}).selectedDate,null);
 assert.throws(()=>s({...base,sunrises:[rises[0],rises[0]]}));
});
test('P11 birth Panchang distinguishes civil/sunrise Vara and rejects uncertain input',async()=>{
 const {panchangForBirth}=await import('../packages/vedic/birth-panchang.mjs');
 const v=panchangForBirth(input,context);assert.equal(v.panchang.atInstant.limbs.tithi.number,26);assert.equal(v.panchang.basis,'exact-instant');
 const early=panchangForBirth({...input,localTime:'03:00'},context);assert.equal(early.panchang.beforeSunrise,true);assert.notEqual(early.panchang.civilVara.index,early.panchang.sunriseVara.index);
 const unknown={...input,timeAccuracy:'unknown'};delete unknown.localTime;assert.throws(()=>panchangForBirth(unknown,context),e=>e.code==='UNSTABLE_BIRTH_TIME');
 assert.throws(()=>panchangForBirth({...input,timeAccuracy:'approximate',precisionOfBirthTimeMinutes:10},context),e=>e.code==='UNSTABLE_BIRTH_TIME');
});
test('P11 yearly candidates support zero/two Gregorian-year matches and explicit policies',async()=>{
 const {yearlyTithiCandidates:f,birthdayRule}=await import('../packages/vedic/birth-observance.mjs');
 const options={year:2027,observancePlaceId:input.placeId,ruleId:birthdayRule.id,adhikaPolicy:'regular-only'};
 const r=f(input,options,context);assert.equal(r.occurrences.length,2);assert.deepEqual(r.occurrences.map(x=>x.selectedDate),['2027-01-03','2027-12-23']);
 assert.equal(f(input,{...options,year:2026},context).occurrences.length,0);
 assert.throws(()=>f(input,{...options,ruleId:'PURNIMANTA'},context),e=>e.code==='MODEL_UNAVAILABLE');
 assert.throws(()=>f(input,{...options,year:2098},context),e=>e.code==='OUT_OF_RANGE');assert.throws(()=>f(input,{...options,adhikaPolicy:undefined},context));
 assert.throws(()=>f(input,{...options,get extra(){throw Error('private');}},context),e=>e.code==='INVALID_INPUT');
});
test('P11 local sunrise dates are inside the target Tithi and requested month',async()=>{
 const {yearlyTithiCandidates:f,birthdayRule}=await import('../packages/vedic/birth-observance.mjs'),{panchangSnapshot}=await import('../packages/vedic/panchang.mjs'),{sunriseOnCivilDay}=await import('../packages/vedic/panchang-observer.mjs'),{getPlace}=await import('../packages/vedic/places.mjs');
 const r=f(input,{year:2027,observancePlaceId:'geonames:1264527',ruleId:birthdayRule.id,adhikaPolicy:'include-adhika'},context),place=getPlace(r.place.id);
 for(const row of r.occurrences){assert.equal(row.month.number,r.birthMonth.number);for(const localDate of row.sunriseDates){const rise=sunriseOnCivilDay({localDate,timeZoneId:place.timeZoneId,latitude:place.latitude,longitude:place.longitude});
  const p=panchangSnapshot({timeScale:'UTC',utcInstant:rise.utcInstant,calculationProfileId:input.calculationProfileId});assert.equal(p.limbs.tithi.number,r.tithi);}}
});
test('P11 editorial naming grid, filters and ICS contain no birth identity',async()=>{
 const {namingData,namingGuidance,findNames}=await import('../apps/rashifal-kundli/frontend/naming-data.mjs');
 assert.equal(namingData.syllables.length,27);assert.ok(namingData.syllables.every(x=>x.length===4));assert.equal(findNames({query:'sun'})[0].roman,'Ravi');assert.equal(findNames({query:'તારો',language:'gu'})[0].roman,'Tara');
 const base={nakshatra:15,pada:4,nearBoundary:false,boundaryDistances:{padaArcsec:1000}};assert.equal(namingGuidance(base).syllable,'ta');assert.equal(namingGuidance({...base,nearBoundary:true}).status,'unavailable');assert.equal(findNames({syllable:'jna'}).length,0);
 const {candidateCalendar}=await import('../apps/rashifal-kundli/frontend/tradition-view.mjs');
 const ics=candidateCalendar({adhikaPolicy:'regular-only',occurrences:[{status:'single-sunrise',selectedDate:'2027-12-23'}]});assert.ok(ics.includes('DTSTART;VALUE=DATE:20271223'));assert.ok(ics.includes('DTEND;VALUE=DATE:20271224'));assert.ok(!ics.includes(input.localDate));assert.ok(!ics.includes(input.placeId));assert.ok(!ics.includes(input.localTime));assert.ok(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
 assert.throws(()=>candidateCalendar({occurrences:[]}));
});
