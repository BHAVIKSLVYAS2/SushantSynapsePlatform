import {OrganisationAdministration} from '../../../packages/database/organisation-administration.mjs';
import {OrganisationError} from '../../../packages/database/organisation-repository.mjs';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
const fail=(code,message)=>{throw new OrganisationError(code,message);};
export class ClientAccessAdministration {
 constructor(repo){this.repo=repo;this.db=repo.db;this.admin=new OrganisationAdministration(repo);}
 context(input,action){
  const org=action==='write'?this.admin.context(input):this.repo.organisation(input);
  const membership=this.admin.member(org.id,input.actorUserId),user=this.repo.user(input.actorUserId);
  const assignment=this.db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(org.id,input.actorUserId);
  const licence=this.db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(org.id);
  const access=evaluateAppAccess({user,organisation:org,membership,assignment,licence,app:{id:'advocate',status:'Available'},permissions:['advocate:read','advocate:write'],action,now:this.repo.now()});
  if(org.masterAdminUserId!==input.actorUserId||membership?.role!=='MasterAdmin'||assignment?.role!=='Owner'||!access.allowed)fail('forbidden','Primary Master Admin and current Chambers Owner access are required');
  return {...org,clientAccessWritable:access.mode==='full'};
 }
 overview(input){return this.admin.transaction(()=>{
  const org=this.context(input,'read');
  const links=this.db.prepare("SELECT a.userId,a.clientId,a.status,a.createdAt,a.updatedAt,u.name AS memberName,u.email,r.data FROM chambers_client_access a JOIN users u ON u.id=a.userId JOIN records r ON r.kind=a.kind AND r.id=a.clientId WHERE a.organisationId=? ORDER BY a.userId,a.clientId").all(org.id).map(({data,...link})=>({...link,clientName:JSON.parse(data).name}));
  const members=this.db.prepare("SELECT m.userId,u.name,u.email FROM platform_memberships m JOIN users u ON u.id=m.userId WHERE m.organisationId=? AND m.role='Client' AND m.status='Active' AND u.active=1 ORDER BY u.name,m.userId").all(org.id);
  const records=this.db.prepare("SELECT r.id,r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? AND r.kind='clients' ORDER BY r.id").all(org.id).map(r=>({...JSON.parse(r.data),id:r.id})).filter(r=>!r.archived).map(({id,name})=>({id,name}));
  const entitlements=this.db.prepare("SELECT a.userId,u.name,u.email,a.status FROM platform_app_assignments a JOIN users u ON u.id=a.userId WHERE a.organisationId=? AND a.appId='advocate' AND a.role='Client' ORDER BY u.name,a.userId").all(org.id);
  const limit=this.db.prepare("SELECT clientLimit FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(org.id).clientLimit;
  return {organisationId:org.id,name:org.name,version:org.version,readOnly:!org.clientAccessWritable,links,members,records,entitlements,clientSeats:{limit,used:this.admin.usage(org.id).apps.advocate?.client??0}};
 });}
 update(input){return this.admin.transaction(()=>{
  const org=this.context(input,'write');
  if(typeof input.userId!=='string'||!input.userId||input.userId.length>200||typeof input.clientId!=='string'||!input.clientId||input.clientId.length>200||!['Active','Revoked'].includes(input.status))fail('invalid-input','Select a client membership, record and link status');
  const old=this.db.prepare('SELECT * FROM chambers_client_access WHERE organisationId=? AND userId=? AND clientId=?').get(org.id,input.userId,input.clientId);
  if(input.status==='Active'){
   const member=this.admin.member(org.id,input.userId),user=this.repo.user(input.userId);
   const record=this.db.prepare("SELECT r.data FROM records r JOIN chambers_record_ownership o ON o.kind=r.kind AND o.recordId=r.id WHERE o.organisationId=? AND r.kind='clients' AND r.id=?").get(org.id,input.clientId);
   if(member?.role!=='Client'||member.status!=='Active'||!user?.active||!record||JSON.parse(record.data).archived)fail('invalid-member','An active client membership and current client record in this organisation are required');
  }else if(!old)fail('invalid-input','Select an existing client access link');
  if(old?.status===input.status)fail('invalid-state','Client access link already has this status');
  const now=this.repo.now();
  this.db.prepare("INSERT INTO chambers_client_access(organisationId,userId,clientId,status,createdAt,updatedAt) VALUES(?,?,?,?,?,?) ON CONFLICT(organisationId,userId,clientId) DO UPDATE SET status=excluded.status,updatedAt=excluded.updatedAt").run(org.id,input.userId,input.clientId,input.status,now,now);
  return this.admin.finish(org,input,'ClientAccessUpdated',{userId:input.userId,clientId:input.clientId,before:old?.status??null,after:input.status});
 });}
 entitlement(input){return this.admin.transaction(()=>{
  const org=this.context(input,'write');
  if(typeof input.userId!=='string'||!input.userId||input.userId.length>200||!['Active','Inactive'].includes(input.status))fail('invalid-input','Select a client member and entitlement status');
  const old=this.db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(org.id,input.userId);
  if(input.status==='Active'){
   const member=this.admin.member(org.id,input.userId),user=this.repo.user(input.userId);
   const linked=this.db.prepare("SELECT r.data FROM chambers_client_access a JOIN records r ON r.kind=a.kind AND r.id=a.clientId WHERE a.organisationId=? AND a.userId=? AND a.status='Active'").all(org.id,input.userId).some(r=>!JSON.parse(r.data).archived);
   if(!user?.active||member?.role!=='Client'||member.status!=='Active'||!linked)fail('invalid-member','An active Client member with an approved current record link is required');
   const licence=this.db.prepare("SELECT clientLimit FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(org.id);
   const used=this.admin.usage(org.id).apps.advocate?.client??0;
   if(licence.clientLimit!==null&&used+(old?.status==='Active'?0:1)>licence.clientLimit)fail('seat-limit-reached','Chambers client seat limit reached');
  }else if(old?.role!=='Client')fail('invalid-input','Select an existing Client entitlement');
  if(old?.role==='Client'&&old.status===input.status)fail('invalid-state','Client entitlement already has this status');
  this.db.prepare("INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,'advocate','Client',?) ON CONFLICT(organisationId,userId,appId) DO UPDATE SET role='Client',status=excluded.status").run(org.id,input.userId,input.status);
  return this.admin.finish(org,input,'ClientEntitlementUpdated',{userId:input.userId,before:old?{role:old.role,status:old.status}:null,after:input.status});
 });}
}
