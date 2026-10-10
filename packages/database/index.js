const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs');
const path=require('node:path');
const {sqliteSql}=require('./catalog');
class PlatformDatabase {
 constructor(root,{appSchema,provider=process.env.DATABASE_PROVIDER||'sqlite',connection,database,migrate=process.env.SQLSERVER_AUTO_MIGRATE==='1'}={}){
  this.root=root;fs.mkdirSync(root,{recursive:true});
  this.provider=provider;
  if(provider==='sqlserver')this.sql=database||new (require('./sqlserver').SqlServerDatabase)({connection,migrate});
  else if(provider==='sqlite'){
   const native=new DatabaseSync(path.join(root,'chambers.sqlite'));
   this.sql={prepare:sql=>native.prepare(sqliteSql(sql)),exec:sql=>native.exec(sqliteSql(sql)),close:()=>native.close()};
  }else throw Error('Unsupported DATABASE_PROVIDER');
  this.schemaSql=fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8')+'\n'+fs.readFileSync(appSchema,'utf8');
  if(provider==='sqlite'){this.sql.exec('PRAGMA journal_mode=WAL;');this.sql.exec(this.schemaSql);}
 }
  transaction(fn) {
   if(this.requestTransaction){const result=fn();if(result&&typeof result.then==='function')throw Error('Transactions require synchronous callbacks');return result;}
   if(this.sql.inTransaction)throw Error('Nested database transaction');
   if(this.provider==='sqlserver')this.sql.begin();else this.sql.exec('BEGIN IMMEDIATE');
   try{const result=fn();if(result&&typeof result.then==='function')throw Error('Transactions require synchronous callbacks');if(this.provider==='sqlserver')this.sql.commit();else this.sql.exec('COMMIT');return result;}
   catch(error){if(this.provider==='sqlserver')this.sql.rollback();else this.sql.exec('ROLLBACK');throw error;}
  }
  async requestContext(fn){
   if(this.provider!=='sqlserver')return fn();
   const previous=this.requestQueue||Promise.resolve();let release;
   this.requestQueue=new Promise(resolve=>{release=resolve;});await previous;
   try{this.sql.begin();this.requestTransaction=true;try{const result=await fn();this.sql.commit();return result;}catch(error){this.sql.rollback();throw error;}finally{this.requestTransaction=false;}}
   finally{release();}
  }
  registerAppSchema(id, sql, tables) {
    this.appSchemas ||= new Set(); this.extraExportTables ||= [];
    if (this.appSchemas.has(id)) return;
    if (tables.some(name => !/^[a-z][a-z0-9_]+$/.test(name))) throw Error('Invalid app table registration');
    if(tables.length===0)throw Error('Empty app schema');
    if(this.provider==='sqlite')this.sql.exec(sql); this.schemaSql += '\n'+sql;
    this.extraExportTables.push(...tables); this.appSchemas.add(id);
  }
  setting(id) { const r = this.sql.prepare('SELECT data FROM [platform].[settings] WHERE id=?').get(id); return r ? JSON.parse(r.data) : null; }
  setSetting(id, data) { this.sql.prepare('INSERT INTO [platform].[settings] VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(id, JSON.stringify(data)); }
  users() { return this.sql.prepare('SELECT id,name,email,role,active FROM [platform].[users] ORDER BY name').all().map(u => ({ ...u, active: !!u.active })); }
  user(id) { return this.users().find(u => u.id === id); }
  access(userId) { return this.sql.prepare('SELECT appId FROM [platform].[app_access] WHERE userId=?').all(userId).map(r=>r.appId); }
  setAccess(userId, appIds) { this.sql.prepare('DELETE FROM [platform].[app_access] WHERE userId=?').run(userId);for(const id of appIds)this.sql.prepare('INSERT INTO [platform].[app_access] VALUES(?,?)').run(userId,id); }
  preferences(userId) { const r=this.sql.prepare('SELECT data FROM [platform].[platform_preferences] WHERE userId=?').get(userId);return r?JSON.parse(r.data):{favorites:[],recent:[]}; }
  setPreferences(userId, value) { this.sql.prepare('INSERT INTO [platform].[platform_preferences] VALUES(?,?) ON CONFLICT(userId) DO UPDATE SET data=excluded.data').run(userId,JSON.stringify(value)); }
  audit(actor, action, kind, record) { this.sql.prepare('INSERT INTO [platform].[audit](at,actor,action,kind,recordId,label) VALUES(?,?,?,?,?,?)').run(new Date().toISOString(), actor, action, kind, record.id || '', record.title || record.name || record.description || record.number || ''); }
  activity() { return this.sql.prepare('SELECT * FROM [platform].[audit] ORDER BY id DESC LIMIT 500').all(); }
}
module.exports={PlatformDatabase};
