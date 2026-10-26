import {nature,presence,planet,readingText,pick} from './kundli-reading-copy.mjs';
export const kundliProseVersion='kundli-prose-2';
// Original complete sentences. These describe traditional sign-element themes,
// not additional chart calculations or a full classical judgement.
const topics={
 relationships:[
  ['You may value warmth, initiative and an honest exchange in a relationship. Give the other person room to respond at their own pace.','रिश्तों में खुलकर बात करना और अपनापन जताना आपके लिए मायने रख सकता है। अपनी बात कहें, लेकिन सामने वाले को सोचने और जवाब देने का समय भी दें।','સંબંધોમાં ખુલ્લી વાત અને લાગણી વ્યક્ત કરવી તમારા માટે મહત્ત્વનું હોઈ શકે છે. પોતાની વાત કહો, પણ સામેવાળાને વિચારવા અને જવાબ આપવા સમય પણ આપો.'],
  ['Trust may grow through reliability and small acts of care. Say what you appreciate instead of assuming your actions explain everything.','आपके लिए भरोसा अक्सर निभाए हुए वादों और छोटी-छोटी परवाह से बनता है। केवल काम करके जताने के साथ कभी शब्दों में भी अपनी भावना कहिए।','તમારા માટે ભરોસો ઘણી વાર પાળેલાં વચનો અને નાની કાળજીથી બને છે. માત્ર કામ કરીને બતાવવાની સાથે ક્યારેક શબ્દોમાં પણ લાગણી વ્યક્ત કરો.'],
  ['Conversation and a sense of equality may help you feel close to someone. When a matter is sensitive, listen for the feeling behind the words.','बातचीत और बराबरी का भाव आपको किसी के करीब ला सकता है। संवेदनशील बात हो तो केवल तर्क नहीं, शब्दों के पीछे की भावना भी सुनिए।','વાતચીત અને સમાનતાનો ભાવ તમને કોઈની નજીક લાવી શકે છે. સંવેદનશીલ વાત હોય ત્યારે માત્ર તર્ક નહીં, શબ્દો પાછળની લાગણી પણ સાંભળો.'],
  ['Emotional warmth and a sense of safety may matter deeply to you. Share your needs gently rather than expecting someone to understand them without being told.','रिश्तों में भावनात्मक सहारा और अपनापन आपके लिए खास हो सकता है। मन की बात समझ ली जाएगी, यह मानने के बजाय अपनी जरूरत प्यार से कहिए।','સંબંધોમાં લાગણીનો સહારો અને અપનાપણું તમારા માટે ખાસ હોઈ શકે છે. મનની વાત સમજાઈ જશે એમ માનવાને બદલે પોતાની જરૂરિયાત પ્રેમથી કહો.']
 ],
 learning:[
  ['Trying something yourself may teach you more than a long explanation. Start with a small exercise and review what worked before moving on.','किसी काम को खुद करके देखना आपको लंबी समझाइश से ज्यादा सिखा सकता है। छोटा अभ्यास कीजिए, फिर देखिए कि क्या समझ आया और कहाँ मदद चाहिए।','કોઈ કામ જાતે કરીને જોવું તમને લાંબી સમજણ કરતાં વધુ શીખવી શકે છે. નાનો અભ્યાસ કરો, પછી જુઓ કે શું સમજાયું અને ક્યાં મદદ જોઈએ.'],
  ['A steady routine and practical examples may help you learn. Give yourself time to repeat a skill instead of judging progress after one attempt.','नियमित अभ्यास और रोजमर्रा के उदाहरणों से सीखना आपके लिए सहज हो सकता है। एक कोशिश के आधार पर फैसला करने के बजाय कौशल को थोड़ा समय दीजिए।','નિયમિત અભ્યાસ અને રોજિંદાં ઉદાહરણોથી શીખવું તમારા માટે સહજ હોઈ શકે છે. એક પ્રયત્નથી નિર્ણય લેવાને બદલે કૌશલ્યને થોડો સમય આપો.'],
  ['You may learn through questions, discussion and connecting ideas. Explain a lesson in your own words to find out what still needs practice.','सवाल पूछकर, चर्चा करके और विचारों को जोड़कर आप अच्छा सीख सकते हैं। कोई बात अपने शब्दों में समझाकर देखिए; जहाँ अटकें, वहीं अभ्यास की जरूरत होगी।','સવાલ પૂછીને, ચર્ચા કરીને અને વિચારો જોડીને તમે સારી રીતે શીખી શકો છો. કોઈ વાત પોતાના શબ્દોમાં સમજાવી જુઓ; જ્યાં અટકો ત્યાં અભ્યાસની જરૂર હશે.'],
  ['Stories, imagination and a personal connection may help a lesson stay with you. Pair that understanding with a simple written plan for practice.','कहानी, कल्पना या अपने अनुभव से जुड़ी बात आपको आसानी से याद रह सकती है। इस समझ के साथ अभ्यास की छोटी लिखित योजना भी रखिए।','વાર્તા, કલ્પના કે પોતાના અનુભવ સાથે જોડાયેલી વાત તમને સરળતાથી યાદ રહી શકે છે. આ સમજ સાથે અભ્યાસની નાની લેખિત યોજના પણ રાખો.']
 ],
 home:[
  ['At home, you may appreciate freedom to take initiative and organise things your way. Make shared decisions together so that everyone feels included.','घर में अपनी पहल और अपने ढंग से काम करने की जगह आपको अच्छी लग सकती है। साझा फैसलों में परिवार को साथ रखिए, ताकि सबको अपनी भागीदारी महसूस हो।','ઘરમાં પોતાની પહેલ અને પોતાની રીતે કામ કરવાની જગ્યા તમને ગમી શકે છે. સહિયારા નિર્ણયોમાં પરિવારને સાથે રાખો, જેથી સૌને પોતાની ભાગીદારી લાગે.'],
  ['A dependable routine and a comfortable, orderly space may help you feel settled. Leave some flexibility for the different needs of family members.','व्यवस्थित घर, सुविधाजनक जगह और भरोसेमंद दिनचर्या आपको सुकून दे सकती है। परिवार में सबकी जरूरत एक जैसी नहीं होती, इसलिए थोड़ी लचक भी रखिए।','વ્યવસ્થિત ઘર, અનુકૂળ જગ્યા અને ભરોસાપાત્ર દિનચર્યા તમને શાંતિ આપી શકે છે. પરિવારમાં સૌની જરૂરિયાત એકસરખી નથી હોતી, તેથી થોડી લવચીકતા પણ રાખો.'],
  ['An open exchange of ideas may help home feel welcoming. Talk through routines and responsibilities instead of leaving them to unspoken expectations.','जहाँ खुलकर बात हो सके, ऐसा घर आपको सहज लग सकता है। दिनचर्या और जिम्मेदारियाँ बातचीत से तय कीजिए; अनकही अपेक्षाओं पर बात मत छोड़िए।','જ્યાં ખુલ્લી વાત થઈ શકે એવું ઘર તમને સહજ લાગી શકે છે. દિનચર્યા અને જવાબદારીઓ વાતચીતથી નક્કી કરો; વાતને ન કહેવાયેલી અપેક્ષાઓ પર ન છોડો.'],
  ['A caring atmosphere and familiar bonds may be especially important at home. Support loved ones while also making room for your own rest and privacy.','घर का अपनापन और अपनों का साथ आपके लिए खास मायने रख सकता है। दूसरों की देखभाल के साथ अपने आराम और निजी समय की जरूरत भी याद रखिए।','ઘરનું અપનાપણું અને સ્વજનોનો સાથ તમારા માટે ખાસ મહત્ત્વનો હોઈ શકે છે. બીજાની કાળજી સાથે પોતાના આરામ અને વ્યક્તિગત સમયની જરૂરિયાત પણ યાદ રાખો.']
 ]
};
export function composeKundliTopic(id,data,language){
 const t=readingText[language];if(!t)throw new TypeError('Unsupported language.');
 if(!data)return {paragraphs:[t.unavailable],action:null};
 if(id==='personality')return {paragraphs:[pick(nature[data.moon-1],language),...(data.rising&&data.rising!==data.moon?[pick(nature[data.rising-1],language)]:[])],action:null};
 if(id==='appearance')return {paragraphs:[pick(presence[data.rising-1],language)],action:null};
 if(id==='career'){
  const work=pick(planet[data.ruler][1],language),sentence=({en:`Your chart points towards work involving ${work}. Treat these as directions to explore alongside your skills and interests.`,hi:`आपकी कुंडली में ${work} जैसे क्षेत्रों पर विचार करने का संकेत मिलता है। अपने हुनर, रुचि और अनुभव से मिलाकर इन दिशाओं को परखिए।`,gu:`તમારી કુંડળીમાં ${work} જેવા ક્ષેત્રો પર વિચાર કરવાનો સંકેત મળે છે. પોતાના કૌશલ્ય, રસ અને અનુભવ સાથે સરખાવીને આ દિશાઓ પરખો.`})[language];
  return {paragraphs:[sentence,pick(nature[data.sign-1],language)],action:null};
 }
 if(id==='money'){
  const theme=pick(planet[data.ruler][0],language);return {paragraphs:[({en:`The traditional theme for your resources is ${theme}. Think about how this shows up in the way you earn, save and share responsibilities.`,hi:`धन और संसाधनों के लिए आपकी कुंडली का पारंपरिक विषय है: ${theme}। कमाई, बचत और साझा जिम्मेदारियों में यह बात आपके अनुभव से कहाँ मेल खाती है, इस पर विचार कीजिए।`,gu:`ધન અને સંસાધનો માટે તમારી કુંડળીનો પરંપરાગત વિષય છે: ${theme}. આવક, બચત અને સહિયારી જવાબદારીઓમાં આ વાત તમારા અનુભવ સાથે ક્યાં મેળ ખાય છે તે વિચારો.`})[language]],action:t.moneyTip};
 }
 return {paragraphs:[pick(topics[id][(data.sign-1)%4],language)],action:t[{relationships:'relationshipTip',learning:'learningTip',home:'homeTip'}[id]]};
}
