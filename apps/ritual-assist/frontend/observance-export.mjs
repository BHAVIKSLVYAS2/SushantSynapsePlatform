import {localDate,addDays} from './lunar-core.mjs';
import {foldCalendarLine} from './calendar-export.mjs';
import {eventTitle,observanceTypes,policyVersion} from './observance-rules.mjs';
const escape=value=>String(value).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function reminderOccurrences(result,{types=Object.keys(observanceTypes),eventId=null,timed=false,now=Date.now()}={}){
 const today=localDate(now),rows=[];
 for(const event of result.events){
  if(!types.includes(event.type)||(eventId&&event.id!==eventId)||event.status!=='computed')continue;
  if(event.date>=today)rows.push({event,kind:'day',date:event.date});
  if(timed&&event.type==='sankashti'&&event.anchor>now)rows.push({event,kind:'moonrise',start:event.anchor,end:event.anchor+15*60000});
  if(timed&&event.parana?.status==='computed'&&event.parana.start>now)rows.push({event,kind:'parana',start:event.parana.start,end:event.parana.end});
 }
 return rows;
}
export async function observanceIcs(result,{language='en',reminder='1',...options}={}){
 if(!['en','hi'].includes(language)||!['none','0','1','3','7','evening'].includes(reminder))throw Error('Invalid reminder options');
 const now=options.now??Date.now(),rows=reminderOccurrences(result,{...options,now});if(!rows.length)throw Error(language==='hi'?'निर्यात के लिए निश्चित आगामी तारीखें नहीं हैं।':'No resolved upcoming dates to export.');
 const hi=language==='hi',lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sushant Synapse//Ritual Calendar//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escape(hi?'व्रत और तिथियाँ':'Vrats & lunar dates')];
 for(const row of rows){
  const event=row.event,title=eventTitle(event,language)+(row.kind==='parana'?(hi?' · पारण':' · Parana'):row.kind==='moonrise'?(hi?' · चन्द्रोदय':' · Moonrise'):''),identity=JSON.stringify([result.location.lat,result.location.lon,event.id,row.kind]);
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)),uid=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const description=[result.location.name,'Asia/Kolkata · '+policyVersion,observanceTypes[event.type].basis[language],hi?'गणना आधारित योजना; अपनी रीति की पुष्टि करें।':'Calculated planning date; confirm your tradition.','Created with Sushant Synapse · Ritual Assist'].join('\n');
  lines.push('BEGIN:VEVENT','UID:'+uid+'@ritual-assist.sushantsynapse.com','DTSTAMP:'+stamp(now),'SEQUENCE:0');
  if(row.kind==='day')lines.push('DTSTART;VALUE=DATE:'+row.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+addDays(row.date,1).replaceAll('-',''));
  else lines.push('DTSTART:'+stamp(row.start),'DTEND:'+stamp(row.end));
  lines.push('SUMMARY:'+escape(title),'DESCRIPTION:'+escape(description),'CLASS:PRIVATE','TRANSP:TRANSPARENT');
  const alarm=row.kind!=='day'?row.start-15*60000:reminder==='evening'?+new Date(addDays(row.date,-1)+'T20:00:00+05:30'):+new Date(addDays(row.date,reminder==='none'?0:-Number(reminder))+'T09:00:00+05:30');
  if(reminder!=='none'&&alarm>now)lines.push('BEGIN:VALARM','ACTION:DISPLAY','TRIGGER;VALUE=DATE-TIME:'+stamp(alarm),'DESCRIPTION:'+escape(title),'END:VALARM');
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}
