(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FundOverlap=factory();})(globalThis,function(){
  'use strict';
  const round=n=>Math.round(n*1e6)/1e6;
  function validIsin(value){
    if(typeof value!=='string')return false;
    const isin=value.replace(/\s/g,'').toUpperCase();
    if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin))return false;
    const digits=isin.replace(/[A-Z]/g,c=>String(c.charCodeAt(0)-55));let sum=0;
    for(let i=digits.length-1,pos=0;i>=0;i--,pos++){let n=Number(digits[i])*(pos%2?2:1);sum+=n>9?n-9:n;}
    return sum%10===0;
  }
  function normalize(holdings){
    if(!Array.isArray(holdings)||!holdings.length||holdings.length>2000)throw Error('Invalid holdings list');
    const map=new Map();
    for(const h of holdings){
      if(!h||!validIsin(h.isin)||typeof h.name!=='string'||!h.name.trim()||h.name.length>200||typeof h.weight!=='number'||!Number.isFinite(h.weight)||h.weight<0||h.weight>100)throw Error('Invalid holding or ISIN');
      if(!h.weight)continue;
      const isin=h.isin.replace(/\s/g,'').toUpperCase();
      const sector=typeof h.sector==='string'&&h.sector.trim()?h.sector.trim():'Unknown';
      const prev=map.get(isin);
      if(prev){prev.weight=round(prev.weight+h.weight);if(prev.sector!==sector)throw Error('Conflicting industry classification for '+isin);}
      else map.set(isin,{isin,name:h.name.trim(),sector,weight:h.weight});
    }
    const total=[...map.values()].reduce((s,h)=>s+h.weight,0);
    if(!(total>0&&total<=100.5))throw Error('Included equity weights must total more than 0 and at most 100.5%');
    return {holdings:[...map.values()].sort((a,b)=>b.weight-a.weight||a.isin.localeCompare(b.isin)),total:round(total)};
  }
  function overlap(a,b){let value=0;for(const [key,weight]of a)value+=Math.min(weight,b.get(key)||0);return round(value);}
  function analyze(snapshots,basis='equity',now=new Date()){
    if(!Array.isArray(snapshots)||snapshots.length<2||snapshots.length>8)throw Error('Select between 2 and 8 funds');
    if(!['equity','nav'].includes(basis))throw Error('Invalid weight basis');
    if(new Set(snapshots.map(f=>f.schemeId)).size!==snapshots.length)throw Error('Select different funds');
    const funds=snapshots.map(f=>{
      if(!f.schemeId||!/^\d{4}-\d{2}-\d{2}$/.test(f.portfolioDate)||!Number.isFinite(Date.parse(f.portfolioDate))||new Date(f.portfolioDate).toISOString().slice(0,10)!==f.portfolioDate||Date.parse(f.portfolioDate)>now.getTime())throw Error('Invalid portfolio date');
      const {holdings,total}=normalize(f.holdings),factor=basis==='equity'?100/total:1;
      const weights=new Map(holdings.map(h=>[h.isin,h.weight*factor])),sectors=new Map();
      for(const h of holdings)if(h.sector!=='Unknown')sectors.set(h.sector,(sectors.get(h.sector)||0)+h.weight*factor);
      return {...f,holdings,total,weights,sectors,top:new Set(holdings.slice(0,10).map(h=>h.isin)),ageDays:Math.floor((now-new Date(f.portfolioDate))/86400000)};
    });
    const all=new Map();
    funds.forEach((f,i)=>f.holdings.forEach(h=>{
      if(!all.has(h.isin))all.set(h.isin,{isin:h.isin,name:h.name,sector:h.sector,weights:Array(funds.length).fill(0),navWeights:Array(funds.length).fill(0),count:0});
      const row=all.get(h.isin);row.weights[i]=round(f.weights.get(h.isin));row.navWeights[i]=h.weight;row.count++;
      if(row.sector!==h.sector)row.sector='Mixed source classifications';
    }));
    const holdings=[...all.values()].map(h=>({...h,averageWeight:round(h.weights.reduce((a,b)=>a+b,0)/funds.length)})).sort((a,b)=>b.count-a.count||b.averageWeight-a.averageWeight||a.isin.localeCompare(b.isin));
    const pairs=[];
    for(let i=0;i<funds.length;i++)for(let j=i+1;j<funds.length;j++){
      const a=funds[i],b=funds[j];pairs.push({i,j,overlap:overlap(a.weights,b.weights),common:[...a.weights.keys()].filter(k=>b.weights.has(k)).length,topCommon:[...a.top].filter(k=>b.top.has(k)).length,topSizes:[a.top.size,b.top.size],sectorOverlap:overlap(a.sectors,b.sectors)});
    }
    pairs.sort((a,b)=>b.overlap-a.overlap||a.i-b.i||a.j-b.j);
    const contributions=funds.map((f,i)=>{const unique=holdings.filter(h=>h.count===1&&h.weights[i]>0);return {schemeId:f.schemeId,count:unique.length,weight:round(unique.reduce((s,h)=>s+h.weights[i],0)),navWeight:round(unique.reduce((s,h)=>s+h.navWeights[i],0))};});
    const warnings=[];
    if(new Set(funds.map(f=>f.portfolioDate)).size>1)warnings.push('Portfolio dates differ. These snapshots are not from the same reporting date.');
    if(funds.some(f=>f.ageDays>45))warnings.push('One or more snapshots are over 45 days old. Check source dates before interpreting results.');
    if(funds.some(f=>f.holdings.some(h=>h.sector==='Unknown')))warnings.push('Unclassified holdings are excluded from industry similarity.');
    return {funds,pairs,holdings,contributions,warnings,basis,averageOverlap:round(pairs.reduce((s,p)=>s+p.overlap,0)/pairs.length),distinct:holdings.length,repeated:holdings.filter(h=>h.count>1).length,allCommon:holdings.filter(h=>h.count===funds.length).length};
  }
  return {analyze,normalize,validIsin,overlap};
});
