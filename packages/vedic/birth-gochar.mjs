import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {birthChartForBirth} from './birth-chart.mjs';
import {explorationSnapshot} from './exploration-place.mjs';
import {gocharPlacements,compareSiderealPositions} from './gochar.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';

const clean=snapshot=>snapshot.positions.map(p=>({body:p.body,siderealLongitude:p.siderealLongitude}));
export function explorationWithBirth(explorationInput,birthInput,options,context){
 fields(options,['referenceKind']);if(!['moon','lagna'].includes(options.referenceKind))fail('MODEL_UNAVAILABLE');
 // A future exploration does not turn a future/uncertain birth into admissible input.
 fields(birthInput,['localDate','localTime','placeId','timeZoneId','calculationProfileId','timeAccuracy','precisionOfBirthTimeMinutes','language','elevationMetres']);
 const birth=normalizeInput({...birthInput,purpose:'birth'},context),snapshot=explorationSnapshot(explorationInput);
 if(birth.timeAccuracy!=='exact'||!birth.utcInstant)fail('UNSTABLE_BIRTH_TIME');
 const original=siderealSnapshot({timeScale:'UTC',utcInstant:birth.utcInstant,calculationProfileId:birth.calculationProfileId});
 const comparison=compareSiderealPositions({birthPositions:clean(original),explorationPositions:clean(snapshot.positions)});
 let gochar;try{
  let referenceRashi;
  if(options.referenceKind==='moon'){const moon=original.positions.find(p=>p.body==='Moon');if(moon.boundaryDistances.rashiArcsec<=121)fail('UNSTABLE_BIRTH_TIME');referenceRashi=moon.rashi;}
  else referenceRashi=birthChartForBirth(birthInput,context).chart.ascendant.rashi;
  gochar={status:'available',value:gocharPlacements({positions:clean(snapshot.positions),referenceKind:options.referenceKind,referenceRashi})};
 }catch(error){if(!(error instanceof VedicInputError))throw error;gochar={status:'unavailable',diagnostic:error.toJSON()};}
 return freeze({contractVersion:'vedic-birth-gochar-1',snapshot,comparison,gochar,referenceSource:'validated-private-birth-input',
  warnings:[...new Set([...snapshot.warnings,...birth.warnings,...original.warnings,'ENDPOINT_COMPARISON_NOT_PLANETARY_MOTION'])]});
}
