import {randomUUID} from 'node:crypto';
import storeModule from './store.js';
import schemaModule from './schema.js';
import settingsModule from './settings.js';
import http from '../../../server/http.js';
const {Store}=storeModule,{schemas,indiaToday}=schemaModule,{cleanSettings}=settingsModule,{fail}=http;

// Request-bound facade. All operations run within the router's single transaction.
export class OrganisationChambersStore {
 constructor({db,organisation,actor}){this.sql=db;this.organisation=organisation;this.organisationId=organisation.id;this.actor=actor;}
 transaction(fn){return fn();}
 all(kind){return this.sql.prepare('SELECT r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? AND r.kind=? ORDER BY r.rowid DESC').all(this.organisationId,kind).map(r=>JSON.parse(r.data));}
 get(kind,id){if(kind==='users')return this.user(id);const r=this.sql.prepare('SELECT r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? AND r.kind=? AND r.id=?').get(this.organisationId,kind,id);return r?JSON.parse(r.data):null;}
 users(){return this.sql.prepare("SELECT u.id,u.name,u.email,a.role,u.active FROM users u JOIN platform_memberships m ON m.userId=u.id JOIN platform_app_assignments a ON a.userId=m.userId AND a.organisationId=m.organisationId WHERE m.organisationId=? AND m.status='Active' AND m.role!='Client' AND a.appId='advocate' AND a.status='Active'").all(this.organisationId).map(u=>({...u,active:u.active===1}));}
 user(id){return this.users().find(u=>u.id===id);}
 put(kind,record){
  const existing=this.sql.prepare('SELECT id FROM records WHERE kind=? AND id=?').get(kind,record.id);
  if(existing&&!this.get(kind,record.id))fail(409,'A record ID is unavailable in this workspace');
  this.sql.prepare('INSERT INTO records(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data').run(kind,record.id,JSON.stringify(record));
  this.sql.prepare('INSERT INTO chambers_record_ownership(kind,recordId,organisationId) VALUES(?,?,?) ON CONFLICT(kind,recordId) DO NOTHING').run(kind,record.id,this.organisationId);return record;
 }
 create(kind,record){const now=new Date().toISOString();return this.put(kind,{...record,id:record.id||randomUUID(),version:1,archived:false,createdAt:now,updatedAt:now});}
 file(id){return this.sql.prepare('SELECT f.* FROM files f JOIN chambers_file_ownership o ON o.fileId=f.id WHERE o.organisationId=? AND f.id=?').get(this.organisationId,id);}
 addFile(id,name,mime,content){
  if(this.sql.prepare('SELECT id FROM files WHERE id=?').get(id)&&!this.file(id))fail(409,'A document ID is unavailable in this workspace');
  this.sql.prepare('INSERT INTO files(id,name,mime,content) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,mime=excluded.mime,content=excluded.content').run(id,name,mime,content);
  this.sql.prepare('INSERT INTO chambers_file_ownership(fileId,organisationId) VALUES(?,?) ON CONFLICT(fileId) DO NOTHING').run(id,this.organisationId);
 }
 setting(id){if(id!=='firm')fail(403,'Setting unavailable');const row=this.sql.prepare('SELECT data FROM chambers_workspace_settings WHERE organisationId=?').get(this.organisationId);return row?JSON.parse(row.data):cleanSettings({name:this.organisation.name});}
 setSetting(id,data){if(id!=='firm')fail(403,'Setting unavailable');this.sql.prepare('INSERT INTO chambers_workspace_settings(organisationId,data) VALUES(?,?) ON CONFLICT(organisationId) DO UPDATE SET data=excluded.data').run(this.organisationId,JSON.stringify(data));}
 audit(actor,action,kind,record){this.sql.prepare('INSERT INTO chambers_activity(organisationId,actorUserId,actor,action,kind,recordId,label,at) VALUES(?,?,?,?,?,?,?,?)').run(this.organisationId,this.actor.id,actor,action,kind,record.id||'',record.title||record.name||record.description||record.number||'',new Date().toISOString());}
 activity(){return this.sql.prepare('SELECT id,actor,action,kind,recordId,label,at FROM chambers_activity WHERE organisationId=? ORDER BY id DESC LIMIT 500').all(this.organisationId);}
 state(){return Store.prototype.state.call(this);}
 backup(){const records={};for(const kind of Object.keys(schemas))records[kind]=this.all(kind);return {format:'chambers-organisation-backup',version:1,organisationId:this.organisationId,exportedAt:new Date().toISOString(),settings:this.setting('firm'),records,files:this.sql.prepare('SELECT f.* FROM files f JOIN chambers_file_ownership o ON o.fileId=f.id WHERE o.organisationId=?').all(this.organisationId).map(f=>({...f,content:Buffer.from(f.content).toString('base64')}))};}
 snapshot(force=false){const bucket=force?'restore-'+randomUUID():'daily-'+indiaToday();this.sql.prepare('INSERT INTO chambers_snapshots(id,organisationId,bucket,at,data) VALUES(?,?,?,?,?) ON CONFLICT(organisationId,bucket) DO NOTHING').run(randomUUID(),this.organisationId,bucket,new Date().toISOString(),JSON.stringify(this.backup()));}
 clearBusinessData(){
  const links=this.sql.prepare('SELECT COUNT(*) n FROM chambers_client_access WHERE organisationId=?').get(this.organisationId).n;
  if(links){
   this.sql.prepare('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)').run(this.organisationId,this.actor.id,'ClientAccessClearedForRestore',Date.now(),JSON.stringify({reason:'Organisation restore requires explicit client access approval again',links}));
   this.sql.prepare('UPDATE platform_organisations SET version=version+1 WHERE id=?').run(this.organisationId);
  }
  const records=this.sql.prepare('SELECT kind,recordId FROM chambers_record_ownership WHERE organisationId=?').all(this.organisationId);
  const files=this.sql.prepare('SELECT fileId FROM chambers_file_ownership WHERE organisationId=?').all(this.organisationId);
  this.sql.prepare('DELETE FROM chambers_record_ownership WHERE organisationId=?').run(this.organisationId);
  this.sql.prepare('DELETE FROM chambers_file_ownership WHERE organisationId=?').run(this.organisationId);
  for(const r of records)this.sql.prepare('DELETE FROM records WHERE kind=? AND id=?').run(r.kind,r.recordId);
  for(const f of files)this.sql.prepare('DELETE FROM files WHERE id=?').run(f.fileId);
 }
}
