const fs=require('node:fs'),path=require('node:path');
const {owners}=require('../../packages/database/catalog');
const root=path.resolve(__dirname,'../..');
function schema(){
 const chunks=owners.flatMap(([owner,dir,files])=>files.map(file=>`-- ${owner}: ${file}\n`+fs.readFileSync(path.join(root,dir,file),'utf8').replace(/^PRAGMA[^;]*;\s*/gm,'').replace(/content BLOB NOT NULL/g,'content BLOB')));
 chunks.push(`
-- Shared D1 optimistic commit guard. All platform business writes use this guard.
CREATE TABLE IF NOT EXISTS edge_revision(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL);
INSERT OR IGNORE INTO edge_revision VALUES(1,0);
CREATE TABLE IF NOT EXISTS edge_write_guard(id TEXT PRIMARY KEY,valid INTEGER NOT NULL CONSTRAINT edge_revision_conflict CHECK(valid=1));
CREATE TABLE IF NOT EXISTS edge_objects(scope TEXT NOT NULL CHECK(scope IN ('chambers','samaj')),id TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(scope,id));
CREATE TABLE IF NOT EXISTS edge_imports(id TEXT PRIMARY KEY,manifest_hash TEXT NOT NULL,completed_at TEXT NOT NULL);
`);
 const {roles,permissions}=require('../../apps/digital-samaj/backend/security');const literal=v=>"'"+v.replaceAll("'","''")+"'";
 for(const p of permissions)chunks.push(`INSERT OR IGNORE INTO samaj_permissions VALUES(${literal(p)});`);
 for(const [role,ps]of Object.entries(roles)){chunks.push(`INSERT OR IGNORE INTO samaj_roles VALUES(${literal(role)});`);for(const p of ps)chunks.push(`INSERT OR IGNORE INTO samaj_role_permissions VALUES(${literal(role)},${literal(p)});`);}
 for(const [table,values]of [['batchfee_migrations',[1,2]],['samaj_migrations',[1,2,3]],['tournament_lite_migrations',[1]]])for(const n of values)chunks.push(`INSERT OR IGNORE INTO ${table} VALUES(${n});`);
 chunks.push("INSERT OR IGNORE INTO news_migrations VALUES(1,'2026-10-11T00:00:00.000Z'); INSERT OR IGNORE INTO news_migrations VALUES(2,'2026-10-11T00:00:00.000Z'); INSERT OR IGNORE INTO fund_lens_migrations VALUES(1,'2026-10-11T00:00:00.000Z');");
 return chunks.join('\n');
}
function build(){const target=path.join(__dirname,'d1-migrations','0001-platform.sql');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,schema());const {tables}=require('../../packages/database/catalog');fs.writeFileSync(path.join(__dirname,'d1-catalog.json'),JSON.stringify(Object.fromEntries(Object.entries(tables).map(([name,t])=>[name,{owner:t.schema,columns:t.columns,primary:t.primary,unique:t.unique}]))));return target;}
if(require.main===module)console.log('D1 schema prepared: '+build());module.exports={schema,build};
