import {siderealSnapshot,siderealProfile} from './sidereal.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';

const physical=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
const moving=['Mercury','Venus','Mars','Jupiter','Saturn'];
const offsets=[-3600,-1800,-30,0,30,1800,3600];
const day=86400;
const arc=(from,to)=>((to-from+540)%360)-180;
const validAngle=n=>Number.isFinite(n)&&n>=0&&n<360;
export const planetConditionModel=freeze({id:'birth-motion-solar-distance-1',
 motion:'apparent geocentric tropical-longitude finite differences; consensus of forward/backward 1h and symmetric 30m rates',
 station:'sign disagreement or rate interval including zero => near-station, no exact station time inferred',
 numericalRateToleranceDegreesPerDay:0.000001,
 combustion:'shortest geocentric longitudinal Sun separation; not altitude, rise/set, physical visibility or eclipse detection',
 source:{title:'Phaladeepika, G.S. Kapoor commentary',url:'https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf',locator:'chapter 2.36 commentary, PDF page 27; chapter 4 cautions on strength'},
 thresholds:{Moon:[12],Mars:[17],Mercury:[14,12],Jupiter:[11],Venus:[10,8],Saturn:[15]},
 separationGuardArcsec:2*siderealProfile.classificationScreeningGuardArcsec,
 guardScope:'proposed positional screen plus sampled recorded-minute variation, not a certified error bound',
 releaseStatus:'candidate-independent-astronomical-and-traditional-review-pending'});

// Pure evaluator retained separately from acquisition for boundary/reference tests
// and to validate saved-in-memory evidence without trusting derived flags.
export function evaluatePlanetConditions({at,profile,samples}){
 if(profile!==siderealProfile.id||!Number.isFinite(Date.parse(at))||!Array.isArray(samples)||samples.length!==offsets.length)fail();
 const instant=Date.parse(at);
 for(const [i,s]of samples.entries()){
  if(s.at!==new Date(instant+offsets[i]*1000).toISOString()||!Array.isArray(s.positions)||s.positions.length!==physical.length||new Set(s.positions.map(p=>p.body)).size!==physical.length||s.positions.some(p=>!physical.includes(p.body)||!validAngle(p.tropicalLongitude)||!validAngle(p.siderealLongitude)))fail();
 }
 const position=(index,body)=>samples[index].positions.find(p=>p.body===body);
 const rows=physical.map(body=>{
  const center=position(3,body),motion={status:'not-applicable',rateDegreesPerDay:null,rateRange:null};
  if(moving.includes(body)){
   const rates=[arc(position(0,body).tropicalLongitude,center.tropicalLongitude)*day/3600,arc(center.tropicalLongitude,position(6,body).tropicalLongitude)*day/3600,arc(position(1,body).tropicalLongitude,position(5,body).tropicalLongitude)*day/3600];
   const epsilon=planetConditionModel.numericalRateToleranceDegreesPerDay,low=Math.min(...rates)-epsilon,high=Math.max(...rates)+epsilon;
   motion.status=high<0?'retrograde':low>0?'direct':'near-station';motion.rateDegreesPerDay=arc(position(0,body).tropicalLongitude,position(6,body).tropicalLongitude)*day/7200;motion.rateRange=[low,high];
  }
  let combustion={status:'not-applicable',separationDegrees:null,separationRange:null,thresholds:[]};
  if(body!=='Sun'){
   let thresholds=planetConditionModel.thresholds[body];
   if(thresholds.length===2)thresholds=motion.status==='direct'?[thresholds[0]]:motion.status==='retrograde'?[thresholds[1]]:[...thresholds];
   const separations=[2,3,4].map(i=>Math.abs(arc(position(i,'Sun').siderealLongitude,position(i,body).siderealLongitude))),guard=planetConditionModel.separationGuardArcsec/3600,range=[Math.max(0,Math.min(...separations)-guard),Math.min(180,Math.max(...separations)+guard)];
   combustion={status:range[1]<=Math.min(...thresholds)?'combust':range[0]>Math.max(...thresholds)?'clear':'uncertain',separationDegrees:separations[1],separationRange:range,thresholds:[...thresholds]};
  }
  return {body,siderealLongitude:center.siderealLongitude,motion,combustion};
 });
 return freeze({modelId:planetConditionModel.id,at,profile,samples:samples.map(s=>({at:s.at,positions:s.positions.map(p=>({body:p.body,tropicalLongitude:p.tropicalLongitude,siderealLongitude:p.siderealLongitude}))})),rows});
}
export function planetConditionsAtInstant(input){
 fields(input,['utcInstant','calculationProfileId']);const at=Date.parse(input.utcInstant);if(!Number.isFinite(at))fail();
 const samples=offsets.map(seconds=>{const at=new Date(Date.parse(input.utcInstant)+seconds*1000).toISOString(),sky=siderealSnapshot({timeScale:'UTC',utcInstant:at,calculationProfileId:input.calculationProfileId,bodies:physical});return {at,positions:sky.positions.map(({body,tropicalLongitude,siderealLongitude})=>({body,tropicalLongitude,siderealLongitude}))};});
 return evaluatePlanetConditions({at:new Date(at).toISOString(),profile:input.calculationProfileId,samples});
}
