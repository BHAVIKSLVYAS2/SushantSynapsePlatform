// D1 asynchronous implementation. Shares policy and schema with the native services.
import {evaluateAppAccess,canManageOrganisation} from '../../../packages/auth/organisation-policy.mjs';
import registry from '../../../packages/app-registry/index.js';
import {clientPortalScope} from '../../advocate/backend/client-portal-d1.mjs';
import {OrganisationError} from '../../../packages/database/organisation-repository-d1.mjs';
export async function accountOverview(repo,userId){
 const db=repo.db,authority=(await repo.authority(userId));
 const identity=(await db.prepare('SELECT name,email FROM users WHERE id=?').get(userId));
 const memberships=(await Promise.all((await db.prepare('SELECT o.*,m.role AS membershipRole,m.status AS membershipStatus FROM platform_organisations o JOIN platform_memberships m ON m.organisationId=o.id WHERE m.userId=? ORDER BY o.name,o.id').all(userId)).map(async org=>{
  const membership={organisationId:org.id,userId,role:org.membershipRole,status:org.membershipStatus};
  const apps=[];let access={allowed:false},assignment;
  for(const appId of ['advocate','tournament-lite']){
   const currentAssignment=await db.prepare('SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId=?').get(org.id,userId,appId);
   const licence=await db.prepare('SELECT * FROM platform_app_licences WHERE organisationId=? AND appId=?').get(org.id,appId);
   const staff=membership.role!=='Client'&&(appId==='advocate'?['Owner','Advocate','Clerk']:['Owner','Advocate']).includes(currentAssignment?.role);
   const granted=evaluateAppAccess({...authority,organisation:org,membership,assignment:currentAssignment,licence,app:registry.apps.find(a=>a.id===appId),permissions:staff?[appId+':read']:[],action:'read',now:repo.now()});
   apps.push({id:appId,name:registry.apps.find(a=>a.id===appId).name,assigned:currentAssignment?.status==='Active',role:currentAssignment?.role??null,available:staff&&granted.allowed,mode:granted.allowed?granted.mode:null,reason:!staff?'missing-assignment':granted.allowed?null:granted.reason});
   if(appId==='advocate'){access=granted;assignment=currentAssignment;}
  }
  let portal=false;if(membership.role==='Client')try{(await clientPortalScope(repo,{actorUserId:userId,organisationId:org.id}));portal=true;}catch(error){if(!(error instanceof OrganisationError))throw error;}
  return {id:org.id,name:org.name,status:org.status,role:membership.role,membershipStatus:membership.status,
   administration:canManageOrganisation({...authority,organisation:org,membership}).allowed,
   clientAccessManagement:access.allowed&&assignment?.role==='Owner'&&membership.role==='MasterAdmin'&&org.masterAdminUserId===userId,
   clientPortal:membership.role==='Client'?(portal?'Available':'Unavailable'):null,
   apps};
 })));
 return {identity,superAdmin:authority.platformRole?.active===true,memberships};
}
