const {migrations,tables}=require('./organisation-schema.cjs');
const extraTables=['tournament_lite_ownership','batchfee_organisation_workspaces','batchfee_organisation_events','batchfee_legacy_ownership','samaj_organisation_ownership'];
// Read-only extension for a full SQLite export; callers provide a consistent
// transaction and their SQL literal encoder. Never used for Chambers JSON restore.
function organisationRecovery(sql,literal){
  const present=new Set(sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name));
  if(!tables.some(name=>present.has(name)))return {schema:'',inserts:[]};
  if(!present.has(tables[0]))throw Error('Organisation recovery metadata is missing');
  const applied=sql.prepare('SELECT id,checksum FROM platform_organisation_migrations ORDER BY id').all();
  if(!applied.length||applied.length>migrations.length||!applied.every((row,i)=>row.id===migrations[i].id&&row.checksum===migrations[i].checksum))throw Error('Organisation recovery migration history is unknown or modified');
  const active=applied.length===1?tables.slice(0,8):applied.length===2?tables.slice(0,11):applied.length===3?tables.slice(0,14):applied.length===4?tables.slice(0,15):tables;
  if(active.some(name=>!present.has(name))||tables.some(name=>present.has(name)&&!active.includes(name)))throw Error('Organisation recovery schema is incomplete or inconsistent');
  const batchfeeExtras=extraTables.filter(name=>name.startsWith('batchfee_'));
  if(batchfeeExtras.some(name=>present.has(name))&&!batchfeeExtras.every(name=>present.has(name)))throw Error('BatchFee organisation recovery schema is incomplete');
  const extras=extraTables.filter(name=>present.has(name)),inserts=[];
  for(const name of [...active,...extras])for(const row of sql.prepare(`SELECT * FROM ${name}`).all()){
    inserts.push(`INSERT INTO ${name} (${Object.keys(row).map(key=>'"'+key+'"').join(', ')}) VALUES (${Object.values(row).map(literal).join(', ')});`);
  }
  const fs=require('node:fs'),path=require('node:path');
  const extraSchema=[extras.includes('tournament_lite_ownership')?fs.readFileSync(path.join(__dirname,'../../apps/tournament-lite/database/002-organisation.sql'),'utf8'):'',extras.some(name=>name.startsWith('batchfee_'))?fs.readFileSync(path.join(__dirname,'../../apps/batchfee-lite/database/003-organisation.sql'),'utf8'):'',extras.includes('samaj_organisation_ownership')?fs.readFileSync(path.join(__dirname,'../../apps/digital-samaj/database/004-organisation.sql'),'utf8'):''].filter(Boolean).join('\n');
  return {schema:'CREATE TABLE platform_organisation_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL);\n'+migrations.slice(0,applied.length).map(m=>m.source).join('\n')+'\n'+extraSchema,inserts};
}
module.exports={organisationRecovery,extraTables};
