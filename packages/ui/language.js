// Interface preference only. Never translate inputs, editor artwork or saved business records.
(() => {
 const key='synapse-language',valid=value=>['en','hi'].includes(value),originals=new WeakMap();
 let language='en',scheduled=false;
 const dictionary={
  'PLATFORM':'प्लेटफ़ॉर्म','All apps':'सभी ऐप','All apps ↗':'सभी ऐप ↗','Sign in':'साइन इन','Support us':'सहयोग करें','Watch demos':'डेमो देखें','Contact':'संपर्क','WhatsApp':'WhatsApp','WhatsApp ↗':'WhatsApp ↗','Privacy':'गोपनीयता','Usage terms':'उपयोग की शर्तें','Third-party notices':'तृतीय-पक्ष सूचनाएँ','Sponsorship':'प्रायोजन','Ritual guides ↗':'अनुष्ठान मार्गदर्शिकाएँ ↗',
  'A little clarity.':'थोड़ी स्पष्टता।','Every day.':'हर दिन।','SUSHANT SYNAPSE / APPS':'SUSHANT SYNAPSE / ऐप','Plan a week, compare funds or make someone’s day.':'सप्ताह की योजना बनाएँ, फ़ंड तुलना करें या किसी का दिन खास बनाएँ।','Choose a public tool or sign in to your workspace.':'सार्वजनिक टूल चुनें या अपने कार्यक्षेत्र में साइन इन करें।','Explore free apps':'मुफ़्त ऐप देखें','Apps requiring sign-in':'साइन इन वाले ऐप','OPEN TO EVERYONE':'सभी के लिए','Free to try. No sign-in.':'मुफ़्त इस्तेमाल करें। साइन इन नहीं।','Open any of these eight collections and tools and get started without an account.':'इन आठ संग्रहों और टूल में से कोई भी खोलें; खाते की जरूरत नहीं।','No sign-in required':'साइन इन की जरूरत नहीं','Free · No sign-in required':'मुफ़्त · साइन इन की जरूरत नहीं',
  'Prepare with clarity.':'स्पष्ट तैयारी।','Observe with care.':'श्रद्धा से पालन।','RITUALS / FAMILY PREPARATION':'अनुष्ठान / पारिवारिक तैयारी','Hindu ceremony guides, practical puja materials and thoughtful preparation for Shubh and Ashubh occasions.':'शुभ और अशुभ अवसरों के लिए हिन्दू अनुष्ठान मार्गदर्शिकाएँ, पूजा सामग्री और तैयारी।','Steps & materials':'चरण और सामग्री','English & Hindi':'अंग्रेज़ी और हिन्दी','Open Ritual Assist ↗':'Ritual Assist खोलें ↗',
  'YOUR PRIVATE WORKSPACE':'आपका निजी कार्यक्षेत्र','Sign in to work.':'काम के लिए साइन इन करें।','Use an existing platform account. App access is managed by your platform owner.':'अपने मौजूदा प्लैटफ़ॉर्म खाते से साइन इन करें। ऐप की अनुमति प्लैटफ़ॉर्म मालिक देते हैं।','Sign-in + Samaj role':'साइन इन + समाज की भूमिका','Sign-in + app access':'साइन इन + ऐप की अनुमति','Owner account only':'केवल मालिक का खाता','Register families, connect generations and communicate with verified community members.':'परिवार दर्ज करें, पीढ़ियाँ जोड़ें और सत्यापित समाज सदस्यों से संवाद करें।','Cases, clients, hearings and fees in your chambers workspace.':'अपने चैंबर में मामले, मुवक्किल, सुनवाई और फीस संभालें।','Create fixtures, record scores and manage tournaments with assigned app access.':'ऐप अनुमति के साथ मैच बनाएँ, स्कोर दर्ज करें और प्रतियोगिताएँ संभालें।','Viewing results? Open the organizer’s shared results link. No account needed.':'परिणाम देखना है? आयोजक का साझा परिणाम लिंक खोलें। खाते की जरूरत नहीं।','Manage academy students, fees and receipts in a private workspace for the platform owner.':'मालिक के निजी कार्यक्षेत्र में अकादमी के विद्यार्थी, फीस और रसीदें संभालें।','Sign in to DIGITAL SAMAJ →':'DIGITAL SAMAJ में साइन इन करें →','Sign in to Chambers →':'Chambers में साइन इन करें →','Sign in to Tournament Lite →':'Tournament Lite में साइन इन करें →','Sign in to BatchFee Lite →':'BatchFee Lite में साइन इन करें →',
  'Sponsorship opportunity':'प्रायोजन का अवसर','A little space for a thoughtful brand.':'एक विचारशील ब्रांड के लिए थोड़ी जगह।','Introduce your business through one quiet, clearly labelled placement.':'एक साफ़-साफ़ चिह्नित स्थान से अपने व्यवसाय का परिचय दें।','Explore sponsorship':'प्रायोजन देखें','Search apps':'ऐप खोजें','Search apps or activities':'ऐप या गतिविधियाँ खोजें','Close':'बंद करें',
  'Make it':'इसे बनाएँ','meaningful.':'अर्थपूर्ण।','Make it meaningful.':'इसे अर्थपूर्ण बनाएँ।','Create your moment ↗':'अपना खास पल बनाएँ ↗','Cards & awards':'कार्ड और सम्मान','Condolence wording':'संवेदना के शब्द','One home for appreciation certificates, greetings, invitations and thoughtful condolences in English or Hindi.':'अंग्रेज़ी या हिन्दी में प्रशंसा प्रमाणपत्र, शुभकामनाएँ, निमंत्रण और संवेदना कार्ड एक जगह।','EDUCATION / WEEKLY PLANNING':'शिक्षा / साप्ताहिक समय-सारणी','A well-planned':'सुव्यवस्थित','week starts here.':'सप्ताह की शुरुआत यहाँ।','Create conflict-free weekly timetables for your school or coaching institute. Simple, private and ready to print.':'स्कूल या कोचिंग के लिए बिना टकराव की साप्ताहिक समय-सारणी बनाएँ। सरल, निजी और प्रिंट के लिए तैयार।','Automatic scheduling':'अपने आप समय-सारणी','PDF & image':'PDF और चित्र','Plan your week ↗':'सप्ताह की योजना बनाएँ ↗',
  'Different funds.':'अलग फ़ंड।','How different?':'कितने अलग?','Uncover shared holdings, compare industries and see what each fund adds to the mix.':'साझा निवेश देखें, उद्योगों की तुलना करें और समझें कि हर फ़ंड क्या जोड़ता है।','Holdings overlap':'साझा निवेश','What-if comparisons':'संभावित तुलना','Open Fund Lens':'Fund Lens खोलें','The day’s stories.':'दिन की खबरें।',"The day's stories.":'दिन की खबरें।','A moment to read.':'पढ़ने के लिए कुछ पल।','News and fictional satire by Aakanksha. Prepare the daily newspaper once, then share the same edition with everyone.':'Aakanksha की खबरें और काल्पनिक व्यंग्य। दैनिक संस्करण एक बार तैयार करें और सभी के साथ साझा करें।','Daily newspaper':'दैनिक समाचारपत्र','Saved editions':'सहेजे गए संस्करण','Open News':'समाचार खोलें','Prepare with clarity. Observe with care.':'स्पष्ट तैयारी। श्रद्धा से पालन।',
  'Seven ways to reset.':'फिर ताज़ा होने के सात तरीके।','Take a little break.':'थोड़ा विराम लें।','Play, choose or unwind.':'खेलें, चुनें या आराम करें।','Daily & practice games':'दैनिक और अभ्यास खेल','Challenge a friend':'दोस्त को चुनौती दें','Open Take a Break ↗':'Take a Break खोलें ↗','Balanced teams':'संतुलित टीमें','PNG & team list':'PNG और टीम सूची','Mix your teams ↗':'अपनी टीमें बनाएँ ↗','Spin the wheel ↗':'पहिया घुमाएँ ↗','Equal chances':'बराबर संभावना','Remove winners':'विजेताओं को हटाएँ'
 };
 const nativePage=/^\/(ritual-assist(?:\/|$)|digital-samaj(?:\/|$))/.test(location.pathname);
 const native=()=>nativePage?document.querySelector('#language'):null;
 function remember(value){language=value;try{localStorage.setItem(key,value);}catch{}}
 function translate(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const text=walker.currentNode,parent=text.parentElement;
   if(!parent||parent.closest('script,style,textarea,input,select,svg,[contenteditable],[data-language-control]'))continue;
   let record=originals.get(text);if(!record||text.data!==record.last){record={source:text.data,last:text.data};originals.set(text,record);}
   const value=record.source.trim().replace(/\s+/g,' '),translated=language==='hi'?dictionary[value]:null;
   const next=translated?record.source.replace(record.source.trim(),translated):record.source;
   if(text.data!==next)text.data=next;record.last=next;
   if(/[A-Za-z\u0900-\u097f]/.test(next))parent.lang=translated||/[\u0900-\u097f]/.test(next)?'hi':'en';
  }
  root.lang=language;
 }
 function refresh(){
  document.documentElement.dataset.language=language;
  for(const root of document.querySelectorAll('.synapse-header,.synapse-help-nav,.synapse-legal-footer,.public-home'))translate(root);
  if(document.querySelector('.public-home'))document.documentElement.lang=language;
  const busy=!!native()?.disabled;
  for(const footer of document.querySelectorAll('[data-language-control]')){
   footer.hidden=false;footer.lang=language;
   for(const button of footer.querySelectorAll('[data-interface-language]')){const active=button.dataset.interfaceLanguage===language;button.setAttribute('aria-pressed',String(active));if(button.disabled!==busy)button.disabled=busy;}
   const help=footer.querySelector('[data-language-help]');if(help){help.hidden=nativePage||language==='en';help.textContent='कुछ ऐप की सामग्री अभी अंग्रेज़ी में है।';}
  }
 }
 function choose(value,bridge=true){
  if(!valid(value))return;const control=native();if(bridge&&control?.disabled)return;
  remember(value);if(bridge&&control&&control.value!==value){control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));}refresh();
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-interface-language]');if(button&&!button.disabled)choose(button.dataset.interfaceLanguage);});
 document.addEventListener('change',event=>{if(event.target===native())choose(event.target.value,false);});
 function start(){
  let saved;try{saved=localStorage.getItem(key);}catch{}
  const explicit=new URLSearchParams(location.search).get('lang'),initial=valid(explicit)?explicit:valid(saved)?saved:native()?.value||'en';choose(initial);
  new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh();});}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
