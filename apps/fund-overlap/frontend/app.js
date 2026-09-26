'use strict';
const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = n => Number(n).toFixed(1) + '%';
const dateLabel = value => new Date(value).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
const short = name => name.replace('Parag Parikh ', '').replace(/ Fund$/, '');
let index, selected = [], excluded = new Set(), snapshots = new Map(), result, query = '', busy = false;
let searchFunds = null, searchMessage = '', searchPending = false, searchVersion = 0, searchTimer, nextOffset = null, searchFailed = false;
let basis = 'equity', filter = 'common', holdingQuery = '', sort = 'repeated';
const loadStates = new Map();
function holdingsStatus(f) {
  const state = loadStates.get(f.id), snapshot = snapshots.get(f.id);
  if (state?.error) return 'Could not load holdings';
  if (state?.loading) return 'Loading holdings…';
  if (!snapshot) return f.portfolioDate ? 'Dated snapshot available' : 'Holdings not checked';
  return [snapshot.cacheStatus === 'stale' ? 'Saved data · refresh unavailable' : 'Holdings loaded', snapshot.unresolvedHoldings?.length ? 'Partial coverage' : '', snapshot.source.publisher].filter(Boolean).join(' · ');
}
const system = matchMedia('(prefers-color-scheme: dark)');
function theme() {const value = $('#theme').value; SynapseTheme.write(value); document.documentElement.dataset.theme = value === 'system' ? (system.matches ? 'dark' : 'light') : value;}
$('#theme').value = SynapseTheme.read(); theme(); $('#theme').addEventListener('change', theme); system.addEventListener('change', theme);
function notice(message) {$('#notice').textContent = message; $('#notice').classList.add('show'); clearTimeout(notice.timer); notice.timer = setTimeout(() => $('#notice').classList.remove('show'), 5000);}
async function jsonFetch(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {const error = Error(data.error || 'Unable to load disclosure data'); error.status = response.status; throw error;}
  return data;
}
function key(i) {return `<span class="fund-key">${String.fromCharCode(65+i)}</span>`;}
function screen() {
  $('#main').innerHTML = `<section class="hero"><div class="hero-copy"><p class="eyebrow">FUND LENS / MUTUAL FUND OVERLAP ANALYZER</p><h1>More funds.<br><em>Different investments?</em></h1><p>Look beneath the fund names. Discover the equities they share, what makes each one different, and how their holdings fit together.</p><div class="pills"><span class="pill">Dated portfolio holdings</span><span class="pill">Calculated in your browser</span><span class="pill">No portfolio connection</span></div></div><div class="hero-art" aria-hidden="true"><svg viewBox="0 0 350 240"><path class="orbit-line" d="M15 120h320M175 12v210"/><circle class="orbit" cx="135" cy="112" r="81"/><circle class="orbit orbit-two" cx="215" cy="112" r="81"/><text class="art-label" x="102" y="116">FUND A</text><text class="art-label" x="225" y="116">FUND B</text><text class="art-center" x="166" y="118">∩</text><text class="art-label" x="120" y="225">SHARED HOLDINGS</text></svg><p>Different names. Sometimes the same companies.</p></div></section>
  <section class="workbench" aria-labelledby="select-title"><div class="section-head"><div><h2 id="select-title">Choose your funds</h2><p class="subtext">Compare 2–8 schemes. Search by name, category or fund house.</p></div><span class="step">01 / SELECT</span></div><div class="search-row"><label><span class="sr-only">Search funds</span><input id="fund-search" type="search" placeholder="Search any Indian mutual fund…" autocomplete="off"></label><button id="explore">Explore a comparison ↗</button></div><p id="search-status" role="status"></p><button id="retry-search" hidden>Retry fund search</button><div id="fund-grid" class="fund-grid"></div><button id="more-funds" hidden>Show more matches</button><div id="selected-funds" class="keys"></div><p class="coverage-line">Search the national MFapi catalogue across Indian fund houses, alongside five official PPFAS snapshots. Holdings come from Tickertape or Groww when verified. The catalogue includes historical schemes; a search result does not guarantee available equity holdings. Direct and regular plans share a portfolio. Debt, gold and fund-of-funds look-through are not available.</p><div class="selection"><div><strong id="selection-count"></strong><p>Only the selected snapshots are downloaded. No investment amounts needed.</p></div><div class="selection-actions"><button id="clear" class="text-button">Clear</button><button id="compare" class="primary">Compare funds →</button></div></div><p id="load-error" class="error" role="alert"></p></section>
  <section id="results" class="results" aria-live="polite"></section>
  <details class="methodology"><summary>How Fund Lens measures overlap</summary><p>Weighted overlap adds the smaller of each shared security’s weights. ISINs identify securities; names are display labels. Direct/regular plans and growth/distribution options are not counted as separate underlying portfolios.</p><ul><li><strong>Equity composition:</strong> each fund’s included equity holdings are scaled to 100%. This compares equity composition, not total fund exposure.</li><li><strong>Disclosed NAV weights:</strong> original published percentages are retained. A low-equity hybrid fund can have low NAV overlap even if its equity choices closely match another fund.</li><li>Included: positive-weight physical listed equities, including foreign shares and arbitrage legs. Excluded: cash, debt, derivatives, REIT/InvIT units and fund units. No hedge netting or fund look-through. Positions disclosed as less than 0.01% with a rounded zero are omitted.</li><li>Industry similarity uses each source’s industry classifications. Unknown classifications are excluded. Top-ten means the ten largest included equity positions, or all positions when fewer than ten exist.</li><li>Average overlap is an unweighted average of pairs. It is not a score for your personal portfolio. No buy, sell or redemption recommendations are made.</li></ul><p>Fund selections stay in browser memory. The server uses MFapi for the national catalogue and Tickertape or Groww for public holdings. No account details are sent to these sources. Verified reference data is saved for recovery during source outages. Share links contain public scheme IDs in the URL fragment; anyone can open them without signing in. Downloads identify individual public snapshots to the server. No login or financial account connection is required.</p></details><footer class="footer"><span>FUND LENS · SUSHANT SYNAPSE</span><span>Portfolio analytics, not personalized investment advice.</span></footer>`;
  $('#fund-search').value = query;
  // Keep the selection visible above changing search results, including on mobile.
  $('#selected-funds').setAttribute('role', 'region');
  $('#selected-funds').setAttribute('aria-label', 'Selected funds');
  $('#fund-search').closest('.search-row').before($('#selected-funds'));
  $('#clear').textContent = 'Clear selected funds';
  const dock = document.createElement('div'); dock.className = 'selection-dock';
  $('#fund-search').closest('.search-row').before(dock);
  dock.append($('.selection'), $('#selected-funds'));
  $('.selection p').textContent = 'Choose 2–8 funds. Your selection stays while you search.';
  const progress = document.createElement('div'); progress.id = 'fund-progress'; progress.setAttribute('role', 'status');
  $('#load-error').before(progress);
  $('#fund-search').oninput = e => {query = e.target.value; clearTimeout(searchTimer); searchVersion++; searchFunds = null; searchMessage = ''; searchFailed = false; nextOffset = null; searchPending = query.trim().length >= 2; renderFunds(); if (searchPending) searchTimer = setTimeout(() => searchLibrary(), 350);};
  $('#more-funds').onclick = () => searchLibrary(nextOffset);
  $('#retry-search').onclick = () => searchLibrary();
  $('#compare').onclick = () => compare(true);
  $('#clear').onclick = () => {selected = []; changed();};
  $('#explore').onclick = () => {if (selected.length) return; selected = ['ppfas-flexi-cap', 'ppfas-elss', 'ppfas-large-cap'].filter(id => index.funds.some(f => f.id === id)); changed(); compare(true);};
  renderFunds();
}
async function searchLibrary(offset = 0) {
  const version = ++searchVersion, term = query.trim();
  searchPending = true; searchFailed = false; searchMessage = ''; renderFunds();
  try {
    const data = await jsonFetch('/api/fund-overlap/search?q=' + encodeURIComponent(term) + '&offset=' + offset);
    if (version !== searchVersion) return;
    for (const fund of data.funds) if (!index.funds.some(f => f.id === fund.id)) index.funds.push(fund);
    const combined = offset ? [...(searchFunds || []), ...data.funds] : data.funds;
    searchFunds = [...new Map(combined.map(f => [f.id, index.funds.find(entry => entry.id === f.id)])).values()];
    nextOffset = data.nextOffset; searchFailed = !!data.warning; searchMessage = data.warning || (searchFunds.length + ' of ' + (data.total ?? searchFunds.length) + ' matching portfolios shown.');
  } catch (error) {if (version === searchVersion) {searchFailed = true; searchMessage = error.message + ' Try your search again.';}}
  finally {if (version === searchVersion) {searchPending = false; renderFunds();}}
}
function renderFunds() {
  const needle = query.trim().toLowerCase();
  const funds = searchFunds || index.funds.filter(f => !f.provider && `${f.name} ${f.amc} ${f.category}`.toLowerCase().includes(needle));
  $('#search-status').textContent = searchPending ? 'Searching Indian mutual funds…' : searchMessage || (needle.length === 1 ? 'Type at least 2 characters to search all fund houses.' : 'Search by fund name, fund house or category.');
  $('#fund-grid').innerHTML = funds.length ? funds.map(f => `<article class="fund-card ${selected.includes(f.id)?'selected':''}"><span class="category">${esc(f.category)}</span><h3>${esc(f.name)}</h3><p>${esc(f.amc)}${f.holdingsCount ? ' · ' + f.holdingsCount + ' equities' : ''}</p><p>${f.portfolioDate ? dateLabel(f.portfolioDate) + ' · ' + pct(f.includedNavWeight) + ' NAV included' : esc(holdingsStatus(f))}</p><button data-select="${esc(f.id)}" aria-pressed="${selected.includes(f.id)}" aria-label="${selected.includes(f.id)?'Remove':'Add'} ${esc(f.name)}" ${busy||(!selected.includes(f.id)&&selected.length===8)?'disabled':''}>${selected.includes(f.id)?'✓ Selected':'+ Add fund'}</button></article>`).join('') : `<p class="empty">${searchPending ? 'Looking for matching funds…' : 'No matching funds found. Try a shorter name or another fund house.'}</p>`;
  $('#selected-funds').innerHTML = selected.map(id => `<button class="text-button" data-select="${esc(id)}" aria-label="Remove selected ${esc(index.funds.find(f=>f.id===id).name)}" ${busy?'disabled':''}>${esc(index.funds.find(f=>f.id===id).name)} ×</button>`).join('');
  $('#retry-search').hidden = !searchFailed;
  $('#selected-funds').hidden = selected.length === 0;
  $('#explore').hidden = selected.length > 0;
  $('#more-funds').hidden = nextOffset === null; $('#more-funds').disabled = searchPending;
  $('#selection-count').textContent = `${selected.length} of 8 funds selected`;
  $('#compare').disabled = busy || selected.length < 2;
  $('#compare').textContent = busy ? 'Loading and verifying holdings…' : 'Compare funds →';
  $('#clear').disabled = busy || !selected.length; $('#explore').disabled = busy;
  document.querySelectorAll('.fund-card').forEach((card, i) => {
    const fund = funds[i];
    card.querySelector('p:last-of-type').textContent = (fund.portfolioDate ? dateLabel(fund.portfolioDate) + ' · ' + pct(fund.includedNavWeight) + ' NAV included · ' : '') + holdingsStatus(fund);
  });
  $('#fund-progress').innerHTML = selected.filter(id => loadStates.has(id)).map(id => {
    const fund = index.funds.find(f => f.id === id), state = loadStates.get(id);
    return `<p><strong>${esc(fund.name)}</strong> <span>${esc(holdingsStatus(fund))}</span>${state.error ? `<span class="error">${esc(state.error)}</span>` : ''}</p>`;
  }).join('');
}
function changed() {
  excluded.clear(); result = null; $('#results').innerHTML = ''; $('#load-error').textContent = ''; renderFunds();
  history.replaceState(null, '', location.pathname);
}
async function compare(scroll = false) {
  if (busy || selected.length < 2) return;
  busy = true; $('#load-error').textContent = ''; renderFunds();
  try {
    // Each comparison revalidates permissions, including when the immutable data is cached.
    const outcomes = await Promise.allSettled(selected.map(async id => {
      const entry = index.funds.find(f => f.id === id);
      loadStates.set(id, {loading:true}); renderFunds();
      try {
      let data;
      try {data = await jsonFetch(entry.holdingsPath);} catch (error) {throw Error(entry.name + ': ' + error.message);}
      if (data.schemeId !== id || entry.portfolioDate && !entry.provider && data.portfolioDate !== entry.portfolioDate) throw Error('Disclosure metadata mismatch. Reload the fund library.');
      FundOverlap.normalize(data.holdings); snapshots.set(id, data);
      Object.assign(entry, {name:data.name, amc:data.amc, category:data.category, portfolioDate:data.portfolioDate, includedNavWeight:data.includedNavWeight, holdingsCount:data.holdings.length});
      loadStates.set(id, {loading:false});
      } catch (error) {loadStates.set(id, {error:error.message}); throw error;}
      finally {renderFunds();}
    }));
    const failed = outcomes.find(outcome => outcome.status === 'rejected');
    if (failed) throw failed.reason;
    calculate();
    if (scroll) $('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  } catch (error) {result = null; $('#results').innerHTML = ''; $('#load-error').textContent = error.message + ' Your selection is unchanged. Try again or reload the library.';}
  finally {busy = false; renderFunds();}
}
function calculate() {
  const active = selected.filter(id => !excluded.has(id));
  result = FundOverlap.analyze(active.map(id => snapshots.get(id)), basis);
  renderResults();
}
function renderResults() {
  const r = result, best = r.pairs[0];
  const baseline = excluded.size ? FundOverlap.analyze(selected.map(id => snapshots.get(id)), basis) : null;
  const basisText = basis === 'equity' ? 'of included equity composition' : 'percentage points of disclosed NAV';
  $('#results').innerHTML = `<div class="result-heading"><div><p class="eyebrow">02 / UNDERSTAND THE OVERLAP</p><h2>Your funds, under the lens.</h2><p>${r.funds.length} active funds · ${r.pairs.length} pairs · Physical equities only</p></div><div class="result-tools"><button id="share">Copy comparison link</button><button id="export">Export holdings CSV</button><button id="print">Print report</button></div></div>
  <div class="basis-row"><label for="basis">Weight basis</label><select id="basis"><option value="equity" ${basis==='equity'?'selected':''}>Equity composition (scaled to 100%)</option><option value="nav" ${basis==='nav'?'selected':''}>Disclosed NAV weights</option></select><p>${basis==='equity'?'Compare the equity choices independently of how much each fund holds in cash or debt.':'Compare the original disclosed equity weights as percentages of each fund’s total NAV.'}</p></div>
  <div class="notice-inline">This is gross physical equity overlap. Cash, debt, derivatives and fund/REIT units are excluded; hedges are not netted. Review the included NAV coverage below, especially for hybrid funds.</div>
  ${r.warnings.map(w=>`<p class="notice-inline">${esc(w)}</p>`).join('')}
  <div class="stats"><article class="stat"><small>AVERAGE PAIR OVERLAP</small><strong class="number">${pct(r.averageOverlap)}</strong><p>${basisText}</p></article><article class="stat"><small>DISTINCT EQUITIES</small><strong class="number">${r.distinct}</strong><p>Across the active comparison</p></article><article class="stat"><small>REPEATED EQUITIES</small><strong class="number">${r.repeated}</strong><p>Held by two or more funds</p></article><article class="stat"><small>IN EVERY FUND</small><strong class="number">${r.allCommon}</strong><p>Common to all ${r.funds.length} funds</p></article></div>
  <section class="panel"><div class="panel-heading"><h2>The pairwise picture</h2><small>More colour = more shared weight</small></div><p>Most similar: <strong>${esc(short(r.funds[best.i].name))} + ${esc(short(r.funds[best.j].name))}</strong>, with ${pct(best.overlap)} weighted overlap.</p><div class="keys">${r.funds.map((f,i)=>`<span>${key(i)}${esc(short(f.name))}</span>`).join('')}</div><div class="table-scroll"><table class="matrix"><caption class="sr-only">Weighted overlap matrix, ${basisText}</caption><thead><tr><th scope="col">Fund</th>${r.funds.map((f,i)=>`<th scope="col" title="${esc(f.name)}">${key(i)}</th>`).join('')}</tr></thead><tbody>${r.funds.map((f,i)=>`<tr><th scope="row">${key(i)}${esc(short(f.name))}</th>${r.funds.map((_,j)=>{const value=i===j?(basis==='equity'?100:f.total):r.pairs.find(p=>(p.i===i&&p.j===j)||(p.j===i&&p.i===j)).overlap;return `<td><span class="heat-${Math.min(5,Math.floor(value/20))}">${pct(value)}</span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div><div class="legend"><span class="legend-swatches">0% ${[0,1,2,3,4,5].map(i=>`<i class="heat-${i}"></i>`).join('')} 100%</span><span>Diagonal = ${basis==='equity'?'100% of that fund’s included equities':'that fund’s included NAV weight'}</span></div><div class="pair-list">${r.pairs.map(p=>`<article class="pair"><div><strong>${esc(short(r.funds[p.i].name))} × ${esc(short(r.funds[p.j].name))}</strong><b>${pct(p.overlap)}</b></div><meter min="0" max="100" value="${p.overlap}" aria-label="Weighted overlap"></meter><p>${p.common} common equities · ${p.topCommon} shared among top ${p.topSizes[0]}/${p.topSizes[1]} · ${pct(p.sectorOverlap)} industry overlap</p></article>`).join('')}</div></section>
  <section class="panel"><div class="panel-heading"><h2>The holdings behind the numbers</h2><small>Weights: ${basis==='equity'?'% of included equities':'% of fund NAV'}</small></div><p>Repeated holdings are counted once per fund. A dash means the security is absent from that fund’s included equities.</p><div class="holdings-toolbar"><select id="holding-filter" aria-label="Holdings view"><option value="common">Repeated holdings</option><option value="all-common">In every fund</option><option value="unique">Unique holdings</option><option value="all">All holdings</option></select><input type="search" id="holding-search" aria-label="Search holdings" placeholder="Search company, ISIN or industry…"><select id="holding-sort" aria-label="Sort holdings"><option value="repeated">Most repeated</option><option value="weight">Highest average weight</option><option value="name">Company A–Z</option></select></div><div id="holdings-table"></div></section>
  <section class="panel"><h2>What each fund adds</h2><p>Equities held by just one active fund, and their combined weight.</p><div class="contributions">${r.contributions.map((c,i)=>`<article class="contribution"><h3>${key(i)}${esc(short(r.funds[i].name))}</h3><strong>${c.count} <small>unique equities</small></strong><p>${pct(c.weight)} ${basis==='equity'?'of included equity':'of NAV'} · ${pct(c.navWeight)} of fund NAV</p></article>`).join('')}</div></section>
  <section class="panel"><h2>Industry exposure</h2><p>Same industries can produce similarity even when the companies differ. These are each source’s published classifications; labels may differ across sources.</p><div class="table-scroll"><table><caption class="sr-only">Industry weights by fund</caption><thead><tr><th scope="col">Industry</th>${r.funds.map((f,i)=>`<th class="num" scope="col" title="${esc(f.name)}">${key(i)}</th>`).join('')}</tr></thead><tbody>${[...new Set(r.funds.flatMap(f=>[...f.sectors.keys()]))].sort((a,b)=>r.funds.reduce((s,f)=>s+(f.sectors.get(b)||0)-(f.sectors.get(a)||0),0)).map(sector=>`<tr><th scope="row">${esc(sector)}</th>${r.funds.map(f=>`<td class="num">${pct(f.sectors.get(sector)||0)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
  <section class="panel simulation"><h2>Explore a different combination</h2><p>Temporarily exclude a fund to see how the comparison changes. This is a what-if calculation, not a suggestion to sell. Keep at least two funds active.</p><div class="sim-options">${selected.map(id=>`<label><input type="checkbox" data-simulate="${esc(id)}" ${excluded.has(id)?'':'checked'}>${esc(short(snapshots.get(id).name))}</label>`).join('')}</div>${baseline?`<p class="notice-inline">Compared with all ${selected.length} selected funds: distinct equities ${baseline.distinct} → ${r.distinct}; average pair overlap ${pct(baseline.averageOverlap)} → ${pct(r.averageOverlap)}. <button id="reset-simulation" class="text-button">Restore all funds</button></p>`:''}</section>
  <section class="panel"><h2>Know the data you are comparing</h2><p>Monthly portfolio snapshots, not live holdings. Each fund lists its publisher, reporting date and included coverage. Tickertape and Groww are secondary sources; classifications may differ from AMC disclosures.</p><div class="source-list">${r.funds.map(f=>`<article class="source"><div><strong>${esc(f.name)}</strong><p>${f.holdings.length} included equities · ${pct(f.total)} of NAV included · about ${pct(Math.max(0,100-f.total))} excluded</p>${f.unresolvedHoldings?.length ? `<p class="notice-inline">Partial coverage: ${f.unresolvedHoldings.length} source equities (${pct(f.unresolvedNavWeight)} of NAV) have no verifiable identifier and are excluded: ${f.unresolvedHoldings.map(h=>esc(h.name)+' ('+pct(h.weight)+')').join(', ')}.</p>` : ''}<p>${f.belowPrecisionCount||0} positions omitted at disclosed rounding precision. Physical arbitrage positions may be hedged.</p><a href="${esc(f.source.url)}" target="_blank" rel="noopener noreferrer">${esc(f.source.publisher)} ${f.source.kind === 'aggregator' ? 'fund data' : 'spreadsheet'} ↗</a> · <a href="${esc(f.source.indexUrl)}" target="_blank" rel="noopener noreferrer">${f.source.kind === 'aggregator' ? 'Provider fund catalogue' : 'Disclosure archive'} ↗</a><p><code>Source SHA-256: ${esc(f.source.sha256)}</code></p></div><div class="date"><strong>${dateLabel(f.portfolioDate)}</strong><p>Portfolio as of · ${f.ageDays} days old</p><p>Retrieved ${dateLabel(f.source.fetchedAt)}</p>${f.source.dateBasis ? `<p>${esc(f.source.dateBasis)}</p>` : ''}</div></article>`).join('')}</div></section>`;
  $('#basis').onchange = e => {basis = e.target.value; calculate();};
  $('#share').onclick = share;
  $('#export').onclick = exportCsv;
  $('#print').onclick = () => window.print();
  const sections = [...$('#results').querySelectorAll(':scope > .panel')];
  const destinations = [['overview','Overview', $('.stats')], ['holdings','Holdings', sections[1]], ['contributions','Contributions', sections[2]], ['industries','Industries', sections[3]], ['simulation','Try combinations', sections[4]], ['sources','Sources', sections[5]]];
  const nav = document.createElement('nav'); nav.className = 'results-nav'; nav.setAttribute('aria-label', 'Comparison sections');
  nav.innerHTML = '<button id="edit-funds">Edit funds ↑</button>' + destinations.map(([id,label]) => `<button data-section="${id}">${label}</button>`).join('');
  $('.result-heading').after(nav);
  for (const [id,, section] of destinations) {
    section.id = 'result-' + id; section.tabIndex = -1;
    nav.querySelector(`[data-section="${id}"]`).onclick = () => {section.scrollIntoView({block:'start'}); section.focus({preventScroll:true});};
  }
  $('#edit-funds').onclick = () => {$('#fund-search').focus(); $('#fund-search').scrollIntoView({block:'center'});};
  sections[5].querySelector(':scope > p').textContent = 'Monthly portfolio snapshots. Tickertape and Groww are secondary sources; classifications may differ from AMC disclosures. Check each fund’s reporting date and included coverage.';
  document.querySelectorAll('.source code').forEach(code => {
    const details = document.createElement('details'); details.className = 'source-details';
    const summary = document.createElement('summary'); summary.textContent = 'Source verification details';
    code.parentElement.before(details); details.append(summary, code.parentElement);
  });
  $('#holding-filter').value = filter; $('#holding-search').value = holdingQuery; $('#holding-sort').value = sort;
  $('#holding-filter').onchange = e => {filter = e.target.value; renderHoldings();};
  $('#holding-search').oninput = e => {holdingQuery = e.target.value; renderHoldings();};
  $('#holding-sort').onchange = e => {sort = e.target.value; renderHoldings();};
  if ($('#reset-simulation')) $('#reset-simulation').onclick = () => {excluded.clear(); calculate();};
  renderHoldings();
  const industryTable = $('#result-industries .table-scroll');
  industryTable.tabIndex = 0; industryTable.setAttribute('role', 'region'); industryTable.setAttribute('aria-label', 'Scrollable industry weights');

}
function filteredHoldings() {
  const needle = holdingQuery.trim().toLowerCase();
  return result.holdings.filter(h => (filter==='all'||filter==='unique'&&h.count===1||filter==='all-common'&&h.count===result.funds.length||filter==='common'&&h.count>1) && `${h.name} ${h.isin} ${h.sector}`.toLowerCase().includes(needle)).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='weight'?b.averageWeight-a.averageWeight:b.count-a.count||b.averageWeight-a.averageWeight);
}
function renderHoldings() {
  const rows = filteredHoldings();
  $('#holdings-table').innerHTML = `<p class="muted">${rows.length} matching equities</p>` + (rows.length ? `<div class="table-scroll"><table><caption class="sr-only">Filtered equity holdings</caption><thead><tr><th scope="col">Security / ISIN</th><th scope="col">Industry</th><th scope="col" class="num">In funds</th>${result.funds.map((f,i)=>`<th scope="col" class="num" title="${esc(f.name)}">${key(i)}</th>`).join('')}</tr></thead><tbody>${rows.map(h=>`<tr><th scope="row" class="security">${esc(h.name)}<small>${esc(h.isin)}</small></th><td>${esc(h.sector)}</td><td class="num">${h.count} / ${result.funds.length}</td>${h.weights.map(w=>`<td class="num">${w?pct(w):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">No holdings match this view. Try another filter or search.</p>');
}
async function share() {
  const fragment = new URLSearchParams({funds:selected.filter(id=>!excluded.has(id)).join(','),basis});
  const url = location.origin + location.pathname + '#' + fragment;
  history.replaceState(null, '', url);
  try {await navigator.clipboard.writeText(url); notice('Comparison link copied. Recipients need Fund Lens access.');}
  catch {notice('The comparison is now in your address bar. Copy that URL to share.');}
}
function exportCsv() {
  const safe = v => '"' + String(v ?? '').replace(/^[=+@-]/, "'$&").replace(/"/g, '""') + '"';
  const rows = [['Fund Lens holdings report'], ['Weight basis', basis], ['Generated', new Date().toISOString()], ...result.funds.map(f=>['Fund', f.name, 'Portfolio date',f.portfolioDate,'Included NAV %',f.total,'Source',f.source.url,'Unresolved equity NAV %',f.unresolvedNavWeight||0]), ...result.funds.flatMap(f=>(f.unresolvedHoldings||[]).map(h=>['Excluded unresolved equity',f.name,h.name,'NAV %',h.weight])), [], ['Security','ISIN','Industry','Fund count',...result.funds.map(f=>f.name)], ...filteredHoldings().map(h=>[h.name,h.isin,h.sector,h.count,...h.weights])];
  const url = URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(safe).join(',')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'fund-lens-holdings.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click', e => {
  const button = e.target.closest('[data-select]'); if (!button || busy) return;
  const id = button.dataset.select;
  if (selected.includes(id)) selected = selected.filter(x=>x!==id);
  else if (selected.length < 8) selected.push(id);
  changed();
});
document.addEventListener('change', e => {
  const id = e.target.dataset.simulate; if (!id) return;
  if (e.target.checked) excluded.delete(id);
  else if (selected.length-excluded.size <= 2) {e.target.checked = true; notice('Keep at least two funds in the comparison.'); return;}
  else excluded.add(id);
  calculate();
});
function readShare() {
  const params = new URLSearchParams(location.hash.slice(1));
  const raw = params.get('funds'); if (!raw) return;
  const ids = raw.split(',');
  if (ids.length<2||ids.length>8||new Set(ids).size!==ids.length||ids.some(id=>(!index.funds.some(f=>f.id===id)&&!/^groww-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&!/^amfi-\d{5,8}$/.test(id))||id.length>166)) {notice('This comparison link contains unavailable or duplicate funds. Choose funds from the library.'); return;}
  for (const id of ids) if (!index.funds.some(f=>f.id===id)) { const national = id.startsWith('amfi-'); index.funds.push({id,name:national?'AMFI scheme '+id.slice(5):id.slice(6).replaceAll('-', ' '),amc:national?'Indian mutual fund':'Groww',category:'Mutual fund',provider:national?'MFapi':'Groww',holdingsPath:national?'/api/fund-overlap/scheme/'+id.slice(5):'/api/fund-overlap/remote/'+id.slice(6)}); }
  selected = ids; basis = params.get('basis')==='nav'?'nav':'equity'; excluded.clear(); renderFunds(); compare(false);
}
async function boot() {
  try {index = await jsonFetch('/api/fund-overlap/fund-index.json'); screen(); readShare();}
  catch (error) {
    const heading = error.status===401?'Sign in to open Fund Lens':error.status===403?'Fund Lens access is needed':'The fund library is unavailable';
    $('#main').innerHTML = `<section class="gate"><p class="eyebrow">FUND LENS</p><h1>${heading}</h1><p>${error.status===401?'Use your existing Sushant Synapse account, then open Fund Lens from the app catalogue.':error.status===403?'Ask your platform owner to enable Fund Lens in Team access.':esc(error.message)}</p><a href="/">Go to the platform →</a>${!error.status?'<p><button id="retry">Retry loading</button></p>':''}</section>`;
    if ($('#retry')) $('#retry').onclick = boot;
  }
}
window.addEventListener('hashchange', () => { if (index && $('#fund-grid')) readShare(); });
boot();
