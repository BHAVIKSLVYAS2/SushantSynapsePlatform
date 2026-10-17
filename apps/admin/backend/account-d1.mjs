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
  const assignment=(await db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(org.id,userId));
  const licence=(await db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(org.id));
  const staff=membership.role!=='Client'&&['Owner','Advocate','Clerk'].includes(assignment?.role);
  const access=evaluateAppAccess({...authority,organisation:org,membership,assignment,licence,app:registry.apps.find(a=>a.id==='advocate'),permissions:staff?['advocate:read']:[],action:'read',now:repo.now()});
  let portal=false;if(membership.role==='Client')try{(await clientPortalScope(repo,{actorUserId:userId,organisationId:org.id}));portal=true;}catch(error){if(!(error instanceof OrganisationError))throw error;}
  return {id:org.id,name:org.name,status:org.status,role:membership.role,membershipStatus:membership.status,
   administration:canManageOrganisation({...authority,organisation:org,membership}).allowed,
   clientAccessManagement:access.allowed&&assignment?.role==='Owner'&&membership.role==='MasterAdmin'&&org.masterAdminUserId===userId,
   clientPortal:membership.role==='Client'?(portal?'Available':'Unavailable'):null,
   apps:[{id:'advocate',name:'Chambers',assigned:assignment?.status==='Active',role:assignment?.role??null,
    available:staff&&access.allowed,mode:access.allowed?access.mode:null,
    reason:membership.role==='Client'?'client-portal-unavailable':!staff?'missing-assignment':access.allowed?null:access.reason}]};
 })));
 return {identity,superAdmin:authority.platformRole?.active===true,memberships};
}
