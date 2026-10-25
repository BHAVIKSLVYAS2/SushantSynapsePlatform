import {rashifalPeriod} from '../../../packages/vedic/rashifal-factors.mjs';
import {transitSkyForDate,evaluateTransitSample,summarizeTransits,transitRulebook,transitSampling} from '../../../packages/vedic/rashifal-transits.mjs';
import {fields,fail,freeze} from '../../../packages/vedic/diagnostics.mjs';
import {rashifalLibrary,editorialSections} from './rashifal-library.mjs';
import {transitEventsForDate,timelineForRashi,transitTimelineModel} from '../../../packages/vedic/rashifal-timeline.mjs';
const profile='IN_LAHIRI_DEFAULT_V1';
export function createRashifalService(){
 const readings=new Map(),factors=new Map(),timelines=new Map();
 function put(map,key,value,limit){map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);}
 return Object.freeze({getReading(input,context){
  fields(input,['rashi','view','language','ruleVersion','calculationProfileId']);fields(context,['now']);
  if(!Number.isInteger(input.rashi)||input.rashi<1||input.rashi>12||!['en','hi','gu'].includes(input.language))fail();
  if(input.ruleVersion!==rashifalLibrary.version||input.calculationProfileId!==profile)fail('MODEL_UNAVAILABLE');
  const period=rashifalPeriod({view:input.view,now:context.now}),key=[period.editorialDate,period.kind,input.rashi,input.language,input.ruleVersion,profile,transitSampling.id,transitTimelineModel.id].join('|');
  let reading=readings.get(key);const hit=Boolean(reading);
  if(!reading){const days=period.dates.map(localDate=>{const k=localDate+'|'+profile;let sky=factors.get(k);if(!sky){sky=transitSkyForDate({localDate,calculationProfileId:profile});put(factors,k,sky,56);}return sky;});
   const samples=days.flatMap(day=>day.samples.map(s=>({...s,rows:evaluateTransitSample({positions:s.positions,rashi:input.rashi})})));
   const grahas=summarizeTransits(samples),noons=samples.filter(s=>s.localTime==='12:00').map(s=>{const moon=s.rows.find(p=>p.body==='Moon');return {localDate:s.localDate,anchorUtc:s.utcInstant,moonRashi:moon.rashi,moonSiderealLongitude:moon.siderealLongitude,relativeHouse:moon.relativeHouse,nearBoundary:moon.nearBoundary,rows:s.rows};});
   const timelineDays=period.dates.map(localDate=>{if(!timelines.has(localDate)){let value;try{value=transitEventsForDate({localDate,calculationProfileId:profile});}catch(error){if(!error.code)throw error;value={localDate,status:'unavailable',diagnostic:error.code,changes:[],contacts:[],evaluations:0};}put(timelines,localDate,value,56);}return timelines.get(localDate);});
   reading=freeze({contractVersion:'vedic-rashifal-3',period,rashi:input.rashi,requestedLanguage:input.language,...editorialSections(grahas,input.language),timeline:timelineForRashi({days:timelineDays,rashi:input.rashi}),
    factors:noons,samples:samples.map(({positions,warnings,...sample})=>sample),grahas,
    selection:grahas.map(g=>({body:g.body,houses:g.houses,counts:g.counts,sampleCount:g.sampleCount})),
    publication:{status:rashifalLibrary.status,catalogueDate:rashifalLibrary.catalogueDate,publishedAt:null,editorialDate:period.editorialDate},
    provenance:{ruleVersion:rashifalLibrary.version,factorModel:transitSampling.id,profileId:profile,author:rashifalLibrary.author,source:rashifalLibrary.source,rule:rashifalLibrary.weekly,
     scope:'nine-graha Moon-sign transit classification; no personal prediction or continuous coverage',rulebook:transitRulebook},
    warnings:[...new Set(days.flatMap(day=>day.samples.flatMap(s=>s.warnings)))]});put(readings,key,reading,120);
  }
  return freeze({reading,retrievedAtUtc:new Date(context.now).toISOString(),cache:{hit,key,size:readings.size,factorCount:factors.size}});
 },clear(){readings.clear();factors.clear();timelines.clear();}});
}
