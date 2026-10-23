const {test}=require('node:test'),assert=require('node:assert/strict');
const modules=Promise.all([import('../apps/ritual-assist/backend/observances.mjs'),import('../apps/ritual-assist/backend/observance-input.mjs'),import('../apps/ritual-assist/frontend/observance-export.mjs'),import('../apps/ritual-assist/frontend/observance-rules.mjs')]);
const at=value=>+new Date(value),within=(actual,expected,minutes=3)=>assert.ok(Math.abs(actual-at(expected))<=minutes*60000,`${new Date(actual).toISOString()} differs from ${expected}`);
test('published Delhi dates distinguish sunrise Purnima, fasting, Ekadashi, moonrise Chauth and midday/evening vrats',async()=>{
 const [{generateObservances},{observanceInput},,{eventTitle}]=await modules;
 // Individually reviewed factual fixtures, not scraped runtime data. References:
 // Drik Panchang /vrats/{purnimasidates,amavasyadates,ekadashidates,
 // sankashti-chaturthi-dates,vinayaka-chaturthi-dates,pradoshdates}.html (2026 Delhi).
 const r=generateObservances(observanceInput({month:'2026-10',pincode:'110001'})),find=(type,date)=>r.events.find(e=>e.type===type&&e.date===date);
 for(const [type,date]of [['purnima','2026-10-26'],['purnima-vrat','2026-10-25'],['amavasya','2026-10-10'],['ekadashi','2026-10-06'],['ekadashi','2026-10-22'],['sankashti','2026-10-29'],['vinayaka','2026-10-14'],['pradosh','2026-10-08'],['pradosh','2026-10-23']])assert.equal(find(type,date)?.status,'computed',type+' '+date);
 const e=find('ekadashi','2026-10-22');assert.equal(eventTitle(e),'Papankusha Ekadashi');within(e.window.start,'2026-10-21T14:11:00+05:30');within(e.window.end,'2026-10-22T14:47:00+05:30');assert.equal(r.days.length,31);assert.equal(r.days[0].date,'2026-10-01');assert.equal(r.calculation.stored,false);
 const jan=generateObservances(observanceInput({month:'2026-01',pincode:'110001'})),shattila=jan.events.find(e=>e.type==='ekadashi'&&e.date==='2026-01-14');assert.equal(shattila.parana.status,'computed');within(shattila.parana.start,'2026-01-15T07:15:00+05:30');within(shattila.parana.end,'2026-01-15T09:21:00+05:30');assert.equal(jan.events.find(e=>e.type==='sankashti').angarki,true);
 const april=generateObservances(observanceInput({month:'2026-04',pincode:'110001'}));assert.equal(april.events.find(e=>e.type==='purnima').date,'2026-04-02');assert.equal(april.events.find(e=>e.type==='purnima-vrat').date,'2026-04-01');
 within(r.events.find(e=>e.type==='sankashti').anchor,'2026-10-29T20:17:00+05:30',5);
});
test('rare sunrise and Parana cases require confirmation and cannot silently become reminders',async()=>{
 const [{generateObservances,selectOccurrence},{observanceInput},{reminderOccurrences}]=await modules;
 const may=generateObservances(observanceInput({month:'2026-05',pincode:'110001'})),padmini=may.events.find(e=>e.type==='ekadashi'&&e.month.adhika);assert.equal(padmini.status,'confirmation');assert.deepEqual(padmini.candidateDates,['2026-05-26','2026-05-27']);assert.equal(padmini.parana.status,'confirmation');assert.equal(reminderOccurrences(may,{now:at('2026-05-01T00:00:00+05:30'),eventId:padmini.id,timed:true}).length,0);
 const july=generateObservances(observanceInput({month:'2026-07',pincode:'110001'}));assert.equal(july.events.find(e=>e.type==='ekadashi'&&e.date==='2026-07-10').status,'confirmation');
 // Published Delhi 2027 calendar puts household Pausha Putrada on Jan 18,
 // despite Ekadashi at Jan 19 sunrise: following Dwadashi skips sunrise.
 const jan=generateObservances(observanceInput({month:'2027-01',pincode:'110001'}));assert.equal(jan.events.find(e=>e.type==='ekadashi'&&e.date==='2027-01-03').status,'computed');const special=jan.events.find(e=>e.type==='ekadashi'&&e.date==='2027-01-18');assert.equal(special.status,'confirmation');assert.deepEqual(special.candidateDates,['2027-01-18','2027-01-19']);assert.equal(special.parana.reason,'dwadashi-before-sunrise');
 const r=generateObservances(observanceInput({month:'2026-10',pincode:'110001'}));assert.equal(r.events.find(e=>e.type==='ekadashi'&&e.date==='2026-10-06').parana.status,'confirmation');
 const start=at('2026-10-01T06:00:00+05:30'),window={start,end:start+86400000};assert.equal(selectOccurrence(window,[{date:'2026-10-01',sunrise:start+60000}],'sunrise').status,'boundary');assert.equal(selectOccurrence(window,[{date:'2026-10-01',sunrise:start-60000}],'sunrise').status,'confirmation');
 assert.equal(selectOccurrence(window,[{date:'2026-10-01',midday:[start+3600000,start+7200000]},{date:'2026-10-02',midday:[start+10800000,start+14400000]}],'midday').status,'confirmation');
});
test('monthly calculations stay bounded and complete across leap years, locations, conventions and year boundaries',async()=>{
 const [{generateObservances},{observanceInput}]=await modules;
 for(const [month,pin]of [['2025-12','400001'],['2027-01','800001'],['2028-02','600001'],['2029-06','110001'],['2030-12','400001']]){const data=observanceInput({month,pincode:pin}),r=generateObservances(data);assert.equal(r.days[0].date,month+'-01');assert.equal(r.days.length,month==='2028-02'?29:[4,6,9,11].includes(+month.slice(5))?30:31);assert.ok(r.events.length>=7&&r.events.length<=14);assert.equal(new Set(r.events.map(e=>e.id)).size,r.events.length);assert.ok(r.events.every(e=>e.date.startsWith(month)));for(const e of r.events){assert.ok(e.window.end>e.window.start);if(e.parana?.status==='computed')assert.ok(e.parana.end>e.parana.start);}}
 const a=generateObservances(observanceInput({month:'2026-10',pincode:'110001',calendar:'amanta'})),b=generateObservances(observanceInput({month:'2026-10',pincode:'110001',calendar:'purnimanta'}));assert.deepEqual(a.events.map(e=>[e.id,e.date]),b.events.map(e=>[e.id,e.date]));
 // Same global tithi, different local moonrise: never reuse a national date.
 const delhi=generateObservances(observanceInput({month:'2026-06',pincode:'110001'})).events.find(e=>e.type==='sankashti'),kolkata=generateObservances(observanceInput({month:'2026-06',pincode:'700001'})).events.find(e=>e.type==='sankashti');assert.equal(delhi.date,'2026-06-03');assert.equal(delhi.status,'confirmation');assert.deepEqual(delhi.candidateDates,['2026-06-03','2026-06-04']);assert.equal(kolkata.date,'2026-06-04');assert.equal(kolkata.status,'computed');assert.equal(delhi.window.start,kolkata.window.start);assert.ok(kolkata.anchor>=kolkata.window.start&&kolkata.anchor<kolkata.window.end);
});
test('validation rejects unsupported policies, hidden personal fields and unbounded calculations',async()=>{
 const [,{observanceInput}]=await modules;
 for(const bad of [{month:'2024-12'},{month:'2031-01'},{month:'2026-13'},{month:'2026-1'},{month:2026},{pincode:110001},{pincode:'000000'},{tradition:'vaishnava'},{calendar:'lahiri'},{name:'Private'},{lat:28},{year:2026}])assert.throws(()=>observanceInput({month:'2026-10',pincode:'110001',...bad}));
});
test('ICS uses stable location-scoped IDs, filters, separate timed milestones, valid UTF-8 and future-only alarms',async()=>{
 const [{generateObservances},{observanceInput},{observanceIcs}]=await modules,r=generateObservances(observanceInput({month:'2026-01',pincode:'110001'})),now=at('2026-01-01T00:00:00+05:30'),options={types:['ekadashi','sankashti'],timed:true,reminder:'evening',now};
 const en=await observanceIcs(r,options),hi=await observanceIcs(r,{...options,language:'hi'}),unfold=s=>s.replace(/\r\n /g,'');assert.ok(en.startsWith('BEGIN:VCALENDAR\r\n'));assert.ok(en.endsWith('END:VCALENDAR\r\n'));assert.ok(unfold(en).includes('Shattila Ekadashi'));assert.ok(unfold(en).includes(' · Parana'));assert.ok(unfold(en).includes(' · Moonrise'));assert.ok(unfold(hi).includes('पारण'));assert.ok(!en.includes('RRULE:'));assert.ok(!en.includes('Purnima'));assert.ok(en.includes('TRIGGER;VALUE=DATE-TIME:20260113T143000Z'));assert.deepEqual([...en.matchAll(/UID:([^\r]+)/g)].map(m=>m[1]),[...hi.matchAll(/UID:([^\r]+)/g)].map(m=>m[1]));for(const line of hi.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 const one=await observanceIcs(r,{...options,eventId:r.events.find(e=>e.type==='ekadashi').id,reminder:'none'});assert.equal((one.match(/BEGIN:VEVENT/g)||[]).length,2);assert.ok(!one.includes('BEGIN:VALARM'));await assert.rejects(()=>observanceIcs(r,{...options,types:[]}));await assert.rejects(()=>observanceIcs(r,{...options,now:at('2027-01-01T00:00:00Z')}));
});

test('edge adapter enforces limiter and JSON validation and serves matching public calculated data',async()=>{
 const {ritual}=await import('../apps/ritual-assist/backend/edge.mjs');const {createObservanceCache}=await import('../apps/ritual-assist/backend/observances.mjs');const {observanceInput}=await import('../apps/ritual-assist/backend/observance-input.mjs');
 const payload={month:'2026-10',pincode:'110001'},make=body=>new Request('https://example.test/api/ritual-assist/observances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),env={CALENDAR_LIMITER:{limit:async()=>({success:true})}},route='ritual-assist/observances';
 const response=await ritual({request:make(payload),env,route});assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal((await response.json()).result.events.find(e=>e.type==='sankashti').date,'2026-10-29');
 await assert.rejects(()=>ritual({request:make(payload),env:{},route}),e=>e.status===503);await assert.rejects(()=>ritual({request:make(payload),env:{CALENDAR_LIMITER:{limit:async()=>({success:false})}},route}),e=>e.status===429);await assert.rejects(()=>ritual({request:make({...payload,month:'2026-00'}),env,route}));
 await assert.rejects(()=>ritual({request:new Request('https://example.test/api/ritual-assist/observances'),env,route}),e=>e.status===405);
 const cache=createObservanceCache(1),data=observanceInput(payload),a=cache.get(data,0);assert.equal(cache.get(data,100),a);assert.notEqual(cache.get({...data,calendar:'amanta'},100),a);assert.notEqual(cache.get(data,4000000),a);
});
