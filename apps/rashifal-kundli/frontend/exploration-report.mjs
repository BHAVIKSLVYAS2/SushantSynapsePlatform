import {explorationSnapshot} from '../../../packages/vedic/exploration-place.mjs';
import {gocharPlacements} from '../../../packages/vedic/gochar.mjs';
import {explorationWithBirth} from '../../../packages/vedic/birth-gochar.mjs';
import {fields,fail,freeze,VedicInputError} from '../../../packages/vedic/diagnostics.mjs';
export function calculateExplorationReport(input,options,context){
 fields(options,['referenceMode','referenceRashi','birthInput']);fields(context,['now']);
 if(!Number.isSafeInteger(context.now)||Math.abs(context.now)>8640000000000000)fail();
 if(!['none','manual-moon','manual-lagna','birth-moon','birth-lagna'].includes(options.referenceMode))fail('MODEL_UNAVAILABLE');
 const manual=options.referenceMode.startsWith('manual'),birth=options.referenceMode.startsWith('birth');
 if(!manual&&Object.hasOwn(options,'referenceRashi')||!birth&&Object.hasOwn(options,'birthInput'))fail();
 const snapshot=explorationSnapshot(input);let gochar=null,comparison=null,comparisonDiagnostic=null;
 if(manual)gochar={status:'available',value:gocharPlacements({positions:snapshot.positions.positions.map(p=>({body:p.body,siderealLongitude:p.siderealLongitude})),referenceKind:options.referenceMode.slice(7),referenceRashi:options.referenceRashi})};
 if(birth){try{const report=explorationWithBirth(input,options.birthInput,{referenceKind:options.referenceMode.slice(6)},context);gochar=report.gochar;comparison=report.comparison;}
  catch(error){if(!(error instanceof VedicInputError))throw error;comparisonDiagnostic=error.toJSON();gochar={status:'unavailable',diagnostic:error.toJSON()};}}
 return freeze({snapshot,referenceSource:options.referenceMode,gochar,comparison,comparisonDiagnostic,calculatedAtUtc:new Date(context.now).toISOString()});
}
