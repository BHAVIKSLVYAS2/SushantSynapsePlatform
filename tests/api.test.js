const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
let child,base,cookie='',client,caseRecord;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chambers-api-'));
const password='Reliable test password 2026!';
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
async function start(){child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let out='';const timeout=setTimeout(()=>reject(Error('Server startup timeout')),10000);child.stdout.on('data',chunk=>{out+=chunk;const match=out.match(/localhost:(\d+)/);if(match){base='http://127.0.0.1:'+match[1];clearTimeout(timeout);resolve();}});child.stderr.on('data',()=>{});child.once('error',reject);child.once('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code));});});}
async function stop(){if(child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
async function request(route,method='GET',body,options={}){const r=await fetch(base+'/api/'+route,{method,headers:{'Content-Type':'application/json',Cookie:options.cookie??cookie,...options.headers},body:body?JSON.stringify(body):undefined});const set=r.headers.get('set-cookie');const data=await r.json();return {status:r.status,data,cookie:set?.split(';')[0],headers:r.headers};}
async function state(){return (await request('state')).data;}
async function create(kind,body){const r=await request(kind,'POST',body);assert.equal(r.status,201,JSON.stringify(r.data));return r.data;}
async function patch(kind,record,body){return request(kind+'/'+record.id,'PATCH',{version:record.version,...body});}
before(start);after(async()=>{await stop();fs.rmSync(dir,{recursive:true,force:true});});

test('owner setup, session cookie, authentication boundary and setup lock',async()=>{
 assert.equal((await request('state')).status,401);
 assert.equal((await request('auth/status')).data.setupRequired,true);
 assert.equal((await request('auth/setup','POST',{name:'Owner',email:'owner@example.com',firmName:'Test Chambers',password:'short'})).status,400);
 const r=await request('auth/setup','POST',{name:'Test Owner',email:'owner@example.com',firmName:'Test Chambers',password});assert.equal(r.status,201);cookie=r.cookie;
 assert.match(r.headers.get('set-cookie'),/HttpOnly/);assert.match(r.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await request('auth/setup','POST',{})).status,409);
 assert.equal((await state()).currentUser.role,'Owner');
 const sql=new DatabaseSync(path.join(dir,'chambers.sqlite'));const stored=sql.prepare('SELECT password FROM users').get();assert.notEqual(stored.password,password);assert.equal(stored.password.includes(password),false);sql.close();
});
test('client and case creation, stable references, validation and concurrent updates',async()=>{
 client=await create('clients',{name:'Client One',email:'client@example.com'});
 assert.equal((await request('cases','POST',{title:'Case',clientId:'missing',court:'Delhi High Court'})).status,400);
 assert.equal((await request('cases','POST',{title:'Case',clientId:client.id,court:'Delhi High Court',cnr:'bad'})).status,400);
 caseRecord=await create('cases',{title:'Client One v. Respondent',clientId:client.id,court:'Delhi High Court',cnr:'DLCT010000012026',filingDate:'2026-01-01'});
 assert.equal((await request('cases','POST',{title:'Duplicate',clientId:client.id,court:'Delhi',cnr:caseRecord.cnr})).status,409);
 assert.equal((await patch('cases',caseRecord,{filingDate:'2026-02-30'})).status,400);
 assert.equal((await patch('cases',caseRecord,{stage:'Invented'})).status,400);
 let r=await patch('cases',caseRecord,{stage:'Evidence'});assert.equal(r.status,200);
 assert.equal((await patch('cases',caseRecord,{stage:'Arguments'})).status,409);caseRecord=r.data;
 r=await patch('clients',client,{name:'Renamed Client'});client=r.data;assert.equal((await state()).cases.find(c=>c.id===caseRecord.id).clientId,client.id);
});
test('hearing outcome and next date are one transaction, completion removes next date',async()=>{
 const h=await create('hearings',{caseId:caseRecord.id,date:today,time:'10:30',purpose:'Arguments'});
 assert.equal((await state()).cases.find(c=>c.id===caseRecord.id).nextDate,today);
 let r=await request('hearings/'+h.id+'/outcome','POST',{version:h.version,status:'Adjourned',outcome:'Adjourned for evidence',nextDate:'2099-02-30',nextTime:'11:00',nextPurpose:'Evidence'});assert.equal(r.status,400);
 assert.equal((await state()).hearings.find(x=>x.id===h.id).status,'Scheduled');
 r=await request('hearings/'+h.id+'/outcome','POST',{version:h.version,status:'Adjourned',outcome:'Adjourned for evidence',nextDate:'2099-10-02',nextTime:'11:00',nextPurpose:'Evidence'});assert.equal(r.status,200);
 let s=await state();assert.equal(s.cases.find(c=>c.id===caseRecord.id).nextDate,'2099-10-02');const next=s.hearings.find(x=>x.id!==h.id&&x.caseId===caseRecord.id);
 assert.equal((await patch('hearings',next,{status:'Completed',outcome:'Concluded'})).status,200);
 assert.equal((await state()).cases.find(c=>c.id===caseRecord.id).nextDate,'');
});
test('tasks, notes and expenses complete CRUD with archive and restore',async()=>{
 const task=await create('tasks',{title:'Review filing',caseId:caseRecord.id,due:today});let r=await patch('tasks',task,{status:'Done'});assert.equal(r.data.status,'Done');
 const note=await create('notes',{caseId:caseRecord.id,title:'Client call',body:'Discussed the next hearing.',date:today,type:'Client call'});
 r=await patch('notes',note,{archived:true});assert.equal(r.data.archived,true);r=await patch('notes',r.data,{archived:false});assert.equal(r.data.archived,false);
 const expense=await create('expenses',{description:'Court fee',caseId:caseRecord.id,amount:125.50,date:today,billable:true});assert.equal(expense.amount,125.50);
 assert.equal((await request('expenses','POST',{description:'Invalid',amount:12.345,date:today})).status,400);
});
test('partial payments, no overpayment, void/reinstate, invoice integrity',async()=>{
 const invoice=await create('invoices',{clientId:client.id,caseId:caseRecord.id,description:'Professional fees',amount:1000,date:'2026-01-01',due:today});
 assert.equal((await request('payments','POST',{invoiceId:invoice.id,amount:1,date:'2099-01-01'})).status,400);
 const payment=await create('payments',{invoiceId:invoice.id,amount:400,date:today,method:'UPI'});
 let i=(await state()).invoices.find(x=>x.id===invoice.id);assert.equal(i.balance,600);assert.equal(i.status,'Part paid');
 assert.equal((await request('payments','POST',{invoiceId:invoice.id,amount:601,date:today})).status,400);
 assert.equal((await patch('invoices',invoice,{amount:399})).status,400);
 assert.equal((await patch('invoices',invoice,{archived:true})).status,400);
 let r=await patch('payments',payment,{archived:true});assert.equal(r.status,200);assert.equal((await state()).invoices.find(x=>x.id===invoice.id).balance,1000);
 r=await patch('payments',r.data,{archived:false});assert.equal(r.status,200);
 await create('payments',{invoiceId:invoice.id,amount:600,date:today});i=(await state()).invoices.find(x=>x.id===invoice.id);assert.equal(i.status,'Paid');assert.equal(i.balance,0);
 assert.equal((await patch('cases',caseRecord,{clientId:(await create('clients',{name:'Different client'})).id})).status,400);
});
test('authenticated file upload/download, exact bytes, invalid content',async()=>{
 const content=Buffer.from('Document payload \u0000 with Unicode ₹').toString('base64');
 const doc=await create('documents',{caseId:caseRecord.id,name:'Order',category:'Order',content,originalName:'court-order.txt'});
 let response=await fetch(base+'/api/documents/'+doc.id+'/download',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from(content,'base64'));assert.match(response.headers.get('content-disposition'),/court-order.txt/);
 response=await fetch(base+'/api/documents/'+doc.id+'/download');assert.equal(response.status,401);
 assert.equal((await request('documents','POST',{caseId:caseRecord.id,name:'Bad',content:'bad-base64!',originalName:'bad.txt'})).status,400);
 assert.equal(Object.hasOwn((await state()).documents.find(d=>d.id===doc.id),'content'),false);
});
test('clerk permissions, owner protection, revoked sessions',async()=>{
 const clerk=await create('users',{name:'Test Clerk',email:'clerk@example.com',role:'Clerk',password});
 const login=await request('auth/login','POST',{email:clerk.email,password});const cc=login.cookie;
 assert.equal((await request('invoices','POST',{},{cookie:cc})).status,403);
 assert.equal((await request('backup','GET',null,{cookie:cc})).status,403);
 assert.equal((await request('users','POST',{},{cookie:cc})).status,403);
 assert.equal((await request('tasks','POST',{title:'Clerk task',due:today},{cookie:cc})).status,201);
 const owner=(await state()).currentUser;assert.equal((await request('users/'+owner.id,'PATCH',{active:false})).status,400);
 assert.equal((await request('users/'+clerk.id,'PATCH',{active:false})).status,200);
 assert.equal((await request('state','GET',null,{cookie:cc})).status,401);
 assert.equal((await request('auth/login','POST',{email:clerk.email,password})).status,401);
});
test('origin, content type, invalid routes, login failure',async()=>{
 assert.equal((await request('clients','POST',{name:'Blocked'},{headers:{Origin:'https://untrusted.example'}})).status,403);
 assert.equal((await request('clients','POST',{name:'Blocked'},{headers:{'Content-Type':'text/plain'}})).status,415);
 assert.equal((await request('clients/'+client.id+'/unknown','POST',{})).status,404);
 assert.equal((await request('auth/login','POST',{email:'owner@example.com',password:'not valid'})).status,401);
});
test('validated backup restore, records/files retained, failed restore is nondestructive',async()=>{
 const backup=(await request('backup')).data;const before=await state();
 const bad=structuredClone(backup);bad.records.cases[0].clientId='missing';
 assert.equal((await request('restore','POST',{confirm:'RESTORE',backup:bad})).status,400);
 assert.equal((await state()).cases.length,before.cases.length);
 await create('clients',{name:'After backup'});
 assert.equal((await request('restore','POST',{confirm:'RESTORE',backup})).status,200);
 const restored=await state();assert.equal(restored.clients.length,before.clients.length);assert.equal(restored.documents.length,before.documents.length);assert.equal(restored.users.length,before.users.length);assert.ok(restored.activity.some(a=>a.action==='Restored backup'));
 const doc=restored.documents[0];assert.equal((await fetch(base+'/api/documents/'+doc.id+'/download',{headers:{Cookie:cookie}})).status,200);
 assert.ok(fs.readdirSync(path.join(dir,'backups')).some(n=>n.startsWith('before-restore-')));
 assert.equal((await patch('clients',client,{name:'Stale after restore'})).status,409);
});
test('SQL database export restores schema, accounts, records, documents and queryable balances',async()=>{
 let response=await fetch(base+'/api/backup.sql');assert.equal(response.status,401);
 response=await fetch(base+'/api/backup.sql',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/\.sql/);
 const dump=await response.text();const recovered=new DatabaseSync(':memory:');recovered.exec(dump);
 const s=await state();assert.equal(recovered.prepare('SELECT COUNT(*) n FROM clients').get().n,s.clients.length);
 assert.equal(recovered.prepare('SELECT COUNT(*) n FROM users').get().n,s.users.length);
 assert.equal(recovered.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);
 assert.equal(recovered.prepare('SELECT COUNT(*) n FROM files').get().n,s.documents.length);
 for(const balance of recovered.prepare('SELECT * FROM invoice_balances').all())assert.equal(balance.balance,s.invoices.find(i=>i.id===balance.id).balance);
 assert.equal(recovered.prepare('PRAGMA integrity_check').get().integrity_check,'ok');recovered.close();
});
test('platform catalogue, favourites, recent launches and app-access enforcement',async()=>{
 const p=await request('platform');assert.equal(p.status,200);assert.equal(p.data.name,'Sushant Synapse Platform');assert.equal(p.data.apps.find(a=>a.id==='advocate').path,'/advocate');
 assert.equal((await request('platform/preferences','PATCH',{favorites:['advocate']})).status,200);
 assert.equal((await request('platform/preferences','PATCH',{favorites:['projects']})).status,400);
 assert.equal((await request('platform/apps/advocate/launch','POST',{})).data.path,'/advocate');
 assert.equal((await request('platform/apps/projects/launch','POST',{})).status,404);
 let info=(await request('platform')).data;assert.deepEqual(info.preferences.favorites,['advocate']);assert.equal(info.preferences.recent[0].id,'advocate');
 const member=await create('users',{name:'Platform Member',email:'platform@example.com',role:'Advocate',password,appIds:[]});
 const cc=(await request('auth/login','POST',{email:member.email,password})).cookie;
 const options={cookie:cc};info=(await request('platform','GET',null,options)).data;assert.equal(info.apps.find(a=>a.id==='advocate').accessible,false);assert.equal(info.team,undefined);
 assert.equal((await request('state','GET',null,options)).status,403);
 assert.equal((await request('platform/apps/advocate/launch','POST',{},options)).status,403);
 assert.equal((await request('platform/access/'+member.id,'PATCH',{appIds:['advocate']},options)).status,403);
 assert.equal((await request('platform/access/'+member.id,'PATCH',{appIds:['advocate']})).status,200);
 assert.equal((await request('state','GET',null,options)).status,200);
 assert.equal((await request('auth/profile','PATCH',{name:'Updated Member',email:member.email,role:'Owner'},options)).data.role,'Advocate');
 assert.equal((await request('platform/access/'+member.id,'PATCH',{appIds:[]})).status,200);
 assert.equal((await request('state','GET',null,options)).status,403);
 assert.equal((await request('documents/'+(await state()).documents[0].id+'/download','GET',null,options)).status,403);
 assert.match(await (await fetch(base+'/')).text(),/Sushant Synapse Platform/);
 assert.match(await (await fetch(base+'/advocate')).text(),/Chambers/);
 assert.equal((await fetch(base+'/healthz')).status,200);
});
test('password change revokes prior sessions, restart persists business data and login',async()=>{
 const other=(await request('auth/login','POST',{email:'owner@example.com',password})).cookie;
 const r=await request('auth/password','POST',{currentPassword:password,newPassword:password+'new'});assert.equal(r.status,200);cookie=r.cookie;
 assert.equal((await request('state','GET',null,{cookie:other})).status,401);
 const s=await state();await stop();await start();assert.equal((await state()).cases.length,s.cases.length);
 assert.equal((await request('auth/login','POST',{email:'owner@example.com',password})).status,401);
 const login=await request('auth/login','POST',{email:'owner@example.com',password:password+'new'});assert.equal(login.status,200);cookie=login.cookie;
 assert.equal((await request('auth/logout','POST')).status,200);assert.equal((await request('state')).status,401);
});

test('legacy JSON migration preserves IDs, payments, documents and next hearing',()=>{
 const legacyDir=fs.mkdtempSync(path.join(os.tmpdir(),'chambers-legacy-'));
 fs.writeFileSync(path.join(legacyDir,'records.json'),JSON.stringify({clients:[{id:'p1',name:'Legacy client'}],cases:[{id:'c1',title:'Legacy case',client:'Legacy client',court:'Delhi',nextDate:'2099-01-01'}],hearings:[],tasks:[],invoices:[{id:'i1',client:'Legacy client',description:'Old fees',amount:500,due:'2026-01-01',status:'Paid'}],documents:[{id:'d1',caseId:'c1',name:'old.txt',content:'data:text/plain;base64,SGVsbG8='}]}));
 const {Store}=require('../lib/store');const s=new Store(legacyDir);const data=s.state();assert.equal(data.cases[0].clientId,'p1');assert.equal(data.cases[0].nextDate,'2099-01-01');assert.equal(data.invoices[0].balance,0);assert.equal(Buffer.from(s.file('d1').content).toString(),'Hello');assert.ok(fs.existsSync(path.join(legacyDir,'records.json')));s.sql.close();fs.rmSync(legacyDir,{recursive:true,force:true});
});
