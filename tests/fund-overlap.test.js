const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {analyze,normalize,validIsin}=require('../apps/fund-overlap/frontend/engine');
const isin=['INE040A01034','INE090A01021','INE154A01025','INE009A01021'];
const holding=(i,weight,sector='Banks')=>({isin:isin[i],name:'Security '+i,sector,weight});
const fund=(id,holdings,date='2026-07-31')=>({schemeId:id,name:id,portfolioDate:date,holdings});
const now=new Date('2026-09-07');

test('known weighted overlap, NAV basis, top holdings, sectors and unique contribution',()=>{
 const a=fund('a',[holding(0,30),holding(1,20)]),b=fund('b',[holding(0,20),holding(2,60,'FMCG')]);
 const r=analyze([a,b],'equity',now);
 assert.equal(r.pairs[0].overlap,25);assert.equal(r.pairs[0].sectorOverlap,25);assert.equal(r.pairs[0].common,1);assert.equal(r.pairs[0].topCommon,1);
 assert.equal(r.distinct,3);assert.equal(r.repeated,1);assert.equal(r.allCommon,1);
 assert.deepEqual(r.contributions.map(c=>[c.count,c.weight,c.navWeight]),[[1,40,20],[1,75,60]]);
 const nav=analyze([a,b],'nav',now);assert.equal(nav.pairs[0].overlap,20);assert.equal(nav.funds[0].total,50);
});
test('ISIN checksum, whitespace normalization, duplicate rows, invalid weights and conflicting sectors',()=>{
 assert.equal(validIsin(' ine040a01034 '),true);assert.equal(validIsin('INE040A01035'),false);
 assert.equal(normalize([holding(0,5),{...holding(0,3),isin:' ine040a01034 '}]).holdings[0].weight,8);
 for(const weight of [-1,NaN,Infinity,101,'10'])assert.throws(()=>normalize([holding(0,weight)]));
 assert.throws(()=>normalize([holding(0,60),holding(1,60)]));assert.throws(()=>normalize([holding(0,0)]));
 assert.throws(()=>normalize([holding(0,5),holding(0,3,'Other')]));
});
test('2, 4 and 8 funds, identical and disjoint portfolios, symmetry and no mutation',()=>{
 for(const n of [2,4,8]){
  const funds=Array.from({length:n},(_,i)=>fund('f'+i,[holding(0,40),holding(1,10)]));
  const saved=JSON.stringify(funds),r=analyze(funds,'equity',now);
  assert.equal(r.pairs.length,n*(n-1)/2);assert.equal(r.averageOverlap,100);assert.equal(r.allCommon,2);assert.equal(r.contributions[0].count,0);assert.equal(JSON.stringify(funds),saved);
 }
 const a=fund('a',[holding(0,100)]),b=fund('b',[holding(1,100)]);
 assert.equal(analyze([a,b],'equity',now).averageOverlap,0);assert.equal(analyze([b,a],'equity',now).averageOverlap,0);
 assert.throws(()=>analyze([a]));assert.throws(()=>analyze([a,a]));assert.throws(()=>analyze(Array(9).fill(a)));
});
test('mixed dates, stale snapshots, future/invalid dates, unknown industries and removal recalculation',()=>{
 const a=fund('a',[holding(0,50)],'2026-06-30'),b=fund('b',[holding(0,50)],'2026-07-31'),c=fund('c',[holding(1,20,'Unknown')]);
 const r=analyze([a,b,c],'equity',now);assert.equal(r.warnings.length,3);
 assert.equal(analyze([a,b],'equity',now).distinct,1);assert.equal(r.distinct,2);
 assert.throws(()=>analyze([a,{...b,portfolioDate:'2026-02-30'}],'equity',now));
 assert.throws(()=>analyze([a,{...b,portfolioDate:'2027-01-01'}],'equity',now));
});
test('published official snapshots have valid holdings, exact hashes and source coverage',()=>{
 const root=path.join(__dirname,'../apps/fund-overlap/data'),{createHash}=require('node:crypto');
 const index=JSON.parse(fs.readFileSync(path.join(root,'fund-index.json')));
 assert.equal(index.funds.length,5);
 const funds=index.funds.map(entry=>{
  const bytes=fs.readFileSync(path.join(root,entry.holdingsPath.replace('/api/fund-overlap/',''))),snapshot=JSON.parse(bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.snapshotSha256);
  assert.equal(snapshot.source.sha256,entry.sourceSha256);assert.equal(snapshot.schemeId,entry.id);
  assert.equal(new URL(snapshot.source.url).hostname,'amc.ppfas.com');assert.equal(normalize(snapshot.holdings).total,entry.includedNavWeight);
  assert.equal(snapshot.holdings.length,entry.holdingsCount);return snapshot;
 });
 const r=analyze(funds,'equity',new Date());assert.equal(r.pairs.length,10);
 for(const p of r.pairs)assert.ok(p.overlap>=0&&p.overlap<=100);
});
