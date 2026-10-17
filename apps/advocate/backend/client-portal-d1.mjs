// D1 asynchronous implementation. Shares policy and schema with the native services.
import {OrganisationError} from '../../../packages/database/organisation-repository-d1.mjs';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
import registry from '../../../packages/app-registry/index.js';
const deny=()=>{throw new OrganisationError('forbidden','Client portal access is unavailable');};
const string=value=>typeof value==='string'?value:'';
export async function clientPortalScope(repo,{actorUserId,organisationId}){
 const db=repo.db,user=(await repo.user(actorUserId));
 const organisation=(await db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(organisationId));
 const membership=(await db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(organisationId,actorUserId));
 const assignment=(await db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(organisationId,actorUserId));
 const licence=(await db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(organisationId));
 if(membership?.role!=='Client'||assignment?.role!=='Client'||licence?.clientLimit===0)deny();
 const access=evaluateAppAccess({user,organisation,membership,assignment,licence,app:registry.apps.find(a=>a.id==='advocate'),permissions:['advocate:read'],action:'read',now:repo.now()});
 if(!access.allowed)deny();
 const clients=(await db.prepare("SELECT r.id,r.data FROM chambers_client_access a JOIN chambers_record_ownership o ON o.organisationId=a.organisationId AND o.kind=a.kind AND o.recordId=a.clientId JOIN records r ON r.kind=o.kind AND r.id=o.recordId WHERE a.organisationId=? AND a.userId=? AND a.status='Active' ORDER BY r.id").all(organisationId,actorUserId)).map(row=>({id:row.id,data:JSON.parse(row.data)})).filter(row=>!row.data.archived).map(row=>({id:row.id,name:string(row.data.name)}));
 if(!clients.length)deny();
 return {organisation,access,clients};
}
export async function clientPortalOverview(repo,input){
 const {organisation,access,clients}=(await clientPortalScope(repo,input)),db=repo.db,organisationId=organisation.id;
 const ids=new Set(clients.map(c=>c.id));
 const cases=(await db.prepare("SELECT r.id,r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? AND r.kind='cases' ORDER BY r.id").all(organisationId)).flatMap(row=>{
  const record=JSON.parse(row.data);if(record.archived||!ids.has(record.clientId))return [];
  return [{id:row.id,clientId:record.clientId,...Object.fromEntries(['number','cnr','court','stage','status'].map(key=>[key,string(record[key])]))}];
 });
 return {organisation:{id:organisation.id,name:organisation.name},readOnly:true,licenceMode:access.mode,clients,cases};
}
