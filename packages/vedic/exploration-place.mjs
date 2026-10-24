import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {panchangForPlace} from './panchang-place.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';
export const explorationModel=freeze({id:'exploration-place-minute-1',purpose:'exploration',
 meaning:'explicit hypothetical local minute, nominal instant at its start; not a birth-time stability result',
 coverage:'pinned 1950..2098 civil interval, with feature-specific sunrise/ephemeris margins',releaseStatus:'internal-candidate-production-acceptance-pending'});
export function normalizeExploration(input){
 fields(input,['localDate','localTime','placeId','timeZoneId','calculationProfileId','language','elevationMetres']);
 if(Object.hasOwn(input,'elevationMetres')&&(typeof input.elevationMetres!=='number'||!Number.isFinite(input.elevationMetres)))fail();
 return normalizeInput({...input,purpose:'exploration',timeAccuracy:'exact'});
}
export function explorationSnapshot(input){
 const exploration=normalizeExploration(input);
 const positions=siderealSnapshot({timeScale:'UTC',utcInstant:exploration.utcInstant,calculationProfileId:exploration.calculationProfileId});
 let panchang;try{panchang={status:'available',value:panchangForPlace({placeId:exploration.place.id,utcInstant:exploration.utcInstant,
  calculationProfileId:exploration.calculationProfileId,...(Object.hasOwn(input,'elevationMetres')?{elevationMetres:input.elevationMetres}:{})}).panchang};}
 catch(error){if(!(error instanceof VedicInputError))throw error;panchang={status:'unavailable',diagnostic:error.toJSON()};}
 return freeze({contractVersion:'vedic-exploration-1',model:explorationModel,exploration,
  positions,panchang,warnings:[...new Set([...exploration.warnings,...positions.warnings,
   ...(panchang.status==='available'?panchang.value.warnings:[]),'NOMINAL_EXPLORATION_MINUTE_NOT_P14_STABILITY'])]});
}
