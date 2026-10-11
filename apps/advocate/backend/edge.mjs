import schema from './schema.js';
import settings from './settings.js';
import {createHash} from 'node:crypto';
import {body,fail,json,owner,requireApp} from '../../../server/edge-http.mjs';
const {schemas,validate,indiaToday}=schema,{cleanSettings}=settings;
const cents=n=>Math.round(n*100);
export async function chamberState(repo){
 if(repo.remaining!==undefined){const limits=await repo.first('SELECT COUNT(*) n,COALESCE(SUM(length(CAST(data AS BLOB))),0) bytes FROM records');if(limits.n>250||limits.bytes>262144)fail(503,'The free workspace record limit has been reached. Contact the owner to archive or export records locally.');}
 const rows=await repo.all('SELECT kind,data FROM records ORDER BY rowid DESC'),users=await repo.users();
 const state={settings:await repo.setting('firm')||cleanSettings({name:'My Chambers'}),users,activity:await repo.all('SELECT * FROM audit ORDER BY id DESC LIMIT 500')};
 for(const kind of Object.keys(schemas))state[kind]=rows.filter(r=>r.kind===kind).map(r=>JSON.parse(r.data));return state;
}
function lookup(state){return (kind,id)=>(state[kind]||[]).find(r=>r.id===id);}
function write(repo,kind,r){return repo.statement('INSERT INTO records(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data',kind,r.id,JSON.stringify(r));}
function newRecord(values,old=null){const now=new Date().toISOString();return {...values,id:old?.id||crypto.randomUUID(),version:old?old.version+1:1,archived:old?.archived||false,createdAt:old?.createdAt||now,updatedAt:now};}
function fileInput(b){if(typeof b.content!=='string'||! /^[A-Za-z0-9+/]*={0,2}$/.test(b.content)||b.content.length%4)fail(400,'Invalid file content');const bytes=Buffer.from(b.content,'base64');if(!bytes.length||bytes.length>5*1024*1024||bytes.toString('base64')!==b.content)fail(400,'Choose a nonempty file up to 5 MB');if(typeof b.originalName!=='string'||!b.originalName.trim()||b.originalName.length>200)fail(400,'Invalid filename');const name=b.originalName.split(/[\\/]/).pop().replace(/[\r\n\x00-\x1f]/g,'');return {bytes,name,mime:'application/octet-stream'};}
function money(state,kind,r,id){
 if(kind==='payments'){const invoice=lookup(state)('invoices',r.invoiceId);if(invoice.archived)fail(400,'Cannot pay an archived invoice');if(r.date<invoice.date)fail(400,'Payment date cannot precede invoice date');if(r.date>indiaToday())fail(400,'A received payment cannot be dated in the future');const paid=state.payments.filter(p=>!p.archived&&p.invoiceId===r.invoiceId&&p.id!==id).reduce((s,p)=>s+cents(p.amount),0);if(paid+cents(r.amount)>cents(invoice.amount))fail(400,'Payment exceeds the outstanding invoice balance');}
 if(kind==='invoices'){const payments=state.payments.filter(p=>!p.archived&&p.invoiceId===id);if(payments.reduce((s,p)=>s+cents(p.amount),0)>cents(r.amount))fail(400,'Invoice amount cannot be less than received payments');if(payments.length&&lookup(state)('invoices',id).clientId!==r.clientId)fail(400,'Cannot change the client after payment');if(payments.some(p=>p.date<r.date))fail(400,'Invoice date cannot be after an existing payment');}
}
export async function chambers({repo,user,route,request,files,env}){
 requireApp(user,'advocate');const method=request.method;
 if(route==='settings'&&method==='PATCH'){owner(user);const value=cleanSettings(await body(request));await repo.commit([repo.settingWrite('firm',value),repo.audit(user.name,'Updated settings','workspace',{name:value.name})]);return json(value);}
 const state=await chamberState(repo),get=lookup(state);
 if(route==='state'&&method==='GET'){
  for(const c of state.cases)c.nextDate=state.hearings.filter(h=>!h.archived&&h.caseId===c.id&&h.status==='Scheduled'&&h.date>=indiaToday()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]?.date||'';
  for(const i of state.invoices){i.paid=state.payments.filter(p=>!p.archived&&p.invoiceId===i.id).reduce((s,p)=>s+cents(p.amount),0)/100;i.balance=(cents(i.amount)-cents(i.paid))/100;i.status=i.balance<=0?'Paid':i.paid>0?'Part paid':'Unpaid';}
  return json({...state,schemas,currentUser:{id:user.id,name:user.name,email:user.email,role:user.role},today:indiaToday(),...(env?.FREE_MODE==='true'?{capabilities:{authMethod:env.AUTH_METHOD==='access'?'access':'password',documents:true,maxFileBytes:files.maxFileBytes,maxDocumentBytes:100000000,backup:false}}:{})});
 }
 if(route==='backup'&&method==='GET'){
  owner(user);const metadata=await repo.all("SELECT * FROM edge_objects WHERE scope='chambers'");if(metadata.reduce((s,f)=>s+f.size,0)>24*1024*1024)fail(413,'Use the full-platform export tool for backups larger than 24 MB');const exported=[];
  for(const f of metadata){const {object}=await files.read('chambers',f.id);exported.push({id:f.id,name:f.name,mime:f.mime,content:Buffer.from(await object.arrayBuffer()).toString('base64')});}
  const records=Object.fromEntries(Object.keys(schemas).map(k=>[k,state[k]]));return json({format:'chambers-backup',version:2,exportedAt:new Date().toISOString(),settings:state.settings,records,files:exported},200,{'Content-Disposition':`attachment; filename="chambers-backup-${indiaToday()}.json"`});
 }
 if(route==='backup.sql') {owner(user);fail(409,'Cloudflare recovery needs both D1 and R2. Use the full-platform export tool.');}
 if(route==='restore'&&method==='POST'){
  owner(user);const b=await body(request,32*1024*1024),backup=b.backup;if(b.confirm!=='RESTORE')fail(400,'Type RESTORE to confirm');if(backup?.format!=='chambers-backup'||backup.version!==2||!backup.records||!Array.isArray(backup.files))fail(400,'Unsupported backup format');
  const restored={users:state.users};for(const kind of Object.keys(schemas)){if(!Array.isArray(backup.records[kind]))fail(400,'Invalid '+kind+' backup');restored[kind]=backup.records[kind];}
  if(Object.keys(schemas).reduce((s,k)=>s+restored[k].length,0)+backup.files.length*2>850)fail(413,'Use the staging migration tool for large restores');
  const seen=new Set(),writes=[repo.statement('DELETE FROM records'),repo.statement('DELETE FROM files'),repo.statement("DELETE FROM edge_objects WHERE scope='chambers'")],map=new Map();
  for(const f of backup.files){if(!f||map.has(f.id))fail(400,'Invalid or duplicate document file');map.set(f.id,fileInput({content:f.content,originalName:f.name}));}
  for(const kind of Object.keys(schemas))for(const r of restored[kind]){
   if(!r||typeof r.id!=='string'||! /^[A-Za-z0-9_-]{1,100}$/.test(r.id)||seen.has(kind+':'+r.id))fail(400,'Invalid or duplicate record ID');seen.add(kind+':'+r.id);
   const value={...validate(kind,r,r,lookup(restored)),id:r.id,version:Date.now(),archived:!!r.archived,createdAt:r.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
   if(kind==='invoices'){value.number=r.number||'INV-'+r.id;money(restored,kind,value,r.id);}if(kind==='payments'&&!value.archived)money(restored,kind,value,r.id);
   if(kind==='documents'){const f=map.get(r.id);if(!f)fail(400,'A document file is missing');value.originalName=f.name;value.size=f.bytes.length;}writeCheck(kind,value);writes.push(write(repo,kind,value));
  }
  const cnrs=restored.cases.map(c=>c.cnr).filter(Boolean);if(new Set(cnrs).size!==cnrs.length)fail(400,'Backup contains duplicate CNR numbers');if(map.size!==restored.documents.length)fail(400,'Backup contains unlinked files');
  // Finish all validation before putting any object.
  for(const [id,f]of map){writes.push(await files.upload('chambers',id,f),repo.statement('INSERT INTO files VALUES(?,?,?,NULL)',id,f.name,f.mime));}
  writes.push(repo.settingWrite('firm',cleanSettings(backup.settings||{})),repo.audit(user.name,'Restored backup','workspace',{}));await repo.commit(writes);return json({ok:true});
 }
 const [kind,id,action,...extra]=route.split('/');if(!schemas[kind]||extra.length)fail(404,'Not found');const old=id?get(kind,id):null;if(id&&!old)fail(404,'Record not found');
 if(kind==='documents'&&action==='download'&&method==='GET'){const f=await files.read('chambers',id);if(!f)fail(404,'File not found');return new Response(f.object.body,{headers:{'Content-Type':'application/octet-stream','Cache-Control':'no-store','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(f.meta.name).replace(/'/g,'%27')}`,'X-Content-Type-Options':'nosniff'}});}
 if(user.role==='Clerk'&&['invoices','payments','expenses'].includes(kind))fail(403,'Billing changes require an advocate or owner');
 const b=await body(request);
 if(kind==='cases'&&action==='preparation'&&method==='POST'){
  if(old.archived)fail(400,'Restore the case before preparing it');const templates={general:['Review the latest order and case papers','Confirm hearing details and client instructions','Prepare submissions and required document copies'],civil:['Review pleadings, issues and latest order','Check evidence and exhibit copies','Prepare submissions and confirm client instructions'],criminal:['Review charge, bail conditions and latest order','Check witness and evidence papers','Prepare submissions and confirm hearing attendance']};if(!Object.hasOwn(templates,b.template))fail(400,'Choose a preparation template');const writes=[],tasks=[];
  for(const [i,title]of templates[b.template].entries()){const tid=createHash('sha256').update(['hearing-prep',id,b.template,b.due,i].join(':')).digest('hex').slice(0,32);let task=get('tasks',tid);if(!task){task={...newRecord(validate('tasks',{title,caseId:id,due:b.due,priority:'High',status:'To do',assigneeId:old.assigneeId||'',notes:'Hearing preparation checklist. Review and adjust for this matter; dates are entered manually.'},null,get)),id:tid};writes.push(write(repo,'tasks',task),repo.audit(user.name,'Created hearing preparation task','tasks',task));}tasks.push(task);}
  await repo.commit(writes);return json({tasks});
 }
 if(kind==='hearings'&&action==='outcome'&&method==='POST'){
  if(b.version!==old.version)fail(409,'This hearing changed. Reopen it before recording the outcome.');if(old.archived)fail(400,'Restore the hearing first');if(!['Completed','Adjourned','Cancelled'].includes(b.status))fail(400,'Choose a hearing outcome status');if(typeof b.outcome!=='string'||!b.outcome.trim())fail(400,'Outcome notes are required');
  const updated=newRecord(validate(kind,{status:b.status,outcome:b.outcome},old,get),old),writes=[write(repo,kind,updated),repo.audit(user.name,'Recorded outcome',kind,{...updated,title:updated.purpose})];
  if(b.nextDate){const next=newRecord(validate(kind,{...updated,status:'Scheduled',date:b.nextDate,time:b.nextTime,purpose:b.nextPurpose,outcome:''},{},get));if(next.date<old.date)fail(400,'Next hearing cannot precede this hearing');if(state.hearings.some(h=>!h.archived&&h.id!==id&&h.caseId===next.caseId&&h.date===next.date&&h.time===next.time&&h.status==='Scheduled'))fail(409,'This next hearing is already scheduled');writes.push(write(repo,kind,next),repo.audit(user.name,'Scheduled next hearing',kind,next));}
  await repo.commit(writes);return json({ok:true});
 }
 if(action)fail(404,'Not found');if(!['POST','PATCH'].includes(method)||method==='PATCH'&&!id||method==='POST'&&id)fail(405,'Method not allowed');if(old&&b.version!==old.version)fail(409,'This record changed. Close this form and reload before editing.');
 const archived=Object.hasOwn(b,'archived')?b.archived:old?.archived||false;if(typeof archived!=='boolean')fail(400,'Invalid archive state');if(old?.archived&&archived)fail(400,'Restore this record before editing it');if(archived&&!old)fail(400,'New records cannot be archived');if(archived&&kind==='invoices'&&state.payments.some(p=>!p.archived&&p.invoiceId===id))fail(400,'Void the linked payments before archiving this invoice');
 const saved={...newRecord(validate(kind,b,old||{},get),old),archived};if(!archived)money(state,kind,saved,id);
 if(kind==='cases'&&saved.cnr&&state.cases.some(c=>c.id!==id&&c.cnr===saved.cnr))fail(409,'A case with this CNR already exists');if(kind==='cases'&&old&&saved.clientId!==old.clientId&&state.invoices.some(i=>i.caseId===id))fail(400,'Cannot change the client of a case with linked invoices');
 if(repo.remaining!==undefined){const size=new TextEncoder().encode(JSON.stringify(saved)).length;if(size>8192)fail(413,'A free workspace record must fit within 8 KB');const limits=await repo.first('SELECT COUNT(*) n,COALESCE(SUM(length(CAST(data AS BLOB))),0) bytes FROM records WHERE NOT(kind=? AND id=?)',kind,saved.id);if(limits.n>=250||limits.bytes+size>262144)fail(409,'The free workspace record limit has been reached.');}
 const writes=[];if(kind==='invoices')saved.number=old?.number||'INV-'+String(state.invoices.length+1).padStart(5,'0');if(kind==='documents'){const f=!old||b.content?fileInput(b):null;saved.originalName=f?.name||old.originalName;saved.size=f?.bytes.length||old.size;if(f)writes.push(await files.upload('chambers',saved.id,f),repo.statement('INSERT INTO files VALUES(?,?,?,NULL) ON CONFLICT(id) DO UPDATE SET name=excluded.name,mime=excluded.mime',saved.id,f.name,f.mime));}
 writes.push(write(repo,kind,saved),repo.audit(user.name,archived?'Archived':old?.archived?'Restored':old?'Updated':'Created',kind,saved));await repo.commit(writes);return json(saved,old?200:201);
}
function writeCheck(kind,record){if(JSON.stringify(record).length>1000000)fail(413,'Record is too large');}
