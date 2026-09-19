(function(root) {
  'use strict';
  const DAY=86400000, order={BUY:0,DIVIDEND:1,SELL:2};
  function today() {return new Date(Date.now()+330*60000).toISOString().slice(0,10);}
  function clean(row, asOf=today()) {
    if (!row || typeof row !== 'object') throw Error('Invalid transaction');
    const schemeCode=String(row.schemeCode ?? '').trim(),date=String(row.date ?? '').trim(),type=String(row.type ?? '').trim().toUpperCase();
    const units=Number(row.units),amount=Number(row.amount),reference=String(row.reference ?? '').trim();
    for(const field of ['units','amount'])if(!(typeof row[field]==='number'||typeof row[field]==='string'&&/^\d+(?:\.\d+)?$/.test(row[field].trim())))throw Error('Units and amount must be decimal numbers');
    if(row.reference!==undefined&&typeof row.reference!=='string')throw Error('Reference must be text');
    if (!/^\d{5,8}$/.test(schemeCode)) throw Error('Use an exact AMFI scheme code');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date || date<'1990-01-01' || date>asOf) throw Error('Use a valid transaction date from 1990 through today');
    if (!Object.hasOwn(order,type)) throw Error('Type must be BUY, SELL or DIVIDEND');
    if (!Number.isFinite(amount) || amount<=0 || amount>1e9 || Math.abs(amount*100-Math.round(amount*100))>0.0001) throw Error('Amount must be positive, up to ₹1 billion, with at most two decimals');
    if (!Number.isFinite(units) || units<0 || units>1e8 || Math.abs(units*1e6-Math.round(units*1e6))>0.001 || (type==='DIVIDEND'?units!==0:units<=0)) throw Error('Units must be positive with up to six decimals; use zero for dividends');
    if (reference.length>80 || /[\x00-\x1f]/.test(reference)) throw Error('Reference must be at most 80 characters without control characters');
    return {schemeCode,date,type,units,amount,reference};
  }
  function sequence(rows) {
    const balances=new Map();
    for (const r of [...rows].sort((a,b)=>a.date.localeCompare(b.date)||order[a.type]-order[b.type])) {
      const after=(balances.get(r.schemeCode)||0)+(r.type==='BUY'?1:r.type==='SELL'?-1:0)*Math.round(r.units*1e6);
      if (after<0) throw Error(`Redemption exceeds recorded units for ${r.schemeCode} on ${r.date}`);
      if (after>1e15) throw Error('Recorded units exceed the portfolio limit');
      balances.set(r.schemeCode,after);
    }
    return balances;
  }
  function parseCsv(text) {
    if (text.length>1000000) throw Error('CSV must be no larger than 1 MB');
    text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
    for(let i=0;i<=text.length;i++) {
      const c=text[i];
      if(quoted){if(c===undefined)throw Error('Unclosed CSV quote');if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else {quoted=false;closed=true;}}else cell+=c;continue;}
      if(c==='"'&&!cell&&!closed){quoted=true;continue;}
      if(c===','||c==='\n'||c==='\r'||c===undefined){row.push(cell);cell='';closed=false;if(c!==','){if(row.some(v=>v.trim()))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}continue;}
      if(closed||c==='"')throw Error('Malformed CSV quoting');cell+=c;
    }
    const headers=rows.shift()?.map(s=>s.trim().toLowerCase()),required=['scheme_code','date','type','units','amount'];
    if(!headers || required.some(h=>!headers.includes(h)) || new Set(headers).size!==headers.length || headers.some(h=>![...required,'reference'].includes(h)))throw Error('CSV headers: scheme_code,date,type,units,amount,reference (reference optional)');
    if(!rows.length||rows.length>500)throw Error('Import between 1 and 500 transactions at a time');
    return rows.map((cells,i)=>{try{if(cells.length!==headers.length)throw Error('Column count does not match headers');const r=Object.fromEntries(headers.map((h,j)=>[h,cells[j]]));if(/^'[=+@'-]/.test(r.reference||''))r.reference=r.reference.slice(1);return clean({...r,schemeCode:r.scheme_code});}catch(e){throw Error(`Row ${i+2}: ${e.message}`);}});
  }
  function csv(rows) {
    const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
    return 'scheme_code,date,type,units,amount,reference\r\n'+rows.map(r=>[r.schemeCode,r.date,r.type,r.units,r.amount,/^[=+@'-]/.test(r.reference)?"'"+r.reference:r.reference].map(quote).join(',')).join('\r\n');
  }
  function cashReturn(flows) {
    const grouped=new Map();for(const f of flows)grouped.set(f.date,(grouped.get(f.date)||0)+f.amount);
    const rows=[...grouped].filter(([,v])=>Math.abs(v)>1e-8).sort(([a],[b])=>a.localeCompare(b));
    if(rows.length<2||!rows.some(([,v])=>v<0)||!rows.some(([,v])=>v>0))return {value:null,reason:'Requires dated investment and positive proceeds/value'};
    const base=Date.parse(rows[0][0]),values=rows.map(([date,amount])=>({years:(Date.parse(date)-base)/DAY/365.25,amount}));
    const npv=y=>{const scale=values.reduce((m,f)=>Math.max(m,-y*f.years),-Infinity);return values.reduce((sum,f)=>sum+f.amount*Math.exp(-y*f.years-scale),0);};
    const roots=[];let lo=Math.log(0.0001),before=npv(lo);
    for(let i=1;i<=600;i++) {const hi=Math.log(0.0001)+i*(Math.log(10001)-Math.log(0.0001))/600,after=npv(hi);
      if(before===0)roots.push(lo);
      if(before*after<0){let a=lo,b=hi;for(let j=0;j<70;j++){const mid=(a+b)/2;if(npv(a)*npv(mid)<=0)b=mid;else a=mid;}roots.push((a+b)/2);}
      lo=hi;before=after;
    }
    const unique=roots.filter((r,i)=>!i||Math.abs(r-roots[i-1])>1e-6);
    return unique.length===1 ? {value:Math.expm1(unique[0])*100,reason:null} : {value:null,reason:unique.length?'Multiple XIRR solutions; no single return shown':'No XIRR found within the supported range'};
  }
  function valuation(transactions, histories) {
    const balances=sequence(transactions),codes=[...new Set(transactions.map(r=>r.schemeCode))];
    const active=codes.filter(code=>balances.get(code)>0),lastTransaction=transactions.map(r=>r.date).sort().at(-1)||today();
    let commonDate=active.length?null:lastTransaction;
    if(active.length&&active.every(code=>histories[code]?.rows?.length)) {
      const sets=active.map(code=>new Set(histories[code].rows.map(r=>r.date)));
      commonDate=histories[active[0]].rows.map(r=>r.date).filter(d=>d>=lastTransaction&&sets.every(s=>s.has(d))).at(-1)||null;
    }
    const funds=codes.map(code=>{
      const rows=transactions.filter(t=>t.schemeCode===code),h=histories[code],units=balances.get(code)/1e6;
      const quote=units ? (commonDate?h?.rows?.find(r=>r.date===commonDate):h?.rows?.at(-1)) : null;
      const usable=!units || quote&&quote.date>=rows.map(r=>r.date).sort().at(-1);
      const value=usable?(units?units*quote.nav:0):null;
      const invested=rows.filter(r=>r.type==='BUY').reduce((s,r)=>s+r.amount,0),received=rows.filter(r=>r.type!=='BUY').reduce((s,r)=>s+r.amount,0);
      const date=units?quote?.date:rows.map(r=>r.date).sort().at(-1);
      const flows=rows.map(r=>({date:r.date,amount:r.type==='BUY'?-r.amount:r.amount}));
      const xirr=value===null?{value:null,reason:'NAV unavailable'}:cashReturn([...flows,...(value?[{date,amount:value}]:[])]);
      return {code,name:h?.name||rows[0].schemeName,units,invested,received,value,gain:value===null?null:value+received-invested,date,nav:quote?.nav,stale:!!h?.stale,xirr,error:usable?null:(h?.error||'No NAV on or after the last transaction')};
    });
    const invested=funds.reduce((s,f)=>s+f.invested,0),received=funds.reduce((s,f)=>s+f.received,0),complete=!!commonDate&&funds.every(f=>f.value!==null),value=complete?funds.reduce((s,f)=>s+f.value,0):null;
    const flows=transactions.map(r=>({date:r.date,amount:r.type==='BUY'?-r.amount:r.amount}));
    return {funds,invested,received,value,gain:complete?value+received-invested:null,date:commonDate,xirr:complete?cashReturn([...flows,...(value?[{date:commonDate,amount:value}]:[])]):{value:null,reason:'A common valuation date is unavailable; totals are withheld'}};
  }
  const api={clean,sequence,parseCsv,csv,cashReturn,valuation};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FundPortfolio=api;
})(globalThis);
