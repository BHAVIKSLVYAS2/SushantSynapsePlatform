import {localDate,tithiLabel,calendarRows,calendarText} from './panchang.mjs';
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
 const instant=value=>new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(value));
 const exportsOpen=container.querySelector('.remembrance-downloads')?.open||false;
 container.replaceChildren();container.classList.add('simple-remembrance');
 const form=document.getElementById('calendar-form');let inputs=form.querySelector('.input-details');
 if(!inputs){inputs=el('details',undefined,'input-details');inputs.append(el('summary'));for(const id of ['fields','calculate','privacy'])inputs.append(document.getElementById(id));form.append(inputs);}
 inputs.querySelector('summary').textContent=`${format(result.data.date)} · ${result.data.time} IST · ${result.data.location.name} — ${copy('Edit details','विवरण बदलें')}`;inputs.open=false;
 container.append(el('p',`${copy('Death tithi','मृत्यु तिथि')}: ${result.tithi?tithiLabel(result.tithi,language):copy('Confirmation required','पुष्टि आवश्यक')} · ${result.data.location.name}`,'remembrance-summary'));
 const rows=calendarRows(result).filter(row=>row.date&&row.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
 if(rows.length){const next=el('section',undefined,'card remembrance-next');next.append(el('h3',copy('Next observance','अगला अनुष्ठान')),el('strong',occasionTitle(rows[0],language)),el('p',format(rows[0].date),'date'));if(rows[0].conditional||!['computed','counted'].includes(rows[0].status))next.append(el('p',copy('Confirmation required','पुष्टि आवश्यक'),'entry-status'));container.append(next);}
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
 const state=views.get(result)||{tab:elapsed<=13?0:(!result.annual?.date||today<=result.annual.date)?1:2,years:5};views.set(result,state);
 function select(index,focus=false){state.tab=index;panels.forEach((panel,i)=>{panel.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});if(focus)buttons[index].focus();}
 for(const [i,title]of [copy('Immediate rites','प्रारम्भिक संस्कार'),copy('First year','पहला वर्ष'),copy('Future years','आगामी वर्ष')].entries()){
 const panel=el('section',undefined,'remembrance-panel');panel.id='remembrance-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','remembrance-tab-'+i);panel.tabIndex=0;
 const tab=button(title,()=>select(i));tab.id='remembrance-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panel.id);tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%3;if(event.key==='ArrowLeft')next=(i+2)%3;if(event.key==='Home')next=0;if(event.key==='End')next=2;if(next!==undefined){event.preventDefault();select(next,true);}});
 tabs.append(tab);buttons.push(tab);panels.push(panel);container.append(panel);panel.append(el('h3',title));}
 function entry(row){
 const item=el('article',undefined,'remembrance-entry');item.append(el('h4',occasionTitle(row,language)),el('p',row.date?format(row.date):copy('Date requires confirmation','तारीख की पुष्टि आवश्यक'),'date'));
 if(row.conditional||!['computed','counted'].includes(row.status))item.append(el('p',copy('Confirmation required','पुष्टि आवश्यक'),'entry-status'));
 const details=el('details');details.append(el('summary',copy('Details & preparation','विवरण और तैयारी')));
 if(row.status==='counted')details.append(el('p',copy('Counted from the death date; confirm your family’s day-counting custom.','मृत्यु की तारीख से दिन गिने गए हैं; पारिवारिक गणना पक्की करें।')));
 if(row.window)details.append(el('p',tithiLabel(row.window.number,language)),el('p',`${instant(row.window.start)} – ${instant(row.window.end)} IST`));
 for(const day of row.candidates||[])details.append(el('p',`${format(day.date)} · Aparahna ${instant(day.aparahnaStart)} – ${instant(day.aparahnaEnd)} IST`));
 if(row.kind==='pitru'&&row.conditional)details.append(el('p',copy('Confirm the Pitru Paksha rule for the death tithi and family circumstances.','मृत्यु तिथि और परिस्थिति के अनुसार पितृ पक्ष का नियम पक्का करें।')));
 const guide=el('a',copy('Open ritual preparation guides','संस्कार तैयारी मार्गदर्शिका खोलें'));guide.href='/ritual-assist';details.append(guide);item.append(details);return item;}
 panels[0].append(el('p',copy('Chautha and days 10–13, counted from the death date.','मृत्यु की तारीख से गिने चौथा और दिन 10–13।'),'fine'));for(const row of result.early||[])panels[0].append(entry(row));
 panels[1].append(el('p',copy('The first year after death: monthly Masik and first Barsi.','मृत्यु के बाद पहला वर्ष: मासिक और पहली बरसी।'),'fine'));
 const firstRows=[...(result.monthly||[]),...(result.annual?[result.annual]:[])];for(const row of firstRows)panels[1].append(entry(row));if(!firstRows.length)panels[1].append(el('p',copy('Confirm the death tithi to resolve these dates.','इन तारीखों के लिए मृत्यु तिथि की पुष्टि करें।')));
 if(result.pitru){panels[1].append(el('h4',copy('First eligible Pitru Paksha (may fall after the first year)','पहला लागू पितृ पक्ष (पहले वर्ष के बाद हो सकता है)')),entry(result.pitru));}
 const future=panels[2];future.append(el('p',copy('Upcoming years from today. Barsi and Pitru Paksha Shraddha are separate observances.','आज से आगामी वर्ष। बरसी और पितृ पक्ष श्राद्ध अलग अनुष्ठान हैं।'),'fine'));
 const years=el('label',copy('Show upcoming ','आगामी अवधि ')),range=el('select');range.id='remembrance-years';for(const n of [5,10])range.add(new Option(copy(`${n} years`,`${n} वर्ष`),String(n)));range.value=String(state.years);years.append(range);future.append(years);const schedule=el('div',undefined,'remembrance-years');future.append(schedule);
 function drawYears(){schedule.replaceChildren();const until=new Date(today+'T12:00:00Z');until.setUTCFullYear(until.getUTCFullYear()+state.years);const end=until.toISOString().slice(0,10);let count=0;
 for(const year of result.yearly||[]){const group=el('section',undefined,'remembrance-year');group.append(el('h4',String(year.year)));let found=false;for(const kind of ['annual','pitru'])for(const row of year[kind]||[]){if(![row.date,...(row.candidates||[]).map(d=>d.date)].some(d=>d&&d>=today&&d<end))continue;group.append(entry(row));found=true;count++;}if(found)schedule.append(group);}
 if(!count)schedule.append(el('p',copy('No dates available in this period. Check confirmation details above.','इस अवधि में तारीख उपलब्ध नहीं है। ऊपर पुष्टि का विवरण देखें।')));}
 range.onchange=()=>{state.years=Number(range.value);drawYears();};drawYears();select(state.tab);
 const exports=el('details',undefined,'remembrance-downloads');exports.open=exportsOpen;exports.append(el('summary',copy('Download / share','डाउनलोड / साझा करें')));container.append(exports);
 exports.append(button(copy('Print / save PDF','प्रिन्ट / PDF सहेजें'),()=>{delete document.body.dataset.printMode;window.print();}),button(copy('Download calendar','कैलेंडर डाउनलोड करें'),()=>downloadBlob(new Blob([calendarText(result,language)],{type:'text/plain;charset=utf-8'}),'ritual-assist-shraddha-barsi-calendar.txt')));mountCalendarTools(exports,result,language);mountShraddhaCard(exports,result,language);
 const pack=exports.querySelector('.preparation-pack');if(pack)container.append(pack);
 const printState=[];let screenYears;
 const beforePrint=()=>{if(document.body.dataset.printMode==='pack')return;screenYears=state.years;state.years=10;drawYears();printState.length=0;for(const detail of container.querySelectorAll('.remembrance-panel details')){printState.push([detail,detail.open]);detail.open=true;}};
 const afterPrint=()=>{for(const [detail,open]of printState)detail.open=open;if(screenYears){state.years=screenYears;screenYears=null;drawYears();}};
 container.printAbort?.abort();container.printAbort=new AbortController();addEventListener('beforeprint',beforePrint,{signal:container.printAbort.signal});addEventListener('afterprint',afterPrint,{signal:container.printAbort.signal});
}
