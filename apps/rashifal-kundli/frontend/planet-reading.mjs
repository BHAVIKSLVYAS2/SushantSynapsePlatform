import {bodyName,signName} from './locale.mjs';
import {houseContext,pick} from './kundli-reading-copy.mjs';

const list=(values,language)=>new Intl.ListFormat({en:'en-IN',hi:'hi-IN',gu:'gu-IN'}[language],{style:'long',type:'conjunction'}).format(values);
// Describe only the admitted D1 placements. These are topic links, not strength,
// aspect, dignity, event timing or a new classical judgement.
export function kundliPlacementText(data,language){
 if(!Number.isInteger(data?.house)||!Number.isInteger(data.rulerHouse))return [];
 const ruler=bodyName(data.ruler,language),sign=signName(data.rulerSign,language),theme=pick(houseContext[data.rulerHouse-1],language);
 const placement={
  en:`In your calculated birth chart, ${ruler} is in ${sign} in house ${data.rulerHouse}. In traditional house symbolism, this connects the subject of house ${data.house} with ${theme}.`,
  hi:`जन्म कुंडली में ${ruler}, ${sign} राशि में भाव ${data.rulerHouse} में स्थित हैं। पारंपरिक अर्थ में भाव ${data.house} से इन विषयों का संबंध बनता है: ${theme}।`,
  gu:`જન્મ કુંડળીમાં ${ruler}, ${sign} રાશિમાં ભાવ ${data.rulerHouse}માં છે. ભાવોના પરંપરાગત અર્થ મુજબ, ભાવ ${data.house}નો વિષય ${theme} સાથે જોડાય છે.`
 }[language];
 const names=list((data.occupants??[]).map(body=>bodyName(body,language)),language);
 const occupants=names?{
  en:`${names} also ${data.occupants.length===1?'occupies':'occupy'} house ${data.house}; these placements belong in the interpretation alongside its ruler. Their combined strength and aspects have not been assessed.`,
  hi:`${names} भी भाव ${data.house} में स्थित हैं। इस भाव को समझते समय स्वामी ग्रह के साथ इन स्थितियों को भी देखें। संयुक्त बल और दृष्टियों का आकलन नहीं हुआ है।`,
  gu:`${names} પણ ભાવ ${data.house}માં છે. આ ભાવને સમજતી વખતે સ્વામી ગ્રહ સાથે આ સ્થિતિઓ પણ જુઓ. સંયુક્ત બળ અને દૃષ્ટિઓનું મૂલ્યાંકન થયું નથી.`
 }[language]:null;
 return [placement,...occupants?[occupants]:[]];
}

export function periodPlacementText(placements,language){
 if(!placements?.length)return '';
 return placements.map(p=>{
  const body=bodyName(p.body,language),sign=signName(p.sign,language),theme=pick(houseContext[p.house-1],language);
  return {en:`Natal ${body} is in ${sign}, house ${p.house}, connecting this period's traditional interpretation with ${theme}.`,hi:`जन्म कुंडली में ${body}, ${sign} राशि में भाव ${p.house} में स्थित हैं। इस दशा की व्याख्या में इन विषयों पर भी ध्यान दें: ${theme}।`,gu:`જન્મ કુંડળીમાં ${body}, ${sign} રાશિમાં ભાવ ${p.house}માં છે. આ દશાના અર્થઘટનમાં આ વિષયો પણ ધ્યાનમાં લો: ${theme}.`}[language];
 }).join(' ');
}

const transitCopy={
 en:{title:'Planetary basis of this reading',reference:'Houses here are counted from your selected Moon sign, rather than a personal Ascendant. These are sampled positions, not continuous durations.',states:{supportive:'in the favourable-house list with no obstruction found',obstructed:'in the favourable-house list with an obstruction', 'outside-favorable':'outside the listed favourable houses',uncertain:'too close to a sign boundary for a settled classification','rule-unresolved':'withheld because the rule is unresolved'},row:(name,houses,state)=>`${name}: house${houses.length===1?'':'s'} ${houses.join(', ')} from your Moon sign ${houses.length===1?'is':'are'} ${state} at the sampled times.`,blockers:n=>`The obstructed observations identify ${n} as the blocking planet${n.includes(' and ')?'s':''}.`},
 hi:{title:'इस पाठ का ग्रह आधार',reference:'यहाँ भाव आपकी चुनी हुई चंद्र राशि से गिने गए हैं, व्यक्तिगत लग्न से नहीं। ये नमूना स्थितियाँ हैं, लगातार बनी रहने की अवधि नहीं।',states:{supportive:'अनुकूल भावों में और बिना वेध',obstructed:'अनुकूल भावों में, लेकिन वेध के साथ','outside-favorable':'अनुकूल भावों की सूची से बाहर',uncertain:'राशि सीमा के पास होने से अनिश्चित','rule-unresolved':'नियम अनिर्णीत होने से रोका गया'},row:(name,houses,state)=>`${name}: चंद्र राशि से भाव ${houses.join(', ')}; नमूना अवलोकनों में स्थिति ${state} है।`,blockers:n=>`वेध वाले अवलोकनों में ${n} बाधक ग्रह हैं।`},
 gu:{title:'આ લખાણનો ગ્રહ આધાર',reference:'અહીં ભાવ તમારી પસંદ કરેલી ચંદ્ર રાશિથી ગણ્યા છે, વ્યક્તિગત લગ્નથી નહીં. આ નમૂનાની સ્થિતિઓ છે, સતત રહેવાની અવધિ નહીં.',states:{supportive:'અનુકૂળ ભાવોમાં અને વેધ વગર',obstructed:'અનુકૂળ ભાવોમાં, પરંતુ વેધ સાથે','outside-favorable':'અનુકૂળ ભાવોની યાદી બહાર',uncertain:'રાશિ સીમા પાસે હોવાથી અનિશ્ચિત','rule-unresolved':'નિયમ અનિર્ણીત હોવાથી રોકેલું'},row:(name,houses,state)=>`${name}: ચંદ્ર રાશિથી ભાવ ${houses.join(', ')}; નમૂનાના અવલોકનોમાં સ્થિતિ ${state} છે.`,blockers:n=>`વેધવાળા અવલોકનોમાં ${n} અવરોધક ગ્રહ છે.`}
};
export function transitReadingBasis(grahas,language,bodies){
 const t=transitCopy[language],items=[];
 for(const body of [...new Set(bodies.filter(Boolean))]){
  const g=grahas.find(g=>g.body===body);if(!g?.observations?.length)continue;
  const parts=[],groups=[];
  for(const status of Object.keys(t.states)){
   const observations=g.observations.filter(o=>o.status===status);
   if(!observations.length)continue;
   const houses=[...new Set(observations.map(o=>o.relativeHouse))];
   groups.push({status,houses});parts.push(t.row(bodyName(body,language),houses,t.states[status]));
  }
  const blockers=[...new Set(g.observations.filter(o=>o.status==='obstructed').flatMap(o=>o.blockers))];
  if(blockers.length)parts.push(t.blockers(list(blockers.map(b=>bodyName(b,language)),language)));
  if(parts.length)items.push({body,groups,blockers,text:parts.join(' ')});
 }
 return {title:t.title,reference:t.reference,items};
}
