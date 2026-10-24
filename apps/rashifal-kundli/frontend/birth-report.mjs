import {normalizeInput} from '../../../packages/vedic/normalize.mjs';
import {siderealForBirth} from '../../../packages/vedic/birth-positions.mjs';
import {birthChartForBirth} from '../../../packages/vedic/birth-chart.mjs';
import {birthChartsForBirth} from '../../../packages/vedic/birth-divisions.mjs';
import {vimshottariForBirth} from '../../../packages/vedic/birth-dasha.mjs';
import {panchangForBirth} from '../../../packages/vedic/birth-panchang.mjs';
import {amantaMonthAtInstant} from '../../../packages/vedic/lunar-calendar.mjs';
import {VedicInputError,freeze,fail} from '../../../packages/vedic/diagnostics.mjs';

// Application composition only; shared kernels retain all admission/math rules.
export function calculateBirthReport(input,context){
 const birth=normalizeInput(input,context);
 if(!context||!Number.isSafeInteger(context.now)||Math.abs(context.now)>8640000000000000)fail();
 function feature(run){try{return {status:'available',value:run()};}
  catch(error){if(!(error instanceof VedicInputError))throw error;return {status:'unavailable',diagnostic:error.toJSON()};}}
 const positions=feature(()=>siderealForBirth(input,context).sidereal);
 const d1=feature(()=>birthChartForBirth(input,context).chart);
 const d9=feature(()=>birthChartsForBirth(input,context).d9);
 const dasha=feature(()=>vimshottariForBirth(input,context).timeline);
 const panchang=feature(()=>panchangForBirth(input,context).panchang);
 const month=feature(()=>{if(!birth.utcInstant||birth.timeAccuracy!=='exact'||panchang.status!=='available')fail('UNSTABLE_BIRTH_TIME');return amantaMonthAtInstant({utcInstant:birth.utcInstant});});
 return freeze({birth,features:{positions,d1,d9,dasha},traditions:{panchang,month},calculatedAtUtc:new Date(context.now).toISOString()});
}
