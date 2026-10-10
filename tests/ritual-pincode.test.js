const {test}=require('node:test'),assert=require('node:assert/strict');
test('offline PIN lookup rejects unknown, inconsistent and injected locations',async()=>{
 const {resolvePincode}=await import('../apps/ritual-assist/backend/pincode.mjs'),{calendarInput}=await import('../apps/ritual-assist/backend/calendar-input.mjs');
 assert.equal(resolvePincode('110001').district,'New Delhi');assert.equal(resolvePincode('400001').calendar,'amanta');
 for(const pin of ['000000','999999','11000','110001<script>',110001,'744301'])assert.throws(()=>resolvePincode(pin));
 const details={date:'2025-10-01',time:'12:00',pincode:'110001'};
 assert.throws(()=>calendarInput({...details,lat:0,lon:0}),/Unsupported/);assert.throws(()=>calendarInput({...details,city:'delhi'}),/without/);
 const normalized=calendarInput({...details,calendar:'amanta'});assert.equal(normalized.calendar,'amanta');assert.equal(normalized.city,'custom');assert.equal(normalized.postal.pincode,'110001');
});
test('current-year calendar retains past observances and eleven full years with lunar identity',async()=>{
 const {generateCalendar,calendarRows,calendarText}=await import('../apps/ritual-assist/frontend/panchang.mjs');
 const r=generateCalendar({date:'1980-10-01',time:'12:00',city:'delhi',calendar:'amanta',counting:'civil'},{now:+new Date('2026-10-10T12:00:00+05:30')});
 assert.deepEqual(r.yearly.map(y=>y.year),Array.from({length:11},(_,i)=>2026+i));
 const past=r.yearly[0].pitru.find(row=>row.date&&row.date<r.planningFrom);assert.ok(past,'earlier current-year Pitru Paksha must remain visible');
 for(const year of r.yearly)for(const kind of ['annual','pitru']){assert.ok(year[kind].length);for(const row of year[kind]){if(row.date)assert.equal(Number(row.date.slice(0,4)),year.year);assert.equal(row.window.number,kind==='annual'?r.tithi:r.pitru.tithi);assert.equal(row.month.adhika,false);}}
 assert.ok(calendarRows(r).some(row=>row.kind==='pitru'&&row.date===past.date));assert.ok(calendarText(r).includes(past.date));
 const recent=generateCalendar({date:'2026-10-09',time:'12:00',city:'delhi',calendar:'amanta',counting:'civil'},{now:+new Date('2026-10-10T12:00:00+05:30')});assert.deepEqual(recent.yearly[0].annual,[]);assert.deepEqual(recent.yearly[0].pitru,[]);
});
