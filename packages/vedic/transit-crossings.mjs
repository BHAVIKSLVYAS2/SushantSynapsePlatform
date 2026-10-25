import {fail} from './diagnostics.mjs';

const delta=(a,b)=>((a-b+540)%360)-180;
const normalize=a=>((a%360)+360)%360;
// A bounded numerical search, not a certified physical error envelope. Split at
// finite-difference stations so a return crossing need not change knot labels.
export function findTransitCrossings({startMs,endMs,longitudeAt,guardDegrees,stepMs=1800000,toleranceMs=500}){
 if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||endMs<=startMs||endMs-startMs>86400000||typeof longitudeAt!=='function'||!(guardDegrees>0&&guardDegrees<1)||!Number.isSafeInteger(stepMs)||stepMs<60000||stepMs>1800000||!(toleranceMs>=1&&toleranceMs<=1000))fail();
 let evaluations=0;const cache=new Map(),at=t=>{t=Math.round(t);if(!cache.has(t)){if(++evaluations>4096)fail('COMPUTATION_LIMIT');const v=longitudeAt(t);if(!Number.isFinite(v)||v<0||v>=360)fail();cache.set(t,v);}return cache.get(t);};
 const velocity=t=>delta(at(t+30000),at(t-30000))/60000;
 const knots=[];for(let t=startMs;t<endMs;t+=stepMs)knots.push(t);knots.push(endMs);
 const stations=[];
 for(let i=1;i<knots.length;i++){
  let lo=knots[i-1],hi=knots[i],a=velocity(lo),b=velocity(hi);
  if(!Number.isFinite(a)||!Number.isFinite(b)||Math.max(Math.abs(a),Math.abs(b))*86400000>24)fail('COMPUTATION_LIMIT');
  if(a*b<0){for(let n=0;n<24&&hi-lo>toleranceMs;n++){const mid=Math.floor((lo+hi)/2),m=velocity(mid);if(m===0){lo=mid;hi=mid;break;}if(a*m<=0)hi=mid;else{lo=mid;a=m;}}stations.push({lowerMs:lo,upperMs:hi});}
 }
 const splits=[...new Set([...knots,...stations.map(s=>Math.round((s.lowerMs+s.upperMs)/2))])].sort((a,b)=>a-b),events=[],contacts=[];
 const targets=[];for(let sign=0;sign<12;sign++)for(const [kind,shift]of [['ingress',0],['guard',-guardDegrees],['guard',guardDegrees]])targets.push({kind,angle:normalize(sign*30+shift)});
 for(let i=1;i<splits.length;i++){
  const left=splits[i-1],right=splits[i],angle=at(left),advance=delta(at(right),angle);
  if(Math.abs(advance)>24*(right-left)/86400000+1e-7)fail('COMPUTATION_LIMIT');
  for(const target of targets){const distance=delta(target.angle,angle);
   if(Math.abs(advance)<1e-12){if(Math.abs(distance)<1e-9)contacts.push({kind:target.kind,angle:target.angle,lowerMs:left,upperMs:right});continue;}
   if(advance>0?distance<0||distance>advance:distance>0||distance<advance)continue;
   let lo=left,hi=right;
   for(let n=0;n<24&&hi-lo>toleranceMs;n++){const mid=Math.floor((lo+hi)/2),moved=delta(at(mid),angle);if(advance>0?moved>=distance:moved<=distance)hi=mid;else lo=mid;}
   if(hi-lo>toleranceMs)fail('COMPUTATION_LIMIT');
   // Evaluate either side of an exact knot/station root as well as its bracket.
   const before=delta(at(lo-1),target.angle),after=delta(at(hi+1),target.angle);
   if(before*after>=0){contacts.push({kind:target.kind,angle:target.angle,lowerMs:lo,upperMs:hi});continue;}
   if(hi<startMs||lo>=endMs)continue;
   const event={kind:target.kind,angle:target.angle,lowerMs:lo,upperMs:hi,direction:advance>0?'forward':'reverse',intervalMembership:lo<startMs||hi>=endMs?'boundary-uncertain':'inside'};
   if(!events.some(e=>e.kind===event.kind&&e.angle===event.angle&&Math.abs(e.upperMs-event.upperMs)<=toleranceMs+1))events.push(event);
  }
 }
 events.sort((a,b)=>a.upperMs-b.upperMs);
 const merged=[];for(const contact of contacts.sort((a,b)=>a.lowerMs-b.lowerMs)){const previous=merged.find(c=>c.kind===contact.kind&&c.angle===contact.angle&&contact.lowerMs<=c.upperMs+toleranceMs);if(previous)previous.upperMs=Math.max(previous.upperMs,contact.upperMs);else merged.push({...contact});}
 return {events,contacts:merged,stations,evaluations,scanStepMs:stepMs,toleranceMs};
}
