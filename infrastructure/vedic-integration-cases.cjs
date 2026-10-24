const {createHash}=require('node:crypto');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function ritualCases(){
 const core=await import('../apps/ritual-assist/frontend/lunar-core.mjs'),{generateCalendar}=await import('../apps/ritual-assist/frontend/panchang.mjs'),{observanceInput}=await import('../apps/ritual-assist/backend/observance-input.mjs'),{generateObservances}=await import('../apps/ritual-assist/backend/observances.mjs');
 const location={lat:28.6139,lon:77.209,height:0};
 const primitives=['1950-06-15T06:45:00Z','2000-01-01T06:45:00Z','2026-09-26T06:45:00Z'].map(utc=>{const time=Date.parse(utc),date=core.localDate(time),window=core.tithiWindow(time);return {utc,window,next:core.nextTithi(window),daylight:core.daylight(date,location),moonrise:core.moonrise(date,location)};});
 const remembrance=generateCalendar({date:'2025-10-01',time:'12:00',city:'delhi',calendar:'amanta',counting:'civil'},{now:Date.parse('2026-10-10T06:30:00Z')});
 const observances=['2026-05','2026-09'].map(month=>{const result=generateObservances(observanceInput({month,pincode:'110001'}));return {month,hash:hash(result),events:result.events.length};});
 return {primitives,remembrance:{hash:hash(remembrance),annual:remembrance.annual.date,pitru:remembrance.pitru.date},observances};
}
module.exports={ritualCases,hash};
