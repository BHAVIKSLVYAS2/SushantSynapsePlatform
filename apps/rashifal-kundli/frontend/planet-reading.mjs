import {bodyName,signName} from './locale.mjs';
import {houseContext,pick} from './kundli-reading-copy.mjs';

const list=(values,language)=>new Intl.ListFormat({en:'en-IN',hi:'hi-IN',gu:'gu-IN'}[language],{style:'long',type:'conjunction'}).format(values);
// Describe only the admitted D1 placements. These are topic links, not strength,
// aspect, dignity, event timing or a new classical judgement.
export function kundliPlacementText(data,language,{assessmentNote=true}={}){
 if(!Number.isInteger(data?.house)||!Number.isInteger(data.rulerHouse))return [];
 const ruler=bodyName(data.ruler,language),sign=signName(data.rulerSign,language),theme=pick(houseContext[data.rulerHouse-1],language);
 const placement={
  en:`In your birth chart, ${ruler} is in ${sign}, in house ${data.rulerHouse}. Traditionally, that links house ${data.house} with ${theme}. Think about where these parts of life meet for you.`,
  hi:`आपकी जन्म कुंडली में ${ruler}, ${sign} राशि के ${data.rulerHouse} नंबर के भाव में हैं। परंपरा में इससे ${data.house} नंबर के भाव की बात इन बातों से जुड़ती है: ${theme}। देखें, आपकी जिंदगी में ये बातें कहाँ एक-दूसरे से जुड़ती हैं।`,
  gu:`તમારી જન્મ કુંડળીમાં ${ruler}, ${sign} રાશિના ${data.rulerHouse} નંબરના ભાવમાં છે. પરંપરામાં તેનાથી ${data.house} નંબરના ભાવની વાત આ બાબતો સાથે જોડાય છે: ${theme}. તમારા જીવનમાં આ બાબતો ક્યાં એકબીજા સાથે જોડાય છે તે વિચારી જુઓ.`
 }[language];
 const names=list((data.occupants??[]).map(body=>bodyName(body,language)),language);
 const occupants=names?{
  en:`${names} ${data.occupants.length===1?'is':'are'} also in house ${data.house}. Keep ${data.occupants.length===1?'this placement':'these placements'} in mind alongside the house ruler.${assessmentNote?' We haven’t combined their strength or aspects here.':''}`,
  hi:`${names} भी ${data.house} नंबर के भाव में हैं। इस हिस्से को समझते समय इन्हें भाव के स्वामी के साथ देखें।${assessmentNote?' यहाँ इनका मिला-जुला बल या दृष्टियाँ नहीं जाँची गई हैं।':''}`,
  gu:`${names} પણ ${data.house} નંબરના ભાવમાં છે. આ ભાગ સમજતી વખતે તેમને ભાવના સ્વામી સાથે જુઓ.${assessmentNote?' અહીં તેમનું ભેગું બળ કે દૃષ્ટિઓ તપાસ્યાં નથી.':''}`
 }[language]:null;
 return [placement,...occupants?[occupants]:[]];
}

export function periodPlacementText(placements,language){
 if(!placements?.length)return '';
 return placements.map(p=>{
  const body=bodyName(p.body,language),sign=signName(p.sign,language),theme=pick(houseContext[p.house-1],language);
  return {en:`In your birth chart, ${body} is in ${sign}, in house ${p.house}. That brings ${theme} into the traditional reading of this period.`,hi:`आपकी जन्म कुंडली में ${body}, ${sign} राशि के ${p.house} नंबर के भाव में हैं। इसलिए इस दशा को समझते समय इन बातों पर भी ध्यान दें: ${theme}।`,gu:`તમારી જન્મ કુંડળીમાં ${body}, ${sign} રાશિના ${p.house} નંબરના ભાવમાં છે. એટલે આ દશાને સમજતી વખતે આ બાબતો પર પણ ધ્યાન આપો: ${theme}.`}[language];
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
