export const pageLabels={
 en:{title:'Rashifal & Kundli · verification preview',warning:'Experimental calculations and traditional interpretations. Verify important decisions and ritual dates independently.',privacy:'Birth details and results stay in this tab. No birth account, server submission, analytics or ads. Shared-device and browser-extension privacy still depends on your device.',home:'Platform home',birth:'Kundli',rashifal:'Rashifal',timeMachine:'Time Machine',matching:'Matching',nav:'Vedic preview',language:'Language',theme:'Theme',system:'System',light:'Light',dark:'Dark',validation:'Please check this field and enter a supported value.'},
 hi:{title:'राशिफल और कुंडली · सत्यापन पूर्वावलोकन',warning:'प्रयोगात्मक गणनाएँ और पारंपरिक व्याख्याएँ। महत्वपूर्ण निर्णय और धार्मिक तिथियाँ स्वतंत्र रूप से सत्यापित करें।',privacy:'जन्म विवरण और परिणाम केवल इस टैब में रहते हैं। जन्म खाते, सर्वर पर विवरण भेजने, विश्लेषण या विज्ञापन की सुविधा नहीं है। साझा उपकरण और ब्राउज़र एक्सटेंशन की गोपनीयता आपके उपकरण पर निर्भर है।',home:'प्लेटफ़ॉर्म मुखपृष्ठ',birth:'कुंडली',rashifal:'राशिफल',timeMachine:'टाइम मशीन',matching:'कुंडली मिलान',nav:'वैदिक पूर्वावलोकन',language:'भाषा',theme:'रंग रूप',system:'उपकरण के अनुसार',light:'हल्का',dark:'गहरा',validation:'कृपया यह फ़ील्ड जाँचें और समर्थित मान भरें।'},
 gu:{title:'રાશિફળ અને કુંડળી · ચકાસણી પૂર્વાવલોકન',warning:'પ્રયોગાત્મક ગણતરીઓ અને પરંપરાગત અર્થઘટનો. મહત્વના નિર્ણયો અને ધાર્મિક તારીખોની સ્વતંત્ર ખાતરી કરો.',privacy:'જન્મ વિગતો અને પરિણામો ફક્ત આ ટૅબમાં રહે છે. જન્મ ખાતું, સર્વર પર વિગતો મોકલવી, વિશ્લેષણ કે જાહેરાતો નથી. સહિયારા ઉપકરણ અને બ્રાઉઝર એક્સટેન્શનની ગોપનીયતા તમારા ઉપકરણ પર આધારિત છે.',home:'પ્લેટફૉર્મ મુખપૃષ્ઠ',birth:'કુંડળી',rashifal:'રાશિફળ',timeMachine:'ટાઇમ મશીન',matching:'કુંડળી મિલાન',nav:'વૈદિક પૂર્વાવલોકન',language:'ભાષા',theme:'રંગરૂપ',system:'ઉપકરણ મુજબ',light:'આછું',dark:'ઘેરું',validation:'કૃપા કરીને આ ક્ષેત્ર તપાસો અને સમર્થિત મૂલ્ય ભરો.'}
};
for(const [language,text]of Object.entries({en:'About this preview',hi:'इस पूर्वावलोकन के बारे में',gu:'આ પૂર્વાવલોકન વિશે'}))pageLabels[language].previewDetails=text;
export const languagePreferenceKey='synapse-language';
for(const [language,label]of Object.entries({en:'Astrology',hi:'ज्योतिष',gu:'જ્યોતિષ'}))pageLabels[language].title=`Ritvayam · ${label}`;
export function initLanguageShell(){
 if(!window.SynapseLanguage)throw new Error('Shared language service unavailable.');
 document.body.dataset.sharedLanguage='true';let language='en';
 window.SynapseLanguage.register({languages:['en','hi','gu'],legacyKeys:['synapse-vedic-language'],controls:'#birth-language,#rashifal-language,#matching-language,#tm-language',apply(value){
  language=value;const t=pageLabels[value];document.documentElement.lang=value;document.title=t.title;
  for(const node of document.querySelectorAll('[data-vedic-text]'))node.textContent=t[node.dataset.vedicText];
  document.querySelector('.vedic-nav').setAttribute('aria-label',t.nav);
  for(const input of document.querySelectorAll('input,select'))input.setCustomValidity('');
 }});
 document.addEventListener('invalid',event=>{if(event.target.setCustomValidity&&!event.target.validity.customError)event.target.setCustomValidity(pageLabels[language].validation);},true);
 document.addEventListener('input',event=>{if(event.target.setCustomValidity&&!event.target.closest('.civil-input,.birthplace-combobox'))event.target.setCustomValidity('');},true);
}
