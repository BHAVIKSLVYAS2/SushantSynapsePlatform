import {dailyAlmanac,currentChoghadiya,istDate} from '../../../packages/vedic/daily-almanac.mjs';
import {getPlace,searchPlaces} from '../../../packages/vedic/places.mjs';
import {placeLabel} from './place-text.mjs';

const labels={
 en:{title:'Today’s local timings',city:'Change city',search:'Search an Indian city',none:'No matching city. Try another spelling.',reference:'Reference city · choose your city for local timings',sunrise:'Sunrise',sunset:'Sunset',moonrise:'Moonrise',moonset:'Moonset',noEvent:'No event today',now:'Current Choghadiya',day:'Day Choghadiya',night:'Night Choghadiya',previous:'Previous night',all:'View day & night timings',current:'Now',unavailable:'Timings unavailable. Try another city or return later.',note:'Approximate IST timings · standard atmosphere, unobstructed horizon, sea level. Basic Choghadiya; Vaar/Kaal Vela, Kaal Ratri and Rahu Kaal overlaps are not included.',source:'Calculation method',names:['Udveg','Char','Labh','Amrit','Kaal','Shubh','Rog']},
 hi:{title:'आज के स्थानीय समय',city:'शहर बदलें',search:'भारतीय शहर खोजें',none:'शहर नहीं मिला। दूसरी वर्तनी आज़माएँ।',reference:'संदर्भ शहर · स्थानीय समय के लिए अपना शहर चुनें',sunrise:'सूर्योदय',sunset:'सूर्यास्त',moonrise:'चंद्रोदय',moonset:'चंद्रास्त',noEvent:'आज यह घटना नहीं',now:'अभी का चौघड़िया',day:'दिन का चौघड़िया',night:'रात का चौघड़िया',previous:'पिछली रात',all:'दिन और रात के समय देखें',current:'अभी',unavailable:'समय उपलब्ध नहीं हैं। दूसरा शहर चुनें या बाद में देखें।',note:'अनुमानित IST समय · मानक वायुमंडल, खुला क्षितिज, समुद्र तल। सामान्य चौघड़िया; वार/काल वेला, काल रात्रि और राहु काल का मिलान शामिल नहीं है।',source:'गणना की विधि',names:['उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग']},
 gu:{title:'આજના સ્થાનિક સમય',city:'શહેર બદલો',search:'ભારતીય શહેર શોધો',none:'શહેર મળ્યું નહીં. બીજી જોડણી અજમાવો.',reference:'સંદર્ભ શહેર · સ્થાનિક સમય માટે તમારું શહેર પસંદ કરો',sunrise:'સૂર્યોદય',sunset:'સૂર્યાસ્ત',moonrise:'ચંદ્રોદય',moonset:'ચંદ્રાસ્ત',noEvent:'આજે આ ઘટના નથી',now:'હાલનું ચોઘડિયું',day:'દિવસનાં ચોઘડિયાં',night:'રાતનાં ચોઘડિયાં',previous:'ગઈ રાત',all:'દિવસ અને રાતના સમય જુઓ',current:'હાલ',unavailable:'સમય ઉપલબ્ધ નથી. બીજું શહેર પસંદ કરો અથવા પછી જુઓ.',note:'અંદાજિત IST સમય · માનક વાતાવરણ, ખુલ્લી ક્ષિતિજ, સમુદ્ર સપાટી. સામાન્ય ચોઘડિયાં; વાર/કાળ વેળા, કાળ રાત્રિ અને રાહુ કાળનું મૂલ્યાંકન સામેલ નથી.',source:'ગણતરીની રીત',names:['ઉદ્વેગ','ચર','લાભ','અમૃત','કાળ','શુભ','રોગ']}
};
const names=labels.en.names,key='ritvayam.almanac-city.v1',fallback='geonames:1261481';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function mountDailyAlmanac(container,{now=()=>Date.now(),compact=false}={}){
 const root=el('section');root.className='daily-almanac'+(compact?' almanac-compact':'');root.setAttribute('translate','no');
 let language=window.SynapseLanguage?.get()||'en',placeId=fallback,explicit=false,cached=null,lastRender='';
 try{const saved=localStorage.getItem(key);if(saved){getPlace(saved);placeId=saved;explicit=true;}}catch{}
 const title=el('h3'),locality=el('p'),reference=el('p'),change=el('details'),summary=el('summary'),label=el('label'),caption=el('span'),input=el('input'),matches=el('div'),searchStatus=el('p');
 input.type='search';input.autocomplete='off';input.maxLength=100;label.append(caption,input);matches.className='almanac-city-results';searchStatus.role='status';change.append(summary,label,matches,searchStatus);
 const header=el('div');header.className='almanac-heading';header.append(title,change);locality.className='almanac-locality';reference.className='almanac-note';
 const facts=el('dl');facts.className='almanac-events';const current=el('p');current.className='almanac-current';current.role='status';
 const details=el('details'),detailsSummary=el('summary'),periods=el('div'),note=el('p'),source=el('a');periods.className='almanac-periods';note.className='almanac-note';source.href='https://www.drikpanchang.com/tutorials/muhurat/daily/choghadiya-muhurat.html?lang=en';source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';details.append(detailsSummary,periods,note,source);
 root.append(header,locality,reference,facts,current,details);if(compact){current.remove();detailsSummary.append(current);root.insertBefore(facts,header);change.append(reference);}
 container.append(root);
 function search(){matches.replaceChildren();searchStatus.textContent='';if(input.value.trim().length<2)return;
  let found=[];try{found=searchPlaces(input.value,{limit:8}).matches;}catch{}
  if(!found.length)searchStatus.textContent=labels[language].none;
  for(const place of found){const button=el('button',placeLabel(place,language));button.type='button';button.dataset.almanacPlace=place.id;button.onclick=()=>{placeId=place.id;explicit=true;cached=null;try{localStorage.setItem(key,placeId);}catch{}input.value='';matches.replaceChildren();change.open=false;summary.focus();render();window.dispatchEvent(new CustomEvent('ritvayam-almanac-place',{detail:{placeId}}));};matches.append(button);}
 }
 input.addEventListener('input',search);
 function render(){
  const t=labels[language],instant=now(),date=istDate(instant);
  const active=cached&&currentChoghadiya([...cached.previousNight,...cached.day,...cached.night],instant),renderKey=[date,placeId,language,explicit,active?.start].join(':');
  if(cached?.localDate===date&&lastRender===renderKey)return;
  root.lang=language;root.dataset.placeId=placeId;title.textContent=t.title;summary.textContent=compact?placeLabel(getPlace(placeId),language).split(',')[0]:t.city;summary.setAttribute('aria-label',t.city+': '+placeLabel(getPlace(placeId),language));caption.textContent=t.search;reference.textContent=t.reference;reference.hidden=explicit;
  locality.textContent=placeLabel(getPlace(placeId),language)+' · '+new Intl.DateTimeFormat(({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[language],{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric'}).format(instant)+' · IST';
  if(!compact)detailsSummary.textContent=t.all;else detailsSummary.setAttribute('aria-label',t.all);note.textContent=t.note;source.textContent=t.source;facts.replaceChildren();periods.replaceChildren();
  const locale=({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[language],clock=new Intl.DateTimeFormat(locale,{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:!compact});
  const time=value=>{if(value===null)return t.noEvent;const text=clock.format(value);return istDate(value)===date?text:text+' ('+new Intl.DateTimeFormat(locale,{timeZone:'Asia/Kolkata',day:'numeric',month:'short'}).format(value)+')';};
  const name=slot=>t.names[names.indexOf(slot.name)],range=slot=>time(slot.start)+' – '+time(slot.end);
  try{
   if(!cached||cached.localDate!==date)cached=dailyAlmanac({localDate:date,placeId});
   for(const field of ['sunrise','sunset','moonrise','moonset']){const item=el('div');item.dataset.almanacEvent=field;item.append(el('dt',t[field]),el('dd',time(cached[field])));if(compact){const icon=el('span',({sunrise:'\u2600\u2191',sunset:'\u2600\u2193',moonrise:'\u263d\u2191',moonset:'\u263d\u2193'})[field]);icon.className='almanac-event-icon';icon.setAttribute('aria-hidden','true');item.prepend(icon);}facts.append(item);}
   const before=instant<cached.sunrise,night=before?cached.previousNight:cached.night,active=currentChoghadiya([...cached.day,...night],instant);
   current.setAttribute('aria-label',t.now);current.title=t.now;
   current.textContent=active?`${compact?t.current+' · ':t.now+': '}${name(active)} · ${range(active)}`:t.unavailable;
   if(active){current.dataset.period=active.period;current.dataset.name=active.name;}else{delete current.dataset.period;delete current.dataset.name;}
   for(const [heading,slots]of [[t.day,cached.day],[before?t.previous+' · '+t.night:t.night,night]]){
    const group=el('section'),list=el('ol');group.append(el('h4',heading),list);
    for(const slot of slots){const row=el('li');row.dataset.choghadiya=slot.name;row.dataset.start=String(slot.start);row.dataset.end=String(slot.end);row.dataset.period=slot.period;
     row.append(el('strong',name(slot)),el('span',range(slot)));if(slot===active){row.setAttribute('aria-current','time');row.append(el('b',t.current));}list.append(row);
    }periods.append(group);
   }root.dataset.ready='true';lastRender=[date,placeId,language,explicit,active?.start].join(':');
  }catch{cached=null;current.textContent=t.unavailable;root.dataset.ready='false';delete current.dataset.period;delete current.dataset.name;}
 }
 const languageChanged=()=>{language=window.SynapseLanguage?.get()||'en';render();search();};
 const refresh=()=>{if(document.visibilityState!=='hidden')render();};
 const cityChanged=event=>{const id=event.detail?.placeId;try{getPlace(id);if(id!==placeId){placeId=id;explicit=true;cached=null;render();}}catch{}};
 const storage=event=>{if(event.key!==key&&event.key!==null)return;try{const id=event.key===null?null:event.newValue;if(id)getPlace(id);placeId=id||fallback;explicit=Boolean(id);cached=null;render();}catch{}};
 window.addEventListener('synapse-language-change',languageChanged);window.addEventListener('ritvayam-almanac-place',cityChanged);window.addEventListener('storage',storage);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',refresh);
 // One-second boundary checks update only when the date or active interval changes.
 let signature='';const timer=setInterval(()=>{if(!root.isConnected){destroy();return;}if(document.visibilityState==='hidden')return;const instant=now(),active=cached&&currentChoghadiya([...cached.previousNight,...cached.day,...cached.night],instant),next=istDate(instant)+':'+active?.start;if(next!==signature){signature=next;render();}},1000);
 function destroy(){clearInterval(timer);window.removeEventListener('synapse-language-change',languageChanged);window.removeEventListener('ritvayam-almanac-place',cityChanged);window.removeEventListener('storage',storage);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',refresh);root.remove();}
 render();return {destroy,translate(value){if(!labels[value])throw new TypeError('Unsupported language.');language=value;render();search();}};
}
