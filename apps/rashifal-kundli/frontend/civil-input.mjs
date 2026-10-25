// Memorable dates: direct entry, rather than navigating a calendar across decades.
// Canonical ISO values remain the only inputs passed to the calculation engine.
const copy={
 en:{day:'Day',month:'Month',year:'Year',hour:'Hour',minute:'Minute',period:'AM / PM',choose:'Choose',dateHelp:'Enter your date directly · e.g. 15 August 1990',timeHelp:'12-hour clock · select AM or PM · Indian Standard Time',dateError:'Enter a real date between 1950 and 2098.',timeError:'Enter an hour from 1 to 12 and minutes from 00 to 59.'},
 hi:{day:'दिन',month:'महीना',year:'वर्ष',hour:'घंटा',minute:'मिनट',period:'AM / PM',choose:'चुनें',dateHelp:'सीधे तारीख भरें · जैसे 15 अगस्त 1990',timeHelp:'12 घंटे की घड़ी · AM या PM चुनें · भारतीय मानक समय',dateError:'1950 से 2098 के बीच सही तारीख भरें।',timeError:'घंटा 1 से 12 और मिनट 00 से 59 भरें।'},
 gu:{day:'દિવસ',month:'મહિનો',year:'વર્ષ',hour:'કલાક',minute:'મિનિટ',period:'AM / PM',choose:'પસંદ કરો',dateHelp:'તારીખ સીધી ભરો · જેમ કે 15 ઑગસ્ટ 1990',timeHelp:'12 કલાકની ઘડિયાળ · AM અથવા PM પસંદ કરો · ભારતીય માનક સમય',dateError:'1950 થી 2098 વચ્ચે સાચી તારીખ ભરો.',timeError:'કલાક 1 થી 12 અને મિનિટ 00 થી 59 ભરો.'}
};
const digits=value=>value.replace(/[०-९૦-૯]/g,c=>String(c.charCodeAt(0)-(c>='૦'?0xae6:0x966)));
const pad=value=>String(value).padStart(2,'0');
export function installCivilInputs(root){
 const widgets=[...root.querySelectorAll('input[type=date],input[type=time]')].map(input=>{
  const date=input.type==='date',old=input.parentElement,caption=old.firstChild;
  const box=document.createElement('fieldset'),legend=document.createElement('legend'),row=document.createElement('div'),help=document.createElement('p');
  box.className='civil-input';row.className='civil-input-row';help.className='civil-input-help';help.id=input.id+'-help';legend.append(caption);box.append(legend,row,help,input);old.replaceWith(box);
  input.type='hidden';const fields={},labels={};let language='en',writing=false;
  for(const key of date?['day','month','year']:['hour','minute','period']){
   const label=document.createElement('label'),span=document.createElement('span'),control=document.createElement(key==='month'||key==='period'?'select':'input');
   control.id=input.id+'-'+key;label.htmlFor=control.id;label.append(span,control);row.append(label);fields[key]=control;labels[key]=span;
   control.setAttribute('aria-describedby',help.id);control.autocomplete='off';
   if(control.tagName==='INPUT'){control.type='text';control.inputMode='numeric';control.maxLength=key==='year'?4:2;control.pattern=key==='year'?'[0-9]{4}':'[0-9]{1,2}';control.placeholder=key==='year'?'YYYY':key==='day'?'DD':key==='minute'?'00':'hh';}
   else{const empty=new Option('', '');control.append(empty);for(let n=1;n<=(key==='month'?12:2);n++)control.append(new Option(key==='period'?(n===1?'AM':'PM'):'',key==='period'?(n===1?'AM':'PM'):String(n)));}
  }
  const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  function sync(){const value=descriptor.get.call(input);if(date){const [year='',month='',day='']=value.split('-');fields.year.value=year;fields.month.value=month?String(Number(month)):'';fields.day.value=day;}else{const [hour,minute]=value.split(':');fields.hour.value=hour===undefined||hour===''?'':String(Number(hour)%12||12);fields.minute.value=minute??'';fields.period.value=hour===undefined||hour===''?'':Number(hour)<12?'AM':'PM';}validate(false);}
  // Existing clear, swap and “now” actions continue to use the canonical contract.
  Object.defineProperty(input,'value',{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);if(!writing)sync();}});
  input.focus=()=>Object.values(fields)[0].focus();
  function validate(emit=true){
   const t=copy[language],values=Object.values(fields);for(const field of values)field.setCustomValidity('');
   let value='',invalid=false;
   if(date){const d=Number(fields.day.value),m=Number(fields.month.value),y=Number(fields.year.value),complete=values.every(f=>f.value!=='');
    if(complete){const actual=new Date(Date.UTC(y,m-1,d));invalid=!/^\d{4}$/.test(fields.year.value)||y<1950||y>2098||actual.getUTCFullYear()!==y||actual.getUTCMonth()!==m-1||actual.getUTCDate()!==d;if(!invalid)value=`${y}-${pad(m)}-${pad(d)}`;}
   }else{const h=Number(fields.hour.value),m=Number(fields.minute.value),complete=values.every(f=>f.value!=='');
    if(complete){invalid=!/^\d{1,2}$/.test(fields.hour.value)||!/^\d{1,2}$/.test(fields.minute.value)||h<1||h>12||m<0||m>59;if(!invalid)value=`${pad(h%12+(fields.period.value==='PM'?12:0))}:${pad(m)}`;}
   }
   if(invalid)values[0].setCustomValidity(date?t.dateError:t.timeError);
   if(emit){writing=true;input.value=value;writing=false;input.dispatchEvent(new Event('input',{bubbles:true}));}
  }
  for(const field of Object.values(fields)){
   field.addEventListener('invalid',()=>{if(field.validity.valueMissing)field.setCustomValidity(copy[language].choose+' · '+labels[Object.keys(fields).find(key=>fields[key]===field)].textContent);});
   field.addEventListener('input',()=>{if(field.tagName==='INPUT')field.value=digits(field.value);validate();});
   field.addEventListener('change',()=>validate());
   field.addEventListener('paste',event=>{const text=digits(event.clipboardData.getData('text')).trim();let value;
    if(date){const iso=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text),local=/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text);if(iso)value=[iso[3],iso[2],iso[1]];else if(local)value=local.slice(1);if(value){event.preventDefault();[fields.day.value,fields.month.value,fields.year.value]=[value[0],String(Number(value[1])),value[2]];validate();}}
    else{const match=/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(text);if(match){const h=Number(match[1]);if((match[3]&&(h<1||h>12))||(!match[3]&&h>23))return;event.preventDefault();fields.hour.value=String(h%12||12);fields.minute.value=match[2];fields.period.value=match[3]?.toUpperCase()??(h<12?'AM':'PM');validate();}}
   });
  }
  function refresh(){box.disabled=input.disabled;for(const field of Object.values(fields))field.required=input.required;}
  function translate(lang){language=copy[lang]?lang:'en';const t=copy[language];for(const [key,label]of Object.entries(labels))label.textContent=t[key];help.textContent=date?t.dateHelp:t.timeHelp;
   for(const key of date?['month']:['period']){const select=fields[key];select.options[0].textContent=t.choose;if(key==='month')for(let n=1;n<=12;n++)select.options[n].textContent=new Intl.DateTimeFormat(language,{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2000,n-1,1)));}
   refresh();validate(false);
  }
  const reset=()=>{input.value='';};input.form?.addEventListener('reset',reset);sync();
  return {translate,refresh,valid:()=>box.disabled||Object.values(fields).every(f=>f.reportValidity()),destroy(){input.form?.removeEventListener('reset',reset);}};
 });
 return {translate:lang=>widgets.forEach(w=>w.translate(lang)),refresh:()=>widgets.forEach(w=>w.refresh()),valid:()=>widgets.every(w=>w.valid()),destroy:()=>widgets.forEach(w=>w.destroy())};
}
