'use strict';
const {DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {tables}=require('./catalog');
const {migrations}=require('./sqlserver-migrations');
function literal(value){if(value===null)return 'NULL';if(value instanceof Uint8Array)return '0x'+Buffer.from(value).toString('hex');if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid exported number');return String(value);}return "N'"+String(value).replaceAll("'","''")+"'";}
function digest(rows){const canonical=rows.map(row=>JSON.stringify(Object.fromEntries(Object.keys(row).sort().map(key=>{const value=row[key];return [key,value instanceof Uint8Array?{blob:Buffer.from(value).toString('hex')}:value];})))).sort();return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');}
function readTarget(db,meta){return db.native(`SELECT ${meta.columns.map(c=>'['+c.name+']').join(',')} FROM ${meta.qualified} ORDER BY ${meta.primary.map(c=>'['+c+']').join(',')}`).map(row=>{for(const column of meta.columns){if(/\bINTEGER\b/i.test(column.definition)&&typeof row[column.name]==='string'){const value=Number(row[column.name]);if(!Number.isSafeInteger(value))throw Error('Migrated integer exceeds safe application range');row[column.name]=value;}}return row;});}
function importSqlite(db,source){
 const resolved=path.resolve(source);if(!fs.existsSync(resolved))throw Error('SQLite migration source does not exist');
 const input=new DatabaseSync(resolved,{readOnly:true}),checks=[];
 try{input.exec('BEGIN');if(input.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||input.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source database integrity/foreign keys failed');
  const existing=input.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);
  if(existing.some(name=>!tables[name]))throw Error('Source contains an unregistered table; migrate its owning schema first');
  db.begin();try{
   for(const meta of Object.values(tables))if(db.native(`SELECT COUNT(*) AS n FROM ${meta.qualified}`)[0].n!==0)throw Error('Migration requires an empty target database; existing data was not replaced');
   for(const meta of Object.values(tables))db.native(`ALTER TABLE ${meta.qualified} NOCHECK CONSTRAINT ALL`);
   for(const meta of Object.values(tables)){
    if(meta.name==='sessions'||!existing.includes(meta.name))continue; // Credentials retained, active sessions deliberately expire at cutover.
    const rows=input.prepare(`SELECT * FROM "${meta.name}" ORDER BY ${meta.primary.map(c=>'"'+c+'"').join(',')}`).all();
    const columns=meta.columns.map(c=>c.name);if(rows.some(r=>Object.keys(r).length!==columns.length||columns.some(c=>!Object.hasOwn(r,c))))throw Error('Source schema mismatch: '+meta.name);
    const identity=meta.columns.some(c=>c.identity);if(identity)db.native(`SET IDENTITY_INSERT ${meta.qualified} ON`);
    // Preserve Chambers' explicit insertion order when replacing SQLite rowid.
    const recordsOrder=meta.name==='records'?new Map(input.prepare('SELECT kind,id,rowid FROM records').all().map(r=>[r.kind+':'+r.id,r.rowid])):null;
    if(recordsOrder)db.native(`SET IDENTITY_INSERT ${meta.qualified} ON`);
    for(const row of rows){const names=recordsOrder?[...columns,'created_order']:columns,values=columns.map(c=>row[c]);if(recordsOrder)values.push(recordsOrder.get(row.kind+':'+row.id));db.native(`INSERT INTO ${meta.qualified} (${names.map(c=>'['+c+']').join(',')}) VALUES (${names.map((_,i)=>'@p'+i).join(',')})`,values);}
    if(identity||recordsOrder)db.native(`SET IDENTITY_INSERT ${meta.qualified} OFF`);
    const target=readTarget(db,meta),hash=digest(rows);if(rows.length!==target.length||hash!==digest(target))throw Error('Migration content verification failed: '+meta.name);checks.push({table:meta.qualified,rows:rows.length,sha256:hash});
   }
   for(const meta of Object.values(tables))db.native(`ALTER TABLE ${meta.qualified} WITH CHECK CHECK CONSTRAINT ALL`);
   db.commit();input.exec('COMMIT');return {source:resolved,sessionsMigrated:false,tables:checks};
  }catch(error){db.rollback();throw error;}
 }finally{input.close();}
}
function exportSqlServer(store){
 return store.transaction(()=>{
  const lines=['-- Full platform SQL Server export. Import into a NEW empty database. Private account hashes and document blobs included; sessions excluded.','SET XACT_ABORT ON;','BEGIN TRANSACTION;'];
  const applied=store.sql.native('SELECT id,hash,applied_at FROM [platform].[schema_migrations]'),sources=migrations();
  if(applied.length!==sources.length||sources.some(source=>!applied.some(row=>row.id===source.id&&row.hash===source.hash)))throw Error('Recovery export migration mismatch');
  for(const source of sources)lines.push(source.source);
  lines.push("CREATE TABLE [platform].[schema_migrations](id NVARCHAR(100) NOT NULL PRIMARY KEY,hash CHAR(64) NOT NULL,applied_at NVARCHAR(30) NOT NULL);");
  for(const row of applied)lines.push(`INSERT INTO [platform].[schema_migrations] VALUES(${literal(row.id)},${literal(row.hash)},${literal(row.applied_at)});`);
  for(const meta of Object.values(tables))lines.push(`ALTER TABLE ${meta.qualified} NOCHECK CONSTRAINT ALL;`);
  for(const meta of Object.values(tables)){
   if(meta.name==='sessions')continue;
   const identity=meta.columns.some(c=>c.identity)||meta.name==='records';if(identity)lines.push(`SET IDENTITY_INSERT ${meta.qualified} ON;`);
   const columns=meta.columns.map(c=>c.name);if(meta.name==='records')columns.push('created_order');
   const records=store.sql.native(`SELECT ${columns.map(c=>'['+c+']').join(',')} FROM ${meta.qualified} ORDER BY ${meta.primary.map(c=>'['+c+']').join(',')}`);
   for(const row of records)lines.push(`INSERT INTO ${meta.qualified} (${columns.map(c=>'['+c+']').join(',')}) VALUES (${columns.map(c=>literal(row[c])).join(',')});`);
   if(identity)lines.push(`SET IDENTITY_INSERT ${meta.qualified} OFF;`);
  }
  for(const meta of Object.values(tables))lines.push(`ALTER TABLE ${meta.qualified} WITH CHECK CHECK CONSTRAINT ALL;`);
  lines.push('COMMIT;');return lines.join('\n');
 });
}
function importArena(db,source){
 const resolved=path.resolve(source);if(!fs.existsSync(resolved))throw Error('Arena migration source does not exist');
 let input;
 if(path.extname(resolved).toLowerCase()==='.sql'){
  if(fs.statSync(resolved).size>256*1024*1024)throw Error('Arena dump exceeds 256 MiB');
  const dump=fs.readFileSync(resolved,'utf8');
  if(/\b(ATTACH|DETACH|VACUUM|load_extension|writable_schema)\b/i.test(dump))throw Error('Unsupported command in Arena dump');
  input=new DatabaseSync(':memory:');try{input.exec(dump);}catch(error){input.close();throw error;}
 }else input=new DatabaseSync(resolved,{readOnly:true});
 const names=['arena_votes','arena_expanded_votes','arena_cast_votes','arena_additions_votes','arena_speakers_votes','arena_anchors_votes','arena_spotlight_votes'],checks=[];
 try{
  input.exec('BEGIN');if(input.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Arena source integrity failed');
  const existing=input.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row=>row.name);
  if(!names.some(name=>existing.includes(name))||existing.some(name=>!names.includes(name)&&!['_cf_KV','d1_migrations'].includes(name)))throw Error('Source must be an Arena-only D1 export/snapshot');
  db.begin();try{
   for(const name of names)if(db.native(`SELECT COUNT(*) AS n FROM ${tables[name].qualified}`)[0].n!==0)throw Error('Arena migration requires empty satire ballot tables; other app data is preserved');
   for(const name of names){
    const meta=tables[name];if(!existing.includes(name))continue;
    const rows=input.prepare(`SELECT * FROM "${name}" ORDER BY voter,character,round`).all(),columns=meta.columns.map(column=>column.name);
    if(rows.some(row=>Object.keys(row).length!==columns.length||columns.some(column=>!Object.hasOwn(row,column))))throw Error('Arena source schema mismatch: '+name);
    for(const row of rows)db.native(`INSERT INTO ${meta.qualified} (${columns.map(column=>'['+column+']').join(',')}) VALUES (${columns.map((_,i)=>'@p'+i).join(',')})`,columns.map(column=>row[column]));
    const target=readTarget(db,meta),hash=digest(rows);if(rows.length!==target.length||hash!==digest(target))throw Error('Arena content verification failed: '+name);
    checks.push({table:meta.qualified,rows:rows.length,sha256:hash});
   }
   db.commit();input.exec('COMMIT');return {source:resolved,tables:checks};
  }catch(error){db.rollback();throw error;}
 }finally{input.close();}
}
module.exports={importSqlite,importArena,exportSqlServer,digest,literal};
