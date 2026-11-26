import {periodAt,focusPeriodTopics} from './jyotish-synthesis.mjs';
import {manner,temperament} from './kundli-consultation-copy.mjs';
import {bodyName} from './locale.mjs';
export const publicReadingVersion='public-consultation-4';
export function changedPeriodBasis(current,previous,minor,language,label){
 for(const topic of current){
  const earlier=previous?.find(item=>item.topic===topic.topic);
  if(!earlier||earlier.connections.some(item=>item.body===minor)||!topic.connections.some(item=>item.body===minor))continue;
  const name=bodyName(minor,language),subject=label([topic.topic]);
  if(language==='hi')return `इस बार ${subject} पर ध्यान बने रहने की एक और वजह है। जन्मकुंडली में नई अंतर्दशा के स्वामी ${name} का भी इस विषय से संबंध है।`;
  if(language==='gu')return `${subject}નું મહત્વ જળવાઈ રહેવાનું એક બીજું કારણ છે. જન્મકુંડળીમાં નવી અંતર્દશાના સ્વામી ${name} પણ આ વિષય સાથે જોડાયેલા છે.`;
  return `There is a further reason for the continuing emphasis on ${subject}: ${name}, the new subperiod ruler, also connects to this subject in the birth chart.`;
 }
 return '';
}
// Keep the bridge between periods distinct from the action for the new focus.
export function periodNarrative(focus,previous,language,label){
 const continuing=focus.filter(id=>previous?.includes(id)),added=focus.filter(id=>!previous?.includes(id));
 const carried=label(continuing),fresh=label(added),all=label(focus);
 if(language==='hi'){
  if(!focus.length)return 'इस अवधि के लिए कोई स्पष्ट व्यक्तिगत विषय तय नहीं होता।';
  if(!previous)return `इस अवधि में सबसे अधिक ध्यान इन बातों पर जाता है — ${all}।`;
  if(carried&&fresh)return `पहले से चले आ रहे विषय हैं — ${carried}। इस अवधि में इन पर भी ध्यान दें — ${fresh}।`;
  if(carried)return `अगली अवधि में भी यही विषय प्रमुख हैं — ${carried}।`;
  return `इस अवधि में प्राथमिकता बदलती है। अब प्रमुख विषय हैं — ${fresh}।`;
 }
 if(language==='gu'){
  if(!focus.length)return 'આ ગાળા માટે કોઈ ચોક્કસ વ્યક્તિગત વિષય સ્પષ્ટ થતો નથી.';
  if(!previous)return `આ ગાળામાં ધ્યાન ${all} તરફ જાય છે.`;
  if(carried&&fresh)return `${carried} પર ધ્યાન ચાલુ રહે છે. તેની સાથે હવે ${fresh} પણ મહત્વ પામે છે.`;
  return carried?`અંતર્દશા બદલાય છે, પણ ધ્યાન ${carried} પર જ રહે છે.`:`હવે ધ્યાન ${fresh} તરફ વળે છે.`;
 }
 if(!focus.length)return 'This period has no clear personal theme in the available chart.';
 if(!previous)return `This period brings attention to ${all}.`;
 if(carried&&fresh)return `The emphasis on ${carried} continues. Alongside it, ${fresh} now comes into view.`;
 return carried?`The subperiod changes, but the emphasis stays on ${carried}.`:`The emphasis now shifts to ${fresh}.`;
}
const workStyle={Sun:'काम की जिम्मेदारी लेना, निर्णय स्पष्ट करना और परिणाम की जवाबदेही निभाना',Moon:'लोगों की जरूरत समझना, बदलती परिस्थितियों के अनुसार काम ढालना और नियमित संपर्क बनाए रखना',Mars:'व्यावहारिक समस्या सुलझाना, काम को गति देना और किसी स्पष्ट लक्ष्य पर हाथ से काम करना',Mercury:'जानकारी समझना, लिखना-बोलना, हिसाब या विश्लेषण करना और अलग विकल्पों को जोड़ना',Jupiter:'किसी विषय को गहराई से सीखना, समझाकर बताना और अनुभव से मार्गदर्शन देना',Venus:'लोगों के साथ तालमेल, प्रस्तुति की गुणवत्ता और ग्राहक या सहयोगी के अनुभव पर ध्यान देना',Saturn:'प्रक्रिया बनाना, बारीकी से काम पूरा करना और लंबे समय तक गुणवत्ता बनाए रखना'};
const contextFor=h=>[1,4,7,10].includes(h)?'people':[2,11].includes(h)?'resources':[3,6].includes(h)?'practice':[5,9].includes(h)?'learning':'preparation';
const topicCopy={
 career:{people:'आपके काम में अपनी भूमिका साफ रखना और लोगों से सीधे जुड़ना अहम विषय है। ऐसी जिम्मेदारियों पर विचार करें जहाँ निर्णय, समन्वय या काम को सामने रखने की जगह मिले। अकेले सब सँभालने के बजाय अधिकार और अपेक्षाएँ पहले स्पष्ट करना मदद करेगा।',resources:'करियर को आय की व्यवस्था, उपयोगी कौशल और भरोसेमंद संपर्कों से जोड़कर पढ़ना बेहतर है। केवल अधिक काम लेने के बजाय यह देखें कि आपके ज्ञान की किस काम में जरूरत है और उसके बदले जिम्मेदारी व भुगतान कैसे तय होते हैं।',practice:'आपके पेशेवर विकास में रोज के अभ्यास और समस्या सुलझाने का पक्ष प्रमुख है। प्रक्रिया सुधारना, कठिन काम को छोटे हिस्सों में पूरा करना और अपनी गुणवत्ता का प्रमाण बनाना उपयोगी दिशा है। नाम या पद से पहले ऐसा काम चुनें जिसमें क्षमता लगातार निखर सके।',learning:'काम में विशेषज्ञता विकसित करना एक प्रमुख दिशा है। किसी विषय को गहराई से सीखने, समझाने या सलाह के काम से जुड़ने पर विचार किया जा सकता है। रुचि को प्रशिक्षण और वास्तविक काम के नमूनों से परखें; इससे अवसर मिलने पर तैयारी अधिक स्पष्ट रहेगी।',preparation:'काम में तैयारी, शोध, जटिल जिम्मेदारियाँ या पर्दे के पीछे की मेहनत को महत्व दें। भूमिका बदलनी हो तो पहले जरूरी कौशल, खर्च और समझौते की शर्तें जाँचें। अस्पष्ट जिम्मेदारी में बड़ा वादा करने से बेहतर है छोटे चरण का परिणाम दिखाना।'},
 learning:{people:'सीखने में चर्चा, प्रस्तुति और किसी के साथ अभ्यास को जगह दें। पढ़ा हुआ अपने शब्दों में समझाना और वास्तविक प्रतिक्रिया लेना उपयोगी रहेगा। सीखने के माहौल में सवाल पूछने और गलती सुधारने की सुविधा भी देखें।',resources:'ज्ञान को इस्तेमाल योग्य कौशल में बदलना इस भाग की मुख्य दिशा है। नोट्स लिखना, किसी को समझाना और छोटा प्रोजेक्ट बनाना आपकी प्रगति को साफ कर सकते हैं। केवल सामग्री इकट्ठी करने के बजाय हर चरण के बाद कुछ बनाकर दिखाएँ।',practice:'पढ़ाई को छोटे नियमित अभ्यास में बाँटना उपयोगी रहेगा। जिस हिस्से में गलती दोहरती है, उसी पर अलग से काम करें। लंबे समय तक एक बार पढ़ने के बजाय समझ की जाँच और अंतराल पर दोहराव को प्राथमिकता दें।',learning:'जिज्ञासा और गहराई से समझने की दिशा को जगह दें। विषय चुनते समय रुचि के साथ यह भी देखें कि उसमें आगे अभ्यास कैसे होगा और मार्गदर्शन कहाँ मिलेगा। विचारों को अपने उदाहरणों से जोड़ना, केवल रटने से अधिक उपयोगी हो सकता है।',preparation:'जटिल विषय के लिए शांत तैयारी और स्पष्ट क्रम मददगार हो सकते हैं। बड़े लक्ष्य को छोटे प्रश्नों में बदलें और हर हिस्से को समझकर आगे बढ़ें। तैयारी अकेले हो तब भी समय-समय पर बाहर से प्रतिक्रिया लेना जरूरी रहेगा।'},
 money:{people:'धन की योजना में घर, काम और साझेदारी की जिम्मेदारियों को साथ रखें। किस खर्च का निर्णय आपका है और कौन-सा साझा है, यह स्पष्ट होना जरूरी है। आय बढ़े तब भी नई स्थायी जिम्मेदारी लेने से पहले उसकी नियमित लागत देखें।',resources:'कमाई और उसे सँभालना अलग काम हैं। बचत, देय भुगतान और अपने उपयोग के पैसे अलग रखना उपयोगी दिशा है। संपर्कों से जुड़े अवसर में भी योगदान, भुगतान और समय की शर्तें साफ रखें।',practice:'आर्थिक सुधार को छोटे नियमित कदमों से जोड़ें। रोज के काम का उचित भुगतान, लंबित रकम का हिसाब और दोहरते छोटे खर्चों की समीक्षा उपयोगी रहेगी। एक बड़े लाभ की उम्मीद पर जरूरी भुगतान निर्भर न रखें।',learning:'संसाधनों का संबंध ज्ञान और कौशल विकसित करने से जुड़ता है। किसी कोर्स, सलाह या नए काम पर खर्च करते समय उसका उद्देश्य और अपनी वहन करने की क्षमता स्पष्ट करें। समझ बढ़ाने वाला खर्च भी योजना के भीतर होना चाहिए।',preparation:'साझा भुगतान, अचानक जरूरत और अधूरी शर्तों पर विशेष ध्यान दें। उपलब्ध रकम और कागज पर दिख रही रकम को अलग समझें। उधार या साझेदारी में तारीख, जिम्मेदारी और वापसी की शर्त लिखित रखना उपयोगी रहेगा।'},
 relationships:{people:'संबंधों में साथ निभाने और अपनी अलग जगह बनाए रखने, दोनों की जरूरत को पहचानें। समय, जिम्मेदारी और निर्णय लेने की अपेक्षाएँ साफ शब्दों में रखें। किसी बात पर अलग राय हो तो उसे रिश्ते की पूरी गुणवत्ता का फैसला न बनने दें।',resources:'परिवार और साझा संसाधनों की अपेक्षाएँ संबंधों में अहम हो सकती हैं। पैसे, सहायता और भविष्य की योजना पर अनुमान के बजाय सीधी बातचीत करें। जितना निभा सकते हैं उतना ही वादा करना भरोसे को मजबूत रखने का व्यावहारिक तरीका है।',practice:'रिश्ते में रोज की छोटी बातों का महत्व रखें—जवाब देना, समय निकालना और तय बात निभाना। व्यस्तता में अनदेखी महसूस हो तो पहले कारण पूछें। छोटी असहमति को जमा होने देने के बजाय शांत समय में एक मुद्दे पर बात करें।',learning:'साझा विचार, रुचियाँ और मूल्य बातचीत का अच्छा आधार बन सकते हैं। फिर भी विचारों का मेल हर जरूरत का मेल नहीं होता। दूसरे की बात समझने के साथ अपनी अपेक्षा भी स्पष्ट रखें और बदलती जरूरतों पर बात करते रहें।',preparation:'निजी समय, दूरी और साझा जिम्मेदारियों पर स्पष्टता उपयोगी रहेगी। चुप्पी या कम संपर्क का अर्थ खुद तय करने के बजाय पूछकर समझें। कोई कठिन बात हो तो उसे एक साथ सब सुलझाने के बजाय छोटे, निभाने योग्य समझौते में बदलें।'},
 family:{people:'घर और परिवार में आपकी भूमिका तथा बाहर की जिम्मेदारियों का संतुलन अहम है। सहायता की उम्मीद और निर्णय का अधिकार एक-दूसरे से स्पष्ट रखें। अपनी सीमा बताते समय यह भी बताएँ कि किस तरह का योगदान निभा सकते हैं।',resources:'परिवार में पैसे, सहायता और सलाह की अपेक्षाएँ अलग-अलग हो सकती हैं। मदद देने या लेने से पहले जरूरत, समय और सीमा स्पष्ट करें। अपनापन बनाए रखने के लिए हर जिम्मेदारी अपने ऊपर लेना जरूरी नहीं है।',practice:'परिवार और दोस्तों के साथ छोटे नियमित संपर्क को महत्व दें। जरूरी काम याद रखना और सहायता का तय समय निभाना, बड़े आश्वासन से अधिक उपयोगी हो सकता है। मतभेद में पहले एक स्पष्ट बात पर सहमति बनाएँ।',learning:'परिवार में सलाह और अलग जीवन-दृष्टि का प्रश्न उभर सकता है। अपनी बात समझाते समय सामने वाले के अनुभव को भी सुनें। किसी अलग राय को तुरंत असम्मान न मानना बातचीत को खुला रखेगा।',preparation:'निजी सीमा और साझा दायित्व को साथ सँभालना इस भाग का मुख्य विषय है। दूरी हो तो नियमित संपर्क का सरल तरीका तय करें। किसी रिश्तेदार की मंशा मान लेने के बजाय उपलब्ध जानकारी और साफ सहमति से आगे बढ़ें।'},
 home:{people:'रहने की व्यवस्था को काम, सुविधा और साथ रहने वालों की जरूरत के साथ देखें। छोटा व्यावहारिक सुधार कभी-कभी स्थान बदलने से पहले ही परेशानी कम कर सकता है। जिम्मेदारियाँ बाँटने की बात निर्णय से पहले करें।',resources:'घर या स्थान बदलने की योजना में उपलब्ध बजट और वास्तविक सहयोग को आधार बनाएँ। शुरुआती लागत के साथ नियमित खर्च भी जोड़ें। किसी साझा व्यवस्था में मालिकाना, उपयोग और भुगतान की शर्तें स्पष्ट रखें।',practice:'घर और यात्रा की सुविधा में रोज के छोटे कामों का महत्व है। आने-जाने का समय, दस्तावेज, रखरखाव और जरूरी सेवाओं की सूची बनाकर देखें। इससे बड़े निर्णय की जरूरत और उसकी तैयारी अधिक साफ होगी।',learning:'रहने की प्राथमिकताओं का संबंध अध्ययन, मार्गदर्शन या व्यापक अनुभव से जुड़ता है। यात्रा या नई जगह पर विचार हो तो उसका उद्देश्य, तैयारी और वापसी की व्यवस्था स्पष्ट रखें। इस दिशा को अनुभव बढ़ाने का संदर्भ समझें।',preparation:'स्थान-परिवर्तन या संपत्ति के विषय में खर्च, दस्तावेज और मौजूदा दायित्व पहले जाँचें। केवल नई जगह के आकर्षण पर निर्णय न लें; वहाँ रोज का जीवन कैसे चलेगा, यह भी देखें।'},
 spirituality:{people:'अपने मूल्यों को रोज के व्यवहार में उतारना इस भाग की उपयोगी दिशा है। जिम्मेदारी निभाते समय यह देखें कि आपका निर्णय आपकी मान्यता से कितना मेल खाता है। किसी पहचान से अधिक अपने व्यवहार में उसका अर्थ समझें।',resources:'वाणी, परिवार से मिले मूल्य और दूसरों के साथ योगदान पर विचार करें। जिस मूल्य को महत्व देते हैं, उसे समय और व्यवहार में थोड़ी जगह दें। अभ्यास का रूप आपकी अपनी आस्था और सुविधा से तय होगा।',practice:'छोटा नियमित अभ्यास, चिंतन या सेवा निभाने योग्य शुरुआत हो सकती है। बड़े संकल्प के बजाय ऐसा क्रम चुनें जिसे व्यस्त दिन में भी जारी रख सकें।',learning:'अध्ययन और सवाल पूछकर समझ बनाने की दिशा को जगह दें। किसी मार्गदर्शक की बात सुनते समय अपने अनुभव और विवेक की जाँच भी बनाए रखें।',preparation:'शांत समय और निजी चिंतन के लिए थोड़ी जगह निकालना उपयोगी हो सकता है। इसका उद्देश्य काम या संबंधों से बचना नहीं, अपनी प्राथमिकता साफ समझना रखें।'}
};
const topicTitles={overview:'आपकी रीडिंग का सार',appearance:'पहली छाप और अभिव्यक्ति',personality:'स्वभाव और निर्णय लेने का ढंग',learning:'पढ़ाई और कौशल',career:'काम और करियर',money:'पैसे और जिम्मेदारियाँ',relationships:'प्रेम और साझेदारी',family:'परिवार और सहयोग',wellbeing:'दिनचर्या और सेहत',home:'घर और स्थान-परिवर्तन',spirituality:'चिंतन और जीवन-दृष्टि',future:'वर्तमान और आने वाली अवधि'};
const focusNames={learning:'नए कौशल',career:'काम की ज़िम्मेदारियाँ',money:'पैसों की व्यवस्था',relationships:'साझेदारी',family:'पारिवारिक सहयोग',home:'रहने की व्यवस्था',spirituality:'गहन अध्ययन'};
const periodActions={learning:'सीखने का एक स्पष्ट लक्ष्य और नियमित अभ्यास तय करें।',career:'किस काम की जिम्मेदारी लेनी है और उसका परिणाम कैसे दिखेगा, यह स्पष्ट करें।',money:'देय रकम, साझा भुगतान और बचत की योजना की समीक्षा करें।',relationships:'समय, जिम्मेदारी और साथ की अपेक्षाओं पर स्पष्ट बातचीत करें।',family:'सहायता की जरूरत और अपनी निभाने योग्य सीमा तय करें।',home:'रहने की सुविधा, दस्तावेज और नियमित लागत को साथ जाँचें।',spirituality:'अध्ययन या चिंतन के लिए नियमित समय रखें।'};
const timingText={PUBLIC_SUPPORT:'अभी इस दिशा में अपनी तैयारी को काम में बदलने पर ध्यान दे सकते हैं।',PUBLIC_MIXED:'अभी आगे बढ़ने की गुंजाइश और कुछ बातों की समीक्षा की जरूरत साथ है।',PUBLIC_REVIEW:'इस समय तैयारी और अधूरे दायित्व स्पष्ट करना पहले रखें।'};
// Each topic has its own sentence so compound Hindi labels need no inflection.
const periodReading={
 home:'घर और रहने की व्यवस्था इस दौर का एक विषय है। अगर घर से जुड़ा कोई फैसला सामने है, तो देखें कि उससे आपकी रोज़मर्रा की ज़िंदगी कैसे बदलेगी।',
 spirituality:'किसी विषय को गहराई से समझने में रुचि बढ़ सकती है। जिस सवाल पर आप बार-बार लौटते हैं, उसके लिए थोड़ा समय निकालें।',
 career:'काम की ज़िम्मेदारियाँ इस दौर में ध्यान खींच सकती हैं। अगर कोई नई भूमिका सामने आए, तो देखें कि उसमें आपके किस हुनर की ज़रूरत होगी।',
 relationships:'साझेदारी पर ध्यान जा सकता है। घर या काम में कोई ज़िम्मेदारी साझा करते हों, तो बात करें कि कौन कितना समय दे सकता है।',
 money:'पैसों की व्यवस्था इस दौर का एक विषय है। कोई बड़ा खर्च सोच रहे हों, तो देखें कि उसके बाद नियमित ज़रूरतों के लिए कितना बचेगा।',
 family:'परिवार में एक-दूसरे का सहारा बनने की बात उभरती है। अगर किसी अपने को मदद चाहिए, तो पूछें कि किस तरह की मदद उसके काम आएगी।',
 learning:'नया हुनर सीखने पर ध्यान जा सकता है। कुछ सीखना चाहते हों, तो ऐसा छोटा काम चुनें जिसमें उसे आज़मा सकें।'
};
const list=new Intl.ListFormat('hi');
const dates=new Intl.DateTimeFormat('hi-IN',{dateStyle:'long',timeZone:'Asia/Kolkata'});
const time={today:'आज',tomorrow:'कल',weekly:'इस सप्ताह'};
function rashiOverview(areas,view){
 const names={work:'कामकाज',money:'लेन-देन',relationships:'रिश्ते',wellbeing:'दिनचर्या'};
 const mentions=states=>list.format(areas.filter(a=>states.includes(a.publicState)).map(a=>names[a.id]));
 const support=list.format(areas.filter(a=>a.publicState==='support'&&!a.publicUncertain).map(a=>names[a.id])),care=mentions(['mixed','review']);
 const parts=[];
 if(support)parts.push(`${time[view]} ${support} से जुड़े तैयार काम आगे बढ़ाने की गुंजाइश है।`);
 if(care)parts.push(`${support?'वहीं':time[view]} ${care} से जुड़े फैसलों में पहले शर्तें और अपेक्षाएँ साफ़ करें।`);
 if(!parts.length)parts.push('किसी एक विषय को प्राथमिकता देने के लिए स्पष्ट गोचर संकेत उपलब्ध नहीं हैं।');
 if(areas.some(a=>a.publicUncertain))parts.push(uncertaintyNote);
 return {text:parts.join(' '),findingIds:[...new Set(areas.flatMap(a=>a.publicParagraphs[0].findingIds))]};
}
export function publicNatalSections(snapshot,sections,topics,findings){
 const current=periodAt(snapshot),focused=focusPeriodTopics(snapshot,topics,current),refsFor=id=>findings.filter(f=>f.topic===id).map(f=>f.id),p=(text,refs)=>({text,findingIds:refs});
 return sections.map(section=>{
  const refs=section.findingIds,paragraphs=[],f=section.synthesis;
  if(section.status!=='available')return {...section,publicTitle:topicTitles[section.id]||section.title,publicParagraphs:[]};
  if(section.id==='overview'&&snapshot.houses.length){paragraphs.push(p(focused.length?`इस समय की आपकी रीडिंग में ${list.format(focused.map(t=>focusNames[t.topic]))} को प्राथमिकता मिलती है। इनसे जुड़ी अधूरी बातों को स्पष्ट करना और निभाने योग्य योजना बनाना सबसे उपयोगी शुरुआत रहेगी।`:'आपकी रीडिंग में काम करने के ढंग, सीखने और संबंध निभाने की दिशा को अलग-अलग समझा गया है। नीचे पहले वह विषय पढ़ें जो आपकी वर्तमान परिस्थिति से जुड़ता है।',focused.length?focused.flatMap(t=>refsFor(t.topic)):refs));paragraphs.push(p('आगे हर विषय में उसका सरल अर्थ और ध्यान देने योग्य बात है। वर्तमान और आने वाली अवधि के हिस्से में समय के साथ बदलती प्राथमिकताएँ पढ़ सकते हैं।',refs));}
  else if(section.id==='appearance'&&snapshot.rising)paragraphs.push(p(manner[snapshot.rising-1][1],refs));
  else if(section.id==='personality'){const moon=snapshot.planets.find(p=>p.body==='Moon'&&p.stableSign);if(moon)paragraphs.push(p(temperament[moon.sign-1][1],refs));if(f)paragraphs.push(p(`अपनी क्षमता को काम में लाने का एक तरीका है: ${workStyle[f.lord]}। दबाव में अपनी पहली प्रतिक्रिया और थोड़ी देर बाद की राय अलग-अलग लिखकर देखें; इससे प्राथमिकता साफ करने में मदद मिल सकती है।`,refs));}
  else if(topicCopy[section.id]&&f){paragraphs.push(p(topicCopy[section.id][contextFor(f.lordHouse)],refs));if(section.id==='career')paragraphs.push(p(`इस पठन में काम करने का उपयोगी तरीका है: ${workStyle[f.lord]}। अपनी शिक्षा और अनुभव से तुलना करके ऐसे काम के उदाहरण खोजें जहाँ यह तरीका उपयोगी हो।`,refs));const timing=f.assessment==='current-support'?'PUBLIC_SUPPORT':f.assessment==='mixed-current-signals'?'PUBLIC_MIXED':f.assessment==='current-review'?'PUBLIC_REVIEW':null;if(timing)paragraphs.push(p(timingText[timing]+' '+periodActions[section.id],refs));}
  else if(section.id==='wellbeing')paragraphs.push(p('काम, आराम और रोज की जिम्मेदारियों के बीच अपनी वास्तविक जरूरतों को देखें। लगातार थकान महसूस हो तो कार्यक्रम में विराम और सहायता की जगह तलाशें। जन्मपत्री से किसी खास बीमारी की संभावना तय नहीं होती; स्वास्थ्य की चिंता का आधार वास्तविक लक्षण और चिकित्सकीय मूल्यांकन रहें।',refs));
  else if(section.id==='future'){
   const periods=snapshot.periods.flatMap(m=>m.subperiods.map(a=>({major:m.lord,minor:a.lord,start:a.start,end:a.end}))).filter(a=>Date.parse(a.end)>Date.parse(snapshot.at)).slice(0,3);
   let previous=null,previousRanked=null;
   for(const [i,period]of periods.entries()){
    const ranked=focusPeriodTopics(snapshot,topics,period),focus=ranked.map(t=>t.topic),id='period:'+i;
    if(!findings.some(f=>f.id===id))continue;
    const added=focus.filter(topic=>!previous?.includes(topic));
    const active=Date.parse(period.start)<=Date.parse(snapshot.at);
    const title=active?'वर्तमान अवधि':'आगामी अवधि';
    const lines=[`${title} · ${dates.format(new Date(period.start))} से ${dates.format(new Date(period.end))} तक ${bodyName(period.major,'hi')} की महादशा में ${bodyName(period.minor,'hi')} की अंतर्दशा ${active?'चल रही है':'रहेगी'}।`];
    const label=ids=>list.format(ids.map(id=>focusNames[id]));
    if(added.length){
     for(const topic of added)lines.push(periodReading[topic]);
     const lead=ranked.find(item=>item.topic===added[0]);
     const connection=lead.connections.find(item=>item.body===period.minor)||lead.connections[0];
     const link=connection.links[0];
     const houses=['पहले','दूसरे','तीसरे','चौथे','पाँचवें','छठे','सातवें','आठवें','नौवें','दसवें','ग्यारहवें','बारहवें'];
     const house=houses[link.house-1]+' भाव',planet=bodyName(connection.body,'hi');
     const basis=link.kind==='ruler'?`${planet} जन्मकुंडली के ${house} के स्वामी हैं`:link.kind==='occupant'?`${planet} जन्मकुंडली के ${house} में हैं`:`जन्मकुंडली के ${house} पर ${planet} की दृष्टि है`;
     lines.push(`${focusNames[lead.topic]} का संकेत इसलिए लिया गया है क्योंकि ${basis}।`);
    }else{
     lines.push(periodNarrative(focus,previous,'hi',label));
     const basis=changedPeriodBasis(ranked,previousRanked,period.minor,'hi',label);
     if(basis)lines.push(basis);
    }
    paragraphs.push(p(lines.join(' '),[id]));
    previous=focus;
    previousRanked=ranked;
   }
  }
  return {...section,publicTitle:topicTitles[section.id]||section.title,publicParagraphs:paragraphs};
 });
}

// A general Rashi report uses actual observed states, not a fabricated life event.
const uncertaintyNote='\u0915\u0941\u091b \u0938\u0902\u0915\u0947\u0924\u094b\u0902 \u0915\u093e \u0906\u0927\u093e\u0930 \u0905\u092d\u0940 \u0905\u0928\u093f\u0936\u094d\u091a\u093f\u0924 \u0939\u0948; \u0907\u0938\u0947 \u0938\u094d\u092a\u0937\u094d\u091f \u0905\u0928\u0941\u0915\u0942\u0932 \u092f\u093e \u092a\u094d\u0930\u0924\u093f\u0915\u0942\u0932 \u092b\u0932 \u0928 \u092e\u093e\u0928\u0947\u0902\u0964';
const transitCopy={
 work:{support:'आज काम को आगे बढ़ाने के लिए स्पष्ट जिम्मेदारी और नियमित प्रयास पर ध्यान दे सकते हैं। लंबित काम का अगला कदम तय करें और जरूरी बातचीत को ठोस प्रश्न के साथ शुरू करें।',mixed:'काम आगे बढ़ाने की गुंजाइश और कुछ बातों को दोबारा जाँचने की जरूरत साथ है। नया काम लें तो समय, अपेक्षा और दूसरे पर निर्भर हिस्से पहले स्पष्ट कर लें।',review:'काम में पहले अटकी शर्तें और अधूरे हिस्से साफ करना उपयोगी रहेगा। जवाब या सहयोग पर निर्भर काम में पुष्टि लें; अतिरिक्त जिम्मेदारी लेने से पहले मौजूदा काम की स्थिति देखें।',neutral:'काम के बारे में एकतरफा अनुकूल या प्रतिकूल निष्कर्ष का पर्याप्त आधार नहीं है। अपने वास्तविक काम से शुरुआत करें: सबसे जरूरी लंबित काम चुनें, उसे पूरा करने की बाधा पहचानें और अगला छोटा कदम तय करें।',uncertain:'काम के संकेत साफ नहीं हैं, इसलिए बड़े अवसर या रुकावट का दावा नहीं किया गया है। उपलब्ध जानकारी जुटाएँ और जिस निर्णय को बदला जा सकता है, उसी से शुरुआत करें।'},
 money:{support:'पैसे की व्यवस्था सँभालने के लिए हिसाब साफ करने और तय भुगतान पूरा करने पर ध्यान दे सकते हैं। उपलब्ध रकम, देय रकम और बचत अलग देखकर योजना बनाएँ।',mixed:'आर्थिक विषय में सहयोगी और सावधानी वाले पक्ष साथ हैं। कोई नया खर्च या साझा भुगतान तय करने से पहले कुल लागत और वापसी की शर्त साफ रखें।',review:'भुगतान, खर्च या समझौते की अधूरी शर्तें पहले जाँचें। अपेक्षित रकम हाथ में आए बिना उसे जरूरी खर्च के लिए उपलब्ध न मानें।',neutral:'आर्थिक लाभ या नुकसान का साफ संकेत उपलब्ध नहीं है। आज का उपयोग वास्तविक हिसाब देखने में करें—कितना उपलब्ध है, कितना देना है और कौन-सा खर्च टाला जा सकता है।',uncertain:'पैसे से जुड़े संकेत अनिश्चित हैं। अधूरी जानकारी पर बड़ा वादा करने के बजाय रकम, तारीख और शर्तों की पुष्टि करें।'},
 relationships:{support:'परिवार या साथी के साथ जरूरी बात साफ और शांत ढंग से रखने पर ध्यान दे सकते हैं। केवल अपनी बात कहने के साथ सामने वाले की जरूरत भी पूछें और कोई छोटा निभाने योग्य समझौता तय करें।',mixed:'बातचीत में जुड़ाव की इच्छा और अलग अपेक्षाएँ साथ आ सकती हैं। किसी एक जवाब का अर्थ खुद तय न करें; समय लेकर जरूरत और जिम्मेदारी स्पष्ट करें।',review:'अधूरी बात या अनुमान पर प्रतिक्रिया देने से पहले पूछकर समझना उपयोगी रहेगा। एक साथ पुराने सारे मुद्दे खोलने के बजाय एक बात पर शांत बातचीत करें।',neutral:'किसी अपने के व्यवहार या रिश्ते की दिशा का निश्चित संकेत नहीं है। वास्तविक बातचीत को आधार बनाएँ और जिस अपेक्षा पर बात नहीं हुई है, उसे स्पष्ट शब्दों में रखें।',uncertain:'संबंधों के बारे में अधिक विशिष्ट निष्कर्ष का आधार साफ नहीं है। किसी की मंशा तय करने से पहले उसका पक्ष सुनें और जल्दबाजी में निर्णय टालें।'},
 wellbeing:{support:'दिन के कार्यक्रम में जरूरी काम के साथ विराम की जगह रखें। अपनी ऊर्जा का अंदाजा वास्तविक अनुभव से लगाएँ और दिनचर्या को निभाने योग्य रखें।',mixed:'काम की जरूरत और आराम की जरूरत में संतुलन देखें। जो काम आज जरूरी है उसे चुनें और बाकी के लिए समय तय करें, ताकि कार्यक्रम अनावश्यक रूप से न भरे।',review:'रोज के कार्यक्रम को हल्का और स्पष्ट रखना उपयोगी रहेगा। काम बाँटने या सहायता लेने की जगह देखें; अपनी वास्तविक थकान को अनदेखा न करें।',neutral:'सेहत का आकलन इस राशि-पठन से नहीं होता। अपनी वास्तविक दिनचर्या, आराम और काम के दबाव को देखकर जरूरी बदलाव तय करें।',uncertain:'इन संकेतों से स्वास्थ्य की स्थिति का निष्कर्ष नहीं निकलता। अपनी वास्तविक जरूरत पर ध्यान दें; कोई स्वास्थ्य चिंता हो तो चिकित्सकीय सलाह को आधार बनाएँ।'}
};
const houseThemes=['अपनी पहल','आय-व्यय','छोटे प्रयास और संपर्क','घर की ज़िम्मेदारियाँ','रचनात्मक काम','लंबित दायित्व','साझेदारी','साझा संसाधन','मार्गदर्शन','काम की भूमिका','सहयोग','आराम और तैयारी'];
const localizedHouses={
 en:['personal initiative','income and spending','communication','home responsibilities','creative work','outstanding obligations','partnerships','shared resources','learning and guidance','your role at work','collaboration','rest and preparation'],
 gu:['પોતાની પહેલ','આવક અને ખર્ચ','વાતચીત','ઘરની જવાબદારીઓ','સર્જનાત્મક કામ','બાકી જવાબદારીઓ','ભાગીદારી','સહિયારા સંસાધનો','શીખવું અને માર્ગદર્શન','કામમાં પોતાની ભૂમિકા','સહકાર','વિશ્રામ અને તૈયારી']
};
export function leadingTransit(related,state,view,language='hi'){
 const vocabulary=localizedHouses[language]||houseThemes;
 function strongest(status){
  let best=null;
  for(const finding of related){
   const samples=finding.observations?.filter(o=>o.status===status&&!o.nearBoundary&&vocabulary[o.house-1])||[];
   if(samples.length&&(!best||samples.length>best.samples.length))best={finding,samples};
  }
  if(!best)return null;
  const themes=new Intl.ListFormat(language).format([...new Set(best.samples.map(o=>vocabulary[o.house-1]))]);
  return {planet:bodyName(best.finding.body,language),themes,samples:best.samples};
 }
 const support=['support','mixed'].includes(state)?strongest('supportive'):null;
 const care=['review','mixed'].includes(state)?strongest('obstructed'):null;
 if(!support&&!care)return '';
 if(view==='weekly'&&support&&care&&support.planet===care.planet){
  const before=(left,right)=>Math.max(...left.samples.map(o=>Date.parse(o.at)))<Math.min(...right.samples.map(o=>Date.parse(o.at)));
  const supportFirst=before(support,care);
  if(supportFirst||before(care,support)){
   const later=supportFirst?care:support,earlier=supportFirst?support:care;
   const when=new Intl.DateTimeFormat(language,{month:'short',day:'numeric',timeZone:'Asia/Kolkata'}).format(Math.min(...later.samples.map(o=>Date.parse(o.at))));
   if(language==='hi')return `सप्ताह की शुरुआती गणनाओं में ${earlier.planet} का गोचर ${earlier.themes} के लिए ${supportFirst?'अनुकूल':'सावधानी का संकेत देता'} दिखता है। ${when} की गणना में ${later.themes} को लेकर ${supportFirst?'सावधानी':'अनुकूलता'} का संकेत मिलता है।`;
   if(language==='gu')return `અગાઉની ગણતરીમાં ${earlier.planet}નો ગોચર ${earlier.themes} અંગે ${supportFirst?'અનુકૂળતા':'સાવચેતી'} સૂચવે છે. ${when}ની ગણતરીમાં ${later.themes} અંગે ${supportFirst?'સાવચેતી':'અનુકૂળતા'} દેખાય છે.`;
   return `Earlier observations of ${earlier.planet} suggest ${supportFirst?'support':'caution'} around ${earlier.themes}. The observation on ${when} points to ${supportFirst?'caution':'support'} around ${later.themes}.`;
  }
 }
 const same=support&&care&&support.planet===care.planet&&support.themes===care.themes;
 if(language==='en'){
  if(same)return `Across the period, the ${care.planet} observations give a mixed picture for ${care.themes}.`;
  return [support&&`The ${support.planet} transit points to support with ${support.themes}.`,care&&`${support?'At the same time, the':'The'} ${care.planet} transit calls for care with ${care.themes}.`].filter(Boolean).join(' ');
 }
 if(language==='gu'){
  if(same)return `${care.themes} અંગે ${care.planet}ના ગોચરમાં અનુકૂળતા અને સાવચેતી બંનેના સંકેત મળે છે.`;
  return [support&&`${support.planet}ના ગોચરમાં ${support.themes} માટે અનુકૂળતા દેખાય છે.`,care&&`${support?'બીજી તરફ, ':''}${care.planet}નો ગોચર ${care.themes} અંગે સાવચેતી સૂચવે છે.`].filter(Boolean).join(' ');
 }
 if(same)return `${time[view]} ${care.planet} के गोचर में ${care.themes} को लेकर मिले-जुले संकेत हैं।`;
 return [support&&`${time[view]} ${support.planet} का गोचर ${support.themes} के लिहाज़ से अनुकूल दिखता है।`,care&&`${support?'दूसरी ओर, ':time[view]+' '}${care.planet} का गोचर ${care.themes} से जुड़े मामलों में सावधानी का संकेत देता है।`].filter(Boolean).join(' ');
}
export function publicRashiSections(sections,findings,view='today'){
 const areas=sections.filter(s=>s.id!=='overall').map(section=>{
  const findingIds=[...new Set(section.paragraphs.flatMap(p=>p.findingIds))];
  const related=findings.filter(f=>findingIds.includes(f.id));
  const support=related.some(f=>f.counts.supportive>0);
  const blocked=related.some(f=>f.counts.obstructed>0);
  const uncertain=related.some(f=>f.counts.uncertain+f.counts['rule-unresolved']>0);
  const state=support&&blocked?'mixed':blocked?'review':support?'support':uncertain?'uncertain':'neutral';
  const advice=transitCopy[section.id][state].replaceAll('आज',time[view]).replace('दिन के कार्यक्रम',view==='weekly'?'सप्ताह के कार्यक्रम':'दिन के कार्यक्रम');
  const basis=leadingTransit(related,state,view);
  const adviceStart=advice.indexOf('। ');
  const action=basis&&adviceStart>=0?advice.slice(adviceStart+2):advice;
  const text=[basis,action,uncertain&&state!=='uncertain'?uncertaintyNote:''].filter(Boolean).join(' ');
  return {...section,publicTitle:section.title,publicState:state,publicUncertain:uncertain,publicParagraphs:[{text,findingIds}]};
 });
 const title={today:'आज की दिशा',tomorrow:'कल की दिशा',weekly:'सप्ताह की दिशा'}[view];
 return [{...sections[0],publicTitle:title,publicParagraphs:[rashiOverview(areas,view)]},...areas];
}
