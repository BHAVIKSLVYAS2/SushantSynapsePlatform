const fs=require('node:fs'),path=require('node:path');
const {migrations}=require('../../packages/database/organisation-schema.cjs');
const {splitSql}=require('../../packages/database/catalog');
function build(){
 const catalog={};
 for(const migration of migrations)for(const match of migration.source.matchAll(/CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/g)){
  const definitions=splitSql(match[2]),columns=definitions.filter(d=>!/^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)\b/i.test(d)).map(d=>({name:d.match(/^\w+/)[0],definition:d,identity:/AUTOINCREMENT/i.test(d)}));
  const key=definitions.find(d=>/^PRIMARY KEY\b/i.test(d));
  const primary=key?splitSql(key.match(/\((.*)\)/)[1]):columns.filter(c=>/PRIMARY KEY/i.test(c.definition)).map(c=>c.name);
  const unique=definitions.filter(d=>/^UNIQUE\b/i.test(d)).map(d=>splitSql(d.match(/\((.*)\)/)[1]));
  for(const c of columns)if(/\bUNIQUE\b/i.test(c.definition))unique.push([c.name]);
  catalog[match[1]]={owner:match[1].startsWith('chambers_')?'chambers':'platform',columns,primary,unique};
 }
 const literal=v=>"'"+v.replaceAll("'","''")+"'";
 const schema='-- Additive organisation schema; activation remains a separate runtime flag.\nCREATE TABLE platform_organisation_migrations(id TEXT PRIMARY KEY,checksum TEXT NOT NULL);\n'+migrations.map(m=>m.source+'\nINSERT INTO platform_organisation_migrations VALUES('+literal(m.id)+','+literal(m.checksum)+');').join('\n');
 fs.writeFileSync(path.join(__dirname,'d1-free-migrations/0005-organisations.sql'),schema);
 fs.writeFileSync(path.join(__dirname,'organisation-catalog.json'),JSON.stringify(catalog));
 fs.writeFileSync(path.join(__dirname,'organisation-manifest.json'),JSON.stringify(migrations.map(({id,checksum})=>({id,checksum}))));
 return {schema,catalog};
}
if(require.main===module)build();module.exports={build};
