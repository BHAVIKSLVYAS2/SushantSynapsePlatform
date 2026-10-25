import {interfaceCopy} from './interface-copy.mjs';
// Interface preference only. Never translate inputs, editor artwork or saved business records.
(() => {
 if(window.SynapseLanguage)return;
 const key='synapse-language',valid=value=>['en','hi','gu'].includes(value),originals=new WeakMap();
 let language='en',scheduled=false,adapter=null,applied=null,syncing=false,broadcast=null;const dirty=new Set();
 let initialPreference;try{initialPreference=localStorage.getItem(key);}catch{}
 const translationRoots='body';
 const protectedContent='script,style,textarea,input,svg,canvas,[contenteditable],[data-language-control],[translate=no],[data-language-preserve],.card-artwork,.certificate-artwork,#print-document,#profile-details dd,.message-body,.confession-text,.confession-message,#review-items p,.post-body,.story-body,.article-body,.story-brief,.saved-story h2,.task-title,.item-name .custom,.quantity-badge,.idea-title,.idea-body>p,#discussion-title,#detail>.description,.comment>p,#duplicates a';
 const privatePage=/^\/(advocate|digital-samaj|batchfee-lite|tournament-lite|super-admin|admin)(\/|$)/.test(location.pathname);
 const uiOnly='button,label,legend,summary,nav,thead,dt,[data-interface-text],.platform-shell,.platform-switcher,.synapse-legal-footer,.public-home,.organisation-gate,.hero,.intro,.auth-panel,.access-heading';
 // Capture the incoming URL before native apps add their default language to it.
 const requestedLanguage=new URL(performance.getEntriesByType('navigation')[0]?.name||location.href).searchParams.get('lang');
 if(valid(initialPreference))language=initialPreference;else if(valid(requestedLanguage))language=requestedLanguage;
 const dictionary={
  'Productivity & Utility':'उत्पादकता और उपयोगिता','Games & Fun':'खेल और मनोरंजन','Finance & Planning':'वित्त और योजना','Editorial & Media':'संपादकीय और मीडिया','Restricted Workspaces':'प्रतिबंधित कार्यक्षेत्र','LET CHANCE CHOOSE':'किस्मत को चुनने दें','Can’t decide?':'तय नहीं कर पा रहे?','Add your options and spin the wheel.':'अपने विकल्प जोड़ें और पहिया घुमाएँ।','Spin now':'पहिया घुमाएँ','tools':'टूल',
  'Your apps, together.':'आपके ऐप, एक साथ।','Open a public tool or sign in to your workspace.':'सार्वजनिक टूल खोलें या अपने कार्यक्षेत्र में साइन इन करें।','Account':'खाता','Switch app':'ऐप बदलें','Find an app':'ऐप खोजें','Public tool':'सार्वजनिक टूल','Private workspace':'निजी कार्यक्षेत्र',

  'PLATFORM':'प्लेटफ़ॉर्म','All apps':'सभी ऐप','All apps ↗':'सभी ऐप ↗','Sign in':'साइन इन','Support us':'सहयोग करें','Watch demos':'डेमो देखें','Contact':'संपर्क','WhatsApp':'WhatsApp','WhatsApp ↗':'WhatsApp ↗','Privacy':'गोपनीयता','Usage terms':'उपयोग की शर्तें','Third-party notices':'तृतीय-पक्ष सूचनाएँ','Ritual guides ↗':'अनुष्ठान मार्गदर्शिकाएँ ↗',
  'A little clarity.':'थोड़ी स्पष्टता।','Every day.':'हर दिन।','SUSHANT SYNAPSE / APPS':'SUSHANT SYNAPSE / ऐप','Plan a week, compare funds or make someone’s day.':'सप्ताह की योजना बनाएँ, फ़ंड तुलना करें या किसी का दिन खास बनाएँ।','Choose a public tool or sign in to your workspace.':'सार्वजनिक टूल चुनें या अपने कार्यक्षेत्र में साइन इन करें।','Explore free apps':'मुफ़्त ऐप देखें','Apps requiring sign-in':'साइन इन वाले ऐप','OPEN TO EVERYONE':'सभी के लिए','Free to try. No sign-in.':'मुफ़्त इस्तेमाल करें। साइन इन नहीं।','Open any of these nine collections and tools and get started without an account.':'इन नौ संग्रहों और टूल में से कोई भी खोलें; खाते की जरूरत नहीं।','No sign-in required':'साइन इन की जरूरत नहीं','Free · No sign-in required':'मुफ़्त · साइन इन की जरूरत नहीं',
  'Prepare with clarity.':'स्पष्ट तैयारी।','Observe with care.':'श्रद्धा से पालन।','RITUALS / FAMILY PREPARATION':'अनुष्ठान / पारिवारिक तैयारी','Hindu ceremony guides, practical puja materials and thoughtful preparation for Shubh and Ashubh occasions.':'शुभ और अशुभ अवसरों के लिए हिन्दू अनुष्ठान मार्गदर्शिकाएँ, पूजा सामग्री और तैयारी।','Steps & materials':'चरण और सामग्री','English & Hindi':'अंग्रेज़ी और हिन्दी','Open Ritual Assist ↗':'Ritual Assist खोलें ↗',
  'YOUR PRIVATE WORKSPACE':'आपका निजी कार्यक्षेत्र','Sign in to work.':'काम के लिए साइन इन करें।','Use an existing platform account. App access is managed by your platform owner.':'अपने मौजूदा प्लैटफ़ॉर्म खाते से साइन इन करें। ऐप की अनुमति प्लैटफ़ॉर्म मालिक देते हैं।','Sign-in + Samaj role':'साइन इन + समाज की भूमिका','Sign-in + app access':'साइन इन + ऐप की अनुमति','Owner account only':'केवल मालिक का खाता','Register families, connect generations and communicate with verified community members.':'परिवार दर्ज करें, पीढ़ियाँ जोड़ें और सत्यापित समाज सदस्यों से संवाद करें।','Cases, clients, hearings and fees in your chambers workspace.':'अपने चैंबर में मामले, मुवक्किल, सुनवाई और फीस संभालें।','Create fixtures, record scores and manage tournaments with assigned app access.':'ऐप अनुमति के साथ मैच बनाएँ, स्कोर दर्ज करें और प्रतियोगिताएँ संभालें।','Viewing results? Open the organizer’s shared results link. No account needed.':'परिणाम देखना है? आयोजक का साझा परिणाम लिंक खोलें। खाते की जरूरत नहीं।','Manage academy students, fees and receipts in a private workspace for the platform owner.':'मालिक के निजी कार्यक्षेत्र में अकादमी के विद्यार्थी, फीस और रसीदें संभालें।','Sign in to DIGITAL SAMAJ →':'DIGITAL SAMAJ में साइन इन करें →','Sign in to Chambers →':'Chambers में साइन इन करें →','Sign in to Tournament Lite →':'Tournament Lite में साइन इन करें →','Sign in to BatchFee Lite →':'BatchFee Lite में साइन इन करें →',
  'Search apps':'ऐप खोजें','Search apps or activities':'ऐप या गतिविधियाँ खोजें','Close':'बंद करें',
  'Make it':'इसे बनाएँ','meaningful.':'अर्थपूर्ण।','Make it meaningful.':'इसे अर्थपूर्ण बनाएँ।','Create your moment ↗':'अपना खास पल बनाएँ ↗','Cards & awards':'कार्ड और सम्मान','Condolence wording':'संवेदना के शब्द','One home for appreciation certificates, greetings, invitations and thoughtful condolences in English or Hindi.':'अंग्रेज़ी या हिन्दी में प्रशंसा प्रमाणपत्र, शुभकामनाएँ, निमंत्रण और संवेदना कार्ड एक जगह।','EDUCATION / WEEKLY PLANNING':'शिक्षा / साप्ताहिक समय-सारणी','A well-planned':'सुव्यवस्थित','week starts here.':'सप्ताह की शुरुआत यहाँ।','Create conflict-free weekly timetables for your school or coaching institute. Simple, private and ready to print.':'स्कूल या कोचिंग के लिए बिना टकराव की साप्ताहिक समय-सारणी बनाएँ। सरल, निजी और प्रिंट के लिए तैयार।','Automatic scheduling':'अपने आप समय-सारणी','PDF & image':'PDF और चित्र','Plan your week ↗':'सप्ताह की योजना बनाएँ ↗',
  'Different funds.':'अलग फ़ंड।','How different?':'कितने अलग?','Uncover shared holdings, compare industries and see what each fund adds to the mix.':'साझा निवेश देखें, उद्योगों की तुलना करें और समझें कि हर फ़ंड क्या जोड़ता है।','Holdings overlap':'साझा निवेश','What-if comparisons':'संभावित तुलना','Open Fund Lens':'Fund Lens खोलें','The day’s stories.':'दिन की खबरें।',"The day's stories.":'दिन की खबरें।','A moment to read.':'पढ़ने के लिए कुछ पल।','News and fictional satire by Aakanksha. Prepare the daily newspaper once, then share the same edition with everyone.':'Aakanksha की खबरें और काल्पनिक व्यंग्य। दैनिक संस्करण एक बार तैयार करें और सभी के साथ साझा करें।','Daily newspaper':'दैनिक समाचारपत्र','Saved editions':'सहेजे गए संस्करण','Open News':'समाचार खोलें','Prepare with clarity. Observe with care.':'स्पष्ट तैयारी। श्रद्धा से पालन।',
  'Seven ways to reset.':'फिर ताज़ा होने के सात तरीके।','Take a little break.':'थोड़ा विराम लें।','Play, choose or unwind.':'खेलें, चुनें या आराम करें।','Daily & practice games':'दैनिक और अभ्यास खेल','Challenge a friend':'दोस्त को चुनौती दें','Open Take a Break ↗':'Take a Break खोलें ↗','Balanced teams':'संतुलित टीमें','PNG & team list':'PNG और टीम सूची','Mix your teams ↗':'अपनी टीमें बनाएँ ↗','Spin the wheel ↗':'पहिया घुमाएँ ↗','Equal chances':'बराबर संभावना','Remove winners':'विजेताओं को हटाएँ'
 };
 const nativePage=/^\/(ritual-assist(?:\/|$)|digital-samaj(?:\/|$))/.test(location.pathname);
 Object.assign(dictionary,{"Useful tools for everyday tasks.":"रोज़मर्रा के कामों के लिए उपयोगी टूल।","Can you make 24?":"क्या आप 24 बना सकते हैं?","Choose a tool to get started.":"शुरू करने के लिए कोई टूल चुनें।","Sponsor a tool.":"किसी टूल को प्रायोजित करें।","Reach people using our free tools.":"हमारे मुफ़्त टूल इस्तेमाल करने वाले लोगों तक पहुँचें।","Create a certificate.":"प्रमाणपत्र बनाएँ।","Preview":"पूर्वावलोकन","Enter names to create random teams.":"यादृच्छिक टीमें बनाने के लिए नाम लिखें।","Teams":"टीमें","Your teams will appear here.":"आपकी टीमें यहाँ दिखाई देंगी।","Mix teams":"टीमें बनाएँ","Add your options and spin to choose one.":"विकल्प जोड़ें और एक चुनने के लिए पहिया घुमाएँ।","How picks work":"चुनाव कैसे होता है","No spins yet.":"अभी कोई चुनाव नहीं हुआ।","Help keep the tools free.":"टूल मुफ़्त रखने में मदद करें।","Choose an amount":"राशि चुनें","Share a tool":"कोई टूल साझा करें","Explore sponsorship options.":"प्रायोजन के विकल्प देखें।","Today's tasks":"आज के काम","Add a task":"काम जोड़ें","Saved edition opened.":"सहेजा गया अंक खुल गया।","Share a confession and scratch to read others.":"कोई बात साझा करें और दूसरों की बातें पढ़ने के लिए स्क्रैच करें।","Create QR codes for links, text or Wi-Fi.":"लिंक, टेक्स्ट या वाई-फ़ाई के QR कोड बनाएँ।","Resize a photo to a target file size.":"फ़ोटो को तय फ़ाइल साइज़ में बदलें।","Split bills and work out who owes whom.":"बिल बाँटें और देखें किसे कितना देना है।","Make certificates, greetings, invitations and remembrance cards.":"प्रमाणपत्र, शुभकामना, निमंत्रण और स्मृति कार्ड बनाएँ।","Play puzzles, memory games and One-Minute Chaos.":"पहेलियाँ, मेमोरी गेम और One-Minute Chaos खेलें।","Read sourced news and fictional satire by Aakanksha.":"आकांक्षा की स्रोत सहित खबरें और काल्पनिक व्यंग्य पढ़ें।","Create and print a weekly timetable.":"साप्ताहिक समय-सारणी बनाएँ और प्रिंट करें।","Prepare ritual checklists in English or Hindi.":"हिन्दी या अंग्रेज़ी में अनुष्ठान की सूची तैयार करें।","Split names into random teams.":"नामों से यादृच्छिक टीमें बनाएँ।","Plan tasks and use a focus timer.":"कामों की योजना बनाएँ और फ़ोकस टाइमर चलाएँ।","Compare the holdings shared by your mutual funds.":"अपने म्यूचुअल फ़ंड की साझा होल्डिंग की तुलना करें।","React to 13 fictional characters and see daily scores.":"13 काल्पनिक पात्रों पर प्रतिक्रिया दें और दैनिक स्कोर देखें।"});
 Object.assign(dictionary,{'Small tools.':'छोटे टूल।','Better everyday.':'बेहतर हर दिन।','A LITTLE MORE POSSIBLE':'हर दिन कुछ बेहतर','Create something thoughtful, clear a task, or take a little break.':'कुछ खास बनाएँ, कोई काम पूरा करें या थोड़ा विराम लें।','TRY SOMETHING TODAY':'आज कुछ आज़माएँ','Four numbers. One little challenge.':'चार अंक। एक छोटी चुनौती।','Use every number once to make 24. A fresh puzzle daily, no sign-in.':'हर अंक एक बार इस्तेमाल करके 24 बनाएँ। रोज़ नई पहेली, बिना साइन इन।','Play now':'अभी खेलें'});
 Object.assign(dictionary,{'ALL YOUR APPS IN ONE PLACE':'आपके सभी ऐप एक जगह','Everything you need,':'आपकी हर ज़रूरत,','one place.':'एक ही जगह।','Free web apps to explore, or sign in to your personal workspace.':'मुफ़्त वेब ऐप इस्तेमाल करें, या अपने निजी कार्यक्षेत्र में साइन इन करें।','ϟ Instant access':'ϟ तुरंत इस्तेमाल','♡ Free to use':'♡ मुफ़्त इस्तेमाल','✓ No sign-up':'✓ खाते की ज़रूरत नहीं','Explore Apps':'ऐप देखें','Open and use instantly':'तुरंत खोलें और इस्तेमाल करें','Browse Apps':'ऐप चुनें','My Workspace':'मेरा कार्यक्षेत्र','Your personal space':'आपका निजी स्थान','Explore apps':'वेब ऐप देखें','✦ Featured app':'✦ चुनिंदा ऐप','Open app':'ऐप खोलें','A LITTLE HUMAN CONNECTION':'कुछ बातें, कुछ अपनापन','Share anonymously and scratch to discover what others think.':'बिना नाम अपनी बात साझा करें और दूसरों की बातें पढ़ने के लिए स्क्रैच करें।','Open App':'ऐप खोलें','Apps':'ऐप','Games':'खेल','Workspace':'कार्यक्षेत्र','No apps match your search. Try another word or category.':'कोई ऐप नहीं मिला। दूसरा शब्द या श्रेणी आज़माएँ।'});
 Object.assign(dictionary,{'YOUR DAILY CELESTIAL PAUSE':'दिन का एक शांत विराम','Rashifal':'राशिफल','Kundli':'कुंडली','A moment to reflect. A chart to explore.':'मनन के कुछ पल। कुंडली की एक झलक।','Discover today’s lunar calendar in IST':'आज का चंद्र पंचांग भारतीय समय में देखें','Vikram Samvat':'विक्रम संवत','Lunar month · Amanta':'चंद्र मास · अमान्त','Tithi now':'अभी की तिथि','Read your Rashifal':'अपना राशिफल पढ़ें','Explore Kundli':'कुंडली देखें','Calculated preview · Chaitra-year Vikram · IST. Regional calendars differ; not a sunrise or festival Panchang.':'गणना पूर्वावलोकन · चैत्र से विक्रम वर्ष · IST। क्षेत्रीय पंचांग अलग हैं; यह सूर्योदय या त्योहार का पंचांग नहीं है।','Open Rashifal or Kundli to explore. JavaScript is needed for the current calendar.':'राशिफल या कुंडली खोलें। वर्तमान पंचांग के लिए JavaScript आवश्यक है।'});
 const native=()=>adapter?document.querySelector(adapter.controls):nativePage?document.querySelector('#language'):null;
 function syncApp(){
  if(!adapter||syncing)return;syncing=true;
  try{const effective=adapter.languages.includes(language)?language:'en';
   if(applied!==effective){applied=effective;adapter.apply(effective);}
   for(const input of document.querySelectorAll(adapter.controls)){const wrapper=input.closest('label')||input;wrapper.hidden=true;wrapper.dataset.interfaceLanguageSource='';if(input.value!==effective){input.value=effective;input.dispatchEvent(new Event('change',{bubbles:true}));}}
  }finally{syncing=false;}
 }
 const reverse=new Map();for(const [source,value]of Object.entries(dictionary))reverse.set(value,source);
 for(const [source,values]of Object.entries(interfaceCopy))for(const value of values)if(value)reverse.set(value,source);
 function localize(value,locale=language){const source=reverse.get(value)||value;return locale==='en'?source:interfaceCopy[source]?.[locale==='hi'?0:1]||(locale==='hi'?dictionary[source]:null)||source;}
 function remember(value){language=value;try{localStorage.setItem(key,value);}catch{}}
 // Only catalogue UI uses brand-script projection. Saved records and app content remain untouched.
 function homeCopy(value,node,attribute=false){
  if(!node.closest('.public-home'))return localize(value);
  for(const app of window.SynapseCatalogue?.apps||[]){
   const names=app.displayNames;if(!names)continue;
   for(const name of new Set(Object.values(names)))if(value===name||attribute&&value.includes(name))return value.replace(name,names[language]||app.name);
  }
  return localize(value);
 }
 function translate(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const text=walker.currentNode,parent=text.parentElement;
   if(!parent||parent.closest(protectedContent)||parent.closest('select')&&!parent.matches('option'))continue;
   if(parent.matches('option')&&!parent.closest('#kind,#security,#entry-mode,#mode,#item-filter,#priority,#language,[data-interface-options]'))continue;
   if(adapter&&parent.closest('main')&&!parent.closest('.vedic-app-header'))continue;
   if(privatePage&&!parent.closest(uiOnly))continue;
   if(parent.closest('td,dd')&&!parent.closest('button,label,[data-interface-text]'))continue;
   let record=originals.get(text);if(!record||text.data!==record.last){record={source:text.data,last:text.data};originals.set(text,record);}
   const value=record.source.trim().replace(/\s+/g,' '),translated=homeCopy(value,parent);
   const next=translated?record.source.replace(record.source.trim(),translated):record.source;
   if(text.data!==next)text.data=next;record.last=next;
   if(/[A-Za-z\u0900-\u097f\u0a80-\u0aff]/.test(next)){const nextLanguage=/[\u0a80-\u0aff]/.test(next)?'gu':/[\u0900-\u097f]/.test(next)?'hi':'en';if(parent.lang!==nextLanguage)parent.lang=nextLanguage;}
  }
  for(const node of root.querySelectorAll('[placeholder],[aria-label],[title]')){
   if(node.closest('script,style,svg,canvas,[contenteditable],[data-language-control],[translate=no],[data-language-preserve]')||adapter&&node.closest('main')||privatePage&&!node.closest(uiOnly))continue;
   for(const attr of ['placeholder','aria-label','title'])if(node.hasAttribute(attr)){const source=node.getAttribute(attr);const next=homeCopy(source,node,true);if(source!==next)node.setAttribute(attr,next);}
  }
 }
 function mountControl(){
  let control=document.querySelector('.platform-language [data-language-control]')||document.querySelector('.synapse-legal-footer [data-language-control]')||document.querySelector('[data-language-control]');const actions=document.querySelector('.platform-shell-actions');
  if(!actions)return;
  if(!control){control=document.createElement('div');control.className='synapse-language';control.dataset.languageControl='';control.setAttribute('role','group');control.setAttribute('aria-label','Interface language / भाषा');control.innerHTML='<span>Language / भाषा</span><button type="button" lang="en" data-interface-language="en" aria-label="English">EN</button><button type="button" lang="hi" data-interface-language="hi">हिन्दी</button><small data-language-help hidden></small>';}
  let menu=document.querySelector('.platform-language');
  if(!menu){menu=document.createElement('details');menu.className='platform-language';const summary=document.createElement('summary');summary.setAttribute('aria-label','Interface language / \u092d\u093e\u0937\u093e');menu.append(summary);actions.prepend(menu);}
  if(control.parentElement!==menu)menu.append(control);
  for(const duplicate of document.querySelectorAll('[data-language-control]'))if(duplicate!==control){duplicate.removeAttribute('data-language-control');duplicate.querySelectorAll('[data-interface-language]').forEach(button=>button.remove());duplicate.hidden=true;duplicate.dataset.interfaceLanguageSource='';}
  if(!control.querySelector('[data-interface-language=gu]')){const button=document.createElement('button');button.type='button';button.lang='gu';button.dataset.interfaceLanguage='gu';button.textContent='ગુજરાતી';(control.querySelector('.synapse-language-toggle')||control).append(button);}
  const label=({en:'EN',hi:'हिन्दी',gu:'ગુજરાતી'})[language];if(menu.firstElementChild.textContent!==label)menu.firstElementChild.textContent=label;
  const select=native();if(select){const wrapper=select.closest('label')||select;wrapper.hidden=true;wrapper.dataset.interfaceLanguageSource="";}
 }
 function refresh(roots){
  syncApp();
  mountControl();
  document.documentElement.dataset.language=language;
  for(const root of roots||document.querySelectorAll(translationRoots))if(root.isConnected)translate(root);
  document.documentElement.lang=language;
  const url=new URL(location.href);if(url.searchParams.has('lang')&&url.searchParams.get('lang')!==language){url.searchParams.set('lang',language);history.replaceState(history.state,'',url);}
  if(broadcast!==language){broadcast=language;window.dispatchEvent(new CustomEvent('synapse-language-change',{detail:{language}}));}
  const busy=!!native()?.disabled;
  for(const footer of document.querySelectorAll('[data-language-control]')){
   footer.hidden=false;footer.lang=language;
   if(footer.classList.contains('synapse-language')&&!footer.querySelector('.synapse-language-toggle')){
    const toggle=document.createElement('span');toggle.className='synapse-language-toggle';
    const buttons=[...footer.querySelectorAll('[data-interface-language]')];
    buttons[0]?.before(toggle);for(const button of buttons){if(button.dataset.interfaceLanguage==='en'){button.textContent='EN';button.setAttribute('aria-label','English');}toggle.append(button);}
   }
   for(const button of footer.querySelectorAll('[data-interface-language]')){const active=button.dataset.interfaceLanguage===language;button.setAttribute('aria-pressed',String(active));if(button.disabled!==busy)button.disabled=busy;}
   const help=footer.querySelector('[data-language-help]');if(help)help.hidden=true;
  }
 }
 function choose(value,bridge=true){
  if(!valid(value))return;const control=native();if(bridge&&control?.disabled)return;
  remember(value);if(!adapter&&bridge&&control){const effective=[...control.options].some(o=>o.value===value)?value:'en';if(control.value!==effective){syncing=true;try{control.value=effective;control.dispatchEvent(new Event('change',{bubbles:true}));}finally{syncing=false;}}}refresh();
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-interface-language]');if(button&&!button.disabled){choose(button.dataset.interfaceLanguage);button.closest('.platform-language')?.removeAttribute('open');}else if(!event.target.closest('.platform-language'))document.querySelector('.platform-language')?.removeAttribute('open');});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.querySelector('.platform-language[open]');if(menu){menu.removeAttribute('open');menu.querySelector('summary').focus();}}});
 document.addEventListener('change',event=>{if(!syncing&&(event.target===native()||adapter&&event.target.matches(adapter.controls)))choose(event.target.value,false);});
 window.SynapseLanguage={get:()=>language,set:choose,text:localize,register(config){
  if(!config||typeof config.apply!=='function'||typeof config.controls!=='string'||!Array.isArray(config.languages)||!config.languages.includes('en')||config.languages.some(value=>!valid(value)))throw new TypeError('Check language adapter.');
  adapter=config;applied=null;let saved;try{saved=localStorage.getItem(key);if(!valid(initialPreference))for(const legacy of config.legacyKeys||[]){const value=localStorage.getItem(legacy);if(valid(value)){saved=value;break;}}}catch{}
  choose(valid(saved)?saved:valid(requestedLanguage)?requestedLanguage:language);
  try{if(localStorage.getItem(key)===language)for(const legacy of config.legacyKeys||[])localStorage.removeItem(legacy);}catch{}
  return ()=>{adapter=null;applied=null;};
 }};
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){const value=valid(event.newValue)?event.newValue:'en';language=value;refresh();}});
 window.addEventListener('pageshow',()=>{try{const saved=localStorage.getItem(key);if(valid(saved)&&saved!==language){language=saved;refresh();}}catch{}});
 function start(){
  let saved;try{saved=localStorage.getItem(key);}catch{}
  const initial=valid(saved)?saved:valid(requestedLanguage)?requestedLanguage:native()?.value||language;choose(initial);
  const observe=records=>{
   let controls=false;
   for(const record of records){
    const target=record.target.nodeType===1?record.target:record.target.parentElement;
    if(record.type==='attributes'){if(record.target===native())controls=true;continue;}
    if(target?.closest(translationRoots)&&!target.closest('[data-language-control]'))dirty.add(target);
    for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches(translationRoots))dirty.add(node);for(const root of node.querySelectorAll(translationRoots))dirty.add(root);const selectors='[data-language-control],#language'+(adapter?','+adapter.controls:'');if(node.matches(selectors)||node.querySelector(selectors))controls=true;}
   }
   if((controls||dirty.size)&&!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;const roots=[...dirty].filter(node=>![...dirty].some(parent=>parent!==node&&parent.contains(node)));dirty.clear();refresh(roots);});}
  };
  if(window.SynapseUI)window.SynapseUI.observe(observe);else new MutationObserver(observe).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
