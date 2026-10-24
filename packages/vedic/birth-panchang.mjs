import {normalizeInput} from './normalize.mjs';
import {panchangForPlace} from './panchang-place.mjs';
import {fail,freeze} from './diagnostics.mjs';

export function panchangForBirth(input,context){
 const birth=normalizeInput(input,context);if(birth.timeAccuracy!=='exact'||!birth.utcInstant)fail('UNSTABLE_BIRTH_TIME');
 const {panchang}=panchangForPlace({placeId:birth.place.id,utcInstant:birth.utcInstant,calculationProfileId:birth.calculationProfileId,
  ...(Object.hasOwn(input,'elevationMetres')?{elevationMetres:input.elevationMetres}:{})});
 const s=panchang.atInstant,start=Date.parse(birth.utcInstant),end=start+60000;
 // Entire minute plus the P05 numerical/model screening guards must be admissible.
 if(s.nearBoundaryLimbs.length||Object.values(s.nextTransitions).some(v=>Date.parse(v.utcInstant)<=end)
  ||[panchang.definingSunrise,panchang.nextSunrise].some(v=>Math.abs(Date.parse(v.utcInstant)-start)<=180000))fail('UNSTABLE_BIRTH_TIME');
 return freeze({birth,panchang,warnings:[...new Set([...birth.warnings,...panchang.warnings,'NOMINAL_BIRTH_PANCHANG_NOT_P14_CERTIFIED'])]});
}
