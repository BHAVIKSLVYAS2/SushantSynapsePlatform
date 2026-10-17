import {OrganisationError} from '../../../packages/database/organisation-repository.mjs';
const actions=['OrganisationProvisioned','OrganisationActivated','OrganisationStatusUpdated','OrganisationLimitsUpdated','MasterAdminTransferred','MasterInvitationRevoked','MasterInvitationReissued','MemberInvited','MemberInvitationReissued','MemberActivated','MemberUpdated','MemberInvitationRevoked','LicenceUpdated','ChambersAssignmentUpdated','InvitationIdentityCreated','InvitationIdentityActivated','ClientAccessUpdated','ClientAccessClearedForRestore','ClientEntitlementUpdated','LegacyChambersMapped'];
const allowedValues=new Set(['Active','Inactive','Invited','Revoked','Scheduled','Trial','Suspended','Expired','PendingActivation','Closed','Draft','MasterAdmin','Administrator','Staff','Client','Owner','Advocate','Clerk']);
const clean=value=>value.replace(/\b[a-f0-9]{64,128}\b/gi,'[redacted]').replace(/\bauthorization\s*[:=]\s*(?:bearer\s+)?\S+/gi,'authorization=[redacted]').replace(/\b(password|token|secret|cookie)\s*[:=]\s*(?:"[^"]*"|'[^']*'|\S+)/gi,'$1=[redacted]');
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,200}$/.test(value)&&! /^[a-f0-9]{64,128}$/i.test(value)?value:undefined;
function detailsFor(action,raw){
 let data;try{data=JSON.parse(raw);}catch{return {};}
 if(!data||typeof data!=='object'||!actions.includes(action))return {};
 const safe={};
 if(typeof data.reason==='string')safe.reason=clean(data.reason).slice(0,500);
 for(const key of ['userId','masterAdminUserId','previousUserId','appId'])if(id(data[key]))safe[key]=id(data[key]);
 for(const key of ['role','previousMasterRole'])if(allowedValues.has(data[key]))safe[key]=data[key];
 if(action==='OrganisationProvisioned'&&Array.isArray(data.appIds))safe.appIds=data.appIds.slice(0,50).map(id).filter(Boolean);
 for(const key of ['before','after']){
  const value=data[key];
  if(value===null||allowedValues.has(value))safe[key]=value;
  else if(value&&typeof value==='object'){
   const change={};for(const field of ['role','status'])if(allowedValues.has(value[field]))change[field]=value[field];
   if(action==='LicenceUpdated'||action==='OrganisationLimitsUpdated'){
    if(action==='LicenceUpdated'&&id(value.appId))change.appId=id(value.appId);
    for(const field of ['staffLimit','clientLimit'])if(value[field]===null||(Number.isSafeInteger(value[field])&&value[field]>=0))change[field]=value[field];
    if(action==='LicenceUpdated')for(const field of ['startsAt','endsAt','readOnlyUntil'])if(value[field]===null||(typeof value[field]==='string'&&Number.isFinite(Date.parse(value[field]))&&new Date(value[field]).toISOString()===value[field]))change[field]=value[field];
   }
   if(Object.keys(change).length)safe[key]=change;
  }
 }
 if(action==='ClientAccessClearedForRestore'&&Number.isSafeInteger(data.links)&&data.links>=0)safe.links=data.links;
 return safe;
}
export function organisationAudit(repo,{actorUserId,organisationId,params}){
 const org=repo.organisation({actorUserId,organisationId}); // Authorise before inspecting pagination.
 return readAudit(repo,{org,params});
}
export function platformAudit(repo,{actorUserId,params}){
 repo.requireSuperAdmin(actorUserId);
 return readAudit(repo,{params,platform:true});
}
const platformActions=['SuperAdminBootstrapped','PlatformRecoveryExportCreated'];
function platformDetails(action,raw){
 if(action!=='PlatformRecoveryExportCreated')return {};
 let data;try{data=JSON.parse(raw);}catch{return {};}
 if(!data||typeof data!=='object')return {};
 const safe={};
 if(typeof data.reason==='string')safe.reason=clean(data.reason).slice(0,500);
 if(data.scope==='AllOrganisations')safe.scope=data.scope;
 for(const key of ['includesAccountHashes','includesDocuments','excludesSessions'])if(typeof data[key]==='boolean')safe[key]=data[key];
 return safe;
}
function readAudit(repo,{org,params,platform=false}){
 const listed=platform?platformActions:actions;
 const bad=()=>{throw new OrganisationError('invalid-input','Use limit 1–50, a positive before cursor and a listed action');};
 for(const key of params.keys())if(!['limit','before','action'].includes(key)||params.getAll(key).length!==1)bad();
 const integer=(key,fallback)=>{if(!params.has(key))return fallback;const value=params.get(key);if(!/^[1-9]\d*$/.test(value))bad();const number=Number(value);if(!Number.isSafeInteger(number))bad();return number;};
 const limit=integer('limit',20),before=integer('before',Number.MAX_SAFE_INTEGER),action=params.get('action')||null;
 if(limit>50||(action&&!listed.includes(action)))bad();
 const rows=repo.db.prepare('SELECT id,actorUserId,action,at,details FROM platform_organisation_audit WHERE '+(platform?'organisationId IS NULL':'organisationId=?')+' AND id<?'+(action?' AND action=?':'')+' ORDER BY id DESC LIMIT ?').all(...[...(platform?[]:[org.id]),before,...(action?[action]:[]),limit+1]);
 const events=rows.slice(0,limit).map(row=>({id:row.id,actorUserId:id(row.actorUserId)||'Unavailable',action:listed.includes(row.action)?row.action:'Other governance event',at:row.at,details:platform?platformDetails(row.action,row.details):detailsFor(row.action,row.details)}));
 return {...(platform?{scope:'platform'}:{organisation:{id:org.id,name:org.name}}),events,nextBefore:rows.length>limit?events.at(-1).id:null,actions:listed};
}
