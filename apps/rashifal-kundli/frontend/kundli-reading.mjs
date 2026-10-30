// Original editorial interpretation rules, separate from astronomical facts.
// No clock, network, persistence, random scores, or inferred life-event dates.
export const readingModelId='kundli-everyday-2';
export const signRulers=Object.freeze(['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter']);
const available=feature=>feature?.status==='available'?feature.value:null;
export function buildKundliReading(report){
 const chart=available(report.features.d1),positions=available(report.features.positions),timeline=available(report.features.dasha);
 const moon=chart?.planets.find(p=>p.body==='Moon')??positions?.positions.find(p=>p.body==='Moon');
 // Reuse the existing D1 bridge's conservative minute-resolution sign screen.
 // A numeric nominal Moon alone is not permission to assert a stable sign.
 const moonSignGuardArcsec=121,moonStable=!!moon&&moon.boundaryDistances.rashiArcsec>moonSignGuardArcsec;
 function house(number){if(!chart)return null;const h=chart.houses.find(h=>h.houseNumber===number),ruler=signRulers[h.rashi-1],planet=chart.planets.find(p=>p.body===ruler);
  return {house:number,sign:h.rashi,ruler,rulerHouse:planet.houseNumber,rulerSign:planet.rashi,occupants:[...h.bodies]};}
 const topics={personality:moonStable?{moon:moon.rashi,rising:chart?.ascendant.rashi??null}:null,
  appearance:chart?{rising:chart.ascendant.rashi,...house(1)}:null,
  career:house(10),money:house(2),relationships:house(7),learning:house(5),home:house(4)};
 const at=timeline?Date.parse(timeline.active.atUtcInstant):null;
 const periods=timeline?timeline.mahadashas.flatMap(major=>major.antardashas.map(minor=>({major:major.lord,minor:minor.lord,start:minor.start,end:minor.end}))).filter(p=>p.end.milliseconds>at).slice(0,3).map(period=>({...period,placements:chart?[...new Set([period.major,period.minor])].map(body=>{const planet=chart.planets.find(p=>p.body===body);return {body,house:planet.houseNumber,sign:planet.rashi};}):[]})):[];
 return {modelId:readingModelId,kind:'traditional-editorial-interpretation',calculatedAtUtc:report.calculatedAtUtc,
  identity:{moon:moonStable?moon.rashi:null,rising:chart?.ascendant.rashi??null,nakshatra:timeline?.balance.nakshatra??null},
  topics,periods,nextTransition:timeline?.active.nextTransition??null,
  limits:{exactTime:report.birth.timeAccuracy==='exact',moonSignGuardArcsec,houseReading:!!chart,periodReading:!!timeline,aspectsAssessed:false,strengthAssessed:false,eventPrediction:false}};
}
