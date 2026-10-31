import {temperament,everyday} from './kundli-consultation-copy.mjs';
import {pick} from './kundli-reading-copy.mjs';
import {signName} from './locale.mjs';
import {matchingJourneyCopy} from './matching-summary.mjs';

// Reuse the existing Kundali interpretation tables. Calculation selects the
// authored traditional text; no score-to-personality or inferred trait model.
export const matchingBehaviourModel='matching-chart-tendencies-1';
const copy={
 en:{title:'Relationship tendencies from both charts',note:'Each description follows a fixed rule from the calculated Moon sign or seventh-house sign.',emotions:'Emotional responses',relationships:'Approach to relationships',
  moon:(sign,house)=>`Moon in ${sign} · house ${house} · Moon-sign rule`,
  seventh:(sign,element)=>`Seventh house in ${sign} · ${element} group · relationship rule`,
  elements:['Fire','Earth','Air','Water'],unavailable:'This part needs a stable birth chart. Check the recorded birth time to see whether it can be calculated.'},
 hi:{title:'दोनों की कुंडली से रिश्ते के रुझान',note:'हर बात गणना की गई चंद्र राशि या सातवें भाव की राशि के तय नियम से चुनी गई है।',emotions:'मन की प्रतिक्रिया',relationships:'रिश्ता निभाने का अंदाज',
  moon:(sign,house)=>`चंद्रमा ${sign} में · भाव ${house} · चंद्र राशि का नियम`,
  seventh:(sign,element)=>`सातवाँ भाव ${sign} में · ${element} समूह · रिश्ते का नियम`,
  elements:['अग्नि','पृथ्वी','वायु','जल'],unavailable:'इस हिस्से के लिए जन्म कुंडली की स्थिति साफ होनी चाहिए। दर्ज जन्म समय जाँचें, ताकि पता चले कि इसकी गणना हो सकती है या नहीं।'},
 gu:{title:'બંનેની કુંડળી પરથી સંબંધના વલણ',note:'દરેક વાત ગણતરીથી મળેલી ચંદ્ર રાશિ કે સાતમા ભાવની રાશિના નક્કી નિયમથી પસંદ કરી છે.',emotions:'મનની પ્રતિક્રિયા',relationships:'સંબંધ નિભાવવાની રીત',
  moon:(sign,house)=>`ચંદ્ર ${sign}માં · ભાવ ${house} · ચંદ્ર રાશિનો નિયમ`,
  seventh:(sign,element)=>`સાતમો ભાવ ${sign}માં · ${element} જૂથ · સંબંધનો નિયમ`,
  elements:['અગ્નિ','પૃથ્વી','વાયુ','જળ'],unavailable:'આ ભાગ માટે જન્મ કુંડળીની સ્થિતિ સ્પષ્ટ હોવી જોઈએ. નોંધાયેલો જન્મ સમય તપાસો, જેથી તેની ગણતરી થઈ શકે છે કે નહીં તે જાણી શકાય.'}
};
const validSign=sign=>Number.isInteger(sign)&&sign>=1&&sign<=12;
const validHouse=house=>Number.isInteger(house)&&house>=1&&house<=12;
export function matchingBehaviourReading(contexts,language='en'){
 const t=copy[language];if(!t)throw new TypeError('Unsupported language.');
 return {modelId:matchingBehaviourModel,title:t.title,note:t.note,people:contexts.map((value,index)=>{
  const items=[];
  if(value.status==='available'){
   if(validSign(value.moon?.sign)&&validHouse(value.moon.house)){
    const {sign,house}=value.moon;
    items.push({id:'emotions',ruleId:'kundli-moon-sign-'+sign,title:t.emotions,basis:{body:'Moon',sign,house},basisText:t.moon(signName(sign,language),house),text:pick(temperament[sign-1],language)});
   }
   if(value.seventh?.house===7&&validSign(value.seventh.sign)){
    const sign=value.seventh.sign,element=(sign-1)%4;
    items.push({id:'relationships',ruleId:'kundli-seventh-sign-element-'+element,title:t.relationships,basis:{house:7,sign,element},basisText:t.seventh(signName(sign,language),t.elements[element]),text:pick(everyday.relationships[element],language)});
   }
  }
  return {title:matchingJourneyCopy[language][index===0?'personA':'personB'],status:items.length?'available':'unavailable',items,unavailable:t.unavailable};
 })};
}
