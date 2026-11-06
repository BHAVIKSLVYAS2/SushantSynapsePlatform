import {localDate,tithiLabel,calendarRows,calendarText} from './panchang.mjs';
import {remembranceYears,remembranceRangeLabel} from './remembrance-range.mjs';
import {downloadBlob} from '/shared/download.mjs';
import {occasionTitle} from './calendar-export.mjs';
import {mountCalendarTools} from './calendar-tools.mjs';
import {mountShraddhaCard} from './shraddha-card.mjs?v=20261105-portrait';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
const views=new WeakMap();
export function mountDashboard(container,result,language){
 const copy=(en,hi)=>language==='hi'?hi:en,today=localDate(Date.now());
 const format=date=>new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{dateStyle:'long',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const instant=value=>new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date(Math.round(value/60000)*60000));
 const clock=value=>new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'}).format(new Date(Math.round(value/60000)*60000));
 const exportsOpen=container.querySelector('.remembrance-downloads')?.open||false;
 container.replaceChildren();container.classList.add('simple-remembrance');
 const form=document.getElementById('calendar-form');let inputs=form.querySelector('.input-details');
 if(!inputs){inputs=el('details',undefined,'input-details');inputs.append(el('summary'));for(const id of ['fields','calculate','privacy','remembrance-memory-controls']){const part=document.getElementById(id);if(part)inputs.append(part);}form.append(inputs);}
 const saving=form.querySelector('#remembrance-memory-controls')?.dataset.storageStatus;
 inputs.querySelector('summary').textContent=`${format(result.data.date)} · ${result.data.time} IST · ${result.data.location.name} — ${copy('Edit details','विवरण बदलें')}${saving&&saving!=='ready'?copy(' · Browser fields not saved',' · फ़ील्ड सहेजे नहीं गए'):''}`;inputs.open=false;
 container.append(el('p',`${copy('Death tithi','मृत्यु तिथि')}: ${result.tithi?tithiLabel(result.tithi,language):copy('Confirmation required','पुष्टि आवश्यक')}`,'remembrance-summary'));
 const upcoming=calendarRows(result).filter(row=>['annual','pitru'].includes(row.kind)&&row.date&&row.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
 if(upcoming[0]){const next=el('p',undefined,'remembrance-next');next.append(el('strong',copy('Next remembrance','अगला स्मरण')),document.createTextNode(` · ${occasionTitle(upcoming[0],language)} · ${format(upcoming[0].date)}`));container.append(next);}
 const warnings={
 'time-required':copy('Enter the exact time or a priest-confirmed death tithi.','सही समय या पुरोहित द्वारा निश्चित मृत्यु तिथि भरें।'),
 'confirm-boundary-tithi':copy('Death time is near a tithi change. Confirm the death tithi.','मृत्यु समय तिथि सीमा के पास है। मृत्यु तिथि की पुष्टि करें।'),
 'adhika-in-year':copy('An extra lunar month occurs: additional Masik dates need family confirmation.','इस वर्ष अधिक मास है: अतिरिक्त मासिक की पारिवारिक पुष्टि करें।'),
 'death-adhika':copy('Death occurred in Adhik Maas. Confirm annual observance rules.','मृत्यु अधिक मास में हुई। वार्षिक अनुष्ठान के नियम पक्के करें।'),
 'month-boundary':copy('Lunar month classification requires a regional Panchang check.','मास निर्धारण के लिए क्षेत्रीय पंचांग से पुष्टि करें।'),
 'pitru-unresolved':copy('The Pitru Paksha date requires confirmation.','पितृ पक्ष की तारीख की पुष्टि आवश्यक है।')};
 for(const code of result.warnings||[])if(warnings[code])container.append(el('p',warnings[code],'notice'));
 if(!result.tithi&&result.dayWindows?.length)container.append(el('p',result.dayWindows.map(w=>`${tithiLabel(w.number,language)}: ${instant(w.start)} – ${instant(w.end)}`).join('; '),'fine'));
 const tabs=el('div',undefined,'remembrance-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',copy('Remembrance period','स्मरण अवधि'));container.append(tabs);
 const panels=[],buttons=[],elapsed=(Date.parse(today)-Date.parse(result.data.date))/86400000;
 const state=views.get(result)||{tab:(result.annual?.date?today<=result.annual.date:elapsed<=366)?0:1,year:Number(upcoming[0]?.date.slice(0,4)||result.yearly[0].year)};views.set(result,state);
 function select(index,focus=false){state.tab=index;panels.forEach((panel,i)=>{panel.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});container.querySelector('.shraddha-share')?.updateScope(index===0?'first-year':'year',state.year);if(focus)buttons[index].focus();}
 for(const [i,title]of [copy('First year & early rites','पहला वर्ष और प्रारम्भिक संस्कार'),copy('Upcoming / by year','आगामी / वर्ष के अनुसार')].entries()){
 const panel=el('section',undefined,'remembrance-panel');panel.id='remembrance-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','remembrance-tab-'+i);panel.tabIndex=0;
 const tab=button(title,()=>select(i));tab.id='remembrance-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%2;if(event.key==='ArrowLeft')next=(i+1)%2;if(event.key==='Home')next=0;if(event.key==='End')next=1;if(next!==undefined){event.preventDefault();select(next,true);}});
 tabs.append(tab);buttons.push(tab);panels.push(panel);container.append(panel);panel.append(el('h3',title));}
 function entry(row){
 const item=el('article',undefined,'remembrance-entry');item.append(el('h4',occasionTitle(row,language)),el('p',row.date?format(row.date):copy('Date requires confirmation','तारीख की पुष्टि आवश्यक'),'date'));
 if(row.conditional||!['computed','counted'].includes(row.status))item.append(el('p',copy('Confirmation required','पुष्टि आवश्यक'),'entry-status'));
 const details=el('div',undefined,'remembrance-calculation');
 if(row.status==='counted')details.append(el('p',copy(`Day ${row.day} · day 1: ${format(result.firstDate)}`,`दिन ${row.day} · पहला दिन: ${format(result.firstDate)}`)));
 if(row.window)details.append(el('strong',tithiLabel(row.window.number,language)),el('p',`${copy('Tithi','तिथि')}: ${instant(row.window.start)} → ${instant(row.window.end)} IST`));
 for(const day of row.candidates||[])details.append(el('p',`${day.date!==row.date?format(day.date)+' · ':''}${copy('Aparahna','अपराह्न')}: ${clock(day.aparahnaStart)} – ${clock(day.aparahnaEnd)} IST`));
 if(row.kind==='pitru'&&row.conditional)details.append(el('p',copy('Confirm the Pitru Paksha rule for the death tithi and family circumstances.','मृत्यु तिथि और परिस्थिति के अनुसार पितृ पक्ष का नियम पक्का करें।')));
 item.append(details);return item;}
 panels[0].append(el('p',copy('From the death date: early rites, monthly Masik and first Barsi.','मृत्यु की तारीख से: प्रारम्भिक संस्कार, मासिक और पहली बरसी।'),'fine'));
 const firstRows=[...(result.early||[]),...(result.monthly||[]),...(result.annual?[result.annual]:[])].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 for(const row of firstRows)panels[0].append(entry(row));
 if(result.pitru){panels[0].append(el('h4',copy('First eligible Pitru Paksha (may fall after the first year)','पहला लागू पितृ पक्ष (पहले वर्ष के बाद हो सकता है)')),entry(result.pitru));}
 const future=panels[1],years=el('label',copy('Observance year','अनुष्ठान का वर्ष')),range=el('select');range.id='remembrance-year';
 for(const count of [2,5,10])range.add(new Option(copy(`Next ${count} years`,`अगले ${count} वर्ष`),`next-${count}`));
 for(const year of result.yearly||[])range.add(new Option(String(year.year),String(year.year)));
 range.value=String(state.year);years.append(range);future.append(years);
 const rangeHelp=el('p',undefined,'fine');rangeHelp.id='remembrance-range-help';range.setAttribute('aria-describedby',rangeHelp.id);
 const schedule=el('div',undefined,'remembrance-years');schedule.setAttribute('aria-live','polite');future.append(rangeHelp,schedule);
 function drawYears(all=false){schedule.replaceChildren();const selected=all?result.yearly:remembranceYears(result,state.year);rangeHelp.textContent=copy(`Showing ${remembranceRangeLabel(result,state.year)}. Ranges start in ${result.yearly[0].year}.`,`दिखाए गए वर्ष: ${remembranceRangeLabel(result,state.year)}। अवधि ${result.yearly[0].year} से शुरू होती है।`);for(const year of selected){
  const group=el('section',undefined,'remembrance-year');if(all||selected.length>1)group.append(el('h4',String(year.year)));
  const rows=[...(year.annual||[]),...(year.pitru||[])].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  const next=rows.find(row=>row.date&&row.date>=today);
  for(const row of rows){const item=entry(row);if(row===next){item.classList.add('is-next');item.querySelector('h4').append(el('span',copy('Next in this year','इस वर्ष की अगली तिथि'),'next-label'));}else if(row.date&&row.date<today)item.querySelector('h4').append(el('span',copy('Past','बीती तिथि'),'past-label'));group.append(item);}
  if(!rows.length)group.append(el('p',copy('Not yet applicable / confirmation required.','अभी लागू नहीं / पुष्टि आवश्यक।')));
  schedule.append(group);
 }}
 range.onchange=()=>{state.year=range.value;drawYears();container.querySelector('.shraddha-share')?.updateScope(state.tab===0?'first-year':'year',state.year);const preview=container.querySelector('.shraddha-share-preview');if(preview)preview.open=true;};
 drawYears();select(state.tab);
 const exports=el('details',undefined,'remembrance-downloads');exports.open=exportsOpen;exports.append(el('summary',copy('Download / share','डाउनलोड / साझा करें')));container.append(exports);
 exports.append(button(copy('Print / save PDF','प्रिन्ट / PDF सहेजें'),()=>{delete document.body.dataset.printMode;window.print();}),button(copy('Download calendar','कैलेंडर डाउनलोड करें'),()=>downloadBlob(new Blob([calendarText(result,language)],{type:'text/plain;charset=utf-8'}),'ritual-assist-shraddha-barsi-calendar.txt')));mountCalendarTools(exports,result,language);mountShraddhaCard(exports,result,language,state.year,state.tab===0?'first-year':'year');
 const pack=exports.querySelector('.preparation-pack');if(pack)container.append(pack);
 const beforePrint=()=>{if(document.body.dataset.printMode!=='pack')drawYears(true);};
 const afterPrint=()=>drawYears();
 container.printAbort?.abort();container.printAbort=new AbortController();addEventListener('beforeprint',beforePrint,{signal:container.printAbort.signal});addEventListener('afterprint',afterPrint,{signal:container.printAbort.signal});
}
