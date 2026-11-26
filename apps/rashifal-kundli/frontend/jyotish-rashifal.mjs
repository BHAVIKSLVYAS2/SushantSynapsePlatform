import {bodyName} from './locale.mjs';
import knowledge from './jyotish-content.json' with {type:'json'};
import {leadingTransit,publicRashiSections,publicReadingVersion} from './jyotish-public-reading.mjs';
const ruleHash=[...JSON.stringify(knowledge)].reduce((h,c)=>Math.imul(h^c.codePointAt(0),16777619),2166136261)>>>0;
export const rashifalIntelligenceVersion='rashifal-evidence-hi-3-'+ruleHash.toString(16)+'-'+publicReadingVersion;
const groups=[['work','काम और जिम्मेदारियाँ',['Sun','Saturn','Mars']],['money','संसाधन और आर्थिक फैसले',['Jupiter','Venus','Mercury']],['relationships','परिवार और संवाद',['Moon','Venus','Mercury']],['wellbeing','मन, दिनचर्या और विश्राम',['Moon','Saturn']]];
export function localizedTransitAreas(grahas,view,language){
 return groups.map(([, , bodies])=>{
  const related=grahas.filter(g=>bodies.includes(g.body)).map(g=>({...g,observations:g.observations.map(o=>({...o,house:o.relativeHouse}))}));
  const review=related.some(g=>g.counts.obstructed>0);
  const support=related.some(g=>g.counts.supportive>0);
  const state=review&&support?'mixed':review?'review':support?'support':'neutral';
  return leadingTransit(related,state,view,language);
 });
}
export function composeIntelligentRashifal({period,rashi,grahas,timeline,view=period.kind==='weekly'?'weekly':'today'}){
 const findings=grahas.map(g=>({id:'transit:'+g.body,topic:'transit',body:g.body,houses:[...g.houses],counts:{...g.counts},sampleCount:g.sampleCount,ruleId:'phaladipika-26-moon-transits-v1',verification:'existing-source-table-independent-review-pending',period:{start:period.startUtc,end:period.endUtc},observations:g.observations.map(o=>({at:o.utcInstant,house:o.relativeHouse,status:o.status,blockers:o.blockers,nearBoundary:o.nearBoundary})),limits:['general-selected-Moon-sign','samples-not-duration-or-probability','no-natal-chart-or-dasha']}));
 const sections=[],useful=findings.filter(f=>f.counts.supportive+f.counts.obstructed>0),selected=[...useful].sort((a,b)=>(b.counts.supportive+b.counts.obstructed)-(a.counts.supportive+a.counts.obstructed)||a.body.localeCompare(b.body));
 const ids=selected.slice(0,2).map(f=>f.id);if(!ids.length&&findings[0])ids.push(findings[0].id);
 sections.push({id:'overall',title:period.kind==='weekly'?'सप्ताह का समग्र संदर्भ':'दिन का समग्र संदर्भ',paragraphs:[]});
 for(const [id,title]of groups)sections.push({id,title,paragraphs:[]});
 // Compose each life area independently: shared evidence must not leave an area
 // with only generic advice after cross-section paragraph deduplication.
 const actions={work:['काम की योजना और जिम्मेदारियाँ स्पष्ट करने','अधूरे काम की निर्भरता और समय-सीमा जाँचने'],money:['बजट और उपलब्ध संसाधनों की समीक्षा करने','भुगतान, खर्च और समझौते की शर्तें दोबारा देखने'],relationships:['अपनी बात और अपेक्षाएँ साफ रखने','जवाब देने से पहले सामने वाले की बात समझने'],wellbeing:['काम और विश्राम का संतुलन रखने','दिनचर्या में अनावश्यक दबाव कम करने']};
 const stateText={supportive:'अनुकूल',obstructed:'वेध के कारण बाधित','outside-favorable':'चुनी अनुकूल-सूची से बाहर',uncertain:'भाव-सीमा के पास अनिश्चित','rule-unresolved':'अपूर्ण नियम के कारण अनिर्णीत'};
 const describe=f=>{const n=bodyName(f.body,'hi'),c=f.counts,states=Object.keys(stateText).filter(s=>c[s]);const houses=f.houses.length?`चंद्र राशि से भाव ${f.houses.join(' और ')}`:'भाव-सीमा';let text=`${n} का गोचर ${houses} में है। `;text+=states.length===1?`उपलब्ध गणना-बिंदुओं पर इसकी स्थिति ${stateText[states[0]]} है।`:`इस अवधि में ${states.map(s=>stateText[s]).join(' तथा ')} स्थितियाँ मिली हैं; इसलिए पूरी अवधि का फल एक जैसा नहीं पढ़ना चाहिए।`;const first=f.observations[0],last=f.observations.at(-1);if(first&&last&&first.status!==last.status)text+=` पहली गणना में स्थिति ${stateText[first.status]} और अंतिम गणना में ${stateText[last.status]} है।`;if(c.obstructed){const blockers=[...new Set(f.observations.filter(o=>o.status==='obstructed').flatMap(o=>o.blockers||[]))];if(blockers.length&&blockers.every(b=>typeof b==='string'))text+=` वेध का ग्रह-संदर्भ: ${blockers.map(b=>bodyName(b,'hi')).join(' और ')}।`;}return text;};
 const dates=period.dates.map(d=>new Intl.DateTimeFormat('hi-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'}).format(new Date(d+'T12:00:00+05:30')));
 sections[0].paragraphs=[{text:`${dates[0]}${dates.length>1?' से '+dates.at(-1):''}: चुनी चंद्र राशि के लिए सामान्य गोचर-संदर्भ। नीचे हर विषय में ग्रह की वास्तविक स्थिति और उसी के अनुरूप सुझाव अलग दिए गए हैं। यह व्यक्तिगत जन्मपत्री या दशा का फलादेश नहीं है।`,findingIds:ids}];
 for(const [id,,bodies]of groups){const section=sections.find(s=>s.id===id);if(!section)continue;const candidates=bodies.map(b=>findings.find(f=>f.body===b)).filter(Boolean);section.paragraphs=candidates.map(f=>({text:describe(f),findingIds:[f.id]}));const supportive=candidates.some(f=>f.counts.supportive),obstructed=candidates.some(f=>f.counts.obstructed);section.paragraphs.push({text:`व्यावहारिक सुझाव: ${actions[id][obstructed?1:0]} पर ध्यान दें। ${supportive&&obstructed?'सहयोगी और वेध वाले संकेत साथ हैं; पूरे समय को समान अनुकूल मानकर निर्णय न लें।':supportive?'कुछ सहयोगी संकेत हैं; परिणाम आपकी तैयारी और वास्तविक परिस्थितियों पर भी निर्भर है।':obstructed?'वेध को निश्चित रुकावट या नुकसान की भविष्यवाणी न मानें।':'अनुकूल वर्गीकरण न मिलना अपने आप में प्रतिकूल फल का प्रमाण नहीं है।'}`,findingIds:candidates.map(f=>f.id)});}
 const available=new Set(findings.map(f=>f.id)),errors=[];for(const s of sections)for(const p of s.paragraphs)if(!p.findingIds.length||p.findingIds.some(id=>!available.has(id)))errors.push({section:s.id,reason:'missing-finding'});
 for(const f of findings){const validStates=['supportive','obstructed','outside-favorable','uncertain','rule-unresolved'];if(f.sampleCount!==f.observations.length||Object.values(f.counts).reduce((a,b)=>a+b,0)!==f.sampleCount||validStates.some(state=>f.counts[state]!==f.observations.filter(o=>o.status===state).length)||f.observations.some(o=>!validStates.includes(o.status)||Date.parse(o.at)<Date.parse(period.startUtc)||Date.parse(o.at)>=Date.parse(period.endUtc)))errors.push({section:'all',reason:'observation-mismatch'});}
 const composed=publicRashiSections(sections,findings,view);for(const s of composed)for(const p of s.publicParagraphs)if(!p.findingIds.length||p.findingIds.some(id=>!available.has(id)))errors.push({section:s.id,reason:'missing-public-finding'});
 return {version:rashifalIntelligenceVersion,rashi,kind:'general-Moon-sign-transits',findings,sections:composed,quality:{valid:!errors.length,errors},timelineStatus:timeline?.status||'existing-timeline',supportedPeriods:['daily','weekly'],unsupportedPeriods:['monthly','yearly']};
}
