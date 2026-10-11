'use strict';
// Reconstruct a verified D1-only restore from an owner's offline D1 SQL export.
// No network calls, application writes or source-file modifications.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto');
const {tables}=require('../../packages/database/catalog'),{digest}=require('../../packages/database/sqlserver-transfer');
const {schema}=require('./build-d1.cjs'),{statements}=require('./sql-statements.cjs'),{importSql}=require('./transfer.cjs'),{documentSql}=require('./free-import.cjs');
function prepareRecovery(sqlFile,output){
 const target=path.resolve(output);if(fs.existsSync(target))throw Error('Choose a new recovery directory');
 const source=new DatabaseSync(':memory:'),restored=new DatabaseSync(':memory:');
 try{
  const dump=fs.readFileSync(sqlFile,'utf8');
  for(const statement of statements(dump)){if(!/^(CREATE\s+(?:TABLE|INDEX|UNIQUE\s+INDEX|TRIGGER|VIEW)\b|DROP\s+VIEW\b|INSERT\s+(?:OR\s+IGNORE\s+)?INTO\b|BEGIN\b|COMMIT\b|PRAGMA\s+(?:defer_foreign_keys|foreign_keys)\s*=\s*(?:ON|OFF|0|1)\s*;?$)/i.test(statement.trim()))throw Error('Unsupported D1 export statement');}
  source.exec(dump);if(source.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||source.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source export integrity failed');
  if(source.prepare('SELECT COUNT(*) n FROM edge_objects').get().n)throw Error('This tool only restores D1-only workspaces');
  const exported={};for(const meta of Object.values(tables)){if(meta.name==='sessions')continue;const rows=source.prepare('SELECT '+meta.columns.map(c=>c.name).join(',')+(meta.name==='records'?',rowid AS __rowid':'')+' FROM '+meta.name).all();exported[meta.name]={rows,sha256:digest(rows)};}
  const objects=source.prepare('SELECT id,name,mime,size,sha256,created_at FROM edge_document_blobs ORDER BY id').all();
  const manifest={format:'synapse-d1-only-recovery',version:1,createdAt:new Date().toISOString(),sessionsMigrated:false,tables:exported,objects};
  const manifestHash=createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  const sql=importSql({...manifest,objects:[]},manifestHash)+'\n'+documentSql(objects,object=>Buffer.from(source.prepare('SELECT content FROM edge_document_blobs WHERE id=?').get(object.id).content));
  restored.exec(schema());for(const file of ['0002-free-guards.sql','0003-document-blobs.sql'])restored.exec(fs.readFileSync(path.join(__dirname,'d1-free-migrations',file),'utf8'));
  restored.exec('BEGIN');restored.exec(sql);restored.exec('COMMIT');
  if(restored.prepare('PRAGMA foreign_key_check').all().length)throw Error('Recovery foreign keys failed');
  for(const [name,t]of Object.entries(exported)){const meta=tables[name],rows=restored.prepare('SELECT '+meta.columns.map(c=>c.name).join(',')+(name==='records'?',rowid AS __rowid':'')+' FROM '+name).all();if(digest(rows)!==t.sha256)throw Error('Recovery table checksum differs: '+name);}
  for(const object of objects){const bytes=restored.prepare('SELECT content FROM edge_document_blobs WHERE id=?').get(object.id).content;if(createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw Error('Recovery document checksum differs');}
  fs.mkdirSync(target,{recursive:true,mode:0o700});fs.writeFileSync(path.join(target,'d1-restore.sql'),sql,{mode:0o600});fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest),{mode:0o600});
  return {verified:true,manifestHash,tables:Object.keys(exported).length,documents:objects.length,sessionsMigrated:false};
 }finally{source.close();restored.close();}
}
if(require.main===module){try{const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Required: '+flag);return args[i+1];};console.log(JSON.stringify(prepareRecovery(value('--sql'),value('--output')),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepareRecovery};
