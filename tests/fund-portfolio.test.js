const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{Readable}=require('node:stream'),{DatabaseSync}=require('node:sqlite');
const core=require('../apps/fund-overlap/frontend/portfolio-core');
const {Store}=require('../apps/advocate/backend/store');
const {createPortfolio}=require('../apps/fund-overlap/backend/portfolio');
const buy={schemeCode:'118955',date:'2023-01-01',type:'BUY',units:100,amount:1000,reference:'purchase'};
test('CSV supports BOM, quotes, precision and safe export roundtrips; rejects malformed rows',()=>{
 const rows=[buy,{...buy,reference:'comma, "quoted"'},{...buy,reference:'=SUM(1,2)'},{...buy,reference:"'original"}];
 assert.deepEqual(core.parseCsv('\uFEFF'+core.csv(rows)),rows);
 assert.throws(()=>core.parseCsv('scheme_code,date,type,units,amount\n118955,2023-01-01,BUY,1,"100'),/Unclosed/);
 assert.throws(()=>core.parseCsv('scheme_code,date,type,units,amount\n118955,2023-02-30,BUY,1,100'),/Row 2/);
 for(const patch of [{type:'__proto__'},{amount:true},{units:null},{units:0.0000001},{amount:1.001},{date:'2099-01-01'}])assert.throws(()=>core.clean({...buy,...patch}));
});
test('unit balance and cash-flow valuation include redemptions/distributions without assuming missing quotes are zero',()=>{
 const sell={...buy,type:'SELL',units:50,amount:750,date:'2024-01-01',reference:'redemption'};
 const h={'118955':{name:'Example Growth',rows:[{date:'2024-01-01',nav:20}]}};
 const result=core.valuation([buy,sell],h);assert.equal(result.value,1000);assert.equal(result.gain,750);assert.equal(result.funds[0].units,50);assert.ok(Math.abs(result.xirr.value-75)<0.1);
 const dividend={...sell,type:'DIVIDEND',units:0,amount:50};assert.equal(core.valuation([buy,sell,dividend],h).gain,800);
 assert.equal(core.valuation([buy],{}).value,null);assert.equal(core.valuation([buy],{}).funds[0].value,null);
 assert.equal(core.valuation([buy,{...sell,units:100}],{}).value,0);
 assert.throws(()=>core.sequence([buy,{...sell,units:100.000001}]),/exceeds/);
 const other={...buy,schemeCode:'101762'};assert.equal(core.valuation([buy,other],{...h,'101762':{name:'Other',rows:[{date:'2024-01-02',nav:10}]}}).value,null);
});
test('portfolio XIRR reports ambiguous flows and uses actual dates',()=>{
 const f=(date,amount)=>({date,amount});
 assert.ok(Math.abs(core.cashReturn([f('2023-01-01',-100),f('2024-01-01',110)]).value-10)<0.02);
 assert.equal(core.cashReturn([f('2021-01-01',-100),f('2022-01-01',230),f('2023-01-01',-132)]).value,null);
 assert.match(core.cashReturn([f('2021-01-01',-100),f('2022-01-01',230),f('2023-01-01',-132)]).reason,/Multiple/);
});
test('portfolio migration/API preserves existing SQLite records, isolates users, imports atomically and exports/restores',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fund-portfolio-'));let store=new Store(dir);
 try{
  for(const id of ['a','b'])store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,id,id+'@test.test','Clerk','test-only');
  store.create('clients',{name:'Preserved client'});const original=store.all('clients');let current={id:'a',role:'Clerk'},allowed=true;
  const auth={session:()=>current,hasAppAccess:()=>allowed},nav={history:async code=>({code,name:'Verified '+code+' Growth',rows:[{date:'2024-01-01',nav:20}]})};
  let handler=createPortfolio({store,auth,nav});
  const call=async(method,route='',body={})=>{let value,status;const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.headers={'content-type':'application/json'};await handler({route:'fund-overlap/portfolio'+route,method,req,user:current,res:{setHeader(){},writeHead(s){status=s;},end(s){value=JSON.parse(s);}}});return {status,...value};};
  assert.equal((await call('GET')).revision,0);
  const preview=await call('POST','/preview',{revision:0,transactions:[buy]});assert.equal(preview.transactions.length,1);assert.equal((await call('GET')).transactions.length,0);
  let saved=await call('POST','/transactions',{revision:0,transactions:[buy]});assert.equal(saved.revision,1);const id=saved.transactions[0].id;
  assert.equal((await call('POST','/transactions',{revision:1,transactions:[buy]})).duplicates,1);
  await assert.rejects(call('POST','/transactions',{revision:0,transactions:[buy]}),e=>e.status===409);
  const sell={...buy,type:'SELL',date:'2024-01-01',units:50,amount:750};
  await assert.rejects(call('POST','/transactions',{revision:1,transactions:[sell,{...sell,units:80}]}),/exceeds/);assert.equal((await call('GET')).transactions.length,1);
  saved=await call('POST','/transactions',{revision:1,transactions:[sell]});assert.equal(saved.transactions.length,2);
  await assert.rejects(call('DELETE','/transactions/'+id,{revision:2}),/exceeds/);
  assert.equal((await call('GET','/value')).value,1000);
  current={id:'b',role:'Clerk'};assert.equal((await call('GET')).transactions.length,0);await assert.rejects(call('DELETE','/transactions/'+id,{revision:0}),e=>e.status===404);
  allowed=false;await assert.rejects(call('GET'),e=>e.status===403);allowed=true;current={id:'a',role:'Clerk'};
  const sql=store.exportSql(),restored=new DatabaseSync(':memory:');restored.exec(sql);assert.equal(restored.prepare('SELECT count(*) n FROM fund_lens_transactions').get().n,2);restored.close();
  store.sql.close();store=new Store(dir);handler=createPortfolio({store,auth,nav});assert.equal((await call('GET')).transactions.length,2);assert.deepEqual(store.all('clients'),original);assert.equal(store.sql.prepare('SELECT count(*) n FROM fund_lens_migrations').get().n,1);
  const changed=await call('PATCH','/transactions/'+id,{revision:2,transaction:{...buy,amount:1200}});assert.equal(changed.revision,3);
 }finally{store.sql.close();if(path.dirname(dir)===path.resolve(os.tmpdir()))fs.rmSync(dir,{recursive:true,force:true});}
});
