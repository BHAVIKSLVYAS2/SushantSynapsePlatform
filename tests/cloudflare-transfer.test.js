const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {DatabaseSync}=require('node:sqlite');
const {owners}=require('../packages/database/catalog');
const {exportSqlite,validateBundle,loadBundle,importSql}=require('../infrastructure/cloudflare/transfer.cjs');
const {schema}=require('../infrastructure/cloudflare/build-d1.cjs');
test('offline SQLite migration preserves private hashes, row order, exact file bytes and audit; excludes sessions',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-edge-transfer-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const source=path.join(root,'source.sqlite'),db=new DatabaseSync(source);
 for(const [,dir,files]of owners)for(const file of files)db.exec(fs.readFileSync(path.join(__dirname,'..',dir,file),'utf8'));
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run('owner','Owner \0 name','owner@example.test','Owner','salt:private-existing-hash');
 db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('old-session','owner',Date.now()+60000);
 db.prepare('INSERT INTO records(rowid,kind,id,data) VALUES(?,?,?,?)').run(19,'clients','client-1',JSON.stringify({id:'client-1',name:'Client ₹',version:3}));
 db.prepare('INSERT INTO settings VALUES(?,?)').run('large-json',JSON.stringify({text:'Long Hindi नमस्ते and emoji 😀 '.repeat(7000)}));
 const bytes=Buffer.from('Private file with \0 bytes and Hindi नमस्ते');db.prepare('INSERT INTO files VALUES(?,?,?,?)').run('file-1','order.txt','text/plain',bytes);
 db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').run(7,'2026-01-01','Owner','Created','clients','client-1','Client ₹');db.close();
 const bundle=path.join(root,'bundle'),result=exportSqlite(source,bundle);assert.equal(result.objects,1);assert.equal(validateBundle(bundle).objects,1);
 const {manifest,manifestHash}=loadBundle(bundle);assert.equal(manifest.tables.users.rows[0].password,'salt:private-existing-hash');assert.equal(manifest.tables.sessions,undefined);assert.equal(manifest.tables.records.rows[0].__rowid,19);
 assert.deepEqual(fs.readFileSync(path.join(bundle,manifest.objects[0].file)),bytes);
 const restored=new DatabaseSync(':memory:');try{restored.exec(schema());restored.exec('BEGIN');restored.exec(importSql(manifest,manifestHash));restored.exec('COMMIT');assert.equal(restored.prepare('SELECT COUNT(*) n FROM sessions').get().n,0);assert.equal(restored.prepare('SELECT rowid FROM records').get().rowid,19);assert.equal(restored.prepare('SELECT id FROM audit').get().id,7);assert.equal(restored.prepare('SELECT content FROM files').get().content,null);assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');}finally{restored.close();}
 const check=new DatabaseSync(source,{readOnly:true});assert.equal(check.prepare('SELECT COUNT(*) n FROM sessions').get().n,1);assert.deepEqual(Buffer.from(check.prepare('SELECT content FROM files').get().content),bytes);check.close();
 assert.throws(()=>exportSqlite(source,bundle),/new output directory/);
 fs.writeFileSync(path.join(bundle,manifest.objects[0].file),'tampered');assert.throws(()=>validateBundle(bundle),/checksum mismatch/);
});
