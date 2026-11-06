import {createCalendarInputMemory,calendarMemoryCopy} from './calendar-input-memory.mjs?v=20261105-density';
import {downloadBlob} from '/shared/download.mjs';
import {mountCalendarLocation} from './calendar-location.mjs';
import {localDate} from './lunar-core.mjs';
import {tithiLabel,monthNames,displayedMonth} from './panchang.mjs?v=20261104-festivals';
import {observanceTypes,allObservanceTypes,festivalTypeKeys,eventTitle} from './observance-rules.mjs?v=20261104-festivals';
import {observanceIcs,reminderOccurrences} from './observance-export.mjs?v=20261104-festivals';
import {observanceCardCopy,observanceCardPng,renderObservanceCard} from './observance-card.mjs';
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const words={en:{title:'Vrat & Shraddha Calendars',description:'Find upcoming vrats and lunar dates for your location, or calculate a family remembrance plan.',dates:'Vrat calendar',remembrance:'Shraddha / Barsi calendar',location:'Indian city',month:'Month',calendar:'Lunar month labels',automatic:'Automatic for the selected city',amanta:'Amanta',purnimanta:'Purnimanta',tradition:'Ekadashi tradition',smarta:'Smarta household planning',traditionHelp:'Vaishnava / ISKCON and exceptional fasting rules need separate confirmation.',load:'Calculate dates',intro:'Choose your location and month. All times are IST. No death details are needed.',scope:'Calculated planning dates. Confirm regional and family practice before observing a vrat. Uncertain dates stay out of reminder exports.',busy:'Calculating local tithis and observance times…',empty:'Choose a city and calculate a month.',ready:'Dates calculated for',list:'Upcoming list',grid:'Month view',filter:'Dates to show',all:'Select all',none:'Clear selection',next:'Next occurrence',previous:'Previous month',following:'Next month',past:'Past date',candidate:'Confirm date',computed:'Calculated date',details:'Timings & calculation rule',start:'Tithi begins',end:'Tithi ends',sunrise:'Sunrise',sunset:'Sunset',moonrise:'Moonrise',period:'Observance window',parana:'Parana · following day',paranaHelp:'Special Parana timing needs confirmation; no timed reminder will be exported.',noResults:'No selected observances in this month. Choose another filter or month.',reminders:'Calendar reminders',alarm:'Reminder time',download:'Download selected dates (.ics)',single:'Add this date (.ics)',timed:'Also include resolved moonrise and Parana times (15-minute reminders)',reminderHelp:'Download and open the file in your calendar app. This is a one-time import; reminders depend on the app. Reimporting can duplicate events. No automatic sync or notification delivery.',reminderPrivacy:'Importing shares selected dates and the selected city with your calendar provider. Your inputs are not saved as a server record.',downloaded:'Calendar file downloaded. Check notifications after import.',excluded:'Past and unconfirmed dates are excluded. Purnima fasting and the Purnima calendar date can differ.',yearHelp:'Supported years: 2025–2030. Monthly requests keep calculation bounded.',sources:'About these dates',method:'Dates use local sunrise, midday, moonrise or evening, depending on the observance. Confirm uncertain dates and regional fasting rules before making plans.',noNext:'No next occurrence in this or the next month within the supported range.',reset:'Today',confirm:'Possible observance only. Confirm the fasting/puja date locally; no reminder is available.',noUpcoming:'No upcoming resolved dates in the selection.',viewDate:'Show details for',checked:'selected',unavailable:'Additional festival rules, Vaishnava calendars and automatic notifications are not available yet.'},hi:{title:'व्रत और श्राद्ध कैलेंडर',description:'अपने स्थान के आगामी व्रत और तिथियाँ देखें या पारिवारिक श्राद्ध और बरसी की योजना बनाएँ।',dates:'व्रत कैलेंडर',remembrance:'श्राद्ध / बरसी कैलेंडर',location:'भारतीय शहर',month:'महीना',calendar:'हिन्दू मास के नाम',automatic:'चुने शहर के अनुसार',amanta:'अमान्त',purnimanta:'पूर्णिमान्त',tradition:'एकादशी की परम्परा',smarta:'स्मार्त गृहस्थ योजना',traditionHelp:'वैष्णव / इस्कॉन और विशेष व्रत नियमों के लिए अलग पुष्टि आवश्यक है।',load:'तिथियाँ निकालें',intro:'स्थान और महीना चुनें। सभी समय IST हैं। मृत्यु का विवरण आवश्यक नहीं।',scope:'गणना आधारित योजना। व्रत से पहले क्षेत्रीय और पारिवारिक रीति की पुष्टि करें। अनिश्चित तारीखें याद दिलाने वाली फ़ाइल में नहीं जातीं।',busy:'स्थानीय तिथि और व्रत समय निकाले जा रहे हैं…',empty:'शहर चुनें और महीने की गणना करें।',ready:'इनके लिए तिथियाँ तैयार हैं',list:'आगामी सूची',grid:'महीने का दृश्य',filter:'दिखाई जाने वाली तिथियाँ',all:'सभी चुनें',none:'चयन हटाएँ',next:'अगली तिथि',previous:'पिछला महीना',following:'अगला महीना',past:'बीती तारीख',candidate:'तारीख की पुष्टि करें',computed:'गणना की तारीख',details:'समय और गणना का नियम',start:'तिथि आरम्भ',end:'तिथि समाप्त',sunrise:'सूर्योदय',sunset:'सूर्यास्त',moonrise:'चन्द्रोदय',period:'अनुष्ठान की अवधि',parana:'पारण · अगले दिन',paranaHelp:'विशेष पारण समय की पुष्टि आवश्यक है; समय वाला रिमाइंडर नहीं निकलेगा।',noResults:'इस महीने चुने हुए व्रत नहीं हैं। चयन या महीना बदलें।',reminders:'कैलेंडर में याद दिलाएँ',alarm:'याद दिलाने का समय',download:'चुनी तिथियाँ डाउनलोड करें (.ics)',single:'यह तारीख जोड़ें (.ics)',timed:'निश्चित चन्द्रोदय और पारण समय भी जोड़ें (15 मिनट पहले याद दिलाएँ)',reminderHelp:'फ़ाइल डाउनलोड करके अपने कैलेंडर ऐप में खोलें। यह एक बार का आयात है; सूचनाएँ ऐप पर निर्भर हैं। दोबारा आयात करने पर घटनाएँ दोहर सकती हैं। अपने आप सिंक या सूचना वितरण नहीं होता।',reminderPrivacy:'आयात से चुनी हुई तिथियाँ और चुना हुआ शहर आपके कैलेंडर प्रदाता को मिलता है। विवरण सर्वर पर रिकॉर्ड के रूप में नहीं सहेजा जाता।',downloaded:'कैलेंडर फ़ाइल डाउनलोड हुई। आयात के बाद सूचना सेटिंग देखें।',excluded:'बीती और अनिश्चित तारीखें शामिल नहीं होतीं। पूर्णिमा व्रत और पंचांग की पूर्णिमा की तारीख अलग हो सकती है।',yearHelp:'समर्थित वर्ष: 2025–2030। गणना एक महीने की होती है।',sources:'इन तिथियों के बारे में',method:'हर व्रत के अनुसार स्थानीय सूर्योदय, मध्याह्न, चन्द्रोदय या शाम का समय लिया जाता है। योजना से पहले अनिश्चित तिथियों और क्षेत्रीय व्रत नियमों की पुष्टि करें।',noNext:'इस या अगले महीने में समर्थित सीमा के भीतर अगली तिथि नहीं है।',reset:'आज',confirm:'केवल सम्भावित अनुष्ठान। व्रत/पूजा की तारीख स्थानीय रूप से पक्की करें; रिमाइंडर उपलब्ध नहीं है।',noUpcoming:'चयन में निश्चित आगामी तारीखें नहीं हैं।',viewDate:'इस दिन का विवरण देखें',checked:'चुनी गई',unavailable:'अतिरिक्त त्योहार नियम, वैष्णव कैलेंडर और अपने आप सूचनाएँ अभी उपलब्ध नहीं हैं।'}};

const viewText={en:{list:'Up Next',noUpcoming:'No upcoming dates in this month.'},hi:{list:'आगामी तिथियाँ',noUpcoming:'इस महीने कोई आगामी तारीख नहीं है।'}};
export function mountObservanceCalendar(){
 const $=id=>document.getElementById(id),language=()=>$('language').value==='hi'?'hi':'en',w=key=>viewText[language()][key]??words[language()][key];
Object.assign(words.en,{festivals:'Hindu festivals',unavailable:'Festival dates are planning aids, not a certified regional Panchang. Confirm locally before arranging observances.'});
Object.assign(words.hi,{festivals:'हिन्दू त्योहार',unavailable:'त्योहारों की तारीखें योजना-सहायता हैं, प्रमाणित क्षेत्रीय पंचांग नहीं। अनुष्ठान तय करने से पहले स्थानीय पुष्टि करें।'});
 const inputMemory=createCalendarInputMemory('observances');
 const original=[$('scope'),document.querySelector('.calendar-layout'),document.querySelector('.reference')],intro=document.querySelector('main .intro');
 const nav=node('nav',undefined,'calendar-views');nav.setAttribute('aria-label','Calendar views');
 const datesButton=node('button'),remembranceButton=node('button');datesButton.type=remembranceButton.type='button';datesButton.id='view-dates';remembranceButton.id='view-remembrance';nav.append(datesButton,remembranceButton);intro.after(nav);
 const panel=node('section',undefined,'observance-panel');panel.id='observance-panel';nav.after(panel);
 const form=node('form',undefined,'card observance-form');form.id='observance-form';
 const note=node('p',undefined,'scope'),formHeading=node('h2'),fields=node('div',undefined,'observance-fields');
 const field=(id,type)=>{const label=node('label'),caption=node('span'),input=node(type==='select'?'select':'input');input.id=id;input.name=id;if(type!=='select')input.type=type;label.append(caption,input);fields.append(label);return {label:caption,input};};
 const cityContainer=node('div',undefined,'observance-city-field');fields.append(cityContainer);let locationPicker=null;
 const month=field('observance-month','month');month.input.required=true;month.input.min='2025-01';month.input.max='2030-12';month.input.value=inputMemory.values.month||localDate(Date.now()).slice(0,7);
 const calendar=field('observance-convention','select'),tradition=field('observance-tradition','select');
 const help=node('p',undefined,'fine'),yearHelp=node('p',undefined,'fine'),submit=node('button',undefined,'primary');submit.id='observance-calculate';submit.type='submit';form.append(formHeading,fields,help,yearHelp,submit);
 const memoryPanel=node('div',undefined,'calendar-input-memory'),memoryNote=node('p',undefined,'fine'),clearMemoryButton=node('button');
 memoryNote.id='observance-memory-status';memoryNote.setAttribute('role','status');clearMemoryButton.id='clear-observance-inputs';clearMemoryButton.type='button';memoryPanel.append(memoryNote,clearMemoryButton);form.append(memoryPanel);
 function refreshMemoryCopy(){memoryNote.textContent=calendarMemoryCopy(language(),inputMemory.status);clearMemoryButton.textContent=language()==='hi'?'सहेजे फ़ील्ड साफ करें':'Clear saved fields';}
 function rememberInputs(){inputMemory.save({placeId:locationPicker?.value||'',month:month.input.value,calendar:calendar.input.value});refreshMemoryCopy();}
 clearMemoryButton.onclick=()=>{if(!inputMemory.clear()){refreshMemoryCopy();return;}clear();locationPicker?.destroy();locationPicker=null;month.input.value=localDate(Date.now()).slice(0,7);calendar.input.value='';setup();$('observance-location-query').focus();};
 const status=node('p');status.id='observance-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const output=node('div');output.id='observance-output';
 const method=node('details',undefined,'card observance-method'),methodTitle=node('summary'),methodText=node('p'),attribution=node('p');method.append(methodTitle,methodText,attribution);
 panel.append(note,form,status,output,method);
 const dateTypeKeys=Object.keys(observanceTypes),festivalTypeSet=new Set(festivalTypeKeys);
 let result=null,controller=null,revision=0,view=new URLSearchParams(location.search).get('view')==='remembrance'?'remembrance':'dates',display='list',selected=new Set(dateTypeKeys),showFestivals=false,reminder='1',timed=false;
 const selectedTypes=()=>[...selected,...(showFestivals?festivalTypeKeys:[])],isSelected=event=>festivalTypeSet.has(event.type)?showFestivals:selected.has(event.type);
 const dateText=date=>new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{dateStyle:'long',timeZone:'Asia/Kolkata'}).format(new Date(date+'T12:00:00+05:30'));
 const timeText=value=>new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata',hour12:true}).format(new Date(Math.round(value/60000)*60000))+' IST';
 const button=(text,fn,cls)=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
 function stop(){revision++;controller?.abort();controller=null;submit.disabled=false;form.removeAttribute('aria-busy');}
 function clear(){stop();result=null;output.replaceChildren();status.textContent=w('empty');}
 function activate(value,updateUrl=true){view=value;panel.hidden=view!=='dates';for(const part of original)part.hidden=view==='dates';datesButton.setAttribute('aria-pressed',String(view==='dates'));remembranceButton.setAttribute('aria-pressed',String(view==='remembrance'));$('headline').textContent=view==='dates'?w('title'):(language()==='hi'?'श्राद्ध और बरसी कैलेंडर':'Shraddha & Barsi Calendar');$('description').textContent=w('description');document.title=$('headline').textContent+' · Ritual Assist';if(view==='remembrance'){stop();locationPicker?.cancel();}if(updateUrl){const url=new URL(location.href);url.searchParams.set('view',view);if(url.href!==location.href)history.pushState(history.state,'',url);}}
 addEventListener('popstate',()=>activate(new URL(location.href).searchParams.get('view')==='remembrance'?'remembrance':'dates',false));
 datesButton.onclick=()=>activate('dates');remembranceButton.onclick=()=>activate('remembrance');
 function setup(){
  const city=locationPicker?locationPicker.value:inputMemory.values.placeId||'';locationPicker?.destroy();locationPicker=mountCalendarLocation(cityContainer,{language:language(),value:city,onChange:()=>{rememberInputs();clear();},mode:'dates',prefix:'observance-location',detectId:'observance-use-location'});
  datesButton.textContent=w('dates');remembranceButton.textContent=w('remembrance');note.textContent=w('scope');formHeading.textContent=w('dates');month.label.textContent=w('month');calendar.label.textContent=w('calendar');tradition.label.textContent=w('tradition');
  const prior=calendar.input.options.length?calendar.input.value:inputMemory.values.calendar||'';calendar.input.replaceChildren(...[['',w('automatic')],['amanta',w('amanta')],['purnimanta',w('purnimanta')]].map(([value,label])=>new Option(label,value)));calendar.input.value=prior;
  tradition.input.replaceChildren(new Option(w('smarta'),'smarta'));help.textContent=w('traditionHelp');yearHelp.textContent=w('yearHelp');submit.textContent=w('load');methodTitle.textContent=w('sources');methodText.textContent=w('method');
  attribution.replaceChildren();const geo=node('a','GeoNames · CC BY 4.0');geo.href='https://www.geonames.org/';attribution.append(geo,document.createTextNode(language()==='hi'?' · शहर के अनुमानित निर्देशांक।':' · Approximate city coordinates.'));
  activate(view,false);if(result)render();else status.textContent=w('empty');refreshMemoryCopy();
 }
 async function load({next=false}={}){
  rememberInputs();if(!form.reportValidity())return;
  stop();const token=revision,request=new AbortController();controller=request;submit.disabled=true;form.setAttribute('aria-busy','true');status.textContent=w('busy');output.replaceChildren();result=null;
  const timer=setTimeout(()=>request.abort(),25000);
  try{
   let chosen=month.input.value;
   for(let attempt=0;attempt<(next?2:1);attempt++){
    const response=await fetch('/api/ritual-assist/observances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month:chosen,placeId:locationPicker.value,tradition:'smarta',...(calendar.input.value?{calendar:calendar.input.value}:{})}),cache:'no-store',signal:request.signal});
    const payload=await response.json();if(token!==revision)return;if(!response.ok)throw Error(payload.error||'Calculation unavailable');
    result=payload.result;month.input.value=chosen;rememberInputs();
    if(!next||result.events.some(e=>isSelected(e)&&e.status==='computed'&&e.date>=localDate(Date.now())))break;
    const d=new Date(chosen+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);chosen=d.toISOString().slice(0,7);if(chosen>'2030-12')break;
   }
   if(token!==revision)return;controller=null;submit.disabled=false;form.removeAttribute('aria-busy');render();
   if(next){const target=output.querySelector('.observance-event[data-upcoming=true]');if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.querySelector('summary')?.focus();}else status.textContent=w('noNext');}
  }catch(error){if(token!==revision)return;result=null;output.replaceChildren();controller=null;submit.disabled=false;form.removeAttribute('aria-busy');status.textContent=error.name==='AbortError'?(language()==='hi'?'गणना का समय समाप्त हुआ। फिर प्रयास करें।':'Calculation timed out. Please try again.'):error.message;}
  finally{clearTimeout(timer);}
 }
 async function download(eventId=null){
  const snapshot=result,token=revision;if(!snapshot)return;
  try{const content=await observanceIcs(snapshot,{language:language(),reminder,timed,types:selectedTypes(),eventId});if(token!==revision||result!==snapshot||view!=='dates')return;
   downloadBlob(new Blob([content],{type:'text/calendar;charset=utf-8'}),'ritual-dates-'+snapshot.month+'.ics',{cleanupDelay:1000});status.textContent=w('downloaded');
  }catch(error){if(token===revision)status.textContent=error.message;}
 }
 function eventCard(event){
  const card=node('article',undefined,'observance-event card');card.dataset.eventId=event.id;card.dataset.type=event.type;card.dataset.date=event.date;card.id='event-'+event.id;card.dataset.upcoming=String(event.date>=localDate(Date.now())&&event.status==='computed');
  const heading=node('div',undefined,'observance-heading');heading.append(node('h4',eventTitle(event,language())));card.append(heading);
  const badge=node('span',event.status==='computed'?(event.date<localDate(Date.now())?w('past'):w('computed')):w('candidate'),'badge');heading.append(badge);
  if(event.status!=='computed')card.append(node('p',w('confirm'),'fine'));
  if(event.month){const name=monthNames[language()][displayedMonth(event.month,event.window.number,result.calendar)];card.append(node('p',tithiLabel(event.window.number,language())+' · '+name+(event.month.adhika?(language()==='hi'?' · अधिक मास':' · Adhik Maas'):''),'fine'));}
  if(event.status==='computed'){let milestone='';if(event.type==='sankashti'&&event.anchor)milestone=w('moonrise')+': '+timeText(event.anchor);else if(event.parana?.status==='computed')milestone=w('parana')+': '+timeText(event.parana.start)+' – '+timeText(event.parana.end);else if(event.period)milestone=w('period')+': '+timeText(event.period.start)+' – '+timeText(event.period.end);if(milestone)card.append(node('p',milestone,'observance-milestone'));}
  const details=node('details'),summary=node('summary',w('details'));details.append(summary);
  const info=node('dl',undefined,'observance-times');const pair=(label,value)=>info.append(node('dt',label),node('dd',value));if(event.window){pair(w('start'),timeText(event.window.start));pair(w('end'),timeText(event.window.end));}
  const day=result.days.find(d=>d.date===event.date);if(day){pair(w('sunrise'),timeText(day.sunrise));pair(w('sunset'),timeText(day.sunset));}
  if(event.type==='sankashti'&&event.anchor)pair(w('moonrise'),timeText(event.anchor));
  if(event.period)pair(w('period'),timeText(event.period.start)+' – '+timeText(event.period.end));
  if(event.parana){if(event.parana.status==='computed')pair(w('parana'),timeText(event.parana.start)+' – '+timeText(event.parana.end));else pair(w('parana'),w('paranaHelp'));}
  details.append(info,node('p',allObservanceTypes[event.type].basis[language()],'fine'));
  if(event.candidateDates?.length>1)details.append(node('p',(language()==='hi'?'सम्भावित दिन: ':'Possible days: ')+event.candidateDates.map(dateText).join(' / '),'fine'));
  card.append(details);const add=button(w('single'),()=>download(event.id));add.disabled=!reminderOccurrences(result,{types:selectedTypes(),eventId:event.id,timed}).length;details.append(add);return card;
 }
 function render(){
  if(!result)return;output.replaceChildren();status.textContent=w('ready')+' '+result.location.name+' · '+result.month;
  const toolbar=node('div',undefined,'observance-toolbar');
  const move=delta=>{const date=new Date(month.input.value+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);month.input.value=date.toISOString().slice(0,7);void load();};
  const prev=button('← '+w('previous'),()=>move(-1)),following=button(w('following')+' →',()=>move(1));prev.disabled=result.month<='2025-01';following.disabled=result.month>='2030-12';
  const today=button(w('reset'),()=>{month.input.value=localDate(Date.now()).slice(0,7);void load();}),next=button(w('next'),()=>{month.input.value=localDate(Date.now()).slice(0,7);display='list';void load({next:true});});next.disabled=!selected.size&&!showFestivals;
  toolbar.append(prev,today,following,next);output.append(toolbar);
  const filters=node('fieldset',undefined,'observance-filters'),legend=node('legend',w('filter'));filters.append(legend);
  for(const [key,type]of Object.entries(observanceTypes)){const label=node('label'),input=node('input');input.type='checkbox';input.checked=selected.has(key);input.dataset.observanceFilter=key;input.onchange=()=>{if(input.checked)selected.add(key);else selected.delete(key);render();output.querySelector('[data-observance-filter='+key+']')?.focus();};label.append(input,document.createTextNode(type[language()]));filters.append(label);}
  const festivalLabel=node('label'),festivalCheck=node('input');festivalCheck.type='checkbox';festivalCheck.checked=showFestivals;festivalCheck.dataset.observanceFilter='festival';festivalCheck.onchange=()=>{showFestivals=festivalCheck.checked;render();output.querySelector('[data-observance-filter=festival]')?.focus();};festivalLabel.append(festivalCheck,document.createTextNode(w('festivals')));filters.append(festivalLabel);
  const filterActions=node('div',undefined,'observance-toolbar');filterActions.append(button(w('all'),()=>{selected=new Set(dateTypeKeys);showFestivals=true;render();}),button(w('none'),()=>{selected.clear();showFestivals=false;render();}));filters.append(filterActions);output.append(filters);
  const toggles=node('div',undefined,'observance-toolbar');for(const mode of ['list','grid']){const b=button(w(mode),()=>{display=mode;render();});b.setAttribute('aria-pressed',String(display===mode));toggles.append(b);}output.append(toggles);
  const events=result.events.filter(isSelected),list=node('div',undefined,'observance-list'),todayDate=localDate(Date.now());
  const monthEvents=[...events].sort((a,b)=>a.date.localeCompare(b.date)),upcoming=monthEvents.filter(event=>event.date>=todayDate),visibleEvents=display==='grid'?monthEvents:upcoming;
  if(!events.length)list.append(node('p',w('noResults'),'notice'));else if(!visibleEvents.length)list.append(node('p',w('noUpcoming'),'notice'));else{let group,date;for(const event of visibleEvents){if(date!==event.date){date=event.date;group=node('section',undefined,'observance-date-group');group.dataset.date=date;group.append(node('h3',new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')),'observance-group-date'));list.append(group);}group.append(eventCard(event));}}
  if(display==='grid'){
   const grid=node('div',undefined,'observance-grid');grid.setAttribute('aria-label',w('grid'));const weekdayNames=language()==='hi'?['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];for(const name of weekdayNames)grid.append(node('div',name,'observance-weekday'));
   const offset=new Date(result.month+'-01T12:00:00Z').getUTCDay();for(let i=0;i<offset;i++){const blank=node('div',undefined,'observance-blank');blank.setAttribute('aria-hidden','true');grid.append(blank);}
   for(const day of result.days){const cell=node('div',undefined,'observance-day');if(day.date===todayDate)cell.classList.add('is-today');if(day.date<todayDate)cell.classList.add('is-past');cell.append(node('strong',String(+day.date.slice(8))),node('small',tithiLabel(day.tithi,language())));for(const event of events.filter(e=>e.date===day.date)){const a=node('a',eventTitle(event,language())+(event.status==='computed'?'':' ?'));if(event.date<todayDate)a.classList.add('is-past');a.href='#event-'+event.id;a.setAttribute('aria-label',w('viewDate')+' '+dateText(event.date)+' · '+eventTitle(event,language()));cell.append(a);}grid.append(cell);}output.append(grid);
  }
  output.append(list);
  const exportPanel=node('section',undefined,'card observance-reminders');exportPanel.append(node('h3',w('reminders')),node('p',w('excluded'),'fine'));
  const alarmLabel=node('label',w('alarm')),alarm=node('select');alarm.id='observance-reminder';for(const [value,en,hi]of [['1','1 day before · 9am IST','1 दिन पहले · सुबह 9 बजे IST'],['evening','Previous evening · 8pm IST','पिछली शाम · रात 8 बजे IST'],['0','On the day · 9am IST','उसी दिन · सुबह 9 बजे IST'],['3','3 days before · 9am IST','3 दिन पहले · सुबह 9 बजे IST'],['7','7 days before · 9am IST','7 दिन पहले · सुबह 9 बजे IST'],['none','No alarm','अलार्म नहीं']])alarm.add(new Option(language()==='hi'?hi:en,value));alarm.value=reminder;alarm.onchange=()=>{reminder=alarm.value;};alarmLabel.append(alarm);exportPanel.append(alarmLabel);
  const timedLabel=node('label',undefined,'observance-check'),check=node('input');check.type='checkbox';check.id='observance-timed';check.checked=timed;check.onchange=()=>{timed=check.checked;render();$('observance-timed').focus();};timedLabel.append(check,document.createTextNode(w('timed')));exportPanel.append(timedLabel);
  const exportButton=button(w('download'),()=>download(), 'primary');exportButton.id='observance-download';exportButton.disabled=!reminderOccurrences(result,{types:selectedTypes(),timed}).length;exportPanel.append(exportButton,node('p',w('reminderHelp'),'fine'),node('p',w('reminderPrivacy'),'fine'),node('p',w('unavailable'),'fine'));output.append(exportPanel);
  const shareEvents=result.events.filter(event=>isSelected(event)&&event.status==='computed'&&event.date>=localDate(Date.now())).sort((a,b)=>a.date.localeCompare(b.date));
  const cardCopy=observanceCardCopy(language()),sharePanel=node('section',undefined,'card observance-share');sharePanel.setAttribute('aria-labelledby','observance-share-title');
  const shareTitle=node('h3',language()==='hi'?'आगामी तिथियों का साझा कार्ड':'Share upcoming dates');shareTitle.id='observance-share-title';sharePanel.append(shareTitle);
  const shareHelp=node('p',language()==='hi'?'सुंदर पंचांग-प्रेरित PNG कार्ड बनाएँ और इसे परिवार के साथ साझा करें। केवल चुनी हुई, गणना की गई आगामी तारीखें शामिल हैं।':'Create a beautifully styled Panchang-inspired PNG card to share with family. Only selected, calculated upcoming dates are included.','fine');
  const shareCanvas=node('canvas',undefined,'observance-share-canvas');shareCanvas.setAttribute('role','img');
  const shareDateLabel=date=>new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  const shareSummary=shareEvents.length?shareEvents.map(event=>shareDateLabel(event.date)+' · '+eventTitle(event,language())).join('; '):cardCopy.empty;
  const cardName=language()==='hi'?'व्रत एवं तिथियों का साझा कार्ड':'Shareable Hindu observance dates';
  shareCanvas.setAttribute('aria-label','Sushant Synapse · '+cardName+' · '+result.location.name+' · '+result.month+' · '+shareSummary);
  if(shareEvents.length)renderObservanceCard(shareCanvas,shareEvents.map(event=>({...event,title:eventTitle(event,language())})),{month:result.month,location:result.location.name,language:language()});
  else shareCanvas.hidden=true;
  const sharePreview=node('details',undefined,'observance-share-preview');
  sharePreview.append(node('summary',language()==='hi'?'कार्ड का पूर्वावलोकन':'Preview date card'),shareCanvas);
  sharePreview.hidden=!shareEvents.length;
  sharePanel.append(shareHelp);
  const shareStatus=node('p',undefined,'fine');shareStatus.setAttribute('role','status');shareStatus.setAttribute('aria-live','polite');
  const cardActions=node('div',undefined,'observance-card-actions'),cardDownload=button(language()==='hi'?'कार्ड डाउनलोड करें (PNG)':'Download card (PNG)',async()=>{
   try{const png=await observanceCardPng(shareCanvas);downloadBlob(png,'ritual-assist-dates-'+result.month+'.png',{cleanupDelay:1000});shareStatus.textContent=language()==='hi'?'साझा कार्ड डाउनलोड हुआ।':'Share card downloaded.';}catch(error){shareStatus.textContent=error.message;}
  },'primary');cardDownload.id='observance-card-download';
  const cardShare=button(language()==='hi'?'साझा करें':'Share card',async()=>{
   try{
    const png=await observanceCardPng(shareCanvas),name='ritual-assist-dates-'+result.month+'.png',file=new File([png],name,{type:'image/png'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
     try{await navigator.share({title:cardName,text:shareSummary,files:[file]});shareStatus.textContent=language()==='hi'?'साझा कार्ड भेजने के लिए तैयार है।':'Share sheet opened for your date card.';}
     catch(error){if(error.name==='AbortError'){shareStatus.textContent=language()==='hi'?'साझा करना रद्द हुआ; कार्ड अभी भी उपलब्ध है।':'Sharing cancelled. Your card is still available.';}else throw error;}
    }else{downloadBlob(png,name,{cleanupDelay:1000});shareStatus.textContent=language()==='hi'?'कार्ड डाउनलोड हुआ। इसे अपने संदेश में संलग्न करें।':'Card downloaded. Attach it in your group chat.';}
   }catch(error){shareStatus.textContent=error.message;}
  });
  cardShare.id='observance-card-share';
  cardDownload.disabled=cardShare.disabled=!shareEvents.length;
  cardActions.append(cardDownload,cardShare);
  sharePanel.append(cardActions,shareStatus,sharePreview);
  if(!shareEvents.length)sharePanel.append(node('p',cardCopy.empty,'fine'));
  output.append(sharePanel);
 }
 for(const event of ['input','change'])form.addEventListener(event,()=>{rememberInputs();clear();});form.onsubmit=event=>{event.preventDefault();void load();};$('language').addEventListener('change',setup);addEventListener('pagehide',()=>{locationPicker?.cancel();clear();});
 setup();
}
