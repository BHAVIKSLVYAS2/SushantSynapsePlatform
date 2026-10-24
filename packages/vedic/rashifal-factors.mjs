import {civilDateMilliseconds,resolveCivilTime} from './civil-time.mjs';
import {siderealSnapshot,siderealProfile} from './sidereal.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
const day=86400000,offset=19800000;
export const rashifalFactorModel=freeze({id:'rashifal-moon-noon-ist-1',timeZoneId:'Asia/Kolkata',anchorLocalTime:'12:00',
 week:'Monday through Sunday containing the current IST day',reference:'manually selected Chandra Rashi; not Lagna or tropical Sun sign',
 meaning:'nominal noon snapshots only; no whole-day or continuous-transit claim',releaseStatus:'internal-candidate-production-acceptance-pending'});
export function rashifalPeriod(input){
 fields(input,['view','now']);if(!['today','tomorrow','weekly'].includes(input.view)||!Number.isSafeInteger(input.now)||Math.abs(input.now)>8640000000000000-offset)fail();
 const current=new Date(input.now+offset).toISOString().slice(0,10);let first=civilDateMilliseconds(current),days=1;
 if(input.view==='tomorrow')first+=day;
 if(input.view==='weekly'){first-=((new Date(first).getUTCDay()+6)%7)*day;days=7;}
 const dates=Array.from({length:days},(_,i)=>new Date(first+i*day).toISOString().slice(0,10));for(const date of dates)civilDateMilliseconds(date);
 return freeze({kind:input.view==='weekly'?'weekly':'daily',editorialDate:dates[0],dates,timeZoneId:'Asia/Kolkata',
  startUtc:new Date(first-offset).toISOString(),endUtc:new Date(first+days*day-offset).toISOString(),endInclusive:false});
}
export function rashifalMoonFactor(input){
 fields(input,['localDate','rashi','calculationProfileId']);
 if(input.calculationProfileId!==siderealProfile.id)fail('MODEL_UNAVAILABLE');
 if(!Number.isInteger(input.rashi)||input.rashi<1||input.rashi>12)fail();
 const time=resolveCivilTime({localDate:input.localDate,localTime:'12:00',timeZoneId:'Asia/Kolkata'});
 const snapshot=siderealSnapshot({timeScale:'UTC',utcInstant:time.utcInstant,bodies:['Moon'],calculationProfileId:input.calculationProfileId});
 const moon=snapshot.positions[0];
 if(moon.boundaryDistances.rashiArcsec<=siderealProfile.classificationScreeningGuardArcsec)fail('UNSTABLE_BIRTH_TIME');
 return freeze({model:rashifalFactorModel,localDate:input.localDate,anchorUtc:time.utcInstant,moonRashi:moon.rashi,
  moonSiderealLongitude:moon.siderealLongitude,referenceRashi:input.rashi,relativeHouse:(moon.rashi-input.rashi+12)%12+1,
  profileId:input.calculationProfileId,profileVersion:siderealProfile.version,ayanamshaModel:snapshot.ayanamsha.modelId??siderealProfile.ayanamsha.id,
  warnings:snapshot.warnings});
}
