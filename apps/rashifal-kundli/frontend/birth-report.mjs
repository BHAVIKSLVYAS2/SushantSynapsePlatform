import {normalizeInput} from '../../../packages/vedic/normalize.mjs';
import {siderealForBirth} from '../../../packages/vedic/birth-positions.mjs';
import {birthChartForBirth} from '../../../packages/vedic/birth-chart.mjs';
import {screenedAdvancedChart} from '../../../packages/vedic/advanced-vargas.mjs';
import {chandraChartFromD1} from '../../../packages/vedic/chandra-chart.mjs';
import {birthChartsForBirth} from '../../../packages/vedic/birth-divisions.mjs';
import {d9ChartAtInstant} from '../../../packages/vedic/d9.mjs';
import {d1ChartAtInstant} from '../../../packages/vedic/d1.mjs';
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
 const base=feature(()=>birthChartForBirth(input,context));
 const admitted=()=>{if(base.status!=='available')fail(base.diagnostic.code);return base.value;};
 const d1=feature(()=>admitted().chart);
 const instant=()=>({timeScale:'UTC',utcInstant:birth.utcInstant,latitude:birth.place.latitude,longitude:birth.place.longitude,elevationMetres:birth.place.elevationMetres,calculationProfileId:birth.calculationProfileId});
 const d1Preview=feature(()=>{
  if(birth.timeAccuracy!=='exact'||!birth.utcInstant||d1.status!=='unavailable'||d1.diagnostic.code!=='UNSTABLE_BIRTH_TIME')fail('MODEL_UNAVAILABLE');
  return d1ChartAtInstant(instant());
 });
 const chartViews={chandra:feature(()=>chandraChartFromD1(admitted().chart)),
  d2:feature(()=>screenedAdvancedChart(admitted(),'D2')),d16:feature(()=>screenedAdvancedChart(admitted(),'D16'))};
 const d9=feature(()=>birthChartsForBirth(input,context).d9);
 // Exact recorded instant only. Keep the screened result unavailable in exports;
 // the interactive explorer may show a visibly time-sensitive nominal preview.
 const d9Preview=feature(()=>{
  if(birth.timeAccuracy!=='exact'||!birth.utcInstant||(d1.status!=='available'&&d1Preview.status!=='available')||d9.status!=='unavailable'||d9.diagnostic.code!=='UNSTABLE_BIRTH_TIME')fail('MODEL_UNAVAILABLE');
  return d9ChartAtInstant(instant());
 });
 const dasha=feature(()=>vimshottariForBirth(input,context).timeline);
 const panchang=feature(()=>panchangForBirth(input,context).panchang);
 const month=feature(()=>{if(!birth.utcInstant||birth.timeAccuracy!=='exact'||panchang.status!=='available')fail('UNSTABLE_BIRTH_TIME');return amantaMonthAtInstant({utcInstant:birth.utcInstant});});
 return freeze({birth,features:{positions,d1,d9,dasha},d1Preview,d9Preview,chartViews,traditions:{panchang,month},calculatedAtUtc:new Date(context.now).toISOString()});
}
