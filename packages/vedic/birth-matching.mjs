import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {birthChartForBirth} from './birth-chart.mjs';
import {ashtakoota} from './matching.mjs';
import {geometricTraditionalChecks} from './traditional-checks.mjs';
import {requireTraditionalOptions} from './rulebooks.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';
const keys=['localDate','localTime','placeId','timeZoneId','calculationProfileId','timeAccuracy','precisionOfBirthTimeMinutes','language','elevationMetres'];
function snapshot(input,context){
 fields(input,keys);if(Object.hasOwn(input,'elevationMetres')&&(typeof input.elevationMetres!=='number'||!Number.isFinite(input.elevationMetres)))fail();
 const birth=normalizeInput({...input,purpose:'birth'},context);if(birth.timeAccuracy!=='exact'||!birth.utcInstant)fail('UNSTABLE_BIRTH_TIME');
 if(Date.parse(birth.utcInstant)+60000>context.now)fail('OUT_OF_RANGE');
 return {birth,sidereal:siderealSnapshot({timeScale:'UTC',utcInstant:birth.utcInstant,calculationProfileId:birth.calculationProfileId})};
}
export function matchingForBirths(input,context){
 fields(input,['consent','personA','personB','rulebookId']);
 // Do not inspect either nested record before explicit two-person permission.
 if(input.consent!==true)fail('CONSENT_REQUIRED');
 const a=snapshot(input.personA,context),b=snapshot(input.personB,context);
 const moon=s=>s.sidereal.positions.find(p=>p.body==='Moon');
 if([moon(a),moon(b)].some(p=>Math.min(p.boundaryDistances.rashiArcsec,p.boundaryDistances.nakshatraArcsec,p.boundaryDistances.padaArcsec)<=121))fail('UNSTABLE_BIRTH_TIME');
 const matching=ashtakoota({personAMoonLongitude:moon(a).siderealLongitude,personBMoonLongitude:moon(b).siderealLongitude,rulebookId:input.rulebookId});
 return freeze({contractVersion:'vedic-private-matching-1',matching,
  admission:'exact-minute-outside-proposed-121-arcsecond-moon-boundary-screen; not certified physical stability',
  warnings:[...new Set([...a.birth.warnings,...b.birth.warnings,...a.sidereal.warnings,...b.sidereal.warnings,'INDEPENDENT_RULEBOOK_REVIEW_PENDING','NO_MARRIAGE_VERDICT'])]});
}
export function traditionalChecksForBirth(input,options,context){
 requireTraditionalOptions(options);
 const s=snapshot(input,context),positions=s.sidereal.positions;
 // Individual checks depend on multiple signs, so retain the established sign screen.
 if(positions.some(p=>p.boundaryDistances.rashiArcsec<=121))fail('UNSTABLE_BIRTH_TIME');
 let lagnaLongitude=null;try{lagnaLongitude=birthChartForBirth(input,context).chart.ascendant.siderealLongitude;}
 catch(error){if(!(error instanceof VedicInputError))throw error;}
 const checks=geometricTraditionalChecks({positions:positions.map(p=>({body:p.body,siderealLongitude:p.siderealLongitude})),lagnaLongitude,...options});
 return freeze({checks,admission:'exact-minute-proposed-sign-screen-only',warnings:[...new Set([...s.birth.warnings,...s.sidereal.warnings,...checks.warnings])]});
}
