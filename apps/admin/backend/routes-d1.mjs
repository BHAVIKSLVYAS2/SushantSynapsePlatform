// D1 asynchronous implementation. Shares policy and schema with the native services.
import {OrganisationRepository,OrganisationError} from '../../../packages/database/organisation-repository-d1.mjs';
import {OrganisationAdministration} from '../../../packages/database/organisation-administration-d1.mjs';
import registry from '../../../packages/app-registry/index.js';
import {body as readBody} from '../../../server/edge-http.mjs';
import {accountOverview} from './account-d1.mjs';
import {organisationAudit,platformAudit} from './audit-d1.mjs';


const statuses={forbidden:403,conflict:409,'seat-limit-reached':409,'invalid-state':409,'invitation-required':409,'invalid-member':400,'invalid-input':400,'invalid-app':400,'invalid-user':400,'invalid-licence':409,'invalid-invitation':400};
export async function createOrganisationAdmin({db}){
 const repo=new OrganisationRepository(db),admin=new OrganisationAdministration(repo);await repo.initialise();
 // Distributed request limits are enforced by the edge adapter.
 return async function handle({route,method,req,res,json,user}){
  try{
   if(['organisation-admin/activate-new-master','organisation-admin/activate-new-member'].includes(route)&&method==='POST'){
    if(user)return json(409,{error:'Sign out before activating a new account'});
    const body=await readBody(req,4096);
    const input={token:body.token,email:body.email,name:body.name,password:body.password};
    return json(200,route.endsWith('activate-new-master')?(await repo.activateNewMaster(input)):(await admin.activateNewMember(input)));
   }
   if(!user)return json(401,{error:'Please sign in'});
   const actorUserId=user.id,authority=(await repo.authority(actorUserId));
   if(!authority.user?.active)return json(401,{error:'Please sign in'});
   const superAdmin=authority.platformRole?.active===true;
   if(route==='organisation-admin/account'&&method==='GET')return json(200,(await accountOverview(repo,actorUserId)));
   if(route==='organisation-admin/recovery-export')return json(503,{error:'Cloud recovery uses the offline D1 export tool; browser SQL export is unavailable.'});
   if(route==='organisation-admin'&&method==='GET'){
    const organisations=superAdmin?(await db.prepare('SELECT id,name,status FROM platform_organisations ORDER BY name,id').all()):(await db.prepare("SELECT o.id,o.name,o.status FROM platform_organisations o JOIN platform_memberships m ON m.organisationId=o.id AND m.userId=o.masterAdminUserId WHERE m.userId=? AND m.role='MasterAdmin' AND m.status='Active' AND o.status='Active' ORDER BY o.name,o.id").all(actorUserId));
    return json(200,{superAdmin,organisations,recoveryExportAvailable:false,assignmentApps:['advocate','tournament-lite'],apps:registry.apps.filter(a=>['advocate','tournament-lite'].includes(a.id)&&a.status==='Available').map(({id,name})=>({id,name}))});
   }
   const match=/^organisation-admin\/organisations\/([a-zA-Z0-9-]{1,200})(?:\/([a-z-]+))?$/.exec(route);
   if(route==='organisation-admin/platform-audit'&&method==='GET')return json(200,(await platformAudit(repo,{actorUserId,params:new URL(req.url,'http://localhost').searchParams})));
   if(match?.[2]==='audit'&&method==='GET')return json(200,(await organisationAudit(repo,{actorUserId,organisationId:match[1],params:new URL(req.url,'http://localhost').searchParams})));
   if(match&&method==='GET'&&!match[2])return json(200,(await admin.overview({actorUserId,organisationId:match[1]})));
   if(method!=='POST')return json(404,{error:'Not found'});
   if(match)(await repo.organisation({actorUserId,organisationId:match[1]}));
   if(route==='organisation-admin/provision')(await repo.requireSuperAdmin(actorUserId));
   const body=await readBody(req,32768);
   if('actorUserId' in body||'organisationId' in body)return json(400,{error:'Identity and organisation scope must come from the session and route'});
   const pick=keys=>Object.fromEntries(keys.map(k=>[k,body[k]]));
   const account=async email=>{
    if(typeof email!=='string'||email.length>200)throw new OrganisationError('invalid-input','Enter an existing account email');
    const row=(await db.prepare('SELECT id FROM users WHERE email=? AND active=1').get(email.trim().toLowerCase()));
    if(!row)throw new OrganisationError('invalid-user','An active existing account is required');return row.id;
   };
   if(route==='organisation-admin/accept'){
    if(typeof body.primary!=='boolean')return json(400,{error:'Choose the invitation type'});
    return json(200,body.primary?(await repo.acceptInvitation({actorUserId,token:body.token})):(await admin.acceptMemberInvitation({actorUserId,token:body.token})));
   }
   if(route==='organisation-admin/provision'){
    if(body.newAccount!==undefined&&typeof body.newAccount!=='boolean')return json(400,{error:'Choose a valid account type'});
    const input={actorUserId,...pick(['name','type','timezone','staffLimit','clientLimit','licences'])};
    return json(201,body.newAccount?(await repo.provisionNewMaster({...input,masterAdminEmail:body.masterAdminEmail})):(await repo.provision({...input,masterAdminUserId:await account(body.masterAdminEmail)})));
   }
   if(!match?.[2])return json(404,{error:'Not found'});
   const base={actorUserId,organisationId:match[1],...pick(['version','reason'])};
   switch(match[2]){
    case 'invite':{
     if(body.newAccount!==undefined&&typeof body.newAccount!=='boolean')return json(400,{error:'Choose a valid account type'});
     return json(201,body.newAccount?(await admin.inviteNewMember({...base,email:body.email,role:body.role})):(await admin.inviteMember({...base,userId:await account(body.email),role:body.role})));
    }
    case 'member':return json(200,(await admin.updateMember({...base,...pick(['userId','role','status'])})));
    case 'revoke-invitation':return json(200,(await admin.revokeMemberInvitation({...base,userId:body.userId})));
    case 'assignment':return json(200,(await admin.assignChambers({...base,...pick(['appId','userId','role','status'])})));
    case 'licence':return json(200,(await admin.updateLicence({...base,...pick(['appId','licenceVersion','status','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'])})));
    case 'limits':return json(200,(await admin.updateOrganisationLimits({...base,...pick(['staffLimit','clientLimit'])})));
    case 'status':return json(200,(await admin.updateOrganisationStatus({...base,...pick(['status','confirmation'])})));
    case 'transfer':return json(200,(await admin.transferMasterAdmin({...base,...pick(['userId','previousMasterRole'])})));
    case 'master-invitation':(await repo.requireSuperAdmin(actorUserId));return json(200,(await repo.updateMasterInvitation({...base,revokeOnly:body.revokeOnly})));
    default:return json(404,{error:'Not found'});
   }
  }catch(error){
   if(error instanceof OrganisationError)return json(statuses[error.code]||400,{error:error.message,code:error.code});
   if(error.status)return json(error.status,{error:error.message});
   return json(500,{error:'Administration request failed. No automatic retry was performed.'});
  }
 };
}
