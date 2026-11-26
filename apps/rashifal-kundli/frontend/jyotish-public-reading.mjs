import {periodAt,focusPeriodTopics} from './jyotish-synthesis.mjs';
import {manner,temperament} from './kundli-consultation-copy.mjs';
import {bodyName,signName} from './locale.mjs';
export const publicReadingVersion='public-consultation-5';
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
const topicTitles={overview:'आपकी रीडिंग का सार',appearance:'पहली छाप और अभिव्यक्ति',personality:'स्वभाव और निर्णय लेने का ढंग',learning:'पढ़ाई और कौशल',career:'काम और करियर',money:'पैसे और जिम्मेदारियाँ',relationships:'प्रेम और साझेदारी',family:'परिवार और सहयोग',wellbeing:'दिनचर्या और सेहत',home:'घर और स्थान-परिवर्तन',spirituality:'चिंतन और जीवन-दृष्टि',future:'वर्तमान और आने वाली अवधि'};
const focusNames={learning:'नए कौशल',career:'काम की ज़िम्मेदारियाँ',money:'पैसों की व्यवस्था',relationships:'साझेदारी',family:'पारिवारिक सहयोग',home:'रहने की व्यवस्था',spirituality:'गहन अध्ययन'};
const houseNames=['पहले','दूसरे','तीसरे','चौथे','पाँचवें','छठे','सातवें','आठवें','नौवें','दसवें','ग्यारहवें','बारहवें'];
const houseContexts=['अपनी पहल','पारिवारिक संसाधनों','संवाद और अभ्यास','घर के माहौल','रचनात्मकता और पढ़ाई','सेवा और रोज़ के काम','साझेदारी','शोध और साझा संसाधनों','उच्च शिक्षा और मार्गदर्शन','पेशेवर दायित्वों','संपर्कों और सामूहिक प्रयासों','निजी तैयारी और दूरस्थ काम'];
const periodMeanings={home:'घर और घरेलू ज़िम्मेदारियाँ',spirituality:'उच्च अध्ययन और जीवन-दृष्टि',career:'पेशेवर दायित्व',relationships:'साझेदारी और आपसी समझौते',money:'बचत और पारिवारिक संसाधन',family:'परिवार की ज़िम्मेदारियाँ',learning:'पढ़ाई और रचनात्मक काम'};
function explainPeriodTopic(topic,minor){
 const connection=topic.connections.find(item=>item.body===minor)||topic.connections[0];
 const link=connection.links[0],house=houseNames[link.house-1]+' भाव',planet=bodyName(connection.body,'hi');
 const basis=link.kind==='ruler'?`${planet} आपकी जन्मकुंडली के ${house} के स्वामी हैं`:link.kind==='occupant'?`${planet} आपकी जन्मकुंडली के ${house} में स्थित हैं`:`${planet} की दृष्टि आपकी जन्मकुंडली के ${house} पर है`;
 return `${basis}। ${periodOutlook[topic.topic]}`;
}
const periodOutlook={
 home:'इस दौर में घर की व्यवस्था या परिवार की घरेलू ज़िम्मेदारियाँ अधिक समय ले सकती हैं।',
 spirituality:'पढ़ाई को आगे बढ़ाने, किसी मार्गदर्शक से जुड़ने या अपने पुराने विचारों पर फिर सोचने की प्रवृत्ति उभर सकती है।',
 career:'काम में आपकी भूमिका और आपके हिस्से की ज़िम्मेदारियाँ इस दौर का प्रमुख विषय बन सकती हैं।',
 relationships:'साझा काम और निजी रिश्तों में फैसले लेते समय साथी की भूमिका अधिक अहम हो सकती है।',
 money:'आमदनी में से कितना संचित हो पाता है और परिवार के संसाधन कैसे बँटते हैं, इन बातों का महत्व बढ़ सकता है।',
 family:'इस दौर में परिवार के संसाधनों और उनसे जुड़ी ज़िम्मेदारियों में आपकी भागीदारी बढ़ सकती है।',
 learning:'किसी विषय में गहरी रुचि लेने या अपनी कल्पना को पढ़ाई और रचनात्मक काम में लगाने का रुझान उभर सकता है।'
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
 const current=periodAt(snapshot),focused=focusPeriodTopics(snapshot,topics,current),p=(text,refs)=>({text,findingIds:refs});
 return sections.map(section=>{
  const refs=section.findingIds,paragraphs=[],f=section.synthesis;
  if(section.status!=='available')return {...section,publicTitle:topicTitles[section.id]||section.title,publicParagraphs:[]};
  if(section.id==='overview'&&snapshot.houses.length){
   const identity=`आपका लग्न ${signName(snapshot.rising,'hi')} है।`;
   const summary=focused.length?` ${bodyName(current.major,'hi')} की महादशा और ${bodyName(current.minor,'hi')} की अंतर्दशा में प्रमुख विषय हैं — ${list.format(focused.map(t=>focusNames[t.topic]))}।`:'';
   paragraphs.push(p(identity+summary,refs));
  }
  else if(section.id==='appearance'&&snapshot.rising)paragraphs.push(p(`आपका लग्न ${signName(snapshot.rising,'hi')} है। `+manner[snapshot.rising-1][1],refs));
  else if(section.id==='personality'){const moon=snapshot.planets.find(p=>p.body==='Moon'&&p.stableSign);if(moon)paragraphs.push(p(`जन्म के समय चंद्रमा ${signName(moon.sign,'hi')} राशि में थे। `+temperament[moon.sign-1][1],refs));}
  else if(periodMeanings[section.id]&&f){
   const placement=`${houseNames[f.house-1]} भाव के स्वामी ${bodyName(f.lord,'hi')} आपकी कुंडली के ${houseNames[f.lordHouse-1]} भाव में हैं।`;
   const meaning=f.house===f.lordHouse?`स्वामी के अपने ही भाव में होने से इस विषय का अपना आधार मिलता है — ${periodMeanings[section.id]}।`:`इस योग में ${periodMeanings[section.id]} का संबंध ${houseContexts[f.lordHouse-1]} से बनता है।`;
   paragraphs.push(p(placement+' '+meaning,refs));
   if(section.id==='career')paragraphs.push(p(`${bodyName(f.lord,'hi')} के स्वभाव से काम करने की यह प्रवृत्ति जुड़ती है — ${workStyle[f.lord]}।`,refs));
  }
  else if(section.id==='wellbeing')paragraphs.push(p('इस पठन में स्वास्थ्य के लिए व्यक्तिगत रोग या उसके समय का आकलन उपलब्ध नहीं है।',refs));
  else if(section.id==='future'){
   const periods=snapshot.periods.flatMap(m=>m.subperiods.map(a=>({major:m.lord,minor:a.lord,start:a.start,end:a.end}))).filter(a=>Date.parse(a.end)>Date.parse(snapshot.at)).slice(0,3);
   let previous=null;
   for(const [i,period]of periods.entries()){
    const ranked=focusPeriodTopics(snapshot,topics,period),focus=ranked.map(t=>t.topic),id='period:'+i;
    if(!findings.some(f=>f.id===id))continue;
    const added=focus.filter(topic=>!previous?.includes(topic));
    const active=Date.parse(period.start)<=Date.parse(snapshot.at);
    const title=active?'वर्तमान अवधि':'आगामी अवधि';
    const lines=[`${title} · ${dates.format(new Date(period.start))} से ${dates.format(new Date(period.end))} तक ${bodyName(period.major,'hi')} की महादशा में ${bodyName(period.minor,'hi')} की अंतर्दशा ${active?'चल रही है':'रहेगी'}।`];
    const label=ids=>list.format(ids.map(id=>focusNames[id]));
    if(added.length){
     for(const topic of ranked.filter(item=>added.includes(item.topic)))lines.push(explainPeriodTopic(topic,period.minor));
    }else{
     lines.push(periodNarrative(focus,previous,'hi',label));
     if(ranked.length)lines.push(explainPeriodTopic(ranked[0],period.minor));
    }
    paragraphs.push(p(lines.join(' '),[id]));
    previous=focus;
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
