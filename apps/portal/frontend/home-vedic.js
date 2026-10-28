// The astronomy bundle is loaded only when the feature panel approaches view.
(() => {
 let engine,observed=null,intersection,active=false,lastMinute=-1,lastLanguage='',revision=0;
 const language=()=>window.SynapseLanguage?.get()||'en';
 const copy={en:{samvat:'Vikram Samvat',month:'Lunar month · Amanta',tithi:'Tithi now',pending:'Near a boundary · check in app',unavailable:'Calendar temporarily unavailable. Open the app to explore.',note:'Calculated preview · Chaitra-year Vikram · IST. Regional calendars differ; not a sunrise or festival Panchang.'},hi:{samvat:'विक्रम संवत',month:'चंद्र मास · अमान्त',tithi:'अभी की तिथि',pending:'सीमा के पास · ऐप में देखें',unavailable:'पंचांग अभी उपलब्ध नहीं है। ऐप में देखें।',note:'गणना पूर्वावलोकन · चैत्र से विक्रम वर्ष · IST। क्षेत्रीय पंचांग अलग हैं; यह सूर्योदय या त्योहार का पंचांग नहीं है।'}};
 copy.gu={samvat:'વિક્રમ સંવત',month:'ચંદ્ર માસ · અમાન્ત',tithi:'હાલની તિથિ',pending:'સીમા પાસે · ઍપમાં જુઓ',unavailable:'પંચાંગ હાલ ઉપલબ્ધ નથી. ઍપમાં જુઓ.',note:'ગણતરીનું પૂર્વાવલોકન · ચૈત્રથી વિક્રમ વર્ષ · IST. પ્રાદેશિક પંચાંગ અલગ હોય છે; આ સૂર્યોદય કે તહેવારનું પંચાંગ નથી.'};
 async function refresh(force=false){
  const card=document.querySelector('[data-home-vedic]');if(!card||!active||document.visibilityState==='hidden')return;
  const lang=language(),minute=Math.floor(Date.now()/60000);if(!force&&minute===lastMinute&&lastLanguage===lang)return;
  lastMinute=minute;lastLanguage=lang;const current=++revision;
  const put=(key,text)=>{const node=card.querySelector('[data-vedic-'+key+']');if(node&&(node.querySelector('.vedic-value-full')?.textContent??node.textContent)!==text)node.textContent=text;};
  try{engine||=import('/rashifal-kundli/home-calendar.mjs').catch(error=>{engine=null;throw error;});const {homeCalendar,mountDailyAlmanac}=await engine;
   if(current!==revision||!card.isConnected)return;if(!card.querySelector('.daily-almanac'))mountDailyAlmanac(card.querySelector('[data-home-almanac]'),{compact:true});const panel=card.querySelector('.daily-almanac');const line=card.querySelector('.home-vedic-calendar-line');if(line&&panel.querySelector('.almanac-heading'))line.append(panel.querySelector('.almanac-heading'));const note=card.querySelector('.home-vedic-note');if(note&&note.parentElement===card.querySelector('.home-vedic-content'))panel.querySelector(':scope>details').append(note);const data=homeCalendar(Date.now(),lang),t=copy[lang];
   const compactLabels={en:{samvat:'Samvat',month:'Month',tithi:'Tithi'},hi:{samvat:'संवत',month:'चंद्र मास',tithi:'तिथि'},gu:{samvat:'સંવત',month:'ચંદ્ર માસ',tithi:'તિથિ'}}[lang];
   for(const key of ['samvat','month','tithi']){const node=card.querySelector('[data-vedic-'+key+'-label]');if(!node.querySelector('.vedic-label-full')){const full=document.createElement('span'),short=document.createElement('span');full.className='vedic-label-full';short.className='vedic-label-short';short.setAttribute('aria-hidden','true');node.replaceChildren(full,short);}const full=node.querySelector('.vedic-label-full'),short=node.querySelector('.vedic-label-short');if(full.textContent!==t[key])full.textContent=t[key];if(short.textContent!==compactLabels[key])short.textContent=compactLabels[key];node.title=t[key];}
   const displayDate=new Intl.DateTimeFormat(({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[lang],{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'short',year:'numeric'}).format(new Date(data.utcInstant));
   put('date',displayDate);const dateNode=card.querySelector('[data-vedic-date]');if(dateNode.title!==data.date)dateNode.title=data.date;
   put('samvat',data.samvat??t.pending);put('month',data.month);put('tithi',data.tithi?.replace(/^[^:]+:\s*/,'')??t.pending);put('note',t.note);put('asof',data.asOf+' IST');card.dataset.calendarReady='true';
   const tithiNode=card.querySelector('[data-vedic-tithi]'),fullTithi=tithiNode.querySelector('.vedic-value-full')?.textContent??tithiNode.textContent,parts=fullTithi.split(' · ');
   tithiNode.title=fullTithi;tithiNode.dataset.resolved=String(parts.length===2);
   if(parts.length===2){if(!tithiNode.querySelector('.vedic-value-short')){const full=document.createElement('span'),short=document.createElement('span');full.className='vedic-value-full';short.className='vedic-value-short';full.textContent=fullTithi;short.textContent=parts[1];short.setAttribute('aria-hidden','true');tithiNode.replaceChildren(full,short);tithiNode.title=fullTithi;}const shortLabel=card.querySelector('[data-vedic-tithi-label] .vedic-label-short');shortLabel.textContent=compactLabels.tithi+' · '+parts[0];}
   const actions={en:['View My Rashifal','Generate New Kundli'],hi:['मेरा राशिफल देखें','नई कुंडली बनाएँ'],gu:['મારું રાશિફળ જુઓ','નવી કુંડળી બનાવો']}[lang];
   for(const [index,link]of [...card.querySelectorAll('.home-vedic-actions a')].entries()){let label=link.querySelector('[data-vedic-action-label]');if(!label){label=document.createElement('span');label.dataset.vedicActionLabel='';const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='→';link.replaceChildren(label,arrow);}if(label.textContent!==actions[index])label.textContent=actions[index];}
   const shortActions={en:['Rashifal','New Kundli'],hi:['राशिफल','नई कुंडली'],gu:['રાશિફળ','નવી કુંડળી']}[lang];
   for(const [index,link]of [...card.querySelectorAll('.home-vedic-actions a')].entries()){let short=link.querySelector('.vedic-action-short');if(!short){short=document.createElement('span');short.className='vedic-action-short';short.setAttribute('aria-hidden','true');link.insertBefore(short,link.lastElementChild);}if(short.textContent!==shortActions[index])short.textContent=shortActions[index];link.title=actions[index];}
  }catch{if(current===revision&&card.isConnected){put('note',copy[lang].unavailable);put('date','');put('asof','');for(const key of ['samvat','month','tithi'])put(key,'—');card.dataset.calendarReady='false';}}
 }
 function mount(){const card=document.querySelector('[data-home-vedic]');if(!card||card===observed)return;intersection?.disconnect();observed=card;active=false;lastMinute=-1;
  if(!('IntersectionObserver'in window)){active=true;refresh(true);return;}
  intersection=new IntersectionObserver(entries=>{active=entries.some(e=>e.isIntersecting);if(active)refresh();},{rootMargin:'200px'});intersection.observe(card);
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);
 const mutations=()=>{mount();if(language()!==lastLanguage)refresh();};
 if(window.SynapseUI)window.SynapseUI.observe(mutations);else new MutationObserver(mutations).observe(document.querySelector('#platform'),{childList:true,subtree:true});
 new MutationObserver(()=>refresh()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('visibilitychange',()=>refresh());window.addEventListener('pageshow',()=>refresh());setInterval(()=>refresh(),60000);
})();
