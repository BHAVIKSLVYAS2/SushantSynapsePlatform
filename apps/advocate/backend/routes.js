const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {schemas,validate,indiaToday}=require('./schema');
const {cleanSettings}=require('./settings');
const {fail,readBody}=require('../../../server/http');
function createAdvocate({store,auth}){
const {owner,hasAppAccess}=auth;
function canWrite(user, kind) { if (user.role === 'Clerk' && ['invoices', 'payments', 'expenses'].includes(kind)) fail(403, 'Billing changes require an advocate or owner'); }
function assertMoney(kind, record, id) {
  if (kind === 'payments') {
    const invoice = store.get('invoices', record.invoiceId);
    if (invoice.archived) fail(400, 'Cannot pay an archived invoice');
    if (record.date < invoice.date) fail(400, 'Payment date cannot precede invoice date');
    if (record.date > indiaToday()) fail(400, 'A received payment cannot be dated in the future');
    const paid = store.all('payments').filter(p => !p.archived && p.invoiceId === record.invoiceId && p.id !== id).reduce((sum,p) => sum + Math.round(p.amount * 100), 0);
    if (paid + Math.round(record.amount * 100) > Math.round(invoice.amount * 100)) fail(400, 'Payment exceeds the outstanding invoice balance');
  }
  if (kind === 'invoices') {
    const payments = store.all('payments').filter(p => !p.archived && p.invoiceId === id);
    if (payments.reduce((sum,p) => sum + Math.round(p.amount * 100),0) > Math.round(record.amount * 100)) fail(400, 'Invoice amount cannot be less than received payments');
    const old = store.get('invoices',id || '');
    if (payments.length && old.clientId !== record.clientId) fail(400, 'Cannot change the client after payment');
    if (payments.some(p => p.date < record.date)) fail(400, 'Invoice date cannot be after an existing payment');
  }
}
function fileInput(input) {
  if (typeof input.content !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.content) || input.content.length % 4 !== 0) fail(400, 'Invalid file content');
  const bytes = Buffer.from(input.content, 'base64');
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) fail(400, 'Choose a nonempty file up to 5 MB');
  if (bytes.toString('base64') !== input.content) fail(400, 'Invalid file encoding');
  if (typeof input.originalName !== 'string' || !input.originalName.trim() || input.originalName.length > 200) fail(400, 'Invalid filename');
  const name = path.basename(input.originalName).replace(/[\r\n\x00-\x1f]/g,'');
  return { bytes, name, mime: 'application/octet-stream' };
}
function restoreBackup(backup, actor) {
  if (!backup || backup.format !== 'chambers-backup' || backup.version !== 2 || !backup.records || !Array.isArray(backup.files)) fail(400, 'Unsupported backup format');
  const settings = cleanSettings(backup.settings || {});
  for (const kind of Object.keys(schemas)) if(!Array.isArray(backup.records[kind])||backup.records[kind].length>50000)fail(400,`Invalid ${kind} backup`);
  const lookup = (kind,id) => kind === 'users' ? store.user(id) : backup.records[kind]?.find(r => r?.id === id);
  const validRecords = {}, ids = new Set();
  for (const kind of Object.keys(schemas)) {
    validRecords[kind] = backup.records[kind].map(r => {
      if (!r || typeof r.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(r.id) || ids.has(kind+':'+r.id)) fail(400, 'Invalid or duplicate record ID');
      ids.add(kind+':'+r.id);
      const input = { ...r, assigneeId: r.assigneeId && store.user(r.assigneeId) ? r.assigneeId : '' };
      const values = validate(kind, input, input, lookup);
      return { ...values, id:r.id, archived:!!r.archived, version:Date.now(), createdAt:typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))?r.createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), ...(kind==='invoices'?{number:typeof r.number==='string'?r.number.slice(0,100):'INV-'+r.id}:{}) };
    });
  }
  const files = new Map();
  const cnrs=validRecords.cases.map(c=>c.cnr).filter(Boolean);if(new Set(cnrs).size!==cnrs.length)fail(400,'Backup contains duplicate CNR numbers');
  for (const f of backup.files) { if (!f||files.has(f.id)) fail(400, 'Invalid or duplicate document file'); files.set(f.id, fileInput({content:f.content,originalName:f.name})); }
  for (const d of validRecords.documents) { const f=files.get(d.id); if(!f)fail(400,'A document file is missing');d.size=f.bytes.length;d.originalName=f.name; }
  if (files.size !== validRecords.documents.length) fail(400, 'Backup contains unlinked files');
  for (const i of validRecords.invoices) {
    const payments=validRecords.payments.filter(p=>!p.archived&&p.invoiceId===i.id);
    if (payments.reduce((s,p)=>s+Math.round(p.amount*100),0)>Math.round(i.amount*100)) fail(400,'Backup contains overpaid invoices');
    if (payments.some(p=>p.date<i.date||p.date>indiaToday()))fail(400,'Backup contains invalid payment dates');
  }
  store.snapshot(true);
  store.transaction(() => {
    store.sql.exec('DELETE FROM records; DELETE FROM files;');
    for (const [kind, records] of Object.entries(validRecords)) for (const r of records) store.put(kind,r);
    for (const [id,f] of files) store.addFile(id,f.name,f.mime,f.bytes);
    store.setSetting('firm', settings);store.audit(actor,'Restored backup','workspace',{name:backup.exportedAt || 'Backup'});
  });
}

return async function handle({route,method,req,res,json,user}){
if(!hasAppAccess(user,'advocate'))fail(403,'Chambers access is not enabled for your account');
    if(route==='state'&&method==='GET')return json(200,{...store.state(),schemas,currentUser:{id:user.id,name:user.name,email:user.email,role:user.role},today:indiaToday()});
    if(route==='backup'&&method==='GET'){owner(user);res.setHeader('Content-Disposition',`attachment; filename="chambers-backup-${indiaToday()}.json"`);store.audit(user.name,'Exported backup','workspace',{});return json(200,store.backup());}
    if(route==='backup.sql'&&method==='GET'){owner(user);store.audit(user.name,'Exported SQL database','workspace',{});res.setHeader('Content-Type','application/sql; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Disposition',`attachment; filename="chambers-database-${indiaToday()}.sql"`);return res.end(store.exportSql());}
    if(route==='restore'&&method==='POST'){owner(user);const input=await readBody(req,100*1024*1024);if(input.confirm!=='RESTORE')fail(400,'Type RESTORE to confirm');restoreBackup(input.backup,user.name);return json(200,{ok:true});}
    if(route==='settings'&&method==='PATCH'){owner(user);const settings=cleanSettings(await readBody(req));store.transaction(()=>{store.setSetting('firm',settings);store.audit(user.name,'Updated settings','workspace',{name:settings.name});});return json(200,settings);}
    const [kind,id,action,...extra]=route.split('/');if(extra.length)fail(404,'Not found');
    if(!schemas[kind])fail(404,'Not found');
    let previous=id?store.get(kind,id):null;
    if(id&&!previous)fail(404,'Record not found');
    if(kind==='documents'&&action==='download'&&method==='GET'){
      const f=store.file(id);if(!f)fail(404,'File not found');res.setHeader('Content-Type','application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(f.name).replace(/'/g,'%27')}`);return res.end(Buffer.from(f.content));
    }
    canWrite(user,kind);
    if(kind==='hearings'&&action==='outcome'&&method==='POST'){
      const input=await readBody(req);previous=store.get(kind,id);
      if(input.version!==previous.version)fail(409,'This hearing changed. Reopen it before recording the outcome.');
      if(previous.archived)fail(400,'Restore the hearing first');
      if(!['Completed','Adjourned','Cancelled'].includes(input.status))fail(400,'Choose a hearing outcome status');
      if(typeof input.outcome!=='string'||!input.outcome.trim())fail(400,'Outcome notes are required');
      const updated=validate('hearings',{status:input.status,outcome:input.outcome},previous,(k,i)=>store.get(k,i));
      let next=null;
      if(input.nextDate){
        next=validate('hearings',{...updated,status:'Scheduled',date:input.nextDate,time:input.nextTime,purpose:input.nextPurpose,outcome:''},{},(k,i)=>store.get(k,i));
        if(next.date<previous.date)fail(400,'Next hearing cannot precede this hearing');
        if(store.all('hearings').some(h=>!h.archived&&h.id!==id&&h.caseId===next.caseId&&h.date===next.date&&h.time===next.time&&h.status==='Scheduled'))fail(409,'This next hearing is already scheduled');
      }
      store.snapshot();store.transaction(()=>{store.put(kind,{...updated,id,version:previous.version+1,archived:false,createdAt:previous.createdAt,updatedAt:new Date().toISOString()});store.audit(user.name,'Recorded outcome',kind,{...updated,id,title:updated.purpose});if(next){const created=store.create(kind,next);store.audit(user.name,'Scheduled next hearing',kind,{...created,title:created.purpose});}});
      return json(200,{ok:true});
    }
    if(!['POST','PATCH'].includes(method))fail(405,'Method not allowed');
    if(action)fail(404,'Not found');
    if((method==='PATCH'&&!id)||(method==='POST'&&id))fail(405,'Method not allowed');
    const input=await readBody(req);
    // Read again after awaiting the request body to detect concurrent edits.
    const current=id?store.get(kind,id):null;
    if(current&&input.version!==current.version)fail(409,'This record changed. Close this form and reload before editing.');
    previous=current;
    const archived=Object.hasOwn(input,'archived')?input.archived:previous?.archived||false;
    if(typeof archived!=='boolean')fail(400,'Invalid archive state');
    if(previous?.archived&&archived)fail(400,'Restore this record before editing it');
    if(archived&&!previous)fail(400,'New records cannot be archived');
    if(archived&&kind==='invoices'&&store.all('payments').some(p=>!p.archived&&p.invoiceId===id))fail(400,'Void the linked payments before archiving this invoice');
    const record=validate(kind,input,previous||{},(k,i)=>store.get(k,i));
    if(!archived)assertMoney(kind,record,id);
    if(kind==='cases'&&record.cnr&&store.all('cases').some(c=>c.id!==id&&c.cnr===record.cnr))fail(409,'A case with this CNR already exists');
    if(kind==='cases'&&previous&&record.clientId!==previous.clientId&&store.all('invoices').some(i=>i.caseId===id))fail(400,'Cannot change the client of a case with linked invoices');
    const upload=kind==='documents'&&(!previous||input.content)?fileInput(input):null;
    store.snapshot();
    const saved=store.transaction(()=>{
      const now=new Date().toISOString();
      const result={...record,id:id||randomUUID(),version:previous?previous.version+1:1,archived,createdAt:previous?.createdAt||now,updatedAt:now};
      if(kind==='invoices')result.number=previous?.number||'INV-'+String(store.all('invoices').length+1).padStart(5,'0');
      if(kind==='documents') {result.originalName=upload?.name||previous.originalName;result.size=upload?.bytes.length||previous.size;if(upload)store.addFile(result.id,upload.name,upload.mime,upload.bytes);}
      store.put(kind,result);store.audit(user.name,archived?'Archived':previous?.archived?'Restored':previous?'Updated':'Created',kind,result);return result;
    });
    return json(previous?200:201,saved);

};
}
module.exports={createAdvocate};
