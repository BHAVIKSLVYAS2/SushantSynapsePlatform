// Per-request repository. No process-global connection, transaction or business state.
export class Conflict extends Error { constructor(){super('Data changed. Refresh before saving again.');this.status=409;} }
export class D1Repository {
 constructor(binding){if(!binding)throw Error('D1 binding is missing');this.db=binding.withSession?binding.withSession('first-primary'):binding;}
 statement(sql,...values){if(values.some(v=>typeof v==='string'&&new TextEncoder().encode(v).byteLength>1500000))throw Object.assign(Error('This record is too large for D1. Reduce attachments or split the operation.'),{status:413});return this.db.prepare(sql).bind(...values.map(v=>v===undefined?null:typeof v==='boolean'?Number(v):v));}
 async first(sql,...values){return this.statement(sql,...values).first();}
 async all(sql,...values){return (await this.statement(sql,...values).all()).results;}
 async begin(){const row=await this.first('SELECT revision FROM edge_revision WHERE id=1');if(!row)throw Error('D1 migrations have not been applied');this.revision=row.revision;return this;}
 async unchanged(){return (await this.first('SELECT revision FROM edge_revision WHERE id=1')).revision===this.revision;}
 async commit(statements){
  if(!statements.length)return;
  if(statements.length>950)throw Object.assign(Error('This operation is too large for one atomic save.'),{status:413});
  const token=crypto.randomUUID();
  const batch=[this.statement('INSERT INTO edge_write_guard(id,valid) SELECT ?,revision=? FROM edge_revision WHERE id=1',token,this.revision),...statements,this.statement('UPDATE edge_revision SET revision=revision+1 WHERE id=1'),this.statement('DELETE FROM edge_write_guard WHERE id=?',token)];
  try{await this.db.batch(batch);this.revision++;}catch(e){if(String(e.message).includes('edge_revision_conflict'))throw new Conflict();throw e;}
 }
 async setting(id){const r=await this.first('SELECT data FROM settings WHERE id=?',id);return r?JSON.parse(r.data):null;}
 settingWrite(id,data){return this.statement('INSERT INTO settings VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',id,JSON.stringify(data));}
 async users(){return (await this.all('SELECT id,name,email,role,active FROM users ORDER BY name')).map(u=>({...u,active:!!u.active}));}
 async user(id){const r=await this.first('SELECT id,name,email,role,active FROM users WHERE id=?',id);return r?{...r,active:!!r.active}:null;}
 async access(id){return (await this.all('SELECT appId FROM app_access WHERE userId=?',id)).map(r=>r.appId);}
 accessWrites(id,apps){return [this.statement('DELETE FROM app_access WHERE userId=?',id),...apps.map(app=>this.statement('INSERT INTO app_access VALUES(?,?)',id,app))];}
 async preferences(id){const r=await this.first('SELECT data FROM platform_preferences WHERE userId=?',id);return r?JSON.parse(r.data):{favorites:[],recent:[]};}
 preferenceWrite(id,data){return this.statement('INSERT INTO platform_preferences VALUES(?,?) ON CONFLICT(userId) DO UPDATE SET data=excluded.data',id,JSON.stringify(data));}
 audit(actor,action,kind,record={}){return this.statement('INSERT INTO audit(at,actor,action,kind,recordId,label) VALUES(?,?,?,?,?,?)',new Date().toISOString(),actor,action,kind,record.id||'',record.title||record.name||record.description||record.number||'');}
}
