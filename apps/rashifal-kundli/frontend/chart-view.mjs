import {chartViewModel,northCells,southCells} from './chart-model.mjs';
import {locale,signName,bodyName} from './locale.mjs';
const ns='http://www.w3.org/2000/svg';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
export function mountCharts(container,charts,options={}){
 if(!(container instanceof Element)||!charts||Object.keys(options).some(k=>!['initialChart','initialStyle','language'].includes(k)))throw new TypeError('Check chart view options.');
 const language=options.language??'en',t=locale(language);
 const models={D1:chartViewModel(charts.d1)};for(const key of ['d9','d7','d10','d12'])if(charts[key])models[key.toUpperCase()]=chartViewModel(charts[key]);
 let type=options.initialChart??'D1',style=options.initialStyle??'north',selected=1;
 if(!models[type]||!['north','south'].includes(style))throw new TypeError('Check chart view options.');
 const root=el('section',undefined,'vedic-charts');root.setAttribute('aria-label',t.chart);
 const heading=el('h2',t.chart),notice=el('p',t.gate,'vedic-notice');
 const controls=el('div',undefined,'vedic-chart-controls'),divisionButtons=[],styleButtons=[];
 function buttons(label,items,list,choose){const group=el('div');group.setAttribute('role','group');group.setAttribute('aria-label',label);
  for(const [value,text]of items){const b=el('button',text);b.type='button';b.dataset.value=value;b.addEventListener('click',()=>{choose(value);render();});group.append(b);list.push(b);}controls.append(group);}
 const advanced=['D7','D10','D12'].filter(key=>models[key]);
 buttons(t.division,advanced.length?advanced.map(key=>[key,key]):[['D1',t.d1],['D9',t.d9]],divisionButtons,v=>{type=v;});
 const d9Button=divisionButtons.find(b=>b.dataset.value==='D9');if(d9Button)d9Button.disabled=!models.D9;
 buttons(t.style,[['north',t.north],['south',t.south]],styleButtons,v=>{style=v;});
 const description=el('p',undefined,'vedic-chart-description');description.setAttribute('aria-live','polite');
 const summary=el('p',undefined,'vedic-ascendant-summary');
 const stage=el('div',undefined,'vedic-chart-stage'),details=el('section',undefined,'vedic-house-details');
 details.setAttribute('aria-label',t.details);details.setAttribute('aria-live','polite');
 const tableRegion=el('div',undefined,'vedic-chart-table');tableRegion.tabIndex=0;tableRegion.setAttribute('role','region');tableRegion.setAttribute('aria-label',t.tableHint);
 const legend=el('p',t.legend+' '+models.D1.planets.map(p=>`${p.code} ${bodyName(p.body,language)}`).join(' · '),'vedic-chart-legend');
 root.append(heading,notice,controls,description,summary,stage,legend,details,tableRegion);container.replaceChildren(root);
 function select(house){selected=house;update();}
 function update(){const h=models[type].houses[selected-1];
  for(const g of stage.querySelectorAll('[data-house]'))g.setAttribute('aria-pressed',String(Number(g.dataset.house)===selected));
  for(const row of tableRegion.querySelectorAll('[data-house]'))row.dataset.selected=String(Number(row.dataset.house)===selected);
  details.replaceChildren(el('h3',`${type} · ${t.house} ${selected} · ${signName(h.rashi,language)} (${h.rashi})`),el('p',h.planets.map(p=>bodyName(p.body,language)).join(', ')||t.empty));
 }
 function render(){const model=models[type];
  for(const b of divisionButtons)b.setAttribute('aria-pressed',String(b.dataset.value===type));
  for(const b of styleButtons)b.setAttribute('aria-pressed',String(b.dataset.value===style));
  const divisionalHint=advanced.length?({en:'Mapped divisional signs, not physical sky longitudes.',hi:'मानचित्रित वर्ग राशियाँ, आकाश के वास्तविक देशांतर नहीं।',gu:'નકશાંકિત વર્ગ રાશિઓ, આકાશના વાસ્તવિક રેખાંશ નથી.'})[language]??'Mapped divisional signs.':t.d9Hint;
  description.textContent=`${type} · ${style==='north'?t.northHint:t.southHint} ${t.selectHouse} ${divisionalHint}`;
  summary.textContent=`${type} ${t.ascendant}: ${signName(model.ascendantRashi,language)} (${model.ascendantRashi}) · ${type!=='D1'?t.source:t.longitude} ${model.ascendantSourceLongitude.toFixed(4)}°. ${t.rounding}`;
  const svg=svgEl('svg',{viewBox:'0 0 400 400',role:'group','aria-label':`${type} ${style==='north'?t.north:t.south} chart`});
  if(style==='south')svg.append(svgEl('text',{x:200,y:190,'text-anchor':'middle',class:'vedic-chart-centre'},type),svgEl('text',{x:200,y:214,'text-anchor':'middle',class:'vedic-chart-centre-note'},t.whole));
  for(const h of model.houses){const g=svgEl('g',{'data-house':h.houseNumber,'data-rashi':h.rashi,role:'button',tabindex:0,'aria-pressed':h.houseNumber===selected,class:'vedic-chart-cell',
    'aria-label':`${t.house} ${h.houseNumber}, ${signName(h.rashi,language)}, ${t.sign.toLowerCase()} ${h.rashi}${h.isAscendant?', '+t.ascendant.toLowerCase():''}: ${h.planets.map(p=>bodyName(p.body,language)).join(', ')||t.empty}`});
   let x,y;
   if(style==='north'){const cell=northCells[h.houseNumber-1];x=cell[1];y=cell[2];g.append(svgEl('polygon',{points:cell[0]}));}
   else{const [col,row]=southCells[h.rashi-1];x=col*100+50;y=row*100+25;g.append(svgEl('rect',{x:col*100,y:row*100,width:100,height:100}));}
   g.append(svgEl('text',{x,y,'text-anchor':'middle',class:'vedic-cell-label'},`H${h.houseNumber} S${h.rashi}${h.isAscendant?' Lg':''}`),
    svgEl('text',{x,y:y+22,'text-anchor':'middle',class:'vedic-cell-bodies'},h.planets.slice(0,3).map(p=>p.code).join(' ')||'—'));
   if(h.planets.length>3)g.append(svgEl('text',{x,y:y+39,'text-anchor':'middle',class:'vedic-cell-bodies'},`+${h.planets.length-3}`));
   g.addEventListener('click',()=>select(h.houseNumber));g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select(h.houseNumber);}});svg.append(g);
  }
  stage.replaceChildren(svg);
  const table=el('table'),caption=el('caption',`${type} ${t.tableHint}`),head=el('thead'),tr=el('tr');
  for(const name of [t.body,t.sign,t.house,type!=='D1'?t.source:t.longitude]){const th=el('th',name);th.scope='col';tr.append(th);}head.append(tr);
  const body=el('tbody');for(const p of model.planets){const row=el('tr');row.dataset.body=p.body;row.dataset.house=String(p.houseNumber);row.dataset.rashi=String(p.rashi);
   const th=el('th',bodyName(p.body,language));th.scope='row';row.append(th,el('td',`${signName(p.rashi,language)} (${p.rashi})`),el('td',String(p.houseNumber)),el('td',`${p.sourceLongitude.toFixed(4)}°`));body.append(row);}
  table.append(caption,head,body);tableRegion.replaceChildren(table);update();
 }
 render();return Object.freeze({destroy(){root.remove();}});
}
