import {OrganisationRepository,OrganisationError} from '../../../packages/database/organisation-repository.mjs';
import {OrganisationAdministration} from '../../../packages/database/organisation-administration.mjs';
import registry from '../../../packages/app-registry/index.js';
import http from '../../../server/http.js';
import {accountOverview} from './account.mjs';
import {organisationAudit,platformAudit} from './audit.mjs';
import {scryptSync,timingSafeEqual} from 'node:crypto';
const {readBody}=http;
const statuses={forbidden:403,conflict:409,'seat-limit-reached':409,'invalid-state':409,'invitation-required':409,'invalid-member':400,'invalid-input':400,'invalid-app':400,'invalid-user':400,'invalid-licence':409,'invalid-invitation':400};
export function createOrganisationAdmin({db,exportSql}){
 const repo=new OrganisationRepository(db),admin=new OrganisationAdministration(repo);
 // A single bounded bucket also caps expensive password work across all clients.
 let activationWindow=0,activationAttempts=0;
 let recoveryWindow=0,recoveryAttempts=0;
 return async function handle({route,method,req,res,json,user}){
  try{
   if(['organisation-admin/activate-new-master','organisation-admin/activate-new-member'].includes(route)&&method==='POST'){
    if(user)return json(409,{error:'Sign out before activating a new account'});
    const now=Date.now();
    if(now-activationWindow>=60000){activationWindow=now;activationAttempts=0;}
    if(++activationAttempts>20)return json(429,{error:'Too many activation attempts. Try again in one minute.'});
    const body=await readBody(req,4096);
    const input={token:body.token,email:body.email,name:body.name,password:body.password};
    return json(200,route.endsWith('activate-new-master')?repo.activateNewMaster(input):admin.activateNewMember(input));
   }
   if(!user)return json(401,{error:'Please sign in'});
   const actorUserId=user.id,authority=repo.authority(actorUserId);
   if(!authority.user?.active)return json(401,{error:'Please sign in'});
   const superAdmin=authority.platformRole?.active===true;
   if(route==='organisation-admin/account'&&method==='GET')return json(200,accountOverview(repo,actorUserId));
   if(route==='organisation-admin/recovery-export'&&method==='POST'){
    repo.requireSuperAdmin(actorUserId);
    const now=Date.now();if(now-recoveryWindow>=60000){recoveryWindow=now;recoveryAttempts=0;}
    if(++recoveryAttempts>5)return json(429,{error:'Too many recovery attempts. Try again in one minute.'});
    const body=await readBody(req,4096);
    if(body.confirmation!=='EXPORT ALL ORGANISATIONS'||typeof body.reason!=='string'||!body.reason.trim()||body.reason.length>500)return json(400,{error:'Enter a reason and type EXPORT ALL ORGANISATIONS to confirm the full backup scope'});
    const stored=db.prepare('SELECT password FROM users WHERE id=? AND active=1').get(actorUserId)?.password;
    const [salt,key]=String(stored).split(':');
    if(typeof body.password!=='string'||body.password.length>128||! /^[a-f0-9]{32}$/.test(salt)||! /^[a-f0-9]{128}$/.test(key)||!timingSafeEqual(scryptSync(body.password,salt,64),Buffer.from(key,'hex')))return json(403,{error:'Password verification failed',code:'reauthentication-failed'});
    if(typeof exportSql!=='function')return json(503,{error:'Recovery export unavailable'});
    const sql=exportSql({beforeExport:()=>{
     repo.requireSuperAdmin(actorUserId);
     repo.audit(null,actorUserId,'PlatformRecoveryExportCreated',repo.now(),{reason:body.reason.trim(),scope:'AllOrganisations',includesAccountHashes:true,includesDocuments:true,excludesSessions:true});
    }});
    res.writeHead(200,{'Content-Type':'application/sql; charset=utf-8','Content-Disposition':'attachment; filename="synapse-platform-recovery.sql"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    return res.end(sql);
   }
   if(route==='organisation-admin'&&method==='GET'){
    const organisations=superAdmin?db.prepare('SELECT id,name,status FROM platform_organisations ORDER BY name,id').all():db.prepare("SELECT o.id,o.name,o.status FROM platform_organisations o JOIN platform_memberships m ON m.organisationId=o.id AND m.userId=o.masterAdminUserId WHERE m.userId=? AND m.role='MasterAdmin' AND m.status='Active' AND o.status='Active' ORDER BY o.name,o.id").all(actorUserId);
    return json(200,{superAdmin,organisations,apps:registry.apps.filter(a=>a.status==='Available'&&!a.public).map(({id,name})=>({id,name}))});
   }
   const match=/^organisation-admin\/organisations\/([a-zA-Z0-9-]{1,200})(?:\/([a-z-]+))?$/.exec(route);
   if(route==='organisation-admin/platform-audit'&&method==='GET')return json(200,platformAudit(repo,{actorUserId,params:new URL(req.url,'http://localhost').searchParams}));
   if(match?.[2]==='audit'&&method==='GET')return json(200,organisationAudit(repo,{actorUserId,organisationId:match[1],params:new URL(req.url,'http://localhost').searchParams}));
   if(match&&method==='GET'&&!match[2])return json(200,admin.overview({actorUserId,organisationId:match[1]}));
   if(method!=='POST')return json(404,{error:'Not found'});
   if(match)repo.organisation({actorUserId,organisationId:match[1]});
   if(route==='organisation-admin/provision')repo.requireSuperAdmin(actorUserId);
   const body=await readBody(req,32768);
   if('actorUserId' in body||'organisationId' in body)return json(400,{error:'Identity and organisation scope must come from the session and route'});
   const pick=keys=>Object.fromEntries(keys.map(k=>[k,body[k]]));
   const account=email=>{
    if(typeof email!=='string'||email.length>200)throw new OrganisationError('invalid-input','Enter an existing account email');
    const row=db.prepare('SELECT id FROM users WHERE email=? AND active=1').get(email.trim().toLowerCase());
    if(!row)throw new OrganisationError('invalid-user','An active existing account is required');return row.id;
   };
   if(route==='organisation-admin/accept'){
    if(typeof body.primary!=='boolean')return json(400,{error:'Choose the invitation type'});
    return json(200,body.primary?repo.acceptInvitation({actorUserId,token:body.token}):admin.acceptMemberInvitation({actorUserId,token:body.token}));
   }
   if(route==='organisation-admin/provision'){
    if(body.newAccount!==undefined&&typeof body.newAccount!=='boolean')return json(400,{error:'Choose a valid account type'});
    const input={actorUserId,...pick(['name','type','timezone','staffLimit','clientLimit','licences'])};
    return json(201,body.newAccount?repo.provisionNewMaster({...input,masterAdminEmail:body.masterAdminEmail}):repo.provision({...input,masterAdminUserId:account(body.masterAdminEmail)}));
   }
   if(!match?.[2])return json(404,{error:'Not found'});
   const base={actorUserId,organisationId:match[1],...pick(['version','reason'])};
   switch(match[2]){
    case 'invite':{
     if(body.newAccount!==undefined&&typeof body.newAccount!=='boolean')return json(400,{error:'Choose a valid account type'});
     return json(201,body.newAccount?admin.inviteNewMember({...base,email:body.email,role:body.role}):admin.inviteMember({...base,userId:account(body.email),role:body.role}));
    }
    case 'member':return json(200,admin.updateMember({...base,...pick(['userId','role','status'])}));
    case 'revoke-invitation':return json(200,admin.revokeMemberInvitation({...base,userId:body.userId}));
    case 'assignment':return json(200,admin.assignChambers({...base,...pick(['userId','role','status'])}));
    case 'licence':return json(200,admin.updateLicence({...base,...pick(['appId','licenceVersion','status','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'])}));
    case 'limits':return json(200,admin.updateOrganisationLimits({...base,...pick(['staffLimit','clientLimit'])}));
    case 'status':return json(200,admin.updateOrganisationStatus({...base,...pick(['status','confirmation'])}));
    case 'transfer':return json(200,admin.transferMasterAdmin({...base,...pick(['userId','previousMasterRole'])}));
    case 'master-invitation':repo.requireSuperAdmin(actorUserId);return json(200,repo.updateMasterInvitation({...base,revokeOnly:body.revokeOnly}));
    default:return json(404,{error:'Not found'});
   }
  }catch(error){
   if(error instanceof OrganisationError)return json(statuses[error.code]||400,{error:error.message,code:error.code});
   if(error.status)return json(error.status,{error:error.message});
   return json(500,{error:'Administration request failed. No automatic retry was performed.'});
  }
 };
}
