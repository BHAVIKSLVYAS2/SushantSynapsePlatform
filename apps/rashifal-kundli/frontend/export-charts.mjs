import {northCells,southCells,chartViewModel} from './chart-model.mjs';
import {locale,signName,bodyName} from './locale.mjs';
import {chartExtras,practitionerCopy,grahaCode} from './practitioner-copy.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const codes={Sun:'Su',Moon:'Mo',Mercury:'Me',Venus:'Ve',Mars:'Ma',Jupiter:'Ju',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'};
export function projectChart(chart){
 const m=chartViewModel(chart);
 return {status:'available',ascendantRashi:m.ascendantRashi,ascendantLongitude:m.ascendantSourceLongitude,
  houses:m.houses.map(h=>({house:h.houseNumber,rashi:h.rashi,bodies:h.planets.map(p=>p.body)})),
  planets:m.planets.map(p=>({body:p.body,rashi:p.rashi,house:p.houseNumber,longitude:p.sourceLongitude}))};
}
export function chartTitle(key,language){return locale(language)[key]??chartExtras[language][key==='chandra'?'Chandra':key.toUpperCase()]??key.toUpperCase();}
export function chartNote(key,language){const t=chartExtras[language];return key==='chandra'?t.moonHint:['d2','d16','d7','d10','d12'].includes(key)?(t[key.toUpperCase()+'Hint']??'')+' '+t.candidate:'';}
// Reuse the explorer's fixed-house/fixed-sign geometry, without interactive nodes.
export function chartMarkup(chart,key,style,language){
 const t=locale(language),title=chartTitle(key,language),c=practitionerCopy[language];
 const name=`${title} · ${style==='north'?t.north:t.south}`;
 let svg=`<figure class="report-chart-figure" data-chart="${esc(key)}" data-style="${style}"><figcaption>${esc(name)}</figcaption><svg class="report-chart-svg" viewBox="0 0 400 400" role="img" aria-label="${esc(name)}"><title>${esc(name)}</title>`;
 for(const h of chart.houses){let x,y,shape,anchor='middle';
  if(style==='north'){const cell=northCells[h.house-1];x=cell[1];y=cell[2];shape=`<polygon points="${cell[0]}"/>`;if([3,5].includes(h.house)){x=12;anchor='start';}if([9,11].includes(h.house)){x=388;anchor='end';}if([2,12].includes(h.house))y=12;if([3,11].includes(h.house))y=62;if([5,9].includes(h.house))y=270;if([6,8].includes(h.house))y=326;}
  else{const [col,row]=southCells[h.rashi-1];x=col*100+50;y=row*100+25;shape=`<rect x="${col*100}" y="${row*100}" width="100" height="100"/>`;}
  const marker=h.rashi===chart.ascendantRashi?(key==='chandra'?chartExtras[language].moon:c.lagna):'';
  svg+=`<g data-house="${h.house}" data-rashi="${h.rashi}"><title>${esc(t.house+' '+h.house+' · '+signName(h.rashi,language)+': '+h.bodies.map(b=>bodyName(b,language)).join(', '))}</title>${shape}<text x="${x}" y="${y}" text-anchor="${anchor}">${h.rashi}${marker?' · '+esc(marker):''}</text>`;
  const lines=[];for(let i=0;i<h.bodies.length;i+=3)lines.push(h.bodies.slice(i,i+3));
  for(const [i,line]of lines.entries())svg+=`<text class="report-grahas" x="${x}" y="${y+20+i*20}" text-anchor="${anchor}">${esc(line.map(b=>grahaCode(b,codes[b],language)).join(' '))}</text>`;
  svg+='</g>';
 }
 if(style==='south')svg+=`<text x="200" y="194" text-anchor="middle">${esc(title)}</text><text x="200" y="216" text-anchor="middle">${esc(t.south)}</text>`;
 return svg+'</svg></figure>';
}
export const chartReportCss='.report-chart-figure{max-width:34rem;margin:1rem auto;break-inside:avoid}.report-chart-figure figcaption{text-align:center;font-weight:700;margin-bottom:.6rem}.report-chart-svg{display:block;width:100%;height:auto;overflow:visible}.report-chart-svg polygon,.report-chart-svg rect{fill:var(--report-bg);stroke:var(--report-ink);stroke-width:1.2}.report-chart-svg text{fill:var(--report-ink);font:13px system-ui,"Noto Sans Devanagari","Noto Sans Gujarati",sans-serif;dominant-baseline:hanging}.report-chart-svg .report-grahas{font-size:15px;font-weight:650}@media print{.report-chart-figure{max-width:135mm;page-break-inside:avoid}}';
