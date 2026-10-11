import {calendarInput} from './calendar-input.mjs';
import {generateCalendar} from '../frontend/panchang.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';
export async function ritual({request,env}){
 if(request.method!=='POST')fail(405,'Use POST to calculate a remembrance plan');if(!env.CALENDAR_LIMITER)fail(503,'Calendar protection is unavailable');const rate=await env.CALENDAR_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'local'});if(!rate.success)fail(429,'The calendar is busy. Please try again in a minute');const input=calendarInput(await body(request,2048));const result=generateCalendar(input);if(input.postal)result.data.location={...result.data.location,...input.postal};result.calculation={locationBasis:'Death PIN code area is also used as the observance location; postal coordinates are approximate',defaults:'Regional lunar-month label; civil death date is day 1; day 13 included',processing:'server',stored:false};return json({result});
}
