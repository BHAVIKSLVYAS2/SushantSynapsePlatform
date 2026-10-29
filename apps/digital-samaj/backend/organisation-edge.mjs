import {randomUUID} from 'node:crypto';
import {loadOrganisationScope} from '../../../packages/auth/organisation-scope.mjs';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';
import {samaj} from './edge.mjs';

async function scope(repo,user,organisationId,action){
 const {organisation,membership,assignment,licence}=await loadOrganisationScope(repo,user.id,organisationId,'digital-samaj');
 const role=membership?.role==='Client'?null:assignment?.role;
 const access=evaluateAppAccess({user,organisation,membership,assignment,licence,app:{id:'digital-samaj',status:'Available'},permissions:['Owner','Member'].includes(role)?[`digital-samaj:${action}`]:[],action,now:Date.now()});
 if(!access.allowed)fail(403,'DIGITAL SAMAJ access is unavailable for this organisation');
 return {organisation,role,access};
}

export async function organisationSamaj(context){
 const {repo,user,route,request}=context;
 if(!user)fail(401,'Please sign in');
 const rows=await repo.all("SELECT o.id,o.name,m.samajId FROM platform_organisations o JOIN platform_app_assignments a ON a.organisationId=o.id AND a.userId=? AND a.appId='digital-samaj' LEFT JOIN samaj_organisation_ownership m ON m.organisationId=o.id ORDER BY o.name,o.id",user.id);
 if(route==='digital-samaj'&&request.method==='GET'){
  const selected=new URL(request.url).searchParams.get('organisation');
  const permitted=[];
  for(const row of rows){if(selected&&row.id!==selected)continue;try{const granted=await scope(repo,user,row.id,'read');permitted.push({...row,role:granted.role,mode:granted.access.mode});}catch(error){if(error.status!==403)throw error;}}
  const communities=[];
  for(const row of permitted.filter(row=>row.samajId)){
   const grant=await repo.first('SELECT 1 FROM samaj_grants WHERE samaj_id=? AND user_id=?',row.samajId,user.id);
   if(grant)communities.push({id:row.samajId,name:(await repo.first('SELECT name FROM samaj_communities WHERE id=?',row.samajId)).name,organisationId:row.id});
  }
  const setup=permitted.find(row=>!row.samajId&&row.role==='Owner'&&row.mode==='full');
  return json({communities,canSetup:!!setup,setupOrganisationId:setup?.id??null,organisationScoped:true});
 }
 const setup=/^digital-samaj\/organisations\/([a-zA-Z0-9-]{1,200})$/.exec(route);
 if(setup){
  if(request.method!=='POST')fail(405,'Method not allowed');
  const orgId=setup[1],granted=await scope(repo,user,orgId,'write');
  if(granted.role!=='Owner')fail(403,'An app Owner is required to create the community');
  if(await repo.first('SELECT samajId FROM samaj_organisation_ownership WHERE organisationId=?',orgId))fail(409,'This organisation already has a community');
  const input=await body(request,4096);
  if('organisationId' in input||'samajId' in input||'userId' in input)fail(400,'Scope comes from the session and route');
  if(typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>120)fail(400,'Enter a community name');
  const id=randomUUID(),name=input.name.trim(),at=new Date().toISOString(),grantId=randomUUID();
  await repo.commit([
   repo.statement('INSERT INTO samaj_communities(id,name,created_at) VALUES(?,?,?)',id,name,at),
   repo.statement('INSERT INTO samaj_organisation_ownership(samajId,organisationId) VALUES(?,?)',id,orgId),
   repo.statement('INSERT INTO samaj_grants(id,user_id,samaj_id,role_id,scope,scope_value,created_at) VALUES(?,?,?,?,?,?,?)',grantId,user.id,id,'SUPER_ADMIN','ALL','',at),
   repo.statement('INSERT INTO samaj_audit(id,samaj_id,actor,action,entity_id,old_value,new_value,at) VALUES(?,?,?,?,?,?,?,?)',randomUUID(),id,user.id,'community.create',id,'null',JSON.stringify({name}),at)
  ]);
  return json({id,name,organisationId:orgId},201);
 }
 const match=/^digital-samaj\/([a-zA-Z0-9-]{1,200})(?:\/|$)/.exec(route);
 if(!match)fail(409,'Choose an organisation community');
 const mapped=await repo.first('SELECT organisationId FROM samaj_organisation_ownership WHERE samajId=?',match[1]);
 if(!mapped)fail(404,'Community unavailable');
 const action=request.method==='GET'?'read':'write';
 await scope(repo,user,mapped.organisationId,action);
 const eligible=new Set((await repo.all("SELECT a.userId FROM platform_app_assignments a JOIN platform_memberships m ON m.organisationId=a.organisationId AND m.userId=a.userId JOIN users u ON u.id=a.userId WHERE a.organisationId=? AND a.appId='digital-samaj' AND a.status='Active' AND m.status='Active' AND m.role!='Client' AND u.active=1",mapped.organisationId)).map(row=>row.userId));
 return samaj({...context,user:{...user,role:'Clerk',appIds:['digital-samaj']},organisationUserIds:eligible});
}
