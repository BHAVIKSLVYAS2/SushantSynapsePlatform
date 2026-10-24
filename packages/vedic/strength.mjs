import {normalizeDegrees} from './angles.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';
export const ucchaBalaModel=freeze({id:'uccha-bala-shortest-arc-v1',
 source:{title:'Phaladeepika, G.S. Kapoor translation/commentary',url:'https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf',locator:'chapter 1 deep-exaltation points; chapter 4 opening commentary'},
 unit:'virupa',maximum:60,meaning:'one positional component, not full Shadbala',
 releaseStatus:'internal-candidate-independent-acceptance-pending',
 exaltationDegrees:{Sun:10,Moon:33,Mars:298,Mercury:165,Jupiter:95,Venus:357,Saturn:200}});
export function ucchaBala(input){
 fields(input,['body','siderealLongitude','modelId']);if(input.modelId!==ucchaBalaModel.id||!Object.hasOwn(ucchaBalaModel.exaltationDegrees,input.body))fail('MODEL_UNAVAILABLE');
 const longitude=normalizeDegrees(input.siderealLongitude),exaltation=ucchaBalaModel.exaltationDegrees[input.body],debilitation=normalizeDegrees(exaltation+180);
 const arc=normalizeDegrees(longitude-debilitation),distance=Math.min(arc,360-arc);
 return freeze({body:input.body,virupas:distance/3,rupas:distance/180,maximumVirupas:60,modelId:ucchaBalaModel.id,
  scope:'uccha-bala-only',fullShadbala:{status:'unavailable',diagnostic:{code:'MODEL_UNAVAILABLE'},reason:'Full Sthana, Dik, Kala, Cheshta, Naisargika and Drik methods/references are not implemented and accepted.'}});
}
