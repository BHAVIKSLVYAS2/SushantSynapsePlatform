import {addDays,calendarRows,localDate,tithiLabel,monthNames,displayedMonth} from './panchang.mjs';

export function occasionTitle(row,language='en'){
 const hi=language==='hi';
 if(row.kind==='day')return row.day===4?(hi?'चौथा · दिन 4':'Chautha · day 4'):(hi?'दिन ':'Day ')+row.day;
 if(row.kind==='monthly')return (hi?'मासिक ':'Masik ')+row.number+(row.month?.adhika?(hi?' · अधिक मास':' · Adhik Maas'):'');
 return row.kind==='annual'?(hi?'बरसी / संवत्सरी':'Barsi / Samvatsari'):(hi?'पितृ पक्ष श्राद्ध':'Pitru Paksha Shraddha');
}

export function reminderSelection(result,now=Date.now()){
 const today=localDate(now),end=Number(result.yearly?.at(-1)?.year??today.slice(0,4))+ '-12-31';
 const rows=calendarRows(result).filter(row=>row.date?row.date>=today&&row.date<=end:row.candidates?.some(day=>day.date>=today&&day.date<=end));
 return {rows:rows.filter(row=>row.date&&!row.conditional&&['computed','counted'].includes(row.status)),withheld:rows.filter(row=>!row.date||row.conditional||!['computed','counted'].includes(row.status)),today};
}

const escapeText=value=>String(value).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
// RFC 5545 folds at 75 octets, including the continuation space; never split a UTF-8 character.
export function foldCalendarLine(line){
 const encoder=new TextEncoder();let output='',bytes=0;
 for(const char of line){const size=encoder.encode(char).length;if(bytes+size>75){output+='\r\n ';bytes=1;}output+=char;bytes+=size;}return output;
}

export async function calendarIcs(result,{language='en',reminderDays=1,now=Date.now()}={}){
 if(!['en','hi'].includes(language)||![0,1,3,7].includes(reminderDays))throw Error('Invalid calendar export options');
 const selection=reminderSelection(result,now);if(!selection.rows.length)throw Error(language==='hi'?'निर्यात के लिए कोई निश्चित आगामी तारीख नहीं है।':'No resolved upcoming dates are available to export.');
 const identity=JSON.stringify([result.data.date,result.data.time,result.data.location.pincode||[result.data.location.lat,result.data.location.lon],result.data.calendar,result.data.counting,result.firstDate]);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)),calendarId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const hi=language==='hi',lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sushant Synapse//Ritual Assist//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escapeText(hi?'श्राद्ध और बरसी कैलेंडर':'Shraddha & Barsi Calendar')];
 for(const row of selection.rows){
  const title=occasionTitle(row,language),key=row.kind+'-'+(row.window?Math.round(row.window.start/1000):row.date.replaceAll('-',''));
  const explanation=hi?'गणना आधारित तारीख; क्षेत्रीय पंचांग और पारिवारिक नियम पक्के करें। PIN निर्देशांक अनुमानित हैं।':'Calculated date; confirm regional Panchang and family rules. PIN-area coordinates are approximate.';
  const rule=row.kind==='day'?(hi?'शोक-दिन की गिनती; मृत्यु तिथि या चुनी गई सूर्योदय रीति से पहला दिन।':'Mourning-day count; day 1 follows the chosen civil-date or sunrise custom.'):(tithiLabel(row.window.number,language)+' · '+monthNames[language][displayedMonth(row.month,row.window.number,result.data.calendar)]+' · '+(hi?'स्थानीय अपराह्न से तारीख।':'Date selected by local Aparahna.'));
  lines.push('BEGIN:VEVENT','UID:'+calendarId+'-'+key+'@ritual-assist.sushantsynapse.com','DTSTAMP:'+stamp(now),'DTSTART;VALUE=DATE:'+row.date.replaceAll('-',''),'DTEND;VALUE=DATE:'+addDays(row.date,1).replaceAll('-',''),'SUMMARY:'+escapeText(title),'DESCRIPTION:'+escapeText(explanation+'\n'+rule),'CLASS:PRIVATE','TRANSP:TRANSPARENT');
  const alarm=+new Date(addDays(row.date,-reminderDays)+'T09:00:00+05:30');
  if(alarm>now)lines.push('BEGIN:VALARM','ACTION:DISPLAY','TRIGGER;VALUE=DATE-TIME:'+stamp(alarm),'DESCRIPTION:'+escapeText(title),'END:VALARM');
  lines.push('END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}
