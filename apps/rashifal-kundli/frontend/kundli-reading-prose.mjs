import {readingText,pick} from './kundli-reading-copy.mjs';
import {temperament,manner,work,resources,phase,everyday as topics} from './kundli-consultation-copy.mjs';
import {signName,bodyName} from './locale.mjs';
import {kundliPlacementText,periodPlacementText} from './planet-reading.mjs';
export const kundliProseVersion='kundli-prose-5';
// Original complete sentences. These describe traditional sign-element themes,
// not additional chart calculations or a full classical judgement.
export function composeKundliPeriod(period,language){
 if(!readingText[language])throw new TypeError('Unsupported language.');
 const major=bodyName(period.major,language),minor=bodyName(period.minor,language),guidance=pick(phase[period.minor],language);
 const intro=({en:`This is a ${major} period, with ${minor} as its sub-period. Here’s a practical way to approach its traditional themes: ${guidance}.`,hi:`इस अवधि में आपकी ${major} की महादशा और ${minor} की अंतर्दशा है। इसके पारंपरिक संकेतों को रोजमर्रा में ऐसे अपनाकर देखें: ${guidance}।`,gu:`આ સમયગાળામાં તમારી ${major}ની મહાદશા અને ${minor}ની અંતર્દશા છે. તેના પરંપરાગત સંકેતોને રોજિંદા જીવનમાં આ રીતે અજમાવી જુઓ: ${guidance}.`})[language];
 return [intro,periodPlacementText(period.placements,language)].filter(Boolean).join(' ');
}
export function composeKundliTopic(id,data,language){
 const t=readingText[language];if(!t)throw new TypeError('Unsupported language.');
 if(!data)return {paragraphs:[t.unavailable],action:null};
 if(id==='personality'){
  const moon=signName(data.moon,language),intro=({en:`Your Moon sign is ${moon}. Traditionally, this offers a starting point for talking about feelings and how you respond to everyday situations. See what feels familiar to you.`,hi:`आपकी चंद्र राशि ${moon} है। परंपरा में इससे मन की बातों और रोज की परिस्थितियों पर आपकी प्रतिक्रिया को समझने की शुरुआत करते हैं। देखें, इनमें से कौन-सी बातें आपको अपने जैसी लगती हैं।`,gu:`તમારી ચંદ્ર રાશિ ${moon} છે. પરંપરામાં આ પરથી લાગણીઓ અને રોજની પરિસ્થિતિમાં તમે કેવી પ્રતિક્રિયા આપો છો તે સમજવાની શરૂઆત કરીએ છીએ. જુઓ, કઈ વાત તમને તમારા જેવી લાગે છે.`})[language];
  return {paragraphs:[intro,pick(temperament[data.moon-1],language)],action:null};
 }
 if(id==='appearance'){
  const rising=signName(data.rising,language),intro=({en:`Your rising sign is ${rising}. In a traditional reading, this is where we start when discussing how you approach new people and situations.`,hi:`आपका लग्न ${rising} है। नए लोगों से मिलने या नई परिस्थिति में कदम रखने के आपके अंदाज की बात यहीं से शुरू करते हैं।`,gu:`તમારું લગ્ન ${rising} છે. નવા લોકોને મળતી વખતે કે નવી પરિસ્થિતિમાં તમારો અંદાજ કેવો હોય તેની વાત અહીંથી શરૂ કરીએ છીએ.`})[language];
  return {paragraphs:[intro,pick(manner[data.rising-1],language),...kundliPlacementText(data,language)],action:null};
 }
 if(id==='career'||id==='money'){
  const ruler=bodyName(data.ruler,language),intro=id==='career'?({en:`${ruler} rules your tenth house, which we traditionally look at for work and responsibility. Use these themes to reflect on your skills, education and experience as you think about your next step.`,hi:`आपके कामकाज से जुड़े दसवें भाव के स्वामी ${ruler} हैं। आगे क्या करना है, यह सोचते समय इन बातों को अपनी पढ़ाई, हुनर और अनुभव से जोड़कर देखें।`,gu:`તમારા કામકાજ સાથે જોડાયેલા દસમા ભાવના સ્વામી ${ruler} છે. આગળ શું કરવું તે વિચારતી વખતે આ વાતોને તમારા ભણતર, આવડત અને અનુભવ સાથે જોડીને જુઓ.`})[language]:({en:`${ruler} rules your second house. Traditionally, this brings the conversation to savings and family responsibilities—what you want to set aside and what you need to plan for together.`,hi:`आपके दूसरे भाव के स्वामी ${ruler} हैं। यहाँ बात बचत और परिवार की जिम्मेदारियों की आती है—क्या अलग रख सकते हैं और किन खर्चों की योजना साथ मिलकर बनानी है।`,gu:`તમારા બીજા ભાવના સ્વામી ${ruler} છે. અહીં વાત બચત અને પરિવારની જવાબદારીની આવે છે—શું બચાવી શકાય અને કયા ખર્ચનું આયોજન સાથે કરવું છે.`})[language];
  return {paragraphs:[intro,pick((id==='career'?work:resources)[data.ruler],language),...kundliPlacementText(data,language)],action:null};
 }
 if(!topics[id])throw new TypeError('Unsupported Kundli topic.');
 return {paragraphs:[pick(topics[id][(data.sign-1)%4],language),...kundliPlacementText(data,language)],action:null};
}
