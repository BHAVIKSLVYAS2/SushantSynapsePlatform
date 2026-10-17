const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const {startPreview}=require('./organisation-preview-fixture.cjs');
const request=password=>({password,confirmation:'EXPORT ALL ORGANISATIONS',reason:'Offline disaster recovery copy'});
test('full recovery export requires Super Admin, password and explicit scope; dump restores exact private data without sessions',async t=>{
 const f=await startPreview({chambers:true});let db;t.after(async()=>{db?.close();await f.stop();});
 const cookie=await f.login('super'),master=await f.login('master');
 const post=(body,who=cookie,headers={})=>fetch(f.base+'/api/organisation-admin/recovery-export',{method:'POST',headers:{Cookie:who,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await post(request(f.password),'')).status,401);
 assert.equal((await post(request(f.password),master)).status,403);
 assert.equal((await post(request(f.password),cookie,{Origin:'https://other.invalid'})).status,403);
 assert.equal((await post({...request(f.password),confirmation:'yes'})).status,400);
 assert.equal((await post(request('Incorrect recovery password!'))).status,403);
 db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));
 db.prepare('INSERT INTO records VALUES(?,?,?)').run('clients','recover-client','{"name":"Private client"}');
 db.prepare('INSERT INTO files VALUES(?,?,?,?)').run('recover-file','evidence.bin','application/octet-stream',Buffer.from([0,13,255,42]));
 db.prepare('INSERT INTO chambers_record_ownership VALUES(?,?,?)').run('clients','recover-client',f.organisationId);
 db.prepare('INSERT INTO chambers_file_ownership VALUES(?,?)').run('recover-file',f.organisationId);
 const response=await post(request(f.password));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.match(response.headers.get('content-disposition'),/attachment/);
 const sql=await response.text();assert.equal(sql.includes(f.password),false);assert.equal(sql.includes('INSERT INTO sessions'),false);
 const event=db.prepare("SELECT * FROM platform_organisation_audit WHERE action='PlatformRecoveryExportCreated'").get();
 assert.equal(event.actorUserId,'super');assert.equal(JSON.parse(event.details).reason,request().reason);
 const restored=new DatabaseSync(':memory:');
 try{
  restored.exec(sql);
  assert.equal(restored.prepare("SELECT COUNT(*) n FROM sessions").get().n,0);
  assert.equal(restored.prepare("SELECT data FROM records WHERE id='recover-client'").get().data,'{"name":"Private client"}');
  assert.deepEqual(restored.prepare("SELECT content FROM files WHERE id='recover-file'").get().content,new Uint8Array([0,13,255,42]));
  for(const table of ['users','platform_organisations','platform_memberships','platform_organisation_audit','chambers_record_ownership','chambers_file_ownership'])assert.deepEqual(restored.prepare(`SELECT * FROM ${table}`).all(),db.prepare(`SELECT * FROM ${table}`).all(),table);
  assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{restored.close();}
 // Recovery authority never implies normal Chambers read authority.
 assert.equal((await fetch(f.base+'/api/chambers/'+f.organisationId+'/state',{headers:{Cookie:cookie}})).status,403);
});
test('failed recovery export rolls back its audit entry, and verification attempts are bounded',async t=>{
 const f=await startPreview();let db;t.after(async()=>{db?.close();await f.stop();});const cookie=await f.login('super');
 assert.equal((await fetch(f.base+'/api/organisation-admin',{headers:{Cookie:cookie}})).status,200);
 db=new DatabaseSync(path.join(f.dir,'chambers.sqlite'));
 const post=body=>fetch(f.base+'/api/organisation-admin/recovery-export',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const migration=db.prepare('SELECT * FROM platform_organisation_migrations LIMIT 1').get();
 db.prepare('UPDATE platform_organisation_migrations SET checksum=? WHERE id=?').run('fixture-drift',migration.id);
 assert.equal((await post(request(f.password))).status,500);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM platform_organisation_audit WHERE action='PlatformRecoveryExportCreated'").get().n,0);
 db.prepare('UPDATE platform_organisation_migrations SET checksum=? WHERE id=?').run(migration.checksum,migration.id);
 for(let i=0;i<4;i++)assert.equal((await post(request('Wrong password 2026!'))).status,403);
 assert.equal((await post(request(f.password))).status,429);
});
