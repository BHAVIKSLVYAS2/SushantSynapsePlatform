import knowledge from './jyotish-content.json' with {type:'json'};
import findingSchema from './jyotish-finding.schema.json' with {type:'json'};
import {adaptJyotishCalculation} from './jyotish-adapter.mjs';
import {bodyName,signName} from './locale.mjs';
import {temperament,manner} from './kundli-consultation-copy.mjs';
export const intelligenceVersion='jyotish-narrative-hi-2';
export const generationPolicy=Object.freeze({provider:'local-deterministic',promptVersion:null,remoteRequests:0,tokenBudget:0,retries:0,logsBirthData:false,cacheLimit:24});
const cache=new Map();
const immutable=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(immutable);Object.freeze(value);}return value;};
const hash=s=>{let a=2166136261,b=5381;for(const c of s){a=Math.imul(a^c.codePointAt(0),16777619);b=Math.imul(b,33)^c.codePointAt(0);}return (a>>>0).toString(16)+(b>>>0).toString(16);};
const named=body=>bodyName(body,'hi'),theme=(h,kb=knowledge)=>kb.houseThemes[h-1],paragraph=(text,ids)=>({text,findingIds:[...new Set(ids)]});
const physical=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
// The contract uses only these JSON Schema keywords; no unsupported dialect claims.
function conforms(value,schema){const type=value===null?'null':Array.isArray(value)?'array':typeof value;if(schema.type&&!(Array.isArray(schema.type)?schema.type:[schema.type]).includes(type))return false;if(schema.enum&&!schema.enum.includes(value))return false;if(type==='string'&&schema.minLength&&value.length<schema.minLength)return false;if(type==='number'&&(!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity)))return false;if(type==='array'&&schema.items&&!value.every(v=>conforms(v,schema.items)))return false;if(type==='object'){if(schema.required?.some(k=>!Object.hasOwn(value,k)))return false;for(const [key,sub]of Object.entries(schema.properties||{}))if(Object.hasOwn(value,key)&&!conforms(value[key],sub))return false;}return true;}
export function evaluateJyotishRules(snapshot,kb=knowledge){
 const findings=[];
 for(const topic of kb.topics)for(const number of topic.houses){const house=snapshot.houses.find(h=>h.number===number),lord=snapshot.planets.find(p=>p.body===house?.ruler);if(!house||!lord?.house)continue;
  const aspects=snapshot.planets.filter(p=>physical.includes(p.body)&&(number-p.house+12)%12===6).map(p=>p.body);
  const colocated=snapshot.planets.filter(p=>p.house===lord.house&&p.body!==lord.body).map(p=>p.body);
  findings.push({id:topic.id+':H'+number,topic:topic.id,ruleId:'house-lord-context',source:kb.source,evidence:{house:{...house},ruler:{...lord},ownership:snapshot.houses.filter(h=>h.ruler===lord.body).map(h=>h.number),aspects,colocated},modifiers:[...house.occupants,...aspects],supporting:[],conflicting:[],importance:topic.priority-(topic.houses.indexOf(number)*10),period:null,verification:kb.reviewStatus,limits:snapshot.unavailable});
 }
 return findings;
}
export function combineJyotishFindings(findings,kb=knowledge){
 return findings.map(f=>{const same=findings.filter(g=>g.topic===f.topic&&g.id!==f.id),bodies=[...new Set([f.evidence.ruler.body,...f.evidence.house.occupants,...f.evidence.aspects])];
  return {...f,supporting:same.filter(g=>g.evidence.ruler.body===f.evidence.ruler.body).map(g=>g.id),conflicting:kb.combinations.filter(c=>c.bodies.every(b=>bodies.includes(b))).map(c=>c.id)};
 });
}
function basisText(f){const e=f.evidence;return `भाव ${e.house.number} में ${signName(e.house.sign,'hi')}; स्वामी ${named(e.ruler.body)} भाव ${e.ruler.house} में। `+(e.house.occupants.length?`उपस्थित ग्रह: ${e.house.occupants.map(named).join(', ')}। `:'')+(e.aspects.length?`सातवीं पूर्ण-राशि दृष्टि: ${e.aspects.map(named).join(', ')}।`:'');}
function composeTopic(topic,findings,snapshot,kb){
 const selected=findings.filter(f=>f.topic===topic.id).sort((a,b)=>b.importance-a.importance),ids=selected.map(f=>f.id);
 if(!selected.length)return {id:topic.id,title:topic.title,status:'unavailable',paragraphs:[],findingIds:[]};
 const primary=selected[0],lord=primary.evidence.ruler,role=kb.planetThemes[lord.body],paragraphs=[paragraph(topic.intro,ids)];
 if(topic.id==='appearance'){
  paragraphs.push(paragraph(`आपके ${signName(snapshot.rising,'hi')} लग्न के लिए मौजूदा अध्ययन-वर्णन यह है: ${manner[snapshot.rising-1][1]} इसे बाहरी व्यवहार की एक सांकेतिक भाषा समझें, वास्तविक चेहरे या देह का विवरण नहीं।`,[primary.id]));
  paragraphs.push(paragraph(`लग्न के स्वामी ${named(lord.body)} का संबंध ${theme(lord.house,kb)} से बनता है। इसलिए केवल राशि के एक चित्र पर रुकने के बजाय यह देखना उपयोगी है कि व्यक्ति अपनी उपस्थिति किन भूमिकाओं और परिस्थितियों में व्यक्त करता है। ${role.theme} की परंपरागत छवि यहाँ विचार का एक सूत्र है।`,[primary.id]));
 }else if(topic.id==='overview'){
  paragraphs.push(paragraph(`यहाँ पहल का सूत्र ${named(lord.body)} से जुड़ता है। उसका ${theme(lord.house,kb)} से संबंध बताता है कि आत्मप्रस्तुति को अकेले पढ़ने के बजाय जीवन की इस भूमिका के साथ देखना चाहिए। काम और साझेदारी के नीचे दिए गए अध्याय इसी आधार को अलग संदर्भों में खोलते हैं।`,[primary.id]));
 }else{
  paragraphs.push(paragraph(`${named(lord.body)} से जुड़ी ${role.theme} की पारंपरिक भाषा इस विषय को पढ़ने का एक सूत्र है। इस ग्रह की गणितीय स्थिति ${theme(lord.house,kb)} से संबंध जोड़ती है। इसे किसी निश्चित घटना का संकेत बनाने के बजाय अपने अनुभव में इन दोनों क्षेत्रों के बीच समय, अपेक्षा और जिम्मेदारी का संबंध देखें।`,[primary.id]));
 }
 if(topic.id==='personality'){
  const moon=snapshot.planets.find(p=>p.body==='Moon'&&p.stableSign);if(moon){paragraphs.push(paragraph(`चंद्रमा की ${signName(moon.sign,'hi')} राशि के संदर्भ में: ${temperament[moon.sign-1][1]} लग्न के संकेत बाहर की प्रतिक्रिया का और चंद्रमा का संकेत भीतर की जरूरत का अलग दृष्टिकोण देता है; दोनों को एक स्थायी व्यक्तित्व-लेबल में सीमित न करें।`,ids));if(snapshot.rising&&((snapshot.rising-1)%4)!==((moon.sign-1)%4))paragraphs.push(paragraph('लग्न और चंद्र राशि के तत्व अलग हैं। इस ढाँचे में बाहर अपनाई गई रणनीति और भीतर सहज लगने वाली प्रतिक्रिया में अंतर की गुंजाइश रखें। आत्मविश्वास और संवेदनशीलता साथ हों तो निर्णय से पहले अनुभव को शब्द देने का समय उपयोगी हो सकता है; यह आपके वास्तविक व्यवहार का मनोवैज्ञानिक परीक्षण नहीं है।',ids));}
 }
 if(selected.length>1){const related=selected.slice(1).map(f=>`${theme(f.evidence.house.number,kb)} का सूत्र ${named(f.evidence.ruler.body)} के माध्यम से ${theme(f.evidence.ruler.house,kb)} से जुड़ता है`);paragraphs.push(paragraph('इसी विषय का दूसरा पक्ष देखें: '+related.join('; ')+'। इन संबंधों से प्राथमिकताओं के बीच संवाद का विषय बनता है, किसी एक पक्ष की निश्चित जीत या हार का नहीं।',selected.slice(1).map(f=>f.id)));}
 const modifiers=[...new Set([...primary.evidence.house.occupants,...primary.evidence.aspects])].filter(b=>b!==lord.body);
 if(modifiers.length)paragraphs.push(paragraph(`इस पठन में ${modifiers.map(named).join(' और ')} का संदर्भ भी है। ${modifiers.slice(0,2).map(b=>`${named(b)} के लिए ${kb.planetThemes[b].theme}`).join(' तथा ')} की भाषा मुख्य सूत्र को अलग जोर देती है। पूरी बल-गणना और योग्यताएँ उपलब्ध न होने से किसी ग्रह को निर्णायक या दूसरे संकेत को निष्प्रभावी नहीं माना गया है।`,[primary.id]));
 const conflicts=[...new Set(selected.flatMap(f=>f.conflicting))];for(const id of conflicts.slice(0,1))paragraphs.push(paragraph(kb.combinations.find(c=>c.id===id).text,selected.filter(f=>f.conflicting.includes(id)).map(f=>f.id)));
 if(primary.evidence.colocated.length&&!conflicts.length)paragraphs.push(paragraph(`${named(lord.body)} और ${primary.evidence.colocated.map(named).join(', ')} एक पूर्ण-राशि भाव में साथ हैं। इससे संदर्भ साझा होता है, लेकिन केवल इस साथ होने को कोई अंतिम योग या निश्चित फल नहीं कहा गया है; अंशगत दूरी और अन्य योग्यताओं की जाँच अलग है।`,[primary.id]));
 if(topic.practice)paragraphs.push(paragraph(topic.practice,ids));
 return {id:topic.id,title:topic.title,status:'available',paragraphs,findingIds:ids};
}
function addPeriodFinding(findings,snapshot,period,id,kb){
 const bodies=[...new Set([period.major,period.minor].filter(Boolean))],placements=bodies.map(body=>snapshot.planets.find(p=>p.body===body)).filter(Boolean);
 const f={id,topic:'periods',ruleId:'period-lord-context',source:null,evidence:{bodies,placements,ownership:bodies.map(body=>({body,houses:snapshot.houses.filter(h=>h.ruler===body).map(h=>h.number)}))},modifiers:[],supporting:[],conflicting:[],importance:50,period:{start:period.start,end:period.end},verification:kb.reviewStatus,limits:snapshot.unavailable};findings.push(f);return f;
}
function periodProse(period,snapshot,kb=knowledge){
 const major=snapshot.planets.find(p=>p.body===period.major),minor=snapshot.planets.find(p=>p.body===period.minor);
 return `${named(period.major)} की महादशा${period.minor?' और '+named(period.minor)+' की अंतर्दशा':''} में ${kb.planetThemes[period.major].theme} का दीर्घ सूत्र${period.minor?' तथा '+kb.planetThemes[period.minor].theme+' का उपकालीन संदर्भ':''} साथ पढ़ा गया है। `+(major?.house?`${named(major.body)} की जन्मस्थिति ${theme(major.house,kb)} से जुड़ती है। `:'जन्म-भाव स्थिर न होने से भावाधारित विस्तार रोका गया है। ')+(minor?.house&&minor.body!==major?.body?`${named(minor.body)} का ${theme(minor.house,kb)} से संबंध प्राथमिकताओं के दूसरे पक्ष को सामने लाता है। `:'')+'यह गणना में उपलब्ध अवधि का विषय है; नौकरी, विवाह या किसी अन्य घटना की निश्चित तारीख नहीं।';
}
function chronologicalSections(snapshot,findings,kb){
 const stages={id:'stages',title:'जीवन के विभिन्न चरण',status:snapshot.periods.length?'available':'unavailable',paragraphs:[],findingIds:[]};
 const year=365.2425*86400000,birth=Date.parse(snapshot.birthInstant),last=Date.parse(snapshot.periods.at(-1)?.end);
 if(Number.isFinite(birth))for(const [id,label,from,to]of kb.stages){const start=birth+from*year,end=to===null?last:birth+to*year;const periods=snapshot.periods.filter(p=>Date.parse(p.end)>start&&Date.parse(p.start)<end);if(!periods.length)continue;const ids=periods.map((p,i)=>addPeriodFinding(findings,snapshot,{major:p.lord,start:p.start,end:p.end},'stage:'+id+':'+i,kb).id);stages.findingIds.push(...ids);stages.paragraphs.push(paragraph(`${label} (${from}${to===null?'+':'–'+to} वर्ष; केवल गणना में उपलब्ध समय-खिड़की): ${periods.map(p=>named(p.lord)).join(' → ')} की महादशाओं का क्रम इस खिड़की से मिलता है। ${periods.slice(0,2).map(p=>`${named(p.lord)} के लिए ${kb.planetThemes[p.lord].theme}`).join('; ')} यहाँ अध्ययन के विषय हैं। यह बीती घटनाओं का दावा या भावी जीवन-सीमा नहीं है।`,ids));}
 const periods={id:'future',title:'वर्तमान एवं आगामी दशा का भविष्यफल',status:snapshot.active?'available':'unavailable',paragraphs:[],findingIds:[]};
 const next=snapshot.periods.flatMap(m=>m.subperiods.map(a=>({major:m.lord,minor:a.lord,start:a.start,end:a.end}))).filter(p=>Date.parse(p.end)>Date.parse(snapshot.at)).slice(0,3);
 for(const [i,p]of next.entries()){const f=addPeriodFinding(findings,snapshot,p,'period:'+i,kb);periods.findingIds.push(f.id);const dates=[p.start,p.end].map(v=>new Intl.DateTimeFormat('hi',{dateStyle:'medium',timeZone:'Asia/Kolkata'}).format(new Date(v)));periods.paragraphs.push(paragraph(dates.join(' से ')+' तक: '+periodProse(p,snapshot,kb),[f.id]));}
 return [stages,periods];
}
export function validateJyotishNarrative(result){
 if(!result?.snapshot||!Array.isArray(result.findings)||!Array.isArray(result.sections)||result.findings.some(f=>!conforms(f,findingSchema)))return {valid:false,errors:[{section:'all',reason:'finding-json-schema'}]};
 const errors=[],ids=new Set(result.findings.map(f=>f.id)),seen=new Set();
 for(const f of result.findings)if(!conforms(f,findingSchema))errors.push({section:f.topic,reason:'finding-json-schema'});
 for(const p of result.snapshot.planets)if(!physical.concat(['Rahu','Ketu']).includes(p.body)||!Number.isInteger(p.sign)||p.sign<1||p.sign>12||!Number.isFinite(p.longitude)||p.longitude<0||p.longitude>=360||(p.house!==null&&(!Number.isInteger(p.house)||p.house<1||p.house>12)))errors.push({section:'all',reason:'calculation-contract'});
 if(ids.size!==result.findings.length)errors.push({section:'all',reason:'duplicate-finding'});
 for(const f of result.findings){if(!f.id||!f.ruleId||!f.topic||!f.verification)errors.push({section:f.topic,reason:'finding-contract'});if(f.evidence.house){const expected=result.snapshot.houses.find(h=>h.number===f.evidence.house.number),planet=result.snapshot.planets.find(p=>p.body===f.evidence.ruler.body);if(JSON.stringify(expected)!==JSON.stringify(f.evidence.house)||JSON.stringify(planet)!==JSON.stringify(f.evidence.ruler))errors.push({section:f.topic,reason:'chart-mismatch'});}if(f.period&&!result.snapshot.periods.some(m=>(m.start===f.period.start&&m.end===f.period.end)||m.subperiods.some(a=>a.start===f.period.start&&a.end===f.period.end)))errors.push({section:f.topic,reason:'period-mismatch'});}
 for(const f of result.findings){const e=f.evidence;if(e.house){const expected=result.snapshot.planets.filter(p=>physical.includes(p.body)&&(e.house.number-p.house+12)%12===6).map(p=>p.body);if(JSON.stringify(e.aspects)!==JSON.stringify(expected)||JSON.stringify(e.ownership)!==JSON.stringify(result.snapshot.houses.filter(h=>h.ruler===e.ruler.body).map(h=>h.number)))errors.push({section:f.topic,reason:'modifier-mismatch'});}else if(e.bodies?.some(b=>!physical.concat(['Rahu','Ketu']).includes(b))||e.placements?.some(p=>!result.snapshot.planets.some(real=>JSON.stringify(real)===JSON.stringify(p))))errors.push({section:f.topic,reason:'period-body-mismatch'});}
 for(const f of result.findings){const e=f.evidence;if(e.house){const colocated=result.snapshot.planets.filter(p=>p.house===e.ruler.house&&p.body!==e.ruler.body).map(p=>p.body);if(JSON.stringify(e.colocated)!==JSON.stringify(colocated)||JSON.stringify(f.modifiers)!==JSON.stringify([...e.house.occupants,...e.aspects]))errors.push({section:f.topic,reason:'colocation-mismatch'});if(f.supporting.some(id=>!result.findings.some(g=>g.id===id&&g.id!==f.id&&g.topic===f.topic&&g.evidence.ruler?.body===e.ruler.body)))errors.push({section:f.topic,reason:'support-mismatch'});}else if(f.period){const bodies=e.bodies||[],placements=bodies.map(body=>result.snapshot.planets.find(p=>p.body===body)).filter(Boolean),ownership=bodies.map(body=>({body,houses:result.snapshot.houses.filter(h=>h.ruler===body).map(h=>h.number)}));if(JSON.stringify(e.placements)!==JSON.stringify(placements)||JSON.stringify(e.ownership)!==JSON.stringify(ownership))errors.push({section:f.topic,reason:'period-context-mismatch'});}}
 for(const f of result.findings.filter(f=>f.period)){const expected=result.snapshot.periods.flatMap(m=>[{start:m.start,end:m.end,bodies:[m.lord]},...m.subperiods.map(a=>({start:a.start,end:a.end,bodies:[...new Set([m.lord,a.lord])]}))]);if(!expected.some(p=>p.start===f.period.start&&p.end===f.period.end&&JSON.stringify(p.bodies)===JSON.stringify(f.evidence.bodies)))errors.push({section:f.topic,reason:'period-lord-mismatch'});}
 for(const section of result.sections)for(const p of section.paragraphs){if(!p.text||!p.findingIds.length||p.findingIds.some(id=>!ids.has(id)))errors.push({section:section.id,reason:'untraceable-paragraph'});if(seen.has(p.text))errors.push({section:section.id,reason:'duplicate-paragraph'});seen.add(p.text);if(/निश्चित रूप से होगा|गारंटी है|आपको (?:कैंसर|मधुमेह|हृदयरोग)|मृत्यु होगी|वैज्ञानिक रूप से सिद्ध|निश्चित विवाह तिथि/u.test(p.text))errors.push({section:section.id,reason:'unsupported-outcome'});}
 return {valid:!errors.length,errors};
}
export function buildJyotishIntelligence(report,{rules=knowledge}={}){
 const snapshot=adaptJyotishCalculation(report),serialized=JSON.stringify([intelligenceVersion,rules,snapshot]),key=hash(serialized),cached=cache.get(key);if(cached?.serialized===serialized)return {...cached.result,cache:{hit:true,key}};
 const findings=combineJyotishFindings(evaluateJyotishRules(snapshot,rules),rules),sections=rules.topics.map(t=>composeTopic(t,findings,snapshot,rules));sections.push(...chronologicalSections(snapshot,findings,rules));
 const overview=findings.filter(f=>f.topic==='overview');if(overview.length)sections.push({id:'conclusion',title:'समग्र निष्कर्ष एवं मार्गदर्शन',status:'available',findingIds:overview.map(f=>f.id),paragraphs:[paragraph('इस पठन में सबसे उपयोगी बात एक परिणाम चुन लेना नहीं, अपने अलग जीवन-संदर्भों का संबंध पहचानना है। आत्मप्रस्तुति, जिम्मेदारी और साझेदारी के ऊपर दिए गए सूत्रों को वास्तविक अनुभव से मिलाएँ। जहाँ संकेत अलग जरूरतें दिखाते हैं, वहाँ संवाद और व्यवहार में जाँच को निश्चित भविष्यवाणी पर प्राथमिकता दें।',overview.map(f=>f.id))]});
 const explained=new Map();for(const section of sections){const shared=new Set();section.paragraphs=section.paragraphs.filter(p=>{const previous=explained.get(p.text);if(previous){shared.add(previous);return false;}explained.set(p.text,section.title);return true;});if(shared.size)section.relatedSections=[...shared];}

 for(const f of findings)f.interpretation={language:'hi',text:f.evidence.house?`${theme(f.evidence.house.number,rules)} का सूत्र ${named(f.evidence.ruler.body)} की ${theme(f.evidence.ruler.house,rules)} से जुड़ी स्थिति के साथ पढ़ा गया है।`:periodProse({major:f.evidence.bodies[0],minor:f.evidence.bodies[1],...f.period},snapshot,rules)};
 const result={schemaVersion:1,version:intelligenceVersion,rulesVersion:rules.version,kind:'traditional-editorial-natal',reviewStatus:rules.reviewStatus,snapshot,findings,sections,generation:generationPolicy};result.quality=validateJyotishNarrative(result);
 if(!result.quality.valid){const bad=new Set(result.quality.errors.map(e=>e.section));result.sections=result.sections.map(s=>bad.has('all')||bad.has(s.id)?{...s,status:'withheld-validation',paragraphs:[]}:s);}
 immutable(result);cache.set(key,{serialized,result});while(cache.size>generationPolicy.cacheLimit)cache.delete(cache.keys().next().value);return {...result,cache:{hit:false,key}};
}
export function clearJyotishCache(){cache.clear();}
export {knowledge as jyotishKnowledge,basisText as jyotishBasisText};
