export const pageLabels={
 en:{title:'Rashifal & Kundli · verification preview',warning:'Experimental calculations and draft traditional interpretations. Independent source, sunrise, rulebook and translation reviews are unfinished. Do not rely on this preview for important decisions or certified ritual dates.',privacy:'Birth details and results stay in this tab. No birth account, server submission, analytics or ads. Shared-device and browser-extension privacy still depends on your device.',home:'Platform home',birth:'Kundli',rashifal:'Rashifal',timeMachine:'Time Machine',matching:'Matching',nav:'Vedic preview',language:'Language',theme:'Theme',system:'System',light:'Light',dark:'Dark',validation:'Please check this field and enter a supported value.'},
 hi:{title:'राशिफल और कुंडली · सत्यापन पूर्वावलोकन',warning:'प्रयोगात्मक गणनाएँ और पारंपरिक व्याख्याओं का मसौदा। स्रोत, सूर्योदय, नियमावली और अनुवाद की स्वतंत्र समीक्षा अधूरी है। महत्वपूर्ण निर्णय या प्रमाणित धार्मिक तिथियों के लिए इस पूर्वावलोकन पर निर्भर न रहें।',privacy:'जन्म विवरण और परिणाम केवल इस टैब में रहते हैं। जन्म खाते, सर्वर पर विवरण भेजने, विश्लेषण या विज्ञापन की सुविधा नहीं है। साझा उपकरण और ब्राउज़र एक्सटेंशन की गोपनीयता आपके उपकरण पर निर्भर है।',home:'प्लेटफ़ॉर्म मुखपृष्ठ',birth:'कुंडली',rashifal:'राशिफल',timeMachine:'टाइम मशीन',matching:'कुंडली मिलान',nav:'वैदिक पूर्वावलोकन',language:'भाषा',theme:'रंग रूप',system:'उपकरण के अनुसार',light:'हल्का',dark:'गहरा',validation:'कृपया यह फ़ील्ड जाँचें और समर्थित मान भरें।'},
 gu:{title:'રાશિફળ અને કુંડળી · ચકાસણી પૂર્વાવલોકન',warning:'પ્રયોગાત્મક ગણતરીઓ અને પરંપરાગત અર્થઘટનોનો મુસદ્દો. સ્રોત, સૂર્યોદય, નિયમાવલી અને અનુવાદની સ્વતંત્ર સમીક્ષા અધૂરી છે. મહત્વના નિર્ણયો કે પ્રમાણિત ધાર્મિક તારીખો માટે આ પૂર્વાવલોકન પર આધાર ન રાખો.',privacy:'જન્મ વિગતો અને પરિણામો ફક્ત આ ટૅબમાં રહે છે. જન્મ ખાતું, સર્વર પર વિગતો મોકલવી, વિશ્લેષણ કે જાહેરાતો નથી. સહિયારા ઉપકરણ અને બ્રાઉઝર એક્સટેન્શનની ગોપનીયતા તમારા ઉપકરણ પર આધારિત છે.',home:'પ્લેટફૉર્મ મુખપૃષ્ઠ',birth:'કુંડળી',rashifal:'રાશિફળ',timeMachine:'ટાઇમ મશીન',matching:'કુંડળી મિલાન',nav:'વૈદિક પૂર્વાવલોકન',language:'ભાષા',theme:'રંગરૂપ',system:'ઉપકરણ મુજબ',light:'આછું',dark:'ઘેરું',validation:'કૃપા કરીને આ ક્ષેત્ર તપાસો અને સમર્થિત મૂલ્ય ભરો.'}
};
for(const [language,text]of Object.entries({en:'Preview · review pending',hi:'पूर्वावलोकन · समीक्षा लंबित',gu:'પૂર્વાવલોકન · સમીક્ષા બાકી'}))pageLabels[language].previewDetails=text;
export const languagePreferenceKey='synapse-language';
export function initLanguageShell(){
 const select=document.querySelector('#vedic-language');if(!select)return;
 document.body.dataset.sharedLanguage='true';
 const actions=document.querySelector('.platform-shell-actions');
 if(actions){
  const menu=document.createElement('details');menu.className='platform-language';
  const summary=document.createElement('summary');summary.setAttribute('aria-label','Interface language / भाषा');
  const panel=document.createElement('div');panel.className='synapse-language';
  const source=document.querySelector('#vedic-language-source');while(source.firstChild)panel.append(source.firstChild);
  menu.append(summary,panel);actions.prepend(menu);source.remove();
  document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;summary.focus();}});
 }
 const primary=document.querySelector('#birth-language,#rashifal-language,#matching-language,#tm-language');
 let language='en',syncing=false;
 try{const saved=localStorage.getItem(languagePreferenceKey)??localStorage.getItem('synapse-vedic-language');if(Object.hasOwn(pageLabels,saved))language=saved;}catch{}
 function hideLocalControls(){
  for(const input of document.querySelectorAll('#birth-language,#rashifal-language,#matching-language,#tm-language'))input.closest('label').hidden=true;
 }
 function apply(value,persist=false){
  if(syncing||!Object.hasOwn(pageLabels,value))return;syncing=true;language=value;
  try{
   const t=pageLabels[language];document.documentElement.lang=language;document.title=t.title;select.value=language;
   for(const node of document.querySelectorAll('[data-vedic-text]'))node.textContent=t[node.dataset.vedicText];
   document.querySelector('.vedic-nav').setAttribute('aria-label',t.nav);
   const summary=document.querySelector('.platform-language>summary');if(summary)summary.textContent=({en:'EN',hi:'हिन्दी',gu:'ગુજરાતી'})[language];
   for(const input of document.querySelectorAll('input,select'))input.setCustomValidity('');
   if(primary&&primary.value!==language){primary.value=language;primary.dispatchEvent(new Event('change',{bubbles:true}));}
   for(const input of document.querySelectorAll('#birth-language,#rashifal-language,#matching-language,#tm-language')){input.closest('label').hidden=true;if(input.value!==language){input.value=language;input.dispatchEvent(new Event('change',{bubbles:true}));}}
   hideLocalControls();
   if(persist)try{localStorage.setItem(languagePreferenceKey,language);localStorage.removeItem('synapse-vedic-language');}catch{}
  }finally{syncing=false;}
 }
 select.addEventListener('change',()=>{apply(select.value,true);const menu=select.closest('details');if(menu){menu.open=false;menu.querySelector('summary').focus();}});
 document.addEventListener('change',event=>{if(event.target.matches('#birth-language,#rashifal-language,#matching-language,#tm-language'))apply(event.target.value,true);});
 document.addEventListener('invalid',event=>{if(event.target.setCustomValidity)event.target.setCustomValidity(pageLabels[language].validation);},true);
 document.addEventListener('input',event=>{if(event.target.setCustomValidity)event.target.setCustomValidity('');},true);
 window.addEventListener('pageshow',()=>{try{const saved=localStorage.getItem(languagePreferenceKey);if(Object.hasOwn(pageLabels,saved))apply(saved);}catch{}});
 window.addEventListener('storage',event=>{if(event.key===languagePreferenceKey)apply(Object.hasOwn(pageLabels,event.newValue)?event.newValue:'en');});
 // Nested views mount after calculation and inherit their parent's language.
 window.SynapseUI?.observe(records=>{if(records.some(r=>r.addedNodes.length))hideLocalControls();});
 apply(language);
}
