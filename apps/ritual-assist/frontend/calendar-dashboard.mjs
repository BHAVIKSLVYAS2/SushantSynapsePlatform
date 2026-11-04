import {localDate,addDays,tithiLabel} from './panchang.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
let span=1;
const presented=new WeakSet();

// Canonical inputs remain the API boundary. No death date or time is guessed.
export function mountDateSteppers(form,language){
 const hi=language==='hi',date=form.querySelector('#date'),time=form.querySelector('#time');
 const grid=el('fieldset',undefined,'death-steppers');grid.append(el('legend',hi?'मृत्यु की तारीख और समय · IST':'Death date & time · IST'));
 const parts={day:date.value?+date.value.slice(8):null,month:date.value?+date.value.slice(5,7):null,year:date.value?+date.value.slice(0,4):null,hour:time.value?(+time.value.slice(0,2)%12||12):null,minute:time.value?+time.value.slice(3):null};
 let pm=time.value?+time.value.slice(0,2)>=12:false;
 const selects={},today=localDate(Date.now()),pad=n=>String(n).padStart(2,'0');
 const maxDay=()=>parts.year&&parts.month?new Date(Date.UTC(parts.year,parts.month,0)).getUTCDate():31;
 const sync=()=>{
  if(parts.day>maxDay()){parts.day=maxDay();selects.day.value=String(parts.day);}
  date.value=parts.year&&parts.month&&parts.day?`${parts.year}-${pad(parts.month)}-${pad(parts.day)}`:'';
  time.value=parts.hour!==null&&parts.minute!==null?`${pad(parts.hour%12+(pm?12:0))}:${pad(parts.minute)}`:'';
  grid.querySelector('.stepper-error').textContent=date.value>today?(hi?'भविष्य की मृत्यु तारीख नहीं चुनें।':'The death date cannot be in the future.'):'';
  date.dispatchEvent(new Event('input',{bubbles:true}));
 };
 for(const [key,en,hn,min,max,initial] of [['day','Day','दिन',1,31,+today.slice(8)],['month','Month','माह',1,12,+today.slice(5,7)],['year','Year','वर्ष',1950,+today.slice(0,4),+today.slice(0,4)],['hour','Hour','घंटा',1,12,12],['minute','Min','मिनट',0,59,0]]){
  const box=el('div',undefined,'death-stepper'),label=el('label',hi?hn:en),select=el('select');select.id='death-'+key;select.setAttribute('aria-label',hi?hn:en);label.htmlFor=select.id;
  select.add(new Option('—',''));for(let n=min;n<=max;n++)select.add(new Option(key==='month'?new Intl.DateTimeFormat(hi?'hi-IN':'en-IN',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2000,n-1,1))):key==='year'?String(n):pad(n),String(n)));
  select.value=parts[key]===null?'':String(parts[key]);selects[key]=select;
  const step=delta=>{const end=key==='day'?maxDay():max;parts[key]=parts[key]===null?initial:Math.min(end,Math.max(min,parts[key]+delta));select.value=String(parts[key]);sync();};
  const plus=button('+',()=>step(1)),minus=button('−',()=>step(-1));plus.setAttribute('aria-label',(hi?'बढ़ाएँ ':'Increase ')+(hi?hn:en));minus.setAttribute('aria-label',(hi?'घटाएँ ':'Decrease ')+(hi?hn:en));
  select.onchange=()=>{parts[key]=select.value===''?null:Number(select.value);sync();};box.append(label,plus,select,minus);grid.append(box);
 }
 const meridiem=el('div',undefined,'death-meridiem');meridiem.setAttribute('role','group');meridiem.setAttribute('aria-label',hi?'सुबह / शाम':'AM or PM');
 for(const [text,value]of [['AM',false],['PM',true]]){const b=button(text,()=>{pm=value;for(const item of meridiem.children)item.setAttribute('aria-pressed',String(item===b));sync();});b.setAttribute('aria-pressed',String(pm===value));meridiem.append(b);}grid.append(meridiem);
 const error=el('p',undefined,'stepper-error');error.setAttribute('role','status');grid.append(error);
 date.parentElement.classList.add('canonical-death-input');time.parentElement.classList.add('canonical-death-input');date.required=false;time.required=false;
 form.querySelector('#fields').prepend(grid);
 form.addEventListener('submit',event=>{if(!date.value||!time.value||date.value>today){event.preventDefault();event.stopImmediatePropagation();error.textContent=hi?'पूरी तारीख और सही IST समय चुनें।':'Choose the complete death date and exact IST time.';selects.day.focus();}},{capture:true,signal:form.stepperAbort?.signal});
}

export function mountDashboard(container,result,language){
 const hi=language==='hi',history=container.querySelector('.full-calendar'),future=container.querySelector('.future-plan');if(!future)return;
 container.classList.add('remembrance-dashboard');
 const panel=el('section',undefined,'observation-dashboard');panel.tabIndex=-1;panel.append(el('p',hi?'एक नज़र में आगामी अनुष्ठान':'YOUR OBSERVATION WINDOW','dashboard-eyebrow'),el('h3',hi?'आगामी स्मरण तिथियाँ':'Upcoming remembrance dates'));
 const chips=el('div',undefined,'timeframe-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label',hi?'आगामी अवधि':'Observation window');
 const summary=el('p',undefined,'window-summary');summary.setAttribute('role','status');
 const table=el('table',undefined,'observation-table'),caption=el('caption',hi?'बरसी और पितृ पक्ष · स्थानीय समय IST':'Barsi & Pitru Paksha · local times in IST');table.append(caption);
 const head=el('thead'),header=el('tr');for(const title of [hi?'वर्ष':'Year',hi?'बरसी / संवत्सरी':'Barsi / Samvatsari',hi?'पितृ पक्ष श्राद्ध':'Pitru Paksha Shraddha']){const th=el('th',title);th.scope='col';header.append(th);}head.append(header);const body=el('tbody');table.append(head,body);
 const from=localDate(Date.now()),format=date=>new Intl.DateTimeFormat(hi?'hi-IN':'en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const clock=value=>new Intl.DateTimeFormat(hi?'hi-IN':'en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata',hour12:true}).format(new Date(value));
 function draw(){
  const targetYear=+from.slice(0,4)+span,month=+from.slice(5,7),day=Math.min(+from.slice(8),new Date(Date.UTC(targetYear,month,0)).getUTCDate()),until=`${targetYear}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  body.replaceChildren();let count=0;
  for(const year of result.yearly){
   const admitted=kind=>(year[kind]||[]).filter(row=>[row.date,...(row.candidates||[]).map(c=>c.date)].some(date=>date&&date>=from&&date<until));
   const annual=admitted('annual'),pitru=admitted('pitru');if(!annual.length&&!pitru.length)continue;
   const tr=el('tr'),yearCell=el('th');yearCell.scope='row';yearCell.append(el('span',String(year.year),'year-badge'));tr.append(yearCell);
   for(const [rows,title]of [[annual,hi?'बरसी / संवत्सरी':'Barsi / Samvatsari'],[pitru,hi?'पितृ पक्ष श्राद्ध':'Pitru Paksha Shraddha']]){
    const td=el('td');td.append(el('span',title,'mobile-observation-label'));
    if(!rows.length)td.append(el('p',hi?'इस अवधि में कोई तिथि नहीं':'No date in this window','fine'));
    for(const row of rows){count++;const item=el('article');item.append(el('strong',row.date?format(row.date):(hi?'तारीख की पुष्टि करें':'Confirm date'),'observation-date'),el('p',row.conditional||row.status!=='computed'?(hi?'पुष्टि आवश्यक':'Confirmation required'):(hi?'गणना की गई तिथि':'Calculated date'),'observation-state'));
     for(const candidate of row.candidates||[]){if(candidate.date<from||candidate.date>=until)continue;item.append(el('p',(hi?'अपराह्न ':'Aparahna ')+(candidate.date!==row.date?format(candidate.date)+' · ':'')+clock(candidate.aparahnaStart)+' – '+clock(candidate.aparahnaEnd)+' IST','aparahna-window'));}
     const details=el('details');details.append(el('summary',hi?'तिथि और गणना':'Tithi & calculation'));if(row.window){const instant=value=>new Intl.DateTimeFormat(hi?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(value));details.append(el('p',tithiLabel(row.window.number,language)),el('p',instant(row.window.start)+' → '+instant(row.window.end)+' IST'));}td.append(item);item.append(details);
    }tr.append(td);
   }body.append(tr);
  }
  summary.textContent=`${format(from)} – ${format(addDays(until,-1))} · ${count} ${hi?'अनुष्ठान':'observances'}`;
  if(!count){const tr=el('tr'),td=el('td',hi?'इस अवधि में कोई गणना की गई तिथि उपलब्ध नहीं।':'No calculated observances are available in this window.');td.colSpan=3;tr.append(td);body.append(tr);}
  for(const chip of chips.children)chip.setAttribute('aria-pressed',String(Number(chip.dataset.years)===span));
 }
 for(const n of [1,2,3,5]){const chip=button(hi?`अगले ${n} वर्ष`:n===1?'Next 1 Year':`${n} Years`,()=>{span=n;draw();});chip.dataset.years=String(n);chips.append(chip);}
 panel.append(chips,summary,table);container.prepend(panel);draw();
 // The legacy complete table remains print-only/advanced; lookup uses one DOM.
 const actionBar=el('nav',undefined,'remembrance-actions');actionBar.setAttribute('aria-label',hi?'कैलेंडर निर्यात':'Calendar exports');
 const legacy=container.querySelector('.actions'),ics=container.querySelector('.calendar-tools .reminder-controls button'),png=container.querySelector('.shraddha-share-actions button');
 const pdf=legacy?.querySelectorAll('button')[2];
 for(const [text,target]of [[hi?'.ics कैलेंडर डाउनलोड करें':'Download .ics Calendar',ics],[hi?'PDF रिपोर्ट सहेजें':'Save PDF Report',pdf],[hi?'वर्ष का PNG डाउनलोड करें':'Download Year PNG',png]]){const b=button(text,()=>target?.click());b.disabled=!target||target.disabled;actionBar.append(b);}
 container.append(actionBar);
 history?.classList.add('advanced-calendar');
 if(!presented.has(result)){presented.add(result);requestAnimationFrame(()=>{if(panel.isConnected){panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'instant'});}});}
}
