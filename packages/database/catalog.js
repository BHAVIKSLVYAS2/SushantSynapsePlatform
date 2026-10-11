'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const owners=[
 ['platform','packages/database',['schema.sql']],
 ['chambers','apps/advocate/database',['schema.sql']],
 ['batchfee','apps/batchfee-lite/database',['001-initial.sql','002-staff.sql']],
 ['samaj','apps/digital-samaj/database',['001-initial.sql','002-workflows.sql','003-events.sql']],
 ['tournament','apps/tournament-lite/database',['001-initial.sql']],
 ['news','apps/news/database',['001-editions.sql','002-fetch-budget.sql']],
 ['fundlens','apps/fund-overlap/database',['001-portfolio.sql']],
 ['satire','apps/satire-arena/database',['001-arena.sql','002-expanded-arena.sql','003-nine-character-arena.sql','004-highway-budget.sql']],
];
function splitSql(value){
 const parts=[];let start=0,depth=0,quoted=false;
 for(let i=0;i<value.length;i++){const c=value[i];if(c==="'"){if(quoted&&value[i+1]==="'"){i++;continue;}quoted=!quoted;}if(quoted)continue;if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1;}}
 parts.push(value.slice(start).trim());return parts;
}
const tables={},views={};
for(const [schema,dir,files]of owners){for(const file of files){const text=fs.readFileSync(path.join(ROOT,dir,file),'utf8');
 for(const m of text.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g)){
  const definitions=splitSql(m[2]),columns=definitions.filter(d=>! /^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)\b/i.test(d)).map(d=>({name:d.match(/^\w+/)[0],definition:d,identity:/AUTOINCREMENT/i.test(d)}));
  const key=definitions.find(d=>/^PRIMARY KEY\b/i.test(d));const primary=key?splitSql(key.match(/\((.*)\)/)[1]):columns.filter(c=>/PRIMARY KEY/i.test(c.definition)).map(c=>c.name);
  const unique=definitions.filter(d=>/^UNIQUE\b/i.test(d)).map(d=>splitSql(d.match(/\((.*)\)/)[1]));for(const c of columns)if(/\bUNIQUE\b/i.test(c.definition))unique.push([c.name]);
  tables[m[1]]={name:m[1],schema,qualified:`[${schema}].[${m[1]}]`,columns,primary,unique,definitions};
 }
 for(const m of text.matchAll(/CREATE VIEW (?:IF NOT EXISTS )?(\w+)/g))views[m[1]]=schema;
}}
function qualified(name){const schema=tables[name]?.schema||views[name];if(!schema)throw Error('Unregistered database object: '+name);return `[${schema}].[${name}]`;}
function sqliteSql(sql){return sql.replace(/\[(platform|chambers|batchfee|samaj|tournament|news|fundlens|satire)\]\.\[(\w+)\]/g,(_,schema,name)=>{if((tables[name]?.schema||views[name])!==schema)throw Error('Database schema ownership mismatch');return name;});}
module.exports={ROOT,owners,tables,views,qualified,sqliteSql,splitSql};
