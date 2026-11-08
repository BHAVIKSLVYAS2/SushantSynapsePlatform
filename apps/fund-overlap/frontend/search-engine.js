(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FundSearch=factory();})(globalThis,function(){
 'use strict';
 const normalize=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/\p{M}/gu,'').match(/[\p{L}\p{N}]+/gu)||[];
 const meaningful=words=>words.filter(w=>!['and','of','the'].includes(w));
 function matches(fund,query){const tokens=meaningful(normalize(query)),words=meaningful(normalize([fund.name,fund.amc,fund.category,...(fund.previousNames||[])].join(' ')));return tokens.every(token=>words.some(word=>word.startsWith(token)));}
 const family=name=>{const parts=String(name).split(/\s*-\s*/),end=parts.findIndex((part,i)=>i>0&&/\b(?:direct|regular|growth|idcw|dividend)\b/i.test(part));return (end<0?String(name):parts.slice(0,end).join(' - ')).trim();};
 function catalogue(funds,schemes=[]){
  const rows=funds.map(f=>({...f,available:true})),ids=new Set(funds.map(f=>f.id)),names=new Set(funds.map(f=>normalize(f.name).join(' '))),seen=new Set();
  for(const s of schemes){if(s.officialFundId&&ids.has(s.officialFundId))continue;const name=family(s.name),key=normalize(name).join(' ');if(!key||names.has(key)||seen.has(key))continue;seen.add(key);rows.push({id:'unavailable-'+String(s.schemeCode),name,amc:s.amc||'Known scheme',available:false,category:'Holdings unavailable'});}
  return rows.map(r=>({...r,searchName:normalize(r.name).join(' '),searchWords:meaningful(normalize([r.name,r.amc,r.category,...(r.previousNames||[])].join(' ')))}));
 }
 function search(rows,query,limit=8){const tokens=meaningful(normalize(query)),q=tokens.join(' ');if(!q)return[];const rank=r=>{const name=r.searchName||normalize(r.name).join(' ');return (name===q?200:name.startsWith(q)?30:0)+(r.available?100:0);};return rows.filter(r=>{const words=r.searchWords||meaningful(normalize([r.name,r.amc,r.category,...(r.previousNames||[])].join(' ')));return tokens.every(token=>words.some(word=>word.startsWith(token)));}).sort((a,b)=>rank(b)-rank(a)||a.name.localeCompare(b.name)).slice(0,limit);}
 return {matches,catalogue,search,family};
});
