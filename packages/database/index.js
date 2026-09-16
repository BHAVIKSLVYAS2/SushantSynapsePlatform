const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
class PlatformDatabase {
 constructor(root,{appSchema}){
  this.root=root;fs.mkdirSync(root,{recursive:true});
  this.sql=new DatabaseSync(path.join(root,'chambers.sqlite'));
  this.schemaSql=fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8')+'\n'+fs.readFileSync(appSchema,'utf8');
  this.sql.exec('PRAGMA journal_mode=WAL;');this.sql.exec(this.schemaSql);
 }
  transaction(fn) { this.sql.exec('BEGIN IMMEDIATE'); try { const result = fn(); this.sql.exec('COMMIT'); return result; } catch (e) { this.sql.exec('ROLLBACK'); throw e; } }
  registerAppSchema(id, sql, tables) {
    this.appSchemas ||= new Set(); this.extraExportTables ||= [];
    if (this.appSchemas.has(id)) return;
    if (tables.some(name => !/^[a-z][a-z0-9_]+$/.test(name))) throw Error('Invalid app table registration');
    this.sql.exec(sql); this.schemaSql += '\n'+sql;
    this.extraExportTables.push(...tables); this.appSchemas.add(id);
  }
  setting(id) { const r = this.sql.prepare('SELECT data FROM settings WHERE id=?').get(id); return r ? JSON.parse(r.data) : null; }
  setSetting(id, data) { this.sql.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(id, JSON.stringify(data)); }
  users() { return this.sql.prepare('SELECT id,name,email,role,active FROM users ORDER BY name').all().map(u => ({ ...u, active: !!u.active })); }
  user(id) { return this.users().find(u => u.id === id); }
  access(userId) { return this.sql.prepare('SELECT appId FROM app_access WHERE userId=?').all(userId).map(r=>r.appId); }
  setAccess(userId, appIds) { this.sql.prepare('DELETE FROM app_access WHERE userId=?').run(userId);for(const id of appIds)this.sql.prepare('INSERT INTO app_access VALUES(?,?)').run(userId,id); }
  preferences(userId) { const r=this.sql.prepare('SELECT data FROM platform_preferences WHERE userId=?').get(userId);return r?JSON.parse(r.data):{favorites:[],recent:[]}; }
  setPreferences(userId, value) { this.sql.prepare('INSERT INTO platform_preferences VALUES(?,?) ON CONFLICT(userId) DO UPDATE SET data=excluded.data').run(userId,JSON.stringify(value)); }
  audit(actor, action, kind, record) { this.sql.prepare('INSERT INTO audit(at,actor,action,kind,recordId,label) VALUES(?,?,?,?,?,?)').run(new Date().toISOString(), actor, action, kind, record.id || '', record.title || record.name || record.description || record.number || ''); }
  activity() { return this.sql.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 500').all(); }
}
module.exports={PlatformDatabase};
