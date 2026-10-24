import {normalizeInput} from './normalize.mjs';
import {siderealSnapshot} from './sidereal.mjs';
import {birthChartForBirth} from './birth-chart.mjs';
import {advancedChartFromD1,advancedVargaModels,advancedDivisionForLongitude} from './advanced-vargas.mjs';
import {rawAshtakavarga,ashtakavargaModel} from './ashtakavarga.mjs';
import {ucchaBala,ucchaBalaModel} from './strength.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';
export function advancedForBirth(input,context){
 fields(input,['localDate','localTime','placeId','timeZoneId','calculationProfileId','timeAccuracy','precisionOfBirthTimeMinutes','language','elevationMetres']);
 if(Object.hasOwn(input,'elevationMetres')&&(typeof input.elevationMetres!=='number'||!Number.isFinite(input.elevationMetres)))fail();
 const birth=normalizeInput({...input,purpose:'birth'},context);
 if(birth.timeAccuracy!=='exact'||!birth.utcInstant)fail('UNSTABLE_BIRTH_TIME');
 if(Date.parse(birth.utcInstant)+60000>context.now)fail('OUT_OF_RANGE');
 const snapshot=siderealSnapshot({timeScale:'UTC',utcInstant:birth.utcInstant,calculationProfileId:birth.calculationProfileId});
 function feature(run){try{return {status:'available',value:run()};}catch(error){if(!(error instanceof VedicInputError))throw error;return {status:'unavailable',diagnostic:error.toJSON()};}}
 const base=feature(()=>birthChartForBirth(input,context)),charts={};
 for(const chartType of Object.keys(advancedVargaModels))charts[chartType]=feature(()=>{
  if(base.status!=='available')fail(base.diagnostic.code);const {chart,minuteResolutionScreen:screen}=base.value;
  const part=longitude=>advancedDivisionForLongitude({chartType,siderealLongitude:longitude});
  if(part(chart.ascendant.siderealLongitude).boundaryDistanceArcsec<=screen.lagnaGuardArcsec||chart.planets.some(p=>part(p.siderealLongitude).boundaryDistanceArcsec<=screen.planetGuardArcsec))fail('UNSTABLE_BIRTH_TIME');
  return advancedChartFromD1({chartType,d1:chart});
 });
 const uccha=snapshot.positions.filter(p=>Object.hasOwn(ucchaBalaModel.exaltationDegrees,p.body)).map(p=>{
  const nominal=ucchaBala({body:p.body,siderealLongitude:p.siderealLongitude,modelId:ucchaBalaModel.id});
  // distance/3 is 1/3-Lipschitz. This encloses the proposed 121 arcsecond
  // minute/model screen; it is not an accepted physical uncertainty interval.
  const radius=121/3600/3;
  return {body:p.body,virupas:nominal.virupas,rupas:nominal.rupas,virupaRange:[Math.max(0,nominal.virupas-radius),Math.min(60,nominal.virupas+radius)]};
 });
 const ashtakavarga=feature(()=>{if(base.status!=='available')fail(base.diagnostic.code);const d1=base.value.chart;
  const signs=Object.fromEntries(d1.planets.filter(p=>ashtakavargaModel.recipients.includes(p.body)).map(p=>[p.body,p.rashi]));signs.Lagna=d1.ascendant.rashi;
  return rawAshtakavarga({modelId:ashtakavargaModel.id,signs});});
 return freeze({contractVersion:'vedic-birth-advanced-1',charts,ashtakavarga,
  uccha:{status:'available',model:ucchaBalaModel,values:uccha,rangeScope:'conditional-on-proposed-121-arcsecond-screen-not-certified-physical-bound'},
  shadbala:{status:'unavailable',diagnostic:{code:'MODEL_UNAVAILABLE'},reason:'Full six-fold Shadbala has no complete implemented and accepted method/reference set.'},
  admission:'exact minute; per-feature conservative screens, not certified physical stability',
  warnings:[...new Set([...birth.warnings,...snapshot.warnings,'INDIVIDUAL_VARGA_SIGNOFF_PENDING','STRENGTH_REFERENCE_ACCEPTANCE_PENDING','UCCHA_BALA_IS_NOT_FULL_SHADBALA'])]});
}
