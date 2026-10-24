import {normalizeInput} from './normalize.mjs';
import {assertCivilInterval} from './civil-time.mjs';
import {analyzeSensitivityInterval} from './sensitivity.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
export function sensitivityForBirth(input,context){
 fields(input,['localDate','localTime','placeId','timeZoneId','calculationProfileId','timeAccuracy','precisionOfBirthTimeMinutes','language','elevationMetres']);
 if(Object.hasOwn(input,'elevationMetres')&&(typeof input.elevationMetres!=='number'||!Number.isFinite(input.elevationMetres)))fail();
 const birth=normalizeInput({...input,purpose:'birth'},context);
 const interval=birth.interval??{startUtc:birth.utcInstant,endUtc:new Date(Date.parse(birth.utcInstant)+60000).toISOString(),startInclusive:true,endInclusive:false};
 const start=Date.parse(interval.startUtc),end=Date.parse(interval.endUtc);assertCivilInterval(start,end,interval.endInclusive);
 if(end>context.now)fail('OUT_OF_RANGE');
 const analysis=analyzeSensitivityInterval({startUtc:interval.startUtc,endUtc:interval.endUtc,endInclusive:interval.endInclusive,
  latitude:birth.place.latitude,longitude:birth.place.longitude,elevationMetres:birth.place.elevationMetres,calculationProfileId:birth.calculationProfileId});
 return freeze({birth,analysis,warnings:[...new Set([...birth.warnings,...analysis.warnings])]});
}
