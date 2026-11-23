import {buildJyotishIntelligence,jyotishBasisText,jyotishKnowledge} from './jyotish-intelligence.mjs';
import {reportPdf} from './report-pdf.mjs';
import {chartMarkup,chartTitle,chartNote,chartReportCss,projectChart} from './export-charts.mjs';
import {reportOptions,projectExtras,extrasMarkup} from './export-extras.mjs';
import {signDms,chartExtras} from './practitioner-copy.mjs';
import {placeLabel} from './place-text.mjs';
import {term,nakshatraName} from './display-text.mjs';
import {diagnosticText} from './diagnostic-text.mjs';
import {locale,bodyName,signName} from './locale.mjs';
import {astronomyModel} from '../../../packages/vedic/astronomy.mjs';
import {siderealProfile} from '../../../packages/vedic/sidereal.mjs';
import {buildKundliReading} from './kundli-reading.mjs';
import {composeKundliTopic,kundliProseVersion} from './kundli-reading-prose.mjs';
import {readingText} from './kundli-reading-copy.mjs';
import {mountReadingAudience,readReadingAudience} from './reading-audience.mjs';

export const exportLabels=Object.freeze({
 en:{title:'Kundli report',controls:'Private report export',include:'Include name, birth date/time and place',redacted:'Birth details redacted',identified:'Includes birth details',notice:'Redaction removes direct birth details, not chart values. Charts and Dasha dates may reveal birth information. Share carefully.',preview:'Report preview',download:'Download report (PDF)',print:'Print / Save as PDF',help:'Review the report below. In the print dialog, choose Save as PDF and turn off browser headers and footers. Downloads stay on your device.',identity:'Birth details',unavailable:'Unavailable / withheld',warnings:'Warnings',houses:'Whole-sign houses',provenance:'Calculation provenance',nominal:'Internal candidate. Independent astronomical acceptance is pending. Nominal results; birth-time stability is not certified. No deterministic prediction is implied.'},
 hi:{title:'कुंडली रिपोर्ट',controls:'निजी रिपोर्ट निर्यात',include:'नाम, जन्म तिथि/समय और स्थान शामिल करें',redacted:'जन्म विवरण हटाए गए हैं',identified:'जन्म विवरण शामिल हैं',notice:'विवरण हटाने से चार्ट के मान नहीं हटते। चार्ट और दशा की तिथियों से जन्म की जानकारी मिल सकती है। सावधानी से साझा करें।',preview:'रिपोर्ट पूर्वावलोकन',download:'रिपोर्ट डाउनलोड करें (PDF)',print:'प्रिंट / PDF में सहेजें',help:'नीचे रिपोर्ट देखें। प्रिंट संवाद में PDF में सहेजें चुनें और ब्राउज़र के हेडर व फुटर बंद करें। डाउनलोड आपके उपकरण पर रहता है।',identity:'जन्म विवरण',unavailable:'अनुपलब्ध / रोका गया',warnings:'चेतावनियाँ',houses:'पूर्ण-राशि भाव',provenance:'गणना का स्रोत',nominal:'आंतरिक परीक्षण संस्करण। स्वतंत्र खगोलीय स्वीकृति लंबित है। परिणाम अनुमानित हैं; जन्म-समय की स्थिरता प्रमाणित नहीं है। निश्चित भविष्यवाणी नहीं है।'},
 gu:{title:'કુંડળી અહેવાલ',controls:'ખાનગી અહેવાલ નિકાસ',include:'નામ, જન્મ તારીખ/સમય અને સ્થળ સામેલ કરો',redacted:'જન્મ વિગતો દૂર કરેલી છે',identified:'જન્મ વિગતો સામેલ છે',notice:'વિગતો દૂર કરવાથી ચાર્ટનાં મૂલ્યો દૂર થતા નથી. ચાર્ટ અને દશાની તારીખોથી જન્મની માહિતી મળી શકે છે. સાવચેતીથી વહેંચો.',preview:'અહેવાલ પૂર્વદર્શન',download:'અહેવાલ ડાઉનલોડ કરો (PDF)',print:'પ્રિન્ટ / PDF તરીકે સાચવો',help:'નીચે અહેવાલ તપાસો. પ્રિન્ટ સંવાદમાં PDF તરીકે સાચવો પસંદ કરો અને બ્રાઉઝરના હેડર તથા ફૂટર બંધ કરો. ડાઉનલોડ તમારા ઉપકરણ પર રહે છે.',identity:'જન્મ વિગતો',unavailable:'અનુપલબ્ધ / રોકેલું',warnings:'ચેતવણીઓ',houses:'પૂર્ણ-રાશિ ભાવ',provenance:'ગણનાના સ્ત્રોત',nominal:'આંતરિક પરીક્ષણ આવૃત્તિ. સ્વતંત્ર ખગોળીય સ્વીકૃતિ બાકી છે. પરિણામો અંદાજિત છે; જન્મ-સમયની સ્થિરતા પ્રમાણિત નથી. નિશ્ચિત આગાહી નથી.'}
});

// Explicit projection: never serialize a birth report or its hidden time/model objects.
export function projectExport(report,{includeIdentity=false,name='',language='en',chartStyle='north',selectedChart='D1',includeAdvanced=false,advanced=null,includePreviews=false,readingAudience='public'}={}){
 locale(language);
 if(!['public','pandit'].includes(readingAudience))throw new TypeError('Check reading audience.');
 if(!['D1','D9','D2','D16','Chandra','D7','D10','D12'].includes(selectedChart)||!['north','south'].includes(chartStyle)||typeof includeAdvanced!=='boolean'||typeof includePreviews!=='boolean')throw new TypeError('Check report chart options.');
 if(typeof includeIdentity!=='boolean'||typeof name!=='string'||name.length>80||/[\u0000-\u001f\u007f]/.test(name))throw new TypeError('Check report options.');
 const f=report.features,b=report.birth;
 const warnings=new Set(b.warnings);
 for(const feature of Object.values(report.chartViews??{}))if(feature.status==='available')for(const w of feature.value.warnings??[])warnings.add(w);
 if(includeAdvanced&&advanced)for(const w of advanced.warnings)warnings.add(w);
 const features={};
 for(const key of ['positions','d1','d9','dasha']){
  const feature=f[key];
  if(feature.status!=='available'){features[key]={status:'unavailable',code:feature.diagnostic.code};continue;}
  const v=feature.value;for(const w of v.warnings??[])warnings.add(w);
  if(key==='positions')features[key]={status:'available',positions:v.positions.map(p=>({body:p.body,rashi:p.rashi,longitude:p.siderealLongitude,nakshatra:p.nakshatra,pada:p.pada}))};
  else if(key==='d1'||key==='d9')features[key]={status:'available',ascendantRashi:v.ascendant.rashi,ascendantLongitude:key==='d1'?v.ascendant.siderealLongitude:v.ascendant.sourceSiderealLongitude,precision:v.precisionClass,
   houses:v.houses.map(h=>({house:h.houseNumber,rashi:h.rashi,bodies:[...h.bodies]})),
   planets:v.planets.map(p=>({body:p.body,rashi:p.rashi,house:p.houseNumber,longitude:key==='d1'?p.siderealLongitude:p.sourceSiderealLongitude}))};
  else {
   const boundary=p=>({utc:p.utcInstant,local:p.local.status==='available'?`${p.local.localDateTime} ${p.local.offset}`:null});
   features[key]={status:'available',balance:{lord:v.balance.lord,remainingYears:v.balance.remainingYears},
    active:{major:v.active.mahadashaLord,minor:v.active.antardashaLord,at:v.active.atUtcInstant},
    next:{major:v.active.nextTransition.nextMahadashaLord,minor:v.active.nextTransition.nextAntardashaLord,boundary:boundary(v.active.nextTransition.boundary)},
    majors:v.mahadashas.map(m=>({lord:m.lord,start:boundary(m.start),end:boundary(m.end),children:m.antardashas.map(p=>({lord:p.lord,start:boundary(p.start),end:boundary(p.end)}))}))};
  }
 }
 const time=f.positions.status==='available'?f.positions.value.time:null;
 const reading=buildKundliReading(report),copy=readingText[language];
 let everyday={version:kundliProseVersion,title:copy.title,intro:copy.intro,method:copy.methodNote,topics:Object.entries(reading.topics).map(([id,data])=>({id,title:copy[id],status:data?'available':'unavailable',...composeKundliTopic(id,data,language)}))};
 if(language==='hi'){const rich=buildJyotishIntelligence(report);everyday={...everyday,version:rich.version,title:'आपका व्यक्तिगत फलादेश',intro:'जीवन के विषयों का सरल अर्थ और वर्तमान प्राथमिकताएँ।',method:'पारंपरिक पठन; स्वतंत्र ज्योतिष एवं हिंदी समीक्षा लंबित। निर्णय में अपनी वास्तविक परिस्थिति साथ रखें।',topics:rich.sections.filter(s=>readingAudience==='pandit'||s.publicParagraphs?.length).map(section=>({id:section.id,title:readingAudience==='public'?section.publicTitle:section.title,status:section.status,paragraphs:(readingAudience==='public'?section.publicParagraphs:section.paragraphs).map(p=>p.text),action:null})),findingReferences:rich.sections.map(s=>({id:s.id,findingIds:s.findingIds})),quality:rich.quality,basis:rich.findings.filter(f=>f.evidence.house).map(f=>({id:f.id,text:jyotishBasisText(f)})),basisSource:jyotishKnowledge.source.url};}
 if(language==='hi'&&!everyday.topics.length)everyday.topics=[{id:'availability',title:'व्यक्तिगत पठन उपलब्ध नहीं',status:'unavailable',paragraphs:['इस जन्म विवरण से पर्याप्त स्थिर व्यक्तिगत आधार उपलब्ध नहीं है। अनुमान से फलादेश नहीं जोड़ा गया है।'],action:null}];
 const extras=projectExtras(report,includeAdvanced?advanced:null,reading,language);
 if(includePreviews)for(const key of ['d1','d9'])if(report[key+'Preview']?.status==='available')extras.charts[key]={...projectChart(report[key+'Preview'].value),sensitive:true};
 const result={chartStyle,selectedChart,includeAdvanced,includePreviews,readingAudience,extras,labelsUnavailable:exportLabels[language].unavailable,version:'vedic-export-1',language,redacted:!includeIdentity,features,warnings:[...warnings],everyday,
  provenance:{profile:b.calculationProfileId,precision:b.precisionClass,timeAccuracy:b.timeAccuracy,
   inputResolutionSeconds:b.inputResolutionSeconds,coordinatePrecision:b.place.coordinatePrecision,elevationBasis:b.place.elevationBasis,
   timezone:b.timeZoneId,tzdb:b.tzdbVersion,timeRuleVersion:b.timeRuleVersion,timeSourceSha256:b.timeSourceSha256,
   placeSource:b.place.sourceVersion,placeSourceSha256:b.place.sourceSha256,
   engine:astronomyModel.id,engineVersion:astronomyModel.engineVersion,engineSha256:astronomyModel.engineSha256,
   ephemeris:astronomyModel.ephemerisId,coverage:JSON.stringify(astronomyModel.coverage),
   conventions:siderealProfile.conventionsVersion,ayanamsha:JSON.stringify(siderealProfile.ayanamsha),
   node:siderealProfile.nodeModel,house:'whole-sign',navamsa:'canonical-108-sectors-movable-self-fixed-ninth-dual-fifth',
   lagna:f.d1.status==='available'?f.d1.value.ascendant.model.id:'not-calculated',
   timeConversionModel:time?.timeConversionModel??'not-calculated',ut1Model:time?.ut1Model??'not-calculated',
   leapSecondSourceSha256:time?.leapSecondSourceSha256??'not-calculated',leapSecondTableExpiresUtc:time?.leapSecondTableExpiresUtc??'not-calculated',
   configuredModels:'Model identities describe configuration; unavailable features were not calculated.',
   attribution:'Place data: GeoNames (https://www.geonames.org/), CC BY 4.0; engine: Astronomy Engine 2.1.19 by Don Cross, MIT.',
   timeScales:'TT astronomy; modelled UT1; pinned UTC leap data; Dasha uniform Unix days',
   year:'365.25 uniform days',calculatedAt:report.calculatedAtUtc,exportVersion:'vedic-export-1'}};
 if(includeIdentity)result.identity={name,localDate:b.localDate,localTime:b.localTime??null,place:placeLabel(b.place,language),
  latitude:b.place.latitude,longitude:b.place.longitude,offset:b.offset,utc:b.utcInstant??null,
  interval:b.interval?{start:b.interval.startUtc,end:b.interval.endUtc}:null};
 return result;
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number.isFinite(value)?value.toFixed(4):'—';
export const reportCss=`:root{--report-bg:#fff;--report-ink:#17232d;--report-edge:#9aa8b2;--report-soft:#eef2f4}body{margin:0;background:var(--report-bg);color:var(--report-ink);font:14px/1.5 system-ui,sans-serif}.vedic-export-document{max-width:70rem;margin:auto;padding:1rem;overflow-wrap:anywhere}.vedic-export-document *{box-sizing:border-box}.vedic-export-document table{width:100%;border-collapse:collapse;table-layout:fixed;margin:1rem 0}.vedic-export-document th,.vedic-export-document td{border:1px solid var(--report-edge);padding:.4rem;text-align:start;overflow-wrap:anywhere}.vedic-export-document th{background:var(--report-soft)}.vedic-export-document caption{text-align:start;font-weight:700}.vedic-export-document h2,.vedic-export-document h3{break-after:avoid}.vedic-export-document tr{break-inside:avoid}.vedic-export-document thead{display:table-header-group}.vedic-export-document dt{font-weight:700}.vedic-export-document dd{margin:0 0 .6rem}.vedic-report-chart{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-width:36rem;margin:1rem auto}.vedic-report-cell{border:1px solid var(--report-edge);padding:.35rem;min-height:5.5rem;font-size:.8rem}.vedic-report-center{grid-column:2 / 4;grid-row:2 / 4;display:grid;place-content:center;text-align:center}.vedic-export-document .report-note{padding:.75rem;background:var(--report-soft)}@page{size:A4;margin:12mm}@media print{.vedic-export-document{max-width:none;padding:0;font-size:10pt}.vedic-report-chart{break-inside:avoid}.vedic-report-cell{min-height:4rem}.vedic-export-document table{font-size:9pt}}`;

export const reportLayoutCss=[[12,1,1],[1,2,1],[2,3,1],[3,4,1],[11,1,2],[4,4,2],[10,1,3],[5,4,3],[9,1,4],[8,2,4],[7,3,4],[6,4,4]].map(([s,c,r])=>`.vedic-report-cell[data-sign="${s}"]{grid-column:${c};grid-row:${r}}`).join('')+`.vedic-export-document{background:var(--report-bg);color:var(--report-ink)}.vedic-export label{display:flex;flex-direction:row;align-items:center;gap:.75rem}.vedic-export input[type=checkbox]{width:1.4rem;min-height:1.4rem;flex-shrink:0}.vedic-export button{margin:.4rem}.vedic-export-preview{max-height:40rem;overflow:auto;border:1px solid var(--report-edge)}@media print{.vedic-birth-page>header,.vedic-birth-app> :not(#birth-results),#birth-results> :not(:last-child),.vedic-export> :not(details),.vedic-export details>summary{display:none!important}.vedic-export details{border:0;padding:0;margin:0}.vedic-export-preview{max-height:none;overflow:visible;border:0}.vedic-birth-app{padding:0}.vedic-export details:not([open])>.vedic-export-preview{display:block}}`;

export const reportTableCss='.vedic-export-document{font:14px/1.5 system-ui,sans-serif}.vedic-report-table{max-width:100%;overflow:auto}.vedic-report-table table{min-width:32rem}.vedic-report-table:focus-visible{outline:2px solid var(--report-ink);outline-offset:-2px}@media print{.vedic-export-document{font-size:10pt}.vedic-report-table{overflow:visible}.vedic-report-table table{min-width:0}}'+'.report-everyday{font-family:system-ui,"Noto Sans Devanagari","Noto Sans Gujarati",sans-serif}.report-everyday>section{padding:.8rem 0;border-bottom:1px solid var(--report-edge);break-inside:avoid}.report-everyday p{line-height:1.8;max-width:72ch}.report-everyday h3{margin-bottom:.6rem}';

export const reportPresentationCss='.vedic-export-document .report-house-column{width:4.5rem;text-align:center;white-space:nowrap}'+'.vedic-export-document .report-house-table th:first-child,.vedic-export-document .report-house-table td:first-child{width:4.5rem;text-align:center;white-space:nowrap}.vedic-export-document .report-house-table th:nth-child(2){width:30%}'+chartReportCss+'.report-cover{border-bottom:2px solid var(--report-ink);padding:1.5rem 0;margin-bottom:1.5rem;break-inside:avoid}.report-brand{font-size:.8rem;font-weight:700;letter-spacing:.15em}.report-cover h1{font-size:2rem;line-height:1.3;margin:.5rem 0}.vedic-export-document>section{margin-block:2rem}.vedic-export-document caption{padding-block:.6rem}.vedic-export-document h2{padding-top:.6rem;border-top:1px solid var(--report-edge)}@media print{.report-cover{padding:1rem 0}.vedic-export-document>section{margin-block:1rem}.report-everyday>section{break-inside:auto}.report-everyday>section h3{break-after:avoid}}';

export function reportMarkup(model){
 const language=model.language,t=locale(language),x=exportLabels[language];
 const p=text=>`<p>${esc(text)}</p>`;
 const table=(caption,headers,rows,house=false)=>`<div class="vedic-report-table" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="${house?'report-house-table':''}"><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th class="${h===t.house?'report-house-column':''}" scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i===0?`<th class="${headers[i]===t.house?'report-house-column':''}" scope="row">${esc(v)}</th>`:`<td class="${headers[i]===t.house?'report-house-column':''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 const date=b=>`${b.local??t.localUnavailable} · UTC ${b.utc}`;
 let html=`<article class="vedic-export-document" lang="${language}"><header class="report-cover"><p class="report-brand">RITVAYAM</p><h1>${esc(x.title)}</h1>${p(model.redacted?x.redacted:x.identified)}</header>${p(x.notice)}<p class="report-note">${esc(x.nominal)}</p>`;
 if(model.identity)html+=`<h2>${esc(x.identity)}</h2><dl>${Object.entries(model.identity).map(([k,v])=>`<dt>${esc(term(k,language))}</dt><dd>${esc(v&&typeof v==='object'?`${v.start} → ${v.end}`:v??t.noTime)}</dd>`).join('')}</dl>`;

 const narrativeStart=html.length;
 const pos=model.features.positions,charts={d1:model.features.d1,d9:model.features.d9,...model.extras.charts},selected=String(model.selectedChart).toLowerCase();
 const chartKeys=Object.keys(charts);if(chartKeys.includes(selected))chartKeys.splice(0,0,...chartKeys.splice(chartKeys.indexOf(selected),1));
 for(const key of ['positions',...chartKeys,'dasha']){
  const f=charts[key]??model.features[key];html+=`<section data-report-section="${esc(key)}"><h2>${esc(chartTitle(key,language))}</h2>`;
  if(f.status!=='available'){html+=p(`${x.unavailable}: ${diagnosticText(f.code,language)}`)+'</section>';continue;}
  if(key==='positions')html+=table(t.positions,[t.body,t.sign,reportOptions[language].degrees,term('Longitude °',language),t.nakshatra,t.pada],pos.positions.map(p=>[bodyName(p.body,language),`${signName(p.rashi,language)} (${p.rashi})`,signDms(p.longitude%30),number(p.longitude),nakshatraName(p.nakshatra,language),p.pada]));
  else if(charts[key]){
   html+=p(`${key==='chandra'?chartExtras[language].moon:t.ascendant}: ${signName(f.ascendantRashi,language)} (${f.ascendantRashi}) · ${key!=='d1'?t.source:term('Longitude °',language)}: ${number(f.ascendantLongitude)}. ${t.rounding} ${key==='d9'?t.d9Hint:''}`);
   const note=chartNote(key,language);if(note)html+=p(note);
   if(f.sensitive)html+=`<p class="report-note">${esc(reportOptions[language].previewNote)}</p>`;
   html+=chartMarkup(f,key,model.chartStyle,language)+table(x.houses,[t.house,t.sign,t.body],f.houses.map(h=>[h.house,`${signName(h.rashi,language)} (${h.rashi})`,h.bodies.map(b=>bodyName(b,language)).join(', ')||'\u2014']),true);
   html+=table(t.tableHint,[t.body,t.sign,t.house,key!=='d1'?t.source:term('Longitude °',language)],f.planets.map(p=>[bodyName(p.body,language),signName(p.rashi,language),p.house,signDms(p.longitude%30)+' / '+number(p.longitude)]));
  }else if(key==='dasha'){
   html+=p(t.year)+p(`${t.balance}: ${bodyName(f.balance.lord,language)} · ${number(f.balance.remainingYears)} ${t.years}. ${t.origin}`);
   html+=p(`${t.current}: ${bodyName(f.active.major,language)} / ${bodyName(f.active.minor,language)} · ${t.asOf}: ${f.active.at}`);
   html+=p(`${t.next}: ${bodyName(f.next.major,language)} / ${bodyName(f.next.minor,language)} · ${date(f.next.boundary)}`);
   html+=table(t.major,[t.body,t.start,t.end],f.majors.map(m=>[bodyName(m.lord,language),date(m.start),date(m.end)]));
   for(const m of f.majors)html+=table(`${bodyName(m.lord,language)} · ${t.periodTable}`,[t.body,t.start,t.end],m.children.map(c=>[bodyName(c.lord,language),date(c.start),date(c.end)]));
  }
  html+='</section>';
 }
 const technicalHtml=language==='hi'?html.slice(narrativeStart):'';if(language==='hi')html=html.slice(0,narrativeStart);
 if(model.everyday){html+=`<section class="report-everyday"><h2>${esc(model.everyday.title)}</h2>${p(model.everyday.intro)}`;for(const topic of model.everyday.topics)html+=`<section data-reading-topic="${esc(topic.id)}"><h3>${esc(topic.title)}</h3>${topic.paragraphs.map(p).join('')}${topic.action?p(topic.action):''}</section>`;html+=p(model.everyday.method)+'</section>';}
 if(language==='hi'&&model.readingAudience==='public'&&!model.includeAdvanced&&!model.includePreviews){const chart=charts[selected];if(chart?.status==='available')html+='<section class="report-simple-chart"><h2>'+esc(chartTitle(selected,language))+'</h2>'+(chart.sensitive?p(reportOptions[language].previewNote):'')+chartMarkup(chart,selected,model.chartStyle,language)+'</section>';return html+'<footer class="report-source"><a href="https://www.geonames.org/">GeoNames</a></footer></article>';}
 if(language==='hi'){html+=technicalHtml;if(model.everyday.basis)html+='<section class="report-reading-basis"><h2>'+esc("\u0935\u094d\u092f\u093e\u0916\u094d\u092f\u093e \u0915\u0947 \u0917\u0923\u093f\u0924\u0940\u092f \u0938\u0942\u0924\u094d\u0930")+'</h2>'+model.everyday.basis.map(f=>'<p data-finding-id="'+esc(f.id)+'">'+esc(f.id)+': '+esc(f.text)+'</p>').join('')+p(model.everyday.basisSource)+'</section>';}
 html+=extrasMarkup(model,{esc,p,table,diagnostic:diagnosticText});
 html+=`<h2>${esc(x.provenance)}</h2>${p(t.fallback)}<dl>${Object.entries(model.provenance).map(([k,v])=>`<dt>${esc(term(k,language))}</dt><dd>${esc(term(v,language))}</dd>`).join('')}</dl><h2>${esc(x.warnings)}</h2><ul>${model.warnings.map(w=>`<li>${esc(diagnosticText(w,language))}</li>`).join('')}</ul></article>`;
 return html;
}

export function standaloneReport(model){return `<!doctype html><html lang="${model.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${esc(exportLabels[model.language].title)}</title><style>${reportCss+reportLayoutCss+reportTableCss+reportPresentationCss}</style></head><body>${reportMarkup(model)}</body></html>`;}

export function mountExport(container,report,{name='',language='en',getChartState=()=>({style:'north',type:'D1'}),getAdvanced=()=>null}={}){
 const x=exportLabels[language],root=document.createElement('section');root.className='vedic-export';
 const heading=document.createElement('h2');heading.textContent=x.controls;
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.id='export-identity';label.append(check,document.createTextNode(x.include));
 const notice=document.createElement('p');notice.textContent=x.notice;const help=document.createElement('p');help.textContent=x.help;
 const preview=document.createElement('details'),summary=document.createElement('summary');summary.textContent=x.preview;const content=document.createElement('div');content.className='vedic-export-preview';preview.append(summary,content);
 const download=document.createElement('button');download.type='button';download.id='export-download';download.textContent=x.download;
 const print=document.createElement('button');print.type='button';print.id='export-print';print.textContent=x.print;
 const layoutLabel=document.createElement('label'),layout=document.createElement('select');layout.id='export-chart-style';layoutLabel.append(document.createTextNode(reportOptions[language].style),layout);layout.append(new Option(locale(language).north,'north'),new Option(locale(language).south,'south'));layout.value=getChartState().style;
 const advancedLabel=document.createElement('label'),advancedCheck=document.createElement('input');advancedCheck.type='checkbox';advancedCheck.id='export-advanced';advancedLabel.append(advancedCheck,document.createTextNode(reportOptions[language].advanced));
 const previewLabel=document.createElement('label'),previewCheck=document.createElement('input');previewCheck.type='checkbox';previewCheck.id='export-sensitive';previewLabel.append(previewCheck,document.createTextNode(reportOptions[language].previews));previewLabel.hidden=!['d1','d9'].some(k=>report[k+'Preview']?.status==='available');
 const scope=document.createElement('p');scope.textContent=reportOptions[language].scope;
 let layoutOverride=false;
 const model=()=>projectExport(report,{includeIdentity:check.checked,name,language,chartStyle:layoutOverride?layout.value:getChartState().style,selectedChart:getChartState().type,includeAdvanced:advancedCheck.checked,advanced:getAdvanced(),includePreviews:previewCheck.checked,readingAudience:readReadingAudience()});
 const render=()=>{if(!layoutOverride)layout.value=getChartState().style;content.innerHTML=reportMarkup(model());};
 const audience=language==='hi'?mountReadingAudience({language,onChange:()=>{content.replaceChildren();if(preview.open)render();}}):null;
 layout.addEventListener('change',()=>{layoutOverride=true;render();});for(const input of [advancedCheck,previewCheck])input.addEventListener('change',()=>{content.replaceChildren();if(preview.open)render();});check.addEventListener('change',()=>{content.replaceChildren();if(preview.open)render();});preview.addEventListener('toggle',()=>{if(preview.open&&!content.childElementCount)render();});
 let urls=new Set(),timers=new Set();
 download.addEventListener('click',async()=>{download.disabled=true;download.setAttribute('aria-busy','true');try{const snapshot=model();const url=URL.createObjectURL(await reportPdf(reportMarkup(snapshot)));urls.add(url);
  const link=document.createElement('a');link.href=url;link.download='kundli-report.pdf';link.click();
  const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);timers.delete(timer);},1000);timers.add(timer);
 }catch(error){help.textContent=error.message;}finally{download.disabled=false;download.removeAttribute('aria-busy');}
 });
 let wasOpen=false,printing=false;
 const beforePrint=()=>{if(printing)return;printing=true;wasOpen=preview.open;render();preview.open=true;};
 const afterPrint=()=>{if(!printing)return;preview.open=wasOpen;printing=false;};
 window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
 print.addEventListener('click',()=>{render();window.print();});
 root.append(heading,layoutLabel,label,advancedLabel,previewLabel,notice,scope,help,download,print,preview);container.replaceChildren(root);
 if(audience)heading.after(audience.element);
 return {refresh(){if(preview.open)render();else content.replaceChildren();if(!layoutOverride)layout.value=getChartState().style;},destroy(){audience?.destroy();window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint);for(const timer of timers)clearTimeout(timer);for(const url of urls)URL.revokeObjectURL(url);timers.clear();urls.clear();content.replaceChildren();root.remove();}};
}
