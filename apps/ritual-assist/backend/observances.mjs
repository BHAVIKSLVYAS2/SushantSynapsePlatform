import {DAY,BOUNDARY_GUARD,localDate,midnight,addDays,tithiWindow,nextTithi,daylight,moonrise} from '../frontend/lunar-core.mjs';
import {monthAt} from '../frontend/panchang.mjs';
import {policyVersion,observanceTypes} from '../frontend/observance-rules.mjs';
const contains=(w,time)=>time!==null&&time>=w.start&&time<w.end;
const near=(w,time)=>Math.min(Math.abs(time-w.start),Math.abs(time-w.end))<BOUNDARY_GUARD;
const intersect=(w,start,end)=>({start:Math.max(w.start,start),end:Math.min(w.end,end)});
const length=w=>Math.max(0,w.end-w.start);

// Exported to exercise rare boundary cases without inventing astronomical fixtures.
export function selectOccurrence(window,candidates,mode){
 if(mode==='sunrise'||mode==='moonrise'){
  const eligible=candidates.filter(day=>contains(window,day[mode]));
  const chosen=eligible[0];
  return chosen?{date:chosen.date,status:eligible.length!==1?'confirmation':near(window,chosen[mode])?'boundary':'computed',anchor:chosen[mode],candidateDates:eligible.map(d=>d.date)}:{date:localDate(window.start),status:'confirmation',anchor:null,candidateDates:[localDate(window.start),localDate(window.end)]};
 }
 const overlaps=candidates.map(day=>({date:day.date,...intersect(window,...day[mode])})).filter(w=>length(w)>0);
 if(mode!=='fasting')overlaps.sort((a,b)=>length(b)-length(a)||a.date.localeCompare(b.date));
 const chosen=overlaps[0];
 if(!chosen)return {date:localDate(window.start),status:'confirmation',anchor:null};
 const close=mode!=='fasting'&&overlaps.length>1&&Math.abs(length(chosen)-length(overlaps[1]))<BOUNDARY_GUARD;
 const boundary=length(chosen)<BOUNDARY_GUARD||candidates.filter(d=>d.date===chosen.date).some(d=>d[mode].some(t=>near(window,t)));
 return {date:chosen.date,status:close?'confirmation':boundary?'boundary':'computed',anchor:chosen.start,period:{start:chosen.start,end:chosen.end}};
}

export function paranaFor(window,occurrence,light){
 if(occurrence.status!=='computed')return {status:'confirmation'};
 const dwadashi=nextTithi(window),day=light(addDays(occurrence.date,1)),hariVasaraEnd=dwadashi.start+(dwadashi.end-dwadashi.start)/4;
 if(dwadashi.end<=day.sunrise+BOUNDARY_GUARD)return {status:'confirmation',reason:'dwadashi-before-sunrise',dwadashiEnd:dwadashi.end,hariVasaraEnd};
 const start=Math.max(day.sunrise,hariVasaraEnd),end=Math.min(day.sunrise+(day.sunset-day.sunrise)/5,dwadashi.end);
 // Only the ordinary, non-boundary morning rule is released. Special cases are
 // visible as unconfirmed, never converted into a misleading timed reminder.
 if(end-start<BOUNDARY_GUARD||Math.abs(day.sunrise-dwadashi.end)<BOUNDARY_GUARD||Math.abs(day.sunrise-hariVasaraEnd)<BOUNDARY_GUARD)return {status:'confirmation',dwadashiEnd:dwadashi.end,hariVasaraEnd};
 return {status:'computed',start,end,dwadashiEnd:dwadashi.end,hariVasaraEnd};
}

export function generateObservances(data){
 const begin=data.month+'-01',monthStart=midnight(begin),monthEnd=+new Date(Date.UTC(+data.month.slice(0,4),+data.month.slice(5),1))-330*60000;
 const lightCache=new Map(),moonCache=new Map();
 const light=date=>{if(!lightCache.has(date))lightCache.set(date,daylight(date,data.location));return lightCache.get(date);};
 const moon=date=>{if(!moonCache.has(date))moonCache.set(date,moonrise(date,data.location));return moonCache.get(date);};
 const windows=[];let current=tithiWindow(monthStart-3*DAY+1000);
 while(current.start<monthEnd+3*DAY){windows.push(current);current=nextTithi(current);if(windows.length>45)throw Error('Calendar calculation bound exceeded');}
 const days=[];for(let day=begin;midnight(day)<monthEnd;day=addDays(day,1)){
  const l=light(day),window=windows.find(w=>contains(w,l.sunrise));days.push({...l,tithi:window.number,tithiEnd:window.end});
 }
 const events=[];let lunarMonth=null;
 for(const window of windows){
  const types=window.number===11||window.number===26?['ekadashi']:window.number===30?['amavasya']:window.number===15?['purnima','purnima-vrat']:window.number===19?['sankashti']:window.number===4?['vinayaka']:window.number===13||window.number===28?['pradosh']:[];
  if(!types.length)continue;
  if(!lunarMonth||window.start+1000>=lunarMonth.end)lunarMonth=monthAt(window.start+1000);
  const candidates=[];const start=localDate(window.start-DAY);
  for(let i=0;i<4;i++){
   const date=addDays(start,i),l=light(date),next=light(addDays(date,1)),dayLength=l.sunset-l.sunrise;
   candidates.push({...l,moonrise:types.includes('sankashti')?moon(date):null,midday:[l.sunrise+dayLength*.4,l.sunrise+dayLength*.6],fasting:[l.sunrise+dayLength*.4,l.sunrise+dayLength*.6],evening:[l.sunset,l.sunset+(next.sunrise-l.sunset)/5]});
  }
  for(const type of types){
   const mode=type==='sankashti'?'moonrise':type==='vinayaka'?'midday':type==='pradosh'?'evening':type==='purnima-vrat'?'fasting':'sunrise';
   const selection=selectOccurrence(window,candidates,mode);
   const event={id:type+'-'+Math.round(window.start/60000),type,...selection,window,month:lunarMonth,rule:observanceTypes[type].rule,angarki:type==='sankashti'&&new Date(selection.date+'T12:00:00+05:30').getUTCDay()===2};
   if(type==='ekadashi'){
    event.parana=paranaFor(window,selection,light);
    // A Dwadashi skipped at the following sunrise can move the household fast
    // to the previous day (e.g. Trisparsha). Do not publish the ordinary sunrise
    // date as resolved, even though the Ekadashi itself spans one sunrise.
    if(event.parana.reason==='dwadashi-before-sunrise'){event.status='confirmation';event.candidateDates=[addDays(event.date,-1),event.date];event.date=event.candidateDates[0];}
   }
   if(event.date.slice(0,7)!==data.month)continue;
   events.push(event);
  }
 }
 events.sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type));
 return {month:data.month,location:data.location,calendar:data.calendar,tradition:data.tradition,days,events,calculation:{engine:'Astronomy Engine 2.1.19',policyVersion,zone:'Asia/Kolkata',processing:'server',stored:false,boundaryMinutes:5}};
}

// Public monthly calculations only. Exact coordinates and policy revisions are
// in the key; no remembrance inputs or private records enter this bounded cache.
export function createObservanceCache(limit=24){
 const cache=new Map();return {get(data,now=Date.now()){
  const key=JSON.stringify([data.month,data.location.pincode,data.location.lat,data.location.lon,data.location.height||0,data.calendar,data.tradition,policyVersion]);
  const hit=cache.get(key);if(hit&&now-hit.time<3600000)return hit.result;
  const result=generateObservances(data);cache.delete(key);cache.set(key,{time:now,result});if(cache.size>limit)cache.delete(cache.keys().next().value);return result;
 }};
}
