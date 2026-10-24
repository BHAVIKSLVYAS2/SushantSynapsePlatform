import {rashifalPeriod,rashifalMoonFactor,rashifalFactorModel} from '../../../packages/vedic/rashifal-factors.mjs';
import {fields,fail,freeze} from '../../../packages/vedic/diagnostics.mjs';
import {rashifalLibrary,editorialSections} from './rashifal-library.mjs';
const profile='IN_LAHIRI_DEFAULT_V1';
export function createRashifalService(){
 const readings=new Map(),factors=new Map();
 function put(map,key,value,limit){if(map.has(key))map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);}
 return Object.freeze({getReading(input,context){
  fields(input,['rashi','view','language','ruleVersion','calculationProfileId']);fields(context,['now']);
  if(!Number.isInteger(input.rashi)||input.rashi<1||input.rashi>12||!['en','hi','gu'].includes(input.language))fail();
  if(input.ruleVersion!==rashifalLibrary.version||input.calculationProfileId!==profile)fail('MODEL_UNAVAILABLE');
  const period=rashifalPeriod({view:input.view,now:context.now});
  const key=[period.editorialDate,period.kind,input.rashi,input.language,input.ruleVersion,input.calculationProfileId,rashifalFactorModel.id].join('|');
  let reading=readings.get(key),hit=Boolean(reading);
  if(!reading){const samples=period.dates.map(localDate=>{
   const factorKey=localDate+'|'+input.calculationProfileId;let factor=factors.get(factorKey);
   if(!factor){factor=rashifalMoonFactor({localDate,rashi:1,calculationProfileId:input.calculationProfileId});put(factors,factorKey,factor,56);}
   return {...factor,referenceRashi:input.rashi,relativeHouse:(factor.moonRashi-input.rashi+12)%12+1};
  });
  const counts=new Map();for(const sample of samples){const group=rashifalLibrary.houseGroups[sample.relativeHouse];counts.set(group,(counts.get(group)??0)+1);}
  const selected=[...counts.keys()].sort((a,b)=>counts.get(b)-counts.get(a)||rashifalLibrary.groupOrder.indexOf(a)-rashifalLibrary.groupOrder.indexOf(b)).slice(0,period.kind==='weekly'?3:1);
  reading=freeze({contractVersion:'vedic-rashifal-1',period,rashi:input.rashi,requestedLanguage:input.language,
   ...editorialSections(selected,input.language),factors:samples,selection:selected.map(group=>({group,noonSamples:counts.get(group)})),
   publication:{status:rashifalLibrary.status,catalogueDate:rashifalLibrary.catalogueDate,publishedAt:null,editorialDate:period.editorialDate},
   provenance:{ruleVersion:rashifalLibrary.version,factorModel:rashifalFactorModel.id,profileId:profile,author:rashifalLibrary.author,source:rashifalLibrary.source,
    rule:rashifalLibrary.weekly,scope:'project-authored reflections; not personalized prediction; no aspects, Dasha or complete transit rulebook'},
   warnings:[...new Set(samples.flatMap(f=>f.warnings))]});put(readings,key,reading,120);
  }
  return freeze({reading,retrievedAtUtc:new Date(context.now).toISOString(),cache:{hit,key,size:readings.size,factorCount:factors.size}});
 },clear(){readings.clear();factors.clear();}});
}
