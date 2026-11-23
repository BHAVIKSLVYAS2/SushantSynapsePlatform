import {signRulers} from './kundli-reading.mjs';
import {siderealSnapshot} from '../../../packages/vedic/sidereal.mjs';
import {evaluateTransitSample} from '../../../packages/vedic/rashifal-transits.mjs';
import {VedicInputError} from '../../../packages/vedic/diagnostics.mjs';
const available=f=>f?.status==='available'?f.value:null;
const skyCache=new Map();
function currentTransits(report,chart,planets){
 const moon=planets.find(p=>p.body==='Moon'&&p.stableSign),at=report?.calculatedAtUtc,profile=report?.birth?.calculationProfileId;
 if(!chart||!moon||!Number.isFinite(Date.parse(at))||!profile)return {status:'unavailable',reason:'stable-D1-Moon-and-report-instant-required'};
 try{const key=profile+'|'+at;let sky=skyCache.get(key);if(!sky){sky=siderealSnapshot({timeScale:'UTC',utcInstant:at,calculationProfileId:profile});skyCache.set(key,sky);while(skyCache.size>12)skyCache.delete(skyCache.keys().next().value);}
  return {status:'available',at,reference:'admitted-natal-Moon',referenceSign:moon.sign,profile,scope:'single-instant-whole-sign-not-continuous-event-activation',rows:evaluateTransitSample({positions:sky.positions,rashi:moon.sign}).map(p=>({...p,lagnaHouse:p.nearBoundary?null:(p.rashi-chart.ascendant.rashi+12)%12+1}))};
 }catch(error){if(!(error instanceof VedicInputError))throw error;return {status:'unavailable',reason:error.code};}
}
export function adaptJyotishCalculation(report){
 const chart=available(report?.features?.d1),positions=available(report?.features?.positions),timeline=available(report?.features?.dasha);
 const planets=(chart?.planets||positions?.positions||[]).map(p=>({body:p.body,sign:p.rashi,house:chart?p.houseNumber:null,longitude:p.siderealLongitude,nakshatra:p.nakshatra,pada:p.pada,stableSign:p.boundaryDistances?.rashiArcsec>121}));
 const houses=(chart?.houses||[]).map(h=>({number:h.houseNumber,sign:h.rashi,ruler:signRulers[h.rashi-1],occupants:[...h.bodies]}));
 const periods=(timeline?.mahadashas||[]).map(m=>({lord:m.lord,start:m.start.utcInstant,end:m.end.utcInstant,subperiods:m.antardashas.map(a=>({lord:a.lord,start:a.start.utcInstant,end:a.end.utcInstant}))}));
 const d9=chart&&available(report?.features?.d9),divisions={d9:d9?d9.planets.map(p=>({body:p.body,sign:p.rashi})):null};
 return {contractVersion:'jyotish-input-2',kind:'natal',at:report?.calculatedAtUtc||null,birthInstant:report?.birth?.utcInstant||null,timeAccuracy:report?.birth?.timeAccuracy||'unknown',rising:chart?.ascendant.rashi||null,planets,houses,periods,divisions,currentTransit:currentTransits(report,chart,planets),active:timeline?{major:timeline.active.mahadashaLord,minor:timeline.active.antardashaLord,at:timeline.active.atUtcInstant}:null,
  unavailable:['full-shadbala','qualified-yogas-doshas','degree-orb-conjunctions','retrograde-combustion-qualification','continuous-personal-event-timing'],scope:'admitted-D1/D9-only; no nominal previews; current Moon-relative transit snapshot'};
}
