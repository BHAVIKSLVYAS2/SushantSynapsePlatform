'use strict';
// Initial migration generator. Once deployed, add ordered migrations rather than rewriting v1.
const fs=require('node:fs'),path=require('node:path');
const {ROOT,owners,tables,views,qualified,splitSql}=require('../packages/database/catalog');
function type(c){
 if(/\bBLOB\b/.test(c.definition))return 'VARBINARY(MAX)';
 if(/\bREAL\b/.test(c.definition))return 'FLOAT(53)'; // Preserve SQLite REAL / existing JS double values exactly.
 if(/\bINTEGER\b/.test(c.definition))return 'BIGINT';
 if(['data','privacy','old_value','new_value','sourceJson','body','satireBody','brief','description'].includes(c.name))return 'NVARCHAR(MAX)';
 if(c.name==='url')return 'NVARCHAR(2000)';
 if(c.name==='scope_value')return 'NVARCHAR(600)';
 if(['name','title','label','reason','schemeName'].includes(c.name))return 'NVARCHAR(2000)';
 if(c.name==='password')return 'NVARCHAR(512)';
 if(c.name==='email')return 'NVARCHAR(200)';
 return 'NVARCHAR(100)';
}
const extras={
 records:["case_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.caseId')) PERSISTED","client_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.clientId')) PERSISTED","invoice_key AS CONVERT(NVARCHAR(100),JSON_VALUE(data,'$.invoiceId')) PERSISTED","created_order BIGINT IDENTITY(1,1) NOT NULL"],
 news_stories:["url_hash AS CONVERT(BINARY(32),HASHBYTES('SHA2_256',url)) PERSISTED"],
 samaj_grants:["scope_hash AS CONVERT(BINARY(32),HASHBYTES('SHA2_256',scope_value)) PERSISTED"],
 samaj_reviews:["family_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.familyId'),'')) PERSISTED","related_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.relatedId'),'')) PERSISTED","type_key AS CONVERT(NVARCHAR(100),COALESCE(JSON_VALUE(new_value,'$.type'),'')) PERSISTED"],
 samaj_conversations:["pair_low AS (CASE WHEN sender<receiver THEN sender ELSE receiver END) PERSISTED","pair_high AS (CASE WHEN sender<receiver THEN receiver ELSE sender END) PERSISTED"],
};
function definition(c){
 let rest=c.definition.replace(/^\w+\s+\w+/, '').replace(/AUTOINCREMENT/g,'').replace(/DEFERRABLE INITIALLY DEFERRED/g,'');
 rest=rest.replace(/REFERENCES (\w+)\((\w+)\)/g,(_,table,col)=>`REFERENCES ${qualified(table)}([${col}])`);
 rest=rest.replace(/json_valid\((\w+)\)/g,'ISJSON($1, VALUE)=1');
 if(/PRIMARY KEY/.test(rest)||c.identity)rest=' NOT NULL'+rest.replace(/NOT NULL/g,'');
 if(c.identity)rest=rest.replace(/PRIMARY KEY/,'PRIMARY KEY');
 return `[${c.name}] ${type(c)}${c.identity?' IDENTITY(1,1)':''}${type(c).startsWith('NVARCHAR')?' COLLATE Latin1_General_100_BIN2':''}${rest}`.trimEnd();
}
function transformView(sql){
 sql=sql.replace(/json_extract\(data,\s*'\$\.archived'\)/g,"CASE WHEN JSON_VALUE(data,'$.archived')='true' THEN 1 ELSE 0 END");
 sql=sql.replace(/json_extract\(data,\s*'\$\.amount'\)/g,"CONVERT(DECIMAL(19,2),JSON_VALUE(data,'$.amount'))");
 sql=sql.replace(/json_extract\(/g,'JSON_VALUE(');
 sql=sql.replace(/\b(FROM|JOIN)\s+(\w+)/g,(_,op,name)=>`${op} ${qualified(name)}`);
 return sql.replace(/GROUP BY i\.id;/,'GROUP BY i.id,i.invoice_number,i.client_id,i.amount;');
}
for(const [schema,dir,files]of owners.filter(owner=>!process.argv[2]||owner[0]===process.argv[2])){const output=[`-- ${schema} schema, SQL Server 2022+ / Azure SQL. Version 1; one database.`, `IF SCHEMA_ID(N'${schema}') IS NULL EXEC(N'CREATE SCHEMA [${schema}] AUTHORIZATION [dbo]');`];
 const text=files.map(file=>fs.readFileSync(path.join(ROOT,dir,file),'utf8')).join('\n');
 for(const table of Object.values(tables).filter(t=>t.schema===schema)){
  const defs=table.columns.map(definition);
  for(const d of table.definitions.filter(d=>/^(PRIMARY|UNIQUE|CHECK)\b/.test(d))){
   if(d==='UNIQUE(editionDate,url)'){defs.push('UNIQUE(editionDate,url_hash)');continue;}
   if(d==='UNIQUE(user_id,samaj_id,role_id,scope,scope_value)'){defs.push('UNIQUE(user_id,samaj_id,role_id,scope,scope_hash)');continue;}
   if(d==='CHECK((person_id IS NULL)<>(family_id IS NULL))'){defs.push('CHECK((person_id IS NULL AND family_id IS NOT NULL) OR (person_id IS NOT NULL AND family_id IS NULL))');continue;}
   defs.push(d);
  }
  defs.push(...(extras[table.name]||[]));
  output.push(`IF OBJECT_ID(N'${table.qualified}',N'U') IS NULL\nCREATE TABLE ${table.qualified}(\n ${defs.join(',\n ')}\n);`);
 }
 for(const m of text.matchAll(/CREATE (UNIQUE )?INDEX IF NOT EXISTS (\w+) ON (\w+)\(([^\n;]*)\)(\s+WHERE[^;]*)?;/g)){
  let fields=m[4];
  if(m[2]==='records_case')fields='kind,case_key';if(m[2]==='records_client')fields='kind,client_key';if(m[2]==='records_invoice')fields='kind,invoice_key';
  if(m[2]==='samaj_pending_review')fields='kind,entity_id,family_key,related_key,type_key';
  if(m[2]==='samaj_open_conversation')fields='samaj_id,pair_low,pair_high';
  const table=qualified(m[3]);output.push(`IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'${table}') AND name=N'${m[2]}')\nCREATE ${m[1]||''}INDEX [${m[2]}] ON ${table}(${fields})${m[5]||''};`);
 }
 if(schema!=='satire')for(const m of text.matchAll(/CREATE VIEW IF NOT EXISTS (\w+) AS\s*([\s\S]*?);/g))output.push(`EXEC(N'CREATE OR ALTER VIEW ${qualified(m[1])} AS ${transformView(m[2]+';').replaceAll("'","''")}');`);
 if(schema==='satire')output.push("EXEC(N'CREATE OR ALTER VIEW [satire].[arena_all_votes] AS SELECT voter,character,round,reaction,updated_at FROM (SELECT voter,character,round,reaction,updated_at,ROW_NUMBER() OVER(PARTITION BY voter,character,round ORDER BY updated_at DESC,source DESC) AS position FROM (SELECT voter,character,round,reaction,updated_at,0 AS source FROM [satire].[arena_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,1 AS source FROM [satire].[arena_expanded_votes] UNION ALL SELECT voter,character,round,reaction,updated_at,2 AS source FROM [satire].[arena_cast_votes]) AS generations) AS ranked WHERE position=1;');");
 if(schema==='samaj')for(const operation of ['UPDATE','DELETE'])output.push(`EXEC(N'CREATE OR ALTER TRIGGER [samaj].[samaj_audit_no_${operation.toLowerCase()}] ON [samaj].[samaj_audit] INSTEAD OF ${operation} AS BEGIN THROW 51000, ''Audit is append only'', 1; END');`);
 const dest=path.join(ROOT,dir,'sqlserver');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'001-schema.sql'),output.join('\n\n')+'\n');
}
console.log('Generated selected app-owned SQL Server migrations.');
