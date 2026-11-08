(function(){'use strict';
 window.simplifyFundSelection=function(){
  const source=document.querySelector('.library-switch');source.hidden=true;
  document.querySelector('#library-description').textContent='Search saved official fund-house disclosures. No competitor lookup. Some snapshots may be older; dates stay visible.';
  document.querySelector('.coverage-line').textContent='This view searches saved official disclosures only. It does not contact competitor data services. Portfolios are dated snapshots, not live holdings. Direct/Regular plans share a holdings portfolio; their performance must be compared separately using exact-plan NAVs. Debt, cash, gold and fund-of-funds look-through are not included.';
  document.querySelector('.methodology').lastElementChild.textContent='Selections remain in this tab. The comparison uses saved official fund-house disclosures with reporting dates and source links. No personal investment figures or financial accounts are required. Historical provider-backed API routes remain for compatibility but the default search does not use them. Imported performance files are calculated on this device and are not uploaded or included in comparison share links.';
  const browse=document.createElement('button');browse.id='browse-official';browse.type='button';browse.className='text-button';browse.textContent='Browse official library';document.querySelector('#search-status').after(browse);browse.onclick=()=>{browseLibrary=!browseLibrary;browse.textContent=browseLibrary?'Hide library':'Browse official library';renderFunds();};
 };
 window.simplifyFundRows=function(){
  if(libraryView==='official'){
   document.querySelector('#library-description').textContent='Search saved official disclosures. No external lookup. Reporting dates and incomplete coverage remain visible.';
   const total=index.funds.filter(f=>isOfficial(f)&&matchesLibrary(f,query.trim().toLowerCase())).length;
   document.querySelector('#search-status').textContent=query.trim()||browseLibrary?`${document.querySelectorAll('.fund-card').length} of ${total} official portfolios shown. Select at least two to compare.`:'Search for your first fund, then add another. Or browse the official library.';
   if(!query.trim()&&!browseLibrary){document.querySelector('#fund-grid').innerHTML='';document.querySelector('#more-funds').hidden=true;}
  }
  const selection=document.querySelector('#selected-funds');if(selection){const notes=[...selection.querySelectorAll(':scope > p')];if(notes.length){const details=document.createElement('details');details.className='selection-data';const summary=document.createElement('summary');summary.textContent='Selected fund dates and coverage';selection.append(details);details.append(summary,...notes);}}
  const progress=document.querySelector('#fund-progress');if(progress)progress.hidden=!busy&&!progress.querySelector('.error');
  for(const card of document.querySelectorAll('.fund-card')){
   const paragraphs=[...card.querySelectorAll(':scope > p:not(.fund-data-label)')];if(paragraphs.length<2)continue;
   const metadata=document.createElement('details');metadata.className='fund-row-details';const summary=document.createElement('summary');summary.textContent='Holdings details';metadata.append(summary);
   const category=card.querySelector('.category');if(category)metadata.append(category);metadata.append(paragraphs[0]);
   const date=paragraphs[1],full=document.createElement('p');full.textContent=date.textContent;metadata.append(full);
   const fund=index.funds.find(f=>f.id===card.querySelector('[data-select]').dataset.select);
   if(fund?.portfolioDate)date.textContent=dateLabel(fund.portfolioDate);
   card.append(metadata);
  }
 };
 window.simplifyFundResults=function(r){
  const root=document.querySelector('#results'),heading=root.querySelector('.result-heading');
  const details=document.createElement('details');details.id='comparison-details';details.className='comparison-details';const title=document.createElement('summary');title.textContent='View details — holdings, industries, sources and calculation settings';details.append(title);
  for(const node of [...root.children])if(node!==heading&&!node.classList.contains('notice-inline'))details.append(node);
  root.append(details);
  const simple=document.createElement('section');simple.id='simple-summary';simple.className='simple-summary';
  simple.innerHTML=`<h2>${r.funds.length===2?'What these two funds share':'Overlap between your funds'}</h2>${r.funds.length===2?`<p class="overlap-answer"><strong>${pct(r.pairs[0].overlap)}</strong> ${basis==='nav'?'shared percentage points of NAV':'shared equity weight'} · ${r.pairs[0].common} common companies</p>`:`<p>${r.funds.length} funds compared on included equity holdings. Each pair has its own overlap; no personal portfolio score is implied.</p>`}<p>Equity composition is scaled to 100% by default. ${basis==='nav'?'You selected original disclosed NAV weights in calculation settings.':''} Overlap measures shared holdings, not fund quality or future performance.</p><div class="simple-pairs">${r.pairs.map(p=>`<article><span>${esc(r.funds[p.i].name)}<br>and ${esc(r.funds[p.j].name)}</span><strong>${pct(p.overlap)}</strong><small>${p.common} shared companies</small></article>`).join('')}</div><div class="freshness-list">${r.funds.map(f=>`<p><strong>${esc(f.name)}</strong> · ${dateLabel(f.portfolioDate)} · ${pct(f.total)} of NAV included</p>`).join('')}</div><div class="planner-tabs" role="group" aria-label="Company comparison"><button type="button" data-company-view="shared" aria-pressed="true">Shared companies</button><button type="button" data-company-view="different" aria-pressed="false">What’s different</button></div><div id="simple-companies"></div><p class="subtext">These are holdings snapshots. For returns, open Fund performance and import exact-plan NAV history.</p>`;
  heading.after(simple);
  if(r.funds.length===2)simple.querySelector('.simple-pairs').remove();
  const show=view=>{const rows=r.holdings.filter(h=>view==='shared'?h.count>1:h.count===1).slice(0,10);simple.querySelector('#simple-companies').innerHTML=`<p>${view==='shared'?'Up to ten companies held by two or more selected funds.':'Up to ten companies held by just one selected fund.'} Weights use the selected calculation basis.</p><div class="table-scroll"><table><thead><tr><th>Company</th>${r.funds.map(f=>`<th>${esc(short(f.name))}</th>`).join('')}</tr></thead><tbody>${rows.map(h=>`<tr><th data-language-preserve>${esc(h.name)}</th>${h.weights.map(w=>`<td>${w?pct(w):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length?'':'<p>No companies in this view.</p>'}`;simple.querySelectorAll('[data-company-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.companyView===view)));};
  simple.querySelectorAll('[data-company-view]').forEach(b=>b.onclick=()=>show(b.dataset.companyView));show('shared');
 };
})();
