const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Readable}=require('node:stream'),{randomUUID}=require('node:crypto');
const {empty,apply,view}=require('../apps/batchfee-lite/backend/engine');
const {createBatchFee}=require('../apps/batchfee-lite/backend/routes');
const {Store}=require('../apps/advocate/backend/store');
const {DatabaseSync}=require('node:sqlite');
const profile={name:'Aarohan Academy',owner:'Meera Shah',mobile:'9876543210',dueDay:5,sessionMonth:4,currency:'INR'};
const batch={name:'Class 10 Maths',fee:'1500',frequency:'Monthly',dueDay:5,active:true};
const student={name:'Rahul Patel',parent:'Amit Patel',mobile:'9876543210',family:'Patel family',joining:'2026-07-15',status:'Active',enrolments:[{batchId:'batch-001'}]};
function fixture(day='2026-07-15'){const s=empty();for(const [type,input,id]of [['profile',profile,'profile-001'],['batch',batch,'batch-001'],['student',student,'student-001']])apply(s,{type,input,id},day);return s;}
const run=(s,type,input={},day='2026-09-27')=>apply(s,{id:randomUUID(),type,input},day);
test('BatchFee recurring fees are unique, clamp month-end, respect joining and preserve historical amounts',()=>{
 const s=fixture();assert.equal(s.fees[0].due,'2026-07-15');run(s,'sync');run(s,'sync');assert.equal(s.fees.length,3);
 run(s,'student',{...student,id:'student-001',enrolments:[{batchId:'batch-001',fee:'1800',dueDay:31}]});run(s,'sync',{},'2027-02-28');assert.equal(s.fees.find(f=>f.period==='2026-09').amount,150000);assert.equal(s.fees.find(f=>f.period==='2027-02').due,'2027-02-28');assert.equal(s.fees.find(f=>f.period==='2027-02').amount,180000);
 const future=empty();apply(future,{type:'batch',input:batch,id:'batch-001'},'2026-09-01');apply(future,{type:'student',input:{...student,joining:'2026-09-20'},id:'student-001'},'2026-09-01');assert.equal(future.fees.length,0);run(future,'sync',{},'2026-09-20');assert.equal(future.fees.length,1);assert.equal(future.fees[0].due,'2026-09-20');
});
test('BatchFee partial/advance allocations, corrections and waivers conserve every paise',()=>{
 const s=fixture('2026-07-15');run(s,'payment',{studentId:'student-001',amount:'1000',date:'2026-07-15',mode:'UPI'},'2026-07-15');let v=view(s,'2026-07-15');assert.equal(v.fees[0].status,'Partially Paid');assert.equal(v.fees[0].balance,50000);
 run(s,'payment',{studentId:'student-001',amount:'3500',date:'2026-07-15',mode:'Cash'},'2026-07-15');assert.equal(view(s).payments[1].credit,300000);const receipt=structuredClone(s.payments[1].receipt);run(s,'sync');v=view(s);assert.equal(v.payments[1].credit,0);assert.equal(v.fees.reduce((n,f)=>n+f.balance,0),0);assert.deepEqual(s.payments[1].receipt,receipt);
 run(s,'reverse',{id:s.payments[1].id,reason:'Accidental entry'});v=view(s);assert.equal(v.fees.reduce((n,f)=>n+f.balance,0),350000);assert.equal(v.payments[1].amount,350000);assert.ok(v.payments[1].reversed);run(s,'waive',{id:s.fees[0].id,reason:'Concession'});assert.equal(view(s).fees[0].balance,0);assert.equal(view(s).fees[0].status,'Waived');assert.throws(()=>run(s,'payment',{studentId:'student-001',amount:'-1',date:'2026-09-27',mode:'Cash'}));assert.throws(()=>run(s,'payment',{studentId:'student-001',amount:'1.001',date:'2026-09-27',mode:'Cash'}));
});
test('BatchFee paused, inactive and quarterly/one-time students avoid back-billing skipped months',()=>{
 const s=fixture();run(s,'student',{...student,id:'student-001',status:'Paused'},'2026-07-20');run(s,'sync',{},'2026-09-27');assert.equal(s.fees.length,1);run(s,'student',{...student,id:'student-001',status:'Active'});run(s,'sync',{},'2026-10-05');assert.equal(s.fees.length,2);
 run(s,'student',{...student,id:'student-001',status:'Inactive'},'2026-10-06');run(s,'sync',{},'2027-03-01');assert.equal(s.fees.length,2);
 const q=empty();apply(q,{type:'batch',id:'batch-001',input:{...batch,frequency:'Quarterly'}},'2026-01-01');apply(q,{type:'student',id:'student-001',input:{...student,joining:'2026-01-01'}},'2026-01-01');run(q,'sync');assert.equal(q.fees.length,3);assert.deepEqual(q.fees.map(f=>f.period),['2026-01','2026-04','2026-07']);
 const o=empty();apply(o,{type:'batch',id:'batch-001',input:{...batch,frequency:'One-time'}},'2026-01-01');apply(o,{type:'student',id:'student-001',input:{...student,joining:'2026-01-01'}},'2026-01-01');run(o,'sync');assert.equal(o.fees.length,1);
});
test('BatchFee multiple batches, concessions and frequency changes apply prospectively without backdated charges',()=>{
 const s=fixture();apply(s,{type:'batch',id:'dance-001',input:{...batch,name:'Dance',fee:'800'}},'2026-09-27');
 run(s,'student',{...student,id:'student-001',enrolments:[{batchId:'batch-001',fee:1500,discount:300},{batchId:'dance-001',fee:800}]});assert.equal(s.fees.length,3);run(s,'sync',{},'2026-10-01');let v=view(s);assert.equal(v.fees.filter(f=>f.period==='2026-10').length,2);assert.equal(v.fees.find(f=>f.period==='2026-10'&&f.batchId==='batch-001').amount,120000);
 run(s,'student',{...student,id:'student-001',enrolments:[{batchId:'batch-001',frequency:'Quarterly'}]},'2026-10-02');run(s,'sync',{},'2027-02-01');assert.deepEqual(s.fees.filter(f=>f.batchId==='batch-001').map(f=>f.period),['2026-07','2026-08','2026-09','2026-10','2026-11','2027-02']);
 const o=empty();apply(o,{type:'batch',id:'batch-001',input:{...batch,frequency:'One-time'}},'2026-01-01');apply(o,{type:'student',id:'student-001',input:{...student,joining:'2026-01-01'}},'2026-01-01');run(o,'student',{...student,id:'student-001',enrolments:[{batchId:'batch-001',frequency:'Monthly'}]});assert.equal(o.fees.length,1);run(o,'sync',{},'2026-10-05');assert.equal(o.fees.length,2);assert.equal(o.fees[1].period,'2026-10');
});
test('BatchFee deposits before joining remain traceable and invalid phones/times/statuses are rejected',()=>{
 const s=empty();apply(s,{type:'batch',id:'batch-001',input:batch},'2026-09-01');apply(s,{type:'student',id:'student-001',input:{...student,joining:'2026-10-10'}},'2026-09-01');run(s,'payment',{studentId:'student-001',amount:'4500',date:'2026-09-01',mode:'Bank Transfer'},'2026-09-01');assert.equal(view(s).payments[0].credit,450000);run(s,'sync',{},'2026-10-10');assert.equal(view(s).payments[0].credit,300000);assert.equal(view(s).fees[0].balance,0);assert.equal(s.payments[0].receipt.advance,450000);
 for(const input of [{...batch,startTime:'25:00'},{...batch,active:'banana'}])assert.throws(()=>run(s,'batch',input));assert.throws(()=>run(s,'student',{...student,mobile:'12--------'}));assert.throws(()=>run(s,'student',{...student,whatsapp:'123'}));
});
test('BatchFee API enforces access, atomic import, revisions, idempotency, additive restore and SQL persistence',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'batchfee-api-'));let store=new Store(dir),allowed=true,user={id:'owner',role:'Owner'};
 try{store.create('clients',{name:'Preserve Chambers'});const old=store.all('clients');let handler=createBatchFee({store,auth:{hasAppAccess:()=>allowed}});
 const call=async(method,route='',body={})=>{const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.headers={'content-type':'application/json'};let result;await handler({route:'batchfee-lite'+route,method,req,user,json:(status,data)=>{result={status,...data};}});return result;};
 let s=await call('GET');const cmd=async(type,input,key=randomUUID(),revision=s.revision)=>{s=await call('POST','/command',{type,input,requestId:key,revision});return s;};
 await cmd('profile',profile);await cmd('batch',batch,'batch-001');await cmd('student',student,'student-001');const key=randomUUID(),payment={studentId:'student-001',amount:'1000',date:'2026-09-01',mode:'Cash'};await cmd('payment',payment,key);const rev=s.revision;await cmd('payment',payment,key,rev-1);assert.equal(s.revision,rev);assert.equal(s.payments.length,1);
 await assert.rejects(cmd('payment',{...payment,amount:1100},key),/key reused/);await assert.rejects(cmd('payment',payment),/matching payment/);await assert.rejects(cmd('profile',profile,randomUUID(),0),/Data changed/);
 await assert.rejects(cmd('import',{students:[{...student,name:'Priya'}, {...student,name:'Riya',mobile:'bad'}]}),/mobile/);assert.equal((await call('GET')).students.length,1);
 const backup=await call('GET','/backup');await cmd('expense',{date:'2026-09-01',amount:500,category:'Rent'});await assert.rejects(call('POST','/restore',{revision:s.revision,backup}),/older/);assert.equal((await call('GET')).expenses.length,1);
 const full=await call('GET','/backup');await call('POST','/restore',{revision:s.revision,backup:full});assert.deepEqual(store.all('clients'),old);const sql=store.exportSql();assert.match(sql,/batchfee_events/);
 const sqlCopy=new DatabaseSync(':memory:');try{sqlCopy.exec(sql);assert.equal(sqlCopy.prepare('SELECT count(*) n FROM batchfee_events').get().n,full.events.length);assert.equal(JSON.parse(sqlCopy.prepare('SELECT data FROM batchfee_workspace').get().data).payments.length,1);}finally{sqlCopy.close();}
 const recovered=new Store(path.join(dir,'recovery')),originalHandler=handler;try{handler=createBatchFee({store:recovered,auth:{hasAppAccess:()=>true}});const bad=structuredClone(full);bad.events.at(-1).data.input.amount='not-money';await assert.rejects(call('POST','/restore',{revision:0,backup:bad}));assert.equal((await call('GET')).students.length,0);const restored=await call('POST','/restore',{revision:0,backup:full});assert.equal(restored.payments.length,1);assert.equal(restored.expenses.length,1);assert.equal(restored.fees[0].amount,150000);assert.equal(restored.payments[0].amount,100000);}finally{handler=originalHandler;recovered.sql.close();}
 allowed=false;await assert.rejects(call('GET'),e=>e.status===403);allowed=true;user={id:'staff',role:'Clerk'};await assert.rejects(call('GET'),e=>e.status===403);user=null;await assert.rejects(call('GET'),e=>e.status===401);user={id:'owner',role:'Owner'};
 store.sql.close();store=new Store(dir);handler=createBatchFee({store,auth:{hasAppAccess:()=>true}});assert.equal((await call('GET')).payments.length,1);assert.deepEqual(store.all('clients'),old);
 }finally{store.sql.close();fs.rmSync(dir,{recursive:true,force:true});}
});
