import {matchingScopeCopy} from './matching-summary.mjs';
import {matchingConnection} from './matching-connection.mjs';
import {term} from './display-text.mjs';
import {bodyName} from './locale.mjs';
export const matchingReadingVersion='planet-grounded-matching-3';
const ids=['varna','vashya','tara','yoni','graha-maitri','gana','bhakoot','nadi'];
// Original explanations of the selected rulebook, not borrowed predictions.
const copy={
 en:{
  title:"Let’s talk about your matching reading",
  note:"We’ve compared both Moon signs and birth stars across eight traditional factors. Let’s see where the points agree and where they differ.",
  titles:['Varna: symbolic sign groups','Vashya: sign-class comparison','Tara: birth-star relationship','Yoni: traditional star symbols','Graha Maitri: planetary friendship','Gana: birth-star groups','Bhakoot: Moon-sign relationship','Nadi: birth-star classification'],
  topics:[
   "Varna compares traditional Moon-sign groups in your A/B order. Give each other’s values room in the conversation.",
   "Vashya compares your Moon signs using a four-group table. Other traditions may group signs differently or split them at 15 degrees, so their points can differ. Talk about how you share decisions and give each other space.",
   "Tara counts between your birth stars in both directions, reducing each count to a group from 1 to 9. Each direction outside groups 3, 5 and 7 adds 1.5 points. Ask how you can support each other when life gets busy.",
   "Yoni compares traditional animal symbols linked to your birth stars. Talk openly about comfort and personal boundaries.",
   "Graha Maitri looks at the traditional natural friendship of your Moon-sign rulers. It doesn’t compare every planet or their temporary friendship. Listen without rushing to prepare your reply.",
   "Gana compares traditional birth-star groups in your A/B order. Ask what helps each of you when you disagree or need time alone.",
   "Bhakoot looks at the distance between your Moon signs. This rule gives zero points for 2/12, 5/9 and 6/8 pairs, and seven for the others. Talk through family expectations and shared plans.",
   "Nadi compares three traditional birth-star groups. Different groups get eight points and the same group gets zero. Whatever the points, talk about daily routines and caring for each other."
  ],
  outcomes:{"full": "You have full points here in this rulebook. Take it as one encouraging part of the comparison.", "partial": "You have some points here. Take time to explore what works for both of you.", "zero": "This rulebook gives zero points here. Look at it alongside the other results.", "uncertain": "The Moon is near a boundary, so more than one score is possible. Keep the range in view rather than choosing one number."},
  pair:(a,b)=>'Person A: '+a+'. Person B: '+b+'.',
  rulers:(a,b)=>'Person A’s Moon-sign ruler is '+a+'; Person B’s is '+b+'.',
  counts:(a,b)=>'The reduced Tara classes are '+a+' from A to B and '+b+' from B to A.',
  distance:(a,b)=>'Counting inclusively, B’s Moon sign is '+a+' from A’s, and A’s is '+b+' from B’s.',
  varying:'The underlying classifications also have multiple possibilities. They are listed under the chart basis; no single classification is treated as certain.',
  review:"Read both sides in the A/B order you entered, and talk about your real experiences too.",
 },
 hi:{
  title:"आइए, आपके गुण मिलान को समझें",
  note:"दोनों की चंद्र राशि और जन्म नक्षत्र से आठ पारंपरिक पहलुओं के गुण मिलाए हैं। देखें, कहाँ गुण मिलते हैं और कहाँ फर्क है।",
  titles:['वर्ण: प्रतीकात्मक राशि समूह','वश्य: राशि वर्गों की तुलना','तारा: जन्म नक्षत्रों का संबंध','योनि: पारंपरिक नक्षत्र प्रतीक','ग्रह मैत्री: राशि स्वामियों का संबंध','गण: जन्म नक्षत्र समूह','भकूट: चंद्र राशियों का संबंध','नाड़ी: जन्म नक्षत्र का वर्गीकरण'],
  topics:[
   "वर्ण में चंद्र राशियों के पारंपरिक समूहों को आपके भरे हुए A/B क्रम में देखते हैं। एक-दूसरे के विचारों को सुनने की जगह दें।",
   "वश्य में चंद्र राशियों को चार समूहों वाली तालिका से मिलाते हैं। दूसरी परंपरा में समूह या 15 अंश पर राशि के हिस्से अलग हो सकते हैं, इसलिए अंक भी बदल सकते हैं। बात करें कि फैसले कैसे मिलकर लेने हैं और एक-दूसरे को कितनी जगह चाहिए।",
   "तारा में दोनों जन्म नक्षत्रों के बीच दोनों तरफ से गिनती करके 1 से 9 का समूह निकालते हैं। 3, 5 और 7 को छोड़कर हर दिशा के लिए 1.5 अंक मिलते हैं। पूछें कि व्यस्त दिनों में आप एक-दूसरे का साथ कैसे देंगे।",
   "योनि में जन्म नक्षत्रों से जुड़े पारंपरिक पशु प्रतीकों को मिलाते हैं। किस बात में सहज हैं और कहाँ सीमा चाहिए, यह खुलकर पूछें।",
   "ग्रह मैत्री में चंद्र राशि के स्वामी ग्रहों की पारंपरिक दोस्ती देखते हैं। इसमें सभी ग्रहों या थोड़े समय की दोस्ती का हिसाब नहीं जुड़ता। जवाब देने की जल्दी किए बिना एक-दूसरे को सुनें।",
   "गण में जन्म नक्षत्रों के पारंपरिक समूहों को आपके A/B क्रम में देखते हैं। मतभेद होने पर किसे बात करने और किसे थोड़ा समय लेने की जरूरत होती है, यह पूछें।",
   "भकूट में चंद्र राशियों की दूरी देखते हैं। इस नियम में 2/12, 5/9 और 6/8 के लिए शून्य, बाकी के लिए सात अंक मिलते हैं। परिवार की उम्मीदों और आगे की योजनाओं पर साथ बैठकर बात करें।",
   "नाड़ी में जन्म नक्षत्रों के तीन पारंपरिक समूह देखते हैं। अलग समूह पर आठ और एक जैसे समूह पर शून्य अंक मिलते हैं। अंक जो भी हों, रोज की आदतों और एक-दूसरे का खयाल रखने पर बात करें।"
  ],
  outcomes:{"full": "यहाँ चुने गए नियम से पूरे अंक मिले हैं। इसे मिलान का एक अच्छा हिस्सा समझें।", "partial": "यहाँ कुछ अंक मिले हैं। एक-दूसरे को समझने के लिए थोड़ा समय और बातचीत काम आएगी।", "zero": "इस नियम में यहाँ शून्य अंक हैं। इसे बाकी नतीजों के साथ समझें।", "uncertain": "चंद्रमा सीमा के पास है, इसलिए यहाँ एक से ज्यादा अंक संभव हैं। किसी एक संख्या को पक्का मानने के बजाय पूरी सीमा देखें।"},
  pair:(a,b)=>'व्यक्ति A: '+a+'। व्यक्ति B: '+b+'।',
  rulers:(a,b)=>'व्यक्ति A की चंद्र राशि के स्वामी '+a+' और व्यक्ति B के '+b+' हैं।',
  counts:(a,b)=>'तारा के घटाए गए वर्ग A से B की ओर '+a+' और B से A की ओर '+b+' हैं।',
  distance:(a,b)=>'आरंभ की राशि सहित गिनने पर B की चंद्र राशि A से '+a+'वें और A की चंद्र राशि B से '+b+'वें स्थान पर है।',
  varying:'मूल वर्गीकरण की भी एक से अधिक संभावनाएँ हैं। उन्हें कुंडली के आधार में देखें; किसी एक को निश्चित नहीं माना गया है।',
  review:"आपने जिस A/B क्रम में जानकारी भरी है, उसी क्रम में दोनों पक्ष देखें। अपने असली अनुभवों पर भी बात करें।",
 },
 gu:{
  title:"ચાલો, તમારા ગુણ મિલાનને સમજીએ",
  note:"બંનેની ચંદ્ર રાશિ અને જન્મ નક્ષત્ર પરથી આઠ પરંપરાગત બાબતોના ગુણ સરખાવ્યા છે. ક્યાં ગુણ મળે છે અને ક્યાં ફરક છે તે જોઈએ.",
  titles:['વર્ણ: પ્રતીકાત્મક રાશિ જૂથ','વશ્ય: રાશિ વર્ગોની સરખામણી','તારા: જન્મ નક્ષત્રોનો સંબંધ','યોનિ: પરંપરાગત નક્ષત્ર પ્રતીક','ગ્રહ મૈત્રી: રાશિ સ્વામીઓનો સંબંધ','ગણ: જન્મ નક્ષત્ર જૂથ','ભકૂટ: ચંદ્ર રાશિઓનો સંબંધ','નાડી: જન્મ નક્ષત્રનું વર્ગીકરણ'],
  topics:[
   "વર્ણમાં ચંદ્ર રાશિના પરંપરાગત જૂથો તમે ભરેલા A/B ક્રમમાં જોઈએ છીએ. એકબીજાના વિચારો સાંભળવા માટે જગ્યા રાખો.",
   "વશ્યમાં ચંદ્ર રાશિઓને ચાર જૂથવાળા કોષ્ટકથી સરખાવીએ છીએ. બીજી પરંપરામાં જૂથો કે 15 અંશે રાશિના ભાગ જુદા હોઈ શકે, એટલે ગુણ પણ બદલાઈ શકે. નિર્ણયો સાથે કેવી રીતે લેવા અને એકબીજાને કેટલી છૂટ જોઈએ તેની વાત કરો.",
   "તારામાં બંને જન્મ નક્ષત્ર વચ્ચે બંને તરફથી ગણતરી કરીને 1થી 9નું જૂથ કાઢીએ છીએ. 3, 5 અને 7 સિવાયની દરેક દિશા માટે 1.5 ગુણ મળે છે. વ્યસ્ત દિવસોમાં તમે એકબીજાને કેવી રીતે સાથ આપશો તે પૂછો.",
   "યોનિમાં જન્મ નક્ષત્ર સાથે જોડાયેલા પરંપરાગત પ્રાણીનાં પ્રતીકો સરખાવીએ છીએ. શામાં આરામ લાગે છે અને ક્યાં મર્યાદા જોઈએ તે ખુલ્લા મને પૂછો.",
   "ગ્રહ મૈત્રીમાં ચંદ્ર રાશિના સ્વામી ગ્રહોની પરંપરાગત કુદરતી મિત્રતા જોઈએ છીએ. તેમાં બધા ગ્રહો કે થોડા સમયની મિત્રતાની ગણતરી નથી. જવાબ આપવાની ઉતાવળ કર્યા વગર એકબીજાને સાંભળો.",
   "ગણમાં જન્મ નક્ષત્રના પરંપરાગત જૂથો તમારા A/B ક્રમમાં જોઈએ છીએ. મતભેદ થાય ત્યારે કોને વાત કરવી ગમે અને કોને થોડો સમય જોઈએ તે પૂછો.",
   "ભકૂટમાં ચંદ્ર રાશિઓ વચ્ચેનું અંતર જોઈએ છીએ. આ નિયમમાં 2/12, 5/9 અને 6/8 માટે શૂન્ય અને બાકીના માટે સાત ગુણ મળે છે. પરિવારની અપેક્ષાઓ અને આગળની યોજનાઓ વિશે સાથે વાત કરો.",
   "નાડીમાં જન્મ નક્ષત્રના ત્રણ પરંપરાગત જૂથો જોઈએ છીએ. જુદા જૂથને આઠ અને એકસરખા જૂથને શૂન્ય ગુણ મળે છે. ગુણ ગમે તે હોય, રોજની ટેવો અને એકબીજાની કાળજી વિશે વાત કરો."
  ],
  outcomes:{"full": "અહીં પસંદ કરેલા નિયમ મુજબ પૂરા ગુણ મળ્યા છે. તેને મિલાનનો એક સારો ભાગ માનો.", "partial": "અહીં થોડા ગુણ મળ્યા છે. એકબીજાને સમજવા થોડો સમય અને વાતચીત મદદ કરશે.", "zero": "આ નિયમમાં અહીં શૂન્ય ગુણ છે. તેને બાકીના પરિણામ સાથે સમજો.", "uncertain": "ચંદ્ર સીમા પાસે છે, એટલે અહીં એકથી વધુ ગુણ શક્ય છે. એક જ આંકડો પાકો માનવાને બદલે આખી શ્રેણી જુઓ."},
  pair:(a,b)=>'વ્યક્તિ A: '+a+'. વ્યક્તિ B: '+b+'.',
  rulers:(a,b)=>'વ્યક્તિ Aની ચંદ્ર રાશિના સ્વામી '+a+' અને વ્યક્તિ Bના '+b+' છે.',
  counts:(a,b)=>'તારાના ઘટાડેલા વર્ગ Aથી B તરફ '+a+' અને Bથી A તરફ '+b+' છે.',
  distance:(a,b)=>'શરૂઆતની રાશિ સહિત ગણતાં Bની ચંદ્ર રાશિ Aથી '+a+'મા અને Aની ચંદ્ર રાશિ Bથી '+b+'મા સ્થાને છે.',
  varying:'મૂળ વર્ગીકરણની પણ એકથી વધુ શક્યતા છે. તેને કુંડળીના આધારમાં જુઓ; કોઈ એકને નિશ્ચિત માન્યું નથી.',
  review:"તમે જે A/B ક્રમમાં વિગતો ભરી છે તે પ્રમાણે બંને બાજુ જુઓ. તમારા સાચા અનુભવો વિશે પણ વાત કરો.",
 }
};
export function matchingStory(result,language='en'){
 const lang=copy[language]?language:'en',t=copy[lang];
 const items=ids.flatMap((id,index)=>{
  const component=result.components.find(c=>c.id===id);if(!component)return [];
  const state=component.score===null?'uncertain':component.score===component.maximum?'full':component.score===0?'zero':'partial';
  const options=component.factorOptions??[component.factors],f=options[0];
  let actual='';
  // Stable scores may still have changing factors: do not assert one nominal pair.
  if(options.length>1)actual=t.varying;
  else if(state!=='uncertain'&&f){
   const a=term(bodyName(String(f.personA),lang),lang),b=term(bodyName(String(f.personB),lang),lang);
   actual=id==='graha-maitri'?t.rulers(a,b):id==='tara'?t.counts(f.aToB,f.bToA):id==='bhakoot'?t.distance(f.aToB,f.bToA):t.pair(a,b);
  }
  const text=[actual,t.topics[index],t.outcomes[state]].filter(Boolean).join(' ');
  return [{id,state,title:t.titles[index],text,prompt:t.review,component}];
 });
 const connection=matchingConnection(result,items,lang);
 return {modelId:matchingReadingVersion,title:t.title,note:t.note,limit:matchingScopeCopy[lang],items,connection};
}
