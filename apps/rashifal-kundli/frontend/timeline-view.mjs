import {bodyName,signName} from './locale.mjs';
import {transitText} from './rashifal-library.mjs';
export const timelineText={
 en:{today:'Changes today',tomorrow:'Changes tomorrow',weekly:'Changes this week',note:'Approximate times · IST. Sign crossings and boundary-screening changes are calculated separately from the sampled summary above. Timing precision is not a certified physical error bound.',empty:'No sign or boundary-screening changes found in this period by the declared search.',unavailable:'Change times could not be calculated for this period. The sampled reading remains available.',partial:'Some times are unresolved or touch a search boundary. This list may be incomplete.',ingress:'Sign crossing',enter:'Boundary screen begins',exit:'Boundary screen ends',reverse:'Reverse crossing',house:'House from your Moon sign',effects:'Rule changes',blockers:'Vedha blockers after this change',none:'None',boundary:'Near the period edge; date membership is uncertain',touch:'A boundary contact could not be resolved into a crossing. No final change is inferred.',limits:'Search: 30-minute knots with stationary-point splits, refined to a bracket of at most 0.5 seconds. Extremely short reversals between knots are not certified. Rules with disputed sources remain unresolved.'},
 hi:{today:'आज के बदलाव',tomorrow:'कल के बदलाव',weekly:'इस सप्ताह के बदलाव',note:'अनुमानित समय · IST। राशि और सीमा-जाँच के बदलाव ऊपर के नमूना सार से अलग गणना किए जाते हैं। समय की सूक्ष्मता प्रमाणित भौतिक त्रुटि सीमा नहीं है।',empty:'घोषित खोज से इस अवधि में राशि या सीमा-जाँच का बदलाव नहीं मिला।',unavailable:'इस अवधि के बदलावों का समय नहीं निकाला जा सका। नमूना पाठ उपलब्ध है।',partial:'कुछ समय अनिर्णीत हैं या खोज की सीमा पर हैं। यह सूची अधूरी हो सकती है।',ingress:'राशि परिवर्तन',enter:'सीमा-जाँच शुरू',exit:'सीमा-जाँच समाप्त',reverse:'उलटी दिशा में परिवर्तन',house:'आपकी चंद्र राशि से भाव',effects:'नियमों में बदलाव',blockers:'इस बदलाव के बाद वेध करने वाले ग्रह',none:'कोई नहीं',boundary:'अवधि की सीमा के पास; तिथि में शामिल होना अनिश्चित है',touch:'सीमा को छूने की स्थिति में परिवर्तन तय नहीं हो सका। कोई अंतिम बदलाव नहीं माना गया।',limits:'खोज: हर 30 मिनट के बिंदु और गति की दिशा बदलने वाले बिंदु; समय का संख्यात्मक अंतर अधिकतम 0.5 सेकंड। बिंदुओं के बीच बहुत छोटे उलटाव प्रमाणित नहीं हैं। विवादित नियम अनिर्णीत रहते हैं।'},
 gu:{today:'આજના ફેરફારો',tomorrow:'આવતીકાલના ફેરફારો',weekly:'આ અઠવાડિયાના ફેરફારો',note:'અંદાજિત સમય · IST. રાશિ અને સીમા-ચકાસણીના ફેરફારો ઉપરના નમૂના સારથી અલગ ગણાય છે. સમયની સૂક્ષ્મતા પ્રમાણિત ભૌતિક ભૂલની સીમા નથી.',empty:'જાહેર કરેલી શોધથી આ સમયગાળામાં રાશિ કે સીમા-ચકાસણીનો ફેરફાર મળ્યો નથી.',unavailable:'આ સમયગાળાના ફેરફારોનો સમય ગણી શકાયો નથી. નમૂના લખાણ ઉપલબ્ધ છે.',partial:'કેટલાક સમય અનિર્ણીત છે અથવા શોધની સીમા પર છે. આ યાદી અધૂરી હોઈ શકે છે.',ingress:'રાશિ પરિવર્તન',enter:'સીમા-ચકાસણી શરૂ',exit:'સીમા-ચકાસણી પૂરી',reverse:'ઊલટી દિશામાં પરિવર્તન',house:'તમારી ચંદ્ર રાશિથી ભાવ',effects:'નિયમોમાં ફેરફાર',blockers:'આ ફેરફાર પછી વેધ કરતા ગ્રહો',none:'કોઈ નહીં',boundary:'સમયગાળાની સીમા પાસે; તારીખમાં સમાવેશ અનિશ્ચિત છે',touch:'સીમાને સ્પર્શવાની સ્થિતિમાં પરિવર્તન નક્કી થઈ શક્યું નથી. કોઈ અંતિમ ફેરફાર માન્યો નથી.',limits:'શોધ: દર 30 મિનિટના બિંદુ અને ગતિની દિશા બદલાતા બિંદુ; સમયનો આંકડાકીય તફાવત વધુમાં વધુ 0.5 સેકંડ. બિંદુઓ વચ્ચે ખૂબ ટૂંકા ઊલટાવ પ્રમાણિત નથી. વિવાદિત નિયમો અનિર્ણીત રહે છે.'}
};
for(const [language,busy]of Object.entries({en:'Calculating transits and change times…',hi:'गोचर और बदलावों का समय निकाला जा रहा है…',gu:'ગોચર અને ફેરફારોનો સમય ગણાઈ રહ્યો છે…'}))timelineText[language].busy=busy;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function renderTimeline(timeline,language,view){
 const t=timelineText[language],root=el('div');root.className='rashifal-timeline';root.setAttribute('role','region');root.setAttribute('aria-labelledby','rashifal-timeline-title');root.dataset.status=timeline.status;
 const heading=el('h3',t[view]);heading.id='rashifal-timeline-title';root.append(heading,el('p',t.note));
 if(timeline.status!=='available')root.append(el('p',timeline.status==='unavailable'?t.unavailable:t.partial));
 if(!timeline.events.length&&timeline.status==='available')root.append(el('p',t.empty));
 const list=el('ol'),format=new Intl.DateTimeFormat(({en:'en-IN',hi:'hi-IN',gu:'gu-IN'})[language],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Kolkata'});
 for(const event of timeline.events){const li=el('li');li.dataset.body=event.body;li.dataset.kind=event.kind;li.dataset.utc=event.utcInstant;li.dataset.fromHouse=String(event.fromHouse);li.dataset.toHouse=String(event.toHouse);
  const time=el('time','≈ '+format.format(new Date(event.utcInstant))+' IST');time.dateTime=event.utcInstant;
  const label=event.kind==='ingress'?t.ingress:event.kind==='guard-enter'?t.enter:t.exit;
  li.append(time,el('h4',`${bodyName(event.body,language)} · ${label}`));
  if(event.kind==='ingress')li.append(el('p',`${signName(event.fromRashi,language)} → ${signName(event.toRashi,language)} · ${t.house}: ${event.fromHouse} → ${event.toHouse}${event.direction==='reverse'?' · '+t.reverse:''}`));
  if(event.intervalMembership!=='inside')li.append(el('p',t.boundary));
  for(const change of event.affected){const p=el('p');p.dataset.affected=change.body;
   p.textContent=`${bodyName(change.body,language)}: ${change.fromStatus===change.toStatus?transitText[language][change.toStatus]:transitText[language][change.fromStatus]+' → '+transitText[language][change.toStatus]}.`;
   if(change.toBlockers.length||change.fromBlockers.length)p.textContent+=` ${t.blockers}: ${change.toBlockers.map(b=>bodyName(b,language)).join(', ')||t.none}.`;
   if(change.possibleBlockers.length)p.textContent+=' ? '+change.possibleBlockers.map(b=>bodyName(b,language)).join(', ');li.append(p);
  }
  list.append(li);
 }root.append(list);
 for(const day of timeline.days)for(const contact of day.contacts)root.append(el('p',`${day.localDate} · ${bodyName(contact.body,language)}: ${t.touch}`));
 const note=el('p',t.limits);note.className='rashifal-timeline-limits';root.append(note);return root;
}
