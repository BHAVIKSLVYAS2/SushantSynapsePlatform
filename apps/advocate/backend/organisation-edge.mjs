import {chambers} from './edge.mjs';
import {evaluateAppAccess,canManageOrganisation} from '../../../packages/auth/organisation-policy.mjs';
import {OrganisationRepository} from '../../../packages/database/organisation-repository-d1.mjs';
import {OrganisationD1SQL} from '../../../packages/database/organisation-d1-sql.mjs';
import {ClientAccessAdministration} from './client-access-d1.mjs';
import {clientPortalOverview} from './client-portal-d1.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';

async function scope(repo,user,organisationId,action){
 const organisation=await repo.first('SELECT * FROM platform_organisations WHERE id=?',organisationId);
 const membership=await repo.first('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?',organisationId,user.id);
 const assignment=await repo.first("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'",organisationId,user.id);
 const licence=await repo.first("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'",organisationId);
 const access=evaluateAppAccess({user,organisation,membership,assignment,licence,app:{id:'advocate',status:'Available'},permissions:['advocate:read','advocate:write'],action,now:Date.now()});
 if(!access.allowed||membership.role==='Client'||!['Owner','Advocate','Clerk'].includes(assignment.role))fail(403,'Chambers access is unavailable for this organisation');
 return {organisation,membership,assignment,access};
}

class ScopedRepository {
 constructor(repo,organisation,actor){this.base=repo;this.org=organisation;this.actor=actor;}
 async first(sql,...args){
  if(sql.startsWith('SELECT COUNT(*)')&&sql.includes('FROM records'))return this.base.first('SELECT COUNT(*) n,COALESCE(SUM(length(CAST(r.data AS BLOB))),0) bytes FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=?',this.org.id);
  fail(503,'Unscoped Chambers query rejected');
 }
 async all(sql,...args){
  if(sql==='SELECT kind,data FROM records ORDER BY rowid DESC')return this.base.all('SELECT r.kind,r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? ORDER BY r.rowid DESC',this.org.id);
  if(sql==='SELECT * FROM audit ORDER BY id DESC LIMIT 500')return this.base.all('SELECT id,at,actor,action,kind,recordId,label FROM chambers_activity WHERE organisationId=? ORDER BY id DESC LIMIT 500',this.org.id);
  fail(503,'Unscoped Chambers query rejected');
 }
 async users(){return (await this.base.all("SELECT u.id,u.name,u.email,a.role,u.active FROM users u JOIN platform_memberships m ON m.userId=u.id JOIN platform_app_assignments a ON a.organisationId=m.organisationId AND a.userId=m.userId WHERE m.organisationId=? AND m.status='Active' AND m.role!='Client' AND a.appId='advocate' AND a.status='Active' AND u.active=1",this.org.id)).map(u=>({...u,active:true}));}
 async setting(id){if(id!=='firm')fail(403,'Setting unavailable');const row=await this.base.first('SELECT data FROM chambers_workspace_settings WHERE organisationId=?',this.org.id);return row?JSON.parse(row.data):{name:this.org.name};}
 settingWrite(id,data){if(id!=='firm')fail(403,'Setting unavailable');return this.base.statement('INSERT INTO chambers_workspace_settings(organisationId,data) VALUES(?,?) ON CONFLICT(organisationId) DO UPDATE SET data=excluded.data',this.org.id,JSON.stringify(data));}
 audit(actor,action,kind,r={}){return this.base.statement('INSERT INTO chambers_activity(organisationId,actorUserId,actor,action,kind,recordId,label,at) VALUES(?,?,?,?,?,?,?,?)',this.org.id,this.actor.id,actor,action,kind,r.id||'',r.title||r.name||r.description||r.number||'',new Date().toISOString());}
 statement(sql,...args){
  if(sql.startsWith('INSERT INTO records('))return {statements:[this.base.statement(sql,...args),this.base.statement('INSERT INTO chambers_record_ownership(kind,recordId,organisationId) VALUES(?,?,?) ON CONFLICT(kind,recordId) DO NOTHING',args[0],args[1],this.org.id)]};
  if(sql.startsWith('INSERT INTO files '))return {statements:[this.base.statement(sql,...args),this.base.statement('INSERT INTO chambers_file_ownership(fileId,organisationId) VALUES(?,?) ON CONFLICT(fileId) DO NOTHING',args[0],this.org.id)]};
  fail(503,'Unscoped Chambers write rejected');
 }
 async commit(writes){return this.base.commit(writes.flatMap(w=>w.statements||[w]));}
}

export async function organisationChambers(context){
 const {request,route,repo,user,files}=context;if(!user)fail(401,'Please sign in');
 if(route.startsWith('client-portal/')){
  if(request.method!=='GET')fail(405,'Client portal is read-only');
  const match=/^client-portal\/([a-zA-Z0-9-]{1,200})$/.exec(route);if(!match)fail(404,'Not found');
  const service=new OrganisationRepository(new OrganisationD1SQL(repo));await service.initialise();return json(await clientPortalOverview(service,{actorUserId:user.id,organisationId:match[1]}));
 }
 if(route==='chambers'&&request.method==='GET'){
  const organisations=[];
  for(const row of await repo.all("SELECT o.id,o.name FROM platform_organisations o JOIN platform_app_assignments a ON a.organisationId=o.id WHERE a.userId=? AND a.appId='advocate' ORDER BY o.name,o.id",user.id))try{const granted=await scope(repo,user,row.id,'read');organisations.push({...row,role:granted.assignment.role,mode:granted.access.mode});}catch(e){if(e.status!==403)throw e;}
  return json({organisations});
 }
 const match=/^chambers\/([a-zA-Z0-9-]{1,200})\/(.+)$/.exec(route);if(!match)fail(404,'Not found');const [,organisationId,operation]=match;
 const granted=await scope(repo,user,organisationId,request.method==='GET'?'read':'write');
 if(['backup','restore','backup.sql'].includes(operation))fail(503,'Cloud recovery uses the offline D1 recovery tool.');
 if(['client-access','client-entitlement'].includes(operation)){
  const db=new OrganisationD1SQL(repo),service=new OrganisationRepository(db);await service.initialise();const links=new ClientAccessAdministration(service),input={actorUserId:user.id,organisationId};
  if(request.method==='GET'&&operation==='client-access')return json(await links.overview(input));
  if(request.method!=='POST')fail(405,'Method not allowed');const b=await body(request,4096);
  if('organisationId' in b||'actorUserId' in b)fail(400,'Scope comes from the session and route');
  const result=await links[operation==='client-access'?'update':'entitlement']({...input,...Object.fromEntries(['userId','clientId','status','version','reason'].map(k=>[k,b[k]]))});await db.finish();return json(result);
 }
 if(operation==='ledger')fail(404,'Not found');
 if(!['GET','HEAD'].includes(request.method)){
  const b=await body(request.clone());if('organisationId' in b||'actorUserId' in b)fail(400,'Scope comes from the session and route');
 }
 const actor={...user,role:granted.assignment.role,appIds:['advocate']},scoped=new ScopedRepository(repo,granted.organisation,actor);
 const privateFiles={maxFileBytes:files.maxFileBytes,upload:(...args)=>files.upload(...args),read:async(kind,id)=>{if(!await repo.first('SELECT fileId FROM chambers_file_ownership WHERE organisationId=? AND fileId=?',organisationId,id))fail(404,'File not found');return files.read(kind,id);}};
 const response=await chambers({...context,route:operation,user:actor,repo:scoped,files:privateFiles});
 if(operation==='state'&&request.method==='GET'&&response.ok){const data=await response.json();return json({...data,organisation:{id:organisationId,name:granted.organisation.name},capabilities:{...data.capabilities,organisationScoped:true,readOnly:granted.access.mode==='read-only',backup:false,sqlExport:false,organisationAdmin:canManageOrganisation({user,organisation:granted.organisation,membership:granted.membership}).allowed}});}
 return response;
}
