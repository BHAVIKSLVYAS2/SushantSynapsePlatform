const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../apps/fund-overlap/frontend/performance-engine');
const csv='scheme_code,scheme_name,date,nav\n';
test('local CSV validates exact Growth plans, ordering, duplicates and AMFI text',()=>{
 const h=E.parse(csv+'123456,Example Direct Growth,2024-01-02,110\n123456,Example Direct Growth,2023-01-02,100\n123456,Example Direct Growth,2023-01-02,100');assert.equal(h[0].rows.length,2);assert.equal(h[0].rows[0].nav,100);
 const amfi=E.parse('Example AMC\nScheme Code;Scheme Name;Net Asset Value;Date\n123456;Example Direct Growth;100;02-Jan-2023\n123456;Example Direct Growth;110;02-Jan-2024');assert.deepEqual(amfi,h);
 for(const tail of ['123456,Example IDCW Growth,2024-01-02,100','123456,Example Growth,2024-02-31,100','123456,Example Growth,2024-01-02,-1','123456,Example Growth,2099-01-02,100'])assert.throws(()=>E.parse(csv+tail));
 assert.throws(()=>E.parse(csv+'123456,Example Growth,2024-01-02,100\n123456,Example Growth,2024-01-02,101'),/Conflicting/);
 assert.throws(()=>E.parse('x'.repeat(2000001)),/2 MB/);
});
test('matching endpoints, total/CAGR returns, drawdown and full-history growth',()=>{
 const h=E.parse(csv+'123456,Example Direct Growth,2023-01-02,100\n123456,Example Direct Growth,2023-06-02,80\n123456,Example Direct Growth,2024-01-02,121\n123457,Other Regular Growth,2023-01-02,50\n123457,Other Regular Growth,2023-06-02,55\n123457,Other Regular Growth,2024-01-02,60');
 const r=E.compare(h,1);assert.equal(r.start,'2023-01-02');assert.equal(r.end,'2024-01-02');assert.equal(r.series[0].value,12100);assert.ok(Math.abs(r.series[0].returnPct-21)<1e-9);assert.ok(Math.abs(r.series[0].drawdown-20)<1e-9);assert.ok(Math.abs(r.series[0].cagr-(1.21**(365.25/365)-1)*100)<1e-9);assert.ok(r.gap>7);assert.throws(()=>E.compare(h,3),/Not enough/);
});
test('requires matching dates and close year boundaries without fabricating returns',()=>{
 const a=E.parse(csv+'123456,Example Growth,2023-01-02,100\n123456,Example Growth,2024-01-02,110');
 const b=E.parse(csv+'123457,Other Growth,2023-02-02,100\n123457,Other Growth,2024-02-02,110');assert.throws(()=>E.compare([...a,...b]),/matching/);
 const sparse=E.parse(csv+'123456,Example Growth,2022-01-02,100\n123456,Example Growth,2024-01-02,110');assert.throws(()=>E.compare(sparse,1),/Not enough/);assert.equal(E.compare(sparse,0).series[0].value,11000);
});
