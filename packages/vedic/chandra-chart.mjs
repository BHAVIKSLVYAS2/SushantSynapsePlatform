import {freeze,fail} from './diagnostics.mjs';

// Chandra Lagna: retain D1 signs/longitudes, count whole-sign houses from Moon.
// P.V.R. Narasimha Rao, Vedic Astrology: An Integrated Approach, section 7.3.2.
export function chandraChartFromD1(d1){
 if(d1?.chartType!=='D1'||d1.houseSystem!=='whole-sign'||d1.planets?.length!==9)fail();
 const moon=d1.planets.find(p=>p.body==='Moon');if(!moon)fail();
 const planets=d1.planets.map(p=>({...p,sourceSiderealLongitude:p.siderealLongitude,houseNumber:(p.rashi-moon.rashi+12)%12+1}));
 const houses=Array.from({length:12},(_,i)=>({houseNumber:i+1,rashi:(moon.rashi-1+i)%12+1,bodies:planets.filter(p=>p.houseNumber===i+1).map(p=>p.body)}));
 return freeze({chartType:'Chandra',houseSystem:'whole-sign',reference:'Moon',
  ascendant:{rashi:moon.rashi,sourceSiderealLongitude:moon.siderealLongitude},planets,houses,
  warnings:d1.warnings??[]});
}
