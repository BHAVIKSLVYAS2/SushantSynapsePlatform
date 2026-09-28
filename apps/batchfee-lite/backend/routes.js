const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {fail,readBody}=require('../../../server/http');
const {empty,apply,view,today,date}=require('./engine');
function createBatchFee({store,auth}){
 store.registerAppSchema('batchfee-lite-v1',fs.readFileSync(path.join(__dirname,'../database/001-initial.sql'),'utf8'),['batchfee_migrations','batchfee_workspace','batchfee_events']);
 store.sql.exec('INSERT OR IGNORE INTO batchfee_migrations VALUES(1)');
 const read=()=>{const r=store.sql.prepare('SELECT * FROM batchfee_workspace WHERE id=1').get();return {revision:r?.revision||0,state:r?JSON.parse(r.data):empty()};};
 const events=()=>store.sql.prepare('SELECT at,actor,action,data FROM batchfee_events ORDER BY id').all().map(e=>({...e,data:JSON.parse(e.data)}));
 const save=(state,revision)=>store.sql.prepare('INSERT INTO batchfee_workspace VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,data=excluded.data').run(revision,JSON.stringify(state));
 const append=e=>store.sql.prepare('INSERT INTO batchfee_events(at,actor,action,data) VALUES(?,?,?,?)').run(e.at,e.actor,e.action,JSON.stringify(e.data));
 return async({route,method,req,json,user})=>{
  if(!user)fail(401,'Please sign in');if(!auth.hasAppAccess(user,'batchfee-lite')||user.role!=='Owner')fail(403,'BatchFee Lite is private to the workspace owner. Staff access is not enabled.');
  if(route==='batchfee-lite'&&method==='GET'){const r=read();return json(200,{revision:r.revision,...view(r.state)});}
  if(route==='batchfee-lite/backup'&&method==='GET')return json(200,{format:'batchfee-lite-1',events:events(),exportedAt:new Date().toISOString()});
  if(method!=='POST')fail(405,'Method not allowed');const body=await readBody(req,16*1024*1024);
  if(!['batchfee-lite/command','batchfee-lite/restore'].includes(route))fail(404,'Not found');
  const result=store.transaction(()=>{const current=read();
   if(route.endsWith('/command')&&body.requestId){const prior=events().find(e=>e.data.id===body.requestId);if(prior){if(prior.action!==body.type||JSON.stringify(prior.data.input)!==JSON.stringify(body.input||{}))fail(409,'Request key reused with different data');return {revision:current.revision,...view(current.state)};}}
   if(body.revision!==current.revision)fail(409,'Data changed. Refresh before saving again.');
   if(route.endsWith('/command')&&!current.state.profile&&!['profile','sync'].includes(body.type))fail(400,'Set up your academy first');
   if(route.endsWith('/restore')){const backup=body.backup;if(backup?.format!=='batchfee-lite-1'||!Array.isArray(backup.events)||backup.events.length>50000)fail(400,'Invalid BatchFee backup');const existing=events();if(existing.length>backup.events.length)fail(409,'This backup is older than your records. Restore into an empty installation instead.');for(let n=0;n<existing.length;n++)if(JSON.stringify(existing[n])!==JSON.stringify(backup.events[n]))fail(409,'Backup conflicts with existing history; nothing was replaced.');let state=empty();const ids=new Set();let prev='';for(const e of backup.events){if(!e||typeof e.at!=='string'||!/^20\d\d-\d\d-\d\dT/.test(e.at)||Number.isNaN(Date.parse(e.at))||typeof e.actor!=='string'||e.actor.length>200||e.action!==e.data?.type||ids.has(e.data.id))fail(400,'Invalid backup event');const d=date(e.data.day);if(d<prev||d>today())fail(400,'Invalid backup chronology');prev=d;ids.add(e.data.id);apply(state,e.data,d);}backup.events.slice(existing.length).forEach(append);save(state,current.revision+1);return {revision:current.revision+1,...view(state)};}
   const id=body.requestId||randomUUID();if(!/^[\w-]{8,100}$/.test(id))fail(400,'Invalid request key');const day=today(),command={id,type:body.type,input:body.input||{},day};const state=apply(current.state,command,day);if(body.type==='sync'&&JSON.stringify(state)===JSON.stringify(read().state))return {revision:current.revision,...view(state)};append({at:new Date().toISOString(),actor:user.id,action:command.type,data:command});save(state,current.revision+1);return {revision:current.revision+1,...view(state)};
  });return json(200,result);
 };
}
module.exports={createBatchFee};
