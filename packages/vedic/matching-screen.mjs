import {ashtakoota} from './matching.mjs';
import {normalizeDegrees,sectorBoundaryDistances} from './angles.mjs';
import {freeze} from './diagnostics.mjs';

// Preserve the existing proposed margin; it is not a certified error bound.
const guardArcsec=121,guard=guardArcsec/3600;
export function screenedMatching(input){
 const nominal=ashtakoota(input),people=[];
 const candidates=(value,axis)=>{
  const longitude=normalizeDegrees(value);
  const distances=sectorBoundaryDistances(longitude);
  const boundaries=['rashi','nakshatra'].filter(key=>distances[key+'Arcsec']<=guardArcsec);
  if(!boundaries.length)return [longitude];
  people.push({axis,boundaries});
  // Rashi/Nakshatra edges are at least 3 1/3 degrees apart. A 242-arcsecond
  // interval crosses at most one distinct edge; endpoints plus nominal cover
  // every classification. Pada alone is not used by any of the eight rules.
  return [normalizeDegrees(longitude-guard),longitude,normalizeDegrees(longitude+guard)];
 };
 const a=candidates(input.personAMoonLongitude,'A'),b=candidates(input.personBMoonLongitude,'B');
 if(!people.length)return nominal;
 const variants=a.flatMap(personAMoonLongitude=>b.map(personBMoonLongitude=>ashtakoota({...input,personAMoonLongitude,personBMoonLongitude})));
 const range=values=>({min:Math.min(...values),max:Math.max(...values)});
 const totalRange=range(variants.map(v=>v.total));
 const components=nominal.components.map((component,index)=>{
  const scoreRange=range(variants.map(v=>v.components[index].score));
  const factorOptions=[...new Map(variants.map(v=>{const f=v.components[index].factors;return [JSON.stringify(f),f];})).values()];
  return {...component,score:scoreRange.min===scoreRange.max?scoreRange.min:null,scoreRange,factorOptions};
 });
 return freeze({...nominal,contractVersion:'vedic-ashtakoota-screen-2',
  total:totalRange.min===totalRange.max?totalRange.min:null,totalRange,components,
  boundaryScreen:{guardArcsec,people,meaning:'classification possibilities within a proposed angular screen; not a physical confidence interval'}});
}
