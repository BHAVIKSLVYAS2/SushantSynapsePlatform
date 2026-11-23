import {signRulers} from './kundli-reading.mjs';
import {bodyName,signName} from './locale.mjs';
import {temperament,manner} from './kundli-consultation-copy.mjs';

// Factual whole-sign predicates and original editorial interpretation. None of
// these predicates is a probability, a full strength judgement or a diagnosis.
export const synthesisVersion='natal-period-transit-hi-2';
export const synthesisSource={title:'Phaladeepika',url:'https://www.panchanga.lv/wp-content/uploads/2020/06/Phaladipika_Shri-Mantreswara.pdf',scope:'ch.1 sign dignity and full aspects; editorial synthesis is separately authored'};
const exalted={Sun:1,Moon:2,Mars:10,Mercury:6,Jupiter:4,Venus:12,Saturn:7};
const named=b=>bodyName(b,'hi');
const aspectName={3:'तीसरी',4:'चौथी',5:'पाँचवीं',7:'सातवीं',8:'आठवीं',9:'नौवीं',10:'दसवीं'};
export const fullAspectOffsets=body=>!Object.hasOwn(exalted,body)?[]:body==='Mars'?[4,7,8]:body==='Jupiter'?[5,7,9]:body==='Saturn'?[3,7,10]:[7];
export const aspectsHouse=(p,house)=>Number.isInteger(p?.house)&&fullAspectOffsets(p.body).includes((house-p.house+12)%12+1);
export function signCondition(body,sign){
 if(!Object.hasOwn(exalted,body)||!Number.isInteger(sign)||sign<1||sign>12)return 'unclassified';
 if(sign===exalted[body])return 'exalted';
 if(sign===(exalted[body]+5)%12+1)return 'debilitated';
 return signRulers[sign-1]===body?'own':'ordinary';
}
export function periodAt(snapshot,at=snapshot.at){
 const instant=Date.parse(at);if(!Number.isFinite(instant))return null;
 for(const m of snapshot.periods){if(Date.parse(m.start)<=instant&&instant<Date.parse(m.end))for(const a of m.subperiods)if(Date.parse(a.start)<=instant&&instant<Date.parse(a.end))return {major:m.lord,minor:a.lord,start:a.start,end:a.end};}
 return null;
}
export function periodConnections(snapshot,houses,period){
 return [...new Set([period?.major,period?.minor].filter(Boolean))].map(body=>{
  const planet=snapshot.planets.find(p=>p.body===body),links=[];
  if(planet?.house)for(const number of houses){const h=snapshot.houses.find(h=>h.number===number);if(h?.ruler===body)links.push({kind:'ruler',house:number});if(planet.house===number)links.push({kind:'occupant',house:number});if(aspectsHouse(planet,number))links.push({kind:'aspect',house:number,offset:(number-planet.house+12)%12+1});}
  return {body,links};
 }).filter(p=>p.links.length);
}
export function topicFactors(snapshot,topic,period=periodAt(snapshot)){
 const house=snapshot.houses.find(h=>h.number===topic.houses[0]),lord=snapshot.planets.find(p=>p.body===house?.ruler);if(!house||!lord?.house)return null;
 const dispositor=snapshot.planets.find(p=>p.body===signRulers[lord.sign-1]);
 const d9=snapshot.divisions?.d9?.find(p=>p.body===lord.body);
 const aspects=snapshot.planets.filter(p=>aspectsHouse(p,house.number)).map(p=>({body:p.body,from:p.house,offset:(house.number-p.house+12)%12+1}));
 const condition=signCondition(lord.body,lord.sign),division=d9?{sign:d9.sign,condition:signCondition(lord.body,d9.sign),sameSign:d9.sign===lord.sign}:null;
 const connections=periodConnections(snapshot,topic.houses,period);
 const relatedBodies=[...new Set([lord.body,...connections.map(p=>p.body)])];
 const transits=snapshot.currentTransit?.status==='available'?snapshot.currentTransit.rows.filter(p=>relatedBodies.includes(p.body)):[];
 const supportive=[],attention=[];
 if(condition==='own'||condition==='exalted')supportive.push('natal-'+condition);
 if(condition==='debilitated')attention.push('natal-debilitated');
 if([6,8,12].includes(lord.house))attention.push('lord-in-demanding-house');
 if(division?.condition==='own'||division?.condition==='exalted')supportive.push('d9-'+division.condition);
 if(division?.condition==='debilitated')attention.push('d9-debilitated');
 const balance=supportive.length&&attention.length?'mixed':attention.length?'attention':supportive.length?'supported':'ungraded',current=transits.find(p=>p.body===lord.body),currentSupport=current?.status==='supportive',currentObstruction=current?.status==='obstructed';
 const assessment=!connections.length?'natal-only':(attention.length&&currentSupport)||(supportive.length&&currentObstruction)||balance==='mixed'?'mixed-current-signals':attention.length||currentObstruction?'current-review':currentSupport?'current-support':'active-ungraded';
 return {house:house.number,lord:lord.body,lordHouse:lord.house,condition,division,occupants:snapshot.planets.filter(p=>p.house===house.number).map(p=>p.body),colocated:snapshot.planets.filter(p=>p.house===lord.house&&p.body!==lord.body).map(p=>p.body),aspects,exchange:dispositor&&dispositor.body!==lord.body&&signRulers[dispositor.sign-1]===lord.body?{body:dispositor.body,house:dispositor.house}:null,period,connections,transits,supportive,attention,balance,assessment};
}

// Destination groups describe the connection, not whether an event will happen.
const groupFor=h=>[1,4,7,10].includes(h)?'visible':[2,11].includes(h)?'resources':[3,6].includes(h)?'practice':[5,9].includes(h)?'learning':'preparation';
const readings={
 career:{visible:'काम में अपनी भूमिका साफ रखने, जिम्मेदारी लेने और लोगों के साथ सीधे काम करने की दिशा प्रमुख बनती है। केवल पद के बजाय यह देखें कि आपका निर्णय और काम कितनी स्पष्टता से सामने आता है।',resources:'पेशेवर दिशा का संबंध ज्ञान या कौशल को उपयोगी सेवा में बदलने, आय की व्यवस्था और सहयोगियों के नेटवर्क से बनता है। अवसर को टिकाऊ काम में बदलने के लिए भरोसा और निरंतर गुणवत्ता अहम रहेंगे।',practice:'करियर में नियमित अभ्यास, सेवा, समस्या सुलझाने और काम की प्रक्रिया सुधारने का पक्ष प्रमुख है। केवल बड़े अवसर का इंतजार करने के बजाय रोज के काम से अपनी क्षमता दिखाना अधिक उपयोगी दिशा है।',learning:'काम की दिशा में अध्ययन, सलाह, प्रशिक्षण या विशेषज्ञता की भूमिका उभरती है। अपनी रुचि को वास्तविक योग्यता और काम के नमूनों से जोड़ें; इससे किसी एक पेशे का निश्चित चुनाव नहीं निकलता।',preparation:'पेशेवर दिशा में तैयारी, शोध, साझा संसाधनों या पर्दे के पीछे की जिम्मेदारियों का संबंध अधिक है। अस्पष्ट भूमिकाओं और अचानक बड़े बदलावों के बजाय शर्तें स्पष्ट कर क्रम से आगे बढ़ना उपयोगी होगा।'},
 money:{visible:'आर्थिक जीवन का संबंध अपने निर्णय, घर या साझेदारी और काम की जिम्मेदारियों से बनता है। खर्च या आय की योजना में इन प्रतिबद्धताओं को साथ रखें।',resources:'संग्रह और संपर्कों का विषय एक साथ आता है। आय को बचत में बदलने, देय भुगतान अलग रखने और सहयोग की शर्तें स्पष्ट करने पर ध्यान देना उपयोगी रहेगा।',practice:'संसाधनों का संबंध अपने प्रयास, सेवा या रोज के काम से बनता है। छोटे नियमित सुधार और खर्च की निगरानी, किसी एक बड़े लाभ की उम्मीद से अधिक उपयोगी आधार हैं।',learning:'धन का विषय सीखने, सलाह और दीर्घकालीन समझ से जुड़ता है। प्रशिक्षण या रचनात्मक काम पर खर्च को उद्देश्य और वहन करने की क्षमता के साथ परखें।',preparation:'आर्थिक विषय में खर्च, साझा दायित्व या अनिश्चित शर्तों की भूमिका है। नकदी की उपलब्धता, दस्तावेज और आपात जरूरतों की तैयारी को प्राथमिकता दें।'},
 relationships:{visible:'संबंधों में सीधे संवाद, समान भागीदारी और निजी भूमिका का प्रश्न प्रमुख है। साथ रहने की अपेक्षा और स्वतंत्र निर्णय की जरूरत दोनों को साफ शब्दों में रखना उपयोगी रहेगा।',resources:'साझेदारी का संबंध परिवार, संसाधनों और साझा लक्ष्यों से बनता है। पैसे या परिवार की जिम्मेदारियों पर मौन सहमति मानने के बजाय पहले स्पष्ट बातचीत करें।',practice:'संबंध निभाने में रोज का व्यवहार, समय देना और छोटी बातों पर प्रतिक्रिया अधिक मायने रखती है। असहमति को जीत-हार बनाने के बजाय संभालने का तरीका तय करें।',learning:'साझेदारी में विचार, मूल्य और एक-दूसरे से सीखने का पक्ष उभरता है। साझा रुचियाँ मदद कर सकती हैं, लेकिन सोच का मेल अपने आप सभी अपेक्षाओं का मेल नहीं है।',preparation:'संबंधों में निजी समय, साझा जिम्मेदारी या दूरी की जरूरत पर स्पष्टता जरूरी हो सकती है। अस्पष्टता को किसी के चरित्र या अलगाव का प्रमाण न मानें; अपेक्षाएँ पूछकर समझें।'},
 learning:{visible:'सीखने का संबंध अभ्यास को सामने रखने, परिचित वातावरण और दूसरों के साथ काम करने से बनता है। केवल पढ़ने के साथ प्रस्तुति, चर्चा और वास्तविक प्रतिक्रिया को जगह दें।',resources:'ज्ञान को शब्दों, उपयोगी कौशल और सहयोगी समूह में व्यक्त करना इस अध्ययन की मुख्य दिशा है। सीखने की प्रगति को छोटे काम और स्पष्ट परिणाम से परखें।',practice:'सीखने में छोटे नियमित अभ्यास और कठिन हिस्से पर दोबारा काम करने का पक्ष प्रमुख है। लंबे अंतराल वाली तैयारी के बजाय दोहराव और सुधार की व्यवस्था उपयोगी रहेगी।',learning:'शिक्षा में विचार की गहराई, जिज्ञासा, रचनात्मकता और मार्गदर्शन का संबंध उभरता है। अपनी रुचि को व्यवस्थित पाठ्यक्रम और काम के नमूनों से जोड़ना उपयोगी है।',preparation:'पढ़ाई में एकांत तैयारी, शोध या जटिल विषय को खोलने की भूमिका हो सकती है। अस्पष्ट लक्ष्य को छोटे हिस्सों में बाँटें और समझ की जाँच करते रहें।'},
 personality:{visible:'अपनी बात सामने रखने और अलग परिस्थितियों में भूमिका निभाने का पक्ष प्रमुख है। निजी जरूरत और बाहरी अपेक्षा में फर्क पहचानना निर्णयों को अधिक स्पष्ट बना सकता है।',resources:'व्यवहार में भरोसे, परिचित मूल्यों और समूह से जुड़ाव का संदर्भ अधिक है। यह देखना उपयोगी है कि अपनी राय रखते समय अपनापन बनाए रखने की कितनी जरूरत महसूस होती है।',practice:'अपनी पहल को संवाद और लगातार प्रयास में व्यक्त करने का पक्ष उभरता है। जल्दी प्रतिक्रिया देने के बजाय बात को क्रम में रखना और काम पूरा करना उपयोगी अभ्यास है।',learning:'स्वभाव के अध्ययन में विचार, सीखने और अर्थ खोजने की दिशा अधिक सामने आती है। अपनी धारणा को अनुभव और दूसरों की प्रतिक्रिया से परखते रहना उपयोगी रहेगा।',preparation:'निजी तैयारी, भीतर सोचने और जटिल परिस्थितियों को समझने का पक्ष प्रमुख है। अपने विचार स्पष्ट करने के लिए समय रखें, लेकिन अनुमान को दूसरे व्यक्ति की मंशा न मानें।'},
 family:{visible:'परिवार और सामाजिक जीवन में अपनी भूमिका तथा घर और काम की अपेक्षाओं का संतुलन प्रमुख विषय है। किस जिम्मेदारी में किसका योगदान है, यह स्पष्ट करना उपयोगी रहेगा।',resources:'परिवार, वाणी, संसाधन और सामाजिक सहयोग के बीच सीधा संबंध उभरता है। सहयोग को सहज मान लेने के बजाय जरूरत, सीमा और जिम्मेदारी पर खुलकर बात करें।',practice:'परिवार में छोटे नियमित संपर्क और दैनिक जिम्मेदारियों का महत्व अधिक है। बड़े अवसरों पर ही साथ देने के बजाय व्यवहार में निरंतरता उपयोगी रहेगी।',learning:'परिवार और समूह में विचार, सलाह और साझा मूल्यों का विषय उभरता है। अलग राय को व्यक्ति के प्रति असम्मान समझने के बजाय उसका कारण जानें।',preparation:'पारिवारिक विषय में निजी सीमा, दूरी या साझा दायित्व का संदर्भ है। किसी रिश्तेदार के व्यवहार का अनुमान लगाने के बजाय उपलब्ध जानकारी और स्पष्ट सहमति से आगे बढ़ें।'},
 home:{visible:'घर और रहने की व्यवस्था का संबंध अपनी भूमिका, साझेदारी और काम से बनता है। सुविधा के साथ दैनिक आवागमन और साझा जिम्मेदारियों को भी निर्णय में रखें।',resources:'रहने की प्राथमिकताओं का संबंध परिवार, उपलब्ध संसाधनों और सहयोग से है। संपत्ति या स्थान बदलने की योजना में वास्तविक बजट और सहायता की स्पष्टता जरूरी रहेगी।',practice:'घर और यात्रा के विषय में रोज की सुविधा, दस्तावेज और काम की व्यवस्था पर ध्यान देना उपयोगी है। छोटे व्यावहारिक सुधार बड़े निर्णय से पहले स्थिति स्पष्ट कर सकते हैं।',learning:'घर से जुड़े विषय में अध्ययन, मार्गदर्शन या व्यापक अनुभव का संबंध उभरता है। यह यात्रा या विदेश-निवास की पुष्टि नहीं, रहने की प्राथमिकताओं को समझने का संदर्भ है।',preparation:'स्थान, निजी तैयारी और खर्च का विषय साथ आता है। स्थान-परिवर्तन से पहले लागत, कागजात और मौजूदा जिम्मेदारियों की जाँच को पर्याप्त समय दें।'},
 spirituality:{visible:'मूल्यों को रोज के व्यवहार और जिम्मेदारियों में उतारने का विषय प्रमुख है। अपनी मान्यताओं और वास्तविक निर्णयों में कितना मेल है, यह देखना उपयोगी रहेगा।',resources:'चिंतन का संबंध परिवार से मिले मूल्यों, वाणी और समूह के साथ योगदान से बनता है। केवल किसी पहचान के बजाय अपने व्यवहार में उन मूल्यों का अर्थ देखें।',practice:'नियमित अभ्यास और सेवा के जरिए चिंतन को जीवन में जगह देने का संदर्भ है। छोटा लेकिन निरंतर अभ्यास, बड़े संकल्प से अधिक निभाने योग्य हो सकता है।',learning:'अध्ययन, मार्गदर्शन और जीवन-दृष्टि इस विषय की मुख्य दिशा हैं। प्रश्न पूछने और अपने अनुभव से समझ बनाने की जगह रखें।',preparation:'एकांत, निजी चिंतन और अनावश्यक व्यस्तता से जगह निकालने का विषय अधिक है। इसका रूप आपकी अपनी आस्था और सुविधा से तय होगा।'},
 wellbeing:{visible:'दिनचर्या में काम, घर और दूसरों की अपेक्षाओं के बीच अपने आराम की जगह देखना उपयोगी है। यह जन्मपत्री से निकला बीमारी का जोखिम या स्वास्थ्य-स्थिति का माप नहीं है।',resources:'दैनिक जिम्मेदारियों और उपलब्ध समय-संसाधनों के साथ अपनी दिनचर्या की समीक्षा करें। ग्रह-स्थिति से भोजन-संबंधी रोग या किसी अंग की बीमारी का निष्कर्ष नहीं निकलता।',practice:'इस भाग का उपयोग काम के नियमित क्रम, विराम और वास्तविक थकान पर ध्यान देने के लिए करें। किसी ग्रह को रोग का कारण या बीमारी की संभावना का प्रमाण नहीं माना गया है।',learning:'अपनी दिनचर्या और आराम की जरूरत को अनुभव से समझें। यह शारीरिक या मानसिक स्वास्थ्य का परीक्षण नहीं है; जरूरत होने पर वास्तविक लक्षणों के आधार पर चिकित्सकीय सलाह लें।',preparation:'निजी समय और विश्राम को रोज के कार्यक्रम में जगह देना इस भाग का सीमित उपयोग है। जन्मपत्री से दीर्घकालीन बीमारी, अस्पताल-प्रवेश या उपचार की जरूरत नहीं बताई जा सकती।'}
};
const conditionText={own:'स्वराशि',exalted:'उच्च राशि',debilitated:'नीच राशि',ordinary:'अन्य राशि',unclassified:'इस पद्धति में अवर्गीकृत राशि'};
export function synthesisParagraphs(snapshot,topic,factors){
 const f=factors;if(!f)return [];
 const outlook={'natal-only':'वर्तमान दशा का सीधा संबंध न मिलने से इसे जन्मपत्री की सामान्य दिशा समझें; अभी किसी घटना की अवधि नहीं दी गई है।','mixed-current-signals':'अभी का संयुक्त पठन मिश्रित है: उपलब्ध संकेतों में सहयोगी तथा सावधानी वाले पक्ष एक साथ हैं। अवसर दिखे तो भी शर्तें और तैयारी जाँचकर आगे बढ़ें।','current-review':'वर्तमान दशा में यह विषय जुड़ता है, लेकिन राशि-स्थिति या वर्तमान गोचर में समीक्षा की जरूरत वाला पक्ष भी है। अधूरे काम, शर्तों और जिम्मेदारियों को स्पष्ट करना पहले रखें।','current-support':'वर्तमान दशा का संबंध और भावेश का वर्तमान चंद्र-गोचर सहयोग की दिशा में साथ आते हैं। अपनी तैयार योजना पर काम आगे बढ़ाने का पारंपरिक संदर्भ मिलता है; इससे परिणाम निश्चित नहीं होता।','active-ungraded':'वर्तमान दशा इस विषय को सीधे जोड़ती है, लेकिन उपलब्ध संकेतों से पूरे समय को अनुकूल या प्रतिकूल नहीं कहा गया है। वास्तविक विकल्पों के आधार पर निर्णय लें।'};
 const result=[],copy=readings[topic.id]?.[groupFor(f.lordHouse)],timingContext=f.period?outlook[f.assessment]:'इस रिपोर्ट में वर्तमान दशा उपलब्ध नहीं है। इसे जन्मपत्री की सामान्य दिशा समझें; घटना का समय अनुमान से नहीं जोड़ा गया है।';if(copy)result.push({role:'conclusion',text:copy+(topic.id==='wellbeing'?'':' '+timingContext)});
 result.push({role:'basis',text:`इस निष्कर्ष का आधार: भाव ${topic.houses[0]} के स्वामी ${named(f.lord)} जन्मपत्री के भाव ${f.lordHouse} में हैं।`});
 if(topic.id!=='wellbeing'){
  const parts=[];if(f.condition!=='ordinary'&&f.condition!=='unclassified')parts.push(`${named(f.lord)} ${conditionText[f.condition]} में हैं`);
  if(f.division)parts.push(`स्वीकृत नवांश में वे ${signName(f.division.sign,'hi')} राशि में हैं${f.division.sameSign?' और जन्म राशि के साथ वर्गोत्तम स्थिति बनती है':''}${['own','exalted','debilitated'].includes(f.division.condition)?' ('+conditionText[f.division.condition]+')':''}`);
  if(parts.length)result.push({role:'qualification',text:parts.join('। ')+ '। '+(f.balance==='mixed'?'राशि-स्थिति के सहयोगी और सावधानी वाले पक्ष साथ हैं; इसलिए केवल एक संकेत से अनुकूलता तय नहीं की गई है।':f.balance==='attention'?'इस संबंध में तैयारी, समय और जिम्मेदारियों की समीक्षा को अधिक जगह दें। नीच राशि या कठिन भाव अपने आप में असफलता नहीं है।':f.balance==='supported'?'यह राशि-स्थिति का सहयोगी पक्ष है, पूर्ण ग्रहबल या सुनिश्चित फल का निर्णय नहीं।':'नवांश यहाँ अतिरिक्त संदर्भ है; उससे अलग से घटना नहीं निकाली गई है।')});
 }
 if(f.aspects.length)result.push({role:'interaction',text:`मुख्य भाव पर ${f.aspects.map(p=>`${named(p.body)} की ${aspectName[p.offset]} दृष्टि`).join(' और ')} भी है। इसलिए भावेश के साथ इन ग्रहों का संदर्भ भी लिया गया है; केवल दृष्टि की संख्या को शुभता का अंक नहीं माना गया।`});
 if(f.exchange)result.push({role:'interaction',text:`${named(f.lord)} और ${named(f.exchange.body)} एक-दूसरे की राशि में हैं। इस राशि-परिवर्तन से दोनों भावों का संबंध जुड़ता है; इसे सभी योग्यताएँ जाँचे बिना राजयोग या निश्चित लाभ नहीं कहा गया है।`});
 if(f.connections.length){const roles={ruler:'स्वामी',occupant:'स्थित ग्रह',aspect:'दृष्टि देने वाले ग्रह'};result.push({role:'timing',text:`वर्तमान ${named(f.period.major)}–${named(f.period.minor)} दशा में इस विषय का सीधा संबंध है: ${f.connections.map(p=>`${named(p.body)} भाव ${[...new Set(p.links.map(l=>l.house))].join(', ')} से ${[...new Set(p.links.map(l=>roles[l.kind]))].join(' तथा ')} के रूप में जुड़े हैं`).join('। ')}। इसलिए इस अवधि में ऊपर दिए विषय की जिम्मेदारियों और विकल्पों की समीक्षा को प्राथमिकता दी गई है।`});}
 if(topic.id!=='wellbeing'&&f.transits.length){const row=f.transits.find(p=>p.body===f.lord)||f.transits[0],status={supportive:'चुने चंद्र-गोचर नियम में सहयोगी है',obstructed:'अनुकूल स्थान पर होते हुए वेध से बाधित है','outside-favorable':'चुनी अनुकूल-सूची में नहीं है; यह अपने आप में प्रतिकूल फल नहीं है',uncertain:'सीमा या संभावित वेध के कारण अनिश्चित है','rule-unresolved':'इस पद्धति के अपूर्ण नियम के कारण अनिर्णीत है'};result.push({role:'transit',text:`${topic.title} के लिए अभी का गोचर: ${named(row.body)} जन्म-चंद्र राशि से भाव ${row.relativeHouse} में हैं और उनकी स्थिति ${status[row.status]}। यह ${new Intl.DateTimeFormat('hi-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}).format(new Date(snapshot.currentTransit.at))} IST का क्षणिक संदर्भ है; इसे पूरी दशा पर लागू नहीं किया गया है।`});}
 return result;
}
export function rankedPeriodTopics(snapshot,topics,period){
 return topics.filter(t=>!['overview','appearance','personality','wellbeing'].includes(t.id)).map(t=>({topic:t.id,title:t.title,connections:periodConnections(snapshot,t.houses,period),priority:t.priority})).filter(t=>t.connections.length).sort((a,b)=>{
  const rank=t=>t.connections.reduce((n,p)=>n+p.links.reduce((s,l)=>s+(l.kind==='ruler'?3:l.kind==='occupant'?2:1),0),0);
  return rank(b)-rank(a)||b.priority-a.priority||a.topic.localeCompare(b.topic);
 });
}
export function focusPeriodTopics(snapshot,topics,period){const seen=new Set();return rankedPeriodTopics(snapshot,topics,period).filter(t=>{const house=topics.find(p=>p.id===t.topic).houses[0];if(seen.has(house))return false;seen.add(house);return true;}).slice(0,3);}
export function composeSynthesizedTopic(topic,findings,snapshot,kb){
 const selected=findings.filter(f=>f.topic===topic.id).sort((a,b)=>b.importance-a.importance),ids=selected.map(f=>f.id);
 if(!selected.length)return {id:topic.id,title:topic.title,status:'unavailable',paragraphs:[],findingIds:[]};
 const primary=selected[0],f=primary.evidence.synthesis,paragraphs=[],add=(text,role='context',refs=ids)=>paragraphs.push({text,role,findingIds:refs});
 if(topic.id==='appearance'){
  add(`आपके ${signName(snapshot.rising,'hi')} लग्न का पारंपरिक प्रस्तुति-संदर्भ: ${manner[snapshot.rising-1][1]}`,'conclusion');
  add(`लग्नेश ${named(f.lord)} भाव ${f.lordHouse} में हैं। अपने व्यवहार को समझते समय ${kb.houseThemes[f.lordHouse-1]} की भूमिका भी देखें।`,'basis');
  add('यह मिलने-जुलने और अपनी बात रखने के अंदाज का प्रतीकात्मक अध्ययन है। कद, रंगत, चेहरे की बनावट या शरीर का वास्तविक माप इससे निर्धारित नहीं होता।');
 }else if(topic.id==='overview'){
  const ranked=focusPeriodTopics(snapshot,kb.topics,periodAt(snapshot));
  add(ranked.length?`अभी के अध्ययन में ${ranked.slice(0,3).map(t=>t.title).join(' · ')} को पहले पढ़ें। वर्तमान दशा के ग्रह इन विषयों के भावों से सीधे जुड़ते हैं, इसलिए इस अवधि की समीक्षा में इन्हें प्राथमिकता मिली है।`:'जन्मपत्री के स्थायी विषय और वर्तमान दशा को अलग पढ़ें। वर्तमान अवधि से चुने विषयों का पर्याप्त सीधा संबंध न मिलने पर किसी घटना का समय अनुमान से नहीं दिया गया है।','conclusion');
  add(`आपके ${signName(snapshot.rising,'hi')} लग्न के स्वामी ${named(f.lord)} भाव ${f.lordHouse} में हैं। अपनी पहल का संबंध ${kb.houseThemes[f.lordHouse-1]} से जोड़कर देखें।`,'basis');
  if(f.period)add(`वर्तमान अवधि ${named(f.period.major)} की महादशा में ${named(f.period.minor)} की अंतर्दशा है। नीचे हर विषय में इसी अवधि के सीधे संबंध, अतिरिक्त राशि/नवांश संदर्भ और उपलब्ध वर्तमान गोचर को अलग पहचाना गया है।`,'timing');
 }else{
  for(const p of synthesisParagraphs(snapshot,topic,f))add(p.text,p.role,[primary.id]);
  if(topic.id!=='wellbeing'&&f.occupants.length)add(`इस विषय के मुख्य भाव में ${f.occupants.map(named).join(' और ')} उपस्थित हैं। इनके पारंपरिक विषय भी साथ पढ़ें: ${f.occupants.map(b=>`${named(b)} — ${kb.planetThemes[b].theme}`).join('; ')}।`,'occupants',[primary.id]);
  if(topic.id!=='wellbeing'&&f.colocated.length)add(`भावेश ${named(f.lord)} के साथ भाव ${f.lordHouse} में ${f.colocated.map(named).join(' और ')} भी हैं। यह एक ही पूर्ण-राशि भाव में साथ होना है; अंशगत दूरी जाँचे बिना इसे निकट युति या पूरा योग नहीं कहा गया है।`,'colocation',[primary.id]);
  if(topic.id==='personality'){const moon=snapshot.planets.find(p=>p.body==='Moon'&&p.stableSign);if(moon)add(`आपकी ${signName(moon.sign,'hi')} चंद्र राशि का पारंपरिक भावनात्मक संदर्भ: ${temperament[moon.sign-1][1]} इसे वास्तविक व्यक्तित्व-परीक्षण का परिणाम न मानें।`);}
  const secondary=selected.slice(1).filter(g=>g.evidence.ruler.body!==f.lord||g.evidence.ruler.house!==f.lordHouse);
  if(secondary.length)add('इस विषय का अतिरिक्त पक्ष: '+secondary.map(g=>`भाव ${g.evidence.house.number} (${kb.houseThemes[g.evidence.house.number-1]}) के स्वामी ${named(g.evidence.ruler.body)} भाव ${g.evidence.ruler.house} में हैं`).join('। ')+'। मुख्य निष्कर्ष के साथ इन जिम्मेदारियों का संतुलन भी देखें।','secondary',secondary.map(g=>g.id));
  if(topic.id==='wellbeing')add('बीमारी की संभावना: जन्मपत्री से किसी विशिष्ट रोग का भरोसेमंद अनुमान उपलब्ध नहीं है। इस रिपोर्ट में रोग के नाम, प्रतिशत या बीमारी-मुक्त होने का आश्वासन नहीं दिया जाता। लक्षण या वास्तविक स्वास्थ्य चिंता होने पर चिकित्सकीय मूल्यांकन ही उचित आधार है।','health-boundary');
 }
 const combinations=[...new Set(selected.flatMap(g=>g.conflicting))];if(topic.id!=='wellbeing')for(const id of combinations.slice(0,1)){const c=kb.combinations.find(c=>c.id===id);add(c.text,'interaction',selected.filter(g=>g.conflicting.includes(id)).map(g=>g.id));}
 return {id:topic.id,title:topic.id==='wellbeing'?'स्वास्थ्य एवं दिनचर्या':topic.title,status:'available',paragraphs,findingIds:ids,synthesis:f};
}
