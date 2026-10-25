import {siderealSnapshot,siderealProfile} from './sidereal.mjs';
import {resolveCivilTime} from './civil-time.mjs';
import {relativeSignCount} from './gochar.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';

export const transitBodies=freeze(['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']);
export const transitRulebook=freeze({id:'phaladipika-26-moon-transits-v1',
 source:{id:'phaladipika-26.1-8',url:'https://www.wisdomlib.org/hinduism/book/phaladeepika-by-mantreswara-text-and-translation/d/doc1621598.html'},
 reference:'selected natal Moon sign; whole-sign counting',
 favorable:{Sun:[3,6,10,11],Moon:[1,3,6,7,10,11],Mars:[3,6,11],Mercury:[2,4,6,8,10,11],Jupiter:[2,5,7,9,11],Venus:[1,2,3,4,5,8,9,11,12],Saturn:[3,6,11],Rahu:[3,6,10,11],Ketu:[3,6,10,11]},
 vedha:{Sun:{3:9,6:12,10:4,11:5},Moon:{1:5,3:9,6:12,7:2,10:4,11:8},Mars:{3:12,6:9,11:5},Mercury:{2:5,4:3,6:9,8:1,10:8,11:null},Jupiter:{2:12,5:4,7:3,9:10,11:8},Venus:{1:8,2:7,3:1,4:10,5:9,8:5,9:11,11:3,12:6},Saturn:{3:12,6:9,11:5}},
 exemptions:{Sun:'Saturn',Saturn:'Sun',Moon:'Mercury',Mercury:'Moon'},
 verses:{Sun:'26.2–3',Moon:'26.2,4',Mars:'26.2,5',Mercury:'26.2,6',Jupiter:'26.2,7',Venus:'26.2,8',Saturn:'26.2,5',Rahu:'26.2',Ketu:'26.2'},
 unresolved:['Mercury H11 Vedha: transcriptions disagree (H11/H12); withheld.','Rahu/Ketu favorable-house list only; nodal Vedha not inferred.'],
 convention:'All nine grahas may obstruct a physical graha, except the named exempt pair. No reverse Vedha, aspects, dignity, combustion, Dasha or Ashtakavarga is inferred.',
 reviewStatus:'implemented-source-table; independent-traditional-review-pending'});
export const transitSampling=freeze({id:'nine-graha-3h-ist-v1',hours:[0,3,6,9,12,15,18,21],
 meaning:'eight equally spaced instants per IST day; sample counts are not durations, probabilities or continuous transit coverage'});

export function transitSkyForDate(input){
 fields(input,['localDate','calculationProfileId']);if(input.calculationProfileId!==siderealProfile.id)fail('MODEL_UNAVAILABLE');
 const samples=transitSampling.hours.map(hour=>{const {utcInstant}=resolveCivilTime({localDate:input.localDate,localTime:String(hour).padStart(2,'0')+':00',timeZoneId:'Asia/Kolkata'});
  const s=siderealSnapshot({timeScale:'UTC',utcInstant,bodies:[...transitBodies],calculationProfileId:input.calculationProfileId});
  return {utcInstant,localDate:input.localDate,localTime:String(hour).padStart(2,'0')+':00',positions:s.positions,warnings:s.warnings};
 });return freeze({localDate:input.localDate,sampling:transitSampling,samples});
}
export function evaluateTransitSample(input){
 fields(input,['positions','rashi']);relativeSignCount({rashi:1,referenceRashi:input.rashi});
 if(!Array.isArray(input.positions)||input.positions.length!==9||new Set(input.positions.map(p=>p?.body)).size!==9)fail();
 const rows=transitBodies.map(body=>{const p=input.positions.find(p=>p?.body===body);
  if(!p||!Number.isFinite(p.siderealLongitude)||p.siderealLongitude<0||p.siderealLongitude>=360)fail();
  const sign=Math.floor(p.siderealLongitude/30)+1,degree=p.siderealLongitude%30,near=Math.min(degree,30-degree)*3600<=siderealProfile.classificationScreeningGuardArcsec;
  const house=relativeSignCount({rashi:sign,referenceRashi:input.rashi}),adjacent=degree<15?(sign+10)%12+1:sign%12+1;
  return {body,siderealLongitude:p.siderealLongitude,rashi:sign,relativeHouse:house,nearBoundary:near,
   possibleHouses:near?[house,relativeSignCount({rashi:adjacent,referenceRashi:input.rashi})]:[house]};
 });
 return freeze(rows.map(row=>{const favorable=transitRulebook.favorable[row.body].includes(row.relativeHouse),vedhaHouse=transitRulebook.vedha[row.body]?.[row.relativeHouse]??null;
  const eligible=rows.filter(p=>p.body!==row.body&&p.body!==transitRulebook.exemptions[row.body]);
  const blockers=vedhaHouse===null?[]:eligible.filter(p=>!p.nearBoundary&&p.relativeHouse===vedhaHouse).map(p=>p.body);
  const possibleBlockers=vedhaHouse===null?[]:eligible.filter(p=>p.nearBoundary&&p.possibleHouses.includes(vedhaHouse)).map(p=>p.body);
  const status=row.nearBoundary?'uncertain':!favorable?'outside-favorable':vedhaHouse===null?'rule-unresolved':blockers.length?'obstructed':possibleBlockers.length?'uncertain':'supportive';
  return {...row,favorable,vedhaHouse,blockers,possibleBlockers,status,sourceVerse:transitRulebook.verses[row.body],ruleId:transitRulebook.id};
 }));
}
export function summarizeTransits(samples){
 if(!Array.isArray(samples)||!samples.length||samples.length>56)fail();
 return freeze(transitBodies.map(body=>{const observations=samples.map(sample=>{const row=sample.rows.find(r=>r.body===body);if(!row)fail();return {utcInstant:sample.utcInstant,localDate:sample.localDate,localTime:sample.localTime,...row};});
  const counts={'supportive':0,'obstructed':0,'outside-favorable':0,'uncertain':0,'rule-unresolved':0};for(const o of observations)counts[o.status]++;
  return {body,sampleCount:observations.length,houses:[...new Set(observations.filter(o=>!o.nearBoundary).map(o=>o.relativeHouse))],counts,observations};
 }));
}
