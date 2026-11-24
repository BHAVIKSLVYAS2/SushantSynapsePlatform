'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {SqlServerDatabase}=require('../packages/database/sqlserver');
const {importSqlite}=require('../packages/database/sqlserver-transfer');
const {tables}=require('../packages/database/catalog');
const {createAuth}=require('../packages/auth');
const {createDigitalSamaj}=require('../apps/digital-samaj/backend/routes');
const {createBatchFee}=require('../apps/batchfee-lite/backend/routes');
const {createTournament}=require('../apps/tournament-lite/backend/routes');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-sql-integration-'));
let source,target,store;
async function main(){
 source=new Store(path.join(root,'source'),{provider:'sqlite'});
 const auth=createAuth({store:source,initializeWorkspace(){}});
 for(const [id,role]of [['owner','Owner'],['reviewer','Owner'],['clerk','Clerk']])source.sql.prepare('INSERT INTO [platform].[users] VALUES(?,?,?,?,?,1)').run(id,id,id+'@example.test',role,'unused');
 source.setAccess('clerk',['advocate']);source.setPreferences('owner',{favorites:['advocate'],recent:[]});
 source.create('clients',{id:'retained-client',name:'हिन्दी client'});source.addFile('retained-document','test.bin','application/octet-stream',Buffer.from([0,1,255]));
 createDigitalSamaj({store:source,auth});createBatchFee({store:source,auth});createTournament({store:source,auth});
 source.sql.exec(fs.readFileSync(path.join(__dirname,'../packages/database/retired/fund-lens/001-portfolio.sql'),'utf8'));
 for(const file of ['001-editions.sql','002-fetch-budget.sql'])source.sql.exec(fs.readFileSync(path.join(__dirname,'../packages/database/retired/news',file),'utf8'));
 source.sql.close();source=null;
 console.log('SQL integration: initializing eight schemas');target=new SqlServerDatabase({migrate:true});
 console.log('SQL integration: migrating isolated SQLite snapshot');const migrated=importSqlite(target,path.join(root,'source/chambers.sqlite'));
 assert.equal(migrated.tables.length,Object.keys(tables).length-1);assert.equal(migrated.sessionsMigrated,false);
 assert.throws(()=>importSqlite(target,path.join(root,'source/chambers.sqlite')),/empty target/);
 console.log('SQL integration: verified migration; checking application repositories');store=new Store(path.join(root,'target'),{provider:'sqlserver',database:target,migrate:false});target=null;
 assert.equal(store.get('clients','retained-client').name,'हिन्दी client');assert.deepEqual(Buffer.from(store.file('retained-document').content),Buffer.from([0,1,255]));assert.equal(store.user('clerk').active,true);assert.deepEqual(store.access('clerk'),['advocate']);
 assert.equal(store.sql.native('SELECT COUNT(DISTINCT TABLE_SCHEMA) AS n FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA IN (\'platform\',\'chambers\',\'batchfee\',\'samaj\',\'tournament\',\'news\',\'fundlens\',\'satire\')')[0].n,8);
 assert.throws(()=>store.transaction(()=>{store.create('clients',{id:'rollback-client',name:'Rollback'});throw Error('rollback-check');}),/rollback-check/);assert.equal(store.get('clients','rollback-client'),null);
 const sqlAuth=createAuth({store,initializeWorkspace(){}}),samaj=createDigitalSamaj({store,auth:sqlAuth});createBatchFee({store,auth:sqlAuth});createTournament({store,auth:sqlAuth});
 const {Readable}=require('node:stream');
 async function call(route,method='GET',body={},id='owner'){let result;await store.requestContext(()=>samaj({route:'digital-samaj'+route,method,user:store.user(id),req:Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]),{headers:{'content-type':'application/json'},url:'/api/digital-samaj'+route}),json(status,data){result={status,data};}}));return result.data;}
 console.log('SQL integration: checking Samaj permissions and genealogy');const community=await call('','POST',{name:'Isolated Samaj'}),base='/'+community.id;
 const person=await call(base+'/persons','POST',{data:{englishName:'Person',state:'Gujarat'}});
 const related=await call(base+'/persons','POST',{data:{englishName:'Parent',state:'Gujarat'}});
 await call(base+'/relationships','POST',{personId:person.id,relatedId:related.id,type:'Father'});
 await assert.rejects(call(base+'/relationships','POST',{personId:related.id,relatedId:person.id,type:'Father'}),/cycle|inverse/i);
 assert.equal((await call(base+'/persons')).items.length,2);
 assert.throws(()=>store.sql.prepare('DELETE FROM [samaj].[samaj_audit]').run(),/append only/i);
 const sqlExport=store.exportSql();assert.match(sqlExport,/\[platform\]\.\[users\]/);assert.match(sqlExport,/\[samaj\]\.\[samaj_persons\]/);assert.match(sqlExport,/0x0001ff/i);
 if(process.env.SQLSERVER_TEST_EXPORT)fs.writeFileSync(process.env.SQLSERVER_TEST_EXPORT,sqlExport);
 // Real API server exercises shared cookies, access enforcement and concurrent financial writes.
 const crypto=require('node:crypto'),salt='11'.repeat(16),hash=salt+':'+crypto.scryptSync('integration-secret-123',salt,64).toString('hex');
 store.sql.prepare('UPDATE [platform].[users] SET password=? WHERE id=?').run(hash,'owner');
 store.sql.close();store=null;
 console.log('SQL integration: checking HTTP auth and concurrent payments');const {spawn}=require('node:child_process');
 const child=spawn(process.execPath,['server/index.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'0',DATA_DIR:path.join(root,'http')},stdio:['ignore','pipe','pipe']});
 let output='';const port=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),30000);child.stdout.on('data',chunk=>{output+=chunk;const match=/localhost:(\d+)/.exec(output);if(match){clearTimeout(timer);resolve(match[1]);}});child.on('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code));});child.stderr.on('data',chunk=>{output+=chunk;});});
 try{
  const url='http://localhost:'+port;let cookie='';
  assert.equal((await fetch(url+'/api/satire-arena')).status,404);
  const request=async(route,method='GET',body)=>{const r=await fetch(url+'/api/'+route,{method,headers:{cookie,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};};
  assert.equal((await request('state')).status,401);
  // Imported users with deliberately unused hashes cannot log in; set a test hash without touching live data.
  assert.equal((await request('auth/login','POST',{email:'owner@example.test',password:'integration-secret-123'})).status,200);
  const invoice=await request('invoices','POST',{clientId:'retained-client',amount:100,date:'2026-01-01',due:'2026-01-02',description:'Isolated invoice',caseId:'',notes:''});assert.equal(invoice.status,201);
  const payments=await Promise.all([1,2].map(()=>request('payments','POST',{invoiceId:invoice.data.id,amount:75,date:'2026-01-01',method:'Cash',reference:'',notes:''})));assert.deepEqual(payments.map(r=>r.status).sort(),[201,400]);
  assert.equal((await request('state')).data.invoices.find(i=>i.id===invoice.data.id).balance,25);
  const matter=await request('cases','POST',{title:'SQL hearing fixture',clientId:'retained-client',court:'Test court'});assert.equal(matter.status,201);
  const hearing=await request('hearings','POST',{caseId:matter.data.id,date:'2026-01-01',time:'10:00',purpose:'Fixture',status:'Scheduled'});assert.equal(hearing.status,201);
  const next={version:hearing.data.version,status:'Adjourned',outcome:'Fixture outcome',nextDate:'2026-01-02',nextTime:'10:00',nextPurpose:'Next fixture'};
  assert.equal((await request('hearings/'+hearing.data.id+'/outcome','POST',next)).status,200);assert.equal((await request('hearings/'+hearing.data.id+'/outcome','POST',next)).status,409);
  assert.equal((await request('state')).data.hearings.filter(h=>h.caseId===matter.data.id).length,2);
  let academy=(await request('batchfee-lite')).data;
  const command={type:'profile',input:{name:'SQL Academy',owner:'Test owner',mobile:'9876543210',dueDay:5,sessionMonth:4},revision:academy.revision,requestId:'sql-idempotency-profile-001'};
  academy=await request('batchfee-lite/command','POST',command);assert.equal(academy.status,200);const retry=await request('batchfee-lite/command','POST',command);assert.equal(retry.status,200);assert.equal(retry.data.revision,academy.data.revision);
  assert.equal((await request('tournament-lite')).status,200);
  assert.equal((await request('platform')).status,200);
  assert.equal((await request('users/clerk','PATCH',{name:'clerk',email:'clerk@example.test',role:'Clerk',active:true,password:'clerk-integration-secret-123'})).status,200);
  assert.equal((await request('auth/login','POST',{email:'clerk@example.test',password:'clerk-integration-secret-123'})).status,200);
  assert.equal((await request('payments','POST',{invoiceId:invoice.data.id,amount:1,date:'2026-01-01',method:'Cash'})).status,403);
 }finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(resolve,5000);});}
 console.log('SQL Server integration passed: eight schemas, D1 ballot import/identity preservation, concurrent Arena votes/export/removal, full migration, preserved records/blobs/accounts, rollback, Samaj privacy/relationships, concurrent API payments.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{source?.sql.close();target?.close();store?.sql.close();if(path.dirname(root)===path.resolve(os.tmpdir()))fs.rmSync(root,{recursive:true,force:true});}).then(()=>process.exit(process.exitCode||0));
