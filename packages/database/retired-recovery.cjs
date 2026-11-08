'use strict';
// Retired applications have no runtime routes. Preserve their existing SQLite
// tables in full recovery exports without recreating tables on fresh workspaces.
function retiredRecovery(sql,literal){
 const {tables}=require('./catalog'),names=Object.values(tables).filter(t=>['fundlens','news'].includes(t.schema)).map(t=>t.name),schema=[],inserts=[];
 for(const name of names){
  const table=sql.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name);
  if(!table)continue;
  schema.push(table.sql+';');
  for(const row of sql.prepare('SELECT * FROM '+name).all())inserts.push(`INSERT INTO ${name} (${Object.keys(row).map(k=>'"'+k+'"').join(',')}) VALUES (${Object.values(row).map(literal).join(',')});`);
  for(const index of sql.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(name))schema.push(index.sql+';');
 }
 return {schema:schema.join('\n'),inserts};
}
module.exports={retiredRecovery};
