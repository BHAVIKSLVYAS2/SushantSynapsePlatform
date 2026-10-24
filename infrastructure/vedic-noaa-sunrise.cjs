'use strict';
// Test-only independent low-order solar model, never a runtime fallback.
// Numerical equations: NOAA Global Monitoring Division, General Solar Position
// Calculations, https://gml.noaa.gov/grad/solcalc/solareqns.PDF (viewed 2026-10-24).
// Evaluate fractional year at noon per the printed day-of-year approximation.
// Constant 90.833-degree zenith versus runtime distance-dependent solar radius.
function noaaSunrise(localDate,latitude,longitude){
 const midnight=Date.parse(localDate+'T00:00:00Z'),year=Number(localDate.slice(0,4));
 const dayOfYear=(midnight-Date.UTC(year,0,1))/86400000+1;
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const g=2*Math.PI/(leap?366:365)*(dayOfYear-1),rad=Math.PI/180;
 const eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)
  -0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
 const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)
  -0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
 const cosHa=Math.cos(90.833*rad)/(Math.cos(latitude*rad)*Math.cos(dec))-Math.tan(latitude*rad)*Math.tan(dec);
 if(Math.abs(cosHa)>1)return null;
 const ha=Math.acos(cosHa)/rad;
 return new Date(midnight+(720-4*(longitude+ha)-eq)*60000).toISOString();
}
module.exports={noaaSunrise};
