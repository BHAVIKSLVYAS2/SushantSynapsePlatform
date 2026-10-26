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
  const put=(key,text)=>{const node=card.querySelector('[data-vedic-'+key+']');if(node)node.textContent=text;};
  try{engine||=import('/rashifal-kundli/home-calendar.mjs').catch(error=>{engine=null;throw error;});const {homeCalendar,mountDailyAlmanac}=await engine;
   if(current!==revision||!card.isConnected)return;if(!card.querySelector('.daily-almanac'))mountDailyAlmanac(card.querySelector('[data-home-almanac]'),{compact:true});const data=homeCalendar(Date.now(),lang),t=copy[lang];
   for(const key of ['samvat','month','tithi'])put(key+'-label',t[key]);
   put('date',data.date);put('samvat',data.samvat??t.pending);put('month',data.month);put('tithi',data.tithi?.replace(/^[^:]+:\s*/,'')??t.pending);put('note',t.note);put('asof',data.asOf+' IST');card.dataset.calendarReady='true';
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
 document.addEventListener('visibilitychange',()=>refresh(true));window.addEventListener('pageshow',()=>refresh(true));setInterval(()=>refresh(),60000);
})();
