import {panchangSnapshot} from '../../../packages/vedic/panchang.mjs';
import {amantaMonthAtInstant} from '../../../packages/vedic/lunar-calendar.mjs';
import {limbText,term} from './display-text.mjs';

// A geocentric instant, not a local sunrise Panchang or festival calendar.
export function homeCalendar(now=Date.now(),language='en'){
 if(!Number.isFinite(now)||!['en','hi'].includes(language))throw new TypeError('Unsupported calendar input.');
 const utcInstant=new Date(now).toISOString(),p=panchangSnapshot({timeScale:'UTC',utcInstant,calculationProfileId:'IN_LAHIRI_DEFAULT_V1'});
 const month=amantaMonthAtInstant({utcInstant});
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'numeric'}).formatToParts(now).map(p=>[p.type,p.value]));
 // Chaitra-year Vikram convention: Pausha/Magha/Phalguna (and late
 // Margashirsha) in the Gregorian new year still belong to the prior VS year.
 // An adhika Chaitra year boundary requires regional adjudication.
 const samvat=month.adhika&&month.number===1?null:Number(parts.year)+(Number(parts.month)<=6&&month.number>=9?56:57);
 const locale=language==='hi'?'hi-IN':'en-IN',date=new Intl.DateTimeFormat(locale,{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
 return {date,samvat,month:(month.adhika?(language==='hi'?'अधिक ':'Adhika '):'')+term(month.name,language),
  tithi:p.nearBoundaryLimbs.includes('tithi')?null:limbText('tithi',p.limbs.tithi,language),
  asOf:new Intl.DateTimeFormat(locale,{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(now),
  convention:'Chaitra-year Vikram · Amanta · geocentric instant',utcInstant};
}
