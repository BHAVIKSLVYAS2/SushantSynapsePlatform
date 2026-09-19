const {test} = require('node:test');
const assert = require('node:assert/strict');
const {aligned} = require('../apps/fund-overlap/frontend/analytics-engine');
const {createNavProvider} = require('../apps/fund-overlap/backend/nav-provider');
test('risk identifies worst observed drawdown, recovery, unrecovered loss and sparse volatility', () => {
  const {risk} = require('../apps/fund-overlap/frontend/analytics-engine');
  const history = {name:'Example Growth',rows:[100,120,90,100,120].map((nav,i) => ({date:`2024-01-0${i+1}`,nav}))};
  const r = risk(history,'2024-01-01','2024-01-05');assert.equal(r.drawdown,25);assert.equal(r.peak,'2024-01-02');assert.equal(r.trough,'2024-01-03');assert.equal(r.recoveryDays,3);assert.equal(r.volatility,null);
  assert.equal(risk(history,'2024-01-01','2024-01-04').recovered,null);
  const flat = {...history,rows:history.rows.map(r => ({...r,nav:100}))};assert.equal(risk(flat,'2024-01-01','2024-01-05').drawdown,0);
});
test('annualised volatility uses sample variance and rejects sparse histories', () => {
  const {risk} = require('../apps/fund-overlap/frontend/analytics-engine');let nav=100;
  const rows=Array.from({length:33},(_,i) => {if(i)nav*=i%2?1.1:0.9;return {date:new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10),nav};});
  const h={name:'Example Growth',rows};assert.ok(Math.abs(risk(h,rows[0].date,rows.at(-1).date).volatility-Math.sqrt(32*0.01/31*252)*100)<1e-8);
  const sparse={...h,rows:rows.map((r,i) => ({...r,date:new Date(Date.UTC(2024,0,1+30*i)).toISOString().slice(0,10)}))};assert.equal(risk(sparse,sparse.rows[0].date,sparse.rows.at(-1).date).volatility,null);
});
test('rolling returns compare common monthly windows with actual-day annualisation and no forward lookup', () => {
  const {rolling} = require('../apps/fund-overlap/frontend/analytics-engine');
  const start=Date.parse('2018-01-01'),end=Date.parse('2025-03-15');
  const rows=[];for(let date=start;date<=end;date+=86400000)rows.push({date:new Date(date).toISOString().slice(0,10),nav:100*Math.pow(1.1,(date-start)/86400000/365.25)});
  const a={code:'1',name:'Direct Growth',rows},b={code:'2',name:'Regular Growth',rows:rows.filter(r => r.date!=='2024-02-29')};
  for(const years of [1,3,5]){const r=rolling([a,b],years);assert.ok(r.windows.length>12);assert.equal(r.windows.at(-1).end,'2025-02-28');assert.ok(r.windows.every(w=>w.start<w.end));assert.ok(Math.abs(r.series[0].median-10)<1e-8);assert.equal(r.series[0].positive,100);assert.deepEqual(r.series[0].median,r.series[1].median);}
  const leap=rolling([a],1).windows.find(w=>w.end==='2024-02-29');assert.equal(leap.start,'2023-02-28');
  assert.throws(()=>rolling([{...a,name:'IDCW'}],1),/Growth/);assert.throws(()=>rolling([{...a,rows:rows.slice(-365)}],1),/two completed/);
  const gaps={...a,rows:rows.filter(r=>r.date<'2024-01-20'||r.date>'2024-02-10')};assert.ok(rolling([gaps],1).skipped>0);
});
test('NAV routes enforce app access, input validation and post-request session revocation', async () => {
  const {createFundOverlap} = require('../apps/fund-overlap/backend/routes');
  let allowed = false, user = {id:'owner'}, calls = 0;
  const handler = createFundOverlap({auth:{hasAppAccess:() => allowed,session:() => user},provider:{},nav:{history:async () => {calls++; return {code:'118955'};},plans:async () => ({plans:[]})}});
  const invoke = async route => {const res = {setHeader(){},writeHead(s){this.status=s;},end(body){this.body=body;}};await handler({route:'fund-overlap/'+route,method:'GET',req:{url:'/api/fund-overlap/'+route,headers:{}},res,user});return res;};
  await assert.rejects(invoke('nav/118955'),e => e.status===403);assert.equal(calls,0);
  allowed = true;await assert.rejects(invoke('nav/not-a-code'),e => e.status===404);assert.equal(calls,0);
  assert.equal((await invoke('nav/118955')).status,200); user = null;
  await assert.rejects(invoke('nav/118955'),e => e.status===401);
});
test('SIP handles month ends, next NAV, exact cash flows and rejects gaps', () => {
  const {sip,xirr} = require('../apps/fund-overlap/frontend/analytics-engine');
  const history = {name:'Example Growth',rows:[{date:'2024-01-31',nav:10},{date:'2024-03-01',nav:10},{date:'2024-04-01',nav:10},{date:'2024-04-30',nav:10}]};
  const r = sip(history,1000,'2024-01-31','2024-04-30');
  assert.equal(r.count,4); assert.equal(r.invested,4000); assert.equal(r.value,4000); assert.ok(Math.abs(r.annualised)<1e-8);
  assert.equal(r.payments[1].scheduled,'2024-02-29'); assert.equal(new Date(r.payments[1].date).toISOString().slice(0,10),'2024-03-01');
  assert.ok(Math.abs(xirr([{date:Date.parse('2023-01-01'),amount:-100},{date:Date.parse('2024-01-01'),amount:110}])-10)<0.02);
  assert.throws(() => sip(history,1000,'2024-02-01','2024-04-30'),/gap/);
  assert.throws(() => sip(history,1000,'2024-02-31','2024-04-30'),/valid/);
  assert.throws(() => sip(history,1000,'2023-01-01','2024-04-30'),/available/);
});
test('combined exposure aggregates shared stocks by actual allocation and preserves uncovered weight', () => {
  const {exposure} = require('../apps/fund-overlap/frontend/analytics-engine');
  const funds = [{holdings:[{isin:'A',name:'A',sector:'Banks',weight:50}]},{holdings:[{isin:'A',name:'A',sector:'Banks',weight:20},{isin:'B',name:'B',sector:'IT',weight:60}]}];
  const result = exposure(funds,[10000,30000]);
  assert.equal(result.total,40000); assert.equal(result.included,29000);
  assert.equal(result.stocks.find(r => r.isin === 'A').amount,11000); assert.equal(result.industries.find(r => r.name === 'Banks').percent,27.5);
  assert.throws(() => exposure(funds,[0,0]),/greater than zero/); assert.throws(() => exposure(funds,[NaN,10]),/non-negative/);
});
test('performance aligns exact shared dates and rejects short/distribution histories', () => {
  const a = {code:'118955',name:'Example Direct Growth',rows:[{date:'2023-01-01',nav:10},{date:'2024-01-01',nav:20},{date:'2024-06-01',nav:25}]};
  const b = {...a,code:'101762',name:'Example Regular Growth',rows:[{date:'2023-01-01',nav:10},{date:'2024-01-01',nav:15}]};
  const r = aligned([a,b],1); assert.equal(r.end,'2024-01-01'); assert.equal(r.series[0].returnPct,100); assert.equal(r.series[1].points.at(-1).value,15000);
  assert.throws(() => aligned([a,b],3),/Not enough/);
  assert.throws(() => aligned([{...a,name:'Example IDCW'}],1),/Growth/);
});
test('NAV provider keeps plan identity, validates dates and caches history', async () => {
  let calls = 0;
  const nav = createNavProvider({delayMs:0,fetchImpl:async () => {calls++; return Response.json({status:'SUCCESS',meta:{scheme_code:118955,scheme_name:'HDFC Direct Growth'},data:[{date:'01-01-2024',nav:'20'},{date:'01-01-2023',nav:'10'}]});}});
  assert.equal((await nav.history('118955')).rows[0].date,'2023-01-01'); await nav.history('118955'); assert.equal(calls,1);
  await assert.rejects(nav.history('101762'),/identity/);
  const bad = createNavProvider({delayMs:0,fetchImpl:async () => Response.json({status:'SUCCESS',meta:{scheme_code:118955,scheme_name:'Growth'},data:[{date:'31-02-2024',nav:'20'}]})});
  await assert.rejects(bad.history('118955'),/Invalid NAV/);
});
