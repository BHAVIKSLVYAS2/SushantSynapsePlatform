import {siderealSnapshot,siderealProfile} from './sidereal.mjs';
import {normalizeDegrees} from './angles.mjs';
import {resolveAstronomyTime,civilInstantFromTT} from './astronomy-time.mjs';
import {fields,fail,freeze} from './diagnostics.mjs';

export const lunarCalendarModel=freeze({id:'amanta-ingress-candidate-1',monthSystem:'Amanta',
 monthNames:['Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada','Ashvina','Kartika','Margashirsha','Pausha','Magha','Phalguna'],
 phase:'P05 apparent geocentric Moon-minus-Sun',rootToleranceSeconds:0.5,
 naming:'month after sidereal solar sign at opening new moon; zero ingresses means adhika; two ingresses withheld',
 releaseStatus:'internal-candidate-month-reference-acceptance-pending'});
const day=86400000;
function sample(jd){const s=siderealSnapshot({timeScale:'TT',julianDay:jd,bodies:['Sun','Moon'],calculationProfileId:siderealProfile.id});
 return {phase:normalizeDegrees(s.positions[1].tropicalLongitude-s.positions[0].tropicalLongitude),sun:s.positions[0].siderealLongitude,warnings:s.warnings};}

// One-day knots advance <24 degrees; each selected phase can cross at most once.
export function lunarPhaseCrossings(input){
 fields(input,['startTtJulianDay','endTtJulianDay','phaseDegrees']);
 const start=input.startTtJulianDay,end=input.endTtJulianDay,target=input.phaseDegrees;
 if(![start,end,target].every(Number.isFinite)||end<=start||end-start>400||target<0||target>=360)fail();
 let left=start,a=sample(left),distance=normalizeDegrees(target-a.phase);if(distance===0)distance=360;
 let progress=0;const events=[];let evaluations=1;
 while(left<end){const right=Math.min(left+1,end),b=sample(right);evaluations++;
  const advance=normalizeDegrees(b.phase-a.phase);if(!(advance>0&&advance<(right-left)*24))fail('COMPUTATION_LIMIT');
  if(progress+advance>=distance){let lo=left,hi=right;
   for(let i=0;i<20&&(hi-lo)*86400>0.5;i++){const mid=(lo+hi)/2,m=sample(mid);evaluations++;
    if(progress+normalizeDegrees(m.phase-a.phase)>=distance)hi=mid;else lo=mid;}
   if((hi-lo)*86400>0.5)fail('COMPUTATION_LIMIT');
   const upper=civilInstantFromTT(hi),lower=civilInstantFromTT(lo);
   events.push({lowerTtJulianDay:lo,upperTtJulianDay:hi,utcInstant:upper.utcInstant,lowerUtcInstant:lower.utcInstant,bracketWidthSeconds:(hi-lo)*86400,
    warnings:[...new Set([...upper.time.warnings,...lower.time.warnings,...a.warnings,...b.warnings])]});distance+=360;
  }
  progress+=advance;left=right;a=b;if(evaluations>1400||events.length>15)fail('COMPUTATION_LIMIT');
 }
 return freeze({events,evaluations});
}
export function amantaMonthAtInstant(input){
 fields(input,['utcInstant']);const time=resolveAstronomyTime({timeScale:'UTC',utcInstant:input.utcInstant}),jd=time.ttJulianDay;
 // Search margins must remain within the pinned civil/astronomy intersection.
 if(Date.parse(input.utcInstant)<Date.parse('1950-02-10T00:00:00Z')||Date.parse(input.utcInstant)>Date.parse('2098-11-20T00:00:00Z'))fail('OUT_OF_RANGE');
 const roots=lunarPhaseCrossings({startTtJulianDay:jd-35,endTtJulianDay:jd+35,phaseDegrees:0}).events;
 if(roots.some(r=>jd>=r.lowerTtJulianDay&&jd<=r.upperTtJulianDay))fail('UNSTABLE_BIRTH_TIME');
 const first=roots.filter(r=>r.upperTtJulianDay<=jd).at(-1),last=roots.find(r=>r.lowerTtJulianDay>jd);
 if(!first||!last)fail('COMPUTATION_LIMIT');
 const a=sample(first.upperTtJulianDay),b=sample(last.upperTtJulianDay);
 // Guard month naming near a solar ingress, including root/model uncertainty.
 const edge=s=>Math.min(s.sun%30,30-s.sun%30)*3600;
 if(edge(a)<=61||edge(b)<=61)fail('UNSTABLE_BIRTH_TIME');
 const opening=Math.floor(a.sun/30),closing=Math.floor(b.sun/30),ingresses=(closing-opening+12)%12;
 if(ingresses>1)fail('MODEL_UNAVAILABLE');
 const monthNumber=(opening+1)%12+1;
 return freeze({model:lunarCalendarModel,number:monthNumber,name:lunarCalendarModel.monthNames[monthNumber-1],adhika:ingresses===0,
  ingresses,start:first,end:last,warnings:[...new Set([...time.warnings,...first.warnings,...last.warnings,'AMANTA_MONTH_REFERENCE_ACCEPTANCE_PENDING'])]});
}
export function civilBoundary(jd){return civilInstantFromTT(jd).utcInstant;}
