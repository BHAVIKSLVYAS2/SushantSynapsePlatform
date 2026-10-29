import {freeze} from '../../../packages/vedic/diagnostics.mjs';
import {bodyName} from './locale.mjs';
import {composeEveryday} from './rashifal-everyday.mjs';
import {composeRashifalStory} from './rashifal-story.mjs';

export const outlookModel=freeze({id:'calculated-transit-outlook-2',
 scope:'Project-authored practical interpretation of calculated general Moon-sign transits; not classical life-event prose, a personal forecast or a probability model.'});
export const outlookText={
 en:{today:'Your daily prediction',tomorrow:'Your outlook for tomorrow',weekly:'Your weekly outlook',calculations:'Calculations behind your reading',notice:'Traditional guidance interpreted from calculated transits. Outcomes are not guaranteed.',
  supportive:['Build on your momentum','There is room for steady progress. Give one important priority your full attention and take a practical next step, rather than waiting for everything to be perfect.'],
  obstructed:['Give progress a little patience','Your plans may need a little more patience than usual. Leave room for another conversation or a second attempt, and avoid pushing yourself to settle everything at once.'],
  neutral:['Keep things simple','A measured approach suits this reading. Finish what is already in motion, keep your commitments manageable and give yourself some breathing room before taking on more.'],
  mixed:['Make room to adjust','Your plans may not follow one even rhythm. Make the most of the easier stretches, but be willing to slow down and revisit something that needs more attention.'],
  uncertain:['Stay open to a change of pace','Keep your plans flexible and give yourself time to reassess. This is a better reading for leaving room to adjust than for treating the first impression as the final word.'],
  support:names=>`There is also a supportive thread in the pattern for ${names}. Use that encouragement for one useful step you can complete, rather than spreading your attention across too many things.`,
  resistance:names=>`The positive indications for ${names} meet resistance in this reading. A calm follow-up, a clearer request or a little extra preparation may serve you better than trying to force a quick result.`,
  quiet:'There is no clear, unblocked supportive signal to single out here. That does not make this a bad period; use it as a reminder to work at a comfortable pace and stay realistic about what you can fit in.',
  turn:(time,state)=>`Around ${time}, the Moon’s reading ${state}. Leave a little space to review your pace around that change; it is not a deadline for an event to happen.`,
  turns:{supportive:'becomes more supportive',obstructed:'calls for more patience','outside-favorable':'returns to a more measured theme'},
  ingress:time=>`Around ${time}, the Moon changes sign. Allow room for a shift in pace rather than expecting the whole period to feel the same.`,
  noChange:'No Moon-sign or boundary-screening change was found for this period. Keep the overall theme in mind rather than waiting for one exact turning point.',
  unknown:'The timing is not clear enough to name a turning point. Keep plans flexible and use the outlook as a broad guide.',basis:'The outlook follows the calculated Moon pattern and the supportive or obstructed planetary results. Practical suggestions are original editorial guidance, not guaranteed classical outcomes.'},
 hi:{today:'आज का राशिफल',tomorrow:'कल का राशिफल',weekly:'साप्ताहिक राशिफल',calculations:'आपके राशिफल की गणना',notice:'गणना किए गए गोचर पर आधारित पारंपरिक मार्गदर्शन। परिणाम निश्चित नहीं हैं।',
  supportive:['धीरे-धीरे आगे बढ़ें','लगातार प्रगति के लिए जगह है। किसी एक ज़रूरी काम को पूरा ध्यान दें और सब कुछ बिल्कुल सही होने की प्रतीक्षा करने के बजाय अगला व्यावहारिक कदम उठाएँ।'],
  obstructed:['थोड़ा धैर्य काम आएगा','योजनाओं में सामान्य से थोड़ा अधिक धैर्य लग सकता है। दोबारा बातचीत या एक और प्रयास के लिए समय रखें और सब कुछ एक साथ तय करने का दबाव न लें।'],
  neutral:['दिनचर्या सरल रखें','इस पाठ के अनुसार संतुलित ढंग से आगे बढ़ना बेहतर है। चल रहे काम पूरे करें, ज़िम्मेदारियाँ संभालने योग्य रखें और नया काम लेने से पहले अपने लिए थोड़ी जगह छोड़ें।'],
  mixed:['बदलाव के लिए जगह रखें','योजनाएँ एक ही गति से आगे नहीं बढ़ सकतीं। आसान समय का उपयोग करें, लेकिन जहाँ ज़रूरत हो वहाँ रुककर किसी बात को फिर से देखने के लिए तैयार रहें।'],
  uncertain:['गति बदलने के लिए तैयार रहें','योजनाओं में लचीलापन रखें और फिर से सोचने का समय दें। पहली धारणा को अंतिम मानने के बजाय बदलाव की गुंजाइश रखना इस पाठ के अधिक अनुकूल है।'],
  support:names=>`${names} के संकेतों में कुछ अनुकूलता भी है। इससे उत्साह लेकर कोई एक उपयोगी कदम पूरा करें, बजाय इसके कि बहुत सारे कामों में ध्यान बाँट दें।`,
  resistance:names=>`${names} के अनुकूल संकेतों के साथ इस पाठ में रुकावट भी है। जल्दी नतीजा पाने का दबाव बनाने के बजाय शांत ढंग से फिर बात करना, बात स्पष्ट रखना या थोड़ी तैयारी करना उपयोगी हो सकता है।`,
  quiet:'यहाँ कोई स्पष्ट, बाधारहित अनुकूल संकेत अलग से नहीं उभरता। इसका अर्थ खराब समय नहीं है; सहज गति से काम करें और जितना संभाल सकें उतना ही तय करें।',
  turn:(time,state)=>`लगभग ${time} पर चंद्रमा का संकेत ${state}। इस बदलाव के आसपास अपनी गति पर फिर विचार करने की जगह रखें; यह किसी घटना की समय-सीमा नहीं है।`,
  turns:{supportive:'अधिक अनुकूल होता है',obstructed:'अधिक धैर्य की ओर इशारा करता है','outside-favorable':'फिर संतुलित गति की ओर इशारा करता है'},
  ingress:time=>`लगभग ${time} पर चंद्रमा राशि बदलता है। पूरी अवधि एक जैसी रहने की अपेक्षा करने के बजाय गति में बदलाव की गुंजाइश रखें।`,
  noChange:'इस अवधि में चंद्र राशि या सीमा-जाँच का बदलाव नहीं मिला। किसी एक निश्चित मोड़ की प्रतीक्षा करने के बजाय पूरे पाठ की दिशा ध्यान में रखें।',
  unknown:'किसी मोड़ का समय बताने के लिए स्थिति पर्याप्त स्पष्ट नहीं है। योजनाएँ लचीली रखें और इस पाठ को सामान्य मार्गदर्शन मानें।',basis:'यह पाठ गणना किए गए चंद्र संकेत तथा ग्रहों के अनुकूल या बाधित परिणामों पर आधारित है। व्यावहारिक सुझाव परियोजना का मौलिक मार्गदर्शन हैं, निश्चित शास्त्रीय परिणाम नहीं।'},
 gu:{today:'આજનું રાશિફળ',tomorrow:'આવતીકાલનું રાશિફળ',weekly:'સાપ્તાહિક રાશિફળ',calculations:'તમારા રાશિફળની ગણતરી',notice:'ગણાયેલા ગોચર પરથી પરંપરાગત માર્ગદર્શન. પરિણામો નિશ્ચિત નથી.',
  supportive:['ધીમે-ધીમે આગળ વધો','સતત પ્રગતિ માટે જગ્યા છે. એક મહત્વના કામને પૂરું ધ્યાન આપો અને બધું એકદમ યોગ્ય થાય તેની રાહ જોવાને બદલે આગળનું વ્યવહારુ પગલું લો.'],
  obstructed:['થોડી ધીરજ ઉપયોગી થશે','યોજનાઓમાં સામાન્ય કરતાં થોડી વધુ ધીરજની જરૂર પડી શકે છે. ફરી વાત કરવા કે બીજો પ્રયાસ કરવા સમય રાખો અને બધું એકસાથે નક્કી કરવાનું દબાણ ન લો.'],
  neutral:['દિનચર્યા સરળ રાખો','આ લખાણ મુજબ સંતુલિત રીતે આગળ વધવું યોગ્ય છે. ચાલુ કામ પૂરાં કરો, જવાબદારીઓ સંભાળી શકાય તેવી રાખો અને નવું કામ લેતાં પહેલાં પોતાના માટે થોડી જગ્યા છોડો.'],
  mixed:['ફેરફાર માટે જગ્યા રાખો','યોજનાઓ એક જ ગતિએ આગળ ન પણ વધે. સરળ સમયનો ઉપયોગ કરો, પરંતુ જ્યાં જરૂર હોય ત્યાં થોભીને કોઈ વાત ફરીથી જોવા તૈયાર રહો.'],
  uncertain:['ગતિ બદલવા તૈયાર રહો','યોજનાઓમાં લવચીકતા રાખો અને ફરી વિચારવા સમય આપો. પ્રથમ છાપને અંતિમ માનવાને બદલે ફેરફારની જગ્યા રાખવી આ લખાણને વધુ અનુરૂપ છે.'],
  support:names=>`${names}ના સંકેતોમાં થોડું અનુકૂળ સમર્થન પણ છે. તેમાંથી ઉત્સાહ લઈને એક ઉપયોગી પગલું પૂરું કરો, ઘણાં કામોમાં ધ્યાન વહેંચવાને બદલે.`,
  resistance:names=>`${names}ના અનુકૂળ સંકેતો સાથે આ લખાણમાં અવરોધ પણ છે. ઝડપી પરિણામ માટે દબાણ કરવાને બદલે શાંતિથી ફરી વાત કરવી, વાત સ્પષ્ટ કરવી કે થોડી તૈયારી કરવી ઉપયોગી થઈ શકે છે.`,
  quiet:'અહીં કોઈ સ્પષ્ટ, અવરોધ વગરનો અનુકૂળ સંકેત અલગથી દેખાતો નથી. તેનો અર્થ ખરાબ સમય નથી; સહજ ગતિએ કામ કરો અને જેટલું સંભાળી શકો તેટલું જ નક્કી કરો.',
  turn:(time,state)=>`લગભગ ${time}એ ચંદ્રનો સંકેત ${state}. આ ફેરફાર આસપાસ પોતાની ગતિ ફરીથી વિચારવાની જગ્યા રાખો; આ કોઈ ઘટના માટેની સમયમર્યાદા નથી.`,
  turns:{supportive:'વધુ અનુકૂળ બને છે',obstructed:'વધુ ધીરજ તરફ સૂચવે છે','outside-favorable':'ફરી સંતુલિત ગતિ તરફ સૂચવે છે'},
  ingress:time=>`લગભગ ${time}એ ચંદ્ર રાશિ બદલે છે. આખો સમયગાળો એકસરખો રહે તેવી અપેક્ષા રાખવાને બદલે ગતિમાં ફેરફારની જગ્યા રાખો.`,
  noChange:'આ સમયગાળામાં ચંદ્ર રાશિ કે સીમા-ચકાસણીનો ફેરફાર મળ્યો નથી. કોઈ એક ચોક્કસ વળાંકની રાહ જોવાને બદલે આખા લખાણની દિશા ધ્યાનમાં રાખો.',
  unknown:'કોઈ વળાંકનો સમય જણાવવા સ્થિતિ પૂરતી સ્પષ્ટ નથી. યોજનાઓ લવચીક રાખો અને આ લખાણને સામાન્ય માર્ગદર્શન માનો.',basis:'આ લખાણ ગણાયેલા ચંદ્ર સંકેત અને ગ્રહોના અનુકૂળ કે અવરોધિત પરિણામો પરથી છે. વ્યવહારુ સૂચનો પ્રોજેક્ટનું મૂળ માર્ગદર્શન છે, નિશ્ચિત શાસ્ત્રીય પરિણામો નહીં.'}
};

for(const [language,boundary]of Object.entries({en:time=>`Around ${time}, the reading becomes less settled near a change. Give yourself room to pause and reassess rather than rushing to a conclusion.`,hi:time=>`लगभग ${time} पर बदलाव के पास पाठ कम स्पष्ट होता है। जल्द निष्कर्ष निकालने के बजाय रुककर फिर विचार करने की जगह रखें।`,gu:time=>`લગભગ ${time}એ ફેરફાર પાસે લખાણ ઓછું સ્પષ્ટ થાય છે. ઉતાવળે નિષ્કર્ષ કાઢવાને બદલે થોભીને ફરી વિચારવાની જગ્યા રાખો.`}))outlookText[language].boundary=boundary;
export function composeOutlook({grahas,timeline,language}){
 const t=outlookText[language],moon=grahas.find(g=>g.body==='Moon'),c=moon.counts;
 const mood=c.uncertain||c['rule-unresolved']?'uncertain':c.supportive===moon.sampleCount?'supportive':c.supportive?'mixed':c.obstructed?'obstructed':'neutral';
 const others=grahas.filter(g=>!['Moon','Rahu','Ketu'].includes(g.body));
 const supportive=others.filter(g=>g.counts.supportive>0),obstructed=others.filter(g=>g.counts.obstructed>0);
 const focus=supportive.length?supportive:obstructed,kind=supportive.length?'support':obstructed.length?'resistance':'quiet';
 const names=new Intl.ListFormat(({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[language],{style:'long',type:'conjunction'}).format(focus.map(g=>bodyName(g.body,language)));
 const change=timeline.events.find(e=>e.intervalMembership==='inside'&&e.affected.some(a=>a.body==='Moon'&&a.fromStatus!==a.toStatus&&Object.hasOwn(t.turns,a.toStatus)));
 const ingress=timeline.events.find(e=>e.body==='Moon'&&e.kind==='ingress'&&e.intervalMembership==='inside');
 const relevant=timeline.events.filter(e=>e.body==='Moon'||e.affected.some(a=>a.body==='Moon'));
 const event=change||ingress||relevant.find(e=>e.intervalMembership==='inside');let timing=t.unknown;
 if(timeline.status==='available'){
  if(event){const time=new Intl.DateTimeFormat(({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[language],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Kolkata'}).format(new Date(event.utcInstant))+' IST';
   timing=change?t.turn(time,t.turns[change.affected.find(a=>a.body==='Moon').toStatus]):ingress?t.ingress(time):t.boundary(time);
  }else if(!relevant.length)timing=t.noChange;
 }
 const meaningfulChange=timeline.status==='available'&&change&&change.affected.some(a=>a.body==='Moon'&&Object.hasOwn(t.turns,a.fromStatus)&&Object.hasOwn(t.turns,a.toStatus));
 const everyday=composeRashifalStory({base:composeEveryday({moon,mood,language}),grahas,mood,language,timing:meaningfulChange?timing:null});
 return freeze({modelId:outlookModel.id,mood,everyday,headline:t[mood][0],paragraphs:[t[mood][1],kind==='quiet'?t.quiet:t[kind](names),timing],
  trace:{moonCounts:c,focusKind:kind,focusBodies:focus.map(g=>g.body),timingUtc:timeline.status==='available'?event?.utcInstant??null:null,timingKind:timeline.status==='available'?event?.kind??null:null,timelineStatus:timeline.status},
  scope:outlookModel.scope});
}
