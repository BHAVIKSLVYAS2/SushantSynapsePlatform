import {readingText,pick} from './kundli-reading-copy.mjs';
import {temperament,manner,work,resources,phase,everyday as topics} from './kundli-consultation-copy.mjs';
import {signName,bodyName} from './locale.mjs';
import {kundliPlacementText,periodPlacementText} from './planet-reading.mjs';
export const kundliProseVersion='kundli-prose-4';
// Original complete sentences. These describe traditional sign-element themes,
// not additional chart calculations or a full classical judgement.
export function composeKundliPeriod(period,language){
 if(!readingText[language])throw new TypeError('Unsupported language.');
 const major=bodyName(period.major,language),minor=bodyName(period.minor,language),guidance=pick(phase[period.minor],language);
 const intro=({en:`The calculated sequence places this period under ${major}, with ${minor} as its sub-period. A traditional theme to consider is to ${guidance}.`,hi:`गणना के अनुसार यह ${major} की महादशा में ${minor} की अंतर्दशा का समय है। इस अवधि के लिए पारंपरिक सुझाव है: ${guidance}।`,gu:`ગણતરી મુજબ આ ${major}ની મહાદશામાં ${minor}ની અંતર્દશાનો સમય છે. આ સમય માટેનું પરંપરાગત સૂચન છે: ${guidance}.`})[language];
 return [intro,periodPlacementText(period.placements,language)].filter(Boolean).join(' ');
}
export function composeKundliTopic(id,data,language){
 const t=readingText[language];if(!t)throw new TypeError('Unsupported language.');
 if(!data)return {paragraphs:[t.unavailable],action:null};
 if(id==='personality'){
  const moon=signName(data.moon,language),intro=({en:`Your Moon is in ${moon}. In the traditional reading, the Moon describes how you receive an experience and respond within.`,hi:`आपकी चंद्र राशि ${moon} है। चंद्रमा से मन की प्रतिक्रिया और भीतर की सहज प्रवृत्ति समझी जाती है।`,gu:`તમારી ચંદ્ર રાશિ ${moon} છે. ચંદ્રથી મનની પ્રતિક્રિયા અને અંદરની સહજ વૃત્તિ સમજવામાં આવે છે.`})[language];
  return {paragraphs:[intro,pick(temperament[data.moon-1],language)],action:null};
 }
 if(id==='appearance'){
  const rising=signName(data.rising,language),intro=({en:`Your rising sign is ${rising}. It is traditionally read for the manner in which you meet the world.`,hi:`आपका लग्न ${rising} है। लग्न से पहली मुलाकात में दिखने वाले अंदाज और व्यवहार की झलक ली जाती है।`,gu:`તમારું લગ્ન ${rising} છે. લગ્નથી પહેલી મુલાકાતમાં દેખાતા અંદાજ અને વર્તનની ઝાંખી લેવામાં આવે છે.`})[language];
  return {paragraphs:[intro,pick(manner[data.rising-1],language),...kundliPlacementText(data,language)],action:null};
 }
 if(id==='career'||id==='money'){
  const ruler=bodyName(data.ruler,language),intro=id==='career'?({en:`Your tenth house, traditionally read for work and responsibility, is ruled by ${ruler}. Consider this starting direction alongside your education and experience.`,hi:`आपकी कुंडली में कामकाज और जिम्मेदारी का दसवाँ भाव ${ruler} के अधीन है। इससे काम की दिशा समझने का एक आधार मिलता है; इसे अपनी पढ़ाई और अनुभव के साथ मिलाकर देखिए।`,gu:`તમારી કુંડળીમાં કામકાજ અને જવાબદારીનો દસમો ભાવ ${ruler}ના અધિપત્યમાં છે. તેનાથી કામની દિશા સમજવાનો એક આધાર મળે છે; તેને પોતાના ભણતર અને અનુભવ સાથે મેળવીને જોજો.`})[language]:({en:`Your second house is ruled by ${ruler}. This part of the traditional reading concerns the resources you keep and the responsibilities you share with family.`,hi:`आपके दूसरे भाव के स्वामी ${ruler} हैं। इस भाव से संचित धन और परिवार से जुड़ी जिम्मेदारियों को समझा जाता है।`,gu:`તમારા બીજા ભાવના સ્વામી ${ruler} છે. આ ભાવથી સંચિત ધન અને પરિવાર સાથે જોડાયેલી જવાબદારીઓ સમજવામાં આવે છે.`})[language];
  return {paragraphs:[intro,pick((id==='career'?work:resources)[data.ruler],language),...kundliPlacementText(data,language)],action:null};
 }
 if(!topics[id])throw new TypeError('Unsupported Kundli topic.');
 return {paragraphs:[pick(topics[id][(data.sign-1)%4],language),...kundliPlacementText(data,language)],action:null};
}
