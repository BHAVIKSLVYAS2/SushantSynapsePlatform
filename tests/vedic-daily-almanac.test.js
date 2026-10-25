const {test}=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../packages/vedic/daily-almanac.mjs');
test('local solar events agree with existing sunrise primitive and published Delhi reference',async()=>{
 const {dailyAlmanac}=await load(),{sunriseOnCivilDay}=await import('../packages/vedic/panchang-observer.mjs');
 const d=dailyAlmanac({localDate:'2026-10-25',placeId:'geonames:1261481'});
 assert.equal(d.sunrise,Date.parse(sunriseOnCivilDay({localDate:d.localDate,timeZoneId:'Asia/Kolkata',latitude:28.62137,longitude:77.2148}).utcInstant));
 // Drik Panchang Delhi 25 Oct 2026: 06:28/17:42 IST, minute precision.
 for(const [event,reference]of [[d.sunrise,'2026-10-25T06:28:00+05:30'],[d.sunset,'2026-10-25T17:42:00+05:30']])assert.ok(Math.abs(event-Date.parse(reference))<120000);
 for(const field of ['sunrise','sunset','moonrise','moonset'])assert.equal(new Date(d[field]+19800000).toISOString().slice(0,10),d.localDate);
 assert.ok(d.moonset<d.sunrise);assert.ok(d.moonrise>d.sunrise);assert.ok(d.moonrise<d.sunset);
 const m=dailyAlmanac({localDate:d.localDate,placeId:'geonames:1275339'});assert.ok(Math.abs(m.sunset-d.sunset)>600000);assert.notEqual(m.moonrise,d.moonrise);
});
test('all weekday orders follow the published day/night tables; intervals have no gaps',async()=>{
 const {dailyAlmanac,currentChoghadiya}=await load();
 const firstDay=['Udveg','Amrit','Rog','Labh','Shubh','Char','Kaal'],firstNight=['Shubh','Char','Kaal','Udveg','Amrit','Rog','Labh'];
 for(let i=0;i<7;i++){
  const d=dailyAlmanac({localDate:'2026-10-'+(25+i),placeId:'geonames:1261481'});
  assert.equal(d.day[0].name,firstDay[i]);assert.equal(d.night[0].name,firstNight[i]);
  for(const slots of [d.day,d.night,d.previousNight]){assert.equal(slots.length,8);const width=(slots.at(-1).end-slots[0].start)/8;
   for(const [j,s]of slots.entries()){assert.ok(Math.abs(s.end-s.start-width)<=1);if(j)assert.equal(slots[j-1].end,s.start);assert.equal(currentChoghadiya(slots,s.start),s);assert.equal(currentChoghadiya(slots,s.end-1),s);assert.notEqual(currentChoghadiya(slots,s.end),s);}
  }
  assert.equal(d.day[0].start,d.sunrise);assert.equal(d.day.at(-1).end,d.sunset);assert.equal(d.night[0].start,d.sunset);assert.equal(d.previousNight.at(-1).end,d.sunrise);
  assert.equal(currentChoghadiya([...d.day,...d.night],d.sunset),d.night[0]);assert.equal(currentChoghadiya([...d.previousNight,...d.day],d.sunrise),d.day[0]);
 }
});
test('civil-day lunar no-event dates remain absent and invalid places/dates are rejected',async()=>{
 const {dailyAlmanac,istDate}=await load();
 assert.equal(dailyAlmanac({localDate:'2026-10-04',placeId:'geonames:1261481'}).moonrise,null);
 assert.equal(dailyAlmanac({localDate:'2026-10-19',placeId:'geonames:1261481'}).moonset,null);
 assert.equal(istDate(Date.parse('2026-10-25T18:30:00Z')),'2026-10-26');
 for(const input of [{localDate:'2026-02-30',placeId:'geonames:1261481'},{localDate:'2026-10-25',placeId:'unknown'},{localDate:'1900-01-01',placeId:'geonames:1261481'}])assert.throws(()=>dailyAlmanac(input));
});
