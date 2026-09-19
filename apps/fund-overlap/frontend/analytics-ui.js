(function() {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const percent = n => Number(n).toFixed(2)+'%';
  const $ = s => document.querySelector(s);
  let chosen = [], histories = [], version = 0, loading = false;
  async function request(path, options) {
    const response = await fetch('/api/fund-overlap/'+path, options), data = await response.json();
    if (!response.ok) throw Error(data.error || 'Request failed. Please retry.');
    return data;
  }
  function selection() {
    $('#plan-selection').innerHTML = chosen.map(p => `<button data-remove-plan="${p.code}" ${loading?'disabled':''}>${esc(p.name)} ×</button>`).join('');
    $('#load-performance').disabled = loading || !chosen.length;
    $('#load-performance').textContent = loading ? 'Loading NAV history…' : 'Compare performance';
    document.querySelectorAll('[data-add-plan]').forEach(b => {b.disabled = loading || chosen.length >= 4 || chosen.some(p => p.code === b.dataset.addPlan);});
    if ($('#save-watchlist')) $('#save-watchlist').disabled = loading || !chosen.length || saving;
    document.querySelectorAll('[data-open-watchlist]').forEach(b => {b.disabled = loading;});
  }
  function clearAnalytics() {for (const id of ['performance-output','risk-output','rolling-panel','sip-panel']) $('#'+id).innerHTML = '';}
  function invalidate() {histories = []; clearAnalytics(); selection();}
  async function search() {
    const q = $('#plan-query').value.trim(), current = ++version;
    if (q.length < 2) {$('#plan-matches').innerHTML = ''; $('#plan-status').textContent = 'Enter at least two characters.'; return;}
    $('#plan-status').textContent = 'Finding exact plans…'; $('#plan-matches').innerHTML = '';
    try {
      const data = await request('plans?q='+encodeURIComponent(q)); if (current !== version) return;
      $('#plan-status').textContent = `${data.plans.length} of ${data.total} matches. Refine your search if needed.${data.stale?' Saved catalogue; refresh unavailable.':''}`;
      $('#plan-matches').innerHTML = data.plans.map(p => `<article><span>${esc(p.name)}<small>AMFI ${p.code}</small></span><button data-add-plan="${p.code}">Add plan</button></article>`).join('');
      $('#plan-matches').querySelectorAll('button').forEach(b => {b.onclick = () => {
        if (loading || chosen.length >= 4 || chosen.some(p => p.code === b.dataset.addPlan)) return;
        chosen.push(data.plans.find(p => p.code === b.dataset.addPlan)); invalidate();
      };}); selection();
    } catch (error) {if (current === version) $('#plan-status').textContent = error.message;}
  }
  async function load() {
    if (loading || !chosen.length) return;
    loading = true; histories = []; selection(); clearAnalytics(); $('#plan-status').textContent = 'Loading the selected plans…';
    const results = await Promise.allSettled(chosen.map(p => request('nav/'+p.code)));
    loading = false; selection();
    const failed = results.find(r => r.status === 'rejected');
    if (failed) {histories = []; $('#plan-status').textContent = failed.reason.message+' Your selection is unchanged; retry Compare performance.'; return;}
    histories = results.map(r => r.value);
    $('#plan-status').textContent = histories.map(h => `${h.name}: NAV as of ${h.rows.at(-1).date}${h.stale?' (saved data; refresh unavailable)':''}`).join(' · ');
    renderPerformance(); renderRolling(); renderSip();
  }
  function renderPerformance() {
    if (!histories.length) return;
    $('#risk-output').innerHTML = '';
    try {
      const result = FundAnalytics.aligned(histories,Number($('#performance-years').value));
      const values = result.series.flatMap(s => s.points.map(p => p.value)), min = Math.min(...values)*0.95, max = Math.max(...values)*1.05;
      const x = date => 65+(Date.parse(date)-Date.parse(result.start))/(Date.parse(result.end)-Date.parse(result.start))*690;
      const y = value => 270-(value-min)/(max-min)*240;
      $('#performance-output').innerHTML = `<p>Common dates: <strong>${result.start} – ${result.end}</strong>. Growth of ₹10,000; taxes and exit loads excluded. Historical performance does not predict future returns.</p><div class="growth-chart"><svg viewBox="0 0 800 320" role="img" aria-label="Growth of ten thousand rupees for each selected plan; values are also listed in the table"><line x1="65" y1="270" x2="755" y2="270"/><text x="65" y="300">${result.start}</text><text x="755" y="300" text-anchor="end">${result.end}</text><text x="5" y="30">${money(max)}</text><text x="5" y="265">${money(min)}</text>${result.series.map((s,i) => `<polyline class="series-${i}" points="${s.points.map(p => `${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')}"><title>${esc(s.name)}</title></polyline>`).join('')}</svg></div><div class="table-scroll"><table><caption>Exact-plan historical performance · source: MFapi</caption><thead><tr><th>Plan</th><th>Total return</th><th>Annualised return</th><th>₹10,000 became</th></tr></thead><tbody>${result.series.map((s,i) => `<tr><th><span class="series-label series-${i}">${String.fromCharCode(65+i)}</span> ${esc(s.name)}<small>AMFI ${s.code}</small></th><td>${percent(s.returnPct)}</td><td>${percent(s.cagr)}</td><td>${money(s.points.at(-1).value)}</td></tr>`).join('')}</tbody></table></div>`;
      renderRisk(result);
    } catch (error) {$('#performance-output').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`;}
  }
  function mount() {
    const node = document.createElement('details'); node.className = 'panel analytics'; node.id = 'fund-analytics';
    node.innerHTML = `<summary>Performance comparison <span>Compare exact plans using NAV history</span></summary><p>Choose up to four exact plans. Direct and Regular plans have different returns. Select Growth options; payout/distribution-adjusted returns are unavailable.</p><form id="plan-search-form" class="search-row"><label><span class="sr-only">Search exact plans</span><input id="plan-query" type="search" maxlength="100" placeholder="Fund name, Direct / Regular, or AMFI code" required minlength="2"></label><button>Search plans</button></form><p id="plan-status" role="status"></p><div id="plan-selection" class="keys"></div><div id="plan-matches" class="plan-matches"></div><div class="analytics-controls"><label>Period <select id="performance-years"><option value="1">1 year</option><option value="3">3 years</option><option value="5">5 years</option></select></label><button id="load-performance" class="primary" disabled>Compare performance</button></div><div id="performance-output" aria-live="polite"></div>`;
    $('.workbench').before(node);
    for (const id of ['risk-output','rolling-panel']) {const section = document.createElement('section'); section.id = id; node.append(section);}
    const sipPanel = document.createElement('section'); sipPanel.id = 'sip-panel'; node.append(sipPanel);
    const watchPanel = document.createElement('section'); watchPanel.id = 'watchlists'; node.append(watchPanel);
    watchPanel.innerHTML = '<h3>Your saved watchlists</h3><p>Private to your account. Save up to 10 lists of four exact plans.</p><form id="watchlist-form" class="search-row"><label><span class="sr-only">Watchlist name</span><input id="watchlist-name" placeholder="Name this selection" maxlength="60" required></label><button id="save-watchlist" disabled>Save selected plans</button></form><p id="watchlist-status" role="status"></p><button id="reload-watchlists">Refresh watchlists</button><div id="watchlist-list"></div>';
    $('#watchlist-form').onsubmit = saveWatchlist; $('#reload-watchlists').onclick = refreshWatchlists; refreshWatchlists();
    $('#plan-search-form').onsubmit = e => {e.preventDefault(); search();};
    $('#plan-query').oninput = () => {version++; $('#plan-matches').innerHTML = '';};
    $('#plan-selection').onclick = e => {const b = e.target.closest('[data-remove-plan]'); if (b && !loading) {chosen = chosen.filter(p => p.code !== b.dataset.removePlan); invalidate();}};
    $('#load-performance').onclick = load; $('#performance-years').onchange = renderPerformance;
  }
  function renderRisk(period) {
    const metrics = histories.map(h => FundAnalytics.risk(h,period.start,period.end));
    $('#risk-output').innerHTML = `<h3>Historical risk comparison</h3><p>Period: ${period.start} – ${period.end}. Drawdown is the largest observed fall from a previous NAV peak. Recovery measures calendar days from that peak until its NAV was reached again within this period.</p><div class="table-scroll"><table><caption>Risk over the selected performance period</caption><thead><tr><th scope="col">Exact plan</th><th scope="col">Annualised daily volatility</th><th scope="col">Largest observed fall</th><th scope="col">Recovery of that fall</th></tr></thead><tbody>${metrics.map(m => `<tr><th scope="row">${esc(m.name)}<small>${m.observations} NAV observations</small></th><td>${m.volatility === null?'Unavailable: insufficient daily data':percent(m.volatility)}</td><td>${percent(m.drawdown)}${m.drawdown?`<small>${m.peak} → ${m.trough}</small>`:''}</td><td>${!m.drawdown?'No observed fall':m.recovered?`${m.recoveryDays} days<small>Recovered ${m.recovered}</small>`:'Not recovered by '+m.end}</td></tr>`).join('')}</tbody></table></div><details><summary>How these risk figures are calculated</summary><p>Volatility is the sample standard deviation of consecutive NAV percentage changes, multiplied by √252. We require at least 30 changes, no interval longer than seven days, and a density of at least 180 observations per year. A 252-trading-day year is an assumption. Drawdowns use every available NAV for each plan inside the shared date range; missing observations can hide a deeper fall. These figures describe historical NAV behaviour, not a complete risk rating or forecast.</p>${metrics.filter(m => m.largestGap>7).map(m => `<p class="notice-inline">${esc(m.name)}: largest NAV gap is ${m.largestGap} days; observed drawdown and recovery may be understated.</p>`).join('')}</details>`;
  }
  function renderRolling() {
    $('#rolling-panel').innerHTML = '<h3>Rolling returns</h3><p>Compare returns across completed month-end observations over all shared history, independently of the performance period above.</p><label>Rolling window <select id="rolling-years"><option value="1">1 year</option><option value="3">3 years</option><option value="5">5 years</option></select></label><div id="rolling-output" aria-live="polite"></div>';
    const calculate = () => {
      try {
        const r = FundAnalytics.rolling(histories,Number($('#rolling-years').value));
        $('#rolling-output').innerHTML = `<p>${r.windows.length} shared windows · ending ${r.windows[0].end} to ${r.windows.at(-1).end}. ${r.skipped} month(s) skipped for missing endpoint NAVs.</p><div class="table-scroll"><table><caption>Annualised returns across ${r.years}-year rolling windows</caption><thead><tr><th scope="col">Exact plan</th><th scope="col">Lowest</th><th scope="col">Median</th><th scope="col">Highest</th><th scope="col">Positive windows</th></tr></thead><tbody>${r.series.map(s => `<tr><th scope="row">${esc(s.name)}</th><td>${percent(s.min)}</td><td>${percent(s.median)}</td><td>${percent(s.max)}</td><td>${percent(s.positive)}</td></tr>`).join('')}</tbody></table></div><label class="rolling-inspect">Inspect a window <select id="rolling-observation">${r.windows.map((w,i) => `<option value="${i}" ${i===r.windows.length-1?'selected':''}>${w.start} to ${w.end}</option>`).join('')}</select></label><div id="rolling-detail" role="status"></div><details><summary>Rolling return methodology</summary><p>Each completed calendar month uses the latest NAV date shared by all plans on or before month-end, no more than seven days earlier. Its start is the latest shared NAV on or before the ${r.years}-year anniversary, also within seven days. Leap-day anniversaries use February 28 when needed. Annualisation uses the actual days divided by 365.25. At least two windows are required. Windows overlap; their positive percentage is not a probability of future profit. Intermediate NAV gaps do not change endpoint returns. Payout options, taxes and exit loads are excluded.</p></details>`;
        const inspect = () => {const w = r.windows[Number($('#rolling-observation').value)]; $('#rolling-detail').innerHTML = `<p><strong>${w.start} – ${w.end}</strong></p>${r.series.map((s,i) => `<p>${esc(s.name)}: ${percent(w.returns[i])} annualised</p>`).join('')}`;};
        $('#rolling-observation').onchange = inspect; inspect();
      } catch (error) {$('#rolling-output').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`;}
    };
    $('#rolling-years').onchange = calculate; calculate();
  }
  let watchlists = [], saving = false;
  async function refreshWatchlists() {
    $('#reload-watchlists').disabled = true;
    try {const data = await request('watchlists'); watchlists = data.watchlists; drawWatchlists(); $('#watchlist-status').textContent = watchlists.length ? 'Saved to your account.' : 'No saved watchlists yet.';}
    catch (error) {$('#watchlist-status').textContent = error.message;}
    finally {$('#reload-watchlists').disabled = false;}
  }
  async function saveWatchlist(e) {
    e.preventDefault(); if (saving || loading || !chosen.length) return;
    saving = true; selection();
    try {await request('watchlists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('#watchlist-name').value,plans:chosen})}); $('#watchlist-name').value = ''; await refreshWatchlists();}
    catch (error) {$('#watchlist-status').textContent = error.message;}
    finally {saving = false; selection();}
  }
  function drawWatchlists() {
    $('#watchlist-list').innerHTML = watchlists.map(w => `<article class="watchlist"><h4>${esc(w.name)}</h4><p>${w.plans.map(p => esc(p.name)).join(' · ')}</p><div class="result-tools"><button data-open-watchlist="${w.id}">Load plans</button><button data-nav-watchlist="${w.id}">Latest NAV</button><button data-delete-watchlist="${w.id}">Delete watchlist</button></div><div data-watchlist-nav="${w.id}" aria-live="polite"></div></article>`).join('');
    document.querySelectorAll('[data-open-watchlist]').forEach(b => {b.onclick = () => {
      if (loading) return; chosen = watchlists.find(w => w.id === b.dataset.openWatchlist).plans.map(p => ({...p})); invalidate(); load();
    };});
    document.querySelectorAll('[data-delete-watchlist]').forEach(b => {b.onclick = async () => {
      b.disabled = true;
      try {await request('watchlists/'+b.dataset.deleteWatchlist,{method:'DELETE'}); await refreshWatchlists();}
      catch (error) {$('#watchlist-status').textContent = error.message; b.disabled = false;}
    };});
    document.querySelectorAll('[data-nav-watchlist]').forEach(b => {b.onclick = async () => {
      const w = watchlists.find(w => w.id === b.dataset.navWatchlist), target = document.querySelector(`[data-watchlist-nav="${w.id}"]`); b.disabled = true; target.textContent = 'Loading latest available NAV…';
      const results = await Promise.allSettled(w.plans.map(p => request('nav/'+p.code)));
      target.innerHTML = results.map((r,i) => r.status === 'rejected' ? `<p class="error">${esc(w.plans[i].name)}: ${esc(r.reason.message)}</p>` : `<p><strong>${esc(r.value.name)}</strong>: ₹${r.value.rows.at(-1).nav.toFixed(4)} · ${r.value.rows.at(-1).date}${r.value.stale?' · Saved data; refresh unavailable':''} · MFapi</p>`).join(''); b.disabled = false;
    };}); selection();
  }
  function renderSip() {
    const last = histories[0].rows.at(-1).date, suggested = new Date(last); suggested.setUTCFullYear(suggested.getUTCFullYear()-1);
    const start = [suggested.toISOString().slice(0,10),histories[0].rows[0].date].sort().at(-1);
    $('#sip-panel').innerHTML = `<h3>Historical SIP simulator</h3><p>Simulate a fixed monthly contribution. The first date sets the day of each month; shorter months use their last day. Purchases use the next available NAV, up to seven days later. Valuation uses the last NAV on or before the end date. Taxes, exit loads and transaction charges are excluded.</p><form id="sip-form"><div class="allocation-inputs"><label>Exact plan<select id="sip-plan">${histories.map((h,i) => `<option value="${i}">${esc(h.name)}</option>`).join('')}</select></label><label>Monthly amount (₹)<input id="sip-amount" type="number" min="1" max="1000000000" step="any" value="5000" required></label><label>First contribution<input id="sip-start" type="date" value="${start}" required></label><label>Value as of<input id="sip-end" type="date" value="${last}" required></label></div><button class="primary">Simulate historical SIP</button></form><div id="sip-output" aria-live="polite"></div>`;
    $('#sip-form').oninput = () => {$('#sip-output').innerHTML = '<p>Inputs changed. Run the simulation to update results.</p>';};
    $('#sip-plan').onchange = () => {
      const h = histories[Number($('#sip-plan').value)]; $('#sip-end').value = h.rows.at(-1).date;
      if ($('#sip-start').value < h.rows[0].date) $('#sip-start').value = h.rows[0].date;
      $('#sip-output').innerHTML = '';
    };
    $('#sip-form').onsubmit = e => {
      e.preventDefault();
      try {
        const r = FundAnalytics.sip(histories[Number($('#sip-plan').value)],Number($('#sip-amount').value),$('#sip-start').value,$('#sip-end').value);
        $('#sip-output').innerHTML = `<p><strong>${r.count} contributions · ${money(r.invested)} invested · ${money(r.value)} historical value</strong></p><p>Gain/loss: ${money(r.value-r.invested)}. Annualised cash-flow return (XIRR): ${r.annualised === null?'Unavailable':percent(r.annualised)}. Valuation date: ${r.end}. This is a historical simulation, not a forecast.</p><details><summary>View simulated purchases</summary><div class="table-scroll"><table><thead><tr><th>Scheduled</th><th>NAV date used</th><th>NAV (₹)</th><th>Units</th></tr></thead><tbody>${r.payments.map(p => `<tr><td>${p.scheduled}</td><td>${new Date(p.date).toISOString().slice(0,10)}</td><td>${p.nav.toFixed(4)}</td><td>${p.units.toFixed(4)}</td></tr>`).join('')}</tbody></table></div></details>`;
      } catch (error) {$('#sip-output').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`;}
    };
  }
  const allocations = new Map();
  function renderExposure(funds) {
    const panel = document.createElement('section'); panel.className = 'panel'; panel.id = 'combined-exposure';
    panel.innerHTML = `<h2>Your combined equity exposure</h2><p>Enter current or hypothetical fund values. Amounts stay in this browser tab. We apply each fund’s disclosed NAV weights, independently of the overlap weight-basis setting.</p><form id="exposure-form"><div class="allocation-inputs">${funds.map((f,i) => `<label>${esc(f.name)}<small>Holdings as of ${esc(f.portfolioDate)}</small><input type="number" min="0" max="1000000000000" step="any" required data-allocation="${i}" aria-label="Amount in ${esc(f.name)}" value="${allocations.get(f.schemeId) ?? 10000}"></label>`).join('')}</div><button class="primary">Calculate exposure</button></form><div id="exposure-output" aria-live="polite"></div>`;
    $('#results').append(panel);
    const calculate = () => {
      try {
        const amounts = [...panel.querySelectorAll('input')].map((input,i) => {const amount = input.value === '' ? NaN : Number(input.value); if (Number.isFinite(amount)) allocations.set(funds[i].schemeId,amount); return amount;});
        const r = FundAnalytics.exposure(funds,amounts);
        const table = (title,rows) => `<div class="table-scroll"><table><caption>${title}</caption><thead><tr><th>Name</th><th>Estimated amount</th><th>% of combined value</th></tr></thead><tbody>${rows.map(row => `<tr><th>${esc(row.name)}${row.isin?`<small>${row.isin}</small>`:''}</th><td>${money(row.amount)}</td><td>${percent(row.percent)}</td></tr>`).join('')}</tbody></table></div>`;
        $('#exposure-output').innerHTML = `<p><strong>${money(r.total)} combined value · ${percent(r.included/r.total*100)} covered by included equities.</strong></p><p>${money(Math.max(0,r.total-r.included))} is outside the included equity data (cash, debt, other assets and unresolved holdings). Rounding can make reported coverage slightly exceed 100%. Source dates and industry classifications may differ; these are snapshot estimates.</p>${table('Combined stock exposure',r.stocks)}${table('Combined industry exposure',r.industries)}`;
      } catch (error) {$('#exposure-output').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`;}
    };
    $('#exposure-form').onsubmit = e => {e.preventDefault(); calculate();};
    $('#exposure-form').oninput = () => {$('#exposure-output').innerHTML = '<p>Amounts changed. Calculate exposure to update the results.</p>';};
    calculate();
  }
  window.FundTools = {mount,renderExposure};
})();
