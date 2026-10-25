import {freeze} from '../../../packages/vedic/diagnostics.mjs';
import {transitRulebook} from '../../../packages/vedic/rashifal-transits.mjs';
import {bodyName} from './locale.mjs';
export const rashifalLibrary=freeze({version:'rashifal-gochar-8',catalogueDate:'2026-10-25',author:'Synapse source-linked transit rule engine',status:'draft-not-published',
 source:transitRulebook.source,categories:['overview','observations'],
 weekly:'eight three-hourly observations per IST day; evaluate each graha and Vedha independently; report counts without predictive scores',
 translationStatus:{en:'authored-baseline-draft',hi:'draft-awaiting-independent-review',gu:'draft-awaiting-independent-review'}});
export const transitText={
 en:{supportive:'favourable house with no Vedha found',obstructed:'favourable house, obstructed by Vedha','outside-favorable':'outside the listed favourable houses',uncertain:'withheld near a sign boundary','rule-unresolved':'rule incomplete; no final assessment',samples:'observations',house:'houses from your Moon sign',by:'Vedha blockers',scope:'Calculated positions and traditional classifications are separate. Sample counts are not probabilities. These are general Moon-sign transits, not a personal birth-chart prediction.'},
 hi:{supportive:'अनुकूल भाव; वेध नहीं मिला',obstructed:'अनुकूल भाव पर वेध है','outside-favorable':'सूचीबद्ध अनुकूल भावों के बाहर',uncertain:'राशि सीमा के पास; निर्णय रोका गया','rule-unresolved':'नियम अधूरा; अंतिम निर्णय नहीं',samples:'अवलोकन',house:'आपकी चंद्र राशि से भाव',by:'वेध करने वाले ग्रह',scope:'गणना और पारंपरिक वर्गीकरण अलग हैं। अवलोकनों की गिनती संभावना नहीं है। यह सामान्य चंद्र राशि गोचर है, व्यक्तिगत जन्म कुंडली की भविष्यवाणी नहीं।'},
 gu:{supportive:'અનુકૂળ ભાવ; વેધ મળ્યો નથી',obstructed:'અનુકૂળ ભાવ પર વેધ છે','outside-favorable':'સૂચિબદ્ધ અનુકૂળ ભાવોની બહાર',uncertain:'રાશિ સીમા પાસે; નિર્ણય રોક્યો','rule-unresolved':'નિયમ અધૂરો; અંતિમ નિર્ણય નથી',samples:'અવલોકન',house:'તમારી ચંદ્ર રાશિથી ભાવ',by:'વેધ કરતા ગ્રહો',scope:'ગણતરી અને પરંપરાગત વર્ગીકરણ અલગ છે. અવલોકનોની ગણતરી સંભાવના નથી. આ સામાન્ય ચંદ્ર રાશિ ગોચર છે, વ્યક્તિગત જન્મ કુંડળીની આગાહી નથી.'}
};
export const readingText={
 en:{overview:'Your transit summary',observations:'Planet by planet',supportive:'Favourable and unobstructed at every observation',obstructed:'Favourable placements blocked by Vedha at every observation','outside-favorable':'Outside the rulebook’s favourable houses at every observation',uncertain:'Assessment withheld near a sign boundary','rule-unresolved':'Assessment withheld because the rule is unresolved',mixed:'Classifications vary across observations',house:'House from your Moon sign',houses:'Observed houses from your Moon sign',blockers:'Vedha from',changing:'The sampled classifications vary. See the timeline for separately calculated change times.',scope:'This summary describes general Moon-sign transits. It does not predict events in your work, finances, relationships or health.'},
 hi:{overview:'आपके गोचर का सार',observations:'हर ग्रह की स्थिति',supportive:'हर अवलोकन में अनुकूल और वेध रहित',obstructed:'हर अवलोकन में अनुकूल भाव पर वेध','outside-favorable':'हर अवलोकन में नियमावली के अनुकूल भावों से बाहर',uncertain:'राशि सीमा के पास निर्णय रोका गया','rule-unresolved':'नियम अनिर्णीत होने से निर्णय रोका गया',mixed:'अलग अवलोकनों में वर्गीकरण बदलता है',house:'आपकी चंद्र राशि से भाव',houses:'आपकी चंद्र राशि से देखे गए भाव',blockers:'इन ग्रहों से वेध',changing:'नमूना वर्गीकरण बदलते हैं। अलग गणना किए गए बदलावों का समय समयरेखा में देखें।',scope:'यह सामान्य चंद्र राशि गोचर का सार है। यह काम, धन, संबंध या स्वास्थ्य की घटनाओं की भविष्यवाणी नहीं करता।'},
 gu:{overview:'તમારા ગોચરનો સાર',observations:'દરેક ગ્રહની સ્થિતિ',supportive:'દરેક અવલોકનમાં અનુકૂળ અને વેધ રહિત',obstructed:'દરેક અવલોકનમાં અનુકૂળ ભાવ પર વેધ','outside-favorable':'દરેક અવલોકનમાં નિયમાવલીના અનુકૂળ ભાવોની બહાર',uncertain:'રાશિ સીમા પાસે નિર્ણય રોક્યો','rule-unresolved':'નિયમ અનિર્ણીત હોવાથી નિર્ણય રોક્યો',mixed:'અલગ અવલોકનોમાં વર્ગીકરણ બદલાય છે',house:'તમારી ચંદ્ર રાશિથી ભાવ',houses:'તમારી ચંદ્ર રાશિથી જોવાયેલા ભાવ',blockers:'આ ગ્રહોથી વેધ',changing:'નમૂના વર્ગીકરણ બદલાય છે. અલગ ગણાયેલા ફેરફારોનો સમય સમયરેખામાં જુઓ.',scope:'આ સામાન્ય ચંદ્ર રાશિ ગોચરનો સાર છે. તે કામ, નાણાં, સંબંધો કે સ્વાસ્થ્યની ઘટનાઓની આગાહી કરતો નથી.'}
};
export function editorialSections(grahas,language){
 const t=readingText[language],groups=new Map();
 const items=grahas.map(g=>{
  const statuses=Object.entries(g.counts).filter(([,n])=>n).map(([status])=>status),status=statuses.length===1?statuses[0]:'mixed';
  if(!groups.has(status))groups.set(status,[]);groups.get(status).push(g.body);
  const blockers=[...new Set(g.observations.flatMap(o=>o.blockers))];
  const detail=status==='mixed'?`${t.changing} ${statuses.map(s=>transitText[language][s]).join('; ')}.`:t[status]+'.';
  return {id:`observations.${g.body}.${g.houses.join('-')}.${Object.values(g.counts).join('-')}`,body:g.body,
   text:`${g.houses.length===1?t.house:t.houses}: ${g.houses.join(', ')||'—'}. ${detail}${blockers.length?' '+t.blockers+': '+blockers.map(b=>bodyName(b,language)).join(', ')+'.':''}`};
 });
 const summary=[...groups].map(([status,bodies])=>`${t[status]}: ${bodies.map(b=>bodyName(b,language)).join(', ')}.`).join(' ');
 const sections=[{category:'overview',items:[{id:'overview.'+items.map(i=>i.id).join('|'),text:summary}]},{category:'observations',items}];
 return freeze({sections,contentLanguage:language,fallback:false,translationStatus:rashifalLibrary.translationStatus[language]});
}
