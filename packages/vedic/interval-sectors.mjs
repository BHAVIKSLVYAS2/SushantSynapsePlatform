import {normalizeDegrees} from './angles.mjs';
import {fields,fail,freeze,VedicInputError} from './diagnostics.mjs';
const day=86400000;
// Closed angular envelopes deliberately overapproximate half-open time endpoints.
export function sectorEnclosure(angle,radiusDegrees,count){
 if(!Number.isFinite(angle)||!Number.isFinite(radiusDegrees)||radiusDegrees<0||!Number.isInteger(count)||count<1||count>108)fail();
 angle=normalizeDegrees(angle);const possible=[];
 for(let i=0;i<count;i++){
  const a=i*360/count,b=(i+1)*360/count;
  if(radiusDegrees>=180||[-360,0,360].some(turn=>angle-radiusDegrees<=b+turn&&angle+radiusDegrees>=a+turn))possible.push(i);
 }
 return possible;
}
export function coverSectorInterval(input,sampleAngle){
 fields(input,['startMilliseconds','endMilliseconds','endInclusive','maximumRateDegreesPerDay','guardArcsec','minimumWindowMilliseconds','maximumCells']);
 const {startMilliseconds:start,endMilliseconds:end,maximumRateDegreesPerDay:rate,guardArcsec:guard}=input;
 const minimum=input.minimumWindowMilliseconds??5000,maximum=input.maximumCells??4096;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start||end-start>day||typeof input.endInclusive!=='boolean'||!Number.isFinite(rate)||rate<0||!Number.isFinite(guard)||guard<0||!Number.isInteger(minimum)||minimum<1||minimum>60000||!Number.isInteger(maximum)||maximum<1||maximum>8192||typeof sampleAngle!=='function')fail();
 let nodes=0;
 function cell(a,b,sample,reason=null){const radius=rate*Math.max(Math.abs(a-sample.time),Math.abs(b-sample.time))/day+guard/3600+360*Number.EPSILON*1024;
  return {startMilliseconds:a,endMilliseconds:b,sampleMilliseconds:sample.time,angle:sample.angle,radiusDegrees:radius,reason};}
 function visit(a,b,parent){nodes++;let sample;
  if(nodes>maximum&&parent)return [cell(a,b,parent,'COMPUTATION_LIMIT')];
  try{const time=Math.floor((a+b)/2);sample={time,angle:normalizeDegrees(sampleAngle(time))};}
  catch(error){if(error instanceof VedicInputError&&error.code==='COMPUTATION_LIMIT'&&parent)return [cell(a,b,parent,'COMPUTATION_LIMIT')];throw error;}
  const envelope=cell(a,b,sample);
  if(sectorEnclosure(envelope.angle,envelope.radiusDegrees,108).length===1)return [envelope];
  if(b-a<=minimum||nodes>=maximum){envelope.reason=nodes>=maximum?'COMPUTATION_LIMIT':'UNRESOLVED_BOUNDARY_WINDOW';return [envelope];}
  const mid=Math.floor((a+b)/2);return [...visit(a,mid,sample),...visit(mid,b,sample)];
 }
 const cells=visit(start,end,null);
 return freeze({startMilliseconds:start,endMilliseconds:end,endInclusive:input.endInclusive,rateDegreesPerDay:rate,guardArcsec:guard,
  cells,nodes,coverage:'complete-closed-envelope-cover',budgetLimited:cells.some(c=>c.reason==='COMPUTATION_LIMIT')});
}
export function summarizeSectorCover(cover,{sectorCount,mapping='identity'}){
 if(![12,27,108].includes(sectorCount)||!['identity','pada','navamsa'].includes(mapping)||mapping!=='identity'&&sectorCount!==108)fail();
 const map=i=>mapping==='pada'?i%4+1:mapping==='navamsa'?i%12+1:i+1;
 const possible=new Set(),proved=new Set(),windows=[];
 for(const cell of cover.cells){const values=[...new Set(sectorEnclosure(cell.angle,cell.radiusDegrees,sectorCount).map(map))];for(const value of values)possible.add(value);
  if(values.length===1)proved.add(values[0]);else {const last=windows.at(-1);if(last&&last.endMilliseconds===cell.startMilliseconds){last.endMilliseconds=cell.endMilliseconds;last.possibleValues=[...new Set([...last.possibleValues,...values])].sort((a,b)=>a-b);}
   else windows.push({startMilliseconds:cell.startMilliseconds,endMilliseconds:cell.endMilliseconds,possibleValues:values.sort((a,b)=>a-b)});}
 }
 return freeze({status:possible.size===1?'stable':proved.size>1?'changes-within-interval':'unsupported',
  scope:'conditional-on-declared-rate-and-model-guards',possibleValues:[...possible].sort((a,b)=>a-b),provedValues:[...proved].sort((a,b)=>a-b),
  possibleBoundaryWindows:windows.map(w=>({startUtc:new Date(w.startMilliseconds).toISOString(),endUtc:new Date(w.endMilliseconds).toISOString(),possibleValues:w.possibleValues,
   meaning:'conservative possible-boundary window, not an exact transition or count'})),budgetLimited:cover.budgetLimited});
}
