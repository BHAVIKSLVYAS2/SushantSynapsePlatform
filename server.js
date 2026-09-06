const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual, createHash } = require('node:crypto');
const { Store } = require('./lib/store');
const { schemas, validate, indiaToday } = require('./lib/schema');
const { apps } = require('./lib/apps');
const production = process.env.NODE_ENV === 'production';
const publicOrigin = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : '';
if (production && (!publicOrigin || !publicOrigin.startsWith('https://'))) throw Error('Production requires an HTTPS PUBLIC_ORIGIN');
if (production && (!process.env.SETUP_TOKEN || process.env.SETUP_TOKEN.length < 24)) throw Error('Production requires a SETUP_TOKEN of at least 24 characters');
const store = new Store(process.env.DATA_DIR || path.join(__dirname, 'data'));
const SESSION_TTL = 12 * 60 * 60 * 1000;
const hashToken = value => createHash('sha256').update(value).digest('hex');
const failures = new Map();
const secureCookie = production || process.env.COOKIE_SECURE === '1';
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (code, message) => { throw new HttpError(code, message); };
function passwordHash(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) fail(400, 'Use a password between 12 and 128 characters');
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
function userInput(input) {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) fail(400, 'Name is required (maximum 120 characters)');
  if (typeof input.email !== 'string' || input.email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) fail(400, 'Enter a valid email');
  if (!['Owner', 'Advocate', 'Clerk'].includes(input.role)) fail(400, 'Invalid role');
  return { name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role };
}
function newSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  store.sql.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  store.sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token), userId, Date.now() + SESSION_TTL);
  res.setHeader('Set-Cookie', `chambers_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secureCookie?'; Secure':''}`);
}
function session(req) {
  const token = /(?:^|;\s*)chambers_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (!token) return null;
  const row = store.sql.prepare('SELECT userId FROM sessions WHERE token=? AND expires>?').get(hashToken(token), Date.now());
  const user = row && store.user(row.userId);
  return user?.active ? { ...user, session: hashToken(token) } : null;
}
function owner(user) { if (user.role !== 'Owner') fail(403, 'Only the chamber owner can perform this action'); }
function hasAppAccess(user, appId) { return user.role==='Owner'||store.access(user.id).includes(appId); }
function validAppIds(ids) { if(!Array.isArray(ids)||ids.some(id=>!apps.some(a=>a.id===id&&a.status==='Available'))||new Set(ids).size!==ids.length)fail(400,'Choose valid available apps');return ids; }
function canWrite(user, kind) { if (user.role === 'Clerk' && ['invoices', 'payments', 'expenses'].includes(kind)) fail(403, 'Billing changes require an advocate or owner'); }
function cleanSettings(input) {
  const result = { timezone: 'Asia/Kolkata' };
  for (const key of ['name','advocate','email','phone','address','barNumber']) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > 2000) fail(400, `Invalid ${key}`);
    result[key] = value.trim();
  }
  if (!result.name) fail(400, 'Chambers name is required');
  return result;
}
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
async function readBody(req, limit = 8 * 1024 * 1024) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'JSON content type required');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) fail(413, 'Request is too large'); chunks.push(chunk); }
  let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'Invalid request');
  return body;
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
const server = http.createServer(async (req,res) => {
  const json = (code,data) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  try {
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/healthz'&&req.method==='GET')return json(200,{status:'ok'});
    if(url.pathname==='/advocate/'){res.writeHead(308,{Location:'/advocate'+url.search});return res.end();}
    if (!url.pathname.startsWith('/api/')) {
      const assets={'/':'platform.html','/advocate':'index.html','/app.js':'app.js','/style.css':'style.css','/manifest.webmanifest':'manifest.webmanifest','/icon.svg':'icon.svg','/platform.js':'platform.js','/platform.css':'platform.css','/platform-icon.svg':'platform-icon.svg','/advocate.webmanifest':'advocate.webmanifest'};
      const name=assets[url.pathname];if(!name){res.writeHead(404);return res.end('Not found');}
      if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Method not allowed');
      res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8');
      res.setHeader('Cache-Control','no-cache');return res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,'public',name)));
    }
    const host = req.headers.host || '';
    const localHost=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    if (!localHost && (!publicOrigin||host!==new URL(publicOrigin).host)) fail(403,'Host rejected');
    const allowedOrigin=localHost?`http://${host}`:publicOrigin;
    if (req.headers.origin && req.headers.origin!==allowedOrigin) fail(403,'Origin rejected');
    if (req.headers['sec-fetch-site']==='cross-site') fail(403,'Cross-site request rejected');
    const route=url.pathname.slice(5), method=req.method;
    const user=session(req);
    if(route==='auth/status'&&method==='GET')return json(200,{setupRequired:store.users().length===0,setupProtected:!!process.env.SETUP_TOKEN,user:user?{id:user.id,name:user.name,email:user.email,role:user.role}:null});
    if(route==='auth/setup'&&method==='POST'){
      if(store.users().length)fail(409,'Workspace is already configured');
      const input=await readBody(req);if(store.users().length)fail(409,'Workspace is already configured');
      if(process.env.SETUP_TOKEN&&(typeof input.setupToken!=='string'||!timingSafeEqual(Buffer.from(hashToken(input.setupToken)),Buffer.from(hashToken(process.env.SETUP_TOKEN)))))fail(403,'The setup token is incorrect');
      const u=userInput({...input,role:'Owner'}), password=passwordHash(input.password),id=randomUUID();
      store.transaction(()=>{store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,u.name,u.email,u.role,password);store.setAccess(id,['advocate']);store.setSetting('firm',cleanSettings({name:input.firmName||'My Chambers',advocate:u.name}));if(input.demo===true)store.demo();store.audit(u.name,'Created workspace','users',{id,name:u.name});});
      newSession(res,id);return json(201,{user:store.user(id)});
    }
    if(route==='auth/login'&&method==='POST'){
      const input=await readBody(req);const key=(req.socket.remoteAddress||'')+':'+(typeof input.email==='string'?input.email.trim().toLowerCase().slice(0,200):'');
      if(failures.size>10000)for(const [k,v]of failures)if(v.until<Date.now())failures.delete(k);
      const attempt=failures.get(key);if(attempt&&attempt.count>=10&&attempt.until>Date.now())fail(429,'Too many attempts. Try again in 15 minutes.');
      const u=store.sql.prepare('SELECT * FROM users WHERE email=?').get(typeof input.email==='string'?input.email.trim().toLowerCase():'');
      const valid=verifyPassword(input.password,u?.password||'00000000000000000000000000000000:'+ '00'.repeat(64));
      if(!u||!u.active||!valid){failures.set(key,{count:attempt&&attempt.until>Date.now()?attempt.count+1:1,until:Date.now()+900000});fail(401,'Email or password is incorrect');}
      failures.delete(key);newSession(res,u.id);store.audit(u.name,'Signed in','users',u);return json(200,{user:store.user(u.id)});
    }
    if(!user)fail(401,'Please sign in');
    if(route==='auth/logout'&&method==='POST'){store.sql.prepare('DELETE FROM sessions WHERE token=?').run(user.session);res.setHeader('Set-Cookie',`chambers_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie?'; Secure':''}`);return json(200,{ok:true});}
    if(route==='auth/profile'&&method==='PATCH'){
      const input=await readBody(req),updated=userInput({name:input.name,email:input.email,role:user.role});
      if(store.users().some(u=>u.id!==user.id&&u.email===updated.email))fail(409,'Email is already in use');
      store.transaction(()=>{store.sql.prepare('UPDATE users SET name=?,email=? WHERE id=?').run(updated.name,updated.email,user.id);store.audit(user.name,'Updated profile','users',{id:user.id,name:updated.name});});return json(200,store.user(user.id));
    }
    if(route==='auth/password'&&method==='POST'){
      const input=await readBody(req),u=store.sql.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if(!verifyPassword(input.currentPassword,u.password))fail(400,'Current password is incorrect');
      const hash=passwordHash(input.newPassword);store.transaction(()=>{store.sql.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);store.sql.prepare('DELETE FROM sessions WHERE userId=?').run(user.id);store.audit(user.name,'Changed password','users',user);});newSession(res,user.id);return json(200,{ok:true});
    }
    if(route==='platform'&&method==='GET'){
      const preferences=store.preferences(user.id),available=apps.filter(a=>a.status==='Available'&&hasAppAccess(user,a.id));
      return json(200,{name:'Sushant Synapse Platform',domain:'apps.sushantsynapse.com',user:store.user(user.id),apps:apps.map(a=>({...a,accessible:a.status==='Available'&&hasAppAccess(user,a.id)})),preferences:{favorites:preferences.favorites.filter(id=>available.some(a=>a.id===id)),recent:preferences.recent.filter(r=>available.some(a=>a.id===r.id))},team:user.role==='Owner'?store.users().map(u=>({...u,appIds:store.access(u.id)})):undefined});
    }
    if(route==='platform/preferences'&&method==='PATCH'){
      const input=await readBody(req),favorites=validAppIds(input.favorites);
      if(favorites.some(id=>!hasAppAccess(user,id)))fail(403,'You do not have access to that app');
      const preferences={...store.preferences(user.id),favorites};store.setPreferences(user.id,preferences);return json(200,preferences);
    }
    if(/^platform\/apps\/[^/]+\/launch$/.test(route)&&method==='POST'){
      const app=apps.find(a=>a.id===route.split('/')[2]);if(!app||app.status!=='Available')fail(404,'This app is not available yet');
      if(!hasAppAccess(user,app.id))fail(403,'Ask the platform owner for app access');
      const prefs=store.preferences(user.id);prefs.recent=[{id:app.id,at:new Date().toISOString()},...prefs.recent.filter(r=>r.id!==app.id)].slice(0,12);store.setPreferences(user.id,prefs);return json(200,{path:app.path});
    }
    if(/^platform\/access\/[^/]+$/.test(route)&&method==='PATCH'){
      owner(user);const target=store.user(route.split('/')[2]);if(!target)fail(404,'User not found');if(target.role==='Owner')fail(400,'Owners always have access to available apps');
      const input=await readBody(req),ids=validAppIds(input.appIds);store.transaction(()=>{store.setAccess(target.id,ids);store.audit(user.name,'Updated app access','users',target);});return json(200,{appIds:ids});
    }
    if(route==='ledger'&&method==='GET')return json(200,{markdown:fs.readFileSync(path.join(__dirname,'FUNCTIONALITY_LEDGER.md'),'utf8')});
    // Shared account administration is available at platform level. Every
    // Chambers business route, including downloads/exports, requires app access.
    if(!route.startsWith('users')&&!hasAppAccess(user,'advocate'))fail(403,'Chambers access is not enabled for your account');
    if(route==='state'&&method==='GET')return json(200,{...store.state(),schemas,currentUser:{id:user.id,name:user.name,email:user.email,role:user.role},today:indiaToday()});
    if(route==='backup'&&method==='GET'){owner(user);res.setHeader('Content-Disposition',`attachment; filename="chambers-backup-${indiaToday()}.json"`);store.audit(user.name,'Exported backup','workspace',{});return json(200,store.backup());}
    if(route==='backup.sql'&&method==='GET'){owner(user);store.audit(user.name,'Exported SQL database','workspace',{});res.setHeader('Content-Type','application/sql; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Disposition',`attachment; filename="chambers-database-${indiaToday()}.sql"`);return res.end(store.exportSql());}
    if(route==='restore'&&method==='POST'){owner(user);const input=await readBody(req,100*1024*1024);if(input.confirm!=='RESTORE')fail(400,'Type RESTORE to confirm');restoreBackup(input.backup,user.name);return json(200,{ok:true});}
    if(route==='settings'&&method==='PATCH'){owner(user);const settings=cleanSettings(await readBody(req));store.transaction(()=>{store.setSetting('firm',settings);store.audit(user.name,'Updated settings','workspace',{name:settings.name});});return json(200,settings);}
    const [kind,id,action,...extra]=route.split('/');if(extra.length)fail(404,'Not found');
    if(kind==='users'){
      owner(user);const input=await readBody(req);
      if(method==='POST'&&!id){const u=userInput(input);if(store.users().some(x=>x.email===u.email))fail(409,'Email is already in use');const password=passwordHash(input.password);const uid=randomUUID();const appIds=validAppIds(input.appIds??['advocate']);store.transaction(()=>{store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(uid,u.name,u.email,u.role,password);store.setAccess(uid,appIds);store.audit(user.name,'Added team member','users',{id:uid,name:u.name});});return json(201,store.user(uid));}
      if(method==='PATCH'&&id){const old=store.user(id);if(!old)fail(404,'User not found');const u=userInput({...old,...input});const active=input.active??old.active;if(typeof active!=='boolean')fail(400,'Invalid active state');if(id===user.id&&(!active||u.role!=='Owner'))fail(400,'You cannot deactivate or demote your own owner account');if(store.users().some(x=>x.email===u.email&&x.id!==id))fail(409,'Email is already in use');const password=input.password?passwordHash(input.password):null;store.transaction(()=>{store.sql.prepare('UPDATE users SET name=?,email=?,role=?,active=? WHERE id=?').run(u.name,u.email,u.role,active?1:0,id);if(password)store.sql.prepare('UPDATE users SET password=? WHERE id=?').run(password,id);store.sql.prepare('DELETE FROM sessions WHERE userId=?').run(id);store.audit(user.name,'Updated team member','users',{id,name:u.name});});if(id===user.id)newSession(res,id);return json(200,store.user(id));}
      fail(405,'Method not allowed');
    }
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
  } catch (error) {
    if(!res.headersSent)json(error.status||400,{error:error.message.includes('UNIQUE constraint')?'This record already exists':error.message});else res.end();
  }
});
server.listen(process.env.PORT===undefined?3000:Number(process.env.PORT),process.env.HOST||'127.0.0.1',()=>console.log(`Sushant Synapse Platform running at http://localhost:${server.address().port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.sql.close();process.exit(0);}));
