// Read-only structure audit. Source schemas are replayed only in memory; an
// optional existing Node database is opened read-only. Remote input must be the
// schema/aggregate-role result, never a recovery export or business-record dump.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
const readJson=file=>{const bytes=fs.readFileSync(file);return JSON.parse((bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8')).replace(/^\uFEFF/,''));};
const quote=value=>'"'+value.replaceAll('"','""')+'"';
function owner(name){
 if(['_cf_KV','d1_migrations'].includes(name))return 'D1 system';
 if(['users','sessions','audit','settings','app_access','platform_preferences'].includes(name))return 'Shared identity and compatibility';
 if(name.startsWith('platform_'))return 'Organisation administration';
 if(name.startsWith('chambers_')||['records','files'].includes(name))return 'Chambers';
 if(name.startsWith('batchfee_'))return 'BatchFee Lite';
 if(name.startsWith('samaj_'))return 'DIGITAL SAMAJ';
 if(name.startsWith('tournament_'))return 'Tournament Lite';
 if(name.startsWith('pandit_'))return 'Pandit Booking';
 if(name.startsWith('arena_'))return 'Satire Arena';
 if(name.startsWith('edge_'))return 'D1 infrastructure';
 if(name.startsWith('news_')||name.startsWith('fund_lens_'))return 'Retired recovery';
 return 'Unclassified';
}
function inspect(db){
 return db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(table=>({
  name:table.name,owner:owner(table.name),
  columns:db.prepare('PRAGMA table_info('+quote(table.name)+')').all().map(({name,type,notnull,pk})=>({name,type,required:!!notnull,primaryOrder:pk})),
  foreignKeys:db.prepare('PRAGMA foreign_key_list('+quote(table.name)+')').all().map(({id,seq,table,from,to,on_update,on_delete})=>({id,seq,table,from,to,onUpdate:on_update,onDelete:on_delete})),
  indexes:db.prepare('PRAGMA index_list('+quote(table.name)+')').all().map(index=>({name:index.name,unique:!!index.unique,columns:db.prepare('PRAGMA index_info('+quote(index.name)+')').all().map(column=>column.name)})),
  sql:table.sql
 }));
}
function audit({productionMetadata,localDatabase}={}){
 const folder=path.join(root,'infrastructure/cloudflare/d1-free-migrations'),files=fs.readdirSync(folder).filter(file=>file.endsWith('.sql')).sort(),source=new DatabaseSync(':memory:');
 let sourceTables;
 try{for(const file of files)source.exec(fs.readFileSync(path.join(folder,file),'utf8'));sourceTables=inspect(source);}finally{source.close();}
 const native=new DatabaseSync(':memory:');let nativeSourceTables;
 try{for(const [,dir,files] of require('../packages/database/catalog').owners.filter(([,dir])=>!dir.includes('/retired/')))for(const file of files)native.exec(fs.readFileSync(path.join(root,dir,file),'utf8'));nativeSourceTables=inspect(native);}finally{native.close();}
 const result={scope:'Schema definitions and aggregate role counts only; no business rows or credential values.',migrationFiles:files,sourceTables,nativeSourceTables};
 if(productionMetadata){
  const responses=readJson(productionMetadata);if(responses.length!==4||responses.some(response=>!response.success))throw Error('Expected four successful schema/aggregate-role queries');
  const metadata=responses[0].results;if(!Array.isArray(metadata)||!metadata.every(row=>['table','index','view'].includes(row.type)&&typeof row.name==='string'))throw Error('Unexpected schema metadata');
  const db=new DatabaseSync(':memory:');
  try{for(const type of ['table','view','index'])for(const row of metadata.filter(row=>row.type===type&&row.sql))db.exec(row.sql);result.productionTables=inspect(db);}finally{db.close();}
  result.aggregateRoles={assignments:responses[1].results,memberships:responses[2].results,legacyAccounts:responses[3].results};
  const sourceNames=new Set(sourceTables.map(table=>table.name)),productionNames=new Set(result.productionTables.map(table=>table.name));
  const shape=table=>JSON.stringify({columns:table.columns,foreignKeys:table.foreignKeys,indexes:[...table.indexes].sort((a,b)=>a.name.localeCompare(b.name))});
  result.differences={productionOnly:[...productionNames].filter(name=>!sourceNames.has(name)),sourceOnly:[...sourceNames].filter(name=>!productionNames.has(name)),columnsKeysOrIndexes:result.productionTables.filter(table=>sourceNames.has(table.name)&&shape(table)!==shape(sourceTables.find(source=>source.name===table.name))).map(table=>table.name)};
 }
 if(localDatabase){const db=new DatabaseSync(localDatabase,{readOnly:true});try{result.localTables=inspect(db);}finally{db.close();}}
 const tables=result.productionTables||sourceTables;result.summary={tables:tables.length,groups:Object.fromEntries([...new Set(tables.map(table=>table.owner))].map(group=>[group,tables.filter(table=>table.owner===group).length])),sourceTables:sourceTables.length,nativeSourceTables:nativeSourceTables.length,localTables:result.localTables?.length??null};
 return result;
}
if(require.main===module){
 try{const args=process.argv.slice(2),value=flag=>{const at=args.indexOf(flag);return at<0?undefined:args[at+1];};const result=audit({productionMetadata:value('--production-metadata'),localDatabase:value('--local-database')});const output=value('--output');if(output){fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({summary:result.summary,differences:result.differences,output}));}else console.log(JSON.stringify(result,null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={audit};
