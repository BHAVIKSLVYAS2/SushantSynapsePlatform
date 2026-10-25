import {freeze} from '../../../packages/vedic/diagnostics.mjs';
import {transitRulebook} from '../../../packages/vedic/rashifal-transits.mjs';
import {bodyName} from './locale.mjs';
export const rashifalLibrary=freeze({version:'rashifal-gochar-3',catalogueDate:'2026-10-25',author:'Synapse source-linked transit rule engine',status:'draft-not-published',
 source:transitRulebook.source,categories:['overview','career','money','relationships','wellbeing'],
 weekly:'eight three-hourly observations per IST day; evaluate each graha and Vedha independently; report counts without predictive scores',
 translationStatus:{en:'authored-baseline-draft',hi:'draft-awaiting-independent-review',gu:'draft-awaiting-independent-review'}});
export const transitText={
 en:{supportive:'favourable house with no Vedha found',obstructed:'favourable house, obstructed by Vedha','outside-favorable':'outside the listed favourable houses',uncertain:'withheld near a sign boundary','rule-unresolved':'rule incomplete; no final assessment',samples:'observations',house:'houses from your Moon sign',by:'Vedha blockers',scope:'Calculated positions and traditional classifications are separate. Sample counts are not probabilities. These are general Moon-sign transits, not a personal birth-chart prediction.'},
 hi:{supportive:'अनुकूल भाव; वेध नहीं मिला',obstructed:'अनुकूल भाव पर वेध है','outside-favorable':'सूचीबद्ध अनुकूल भावों के बाहर',uncertain:'राशि सीमा के पास; निर्णय रोका गया','rule-unresolved':'नियम अधूरा; अंतिम निर्णय नहीं',samples:'अवलोकन',house:'आपकी चंद्र राशि से भाव',by:'वेध करने वाले ग्रह',scope:'गणना और पारंपरिक वर्गीकरण अलग हैं। अवलोकनों की गिनती संभावना नहीं है। यह सामान्य चंद्र राशि गोचर है, व्यक्तिगत जन्म कुंडली की भविष्यवाणी नहीं।'},
 gu:{supportive:'અનુકૂળ ભાવ; વેધ મળ્યો નથી',obstructed:'અનુકૂળ ભાવ પર વેધ છે','outside-favorable':'સૂચિબદ્ધ અનુકૂળ ભાવોની બહાર',uncertain:'રાશિ સીમા પાસે; નિર્ણય રોક્યો','rule-unresolved':'નિયમ અધૂરો; અંતિમ નિર્ણય નથી',samples:'અવલોકન',house:'તમારી ચંદ્ર રાશિથી ભાવ',by:'વેધ કરતા ગ્રહો',scope:'ગણતરી અને પરંપરાગત વર્ગીકરણ અલગ છે. અવલોકનોની ગણતરી સંભાવના નથી. આ સામાન્ય ચંદ્ર રાશિ ગોચર છે, વ્યક્તિગત જન્મ કુંડળીની આગાહી નથી.'}
};
const domains={overview:['Moon','Jupiter','Saturn'],career:['Sun','Mercury','Mars','Saturn'],money:['Jupiter','Venus','Mercury'],relationships:['Venus','Moon','Jupiter'],wellbeing:['Moon','Sun','Saturn']};
export function editorialSections(grahas,language){
 const t=transitText[language];
 const sections=rashifalLibrary.categories.map(category=>({category,items:domains[category].map(body=>{
  const g=grahas.find(g=>g.body===body),counts=Object.entries(g.counts).filter(([,n])=>n).map(([status,n])=>`${t[status]}: ${n}/${g.sampleCount}`).join('; ');
  const blockers=[...new Set(g.observations.flatMap(o=>o.blockers))];
  return {id:`${category}.${body}.${g.houses.join('-')}.${Object.values(g.counts).join('-')}`,body,
   text:`${bodyName(body,language)} · ${t.house}: ${g.houses.map(h=>'H'+h).join(', ')||'—'}. ${counts}. ${blockers.length?t.by+': '+blockers.map(b=>bodyName(b,language)).join(', ')+'. ':''}${language==='en'?'Source':language==='hi'?'स्रोत':'સ્રોત'}: Phaladeepika ${g.observations[0].sourceVerse}.`};
 })}));
 return freeze({sections,contentLanguage:language,fallback:false,translationStatus:rashifalLibrary.translationStatus[language]});
}
