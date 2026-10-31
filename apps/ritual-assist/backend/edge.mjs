import {calendarInput,calendarLocationResult} from './calendar-input.mjs';
import {generateCalendar} from '../frontend/panchang.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';
import {observanceInput} from './observance-input.mjs';
import {createObservanceCache} from './observances.mjs';
const observanceCache=createObservanceCache();
export async function ritual({request,env,route}){
 if(route==='ritual-assist/observances'){
  if(request.method!=='POST')fail(405,'Use POST to calculate a calendar');
  if(!env.CALENDAR_LIMITER)fail(503,'Calendar protection is unavailable');
  const rate=await env.CALENDAR_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'local'});if(!rate.success)fail(429,'The calendar is busy. Please try again in a minute');
  const input=observanceInput(await body(request,2048));return json({result:observanceCache.get(input)});
 }
 if(request.method!=='POST')fail(405,'Use POST to calculate a remembrance plan');if(!env.CALENDAR_LIMITER)fail(503,'Calendar protection is unavailable');const rate=await env.CALENDAR_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'local'});if(!rate.success)fail(429,'The calendar is busy. Please try again in a minute');const input=calendarInput(await body(request,2048));const result=generateCalendar(input);calendarLocationResult(result,input);return json({result});
}
