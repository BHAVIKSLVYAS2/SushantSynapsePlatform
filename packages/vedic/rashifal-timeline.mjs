import {siderealSnapshot,siderealProfile} from './sidereal.mjs';
import {civilDateMilliseconds} from './civil-time.mjs';
import {transitBodies,evaluateTransitSample} from './rashifal-transits.mjs';
import {findTransitCrossings} from './transit-crossings.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';

export const transitTimelineModel=freeze({id:'nine-graha-ist-crossings-v1',scanStepSeconds:1800,convergenceSeconds:.5,checkedRateLimitDegreesPerDay:24,
 guardArcsec:siderealProfile.classificationScreeningGuardArcsec,
 meaning:'Nominal longitude roots, including sign and screening-edge crossings. Thirty-minute station search; subsecond brackets are numerical convergence, not physical timing accuracy. Unresolved rulebooks remain unresolved.'});
export function transitEventsForDate(input){
 fields(input,['localDate','calculationProfileId']);if(input.calculationProfileId!==siderealProfile.id)fail('MODEL_UNAVAILABLE');
 const start=civilDateMilliseconds(input.localDate)-19800000,end=start+86400000,cache=new Map();
 const at=ms=>{ms=Math.round(ms);if(!cache.has(ms)){if(cache.size>=4096)fail('COMPUTATION_LIMIT');cache.set(ms,siderealSnapshot({timeScale:'UTC',utcInstant:new Date(ms).toISOString(),bodies:[...transitBodies],calculationProfileId:input.calculationProfileId}).positions);}return cache.get(ms);};
 const changes=[],contacts=[];
 for(const body of transitBodies){const roots=findTransitCrossings({startMs:start,endMs:end,longitudeAt:ms=>at(ms).find(p=>p.body===body).siderealLongitude,guardDegrees:transitTimelineModel.guardArcsec/3600});
  for(const root of roots.events){const before=at(root.lowerMs-1),after=at(root.upperMs+1),b=before.find(p=>p.body===body),a=after.find(p=>p.body===body);
   const ingresses=root.kind==='ingress';
   changes.push({...root,body,kind:ingresses?'ingress':Math.min(a.siderealLongitude%30,30-a.siderealLongitude%30)<transitTimelineModel.guardArcsec/3600?'guard-enter':'guard-exit',
    fromRashi:Math.floor(b.siderealLongitude/30)+1,toRashi:Math.floor(a.siderealLongitude/30)+1,
    utcInstant:new Date(root.upperMs).toISOString(),lowerUtc:new Date(root.lowerMs).toISOString(),upperUtc:new Date(root.upperMs).toISOString(),
    beforePositions:before,afterPositions:after});
  }
  for(const contact of roots.contacts)contacts.push({body,...contact});
 }
 changes.sort((a,b)=>a.upperMs-b.upperMs||transitBodies.indexOf(a.body)-transitBodies.indexOf(b.body));
 return freeze({localDate:input.localDate,status:contacts.length?'partial':'available',model:transitTimelineModel,startUtc:new Date(start).toISOString(),endUtc:new Date(end).toISOString(),endInclusive:false,changes,contacts,evaluations:cache.size});
}
export function timelineForRashi({days,rashi}){
 if(!Array.isArray(days)||!days.length||days.length>7||!Number.isInteger(rashi)||rashi<1||rashi>12)fail();
 const events=days.flatMap(day=>day.changes.map(event=>{
  const before=evaluateTransitSample({positions:event.beforePositions,rashi}),after=evaluateTransitSample({positions:event.afterPositions,rashi});
  const affected=after.flatMap((row,i)=>{const old=before[i];if(JSON.stringify([old.status,old.blockers,old.possibleBlockers])===JSON.stringify([row.status,row.blockers,row.possibleBlockers]))return [];
   return [{body:row.body,fromStatus:old.status,toStatus:row.status,fromBlockers:old.blockers,toBlockers:row.blockers,possibleBlockers:row.possibleBlockers}];});
  const {beforePositions,afterPositions,...root}=event;
  return {...root,localDate:day.localDate,fromHouse:(event.fromRashi-rashi+12)%12+1,toHouse:(event.toRashi-rashi+12)%12+1,affected};
 }));
 const unique=events.filter((event,i)=>!events.slice(0,i).some(old=>old.body===event.body&&old.kind===event.kind&&old.angle===event.angle&&old.lowerMs<=event.upperMs&&old.upperMs>=event.lowerMs));
 return freeze({model:transitTimelineModel,status:days.every(d=>d.status==='unavailable')?'unavailable':days.some(d=>d.status!=='available')?'partial':'available',days:days.map(d=>({localDate:d.localDate,status:d.status,evaluations:d.evaluations,contacts:d.contacts,...(d.diagnostic?{diagnostic:d.diagnostic}:{})})),events:unique});
}
