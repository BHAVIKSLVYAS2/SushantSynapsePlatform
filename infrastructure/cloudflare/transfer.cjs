'use strict';
// Offline migration and recovery. These commands never initialize/reset a source
// database and imports require a new, unbound target. Bundles contain private data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto'),{spawnSync}=require('node:child_process');
const {tables}=require('../../packages/database/catalog');
const {schema}=require('./build-d1.cjs');
const {digest}=require('../../packages/database/sqlserver-transfer');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fileTables={files:'chambers',samaj_files:'samaj',samaj_message_attachments:'samaj'};
const seeded=['samaj_permissions','samaj_roles','samaj_role_permissions','batchfee_migrations','samaj_migrations','tournament_lite_migrations','news_migrations','fund_lens_migrations'];
let persistTo;
const literal=v=>v===null?'NULL':typeof v==='number'?(Number.isFinite(v)?String(v):(()=>{throw Error('Invalid number');})()):String(v).includes('\0')?"CAST(X'"+Buffer.from(String(v),'utf8').toString('hex')+"' AS TEXT)":"'"+String(v).replaceAll("'","''")+"'";
function createBundle(reader,output,source,{readObject}={}){
 const target=path.resolve(output);if(fs.existsSync(target))throw Error('Choose a new output directory; existing files were not replaced');
 fs.mkdirSync(path.join(target,'blobs'),{recursive:true,mode:0o700});
 const defaults=new DatabaseSync(':memory:');defaults.exec(schema());
 try{
  const exported={},objects=[],manifest={format:'synapse-d1-r2',version:1,source,createdAt:new Date().toISOString(),sessionsMigrated:false,initializedTables:[],tables:exported,objects};
  for(const meta of Object.values(tables)){
   if(meta.name==='sessions')continue;
   let rows=reader(meta);if(!Array.isArray(rows))throw Error('Invalid source table: '+meta.name);
   if(!rows.length&&seeded.includes(meta.name)){rows=defaults.prepare('SELECT * FROM '+meta.name).all();manifest.initializedTables.push(meta.name);}
   for(const row of rows){const columns=meta.columns.map(c=>c.name);if(columns.some(c=>!Object.hasOwn(row,c))||Object.keys(row).some(c=>!columns.includes(c)&&c!=='__rowid'))throw Error('Source schema mismatch: '+meta.name);
    if(Object.hasOwn(row,'__rowid')){const ordinal=Number(row.__rowid);if(!Number.isSafeInteger(ordinal)||ordinal<1)throw Error('Unsafe record insertion order');row.__rowid=ordinal;}
    for(const c of meta.columns)if(/\bINTEGER\b/i.test(c.definition)&&typeof row[c.name]==='string'){const n=Number(row[c.name]);if(!Number.isSafeInteger(n))throw Error('Unsafe integer in '+meta.name);row[c.name]=n;}
    if(fileTables[meta.name]){
     const scope=fileTables[meta.name],bytes=row.content===null?readObject?.(scope,row.id):Buffer.from(row.content);
     if(!(bytes instanceof Uint8Array))throw Error('Missing private file: '+meta.name+'/'+row.id);
     const sha256=hash(bytes),file='blobs/'+sha256;fs.writeFileSync(path.join(target,file),bytes,{mode:0o600});
     objects.push({scope,id:row.id,object_key:`migration/${scope}/${encodeURIComponent(row.id)}/${sha256}`,name:row.name,mime:row.mime,size:bytes.length,sha256,created_at:manifest.createdAt,file});row.content=null;
    }
    if(Object.values(row).some(v=>v instanceof Uint8Array))throw Error('Unregistered blob column: '+meta.name);
    if(Buffer.byteLength(JSON.stringify(row))>1900000)throw Error('A row exceeds the D1 size limit: '+meta.name);
   }
   exported[meta.name]={rows,sha256:digest(rows)};
  }
  const text=JSON.stringify(manifest);fs.writeFileSync(path.join(target,'manifest.json'),text,{mode:0o600});
  validateBundle(target);fs.writeFileSync(path.join(target,'d1-import.sql'),importSql(manifest,hash(text)),{mode:0o600});return {directory:target,tables:Object.keys(exported).length,rows:Object.values(exported).reduce((n,t)=>n+t.rows.length,0),objects:objects.length,manifestHash:hash(text)};
 }catch(e){throw Error(e.message+'; incomplete private bundle retained at '+target);}finally{defaults.close();}
}
function loadBundle(directory){
 const root=path.resolve(directory),text=fs.readFileSync(path.join(root,'manifest.json'),'utf8'),manifest=JSON.parse(text);
 if(manifest.format!=='synapse-d1-r2'||manifest.version!==1||manifest.sessionsMigrated!==false||!manifest.tables||!Array.isArray(manifest.objects))throw Error('Unsupported migration bundle');
 const expected=Object.keys(tables).filter(n=>n!=='sessions');if(Object.keys(manifest.tables).sort().join()!==expected.sort().join())throw Error('Bundle table catalogue mismatch');
 const seen=new Set();for(const obj of manifest.objects){if(!['chambers','samaj'].includes(obj.scope)||typeof obj.id!=='string'||seen.has(obj.scope+':'+obj.id)||!Number.isSafeInteger(obj.size)||obj.size<0||! /^[a-f0-9]{64}$/.test(obj.sha256)||obj.file!=='blobs/'+obj.sha256||obj.object_key!==`migration/${obj.scope}/${encodeURIComponent(obj.id)}/${obj.sha256}`)throw Error('Invalid object manifest');seen.add(obj.scope+':'+obj.id);const bytes=fs.readFileSync(path.join(root,obj.file));if(bytes.length!==obj.size||hash(bytes)!==obj.sha256)throw Error('Private file checksum mismatch');}
 for(const [name,t]of Object.entries(manifest.tables)){if(!Array.isArray(t.rows)||digest(t.rows)!==t.sha256)throw Error('Table checksum mismatch: '+name);const cols=tables[name].columns.map(c=>c.name);for(const r of t.rows){if(cols.some(c=>!Object.hasOwn(r,c))||Object.keys(r).some(c=>!cols.includes(c)&&!(name==='records'&&c==='__rowid')))throw Error('Bundle schema mismatch: '+name);if(fileTables[name]&&(r.content!==null||!seen.has(fileTables[name]+':'+r.id)))throw Error('Missing private file manifest');}}
 const references=Object.entries(manifest.tables).filter(([n])=>fileTables[n]).reduce((n,[,t])=>n+t.rows.length,0);if(references!==manifest.objects.length)throw Error('Unlinked private file manifest');
 return {root,manifest,manifestHash:hash(text)};
}
function importSql(manifest,manifestHash){
 const lines=['-- Private full platform import; use only a NEW, unbound D1 target.','PRAGMA defer_foreign_keys=ON;','CREATE TABLE edge_import_values(id TEXT PRIMARY KEY,data TEXT NOT NULL);'];
 for(const name of [...seeded].reverse())lines.push('DELETE FROM '+name+';');
 let temporary=0;
 for(const [name,t]of Object.entries(manifest.tables))for(const row of t.rows){const columns=Object.keys(row),names=columns.map(c=>c==='__rowid'?'rowid':c);let values=columns.map(c=>literal(row[c])),sql='INSERT INTO '+name+'('+names.join(',')+') VALUES('+values.join(',')+');';if(Buffer.byteLength(sql)>95000){values=columns.map(c=>{if(typeof row[c]!=='string'||Buffer.byteLength(literal(row[c]))<20000)return literal(row[c]);const id='value-'+temporary++,points=Array.from(row[c]);lines.push(`INSERT INTO edge_import_values VALUES(${literal(id)},'');`);for(let i=0;i<points.length;i+=10000)lines.push(`UPDATE edge_import_values SET data=data||${literal(points.slice(i,i+10000).join(''))} WHERE id=${literal(id)};`);return `(SELECT data FROM edge_import_values WHERE id=${literal(id)})`;});sql='INSERT INTO '+name+'('+names.join(',')+') VALUES('+values.join(',')+');';}if(Buffer.byteLength(sql)>95000)throw Error('Row metadata exceeds D1 SQL import limits: '+name);lines.push(sql);}
 for(const o of manifest.objects){const columns=['scope','id','object_key','name','mime','size','sha256','created_at'];lines.push('INSERT INTO edge_objects('+columns.join(',')+') VALUES('+columns.map(k=>literal(o[k])).join(',')+');');}
 lines.push('DROP TABLE edge_import_values;',`INSERT INTO edge_imports VALUES(${literal(manifestHash)},${literal(manifestHash)},${literal(manifest.createdAt)});`);return lines.join('\n');
}
function validateBundle(directory){
 const {manifest,manifestHash}=loadBundle(directory),db=new DatabaseSync(':memory:');
 try{db.exec(schema());db.exec('BEGIN');db.exec(importSql(manifest,manifestHash));db.exec('COMMIT');if(db.prepare('PRAGMA foreign_key_check').all().length||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Imported database integrity failed');for(const [name,t]of Object.entries(manifest.tables)){const rows=db.prepare('SELECT '+tables[name].columns.map(c=>c.name).join(',')+(name==='records'?',rowid AS __rowid':'')+' FROM '+name).all();if(rows.length!==t.rows.length||digest(rows)!==t.sha256)throw Error('Imported content mismatch: '+name);}return {manifestHash,rows:Object.values(manifest.tables).reduce((n,t)=>n+t.rows.length,0),objects:manifest.objects.length};}finally{db.close();}
}
function exportSqlite(source,output){
 const input=path.resolve(source);if(!fs.existsSync(input))throw Error('SQLite source does not exist');const db=new DatabaseSync(input,{readOnly:true});
 try{db.exec('BEGIN');if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source integrity failed');const existing=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name));if([...existing].some(n=>!tables[n]&&!['schema_migrations'].includes(n)))throw Error('Source has an unregistered table');return createBundle(meta=>existing.has(meta.name)?db.prepare('SELECT *'+(meta.name==='records'?',rowid AS __rowid':'')+' FROM '+meta.name).all():[],output,'sqlite');}finally{db.close();}
}
function exportSqlServer(output){
 const {SqlServerDatabase}=require('../../packages/database/sqlserver'),db=new SqlServerDatabase();
 try{db.begin();return createBundle(meta=>db.native('SELECT '+meta.columns.map(c=>'['+c.name+']').join(',')+(meta.name==='records'?',created_order AS __rowid':'')+' FROM '+meta.qualified+' ORDER BY '+(meta.name==='records'?'created_order':meta.primary.map(c=>'['+c+']').join(','))),output,'sqlserver');}finally{if(db.inTransaction)db.rollback();db.close();}
}
function wrangler(args){
 if(args.includes('--local')&&persistTo)args=[...args,'--persist-to',persistTo];
 const bin=path.join(path.dirname(process.env.SYNAPSE_WRANGLER_PACKAGE||require.resolve('wrangler/package.json')),'bin/wrangler.js'),result=spawnSync(process.execPath,[bin,...args,'--config',path.join(__dirname,'wrangler.fullstack.jsonc')],{encoding:'utf8',windowsHide:true,maxBuffer:256*1024*1024});if(result.error)throw result.error;if(result.status!==0)throw Error('Wrangler operation failed: '+(result.stderr||result.stdout).slice(0,1500));return result.stdout;
}
function query(target,sql,mode){const output=wrangler(['d1','execute',target,mode,'--command',sql,'--json']);const results=JSON.parse(output);if(!Array.isArray(results)||results.some(r=>r.success===false))throw Error('D1 operation failed');return results.flatMap(r=>r.results||[]);}
function readTables(target,mode){
 const metas=Object.values(tables),counts=[],result=Object.fromEntries(metas.map(m=>[m.name,[]]));
 counts.push(...query(target,metas.map(m=>`SELECT '${m.name}' name,COUNT(*) n FROM ${m.name}`).join(';'),mode));
 const pages=[];for(const {name,n}of counts){const m=tables[name];for(let offset=0;offset<n;offset+=16)pages.push(`SELECT '${name}' name,json_object(${m.columns.flatMap(c=>[literal(c.name),c.name]).join(',')}${name==='records'?',\'__rowid\',rowid':''}) data FROM ${name} ORDER BY ${m.primary.join(',')} LIMIT 16 OFFSET ${offset}`);}
 let batch=[];const flush=()=>{if(!batch.length)return;for(const r of query(target,batch.join(';'),mode))result[r.name].push(JSON.parse(r.data));batch=[];};
 for(const page of pages){if(batch.length===100||batch.join(';').length+page.length>80000)flush();batch.push(page);}flush();
 for(const {name,n}of counts)if(result[name].length!==n)throw Error('Target changed during verification: '+name);return result;
}
function assertEmpty(target,mode){
 const seed=new DatabaseSync(':memory:');seed.exec(schema());try{const controls=query(target,'SELECT revision,(SELECT COUNT(*) FROM edge_objects) objects,(SELECT COUNT(*) FROM edge_imports) imports FROM edge_revision WHERE id=1',mode)[0];if(controls?.revision!==0||controls.objects!==0||controls.imports!==0)throw Error('Import requires a new target without application writes');const actual=readTables(target,mode);for(const meta of Object.values(tables)){if(digest(actual[meta.name])!==digest(seed.prepare('SELECT *'+(meta.name==='records'?',rowid AS __rowid':'')+' FROM '+meta.name).all()))throw Error('Import requires an empty schema-initialized target: '+meta.name);}}finally{seed.close();}
}
function verifyTarget(bundle,target,bucket,mode){
 const {manifest,manifestHash,root}=loadBundle(bundle);const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-r2-check-'));
 try{const actual=readTables(target,mode);for(const [name,t]of Object.entries(manifest.tables)){const rows=actual[name];if(rows.length!==t.rows.length||digest(rows)!==t.sha256)throw Error('D1 content verification failed: '+name);}if(query(target,'PRAGMA foreign_key_check',mode).length)throw Error('D1 foreign keys failed');if(actual.sessions.length)throw Error('Migration unexpectedly contains sessions');const refs=query(target,'SELECT * FROM edge_objects',mode);if(refs.length!==manifest.objects.length)throw Error('R2 metadata count differs');for(const o of manifest.objects){const ref=refs.find(r=>r.scope===o.scope&&r.id===o.id);if(!ref||Object.entries(ref).some(([k,v])=>o[k]!==v))throw Error('R2 metadata verification failed');const file=path.join(scratch,o.sha256);wrangler(['r2','object','get',bucket+'/'+o.object_key,mode,'--file',file]);const bytes=fs.readFileSync(file);if(bytes.length!==o.size||hash(bytes)!==o.sha256)throw Error('R2 content verification failed');}const marker=query(target,'SELECT manifest_hash FROM edge_imports',mode);if(marker.length!==1||marker[0].manifest_hash!==manifestHash)throw Error('Migration marker differs');return {verified:true,manifestHash,objects:manifest.objects.length};}finally{fs.rmSync(scratch,{recursive:true,force:true});}
}
function importTarget(bundle,target,bucket,mode,offline){
 if(!offline)throw Error('Import requires --unbound-target: create a new D1 database and private bucket before binding any Worker');if(!bucket||!target||!['--local','--remote'].includes(mode))throw Error('Specify target database, bucket and --local or --remote');
 const {manifest,manifestHash,root}=loadBundle(bundle);validateBundle(bundle);assertEmpty(target,mode);
 for(const o of manifest.objects)wrangler(['r2','object','put',bucket+'/'+o.object_key,mode,'--file',path.join(root,o.file),'--content-type','application/octet-stream']);
 // Regenerate from the verified manifest; never trust an edited SQL sidecar.
 const file=path.join(root,'d1-import.sql');fs.writeFileSync(file,importSql(manifest,manifestHash),{mode:0o600});wrangler(['d1','execute',target,mode,'--file',file,'--yes']);return verifyTarget(bundle,target,bucket,mode);
}
function exportD1(target,bucket,mode,output,frozen){
 if(!frozen)throw Error('Freeze workspace writes before backup and pass --frozen-source; backup spans D1 and R2');
 if(!target||!bucket||!['--local','--remote'].includes(mode))throw Error('Specify database, bucket and --local or --remote');const temp=fs.mkdtempSync(path.join(os.tmpdir(),'synapse-d1-export-'));
 try{const revision=query(target,'SELECT revision FROM edge_revision WHERE id=1',mode)[0].revision,rows=readTables(target,mode),refs=query(target,'SELECT * FROM edge_objects',mode);if(query(target,'SELECT revision FROM edge_revision WHERE id=1',mode)[0].revision!==revision)throw Error('Workspace changed during backup; freeze writes and retry');return createBundle(meta=>rows[meta.name],output,'d1',{readObject:(scope,id)=>{const o=refs.find(r=>r.scope===scope&&r.id===id);if(!o)throw Error('R2 metadata missing');const file=path.join(temp,'object');wrangler(['r2','object','get',bucket+'/'+o.object_key,mode,'--file',file]);const bytes=fs.readFileSync(file);if(bytes.length!==o.size||hash(bytes)!==o.sha256)throw Error('R2 backup checksum failed');return bytes;}});}finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module){
 try{
  const args=process.argv.slice(2),command=args.shift(),flag=k=>args.includes(k);
  const value=k=>{const i=args.indexOf(k);if(i<0||!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing argument '+k);return args[i+1];};
  if(flag('--local')&&flag('--remote'))throw Error('Choose either --local or --remote');
  const mode=flag('--remote')?'--remote':flag('--local')?'--local':null;
  if(flag('--persist-to'))persistTo=path.resolve(value('--persist-to'));
  let result;
  if(command==='export'&&flag('--sqlite'))result=exportSqlite(value('--sqlite'),value('--output'));
  else if(command==='export'&&flag('--sqlserver'))result=exportSqlServer(value('--output'));
  else if(command==='export'&&flag('--d1'))result=exportD1(value('--database'),value('--bucket'),mode,value('--output'),flag('--frozen-source'));
  else if(command==='validate')result=validateBundle(value('--bundle'));
  else if(command==='import')result=importTarget(value('--bundle'),value('--database'),value('--bucket'),mode,flag('--unbound-target'));
  else if(command==='verify')result=verifyTarget(value('--bundle'),value('--database'),value('--bucket'),mode);
  else throw Error('Use export --sqlite PATH|--sqlserver|--d1 --output PATH, validate --bundle PATH, or import/verify --bundle PATH --database NAME --bucket NAME --local|--remote. Import requires --unbound-target; D1 export requires --frozen-source.');
  console.log(JSON.stringify(result,null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={createBundle,loadBundle,validateBundle,exportSqlite,importSql,importTarget,verifyTarget};
