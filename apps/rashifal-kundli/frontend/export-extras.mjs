import {term,limbText} from './display-text.mjs';
import {locale,bodyName,signName} from './locale.mjs';
import {advancedLabels} from './advanced-view.mjs';
import {traditionLabels} from './tradition-view.mjs';
import {readingText} from './kundli-reading-copy.mjs';
import {composeKundliPeriod} from './kundli-reading-prose.mjs';
import {projectChart} from './export-charts.mjs';

export const reportOptions={
 en:{style:'Report chart layout',advanced:'Include calculated advanced results',previews:'Include time-sensitive Exact-time chart previews',previewNote:'Recorded-instant preview only. This chart failed the birth-time boundary screen; small time changes may alter placements.',notCalculated:'Not calculated. Open Advanced calculations to calculate these results before exporting.',scope:'Includes available D1, D9, Chandra, Hora/D2 and D16 charts, graha degrees, readings, Bhavishyafal, Dasha and birth Panchang. Advanced divisions and strength tables are included only after calculation and when selected. Gochar explorations, rule checks, time-sensitivity experiments and annual observance searches remain separate.',degrees:'Degree within sign',calendar:'Birth Panchang',future:'Bhavishyafal · current and upcoming periods'},
 hi:{style:'रिपोर्ट की कुंडली शैली',advanced:'गणना किए गए उन्नत परिणाम शामिल करें',previews:'सटीक समय के समय-संवेदनशील चार्ट पूर्वावलोकन शामिल करें',previewNote:'केवल दर्ज क्षण का पूर्वावलोकन। यह चार्ट जन्म-समय सीमा जाँच में स्थिर नहीं था; समय में छोटे बदलाव से स्थिति बदल सकती है।',notCalculated:'गणना नहीं की गई। निर्यात से पहले उन्नत गणना खोलकर परिणाम निकालें।',scope:'उपलब्ध D1, D9, चंद्र, होरा/D2 और D16 कुंडली, ग्रह अंश, फलित, भविष्यफल, दशा और जन्म पंचांग शामिल हैं। उन्नत वर्ग और बल तालिकाएँ गणना और चयन के बाद शामिल होंगी। गोचर अन्वेषण, नियम जाँच, समय-संवेदनशीलता प्रयोग और वार्षिक तिथि खोज अलग हैं।',degrees:'राशि के भीतर अंश',calendar:'जन्म पंचांग',future:'भविष्यफल · वर्तमान और आगामी दशाएँ'},
 gu:{style:'અહેવાલની કુંડળી શૈલી',advanced:'ગણતરી કરેલા ઉન્નત પરિણામો સામેલ કરો',previews:'ચોક્કસ સમયનાં સમય-સંવેદનશીલ ચાર્ટ પૂર્વદર્શન સામેલ કરો',previewNote:'માત્ર નોંધાયેલા ક્ષણનું પૂર્વદર્શન. આ ચાર્ટ જન્મસમય સીમાની તપાસમાં સ્થિર ન હતો; સમયમાં નાના ફેરફારથી સ્થિતિ બદલાઈ શકે છે.',notCalculated:'ગણતરી થઈ નથી. નિકાસ પહેલાં ઉન્નત ગણતરી ખોલીને પરિણામો મેળવો.',scope:'ઉપલબ્ધ D1, D9, ચંદ્ર, હોરા/D2 અને D16 કુંડળી, ગ્રહ અંશ, ફલિત, ભવિષ્યફળ, દશા અને જન્મ પંચાંગ સામેલ છે. ઉન્નત વર્ગ અને બળ કોષ્ટકો ગણતરી અને પસંદગી પછી સામેલ થશે. ગોચર અન્વેષણ, નિયમ તપાસ, સમય-સંવેદનશીલતા પ્રયોગ અને વાર્ષિક તિથિ શોધ અલગ છે.',degrees:'રાશિની અંદરના અંશ',calendar:'જન્મ પંચાંગ',future:'ભવિષ્યફળ · વર્તમાન અને આગામી દશાઓ'}
};
export function projectExtras(report,advanced,reading,language){
 const p=report.traditions?.panchang,m=report.traditions?.month;
 const calendar=p?.status==='available'?{status:'available',civil:term(p.value.civilVara.name,language),sunrise:term(p.value.sunriseVara.name,language),limbs:Object.entries(p.value.atInstant.limbs).map(([key,value])=>limbText(key,value,language)),month:m?.status==='available'?term(m.value.name,language)+(m.value.adhika?' · '+term('Adhika',language):''):null}:{status:'unavailable',code:p?.diagnostic?.code??'MODEL_UNAVAILABLE'};
 const future=reading.periods.map(p=>({major:p.major,minor:p.minor,start:p.start.utcInstant,end:p.end.utcInstant,prose:composeKundliPeriod(p,language)}));
 const charts={};for(const [key,f]of Object.entries(report.chartViews??{}))charts[key]=f.status==='available'?projectChart(f.value):{status:'unavailable',code:f.diagnostic.code};
 let strength=null;
 if(advanced){for(const [key,f]of Object.entries(advanced.charts))charts[key.toLowerCase()]=f.status==='available'?projectChart(f.value):{status:'unavailable',code:f.diagnostic.code};
  strength={uccha:advanced.uccha.values.map(p=>({body:p.body,value:p.virupas,range:[...p.virupaRange]})),av:advanced.ashtakavarga.status==='available'?{bav:advanced.ashtakavarga.value.bav.map(p=>({body:p.body,values:[...p.values],total:p.total})),sav:[...advanced.ashtakavarga.value.sav],total:advanced.ashtakavarga.value.total}:null,warnings:[...advanced.warnings]};
 }
 return {charts,calendar,future,strength};
}
export function extrasMarkup(model,{esc,p,table,diagnostic}){
 const language=model.language,t=locale(language),a=advancedLabels[language],r=reportOptions[language],tr=traditionLabels[language],copy=readingText[language];let html='';
 html+=`<section data-report-section="future"><h2>${esc(r.future)}</h2>${p(copy.periodNote)}`;
 for(const [i,f]of model.extras.future.entries())html+=`<h3>${esc((i===0?copy.current:copy.upcoming)+' · '+bodyName(f.major,language)+' / '+bodyName(f.minor,language))}</h3>${p(f.start+' → '+f.end)}${p(f.prose)}`;
 if(!model.extras.future.length)html+=p(copy.periodUnavailable);html+='</section>';
 const c=model.extras.calendar;html+=`<section data-report-section="panchang"><h2>${esc(r.calendar)}</h2>`;
 html+=c.status==='available'?p(tr.civil+': '+c.civil+' · '+tr.sunrise+': '+c.sunrise)+c.limbs.map(p).join('')+p(tr.month+': '+(c.month??model.labelsUnavailable)):p(diagnostic(c.code,language));html+='</section>';
 if(model.includeAdvanced){const s=model.extras.strength;html+=`<section data-report-section="advanced"><h2>${esc(a.title)}</h2>${p(a.intro)}`;
  if(!s)html+=p(r.notCalculated);else{html+=p(a.range)+p(a.shadbala)+table(a.uccha,[t.body,a.nominal,a.bounds],s.uccha.map(v=>[bodyName(v.body,language),v.value.toFixed(3),v.range.map(n=>n.toFixed(3)).join(' → ')]));html+=p(a.avNotice);if(s.av)html+=table(a.av,[t.body,...Array.from({length:12},(_,i)=>signName(i+1,language)),a.total],[...s.av.bav.map(v=>[bodyName(v.body,language),...v.values,v.total]),['SAV',...s.av.sav,s.av.total]]);else html+=p(a.unsupported);html+=s.warnings.map(w=>p(diagnostic(w,language))).join('');}html+='</section>';
 }
 return html;
}
