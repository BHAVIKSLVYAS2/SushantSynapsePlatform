import {kundliInterfaceCopy} from './kundli-interface-copy.mjs';
import {resultSections} from './kundli-journey-copy.mjs';
import {chartViewModel,northCells,southCells} from './chart-model.mjs';
import {locale,signName,bodyName} from './locale.mjs';
import {nakshatraName} from './display-text.mjs';
import {timeAvailabilityCopy,chartExtras,practitionerCopy,readingWorkspaceCopy,grahaCode,signDms} from './practitioner-copy.mjs';
const ns='http://www.w3.org/2000/svg';
const d16PreviewLabel={en:'Time-sensitive preview',hi:'समय-संवेदनशील पूर्वावलोकन',gu:'સમય-સંવેદનશીલ પૂર્વાવલોકન'};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const svgEl=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
export function mountCharts(container,charts,options={}){
 if(!(container instanceof Element)||!charts||Object.keys(options).some(k=>!['d16Sensitive','d1Sensitive','d9Sensitive','initialChart','initialStyle','initialHouse','initialBody','initialCompare','initialContext','language','paired','positions','onStateChange'].includes(k)))throw new TypeError('Check chart view options.');
 const language=options.language??'en',t=locale(language),c=practitionerCopy[language],r=readingWorkspaceCopy[language],extra=chartExtras[language];
 const models={D1:chartViewModel(charts.d1)};for(const key of ['d9','d2','d7','d10','d12','d16','chandra'])if(charts[key])models[key==='chandra'?'Chandra':key.toUpperCase()]=chartViewModel(charts[key]);
 let selectedBody=options.initialBody??null,compare=Boolean(options.initialCompare),contextOpen=Boolean(options.initialContext||selectedBody);
 let type=options.initialChart??'D1',style=options.initialStyle??'north',selected=options.initialHouse??1;
 if(!models[type])type='D1';
 if(selectedBody&&!models.D1.planets.some(p=>p.body===selectedBody))throw new TypeError('Check chart selection.');
 if(!models[type]||!['north','south'].includes(style)||!Number.isInteger(selected)||selected<1||selected>12)throw new TypeError('Check chart view options.');
 const root=el('section',undefined,'vedic-charts');root.setAttribute('aria-label',t.chart);
 const paired=Boolean(options.paired&&models.D9);compare=paired&&compare;root.classList.toggle('vedic-reading-workspace',Boolean(options.paired));root.dataset.pane='chart';
 const heading=el('h2',t.chart),notice=el('p',t.gate,'vedic-notice');
 const controls=el('div',undefined,'vedic-chart-controls'),divisionButtons=[],styleButtons=[];
 function buttons(label,items,list,choose){const group=el('div');group.setAttribute('role','group');group.setAttribute('aria-label',label);
  for(const [value,text]of items){const b=el('button',text);b.type='button';b.dataset.value=value;b.setAttribute('aria-label',text);b.addEventListener('click',()=>{choose(value);render();});group.append(b);list.push(b);}controls.append(group);}
 const advanced=options.paired?[]:['D2','D7','D10','D12','D16'].filter(key=>models[key]);
 buttons(t.division,advanced.length?advanced.map(key=>[key,extra[key]??key]):[['D1',t.d1],['D9',t.d9]],divisionButtons,v=>{type=v;compare=false;if(selectedBody)selected=models[type].planets.find(p=>p.body===selectedBody).houseNumber;});
 if(options.paired)divisionButtons[0].parentElement.hidden=true;
 const d9Button=divisionButtons.find(b=>b.dataset.value==='D9');if(d9Button)d9Button.disabled=!models.D9;
 const chartSelect=el('select');chartSelect.className='vedic-chart-division-select';chartSelect.setAttribute('aria-label',t.division);const chartLabel=el('label',undefined,'vedic-chart-division-label');chartLabel.append(el('span',extra.choose),chartSelect);
 if(options.paired){for(const [key,label]of [['D1',t.d1],['D9',t.d9],['Chandra',extra.Chandra],['D2',extra.D2],['D16',extra.D16]]){const preview=key==='D16'&&options.d16Sensitive?' / '+d16PreviewLabel[language]:'';const option=new Option(label+preview+(models[key]?'':' / '+extra.unavailable),key);option.disabled=!models[key];chartSelect.append(option);}chartSelect.onchange=()=>{type=chartSelect.value;compare=false;if(selectedBody)selected=models[type].planets.find(p=>p.body===selectedBody).houseNumber;render();};controls.append(chartLabel);}
 buttons(t.style,[['north',t.north],['south',t.south]],styleButtons,v=>{style=v;});
 styleButtons[0].parentElement.classList.add('vedic-chart-style-buttons');if(options.paired)for(const button of styleButtons)button.textContent=kundliInterfaceCopy[language][button.dataset.value];
 const styleSelect=el('select');styleSelect.className='vedic-chart-style-select';styleSelect.setAttribute('aria-label',t.style);for(const [value,label]of [['north',t.north],['south',t.south]])styleSelect.append(new Option(label,value));styleSelect.addEventListener('change',()=>{style=styleSelect.value;render();});controls.append(styleSelect);
 const description=el('p',undefined,'vedic-chart-description');description.setAttribute('aria-live','polite');
 const summary=el('p',undefined,'vedic-ascendant-summary');
 const stage=el('div',undefined,'vedic-chart-stage'),details=el('section',undefined,'vedic-house-details');
 details.setAttribute('aria-label',t.details);details.setAttribute('aria-live','polite');
 const tableRegion=el('div',undefined,'vedic-chart-table');tableRegion.tabIndex=0;tableRegion.setAttribute('role','region');tableRegion.setAttribute('aria-label',t.tableHint);
 const legend=el('p',c.precision+' '+' '+models.D1.planets.map(p=>`${grahaCode(p.body,p.code,language)} ${bodyName(p.body,language)}`).join(' · '),'vedic-chart-legend');
 const explorer=el('div',undefined,'vedic-chart-explorer');const method=el('p',undefined,'vedic-chart-method');method.setAttribute('role','status');explorer.append(stage,tableRegion);
 const selection=el('p',r.inspect,'vedic-graha-context');selection.setAttribute('aria-live','polite');
 const compareButton=el('button',r.compare);compareButton.type='button';compareButton.className='vedic-chart-compare';compareButton.hidden=!paired;compareButton.onclick=()=>{compare=!compare;if(compare)type='D1';render();};controls.append(compareButton);

 const notes=el('details',undefined,'vedic-chart-notes');notes.append(el('summary',c.notes),notice,description,summary,legend);
 const expand=el('button');const expandText=el('span',c.expand,'vedic-expand-label'),expandIcon=svgEl('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',stroke:'currentColor','stroke-width':1.8,'aria-hidden':'true'});expandIcon.append(svgEl('path',{d:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'}));expand.append(expandIcon,expandText);expand.setAttribute('aria-label',c.expand);expand.title=c.expand;expand.type='button';expand.className='vedic-chart-expand';expand.setAttribute('aria-expanded','false');
 function expanded(value){root.classList.toggle('is-expanded',value);if(value){root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');}else{root.removeAttribute('role');root.removeAttribute('aria-modal');}expandText.textContent=value?c.collapse:c.expand;expand.setAttribute('aria-label',expandText.textContent);expand.title=expandText.textContent;expand.setAttribute('aria-expanded',String(value));expand.focus();}
 expand.addEventListener('click',()=>expanded(!root.classList.contains('is-expanded')));controls.append(expand);
 root.addEventListener('keydown',e=>{if(!root.classList.contains('is-expanded'))return;if(e.key==='Escape'){e.preventDefault();expanded(false);}if(e.key==='Tab'){const nodes=[...root.querySelectorAll('button:not(:disabled),select,summary,a[href],input,[tabindex="0"]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 if(!options.paired)root.append(heading);root.append(controls,method,explorer,selection,details,notes);container.replaceChildren(root);
 function select(house,chartType=type){selectedBody=null;contextOpen=true;selected=house;type=chartType;update();}
 function selectGraha(body,chartType=type){selectedBody=body;contextOpen=true;type=chartType;selected=models[type].planets.find(p=>p.body===body).houseNumber;update();}
 function update(){const h=models[type].houses[selected-1];
  for(const figure of stage.querySelectorAll('[data-chart]'))figure.dataset.active=String(figure.dataset.chart===type);for(const b of divisionButtons)b.setAttribute('aria-pressed',String(b.dataset.value===type));
  for(const g of stage.querySelectorAll('[data-house]')){const chartType=g.closest('[data-chart]').dataset.chart,house=selectedBody?models[chartType].planets.find(p=>p.body===selectedBody).houseNumber:selected;g.dataset.selected=String(contextOpen&&Number(g.dataset.house)===house&&(!!selectedBody||chartType===type));g.setAttribute('aria-pressed',g.dataset.selected);g.querySelector('[role=button]')?.setAttribute('aria-pressed',g.dataset.selected);}
  for(const label of stage.querySelectorAll('[data-graha]'))label.setAttribute('aria-pressed',String(label.dataset.graha===selectedBody));
  for(const row of tableRegion.querySelectorAll('[data-body]')){row.dataset.selected=String(row.dataset.body===selectedBody);row.querySelector('button')?.setAttribute('aria-pressed',row.dataset.selected);}
  root.dataset.chart=type;root.dataset.style=style;root.dataset.selectedBody=selectedBody||'';root.dataset.selectedHouse=String(selected);chartSelect.value=type;root.dataset.compare=String(compare);options.onStateChange?.({type,style,selected,body:selectedBody,compare,context:contextOpen});details.hidden=!contextOpen;selection.hidden=contextOpen;
  selection.textContent=contextOpen?`${t.house} ${selected} / ${signName(h.rashi,language)} (${h.rashi})`:kundliInterfaceCopy[language].houseHint;
  details.replaceChildren(el('h3',`${type} \u00b7 ${t.house} ${selected} \u00b7 ${signName(h.rashi,language)} (${h.rashi})`));
  if(!h.planets.length)details.append(el('p',t.empty));
  const list=el('div',undefined,'vedic-house-grahas');
  for(const p of h.planets){
   const item=el('section',undefined,'vedic-house-graha'),base=models.D1.planets.find(v=>v.body===p.body),d9=models.D9?.planets.find(v=>v.body===p.body),pos=options.positions?.find(v=>v.body===p.body);
   item.dataset.houseBody=p.body;item.dataset.selected=String(p.body===selectedBody);item.append(el('h4',bodyName(p.body,language)));
   item.append(el('p',type==='D1'?`${c.degrees}: ${signDms(base.sourceLongitude)}`:`D1 \u00b7 ${signName(base.rashi,language)} \u00b7 ${signDms(base.sourceLongitude)} \u00b7 ${t.house} ${base.houseNumber}`));
   if(pos)item.append(el('p',`${type==='D1'?'':'D1 \u00b7 '}${t.nakshatra}: ${nakshatraName(pos.nakshatra,language)} \u00b7 ${t.pada} ${pos.pada}`));
   if(d9&&type!=='D9')item.append(el('p',`D9 \u00b7 ${signName(d9.rashi,language)} \u00b7 ${t.house} ${d9.houseNumber}`));
   list.append(item);
  }details.append(list);

 }
 function render(){const model=models[type];method.textContent=type==='Chandra'?extra.moonHint:['D2','D16'].includes(type)?extra[type+'Hint']+' '+extra.candidate:'';if(options.d1Sensitive)method.textContent=timeAvailabilityCopy[language].boundary;if(options.d9Sensitive&&(type==='D9'||compare))method.textContent=timeAvailabilityCopy[language].preview;if(options.d16Sensitive&&type==='D16')method.textContent=timeAvailabilityCopy[language].preview.replace('D9','D16')+' '+extra.candidate;method.hidden=!method.textContent;
  root.classList.toggle('vedic-charts-paired',paired&&compare);compareButton.textContent=compare?r.stopCompare:r.compare;compareButton.setAttribute('aria-pressed',String(compare));
  styleSelect.value=style;chartSelect.value=type;
  for(const b of divisionButtons)b.setAttribute('aria-pressed',String(b.dataset.value===type));
  for(const b of styleButtons)b.setAttribute('aria-pressed',String(b.dataset.value===style));
  const divisionalHint=advanced.length?({en:'Mapped divisional signs, not physical sky longitudes.',hi:'मानचित्रित वर्ग राशियाँ, आकाश के वास्तविक देशांतर नहीं।',gu:'નકશાંકિત વર્ગ રાશિઓ, આકાશના વાસ્તવિક રેખાંશ નથી.'})[language]??'Mapped divisional signs.':t.d9Hint;
  description.textContent=`${type} · ${style==='north'?t.northHint:t.southHint} ${t.selectHouse} ${type==='Chandra'?extra.moonHint:divisionalHint}`;
  summary.textContent=`${type} ${type==='Chandra'?extra.moon:t.ascendant}: ${signName(model.ascendantRashi,language)} (${model.ascendantRashi}) · ${type!=='D1'?t.source:t.longitude} ${model.ascendantSourceLongitude.toFixed(4)}°. ${t.rounding}`;
  stage.replaceChildren();for(const chartType of (paired&&['D1','D9'].includes(type)?['D1','D9']:[type])){const model=models[chartType],figure=el('figure',undefined,'vedic-chart-figure');figure.dataset.chart=chartType;figure.dataset.active=String(chartType===type);figure.append(el('figcaption',(chartType==='D1'?t.d1:chartType==='D9'?t.d9:extra[chartType]??chartType)+' · '+(chartType==='Chandra'?extra.moon:c.lagna)+': '+signName(model.ascendantRashi,language)));
  const grahaLabels=[];const svg=svgEl('svg',{viewBox:'0 0 400 400',role:'group','aria-label':`${chartType} ${style==='north'?t.north:t.south} chart`});
  if(style==='south')svg.append(svgEl('text',{x:200,y:190,'text-anchor':'middle',class:'vedic-chart-centre'},chartType),svgEl('text',{x:200,y:214,'text-anchor':'middle',class:'vedic-chart-centre-note'},t.whole));
  for(const h of model.houses){const g=svgEl('g',{'data-house':h.houseNumber,'data-rashi':h.rashi,class:'vedic-chart-cell',
    'aria-label':`${t.house} ${h.houseNumber}, ${signName(h.rashi,language)}, ${t.sign.toLowerCase()} ${h.rashi}${h.isAscendant?', '+t.ascendant.toLowerCase():''}: ${h.planets.map(p=>bodyName(p.body,language)).join(', ')||t.empty}`});
   let x,y;
   if(style==='north'){const cell=northCells[h.houseNumber-1];x=cell[1];y=cell[2];g.append(svgEl('polygon',{points:cell[0]}));}
   else{const [col,row]=southCells[h.rashi-1];x=col*100+50;y=row*100+25;g.append(svgEl('rect',{x:col*100,y:row*100,width:100,height:100}));}
   const shape=g.firstChild;shape.setAttribute('role','button');shape.setAttribute('tabindex','0');shape.setAttribute('aria-label',g.getAttribute('aria-label'));
   const lines=[];for(let i=0;i<h.planets.length;i+=3)lines.push(h.planets.slice(i,i+3));
   const left=style==='north'&&[3,5].includes(h.houseNumber),right=style==='north'&&[9,11].includes(h.houseNumber);if(left)x=12;if(right)x=388;const anchor=left?'start':right?'end':'middle';
   if(style==='north'){if([2,12].includes(h.houseNumber))y=12;if([3,11].includes(h.houseNumber))y=62;if([5,9].includes(h.houseNumber))y=270;if([6,8].includes(h.houseNumber))y=326;}

   g.append(svgEl('text',{x,y,'text-anchor':anchor,class:'vedic-cell-label'},String(h.rashi)+(h.isAscendant?' · '+(chartType==='Chandra'?extra.moon:c.lagna):'')));
   if(!lines.length)g.append(svgEl('text',{x,y:y+20,'text-anchor':anchor,class:'vedic-cell-bodies'},'—'));
   for(const [i,line]of lines.entries()){const label=svgEl('text',{x,y:y+20+i*20,'text-anchor':anchor,'data-occupants-house':h.houseNumber,class:'vedic-cell-bodies'});for(const [j,p]of line.entries()){if(j)label.append(document.createTextNode(' '));const span=svgEl('tspan',{},grahaCode(p.body,p.code,language));label.append(span);}grahaLabels.push(label);}
   g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select(h.houseNumber,chartType);}});svg.append(g);
  }
  svg.append(...grahaLabels);svg.addEventListener('click',event=>{const matrix=svg.getScreenCTM();if(!matrix)return;const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());for(const shape of svg.querySelectorAll('.vedic-chart-cell>polygon,.vedic-chart-cell>rect'))if(shape.isPointInFill(point)){select(Number(shape.parentNode.dataset.house),chartType);break;}});figure.append(svg);stage.append(figure); }
  const tableType=paired&&compare?'D1':type,tableModel=models[tableType],otherType=tableType==='D1'?'D9':'D1';
  const table=el('table'),caption=el('caption',c.grahas+' · '+(paired&&compare?'D1 / D9':tableType)),head=el('thead'),tr=el('tr');
  for(const name of [t.body,tableType+' / '+t.sign+' / '+(tableType==='D1'?c.degrees:c.source),tableType+' / '+t.house,...(options.positions?[r.star]:[]),...(paired?[otherType+' / '+t.sign+' / '+t.house]:[])]){const th=el('th',name);th.scope='col';tr.append(th);}head.append(tr);
  const body=el('tbody');for(const p of tableModel.planets){const row=el('tr');row.dataset.body=p.body;row.dataset.house=String(p.houseNumber);row.dataset.rashi=String(p.rashi);
   const th=el('th'),pick=el('button',bodyName(p.body,language));pick.type='button';pick.addEventListener('click',()=>selectGraha(p.body));th.append(pick);th.scope='row';const sign=el('td');sign.append(el('span',`${signName(p.rashi,language)} (${p.rashi})`),el('small',(tableType==='D1'?'':'D1 / ')+signDms(p.sourceLongitude)));row.append(th,sign,el('td',String(p.houseNumber)));const pos=options.positions?.find(v=>v.body===p.body);if(options.positions){const star=el('td');star.append(el('span',pos?nakshatraName(pos.nakshatra,language):'—'),el('small',pos?t.pada+' '+pos.pada:'—'));row.append(star);}if(paired){const other=models[otherType].planets.find(v=>v.body===p.body),cell=el('td');cell.append(el('span',signName(other.rashi,language)),el('small',t.house+' '+other.houseNumber));row.append(cell);}body.append(row);}
  const labels=[...head.querySelectorAll('th')].map(th=>th.textContent);for(const row of body.rows)for(let i=1;i<row.cells.length;i++)row.cells[i].dataset.label=labels[i];
  table.append(caption,head,body);tableRegion.replaceChildren(table);update();
 }
 render();return Object.freeze({setView(value){root.dataset.pane=value==='grahas'?'grahas':'chart';},destroy(){root.remove();}});
}
