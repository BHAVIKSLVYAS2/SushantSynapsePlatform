import {locale,bodyName,signName} from './locale.mjs';
import {astronomyModel} from '../../../packages/vedic/astronomy.mjs';
import {siderealProfile} from '../../../packages/vedic/sidereal.mjs';

export const exportLabels=Object.freeze({
 en:{title:'Kundli report',controls:'Private report export',include:'Include name, birth date/time and place',redacted:'Birth details redacted',identified:'Includes birth details',notice:'Redaction removes direct birth details, not chart values. Charts and Dasha dates may reveal birth information. Share carefully.',preview:'Report preview',download:'Download report (HTML)',print:'Print / Save as PDF',help:'Review the report below. In the print dialog, choose Save as PDF and turn off browser headers and footers. Downloads stay on your device.',identity:'Birth details',unavailable:'Unavailable / withheld',warnings:'Warnings',houses:'Whole-sign houses',provenance:'Calculation provenance',nominal:'Internal candidate. Independent astronomical acceptance is pending. Nominal results; birth-time stability is not certified. No deterministic prediction is implied.'},
 hi:{title:'कुंडली रिपोर्ट',controls:'निजी रिपोर्ट निर्यात',include:'नाम, जन्म तिथि/समय और स्थान शामिल करें',redacted:'जन्म विवरण हटाए गए हैं',identified:'जन्म विवरण शामिल हैं',notice:'विवरण हटाने से चार्ट के मान नहीं हटते। चार्ट और दशा की तिथियों से जन्म की जानकारी मिल सकती है। सावधानी से साझा करें।',preview:'रिपोर्ट पूर्वावलोकन',download:'रिपोर्ट डाउनलोड करें (HTML)',print:'प्रिंट / PDF में सहेजें',help:'नीचे रिपोर्ट देखें। प्रिंट संवाद में PDF में सहेजें चुनें और ब्राउज़र के हेडर व फुटर बंद करें। डाउनलोड आपके उपकरण पर रहता है।',identity:'जन्म विवरण',unavailable:'अनुपलब्ध / रोका गया',warnings:'चेतावनियाँ',houses:'पूर्ण-राशि भाव',provenance:'गणना का स्रोत',nominal:'आंतरिक परीक्षण संस्करण। स्वतंत्र खगोलीय स्वीकृति लंबित है। परिणाम अनुमानित हैं; जन्म-समय की स्थिरता प्रमाणित नहीं है। निश्चित भविष्यवाणी नहीं है।'},
 gu:{title:'કુંડળી અહેવાલ',controls:'ખાનગી અહેવાલ નિકાસ',include:'નામ, જન્મ તારીખ/સમય અને સ્થળ સામેલ કરો',redacted:'જન્મ વિગતો દૂર કરેલી છે',identified:'જન્મ વિગતો સામેલ છે',notice:'વિગતો દૂર કરવાથી ચાર્ટનાં મૂલ્યો દૂર થતા નથી. ચાર્ટ અને દશાની તારીખોથી જન્મની માહિતી મળી શકે છે. સાવચેતીથી વહેંચો.',preview:'અહેવાલ પૂર્વદર્શન',download:'અહેવાલ ડાઉનલોડ કરો (HTML)',print:'પ્રિન્ટ / PDF તરીકે સાચવો',help:'નીચે અહેવાલ તપાસો. પ્રિન્ટ સંવાદમાં PDF તરીકે સાચવો પસંદ કરો અને બ્રાઉઝરના હેડર તથા ફૂટર બંધ કરો. ડાઉનલોડ તમારા ઉપકરણ પર રહે છે.',identity:'જન્મ વિગતો',unavailable:'અનુપલબ્ધ / રોકેલું',warnings:'ચેતવણીઓ',houses:'પૂર્ણ-રાશિ ભાવ',provenance:'ગણનાના સ્ત્રોત',nominal:'આંતરિક પરીક્ષણ આવૃત્તિ. સ્વતંત્ર ખગોળીય સ્વીકૃતિ બાકી છે. પરિણામો અંદાજિત છે; જન્મ-સમયની સ્થિરતા પ્રમાણિત નથી. નિશ્ચિત આગાહી નથી.'}
});

// Explicit projection: never serialize a birth report or its hidden time/model objects.
export function projectExport(report,{includeIdentity=false,name='',language='en'}={}){
 locale(language);
 if(typeof includeIdentity!=='boolean'||typeof name!=='string'||name.length>80||/[\u0000-\u001f\u007f]/.test(name))throw new TypeError('Check report options.');
 const f=report.features,b=report.birth;
 const warnings=new Set(b.warnings);
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
 const result={version:'vedic-export-1',language,redacted:!includeIdentity,features,warnings:[...warnings],
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
   attribution:'Place data: GeoNames (https://www.geonames.org/), CC BY 4.0; engine: Astronomy Engine 2.1.19 by Don Cross, MIT. Model source/acceptance evidence retained in repository docs/vedic.',
   timeScales:'TT astronomy; modelled UT1; pinned UTC leap data; Dasha uniform Unix days',
   year:'365.25 uniform days',calculatedAt:report.calculatedAtUtc,exportVersion:'vedic-export-1'}};
 if(includeIdentity)result.identity={name,localDate:b.localDate,localTime:b.localTime??null,place:b.place.label,
  latitude:b.place.latitude,longitude:b.place.longitude,offset:b.offset,utc:b.utcInstant??null,
  interval:b.interval?{start:b.interval.startUtc,end:b.interval.endUtc}:null};
 return result;
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number.isFinite(value)?value.toFixed(4):'—';
export const reportCss=`:root{--report-bg:#fff;--report-ink:#17232d;--report-edge:#9aa8b2;--report-soft:#eef2f4}body{margin:0;background:var(--report-bg);color:var(--report-ink);font:14px/1.5 system-ui,sans-serif}.vedic-export-document{max-width:70rem;margin:auto;padding:1rem;overflow-wrap:anywhere}.vedic-export-document *{box-sizing:border-box}.vedic-export-document table{width:100%;border-collapse:collapse;table-layout:fixed;margin:1rem 0}.vedic-export-document th,.vedic-export-document td{border:1px solid var(--report-edge);padding:.4rem;text-align:start;overflow-wrap:anywhere}.vedic-export-document th{background:var(--report-soft)}.vedic-export-document caption{text-align:start;font-weight:700}.vedic-export-document h2,.vedic-export-document h3{break-after:avoid}.vedic-export-document tr{break-inside:avoid}.vedic-export-document thead{display:table-header-group}.vedic-export-document dt{font-weight:700}.vedic-export-document dd{margin:0 0 .6rem}.vedic-report-chart{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));max-width:36rem;margin:1rem auto}.vedic-report-cell{border:1px solid var(--report-edge);padding:.35rem;min-height:5.5rem;font-size:.8rem}.vedic-report-center{grid-column:2 / 4;grid-row:2 / 4;display:grid;place-content:center;text-align:center}.vedic-export-document .report-note{padding:.75rem;background:var(--report-soft)}@page{size:A4;margin:12mm}@media print{.vedic-export-document{max-width:none;padding:0;font-size:10pt}.vedic-report-chart{break-inside:avoid}.vedic-report-cell{min-height:4rem}.vedic-export-document table{font-size:9pt}}`;

export const reportLayoutCss=[[12,1,1],[1,2,1],[2,3,1],[3,4,1],[11,1,2],[4,4,2],[10,1,3],[5,4,3],[9,1,4],[8,2,4],[7,3,4],[6,4,4]].map(([s,c,r])=>`.vedic-report-cell[data-sign="${s}"]{grid-column:${c};grid-row:${r}}`).join('')+`.vedic-export-document{background:var(--report-bg);color:var(--report-ink)}.vedic-export label{display:flex;flex-direction:row;align-items:center;gap:.75rem}.vedic-export input[type=checkbox]{width:1.4rem;min-height:1.4rem;flex-shrink:0}.vedic-export button{margin:.4rem}.vedic-export-preview{max-height:40rem;overflow:auto;border:1px solid var(--report-edge)}@media print{.vedic-birth-page>header,.vedic-birth-app> :not(#birth-results),#birth-results> :not(:last-child),.vedic-export> :not(details),.vedic-export details>summary{display:none!important}.vedic-export details{border:0;padding:0;margin:0}.vedic-export-preview{max-height:none;overflow:visible;border:0}.vedic-birth-app{padding:0}.vedic-export details:not([open])>.vedic-export-preview{display:block}}`;

export const reportTableCss='.vedic-export-document{font:14px/1.5 system-ui,sans-serif}.vedic-report-table{max-width:100%;overflow:auto}.vedic-report-table table{min-width:32rem}.vedic-report-table:focus-visible{outline:2px solid var(--report-ink);outline-offset:-2px}@media print{.vedic-export-document{font-size:10pt}.vedic-report-table{overflow:visible}.vedic-report-table table{min-width:0}}';

export function reportMarkup(model){
 const language=model.language,t=locale(language),x=exportLabels[language];
 const p=text=>`<p>${esc(text)}</p>`;
 const table=(caption,headers,rows)=>`<div class="vedic-report-table" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>i===0?`<th scope="row">${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 const date=b=>`${b.local??t.localUnavailable} · UTC ${b.utc}`;
 let html=`<article class="vedic-export-document" lang="${language}"><h1>${esc(x.title)}</h1>${p(model.redacted?x.redacted:x.identified)}${p(x.notice)}<p class="report-note">${esc(x.nominal)}</p>`;
 if(model.identity)html+=`<h2>${esc(x.identity)}</h2><dl>${Object.entries(model.identity).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v&&typeof v==='object'?`${v.start} → ${v.end}`:v??t.noTime)}</dd>`).join('')}</dl>`;
 const pos=model.features.positions;
 for(const key of ['positions','d1','d9','dasha']){
  const f=model.features[key];html+=`<section><h2>${esc(t[key])}</h2>`;
  if(f.status!=='available'){html+=p(`${x.unavailable}: ${f.code}`)+'</section>';continue;}
  if(key==='positions')html+=table(t.positions,[t.body,t.sign,'Longitude °',t.nakshatra,t.pada],pos.positions.map(p=>[bodyName(p.body,language),`${signName(p.rashi,language)} (${p.rashi})`,number(p.longitude),p.nakshatra,p.pada]));
  else if(key==='d1'||key==='d9'){
   html+=p(`${t.ascendant}: ${signName(f.ascendantRashi,language)} (${f.ascendantRashi}) · ${key==='d9'?t.source:'Longitude °'}: ${number(f.ascendantLongitude)}. ${t.rounding} ${key==='d9'?t.d9Hint:''}`);
   const cells=[[12,1,1],[1,2,1],[2,3,1],[3,4,1],[11,1,2],[4,4,2],[10,1,3],[5,4,3],[9,1,4],[8,2,4],[7,3,4],[6,4,4]];
   html+=`<div class="vedic-report-chart" role="img" aria-label="${esc(t[key]+' · '+t.south+' · '+x.houses)}"><div class="vedic-report-center">${esc(t[key])}<br>${esc(t.south)}</div>`;
   for(const [sign]of cells){const h=f.houses.find(h=>h.rashi===sign);html+=`<div class="vedic-report-cell" data-sign="${sign}">${esc(signName(sign,language))} (${sign})<br>H${h.house}${sign===f.ascendantRashi?' · Lg':''}<br>${esc(h.bodies.map(b=>bodyName(b,language)).join(', ')||'—')}</div>`;}
   html+='</div>'+table(x.houses,[t.house,t.sign,t.body],f.houses.map(h=>[h.house,`${signName(h.rashi,language)} (${h.rashi})`,h.bodies.map(b=>bodyName(b,language)).join(', ')||'—']));
   html+=table(t.tableHint,[t.body,t.sign,t.house,key==='d9'?t.source:'Longitude °'],f.planets.map(p=>[bodyName(p.body,language),p.rashi,p.house,number(p.longitude)]));
  }else if(key==='dasha'){
   html+=p(t.year)+p(`${t.balance}: ${bodyName(f.balance.lord,language)} · ${number(f.balance.remainingYears)} ${t.years}. ${t.origin}`);
   html+=p(`${t.current}: ${bodyName(f.active.major,language)} / ${bodyName(f.active.minor,language)} · ${t.asOf}: ${f.active.at}`);
   html+=p(`${t.next}: ${bodyName(f.next.major,language)} / ${bodyName(f.next.minor,language)} · ${date(f.next.boundary)}`);
   html+=table(t.major,[t.body,t.start,t.end],f.majors.map(m=>[bodyName(m.lord,language),date(m.start),date(m.end)]));
   for(const m of f.majors)html+=table(`${bodyName(m.lord,language)} · ${t.periodTable}`,[t.body,t.start,t.end],m.children.map(c=>[bodyName(c.lord,language),date(c.start),date(c.end)]));
  }
  html+='</section>';
 }
 html+=`<h2>${esc(x.provenance)}</h2>${p(t.fallback)}<dl>${Object.entries(model.provenance).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><h2>${esc(x.warnings)}</h2><ul>${model.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></article>`;
 return html;
}
export function standaloneReport(model){return `<!doctype html><html lang="${model.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Kundli report</title><style>${reportCss+reportLayoutCss+reportTableCss}</style></head><body>${reportMarkup(model)}</body></html>`;}

export function mountExport(container,report,{name='',language='en'}={}){
 const x=exportLabels[language],root=document.createElement('section');root.className='vedic-export';
 const heading=document.createElement('h2');heading.textContent=x.controls;
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.id='export-identity';label.append(check,document.createTextNode(x.include));
 const notice=document.createElement('p');notice.textContent=x.notice;const help=document.createElement('p');help.textContent=x.help;
 const preview=document.createElement('details'),summary=document.createElement('summary');summary.textContent=x.preview;const content=document.createElement('div');content.className='vedic-export-preview';preview.append(summary,content);
 const download=document.createElement('button');download.type='button';download.id='export-download';download.textContent=x.download;
 const print=document.createElement('button');print.type='button';print.id='export-print';print.textContent=x.print;
 const model=()=>projectExport(report,{includeIdentity:check.checked,name,language});
 const render=()=>{content.innerHTML=reportMarkup(model());};check.addEventListener('change',render);
 let urls=new Set(),timers=new Set();
 download.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([standaloneReport(model())],{type:'text/html;charset=utf-8'}));urls.add(url);
  const link=document.createElement('a');link.href=url;link.download='kundli-report.html';link.click();
  const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);timers.delete(timer);},1000);timers.add(timer);
 });
 let wasOpen=false,printing=false;
 const beforePrint=()=>{if(printing)return;printing=true;wasOpen=preview.open;render();preview.open=true;};
 const afterPrint=()=>{if(!printing)return;preview.open=wasOpen;printing=false;};
 window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
 print.addEventListener('click',()=>{render();window.print();});
 root.append(heading,label,notice,help,download,print,preview);container.replaceChildren(root);render();
 return {destroy(){window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint);for(const timer of timers)clearTimeout(timer);for(const url of urls)URL.revokeObjectURL(url);timers.clear();urls.clear();content.replaceChildren();root.remove();}};
}
