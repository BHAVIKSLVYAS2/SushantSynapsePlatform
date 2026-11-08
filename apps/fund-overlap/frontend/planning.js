(function(){
 'use strict';
 const defaults={retirement:{currentAge:30,retirementAge:60,planUntil:85,expense:40000,savings:500000,inflation:6,beforeReturn:10,afterReturn:7},sip:{contribution:5000,years:15,returnRate:10,inflation:6,stepUp:0},goal:{cost:1000000,years:10,savings:100000,returnRate:8,inflation:6}};
 const labels={currentAge:'age',retirementAge:'retireAge',planUntil:'planUntil',expense:'expense',savings:'savings',inflation:'inflation',beforeReturn:'beforeReturn',afterReturn:'afterReturn',contribution:'contribution',years:'years',returnRate:'returnRate',stepUp:'stepUp',cost:'cost'};
 const values=structuredClone(defaults);let kind='retirement',last,host,planningActive=false;
 const t=k=>{const language=window.SynapseLanguage?.get()||'en';return (FundPlanningCopy[k]||[k])[{en:0,hi:1,gu:2}[language]||0];};
 const money=n=>n===null?'—':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
 function render(){
  host.innerHTML=`<header><p class="eyebrow">FUND LENS / PLANNING</p><h1>${t('planning')}</h1><p>${t('intro')}</p><p class="subtext">${t('local')}</p></header><div class="planner-tabs" role="group" aria-label="Choose calculator">${Object.keys(defaults).map(k=>`<button type="button" data-tool="${k}" aria-pressed="${kind===k}">${t(k)}</button>`).join('')}</div><div class="planner-layout"><form id="planner-form"><h2>${t(kind)}</h2><div class="planner-fields">${Object.entries(values[kind]).map(([key,value])=>`<label>${t(labels[key])}<input name="${key}" type="number" value="${value}" step="${/Age|Until|years/.test(key)?'1':'any'}" required></label>`).join('')}</div><button class="text-button" type="button" id="planner-reset">${t('reset')}</button></form><section id="planner-result" aria-label="Calculation result" aria-live="polite"></section></div><p class="subtext">${t('illustration')}</p><details><summary>${t('model')}</summary><p>${t(kind==='retirement'?'retirementModel':kind==='sip'?'savingModel':'goalModel')}</p><p>Default rates are editable examples, not forecasts. <a href="https://investor.sebi.gov.in/calculators/financial_goal_planner.html" target="_blank" rel="noopener noreferrer">SEBI investor education ↗</a></p></details>`;
  host.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{kind=b.dataset.tool;render();});
  host.querySelector('form').oninput=e=>{if(e.target.name)values[kind][e.target.name]=e.target.value;calculate();};
  host.querySelector('form').onsubmit=e=>e.preventDefault();
  host.querySelector('#planner-reset').onclick=()=>{values[kind]={...defaults[kind]};render();};calculate();
 }
 function calculate(){
  const out=host.querySelector('#planner-result');last=null;
  try{
   const r=FundPlanningEngine[kind](values[kind]);
   const entries=kind==='retirement'?[['corpus',r.corpus],['monthlySaving',r.monthlySaving],['futureExpense',r.monthlyExpense],['futureSavings',r.futureSavings]]:kind==='sip'?[['projected',r.value],['invested',r.invested],['growth',r.growth],['todayValue',r.todayValue]]:[['target',r.target],['monthlySaving',r.monthlySaving],['futureSavings',r.futureSavings],['shortfall',r.shortfall]];
   last=[['Fund Lens',t(kind)],...Object.entries(values[kind]).map(([k,v])=>[t(labels[k]),v]),...entries.map(([k,v])=>[t(k),money(v)]),[t('model'),t(kind==='retirement'?'retirementModel':kind==='sip'?'savingModel':'goalModel')],[t('illustration')]];
   out.innerHTML=`<div class="planner-numbers">${entries.map(([k,v],i)=>`<div class="${i===0?'planner-primary':''}"><span>${t(k)}</span><strong>${money(v)}</strong></div>`).join('')}</div>${r.monthlySaving===null?`<p>${t('noTime')}</p>`:r.monthlySaving===0?`<p>${t('covered')}</p>`:''}<div class="planner-actions"><button type="button" id="planner-copy">${t('copy')}</button><button type="button" id="planner-download">${t('download')}</button></div><p id="planner-status" role="status"></p>${r.rows?`<details><summary>${t('timeline')}</summary><div class="table-wrap"><table><thead><tr><th>${t('year')}</th><th>${t('invested')}</th><th>${t('projected')}</th></tr></thead><tbody>${r.rows.map(row=>`<tr><td>${row.year}</td><td>${money(row.invested)}</td><td>${money(row.value)}</td></tr>`).join('')}</tbody></table></div></details>`:''}`;
   host.querySelector('#planner-copy').onclick=async()=>{try{await navigator.clipboard.writeText(last.map(row=>row.join(': ')).join('\n'));host.querySelector('#planner-status').textContent=t('copied');}catch{host.querySelector('#planner-status').textContent='Copy unavailable. Download the calculation instead.';}};
   host.querySelector('#planner-download').onclick=()=>{const rows=[...last,...(r.rows?[[],['Year','Invested','Future value','Today’s buying power'],...r.rows.map(row=>[row.year,row.invested,row.value,row.todayValue])]:[])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`fund-lens-${kind}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }catch(error){out.innerHTML='';const p=document.createElement('p');p.className='error';p.setAttribute('role','alert');p.textContent=t(error.message);out.append(p);}
 }
 window.mountFundPlanning=function(){
  if(document.querySelector('#fund-workspace-nav'))return;
  const main=document.querySelector('#main'),compare=document.createElement('div');compare.id='comparison-view';while(main.firstChild)compare.append(main.firstChild);
  const nav=document.createElement('nav');nav.id='fund-workspace-nav';nav.className='planner-tabs';nav.setAttribute('aria-label','Fund Lens tools');nav.innerHTML='<button type="button" aria-pressed="true">Compare funds</button><button type="button" aria-pressed="false">Plan money</button>';
  host=document.createElement('section');host.id='planning-view';host.hidden=true;host.setAttribute('translate','no');main.append(nav,compare,host);render();
  [...nav.children].forEach((b,i)=>b.onclick=()=>{planningActive=!!i;compare.hidden=!!i;host.hidden=!i;[...nav.children].forEach((item,j)=>item.setAttribute('aria-pressed',String(i===j)));});
  if(planningActive)nav.children[1].click();
 };
 window.addEventListener('synapse-language-change',()=>{if(host?.isConnected)render();});
})();
