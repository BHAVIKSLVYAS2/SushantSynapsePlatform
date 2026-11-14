const {test}=require('node:test'),assert=require('node:assert/strict');
const context={now:Date.parse('2026-11-15T00:00Z')};
const birth={localDate:'1990-08-15',localTime:'10:30',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
function adjacent(x,d){const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);v.setBigUint64(0,v.getBigUint64(0)+BigInt(d));return v.getFloat64(0);}
test('Hora odd/even halves and D16 published example 20 retain source-defined placements',async()=>{
 const {advancedDivisionForLongitude:p}=await import('../packages/vedic/advanced-vargas.mjs');
 for(const [longitude,rashi]of [[0,5],[14,5],[15,4],[29,4],[30,4],[44,4],[45,5],[59,5]])assert.equal(p({chartType:'D2',siderealLongitude:longitude}).rashi,rashi);
 for(const [longitude,rashi]of [[71,2],[229,3]])assert.equal(p({chartType:'D16',siderealLongitude:longitude}).rashi,rashi);
 // All three D16 modality starts, wrap after part 12, every cusp and neighbour.
 for(let s=0;s<12;s++)for(let k=1;k<16;k++){
  const angle=s*30+k*1.875,base=[0,4,8][s%3];
  for(const [a,i]of [[adjacent(angle,-1),k-1],[angle,k],[adjacent(angle,1),k]])assert.equal(p({chartType:'D16',siderealLongitude:a}).rashi,(base+i)%12+1);
 }
 for(let s=0;s<12;s++){const a=s*30+15;assert.notEqual(p({chartType:'D2',siderealLongitude:adjacent(a,-1)}).rashi,p({chartType:'D2',siderealLongitude:a}).rashi);}
});
test('Chandra reanchors houses to Moon while preserving every D1 sign and degree',async()=>{
 const {birthChartForBirth}=await import('../packages/vedic/birth-chart.mjs'),{chandraChartFromD1}=await import('../packages/vedic/chandra-chart.mjs'),{chartViewModel}=await import('../apps/rashifal-kundli/frontend/chart-model.mjs');
 const d1=birthChartForBirth(birth,context).chart,r=chandraChartFromD1(d1),m=chartViewModel(r),moon=d1.planets.find(p=>p.body==='Moon');
 assert.equal(m.ascendantRashi,moon.rashi);assert.equal(m.planets.find(p=>p.body==='Moon').houseNumber,1);
 for(const p of m.planets){const original=d1.planets.find(q=>q.body===p.body);assert.equal(p.rashi,original.rashi);assert.equal(p.sourceLongitude,original.siderealLongitude);assert.equal(p.houseNumber,(p.rashi-moon.rashi+12)%12+1);}
 assert.equal(m.houses.flatMap(h=>h.planets).length,9);assert.ok(Object.isFrozen(r));
});
test('extra charts admit independently and never manufacture unknown-time charts',async()=>{
 const {calculateBirthReport}=await import('../apps/rashifal-kundli/frontend/birth-report.mjs');
 const r=calculateBirthReport(birth,context);assert.equal(r.chartViews.chandra.status,'available');assert.equal(r.chartViews.d2.status,'available');
 const stableD16=calculateBirthReport({...birth,localDate:'1990-08-02'},context).chartViews.d16;assert.equal(stableD16.status,'available');assert.equal(stableD16.value.planets.length,9);assert.equal(r.chartViews.d16.status,'unavailable');
 const unknown=calculateBirthReport({...birth,localTime:undefined,timeAccuracy:'unknown'},context);assert.ok(Object.values(unknown.chartViews).every(f=>f.status==='unavailable'));
 const {advancedForBirth}=await import('../packages/vedic/birth-advanced.mjs');let stable=0,withheld=0;
 for(const time of ['10:15','10:30','10:45','11:00','11:15','12:15']){const result=advancedForBirth({...birth,localTime:time},context);for(const key of ['D2','D16']){const f=result.charts[key];if(f.status==='available'){stable++;assert.equal(f.value.planets.length,9);}else{withheld++;assert.equal(f.diagnostic.code,'UNSTABLE_BIRTH_TIME');}}}
 assert.ok(stable>0&&withheld>0,'boundary screening remains per chart');
});
