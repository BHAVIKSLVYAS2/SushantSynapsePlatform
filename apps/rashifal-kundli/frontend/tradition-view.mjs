import {placeLabel,relabelPlaces} from './place-text.mjs';
import {term,limbText,nakshatraName} from './display-text.mjs';
import {diagnosticText} from './diagnostic-text.mjs';
import {searchPlaces} from '../../../packages/vedic/places.mjs';
import {yearlyTithiCandidates,birthdayRule} from '../../../packages/vedic/birth-observance.mjs';
import {namingData,namingGuidance,findNames} from './naming-data.mjs';
import {locale} from './locale.mjs';
import {ritualGuideLink} from './ritual-link.mjs';
export const traditionLabels={
 en:{title:'Birth Panchang and traditions',instant:'At the birth instant',civil:'Civil weekday',sunrise:'Sunrise weekday',month:'Amanta lunar month',names:'Name suggestions',custom:'Naming sounds are an optional custom, not an obligation or a promise about life outcomes. Roman spellings follow the named regional source; variants exist.',seed:'Small editorial catalogue: 2 Sanskrit-origin names with sourced meanings. Empty matches are intentional; no meanings are invented.',search:'Search name or meaning',language:'Name script',match:'Only the suggested sound',copy:'Copy name',copied:'Name copied',failed:'Copy unavailable; select the name text.',none:'No curated matches.',annual:'Yearly Tithi candidates',year:'Gregorian year (1951–2097)',place:'Observance place and state',query:'Search observance city',rule:'Choose an observance rule',ruleName:'Amanta · first sunrise · missing Tithi: no selected day',policy:'Extra-month policy',regular:'Regular month only',both:'Include Adhika and regular month',calculate:'Find yearly candidates',notice:'Exploration candidates, not certified ritual dates. Amanta is used in several western/southern traditions; Purnimanta and other family rules are unavailable. Repeated Tithi: first sunrise. Missing Tithi: show interval, select no date. Sunrise/source acceptance remains pending.',empty:'No matching occurrence touches this Gregorian year.',ics:'Download selected dates (.ics)',noIcs:'No confirmed candidate date to export.',busy:'Calculating yearly candidates…',date:'Selected local day',status:'Sunrise status',interval:'Tithi interval (UTC)',unavailable:'Withheld / unavailable',source:'Sources and versions',candidate:'Candidate Tithi observance',calendarNotice:'Calendar download includes selected candidate dates and rule only, without name, birth date/time or place. It is still sensitive; do not treat candidates as certified dates.'},
 hi:{title:'जन्म पंचांग और परंपराएँ',instant:'जन्म के क्षण पर',civil:'नागरिक वार',sunrise:'सूर्योदय का वार',month:'अमान्त चंद्र मास',names:'नाम सुझाव',custom:'नामाक्षर एक वैकल्पिक परंपरा है, बाध्यता या भविष्य का वादा नहीं। रोमन वर्तनी दिए गए क्षेत्रीय स्रोत के अनुसार है; भिन्नताएँ संभव हैं।',seed:'छोटी संपादकीय सूची: स्रोत सहित अर्थ वाले 2 संस्कृत मूल के नाम। मेल न मिलने पर कोई अर्थ नहीं गढ़ा जाता।',search:'नाम या अर्थ खोजें',language:'नाम की लिपि',match:'केवल सुझाई ध्वनि',copy:'नाम कॉपी करें',copied:'नाम कॉपी हुआ',failed:'कॉपी उपलब्ध नहीं; नाम का पाठ चुनें।',none:'सूची में मेल नहीं मिला।',annual:'वार्षिक तिथि के संभावित दिन',year:'ग्रेगोरियन वर्ष (1951–2097)',place:'पालन का स्थान और राज्य',query:'पालन का शहर खोजें',rule:'पालन नियम चुनें',ruleName:'अमान्त · पहला सूर्योदय · लुप्त तिथि: कोई दिन चयनित नहीं',policy:'अधिक मास नीति',regular:'केवल सामान्य मास',both:'अधिक और सामान्य मास शामिल करें',calculate:'संभावित दिन खोजें',notice:'ये परीक्षण के संभावित दिन हैं, प्रमाणित धार्मिक तिथियाँ नहीं। अमान्त कई पश्चिमी/दक्षिणी परंपराओं में है; पूर्णिमान्त और अन्य पारिवारिक नियम उपलब्ध नहीं। दोहराई तिथि: पहला सूर्योदय। लुप्त तिथि: अंतराल दिखाएँ, दिन न चुनें। सूर्योदय और स्रोत स्वीकृति लंबित है।',empty:'इस ग्रेगोरियन वर्ष में मेल नहीं मिला।',ics:'चयनित दिन डाउनलोड करें (.ics)',noIcs:'निर्यात के लिए पुष्ट संभावित दिन नहीं।',busy:'वार्षिक संभावित दिन की गणना…',date:'चयनित स्थानीय दिन',status:'सूर्योदय स्थिति',interval:'तिथि अंतराल (UTC)',unavailable:'रोका गया / अनुपलब्ध',source:'स्रोत और संस्करण',candidate:'संभावित तिथि पालन',calendarNotice:'कैलेंडर में केवल संभावित दिन और नियम हैं; नाम, जन्म तिथि/समय या स्थान नहीं। यह फिर भी संवेदनशील है; प्रमाणित तिथियाँ न मानें।'},
 gu:{title:'જન્મ પંચાંગ અને પરંપરાઓ',instant:'જન્મની ક્ષણે',civil:'નાગરિક વાર',sunrise:'સૂર્યોદયનો વાર',month:'અમાંત ચંદ્ર માસ',names:'નામ સૂચનો',custom:'નામાક્ષર વૈકલ્પિક પરંપરા છે, ફરજ કે ભવિષ્યનું વચન નથી. રોમન જોડણી આપેલા પ્રાદેશિક સ્ત્રોત મુજબ છે; ભિન્નતા શક્ય છે.',seed:'નાની સંપાદકીય યાદી: સ્ત્રોત સાથે અર્થ ધરાવતાં 2 સંસ્કૃત મૂળનાં નામ. મેળ ન હોય તો અર્થ બનાવવામાં આવતો નથી.',search:'નામ અથવા અર્થ શોધો',language:'નામની લિપિ',match:'માત્ર સૂચવેલો ધ્વનિ',copy:'નામ કૉપિ કરો',copied:'નામ કૉપિ થયું',failed:'કૉપિ ઉપલબ્ધ નથી; નામનું લખાણ પસંદ કરો.',none:'યાદીમાં મેળ નથી.',annual:'વાર્ષિક તિથિના સંભવિત દિવસો',year:'ગ્રેગોરિયન વર્ષ (1951–2097)',place:'પાલનનું સ્થળ અને રાજ્ય',query:'પાલનનું શહેર શોધો',rule:'પાલનનો નિયમ પસંદ કરો',ruleName:'અમાંત · પહેલો સૂર્યોદય · લુપ્ત તિથિ: કોઈ દિવસ પસંદ નહીં',policy:'અધિક માસ નીતિ',regular:'માત્ર સામાન્ય માસ',both:'અધિક અને સામાન્ય માસ સામેલ કરો',calculate:'સંભવિત દિવસો શોધો',notice:'આ પરીક્ષણના સંભવિત દિવસો છે, પ્રમાણિત ધાર્મિક તારીખો નથી. અમાંત કેટલીક પશ્ચિમી/દક્ષિણી પરંપરાઓમાં છે; પૂર્ણિમાંત અને અન્ય કૌટુંબિક નિયમો ઉપલબ્ધ નથી. પુનરાવર્તિત તિથિ: પહેલો સૂર્યોદય. લુપ્ત તિથિ: અંતરાલ બતાવો, દિવસ ન પસંદ કરો. સૂર્યોદય અને સ્ત્રોત સ્વીકૃતિ બાકી છે.',empty:'આ ગ્રેગોરિયન વર્ષમાં મેળ નથી.',ics:'પસંદ કરેલા દિવસો ડાઉનલોડ કરો (.ics)',noIcs:'નિકાસ માટે પુષ્ટ સંભવિત દિવસ નથી.',busy:'વાર્ષિક સંભવિત દિવસોની ગણતરી…',date:'પસંદ કરેલો સ્થાનિક દિવસ',status:'સૂર્યોદય સ્થિતિ',interval:'તિથિ અંતરાલ (UTC)',unavailable:'રોકેલું / અનુપલબ્ધ',source:'સ્ત્રોત અને આવૃત્તિઓ',candidate:'સંભવિત તિથિ પાલન',calendarNotice:'કૅલેન્ડરમાં માત્ર સંભવિત દિવસો અને નિયમ છે; નામ, જન્મ તારીખ/સમય કે સ્થળ નથી. તે છતાં સંવેદનશીલ છે; પ્રમાણિત તારીખો ન માનો.'}
};
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
export function candidateCalendar(result,language='en'){
 const t=traditionLabels[language];if(!t)throw new TypeError('Unsupported calendar language.');
 const selected=result.occurrences.filter(x=>x.selectedDate&&['single-sunrise','repeated-at-sunrise'].includes(x.status));
 if(!selected.length)throw new TypeError('No candidate date.');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Synapse//Tithi candidates 1//EN','CALSCALE:GREGORIAN'];
 for(const row of selected){const date=row.selectedDate.replaceAll('-',''),end=new Date(Date.parse(row.selectedDate+'T00:00Z')+86400000).toISOString().slice(0,10).replaceAll('-','');
  lines.push('BEGIN:VEVENT',`UID:${date}-${crypto.randomUUID()}@synapse.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,
   `DTSTART;VALUE=DATE:${date}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${t.candidate}`,
   'DESCRIPTION:'+escapeCalendarText(t.notice+' Asia/Kolkata. '+birthdayRule.id+'. '+term(result.adhikaPolicy,language)),'END:VEVENT');
 }
 // Fold on UTF-8 character boundaries, including continuation whitespace.
 return lines.concat('END:VCALENDAR','').map(line=>{let part='',bytes=0;const folded=[];for(const c of line){const size=new TextEncoder().encode(c).length;if(bytes+size>73){folded.push(part);part=' ';bytes=1;}part+=c;bytes+=size;}folded.push(part);return folded.join('\r\n');}).join('\r\n');
}
function escapeCalendarText(value){return value.replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replace(/\r?\n/g,'\\n');}

export function mountTraditions(container,report,{input,now,language='en'}){
 const t=traditionLabels[language],l=locale(language),root=el('section');root.className='vedic-traditions';root.append(el('h2',t.title),ritualGuideLink(language));
 const p=report.traditions.panchang;
 if(p.status==='available'){const v=p.value,s=v.atInstant;root.append(el('h3',t.instant),el('p',`${t.civil}: ${term(v.civilVara.name,language)} · ${t.sunrise}: ${term(v.sunriseVara.name,language)}`));
  for(const [key,value]of Object.entries(s.limbs))root.append(el('p',`${limbText(key,value,language)} · → ${s.nextTransitions[key].utcInstant}`));
 }else root.append(el('p',`${t.unavailable}: ${diagnosticText(p.diagnostic.code,language)}`));
 const month=report.traditions.month;root.append(el('p',`${t.month}: ${month.status==='available'?term(month.value.name,language)+(month.value.adhika?' · '+term('Adhika',language):''):t.unavailable}`));
 root.append(el('h3',t.names),el('p',t.custom),el('p',t.seed));
 const position=report.features.positions,moon=position.status==='available'?position.value.positions.find(p=>p.body==='Moon'):null;
 const guidance=moon?namingGuidance(moon):{status:'unavailable'};
 root.append(el('p',guidance.status==='available'?`${l.nakshatra} ${nakshatraName(guidance.nakshatra,language)} · ${l.pada} ${guidance.pada} · ${guidance.syllable}`:t.unavailable));
 function field(text,tag,id){const label=el('label',text),control=el(tag);control.id=id;label.append(control);root.append(label);return control;}
 const query=field(t.search,'input','name-query');query.type='search';query.maxLength=80;
 const script=field(t.language,'select','name-script');for(const [value,text]of [['all','Roman'],['hi','हिन्दी'],['gu','ગુજરાતી']]){const o=el('option',term(text,language));o.value=value;script.append(o);}
 script.value=language==='en'?'all':language;
 const match=field(t.match,'input','name-match');match.type='checkbox';match.checked=guidance.status==='available';match.disabled=guidance.status!=='available';
 const names=el('ul'),copyStatus=el('p');copyStatus.setAttribute('role','status');root.append(names,copyStatus);
 let destroyed=false,pending=null,urls=new Set(),timers=new Set(),annual=null;
 function renderNames(){names.replaceChildren();const rows=findNames({query:query.value,language:script.value,syllable:match.checked?guidance.syllable:null});
  if(!rows.length)names.append(el('li',t.none));for(const name of rows){const li=el('li'),value=script.value==='all'?name.roman:name[script.value];li.append(el('span',`${value} · ${name.meaning[language]} · ${term(name.language,language)} `));
   const button=el('button',t.copy);button.type='button';button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);if(!destroyed)copyStatus.textContent=t.copied;}catch{if(!destroyed)copyStatus.textContent=t.failed;}});li.append(button);names.append(li);}
 }
 query.addEventListener('input',renderNames);script.addEventListener('change',renderNames);match.addEventListener('change',renderNames);renderNames();
 const sources=el('details');sources.append(el('summary',t.source),el('p',namingData.version+' · '+term(namingData.variant,language)),el('p',l.fallback));
 for(const source of [namingData.source,...namingData.names.map(n=>n.source)])sources.append(el('p',source));root.append(sources);
 root.append(el('h3',t.annual),el('p',t.notice));
 const year=field(t.year,'input','observance-year');year.type='number';year.min='1951';year.max='2097';year.required=true;year.value=String(new Date(now()).getUTCFullYear());
 const city=field(t.query,'input','observance-query');city.type='search';city.maxLength=100;
 const place=field(t.place,'select','observance-place');place.required=true;const birthPlace=el('option',placeLabel(report.birth.place,language));birthPlace.value=report.birth.place.id;place.append(birthPlace);
 const rule=field(t.rule,'select','observance-rule');rule.required=true;for(const [value,text]of [['',t.rule],[birthdayRule.id,t.ruleName]]){const o=el('option',text);o.value=value;rule.append(o);}
 const policy=field(t.policy,'select','observance-policy');for(const [value,text]of [['regular-only',t.regular],['include-adhika',t.both]]){const o=el('option',text);o.value=value;policy.append(o);}
 const calculate=el('button',t.calculate);calculate.type='button';calculate.id='observance-calculate';calculate.disabled=p.status!=='available'||month.status!=='available';
 const output=el('section'),status=el('p');status.setAttribute('role','status');root.append(calculate,status,output);
 function revoke(){for(const timer of timers)clearTimeout(timer);for(const url of urls)URL.revokeObjectURL(url);timers.clear();urls.clear();}
 function invalidate(){clearTimeout(pending);pending=null;annual=null;output.replaceChildren();status.textContent='';calculate.disabled=p.status!=='available'||month.status!=='available';revoke();}
 for(const c of [year,place,rule,policy]){c.addEventListener('input',invalidate);c.addEventListener('change',invalidate);}
 city.addEventListener('input',()=>{invalidate();place.replaceChildren(el('option',t.place));place.options[0].value='';try{for(const match of searchPlaces(city.value,{limit:12}).matches){const o=el('option',placeLabel(match,language));o.value=match.id;place.append(o);}}catch{status.textContent=l.error;}});
 function downloadCalendar(){const url=URL.createObjectURL(new Blob([candidateCalendar(annual,language)],{type:'text/calendar;charset=utf-8'}));urls.add(url);const a=el('a');a.href=url;a.download='tithi-candidates.ics';a.click();const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);timers.delete(timer);},1000);timers.add(timer);}
 calculate.addEventListener('click',()=>{if(![year,place,rule,policy].every(c=>c.reportValidity()))return;invalidate();calculate.disabled=true;status.textContent=t.busy;
  pending=setTimeout(()=>{pending=null;if(destroyed)return;try{annual=yearlyTithiCandidates({...input,language},{year:Number(year.value),observancePlaceId:place.value,ruleId:rule.value,adhikaPolicy:policy.value},{now:now()});
   status.textContent='';output.append(el('p',`${annual.rule.id} · ${term(annual.adhikaPolicy,language)} · ${placeLabel(annual.place,language)}`));
   if(!annual.occurrences.length)output.append(el('p',t.empty));
   for(const row of annual.occurrences){const box=el('section');box.append(el('h4',`${term(row.month.name,language)}${row.month.adhika?' · '+term('Adhika',language):''}`),el('p',`${t.status}: ${term(row.status,language)}`),el('p',`${t.date}: ${row.selectedDate??t.noIcs}`),el('p',`${t.interval}: ${row.start.utcInstant} → ${row.end.utcInstant}`),el('p',row.sunriseDates.join(', ')));output.append(box);}
   const warning=el('details');warning.append(el('summary',t.source));for(const code of annual.warnings)warning.append(el('p',diagnosticText(code,language)));output.append(warning);
   output.append(el('p',t.calendarNotice));const download=el('button',t.ics);download.type='button';download.id='observance-ics';download.disabled=!annual.occurrences.some(r=>r.selectedDate);download.addEventListener('click',downloadCalendar);output.append(download);
  }catch(error){status.textContent=`${t.unavailable}: ${diagnosticText(error.code??'COMPUTATION_LIMIT',language)}`;}finally{if(!destroyed)calculate.disabled=false;}
  },0);
 });
 container.replaceChildren(root);return {destroy(){destroyed=true;clearTimeout(pending);revoke();annual=null;root.remove();}};
}
