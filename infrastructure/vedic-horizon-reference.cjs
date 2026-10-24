'use strict';
// Independent numerical geometry screen; no closed-form ascendant expression.
// USNO altitude equation: https://aa.usno.navy.mil/faq/alt_az (2026-10-24).
// Rotate a zero-latitude ecliptic point to RA/Dec, scan the entire ecliptic,
// bracket both horizon roots, bisect, and choose the eastern one by hour angle.
function easternHorizonReference(localApparentDegrees,latitude,obliquityDegrees){
 const rad=Math.PI/180,theta=localApparentDegrees*rad,phi=latitude*rad,eps=obliquityDegrees*rad;
 function point(degrees){
  const lambda=degrees*rad,x=Math.cos(lambda),y=Math.sin(lambda)*Math.cos(eps),z=Math.sin(lambda)*Math.sin(eps);
  const ra=Math.atan2(y,x),dec=Math.asin(z),ha=theta-ra;
  return {sinAltitude:Math.cos(ha)*Math.cos(dec)*Math.cos(phi)+Math.sin(dec)*Math.sin(phi),
   east:-Math.sin(ha)*Math.cos(dec)};
 }
 const roots=[];
 for(let a=0;a<360;a+=5){
  let left=a,right=a+5,fl=point(left).sinAltitude,fr=point(right).sinAltitude;
  if(fl*fr>0)continue;
  for(let i=0;i<40;i++){
   const middle=(left+right)/2,fm=point(middle).sinAltitude;
   if(fl*fm<=0){right=middle;fr=fm;}else{left=middle;fl=fm;}
  }
  const root=(left+right)/2;
  if(point(root).east>0)roots.push(root%360);
 }
 if(!roots.length)throw Error('Independent horizon reference unavailable');
 return roots[0];
}
module.exports={easternHorizonReference};
