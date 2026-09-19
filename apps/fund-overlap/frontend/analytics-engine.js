(function(root) {
  'use strict';
  const DAY = 86400000;
  function growth(history) {
    if (!/growth/i.test(history.name) || /idcw|dividend/i.test(history.name)) throw Error('Choose a Growth option. Distribution adjustments are not available.');
  }
  function aligned(histories, years) {
    if (!histories.length) throw Error('Choose at least one exact plan.');
    histories.forEach(growth);
    const maps = histories.map(h => new Map(h.rows.map(r => [r.date,r.nav])));
    const common = histories[0].rows.map(r => r.date).filter(date => maps.every(m => m.has(date)));
    if (common.length < 2) throw Error('Not enough shared NAV dates.');
    const end = common.at(-1), target = new Date(end); target.setUTCFullYear(target.getUTCFullYear()-years);
    const cutoff = target.toISOString().slice(0,10);
    if (common[0] > cutoff) throw Error(`Not enough shared history for ${years} year(s). Choose a shorter period.`);
    const start = common.find(date => date >= cutoff), dates = common.filter(date => date >= start);
    const span = (Date.parse(end)-Date.parse(start))/DAY/365.25;
    if (span <= 0) throw Error('Not enough NAV history.');
    return {start,end,series:histories.map((h,i) => {
      const map = maps[i], first = map.get(start), last = map.get(end);
      return {code:h.code,name:h.name,returnPct:(last/first-1)*100,cagr:(Math.pow(last/first,1/span)-1)*100,points:dates.map(date => ({date,value:10000*map.get(date)/first}))};
    })};
  }
  function exposure(funds, amounts) {
    if (amounts.length !== funds.length || amounts.some(a => !Number.isFinite(a) || a < 0 || a > 1e12) || !amounts.some(a => a > 0)) throw Error('Enter non-negative amounts and a total greater than zero (up to ₹1 trillion per fund).');
    const total = amounts.reduce((a,b) => a+b,0), stocks = new Map(), industries = new Map();
    funds.forEach((fund,i) => fund.holdings.forEach(h => {
      const amount = amounts[i]*h.weight/100;
      const row = stocks.get(h.isin) || {isin:h.isin,name:h.name,amount:0}; row.amount += amount; stocks.set(h.isin,row);
      industries.set(h.sector || 'Unknown',(industries.get(h.sector || 'Unknown') || 0)+amount);
    }));
    const rows = [...stocks.values()].filter(r => r.amount > 0).map(r => ({...r,percent:100*r.amount/total})).sort((a,b) => b.amount-a.amount);
    return {total,included:rows.reduce((sum,r) => sum+r.amount,0),stocks:rows,industries:[...industries].filter(([,amount]) => amount > 0).map(([name,amount]) => ({name,amount,percent:100*amount/total})).sort((a,b) => b.amount-a.amount)};
  }
  function validDate(value) {return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;}
  function xirr(flows) {
    const first = flows[0].date;
    const npv = rate => flows.reduce((sum,f) => sum+f.amount/Math.pow(1+rate,(f.date-first)/DAY/365.25),0);
    let lo = -0.9999, hi = 1;
    while (npv(lo)*npv(hi) > 0 && hi < 1e6) hi *= 2;
    if (npv(lo)*npv(hi) > 0) return null;
    for (let i=0;i<150;i++) {const mid = (lo+hi)/2;if (npv(lo)*npv(mid) <= 0) hi=mid;else lo=mid;}
    return (lo+hi)/2*100;
  }
  function sip(history, amount, start, end) {
    growth(history);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e9 || !validDate(start) || !validDate(end) || start >= end) throw Error('Enter a positive monthly amount and valid start/end dates.');
    const rows = history.rows.filter(r => r.date <= end), last = rows.at(-1);
    if (!last || start < history.rows[0].date || start >= last.date || (Date.parse(end)-Date.parse(last.date))/DAY > 7) throw Error('Dates must fall within the available NAV history (up to seven days after the last NAV).');
    const anchor = new Date(start), day = anchor.getUTCDate(); let units = 0; const payments = [];
    for (let month=0;month<1200;month++) {
      const year = anchor.getUTCFullYear(), m = anchor.getUTCMonth()+month;
      const scheduled = new Date(Date.UTC(year,m,Math.min(day,new Date(Date.UTC(year,m+1,0)).getUTCDate()))).toISOString().slice(0,10);
      if (scheduled > last.date) break;
      const nav = rows.find(r => r.date >= scheduled); if (!nav) break;
      if ((Date.parse(nav.date)-Date.parse(scheduled))/DAY > 7) throw Error('NAV history has a gap near a scheduled contribution.');
      units += amount/nav.nav; payments.push({scheduled,date:Date.parse(nav.date),nav:nav.nav,units:amount/nav.nav,amount:-amount});
    }
    if (!payments.length || payments[0].date === Date.parse(last.date)) throw Error('Not enough history after the first contribution.');
    const value = units*last.nav, invested = payments.length*amount;
    return {value,invested,count:payments.length,end:last.date,payments,annualised:xirr([...payments,{date:Date.parse(last.date),amount:value}])};
  }
  function risk(history, start, end) {
    growth(history);
    const rows = history.rows.filter(r => r.date >= start && r.date <= end);
    if (rows.length < 2) throw Error('At least two NAV observations are needed.');
    let peak = rows[0], worstPeak = peak, trough = peak, drawdown = 0, largestGap = 0;
    const returns = [];
    for (let i=1;i<rows.length;i++) {
      const row = rows[i];
      returns.push(row.nav/rows[i-1].nav-1);
      largestGap = Math.max(largestGap,(Date.parse(row.date)-Date.parse(rows[i-1].date))/DAY);
      if (row.nav >= peak.nav) peak = row;
      const drop = 1-row.nav/peak.nav;
      if (drop > drawdown) {drawdown = drop; worstPeak = peak; trough = row;}
    }
    const recovered = drawdown ? rows.find(r => r.date > trough.date && r.nav >= worstPeak.nav) : null;
    const span = (Date.parse(rows.at(-1).date)-Date.parse(rows[0].date))/DAY;
    const daily = returns.length >= 30 && largestGap <= 7 && returns.length/span*365.25 >= 180;
    const mean = returns.reduce((s,r) => s+r,0)/returns.length;
    const volatility = daily ? Math.sqrt(returns.reduce((s,r) => s+(r-mean)**2,0)/(returns.length-1))*Math.sqrt(252)*100 : null;
    return {code:history.code,name:history.name,start:rows[0].date,end:rows.at(-1).date,observations:rows.length,largestGap,volatility,drawdown:drawdown*100,peak:worstPeak.date,trough:trough.date,recovered:recovered?.date || null,recoveryDays:recovered ? (Date.parse(recovered.date)-Date.parse(worstPeak.date))/DAY : null};
  }
  function shiftYears(date, years) {
    const d = new Date(date), y = d.getUTCFullYear()-years, m = d.getUTCMonth();
    return new Date(Date.UTC(y,m,Math.min(d.getUTCDate(),new Date(Date.UTC(y,m+1,0)).getUTCDate()))).toISOString().slice(0,10);
  }
  function rolling(histories, years) {
    if (!histories.length || ![1,3,5].includes(years)) throw Error('Choose a 1, 3 or 5 year rolling window.');
    histories.forEach(growth);
    const maps = histories.map(h => new Map(h.rows.map(r => [r.date,r.nav])));
    const dates = histories[0].rows.map(r => r.date).filter(date => maps.every(m => m.has(date)));
    if (dates.length < 2) throw Error('Not enough shared NAV history for rolling returns.');
    const before = target => {
      let lo=0,hi=dates.length;
      while (lo<hi) {const mid=(lo+hi)>>>1; if(dates[mid]<=target)lo=mid+1;else hi=mid;}
      return dates[lo-1];
    };
    const first = new Date(dates[0]), last = dates.at(-1), windows = []; let skipped = 0;
    for (let month=0;month<1200;month++) {
      const monthEnd = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+month+1,0)).toISOString().slice(0,10);
      if (monthEnd > last) break; // Completed months only, with a shared NAV on/before month end.
      const end = before(monthEnd), target = shiftYears(end,years);
      if (target < dates[0]) continue;
      const start = before(target);
      if (!start || (Date.parse(monthEnd)-Date.parse(end))/DAY>7 || (Date.parse(target)-Date.parse(start))/DAY>7) {skipped++;continue;}
      const span = (Date.parse(end)-Date.parse(start))/DAY/365.25;
      windows.push({start,end,returns:maps.map(map => (Math.pow(map.get(end)/map.get(start),1/span)-1)*100)});
    }
    if (windows.length < 2) throw Error(`Need at least two completed monthly ${years}-year windows shared by all selected plans.`);
    return {years,skipped,windows,series:histories.map((h,i) => {
      const values = windows.map(w => w.returns[i]).sort((a,b) => a-b), n = values.length;
      return {code:h.code,name:h.name,count:n,min:values[0],max:values.at(-1),median:n%2 ? values[(n-1)/2] : (values[n/2-1]+values[n/2])/2,positive:values.filter(v => v>0).length/n*100};
    })};
  }
  const api = {aligned,growth,exposure,sip,xirr,risk,rolling};
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FundAnalytics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
