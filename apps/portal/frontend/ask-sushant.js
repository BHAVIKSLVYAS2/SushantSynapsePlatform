// Home-owned local app guide. No AI provider, network request or conversation store.
(()=>{'use strict';
 let mountedEvents;
 const copy={
 en:['Ask Nishi','App guide','Find an app for what you need. AI chat will be connected later.','Close Ask Nishi','What would you like to do?','For example: track rent or practise a mantra','Find apps','Where is my data saved?','Questions stay on this page and are cleared when you close it.','Matching apps','No matching app found. Try an app name or a short task such as rent, photo or mantra.','Some apps save records in this browser profile. Hisabio, Kiraya Saathi and JapSeva currently use browser storage: export backups before clearing it. Chambers saves records in your signed-in workspace. Pinned apps and their order stay on this device.','Sign-in workspace','Open app','Type an app name or task to find a tool.'],
 hi:['निशि से पूछें','ऐप मार्गदर्शक','अपनी ज़रूरत का ऐप खोजें। AI चैट बाद में जोड़ी जाएगी।','निशि से पूछें बंद करें','आप क्या करना चाहते हैं?','जैसे: किराया हिसाब या मंत्र अभ्यास','ऐप खोजें','मेरा डेटा कहाँ सहेजा जाता है?','प्रश्न इसी पेज पर रहते हैं और बंद करने पर हट जाते हैं।','मिलते-जुलते ऐप','कोई ऐप नहीं मिला। ऐप का नाम या किराया, फ़ोटो, मंत्र जैसे छोटे शब्द खोजें।','कुछ ऐप इस ब्राउज़र प्रोफ़ाइल में रिकॉर्ड रखते हैं। हिसाबियो, किराया साथी और जपसेवा अभी ब्राउज़र स्टोरेज इस्तेमाल करते हैं: इसे साफ करने से पहले बैकअप लें। Chambers आपके साइन-इन कार्यक्षेत्र में रिकॉर्ड सहेजता है। पिन किए ऐप और उनका क्रम इसी डिवाइस पर रहते हैं।','साइन-इन कार्यक्षेत्र','ऐप खोलें','ऐप खोजने के लिए उसका नाम या काम लिखें।'],
 gu:['નિશિને પૂછો','ઍપ માર્ગદર્શક','તમારી જરૂરિયાતની ઍપ શોધો. AI ચેટ પછી જોડાશે.','નિશિને પૂછો બંધ કરો','તમે શું કરવા માંગો છો?','જેમ કે: ભાડાનો હિસાબ કે મંત્ર અભ્યાસ','ઍપ શોધો','મારો ડેટા ક્યાં સચવાય છે?','પ્રશ્નો આ પેજ પર રહે છે અને બંધ કરતાં દૂર થાય છે.','મેળ ખાતી ઍપ','કોઈ ઍપ મળી નથી. ઍપનું નામ અથવા ભાડું, ફોટો, મંત્ર જેવા ટૂંકા શબ્દો શોધો.','કેટલીક ઍપ આ બ્રાઉઝર પ્રોફાઇલમાં રેકોર્ડ રાખે છે. હિસાબિયો, કિરાયા સાથી અને જપસેવા હાલમાં બ્રાઉઝર સ્ટોરેજ વાપરે છે: તેને સાફ કરતાં પહેલાં બૅકઅપ લો. Chambers તમારા સાઇન-ઇન કાર્યક્ષેત્રમાં રેકોર્ડ સાચવે છે. પિન કરેલી ઍપ અને તેમનો ક્રમ આ ઉપકરણ પર રહે છે.','સાઇન-ઇન કાર્યક્ષેત્ર','ઍપ ખોલો','ઍપ શોધવા તેનું નામ કે કામ લખો.']};
 const words=()=>copy[(document.documentElement.lang||'en').split('-')[0]]||copy.en;
 function mount(home){
  const toolbar=home.querySelector('.home-layout-toolbar');if(!toolbar||toolbar.querySelector('.ask-sushant-trigger'))return;
  // A catalogue remount replaces the old home; do not retain its detached dialog.
  document.querySelector('#ask-sushant-dialog')?.remove();
  mountedEvents?.abort();mountedEvents=new AbortController();
  const trigger=document.createElement('button');trigger.type='button';trigger.className='ask-sushant-trigger';trigger.setAttribute('translate','no');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','ask-sushant-dialog');
  const dialog=document.createElement('dialog');dialog.id='ask-sushant-dialog';dialog.className='ask-sushant-dialog';dialog.setAttribute('translate','no');dialog.setAttribute('aria-labelledby','ask-sushant-title');dialog.setAttribute('aria-describedby','ask-sushant-intro');
  dialog.innerHTML='<header class="ask-sushant-heading"><div><span class="ask-sushant-kicker"></span><h2 id="ask-sushant-title"></h2></div><button type="button" class="ask-sushant-close">×</button></header><p id="ask-sushant-intro"></p><form class="ask-sushant-form"><label for="ask-sushant-question"></label><div class="ask-sushant-composer"><input id="ask-sushant-question" type="search" maxlength="300" autocomplete="off" enterkeyhint="search"><button type="submit"></button></div></form><button type="button" class="ask-sushant-data"></button><div class="ask-sushant-answer" role="region" aria-label="Answer" hidden><p class="ask-sushant-answer-label" role="status"></p><div class="ask-sushant-results"></div></div><p class="ask-sushant-privacy"></p>';
  const input=dialog.querySelector('input'),answer=dialog.querySelector('.ask-sushant-answer'),status=dialog.querySelector('.ask-sushant-answer-label'),results=dialog.querySelector('.ask-sushant-results');
  status.id='ask-sushant-answer-title';answer.removeAttribute('aria-label');answer.setAttribute('aria-labelledby',status.id);
  let mode='',question='';
  const normalise=value=>value.normalize('NFKC').toLocaleLowerCase();
  function respond(){
   const w=words();results.replaceChildren();answer.hidden=false;
   if(mode==='data'){status.textContent=w[7];const p=document.createElement('p');p.textContent=w[11];results.append(p);return;}
   const ignored=new Set(['i','a','an','the','to','for','with','my','me','want','need','app','apps','please','can','you','help','how','do','which','find','is','what']);
   const terms=normalise(question).split(/[^\p{L}\p{N}]+/u).filter(t=>t&&!ignored.has(t));
   if(!terms.length){status.textContent=w[14];return;}
   const catalogue=window.SynapseCatalogue;
   const matches=catalogue.visibleApps().map(app=>{const text=catalogue.appSearchText(app),name=normalise([app.name,...Object.values(app.displayNames||{})].join(' '));return {app,score:terms.reduce((score,t)=>score+(name.includes(t)?5:text.includes(t)?1:0),0)};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
   status.textContent=matches.length?w[9]:w[10];
   for(const {app}of matches){const link=document.createElement('a');link.href=app.public?app.path:'/signin?next='+encodeURIComponent(app.id);const name=document.createElement('strong'),description=document.createElement('span'),action=document.createElement('small');name.textContent=app.name;description.textContent=app.homeDescription||app.subtitle;action.textContent=app.public?w[13]:w[12];link.append(name,description,action);results.append(link);}
  }
  function paint(){const w=words();trigger.textContent=w[0];dialog.querySelector('h2').textContent=w[0];dialog.querySelector('.ask-sushant-kicker').textContent=w[1];dialog.querySelector('.ask-sushant-close').setAttribute('aria-label',w[3]);dialog.querySelector('#ask-sushant-intro').textContent=w[2];dialog.querySelector('label').textContent=w[4];input.placeholder=w[5];dialog.querySelector('[type=submit]').textContent=w[6];dialog.querySelector('.ask-sushant-data').textContent=w[7];dialog.querySelector('.ask-sushant-privacy').textContent=w[8];if(mode)respond();}
  trigger.onclick=()=>{paint();dialog.showModal();input.focus();};dialog.querySelector('.ask-sushant-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{input.value='';question='';mode='';results.replaceChildren();status.textContent='';answer.hidden=true;if(trigger.isConnected)trigger.focus();});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}});
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();question=input.value.trim();mode='apps';respond();};dialog.querySelector('.ask-sushant-data').onclick=()=>{mode='data';respond();};
  toolbar.insertBefore(trigger,toolbar.querySelector('.home-layout-hint'));document.body.append(dialog);paint();
  window.addEventListener('synapse-language-change',paint,{signal:mountedEvents.signal});
 }
 window.SynapseHomeAgent={mount};
})();
