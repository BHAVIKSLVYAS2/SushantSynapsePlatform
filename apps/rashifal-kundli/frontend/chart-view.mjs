import {resultSections} from './kundli-journey-copy.mjs';
import {chartViewModel,northCells,southCells} from './chart-model.mjs';
import {locale,signName,bodyName} from './locale.mjs';
import {nakshatraName} from './display-text.mjs';
import {practitionerCopy,grahaCode,signDms} from './practitioner-copy.mjs';
const ns='http://www.w3.org/2000/svg';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
export function mountCharts(container,charts,options={}){
 if(!(container instanceof Element)||!charts||Object.keys(options).some(k=>!['initialChart','initialStyle','initialHouse','language','paired','positions','onStateChange'].includes(k)))throw new TypeError('Check chart view options.');
 const language=options.language??'en',t=locale(language),c=practitionerCopy[language];
 const models={D1:chartViewModel(charts.d1)};for(const key of ['d9','d7','d10','d12'])if(charts[key])models[key.toUpperCase()]=chartViewModel(charts[key]);
 let type=options.initialChart??'D1',style=options.initialStyle??'north',selected=options.initialHouse??1;
 if(!models[type])type='D1';
 if(!models[type]||!['north','south'].includes(style)||!Number.isInteger(selected)||selected<1||selected>12)throw new TypeError('Check chart view options.');
 const root=el('section',undefined,'vedic-charts');root.setAttribute('aria-label',t.chart);
 const paired=Boolean(options.paired&&models.D9);root.classList.toggle('vedic-charts-paired',paired);
 const heading=el('h2',t.chart),notice=el('p',t.gate,'vedic-notice');
 const controls=el('div',undefined,'vedic-chart-controls'),divisionButtons=[],styleButtons=[];
 function buttons(label,items,list,choose){const group=el('div');group.setAttribute('role','group');group.setAttribute('aria-label',label);
  for(const [value,text]of items){const b=el('button',text);b.type='button';b.dataset.value=value;b.addEventListener('click',()=>{choose(value);render();});group.append(b);list.push(b);}controls.append(group);}
 const advanced=['D7','D10','D12'].filter(key=>models[key]);
 buttons(t.division,advanced.length?advanced.map(key=>[key,key]):[['D1',t.d1],['D9',t.d9]],divisionButtons,v=>{type=v;});
 const d9Button=divisionButtons.find(b=>b.dataset.value==='D9');if(d9Button)d9Button.disabled=!models.D9;
 buttons(t.style,[['north',t.north],['south',t.south]],styleButtons,v=>{style=v;});
 styleButtons[0].parentElement.classList.add('vedic-chart-style-buttons');
 const styleSelect=el('select');styleSelect.className='vedic-chart-style-select';styleSelect.setAttribute('aria-label',t.style);for(const [value,label]of [['north',t.north],['south',t.south]])styleSelect.append(new Option(label,value));styleSelect.addEventListener('change',()=>{style=styleSelect.value;render();});controls.append(styleSelect);
 const description=el('p',undefined,'vedic-chart-description');description.setAttribute('aria-live','polite');
 const summary=el('p',undefined,'vedic-ascendant-summary');
 const stage=el('div',undefined,'vedic-chart-stage'),details=el('section',undefined,'vedic-house-details');
 details.setAttribute('aria-label',t.details);details.setAttribute('aria-live','polite');
 const tableRegion=el('div',undefined,'vedic-chart-table');tableRegion.tabIndex=0;tableRegion.setAttribute('role','region');tableRegion.setAttribute('aria-label',t.tableHint);
 const legend=el('p',c.precision+' '+' '+models.D1.planets.map(p=>`${grahaCode(p.body,p.code,language)} ${bodyName(p.body,language)}`).join(' · '),'vedic-chart-legend');
 const explorer=el('div',undefined,'vedic-chart-explorer');explorer.append(stage,details);
 const houseLabel=el('label',t.house,'vedic-house-picker'),houseSelect=el('select');houseSelect.setAttribute('aria-label',t.details);for(let i=1;i<=12;i++)houseSelect.append(new Option(t.house+' '+i,i));houseSelect.addEventListener('change',()=>select(Number(houseSelect.value)));houseLabel.append(houseSelect);
 const notes=el('details',undefined,'vedic-chart-notes');notes.append(el('summary',c.notes),notice,description,summary,legend);
 const expand=el('button',c.expand);expand.type='button';expand.className='vedic-chart-expand';expand.setAttribute('aria-expanded','false');
 function expanded(value){root.classList.toggle('is-expanded',value);if(value){root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');}else{root.removeAttribute('role');root.removeAttribute('aria-modal');}expand.textContent=value?c.collapse:c.expand;expand.setAttribute('aria-expanded',String(value));expand.focus();}
 expand.addEventListener('click',()=>expanded(!root.classList.contains('is-expanded')));controls.append(expand);
 root.addEventListener('keydown',e=>{if(!root.classList.contains('is-expanded'))return;if(e.key==='Escape'){e.preventDefault();expanded(false);}if(e.key==='Tab'){const nodes=[...root.querySelectorAll('button:not(:disabled),select,summary,a[href],input,[tabindex="0"]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 if(!options.paired)root.append(heading);root.append(controls,explorer,houseLabel,tableRegion,notes);container.replaceChildren(root);
 function select(house,chartType=type){selected=house;if(type!==chartType){type=chartType;render();}else update();}
 function update(){const h=models[type].houses[selected-1];
  for(const g of stage.querySelectorAll('[data-house]'))g.setAttribute('aria-pressed',String(Number(g.dataset.house)===selected&&g.closest('[data-chart]').dataset.chart===type));
  for(const row of tableRegion.querySelectorAll('[data-house]')){row.dataset.selected=String(Number(row.dataset.house)===selected);row.querySelector('button')?.setAttribute('aria-pressed',row.dataset.selected);}
  root.dataset.chart=type;root.dataset.style=style;options.onStateChange?.({type,style,selected});houseSelect.value=String(selected);details.replaceChildren(el('h3',`${type} · ${t.house} ${selected} · ${signName(h.rashi,language)} (${h.rashi})`),el('p',h.planets.map(p=>bodyName(p.body,language)).join(', ')||t.empty));const list=el('dl',undefined,'vedic-house-planets');for(const p of h.planets)list.append(el('dt',bodyName(p.body,language)),el('dd',`${signName(p.rashi,language)} · ${signDms(p.sourceLongitude)} · ${type==='D1'?t.longitude:t.source}`));details.append(list,el('p',resultSections[language].house,'vedic-chart-description'));
 }
 function render(){const model=models[type];
  styleSelect.value=style;
  for(const b of divisionButtons)b.setAttribute('aria-pressed',String(b.dataset.value===type));
  for(const b of styleButtons)b.setAttribute('aria-pressed',String(b.dataset.value===style));
  const divisionalHint=advanced.length?({en:'Mapped divisional signs, not physical sky longitudes.',hi:'मानचित्रित वर्ग राशियाँ, आकाश के वास्तविक देशांतर नहीं।',gu:'નકશાંકિત વર્ગ રાશિઓ, આકાશના વાસ્તવિક રેખાંશ નથી.'})[language]??'Mapped divisional signs.':t.d9Hint;
  description.textContent=`${type} · ${style==='north'?t.northHint:t.southHint} ${t.selectHouse} ${divisionalHint}`;
  summary.textContent=`${type} ${t.ascendant}: ${signName(model.ascendantRashi,language)} (${model.ascendantRashi}) · ${type!=='D1'?t.source:t.longitude} ${model.ascendantSourceLongitude.toFixed(4)}°. ${t.rounding}`;
  stage.replaceChildren();for(const chartType of (paired?['D1','D9']:[type])){const model=models[chartType],figure=el('figure',undefined,'vedic-chart-figure');figure.dataset.chart=chartType;figure.dataset.active=String(chartType===type);figure.append(el('figcaption',(chartType==='D1'?t.d1:chartType==='D9'?t.d9:chartType)+' · '+c.lagna+': '+signName(model.ascendantRashi,language)));
  const svg=svgEl('svg',{viewBox:'0 0 400 400',role:'group','aria-label':`${chartType} ${style==='north'?t.north:t.south} chart`});
  if(style==='south')svg.append(svgEl('text',{x:200,y:190,'text-anchor':'middle',class:'vedic-chart-centre'},chartType),svgEl('text',{x:200,y:214,'text-anchor':'middle',class:'vedic-chart-centre-note'},t.whole));
  for(const h of model.houses){const g=svgEl('g',{'data-house':h.houseNumber,'data-rashi':h.rashi,role:'button',tabindex:0,'aria-pressed':h.houseNumber===selected,class:'vedic-chart-cell',
    'aria-label':`${t.house} ${h.houseNumber}, ${signName(h.rashi,language)}, ${t.sign.toLowerCase()} ${h.rashi}${h.isAscendant?', '+t.ascendant.toLowerCase():''}: ${h.planets.map(p=>bodyName(p.body,language)).join(', ')||t.empty}`});
   let x,y;
   if(style==='north'){const cell=northCells[h.houseNumber-1];x=cell[1];y=cell[2];g.append(svgEl('polygon',{points:cell[0]}));}
   else{const [col,row]=southCells[h.rashi-1];x=col*100+50;y=row*100+25;g.append(svgEl('rect',{x:col*100,y:row*100,width:100,height:100}));}
   const lines=[];for(let i=0;i<h.planets.length;i+=3)lines.push(h.planets.slice(i,i+3));
   const left=style==='north'&&[3,5].includes(h.houseNumber),right=style==='north'&&[9,11].includes(h.houseNumber);if(left)x=12;if(right)x=388;const anchor=left?'start':right?'end':'middle';
   if(style==='north'){if([2,12].includes(h.houseNumber))y=12;if([3,11].includes(h.houseNumber))y=62;if([5,9].includes(h.houseNumber))y=270;if([6,8].includes(h.houseNumber))y=326;}
   g.append(svgEl('title',{},t.house+' '+h.houseNumber+' · '+signName(h.rashi,language)+': '+h.planets.map(p=>bodyName(p.body,language)).join(', ')));
   g.append(svgEl('text',{x,y,'text-anchor':anchor,class:'vedic-cell-label'},String(h.rashi)+(h.isAscendant?' · '+c.lagna:'')));
   if(!lines.length)g.append(svgEl('text',{x,y:y+20,'text-anchor':anchor,class:'vedic-cell-bodies'},'—'));
   for(const [i,line]of lines.entries())g.append(svgEl('text',{x,y:y+20+i*16,'text-anchor':anchor,class:'vedic-cell-bodies'},line.map(p=>grahaCode(p.body,p.code,language)).join(' ')));
   g.addEventListener('click',()=>select(h.houseNumber,chartType));g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select(h.houseNumber,chartType);}});svg.append(g);
  }
  figure.append(svg);stage.append(figure); }
  const table=el('table'),caption=el('caption',c.grahas+' · '+(paired?'D1 / D9':type)),head=el('thead'),tr=el('tr');
  for(const name of [t.body,paired?'D1 ? '+t.sign:t.sign,paired?'D1 ? '+t.house:t.house,type!=='D1'&&!paired?c.source:c.degrees,...(options.positions?[t.nakshatra,t.pada]:[]),...(paired?[t.d9]:[])]){const th=el('th',name);th.scope='col';tr.append(th);}head.append(tr);
  const body=el('tbody');for(const p of (paired?models.D1:model).planets){const row=el('tr');row.dataset.body=p.body;const target=models[type].planets.find(v=>v.body===p.body);row.dataset.house=String(target.houseNumber);row.dataset.rashi=String(p.rashi);
   const th=el('th'),pick=el('button',bodyName(p.body,language));pick.type='button';pick.addEventListener('click',()=>select(target.houseNumber));th.append(pick);th.scope='row';row.append(th,el('td',`${signName(p.rashi,language)} (${p.rashi})`),el('td',String(p.houseNumber)),el('td',`${signDms(p.sourceLongitude)}`));const pos=options.positions?.find(v=>v.body===p.body);if(options.positions)row.append(el('td',pos?nakshatraName(pos.nakshatra,language):'—'),el('td',pos?String(pos.pada):'—'));if(paired)row.append(el('td',signName(models.D9.planets.find(v=>v.body===p.body).rashi,language)));body.append(row);}
  table.append(caption,head,body);tableRegion.replaceChildren(table);update();
 }
 render();return Object.freeze({destroy(){root.remove();}});
}
