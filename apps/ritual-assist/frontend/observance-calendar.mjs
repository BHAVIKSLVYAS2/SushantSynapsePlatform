import {mountShareResult} from './share-result.mjs';
import {mountRitualWorkspace} from './workspace-nav.mjs';
import {createCalendarInputMemory,calendarMemoryCopy} from './calendar-input-memory.mjs?v=20261105-density';
import {downloadBlob} from '/shared/download.mjs';
import {mountCalendarLocation} from './calendar-location.mjs';
import {localDate} from './calendar-display.mjs';
import {tithiLabel,monthNames,displayedMonth} from './calendar-display.mjs';
import {observanceTypes,allObservanceTypes,festivalTypeKeys,eventTitle} from './observance-rules.mjs?v=20261104-festivals';
import {observanceIcs,reminderOccurrences} from './observance-export.mjs?v=20261104-festivals';
import {renderObservanceCard} from './observance-card.mjs';
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const words={en:{title:'Vrat & Shraddha Calendars',description:'Find upcoming vrats and lunar dates for your location, or calculate a family remembrance plan.',dates:'Vrat calendar',remembrance:'Shraddha / Barsi calendar',location:'Indian city',month:'Month',calendar:'Lunar month labels',automatic:'Automatic for the selected city',amanta:'Amanta',purnimanta:'Purnimanta',tradition:'Ekadashi tradition',smarta:'Smarta household planning',traditionHelp:'Vaishnava / ISKCON and exceptional fasting rules need separate confirmation.',load:'Calculate dates',intro:'Choose your location and month. All times are IST. No death details are needed.',scope:'Calculated planning dates. Confirm regional and family practice before observing a vrat. Uncertain dates stay out of reminder exports.',busy:'Calculating local tithis and observance times…',empty:'Choose a city and calculate a month.',ready:'Dates calculated for',list:'Upcoming list',grid:'Month view',filter:'Dates to show',all:'Select all',none:'Clear selection',next:'Next occurrence',previous:'Previous month',following:'Next month',past:'Past date',candidate:'Confirm date',computed:'Calculated date',details:'Timings & calculation rule',start:'Tithi begins',end:'Tithi ends',sunrise:'Sunrise',sunset:'Sunset',moonrise:'Moonrise',period:'Observance window',parana:'Parana · following day',paranaHelp:'Special Parana timing needs confirmation; no timed reminder will be exported.',noResults:'No selected observances in this month. Choose another filter or month.',reminders:'Calendar reminders',alarm:'Reminder time',download:'Download selected dates (.ics)',single:'Add this date (.ics)',timed:'Also include resolved moonrise and Parana times (15-minute reminders)',reminderHelp:'Download and open the file in your calendar app. This is a one-time import; reminders depend on the app. Reimporting can duplicate events. No automatic sync or notification delivery.',reminderPrivacy:'Importing shares selected dates and the selected city with your calendar provider. Your inputs are not saved as a server record.',downloaded:'Calendar file downloaded. Check notifications after import.',excluded:'Past and unconfirmed dates are excluded. Purnima fasting and the Purnima calendar date can differ.',yearHelp:'Supported years: 2025–2030. Monthly requests keep calculation bounded.',sources:'About these dates',method:'Dates use local sunrise, midday, moonrise or evening, depending on the observance. Confirm uncertain dates and regional fasting rules before making plans.',noNext:'No next occurrence in this or the next month within the supported range.',reset:'Today',confirm:'Possible observance only. Confirm the fasting/puja date locally; no reminder is available.',noUpcoming:'No upcoming resolved dates in the selection.',viewDate:'Show details for',checked:'selected',unavailable:'Additional festival rules, Vaishnava calendars and automatic notifications are not available yet.'},hi:{title:'व्रत और श्राद्ध कैलेंडर',description:'अपने स्थान के आगामी व्रत और तिथियाँ देखें या पारिवारिक श्राद्ध और बरसी की योजना बनाएँ।',dates:'व्रत कैलेंडर',remembrance:'श्राद्ध / बरसी कैलेंडर',location:'भारतीय शहर',month:'महीना',calendar:'हिन्दू मास के नाम',automatic:'चुने शहर के अनुसार',amanta:'अमान्त',purnimanta:'पूर्णिमान्त',tradition:'एकादशी की परम्परा',smarta:'स्मार्त गृहस्थ योजना',traditionHelp:'वैष्णव / इस्कॉन और विशेष व्रत नियमों के लिए अलग पुष्टि आवश्यक है।',load:'तिथियाँ निकालें',intro:'स्थान और महीना चुनें। सभी समय IST हैं। मृत्यु का विवरण आवश्यक नहीं।',scope:'गणना आधारित योजना। व्रत से पहले क्षेत्रीय और पारिवारिक रीति की पुष्टि करें। अनिश्चित तारीखें याद दिलाने वाली फ़ाइल में नहीं जातीं।',busy:'स्थानीय तिथि और व्रत समय निकाले जा रहे हैं…',empty:'शहर चुनें और महीने की गणना करें।',ready:'इनके लिए तिथियाँ तैयार हैं',list:'आगामी सूची',grid:'महीने का दृश्य',filter:'दिखाई जाने वाली तिथियाँ',all:'सभी चुनें',none:'चयन हटाएँ',next:'अगली तिथि',previous:'पिछला महीना',following:'अगला महीना',past:'बीती तारीख',candidate:'तारीख की पुष्टि करें',computed:'गणना की तारीख',details:'समय और गणना का नियम',start:'तिथि आरम्भ',end:'तिथि समाप्त',sunrise:'सूर्योदय',sunset:'सूर्यास्त',moonrise:'चन्द्रोदय',period:'अनुष्ठान की अवधि',parana:'पारण · अगले दिन',paranaHelp:'विशेष पारण समय की पुष्टि आवश्यक है; समय वाला रिमाइंडर नहीं निकलेगा।',noResults:'इस महीने चुने हुए व्रत नहीं हैं। चयन या महीना बदलें।',reminders:'कैलेंडर में याद दिलाएँ',alarm:'याद दिलाने का समय',download:'चुनी तिथियाँ डाउनलोड करें (.ics)',single:'यह तारीख जोड़ें (.ics)',timed:'निश्चित चन्द्रोदय और पारण समय भी जोड़ें (15 मिनट पहले याद दिलाएँ)',reminderHelp:'फ़ाइल डाउनलोड करके अपने कैलेंडर ऐप में खोलें। यह एक बार का आयात है; सूचनाएँ ऐप पर निर्भर हैं। दोबारा आयात करने पर घटनाएँ दोहर सकती हैं। अपने आप सिंक या सूचना वितरण नहीं होता।',reminderPrivacy:'आयात से चुनी हुई तिथियाँ और चुना हुआ शहर आपके कैलेंडर प्रदाता को मिलता है। विवरण सर्वर पर रिकॉर्ड के रूप में नहीं सहेजा जाता।',downloaded:'कैलेंडर फ़ाइल डाउनलोड हुई। आयात के बाद सूचना सेटिंग देखें।',excluded:'बीती और अनिश्चित तारीखें शामिल नहीं होतीं। पूर्णिमा व्रत और पंचांग की पूर्णिमा की तारीख अलग हो सकती है।',yearHelp:'समर्थित वर्ष: 2025–2030। गणना एक महीने की होती है।',sources:'इन तिथियों के बारे में',method:'हर व्रत के अनुसार स्थानीय सूर्योदय, मध्याह्न, चन्द्रोदय या शाम का समय लिया जाता है। योजना से पहले अनिश्चित तिथियों और क्षेत्रीय व्रत नियमों की पुष्टि करें।',noNext:'इस या अगले महीने में समर्थित सीमा के भीतर अगली तिथि नहीं है।',reset:'आज',confirm:'केवल सम्भावित अनुष्ठान। व्रत/पूजा की तारीख स्थानीय रूप से पक्की करें; रिमाइंडर उपलब्ध नहीं है।',noUpcoming:'चयन में निश्चित आगामी तारीखें नहीं हैं।',viewDate:'इस दिन का विवरण देखें',checked:'चुनी गई',unavailable:'अतिरिक्त त्योहार नियम, वैष्णव कैलेंडर और अपने आप सूचनाएँ अभी उपलब्ध नहीं हैं।'}};

const viewText={en:{list:'Up Next',noUpcoming:'No upcoming dates in this month. Choose another month above or use Month view.'},hi:{list:'आगामी तिथियाँ',noUpcoming:'इस महीने कोई आगामी तारीख नहीं है। ऊपर दूसरा महीना चुनें या महीने का दृश्य देखें।'}};
export function mountObservanceCalendar(calendarRoot=document){
 const $=id=>id==='language'?document.getElementById(id):calendarRoot.querySelector('#'+id),language=()=>$('language').value==='hi'?'hi':'en',w=key=>viewText[language()][key]??words[language()][key];
Object.assign(words.en,{festivals:'Hindu festivals',unavailable:'Festival dates are planning aids, not a certified regional Panchang. Confirm locally before arranging observances.'});
Object.assign(words.hi,{festivals:'हिन्दू त्योहार',unavailable:'त्योहारों की तारीखें योजना-सहायता हैं, प्रमाणित क्षेत्रीय पंचांग नहीं। अनुष्ठान तय करने से पहले स्थानीय पुष्टि करें।'});
 const inputMemory=createCalendarInputMemory('observances');
 const original=[$('scope'),calendarRoot.querySelector('.calendar-layout'),calendarRoot.querySelector('.reference')],intro=calendarRoot.querySelector('.intro');
 const workspace=mountRitualWorkspace({language:language(),onView:value=>activate(value)});
 const {nav,datesButton,remembranceButton}=workspace;
 const panel=node('section',undefined,'observance-panel');panel.id='observance-panel';intro.before(panel);
 const form=node('form',undefined,'card observance-form');form.id='observance-form';
 const note=node('p',undefined,'scope'),formHeading=node('h2'),fields=node('div',undefined,'observance-fields');
 const field=(id,type)=>{const label=node('label'),caption=node('span'),input=node(type==='select'?'select':'input');input.id=id;input.name=id;if(type!=='select')input.type=type;label.append(caption,input);fields.append(label);return {label:caption,input};};
 const cityContainer=node('div',undefined,'observance-city-field');fields.append(cityContainer);let locationPicker=null;
 const month=field('observance-month','month');month.input.required=true;month.input.min='2025-01';month.input.max='2030-12';month.input.value=inputMemory.values.month||localDate(Date.now()).slice(0,7);
 const calendar=field('observance-convention','select'),tradition=field('observance-tradition','select');
 const help=node('p',undefined,'fine'),yearHelp=node('p',undefined,'fine'),submit=node('button',undefined,'primary');submit.id='observance-calculate';submit.type='submit';
 const options=node('details',undefined,'observance-options'),optionsTitle=node('summary');options.append(optionsTitle,calendar.input.parentElement,tradition.input.parentElement,help,yearHelp);form.append(formHeading,fields,options,submit);
 const memoryPanel=node('div',undefined,'calendar-input-memory'),memoryNote=node('p',undefined,'fine'),clearMemoryButton=node('button');
 memoryNote.id='observance-memory-status';memoryNote.setAttribute('role','status');clearMemoryButton.id='clear-observance-inputs';clearMemoryButton.type='button';memoryPanel.append(memoryNote,clearMemoryButton);form.append(memoryPanel);
 function refreshMemoryCopy(){memoryNote.textContent=calendarMemoryCopy(language(),inputMemory.status);clearMemoryButton.textContent=language()==='hi'?'सहेजे फ़ील्ड साफ करें':'Clear saved fields';}
 function rememberInputs(){inputMemory.save({placeId:locationPicker?.value||'',month:month.input.value,calendar:calendar.input.value});refreshMemoryCopy();}
 clearMemoryButton.onclick=()=>{if(!inputMemory.clear()){refreshMemoryCopy();return;}clear();locationPicker?.destroy();locationPicker=null;month.input.value=localDate(Date.now()).slice(0,7);calendar.input.value='';setup();$('observance-location-query').focus();};
 const status=node('p');status.id='observance-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const output=node('div');output.id='observance-output';
 const method=node('details',undefined,'card observance-method'),methodTitle=node('summary'),methodText=node('p'),attribution=node('p');method.append(methodTitle,methodText,attribution);
 panel.append(form,note,status,output,method);calendarRoot.querySelector('.calendar-layout').after($('scope'));
 const dateTypeKeys=Object.keys(observanceTypes),festivalTypeSet=new Set(festivalTypeKeys);
 let result=null,controller=null,revision=0,view=new URLSearchParams(location.search).get('view')==='remembrance'?'remembrance':'dates',display='list',selected=new Set(dateTypeKeys),showFestivals=false,reminder='1',timed=false;
 const selectedTypes=()=>[...selected,...(showFestivals?festivalTypeKeys:[])],isSelected=event=>festivalTypeSet.has(event.type)?showFestivals:selected.has(event.type);
 const dateText=date=>new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{dateStyle:'long',timeZone:'Asia/Kolkata'}).format(new Date(date+'T12:00:00+05:30'));
 const timeText=value=>new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata',hour12:true}).format(new Date(Math.round(value/60000)*60000))+' IST';
 const button=(text,fn,cls)=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const vratControl=node('div',undefined,'observance-vrat-control'),vratLabel=node('span'),vratMenu=node('details',undefined,'observance-vrat-menu'),vratSummary=node('summary'),vratChoices=node('div',undefined,'observance-vrat-choices'),vratError=node('p',undefined,'fine');
 vratLabel.id='observance-vrat-label';vratMenu.id='observance-vrats';vratSummary.setAttribute('aria-describedby',vratLabel.id);vratError.setAttribute('role','alert');vratError.hidden=true;vratMenu.append(vratSummary,vratChoices);vratControl.append(vratLabel,vratMenu,vratError);fields.append(vratControl);
 function updateVratSummary(){const names=[...selected].map(key=>observanceTypes[key][language()]);if(showFestivals)names.push(w('festivals'));vratSummary.textContent=selected.size===dateTypeKeys.length?(language()==='hi'?'सभी व्रत':'All vrats')+(showFestivals?' + '+w('festivals'):''):names.length?names.slice(0,2).join(', ')+(names.length>2?' +'+(names.length-2):''):(language()==='hi'?'व्रत चुनें':'Select vrats');vratSummary.title=names.join(', ');vratError.hidden=names.length>0;}
 function selectionChanged(){updateVratSummary();if(result&&!controller)render();}
 function drawVratControl(){vratLabel.textContent=language()==='hi'?'व्रत':'Vrats';vratChoices.replaceChildren();const actions=node('div',undefined,'observance-vrat-actions');actions.append(button(w('all'),()=>{selected=new Set(dateTypeKeys);showFestivals=true;drawVratControl();selectionChanged();}),button(w('none'),()=>{selected.clear();showFestivals=false;drawVratControl();selectionChanged();}));vratChoices.append(actions);
  const list=node('fieldset');list.append(node('legend',language()==='hi'?'दिखाने वाले व्रत चुनें':'Choose vrats to include'));
  for(const [key,type]of [...Object.entries(observanceTypes),['festival',{en:words.en.festivals,hi:words.hi.festivals}]]){const label=node('label'),input=node('input');input.type='checkbox';input.dataset.observanceFilter=key;input.checked=key==='festival'?showFestivals:selected.has(key);input.onchange=()=>{if(key==='festival')showFestivals=input.checked;else if(input.checked)selected.add(key);else selected.delete(key);selectionChanged();};label.append(input,node('span',type[language()]));list.append(label);}vratChoices.append(list,button(language()==='hi'?'हो गया':'Done',()=>{vratMenu.open=false;vratSummary.focus();}));updateVratSummary();}
 vratMenu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();vratMenu.open=false;vratSummary.focus();}});
 function stop(){revision++;controller?.abort();controller=null;submit.disabled=false;form.removeAttribute('aria-busy');}
 function clear(){stop();result=null;output.replaceChildren();status.textContent=w('empty');}
 function activate(value,updateUrl=true){view=value;panel.hidden=view!=='dates';for(const part of original)part.hidden=view==='dates';workspace.update(view,language());$('headline').textContent=view==='dates'?w('title'):(language()==='hi'?'श्राद्ध और बरसी कैलेंडर':'Shraddha & Barsi Calendar');$('description').textContent=w('description');document.title=$('headline').textContent+' · Ritual Assist';if(view==='remembrance'){stop();locationPicker?.cancel();}if(updateUrl){const url=new URL(location.href);url.searchParams.set('view',view);if(url.href!==location.href)history.pushState(history.state,'',url);}}
 addEventListener('popstate',()=>{if(location.pathname.includes('/guides'))return;activate(new URL(location.href).searchParams.get('view')==='remembrance'?'remembrance':'dates',false);});
 datesButton.onclick=()=>activate('dates');remembranceButton.onclick=()=>activate('remembrance');
 function setup(){
  drawVratControl();
  const city=locationPicker?locationPicker.value:inputMemory.values.placeId||'';locationPicker?.destroy();locationPicker=mountCalendarLocation(cityContainer,{language:language(),value:city,onChange:()=>{rememberInputs();clear();},mode:'dates',prefix:'observance-location',detectId:'observance-use-location'});
  optionsTitle.textContent=language()==='hi'?'कैलेंडर सेटिंग (वैकल्पिक)':'Calendar settings (optional)';note.textContent=w('scope');formHeading.textContent=language()==='hi'?'स्थान और महीना':'Location & month';month.label.textContent=w('month');calendar.label.textContent=w('calendar');tradition.label.textContent=w('tradition');
  const prior=calendar.input.options.length?calendar.input.value:inputMemory.values.calendar||'';calendar.input.replaceChildren(...[['',w('automatic')],['amanta',w('amanta')],['purnimanta',w('purnimanta')]].map(([value,label])=>new Option(label,value)));calendar.input.value=prior;
  tradition.input.replaceChildren(new Option(w('smarta'),'smarta'));help.textContent=w('traditionHelp');yearHelp.textContent=w('yearHelp');submit.textContent=w('load');methodTitle.textContent=w('sources');methodText.textContent=w('method');
  attribution.replaceChildren();const geo=node('a','GeoNames · CC BY 4.0');geo.href='https://www.geonames.org/';attribution.append(geo,document.createTextNode(language()==='hi'?' · शहर के अनुमानित निर्देशांक।':' · Approximate city coordinates.'));
  activate(view,false);if(result)render();else status.textContent=w('empty');refreshMemoryCopy();
 }
 async function load(){
  if(!selected.size&&!showFestivals){vratError.textContent=language()==='hi'?'कम से कम एक व्रत चुनें।':'Choose at least one vrat.';vratError.hidden=false;vratMenu.open=true;vratSummary.focus();return;}vratMenu.open=false;
  rememberInputs();if(!form.reportValidity())return;
  stop();const token=revision,request=new AbortController();controller=request;submit.disabled=true;form.setAttribute('aria-busy','true');status.textContent=w('busy');output.replaceChildren();result=null;
  const timer=setTimeout(()=>request.abort(),25000);
  try{
   let chosen=month.input.value;
    const response=await fetch('/api/ritual-assist/observances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month:chosen,placeId:locationPicker.value,tradition:'smarta',...(calendar.input.value?{calendar:calendar.input.value}:{})}),cache:'no-store',signal:request.signal});
    const payload=await response.json();if(token!==revision)return;if(!response.ok)throw Error(payload.error||'Calculation unavailable');
    result=payload.result;month.input.value=chosen;rememberInputs();
   if(token!==revision)return;controller=null;submit.disabled=false;form.removeAttribute('aria-busy');render();
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
  card.tabIndex=-1;
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
  const toggles=node('div',undefined,'observance-result-tabs');toggles.setAttribute('role','group');toggles.setAttribute('aria-label',language()==='hi'?'तारीखों का दृश्य':'Results view');for(const mode of ['list','grid']){const b=button(w(mode),()=>{display=mode;render();output.querySelector('[data-result-view='+mode+']')?.focus();});b.dataset.resultView=mode;b.setAttribute('aria-pressed',String(display===mode));b.setAttribute('aria-controls','observance-result-view');toggles.append(b);}output.append(toggles);
  const resultView=node('section',undefined,'observance-result-view');resultView.id='observance-result-view';resultView.setAttribute('aria-label',w(display));output.append(resultView);
  const events=result.events.filter(isSelected),list=node('div',undefined,'observance-list'),todayDate=localDate(Date.now());
  const monthEvents=[...events].sort((a,b)=>a.date.localeCompare(b.date)),upcoming=monthEvents.filter(event=>event.date>=todayDate),visibleEvents=display==='grid'?monthEvents:upcoming;
  if(!events.length)list.append(node('p',w('noResults'),'notice'));else if(!visibleEvents.length)list.append(node('p',w('noUpcoming'),'notice'));else{let group,date;for(const event of visibleEvents){if(date!==event.date){date=event.date;group=node('section',undefined,'observance-date-group');group.dataset.date=date;group.append(node('h3',new Intl.DateTimeFormat(language()==='hi'?'hi-IN':'en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')),'observance-group-date'));list.append(group);}group.append(eventCard(event));}}
  if(display==='grid'){
   const dayDetails=node('section',undefined,'observance-day-details');dayDetails.hidden=true;dayDetails.setAttribute('aria-live','polite');
   const grid=node('div',undefined,'observance-grid');grid.setAttribute('aria-label',w('grid'));const weekdayNames=language()==='hi'?['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];for(const name of weekdayNames)grid.append(node('div',name,'observance-weekday'));
   const offset=new Date(result.month+'-01T12:00:00Z').getUTCDay();for(let i=0;i<offset;i++){const blank=node('div',undefined,'observance-blank');blank.setAttribute('aria-hidden','true');grid.append(blank);}
   for(const day of result.days){const cell=node('div',undefined,'observance-day');if(day.date===todayDate)cell.classList.add('is-today');if(day.date<todayDate)cell.classList.add('is-past');cell.append(node('strong',String(+day.date.slice(8))),node('small',tithiLabel(day.tithi,language())));for(const event of events.filter(e=>e.date===day.date)){const a=node('a',eventTitle(event,language())+(event.status==='computed'?'':' ?'));if(event.date<todayDate)a.classList.add('is-past');a.href='#event-'+event.id;a.onclick=click=>{click.preventDefault();dayDetails.hidden=false;dayDetails.replaceChildren(node('h3',dateText(event.date)),...monthEvents.filter(item=>item.date===event.date).map(eventCard));const target=dayDetails.querySelector('.observance-event');target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest'});};a.setAttribute('aria-label',w('viewDate')+' '+dateText(event.date)+' · '+eventTitle(event,language()));cell.append(a);}grid.append(cell);}resultView.append(grid,dayDetails);
  }
  if(display==='list')resultView.append(list);
  mountShareResult(output,{
   language:language(),title:()=>language()==='hi'?'व्रत कैलेंडर':'Vrat calendar',filename:()=>`ritual-assist-dates-${result.month}.png`,
   render:canvas=>{
    if(!visibleEvents.length)return false;
    canvas.className='observance-share-canvas';
    renderObservanceCard(canvas,visibleEvents.map(event=>({...event,title:eventTitle(event,language())})),{month:result.month,location:result.location.name,language:language(),view:display});return true;
   }
  });
 }
 for(const event of ['input','change'])form.addEventListener(event,event=>{if(vratControl.contains(event.target))return;rememberInputs();clear();});form.onsubmit=event=>{event.preventDefault();void load();};$('language').addEventListener('change',setup);addEventListener('pagehide',()=>{locationPicker?.cancel();clear();});
 setup();
 return {activate(value){activate(value,false);},suspend(){stop();locationPicker?.cancel();}};
}
