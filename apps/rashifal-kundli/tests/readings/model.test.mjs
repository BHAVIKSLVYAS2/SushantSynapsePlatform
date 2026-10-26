import {test} from 'node:test';import assert from 'node:assert/strict';
import {calculateBirthReport} from '../../frontend/birth-report.mjs';
import {buildKundliReading,signRulers} from '../../frontend/kundli-reading.mjs';
import {houseContext,readingText} from '../../frontend/kundli-reading-copy.mjs';
import {temperament as nature,manner as presence,work,resources,phase,everyday} from '../../frontend/kundli-consultation-copy.mjs';
const now=Date.parse('2026-10-25T00:00:00Z'),base={localDate:'2000-01-01',localTime:'12:15',placeId:'geonames:1261481',timeZoneId:'Asia/Kolkata',timeAccuracy:'exact',calculationProfileId:'IN_LAHIRI_DEFAULT_V1'};
test('every topic traces to its actual house, ruler and placement across all twelve rising signs',()=>{
 const rising=new Set(),careers=new Set();for(let hour=0;hour<24;hour++){const report=calculateBirthReport({...base,localTime:String(hour).padStart(2,'0')+':15'},{now});if(report.features.d1.status!=='available')continue;const before=JSON.stringify(report),model=buildKundliReading(report),chart=report.features.d1.value;rising.add(model.identity.rising);careers.add(JSON.stringify(model.topics.career));
  for(const key of ['appearance','career','money','relationships','learning','home']){const topic=model.topics[key],house=chart.houses.find(h=>h.houseNumber===topic.house),ruler=chart.planets.find(p=>p.body===signRulers[house.rashi-1]);assert.equal(topic.sign,house.rashi);assert.equal(topic.ruler,ruler.body);assert.equal(topic.rulerHouse,ruler.houseNumber);assert.deepEqual(topic.occupants,house.bodies);}
  assert.equal(JSON.stringify(report),before);assert.equal(model.limits.eventPrediction,false);
 }assert.equal(rising.size,12);assert.ok(careers.size>=12);
});
test('uncertain birth times and independent feature failures never generate guessed readings',()=>{
 for(const timeAccuracy of ['unknown','approximate']){const input={...base,timeAccuracy};if(timeAccuracy==='unknown')delete input.localTime;else input.precisionOfBirthTimeMinutes=10;const model=buildKundliReading(calculateBirthReport(input,{now}));assert.ok(Object.values(model.topics).every(t=>t===null));assert.deepEqual(model.periods,[]);}
 const report=calculateBirthReport(base,{now}),withoutChart=buildKundliReading({...report,features:{...report.features,d1:{status:'unavailable'}}});assert.equal(withoutChart.topics.career,null);assert.equal(withoutChart.topics.appearance,null);assert.equal(withoutChart.topics.personality.moon,report.features.positions.value.positions.find(p=>p.body==='Moon').rashi);assert.ok(withoutChart.periods.length);
 const withoutPeriods=buildKundliReading({...report,features:{...report.features,dasha:{status:'unavailable'}}});assert.ok(withoutPeriods.topics.career);assert.deepEqual(withoutPeriods.periods,[]);
 assert.equal(withoutPeriods.identity.nakshatra,null);
 const boundaryPositions={...report.features.positions.value,positions:report.features.positions.value.positions.map(p=>p.body==='Moon'?{...p,boundaryDistances:{...p.boundaryDistances,rashiArcsec:121}}:p)};
 const boundary=buildKundliReading({...report,features:{...report.features,d1:{status:'unavailable'},positions:{status:'available',value:boundaryPositions}}});assert.equal(boundary.topics.personality,null);assert.equal(boundary.identity.moon,null);assert.ok(boundary.periods.length);
});
test('future themes use the computed periods and half-open transition boundary, never an event date',()=>{
 const report=calculateBirthReport(base,{now}),model=buildKundliReading(report),active=report.features.dasha.value.active;
 assert.equal(model.periods[0].major,active.mahadashaLord);assert.equal(model.periods[0].minor,active.antardashaLord);assert.equal(model.periods[0].end.utcInstant,active.nextTransition.boundary.utcInstant);
 for(let n=1;n<model.periods.length;n++)assert.equal(model.periods[n].start.milliseconds,model.periods[n-1].end.milliseconds);
 const transitioned=buildKundliReading(calculateBirthReport(base,{now:model.periods[0].end.milliseconds}));assert.equal(transitioned.periods[0].minor,active.nextTransition.nextAntardashaLord);assert.equal(transitioned.periods[0].start.milliseconds,model.periods[0].end.milliseconds);
});
test('original reading vocabulary is complete and distinct in English, Hindi and Gujarati',()=>{
 for(const table of [nature,presence]){assert.equal(table.length,12);for(let language=0;language<3;language++)assert.equal(new Set(table.map(row=>row[language])).size,12);}
 for(const row of [...nature,...presence,...houseContext,...Object.values(work),...Object.values(resources),...Object.values(phase),...Object.values(everyday).flat()]){assert.equal(row.length,3);assert.match(row[1],/[\u0900-\u097f]/);assert.match(row[2],/[\u0a80-\u0aff]/);}
 for(const language of ['hi','gu'])assert.deepEqual(Object.keys(readingText[language]).sort(),Object.keys(readingText.en).sort());
});
