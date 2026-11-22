import {signRulers} from './kundli-reading.mjs';
const available=f=>f?.status==='available'?f.value:null;
export function adaptJyotishCalculation(report){
 const chart=available(report?.features?.d1),positions=available(report?.features?.positions),timeline=available(report?.features?.dasha);
 const planets=(chart?.planets||positions?.positions||[]).map(p=>({body:p.body,sign:p.rashi,house:chart?p.houseNumber:null,longitude:p.siderealLongitude,nakshatra:p.nakshatra,pada:p.pada,stableSign:p.boundaryDistances?.rashiArcsec>121}));
 const houses=(chart?.houses||[]).map(h=>({number:h.houseNumber,sign:h.rashi,ruler:signRulers[h.rashi-1],occupants:[...h.bodies]}));
 const periods=(timeline?.mahadashas||[]).map(m=>({lord:m.lord,start:m.start.utcInstant,end:m.end.utcInstant,subperiods:m.antardashas.map(a=>({lord:a.lord,start:a.start.utcInstant,end:a.end.utcInstant}))}));
 return {contractVersion:'jyotish-input-1',kind:'natal',at:report?.calculatedAtUtc||null,birthInstant:report?.birth?.utcInstant||null,timeAccuracy:report?.birth?.timeAccuracy||'unknown',rising:chart?.ascendant.rashi||null,planets,houses,periods,active:timeline?{major:timeline.active.mahadashaLord,minor:timeline.active.antardashaLord,at:timeline.active.atUtcInstant}:null,
  unavailable:['full-shadbala','qualified-yogas-doshas','special-aspects','degree-orb-conjunctions','personal-natal-transit-activation'],scope:'admitted-D1-only; no nominal previews'};
}
