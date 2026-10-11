'use strict';
// Prepare D1-only SQL from a verified full backup. Never modifies the source bundle
// or executes SQL against a live cloud database. Private bytes remain in the backup.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto');
const {validateBundle,loadBundle,importSql}=require('./transfer.cjs');
const {schema}=require('./build-d1.cjs');
function documentSql(objects,readBytes){
 const literal=value=>"'"+String(value).replaceAll("'","''")+"'",lines=[];
 for(const object of objects){
  const samaj=object.scope==='samaj',table=samaj?'edge_samaj_blobs':'edge_document_blobs';
  if(samaj&&!['samaj_files','samaj_message_attachments'].includes(object.kind))throw Error('Invalid Samaj file owner');
  const bytes=readBytes(object);
  if(bytes.length!==object.size||bytes.length<1||bytes.length>1000000||createHash('sha256').update(bytes).digest('hex')!==object.sha256)throw Error('Document bytes or hash differ');
  lines.push(`INSERT INTO ${table} VALUES(${literal(object.id)},${samaj?(object.kind==='samaj_files'?literal(object.id)+',NULL,':'NULL,'+literal(object.id)+','):''}${literal(object.name)},${literal(object.mime)},${object.size},${literal(object.sha256)},zeroblob(${object.size}),${literal(object.created_at)});`);
  for(let offset=0;offset<bytes.length;offset+=32000){const chunk=bytes.subarray(offset,offset+32000);lines.push(`UPDATE ${table} SET content=CAST(substr(content,1,${offset})||X'${chunk.toString('hex')}'||substr(content,${offset+chunk.length+1}) AS BLOB) WHERE id=${literal(object.id)};`);}
 }
 return lines.join('\n');
}
function prepareFreeImport(bundle,output){
 validateBundle(bundle);const {manifest,manifestHash}=loadBundle(bundle),target=path.resolve(output);
 if(fs.existsSync(target))throw Error('Choose a new output directory');
 const records=manifest.tables.records.rows,users=manifest.tables.users.rows;
 if(!users.some(u=>u.active&&u.role==='Owner'))throw Error('An active owner is required before free deployment');
 if(users.length>25||records.length>250||records.some(r=>Buffer.byteLength(r.data)>8192)||records.reduce((n,r)=>n+Buffer.byteLength(r.data),0)>262144)throw Error('The source exceeds free workspace capacity; no records were removed');
 const copy=structuredClone(manifest);copy.objects=[];
 const objects=manifest.objects.filter(o=>['chambers','samaj'].includes(o.scope)&&o.size<=1000000).map(o=>({...o,...(o.scope==='samaj'?{kind:manifest.tables.samaj_files.rows.some(f=>f.id===o.id)?'samaj_files':'samaj_message_attachments'}:{})}));
 if(objects.reduce((sum,o)=>sum+o.size,0)>100000000)throw Error('Source documents exceed the 100 MB D1 limit; source files were preserved');
 const id=createHash('sha256').update('synapse-free-v3:'+manifestHash).digest('hex'),sql=importSql(copy,id)+'\n'+documentSql(objects,object=>fs.readFileSync(path.join(path.resolve(bundle),object.file)));
 const db=new DatabaseSync(':memory:');
 try{db.exec(schema());for(const file of ['0002-free-guards.sql','0003-document-blobs.sql','0004-samaj-blobs.sql'])db.exec(fs.readFileSync(path.join(__dirname,'d1-free-migrations',file),'utf8'));db.exec('BEGIN');db.exec(sql);db.exec('COMMIT');if(db.prepare('PRAGMA foreign_key_check').all().length||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Free import integrity failed');for(const object of objects){const row=db.prepare('SELECT content FROM '+(object.scope==='samaj'?'edge_samaj_blobs':'edge_document_blobs')+' WHERE id=?').get(object.id);if(createHash('sha256').update(row.content).digest('hex')!==object.sha256)throw Error('Imported document checksum mismatch');}}finally{db.close();}
 fs.mkdirSync(target,{recursive:true,mode:0o700});fs.writeFileSync(path.join(target,'d1-free-import.sql'),sql,{mode:0o600});
 const report={profile:'synapse-free-v3',sourceManifestHash:manifestHash,importId:id,accounts:users.length,records:records.length,importedDocuments:objects.length,importedDocumentBytes:objects.reduce((n,o)=>n+o.size,0),localOnlyObjects:manifest.objects.length-objects.length,documentsAvailable:true,sessionsMigrated:false,sourceBundlePreserved:true};
 fs.writeFileSync(path.join(target,'free-plan.json'),JSON.stringify(report,null,2),{mode:0o600});return report;
}
if(require.main===module){try{const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);if(i<0||!args[i+1])throw Error('Required: '+flag);return args[i+1];};console.log(JSON.stringify(prepareFreeImport(value('--bundle'),value('--output')),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={prepareFreeImport,documentSql};
