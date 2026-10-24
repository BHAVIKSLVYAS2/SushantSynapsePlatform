import {fields,fail,freeze} from './diagnostics.mjs';
export const vedicReleasePolicy=freeze({id:'vedic-release-gates-1',version:1,
 productionActive:false,publicRoutesEnabled:false,
 gates:{astronomySources:{status:'open',reason:'Original IAE/PAC and quantity-specific positional acceptance pending'},
  sunrise:{status:'open',reason:'Publisher sunrise convention/residual acceptance unresolved'},
  physicalBounds:{status:'open',reason:'Declared minute/model bounds are not independently certified'},
  editorial:{status:'open',reason:'Independent editorial and native-language review pending'},
  rulebooks:{status:'open',reason:'Regional and traditional rulebook review pending'},
  individualVargas:{status:'open',reason:'Individual advanced algorithms/source acceptance pending'},
  hostingPrivacy:{status:'open',reason:'No production Vedic routes, birth API, origin privacy or runtime budget acceptance'},
  deployment:{status:'open',reason:'No Vedic production build/origin/deployment acceptance or authorization'}},
 features:{rashifal:['astronomySources','editorial','hostingPrivacy','deployment'],kundli:['astronomySources','physicalBounds','hostingPrivacy','deployment'],
  birthObservance:['astronomySources','sunrise','rulebooks','hostingPrivacy','deployment'],timeMachine:['astronomySources','hostingPrivacy','deployment'],
  sensitivity:['astronomySources','physicalBounds','hostingPrivacy','deployment'],matching:['astronomySources','rulebooks','editorial','hostingPrivacy','deployment'],
  advanced:['astronomySources','physicalBounds','individualVargas','hostingPrivacy','deployment']},
 unavailable:['fullShadbala','birthVault','clientPortal','paymentProvider','automaticMessaging'],
 meaning:'Passing internal regressions does not close source, privacy, human review or deployment gates'});
export function evaluateVedicRelease(input){
 fields(input,['runtime','features']);if(!['node','workers'].includes(input.runtime)||!Array.isArray(input.features)||input.features.length<1||input.features.length>7)fail();
 const requested=[];for(let i=0;i<input.features.length;i++){const d=Object.getOwnPropertyDescriptor(input.features,String(i));if(!d||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!Object.hasOwn(vedicReleasePolicy.features,d.value)||requested.includes(d.value))fail('MODEL_UNAVAILABLE');requested.push(d.value);}
 const required=[...new Set(requested.flatMap(feature=>vedicReleasePolicy.features[feature]))];
 const missing=required.filter(key=>vedicReleasePolicy.gates[key].status!=='accepted').map(id=>({id,...vedicReleasePolicy.gates[id]}));
 return freeze({contractVersion:'vedic-release-readiness-1',policyId:vedicReleasePolicy.id,runtime:input.runtime,features:requested,
  ready:missing.length===0&&vedicReleasePolicy.productionActive&&vedicReleasePolicy.publicRoutesEnabled,status:'blocked',missing,
  activation:'no-route-registry-api-or-deployment-mutation',unavailable:vedicReleasePolicy.unavailable});
}
