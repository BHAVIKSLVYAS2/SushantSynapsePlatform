'use strict';
const {tables,qualified,sqliteSql,splitSql}=require('./catalog');
// Compatibility for the deliberately bounded query vocabulary used by existing repositories.
// Values remain driver parameters. This is not an arbitrary SQLite SQL interpreter.
function outsideStrings(sql,fn){return sql.split(/('(?:''|[^'])*')/g).map((part,i)=>i%2?part:fn(part)).join('');}
function compile(sql){
 sql=sqliteSql(sql);
 let index=0;
 sql=outsideStrings(sql,s=>s.replace(/\?/g,()=>`@p${index++}`));
 sql=outsideStrings(sql,s=>s.replace(/\b(FROM|JOIN|INTO|UPDATE)\s+([a-z][a-z0-9_]*)\b/gi,(match,op,name)=>{
  if(name==='ancestors'||name==='SET')return match;
  return `${op} ${qualified(name)}`;
 }));
 // SQL Server has no implicit insertion order or SQLite LIMIT clause.
 sql=outsideStrings(sql,s=>s.replace(/\browid\b/g,'created_order'));
 const limit=/\s+LIMIT\s+(\d+)\s*;?$/i.exec(sql);
 if(limit){sql=sql.slice(0,limit.index);sql=sql.replace(/^SELECT\s+(DISTINCT\s+)?/i,(_,distinct)=>`SELECT ${distinct||''}TOP (${limit[1]}) `);}
 if(/^WITH RECURSIVE ancestors\(id\)/.test(sql))sql=sql.replace('WITH RECURSIVE','WITH').replace(/AS \(SELECT (@p\d+) UNION SELECT/,"AS (SELECT CAST($1 AS NVARCHAR(100)) COLLATE Latin1_General_100_BIN2 UNION ALL SELECT")+' OPTION (MAXRECURSION 100)';
 const insert=/^INSERT( OR IGNORE| OR REPLACE)? INTO (\[\w+\]\.\[(\w+)\])\s*(?:\(([^)]*)\))?\s*VALUES\s*\(([^)]*)\)(?:\s+ON CONFLICT\(([^)]*)\) DO UPDATE SET ([\s\S]*))?\s*;?$/i.exec(sql);
 if(insert){
  const [,mode,table,name,supplied,values,conflicts,update]=insert,meta=tables[name];
  if(!meta)throw Error('Unknown SQL Server insert target');
  const columns=supplied?splitSql(supplied).map(c=>c.replace(/[\[\]]/g,'')):meta.columns.map(c=>c.name),expressions=splitSql(values);
  if(columns.length!==expressions.length)throw Error('Insert column/value mismatch: '+name);
  const input=Object.fromEntries(columns.map((c,i)=>[c,expressions[i]]));
  const base=`INSERT INTO ${table} (${columns.map(c=>'['+c+']').join(',')}) VALUES (${expressions.join(',')})`;
  const predicate=keys=>keys.map(c=>`[${c}]=${input[c]}`).join(' AND ');
  if(conflicts||mode===' OR REPLACE'){
   const keys=conflicts?splitSql(conflicts):meta.primary;
   if(keys.some(c=>!Object.hasOwn(input,c)))throw Error('Missing conflict key');
   const assignments=update?update.replace(/excluded\.(\w+)/g,(_,c)=>{if(!Object.hasOwn(input,c))throw Error('Unknown upsert input');return input[c];}):columns.filter(c=>!keys.includes(c)).map(c=>`[${c}]=${input[c]}`).join(',');
   if(!assignments)throw Error('Empty upsert');
   return {text:`UPDATE ${table} WITH (UPDLOCK,HOLDLOCK) SET ${assignments} WHERE ${predicate(keys)}; IF @@ROWCOUNT=0 ${base};`,parameters:index,write:true};
  }
  if(mode===' OR IGNORE'){
   const keys=[meta.primary,...meta.unique].filter(k=>k.length&&k.every(c=>Object.hasOwn(input,c)));
   if(!keys.length)throw Error('Missing ignore conflict keys');
   return {text:`IF NOT EXISTS(SELECT 1 FROM ${table} WITH (UPDLOCK,HOLDLOCK) WHERE ${keys.map(k=>'('+predicate(k)+')').join(' OR ')}) ${base};`,parameters:index,write:true};
  }
  return {text:base,parameters:index,write:true};
 }
 if(/\b(PRAGMA|ON CONFLICT|INSERT OR|json_extract|json_valid|RETURNING|ATTACH|DETACH)\b/i.test(outsideStrings(sql,s=>s)))throw Error('Unsupported SQL Server repository query');
 return {text:sql,parameters:index,write:/^(INSERT|UPDATE|DELETE)\b/i.test(sql)};
}
module.exports={compile,outsideStrings};
