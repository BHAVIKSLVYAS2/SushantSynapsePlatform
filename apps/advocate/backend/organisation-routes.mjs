import {OrganisationRepository,OrganisationError} from '../../../packages/database/organisation-repository.mjs';
import {ClientAccessAdministration} from './client-access.mjs';
import {clientPortalOverview} from './client-portal.mjs';
import {evaluateAppAccess,canManageOrganisation} from '../../../packages/auth/organisation-policy.mjs';
import {readFileSync} from 'node:fs';
import {OrganisationChambersStore} from './organisation-store.mjs';
import routeModule from './routes.js';
import http from '../../../server/http.js';
const {createAdvocate}=routeModule,{readBody,fail}=http;
export function createOrganisationChambers({db}){
 const repo=new OrganisationRepository(db);
 function access(userId,organisationId,action){
  const user=repo.user(userId),organisation=db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(organisationId);
  const membership=db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(organisationId,userId);
  const assignment=db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(organisationId,userId);
  const licence=db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(organisationId);
  if(membership?.role==='Client'||!['Owner','Advocate','Clerk'].includes(assignment?.role))fail(403,'Chambers staff access is required');
  const allowed=evaluateAppAccess({user,organisation,membership,assignment,licence,app:{id:'advocate',status:'Available'},permissions:['advocate:read','advocate:write'],action,now:repo.now()});
  if(!allowed.allowed)fail(403,'Chambers access is unavailable for this organisation');
  return {organisation,assignment,membership,mode:allowed.mode};
 }
 return async function handle(context){
  const {route,method,req,res,json,user}=context;
  if(!user)fail(401,'Please sign in');
  if(route.startsWith('client-portal/')){
   const match=/^client-portal\/([a-zA-Z0-9-]{1,200})$/.exec(route);if(!match)fail(404,'Not found');
   if(method!=='GET')fail(405,'Client portal is read-only');
   if(db.isTransaction)fail(503,'Workspace is busy');
   db.exec('BEGIN');
   try{const result=clientPortalOverview(repo,{actorUserId:user.id,organisationId:match[1]});db.exec('COMMIT');return json(200,result);}
   catch(error){db.exec('ROLLBACK');if(error instanceof OrganisationError)fail(403,'Client portal access is unavailable');fail(500,'Client portal request failed');}
  }
  if(route==='chambers'&&method==='GET'){
   const organisations=[];
   for(const row of db.prepare("SELECT o.id,o.name FROM platform_organisations o JOIN platform_app_assignments a ON a.organisationId=o.id WHERE a.userId=? AND a.appId='advocate' ORDER BY o.name,o.id").all(user.id)){
    try{const granted=access(user.id,row.id,'read');organisations.push({...row,role:granted.assignment.role,mode:granted.mode});}catch(error){if(error.status!==403)throw error;}
   }
   return json(200,{organisations});
  }
  const match=/^chambers\/([a-zA-Z0-9-]{1,200})\/(.+)$/.exec(route);
  if(!match)fail(404,'Not found');
  const [,organisationId,operation]=match;
  if(operation==='backup.sql')fail(403,'Full platform SQL recovery is unavailable through Chambers');
  const initial=access(user.id,organisationId,method==='GET'?'read':'write');
  if(operation==='ledger'&&method==='GET')return json(200,{markdown:readFileSync(new URL('../../../docs/FUNCTIONALITY_LEDGER.md',import.meta.url),'utf8')});
  if(['backup','restore','settings'].includes(operation)&&initial.assignment.role!=='Owner')fail(403,'Chambers owner permission is required');
  const body=['POST','PATCH'].includes(method)?await readBody(req,operation==='restore'?100*1024*1024:8*1024*1024):null;
  if(body&&('organisationId' in body||'actorUserId' in body))fail(400,'Identity and organisation scope come from the session and route');
  if(['client-access','client-entitlement'].includes(operation)){
   const service=new ClientAccessAdministration(repo),input={actorUserId:user.id,organisationId};
   try{
    if(method==='GET'&&operation==='client-access')return json(200,service.overview(input));
    if(method==='POST')return json(200,service[operation==='client-access'?'update':'entitlement']({...input,...Object.fromEntries(['userId','clientId','status','version','reason'].map(key=>[key,body[key]]))}));
    fail(405,'Method not allowed');
   }catch(error){if(error instanceof OrganisationError)fail(error.code==='forbidden'?403:['conflict','invalid-state','seat-limit-reached'].includes(error.code)?409:400,error.message);if(error.status)throw error;fail(500,'Client access request failed');}
  }
  if(operation==='restore'&&body){
   const backup=body.backup;
   if(!backup||backup.format!=='chambers-organisation-backup'||backup.version!==1||backup.organisationId!==organisationId)fail(400,'Choose a backup exported from this organisation');
   body.backup={...backup,format:'chambers-backup',version:2};
  }
  if(db.isTransaction)fail(503,'Workspace is busy');
  db.exec('BEGIN IMMEDIATE');
  try{
   const granted=access(user.id,organisationId,method==='GET'?'read':'write');
   const actor={...user,role:granted.assignment.role};
   const store=new OrganisationChambersStore({db,organisation:granted.organisation,actor});
   const headers=new Map();let code=200,payload,output;
   const staged={setHeader:(key,value)=>headers.set(key,value),end:value=>{output=value;}};
   const auth={owner:u=>{if(u.role!=='Owner')fail(403,'Chambers owner permission is required');},hasAppAccess:()=>true};
   const handler=createAdvocate({store,auth,readRequestBody:async()=>body});
   await handler({...context,route:operation,user:actor,res:staged,json:(status,data)=>{code=status;payload=data;}});
   if(operation==='state'&&method==='GET')payload={...payload,organisation:{id:organisationId,name:granted.organisation.name},capabilities:{organisationScoped:true,readOnly:granted.mode==='read-only',sqlExport:false,organisationAdmin:canManageOrganisation({...repo.authority(user.id),organisation:granted.organisation,membership:granted.membership}).allowed}};
   db.exec('COMMIT');
   for(const [key,value]of headers)res.setHeader(key,value);
   if(output!==undefined)return res.end(output);
   return json(code,payload);
  }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
 };
}
