import {randomBytes,randomUUID,createHash,scryptSync} from 'node:crypto';
import registry from '../app-registry/index.js';
import {OrganisationRepository,OrganisationError} from './organisation-repository.mjs';
import {canManageOrganisation,evaluateAppAccess} from '../auth/organisation-policy.mjs';

const fail=(code,message)=>{throw new OrganisationError(code,message);};
const hash=value=>createHash('sha256').update(value).digest('hex');
function text(value,label,max=500){if(typeof value!=='string'||!value.trim()||value.length>max)fail('invalid-input',`Invalid ${label}`);return value.trim();}
function limit(value,min=0){if(value!==null&&(!Number.isSafeInteger(value)||value<min))fail('invalid-input','Invalid seat limit');return value;}
function instant(value){const n=typeof value==='string'?Date.parse(value):NaN;if(!Number.isFinite(n)||new Date(n).toISOString()!==value)fail('invalid-input','Use canonical ISO UTC timestamps');return n;}
const pool=role=>role==='Client'?'client':'staff';

// Internal SQLite services only. actorUserId must come from trusted session context.
export class OrganisationAdministration {
  constructor(repository){
    if(!(repository instanceof OrganisationRepository))fail('invalid-repository','An organisation repository is required');
    this.repo=repository;this.db=repository.db;
  }
  transaction(fn){
    if(this.db.isTransaction)fail('transaction-active','Administration requires its own transaction');
    this.db.exec('BEGIN IMMEDIATE');
    try{const result=fn();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  context(input,{superOnly=false,active=true}={}){
    const org=this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(text(input.organisationId,'organisation ID',200));
    if(!org)fail('forbidden','Organisation administration unavailable');
    const membership=this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(org.id,input.actorUserId);
    const authority=this.repo.authority(input.actorUserId);
    if(superOnly)this.repo.requireSuperAdmin(input.actorUserId);
    else if(!canManageOrganisation({...authority,organisation:org,membership}).allowed)fail('forbidden','Organisation administration unavailable');
    if(active&&org.status!=='Active')fail('invalid-state','Organisation must be active');
    if(!Number.isSafeInteger(input.version)||input.version!==org.version)fail('conflict','Organisation changed; reload before continuing');
    return org;
  }
  finish(org,input,action,details){
    const reason=text(input.reason,'change reason');
    this.db.prepare('UPDATE platform_organisations SET version=version+1 WHERE id=?').run(org.id);
    this.repo.audit(org.id,input.actorUserId,action,this.repo.now(),{reason,...details});
    return {organisationId:org.id,version:org.version+1};
  }
  usage(organisationId){
    const members={staff:0,client:0},apps={};
    for(const m of this.db.prepare("SELECT role,status FROM platform_memberships WHERE organisationId=? AND status IN ('Active','Invited')").all(organisationId))members[pool(m.role)]++;
    for(const a of this.db.prepare("SELECT a.appId,m.role FROM platform_app_assignments a JOIN platform_memberships m ON m.organisationId=a.organisationId AND m.userId=a.userId WHERE a.organisationId=? AND a.status='Active'").all(organisationId)){
      apps[a.appId]??={staff:0,client:0};apps[a.appId][pool(a.role)]++;
    }
    return {members,apps};
  }
  member(organisationId,userId){return this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?').get(organisationId,text(userId,'user ID',200));}
  ensureRoom(org,role,additional=1){
    const type=pool(role),cap=org[type+'Limit'],used=this.usage(org.id).members[type];
    if(cap!==null&&used+additional>cap)fail('seat-limit-reached','Organisation seat limit reached');
  }
  overview({actorUserId,organisationId}){
    return this.transaction(()=>{
      const organisation=this.repo.organisation({actorUserId,organisationId});
      const members=this.db.prepare('SELECT m.userId,u.name,u.email,u.active,m.role,m.status FROM platform_memberships m JOIN users u ON u.id=m.userId WHERE m.organisationId=? ORDER BY u.name,m.userId').all(organisationId);
      const assignments=this.db.prepare('SELECT userId,appId,role,status FROM platform_app_assignments WHERE organisationId=? ORDER BY appId,userId').all(organisationId);
      const invitations=this.db.prepare('SELECT id,userId,email,expiresAt,consumedAt,revokedAt,createdAt FROM platform_organisation_invitations WHERE organisationId=? ORDER BY createdAt,id').all(organisationId);
      return {organisation,members,assignments,invitations,usage:this.usage(organisationId)};
    });
  }
  transferMasterAdmin(input){
    return this.transaction(()=>{
      const org=this.context(input,{superOnly:true}),target=this.member(org.id,input.userId);
      if(input.userId===org.masterAdminUserId||!target||target.status!=='Active'||!['Administrator','Staff'].includes(target.role)||!this.repo.user(input.userId)?.active)fail('invalid-member','Select another active staff member of this organisation');
      if(!['Administrator','Staff'].includes(input.previousMasterRole))fail('invalid-input','Select the previous Master Admin membership role');
      this.db.prepare('UPDATE platform_memberships SET role=? WHERE organisationId=? AND userId=?').run(input.previousMasterRole,org.id,org.masterAdminUserId);
      this.db.prepare("UPDATE platform_memberships SET role='MasterAdmin' WHERE organisationId=? AND userId=?").run(org.id,input.userId);
      this.db.prepare('UPDATE platform_organisations SET masterAdminUserId=? WHERE id=?').run(input.userId,org.id);
      this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId IN (?,?) AND consumedAt IS NULL AND revokedAt IS NULL').run(this.repo.now(),org.id,org.masterAdminUserId,input.userId);
      return this.finish(org,input,'MasterAdminTransferred',{previousUserId:org.masterAdminUserId,userId:input.userId,previousMasterRole:input.previousMasterRole});
    });
  }
  updateOrganisationLimits(input){
    return this.transaction(()=>{
      const org=this.context(input,{superOnly:true,active:false});
      if(org.status==='Closed')fail('invalid-state','Closed organisation cannot change capacity');
      limit(input.staffLimit,1);limit(input.clientLimit);
      const used=this.usage(org.id).members;
      if((input.staffLimit!==null&&used.staff>input.staffLimit)||(input.clientLimit!==null&&used.client>input.clientLimit))fail('seat-limit-reached','Cannot reduce capacity below active members and reserved invitations');
      this.db.prepare('UPDATE platform_organisations SET staffLimit=?,clientLimit=? WHERE id=?').run(input.staffLimit,input.clientLimit,org.id);
      return this.finish(org,input,'OrganisationLimitsUpdated',{before:{staffLimit:org.staffLimit,clientLimit:org.clientLimit},after:{staffLimit:input.staffLimit,clientLimit:input.clientLimit}});
    });
  }
  updateOrganisationStatus(input){
    return this.transaction(()=>{
      const org=this.context(input,{superOnly:true,active:false});
      if(!['Active','Suspended'].includes(org.status)||!['Active','Suspended'].includes(input.status)||org.status===input.status)fail('invalid-state','Only Active to Suspended or Suspended to Active transitions are available');
      if(input.confirmation!==org.name)fail('invalid-input','Type the organisation name exactly to confirm');
      this.db.prepare('UPDATE platform_organisations SET status=? WHERE id=?').run(input.status,org.id);
      return {...this.finish(org,input,'OrganisationStatusUpdated',{before:org.status,after:input.status}),status:input.status};
    });
  }
  updateLicence(input){
    return this.transaction(()=>{
      const org=this.context(input,{superOnly:true,active:false});
      if(org.status==='Closed')fail('invalid-state','Closed organisation cannot change licences');
      const app=registry.apps.find(a=>a.id===input.appId&&a.status==='Available'&&!a.public);
      if(!app)fail('invalid-app','Select an implemented private app');
      const old=this.db.prepare('SELECT * FROM platform_app_licences WHERE organisationId=? AND appId=?').get(org.id,app.id);
      if(!Number.isSafeInteger(input.licenceVersion)||input.licenceVersion!==(old?.version??0))fail('conflict','Licence changed; reload before continuing');
      if(!['Scheduled','Trial','Active','Suspended','Expired','Revoked'].includes(input.status))fail('invalid-input','Invalid licence status');
      const start=instant(input.startsAt),end=input.endsAt===null?Infinity:instant(input.endsAt);
      if(end<=start||(input.readOnlyUntil!==null&&(end===Infinity||instant(input.readOnlyUntil)<=end))||(input.status==='Expired'&&(end===Infinity||this.repo.now()<end)))fail('invalid-input','Invalid licence dates');
      limit(input.staffLimit);limit(input.clientLimit);
      const used=this.usage(org.id).apps[app.id]??{staff:0,client:0};
      if((input.staffLimit!==null&&used.staff>input.staffLimit)||(input.clientLimit!==null&&used.client>input.clientLimit))fail('seat-limit-reached','Cannot reduce licence capacity below existing assignments');
      const next={organisationId:org.id,appId:app.id,status:input.status,startsAt:input.startsAt,endsAt:input.endsAt,readOnlyUntil:input.readOnlyUntil,staffLimit:input.staffLimit,clientLimit:input.clientLimit,version:(old?.version??0)+1};
      this.db.prepare('INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit,version) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(organisationId,appId) DO UPDATE SET status=excluded.status,startsAt=excluded.startsAt,endsAt=excluded.endsAt,readOnlyUntil=excluded.readOnlyUntil,staffLimit=excluded.staffLimit,clientLimit=excluded.clientLimit,version=excluded.version').run(...Object.values(next));
      return {...this.finish(org,input,'LicenceUpdated',{before:old??null,after:next}),licenceVersion:next.version};
    });
  }
  inviteMember(input){
    return this.transaction(()=>this.#inviteMember(input));
  }
  inviteNewMember(input){
    return this.transaction(()=>{
      this.context(input); // Authorise before resolving or creating an identity.
      const email=text(input.email,'email',200).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('invalid-input','Invalid email');
      let user=this.db.prepare('SELECT id,active FROM users WHERE lower(email)=?').get(email);
      if(user){
        const pending=this.db.prepare('SELECT activatedAt FROM platform_pending_identities WHERE userId=?').get(user.id);
        if(user.active||!pending||pending.activatedAt!==null)fail('invalid-user','Use the existing-account invitation workflow');
      }else{
        user={id:randomUUID()};const now=this.repo.now();
        this.db.prepare("INSERT INTO users(id,name,email,role,password,active) VALUES(?,?,?,'Clerk',?,0)").run(user.id,email,email,randomBytes(16).toString('hex')+':'+randomBytes(64).toString('hex'));
        this.db.prepare('INSERT INTO platform_pending_identities(userId,createdAt) VALUES(?,?)').run(user.id,now);
        this.repo.audit(input.organisationId,input.actorUserId,'InvitationIdentityCreated',now,{userId:user.id});
      }
      return {...this.#inviteMember({...input,userId:user.id},true),newAccount:true};
    });
  }
  #inviteMember(input,pendingIdentity=false){
      const org=this.context(input),user=this.repo.user(input.userId),old=this.member(org.id,input.userId);
      if(!user||(!user.active&&!pendingIdentity)||!['Administrator','Staff','Client'].includes(input.role)||old?.role==='MasterAdmin'||old?.status==='Active')fail('invalid-member','Select an active account without an active membership');
      if(old?.status!=='Invited'||pool(old.role)!==pool(input.role))this.ensureRoom(org,input.role);
      const now=this.repo.now(),token=randomBytes(32).toString('hex'),expiresAt=now+48*60*60*1000;
      this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId=? AND consumedAt IS NULL AND revokedAt IS NULL').run(now,org.id,user.id);
      this.db.prepare('INSERT INTO platform_memberships(organisationId,userId,role,status,createdAt) VALUES(?,?,?,?,?) ON CONFLICT(organisationId,userId) DO UPDATE SET role=excluded.role,status=excluded.status').run(org.id,user.id,input.role,'Invited',now);
      this.db.prepare('INSERT INTO platform_organisation_invitations(id,organisationId,userId,email,tokenHash,expiresAt,createdAt) VALUES(?,?,?,?,?,?,?)').run(randomUUID(),org.id,user.id,user.email,hash(token),expiresAt,now);
      return {...this.finish(org,input,old?.status==='Invited'?'MemberInvitationReissued':'MemberInvited',{userId:user.id,role:input.role}),invitation:{token,expiresAt}};
  }
  activateNewMember({token,email,name,password}){
    return this.transaction(()=>{
      const invalid=()=>fail('invalid-invitation','Invitation is invalid or unavailable');
      if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||typeof email!=='string')invalid();
      const invite=this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token)),now=this.repo.now();
      if(!invite||invite.email!==email.trim().toLowerCase()||invite.consumedAt!==null||invite.revokedAt!==null||now>=invite.expiresAt)invalid();
      const user=this.repo.user(invite.userId),pending=this.db.prepare('SELECT * FROM platform_pending_identities WHERE userId=?').get(invite.userId);
      const org=this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invite.organisationId),member=this.member(invite.organisationId,invite.userId);
      if(!user||user.active||user.email!==invite.email||!pending||pending.activatedAt!==null||org?.status!=='Active'||member?.status!=='Invited'||!['Administrator','Staff','Client'].includes(member.role))invalid();
      this.ensureRoom(org,member.role,0);
      name=text(name,'name',120);
      if(typeof password!=='string'||password.length<12||password.length>128)fail('invalid-input','Use a password between 12 and 128 characters');
      const salt=randomBytes(16).toString('hex'),credential=salt+':'+scryptSync(password,salt,64).toString('hex');
      this.db.prepare('UPDATE users SET name=?,password=?,active=1 WHERE id=?').run(name,credential,user.id);
      this.db.prepare('UPDATE platform_pending_identities SET activatedAt=? WHERE userId=?').run(now,user.id);
      const result=this.#acceptMemberInvitation({actorUserId:user.id,token});
      this.repo.audit(org.id,user.id,'InvitationIdentityActivated',now,{userId:user.id});
      return result;
    });
  }
  acceptMemberInvitation({actorUserId,token}){
    return this.transaction(()=>this.#acceptMemberInvitation({actorUserId,token}));
  }
  #acceptMemberInvitation({actorUserId,token}){
      const user=this.repo.user(actorUserId),now=this.repo.now();
      if(!user?.active||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail('invalid-invitation','Invitation is invalid or unavailable');
      const invite=this.db.prepare('SELECT * FROM platform_organisation_invitations WHERE tokenHash=?').get(hash(token));
      if(!invite||invite.userId!==user.id||invite.email!==user.email||invite.consumedAt!==null||invite.revokedAt!==null||now>=invite.expiresAt)fail('invalid-invitation','Invitation is invalid or unavailable');
      const member=this.member(invite.organisationId,user.id),org=this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(invite.organisationId);
      if(!org||org.status!=='Active'||member?.status!=='Invited'||!['Administrator','Staff','Client'].includes(member.role))fail('invalid-invitation','Invitation is invalid or unavailable');
      this.ensureRoom(org,member.role,0);
      this.db.prepare("UPDATE platform_memberships SET status='Active' WHERE organisationId=? AND userId=?").run(org.id,user.id);
      this.db.prepare('UPDATE platform_organisation_invitations SET consumedAt=? WHERE id=?').run(now,invite.id);
      return this.finish(org,{actorUserId,reason:'Member accepted organisation invitation'},'MemberActivated',{userId:user.id,role:member.role});
  }
  updateMember(input){
    return this.transaction(()=>{
      const org=this.context(input),member=this.member(org.id,input.userId);
      if(!member||member.role==='MasterAdmin'||member.status==='Invited'||!['Administrator','Staff','Client'].includes(input.role)||!['Active','Inactive'].includes(input.status))fail('invalid-member','Use invitation controls for pending members and transfer controls for the primary Master Admin');
      if(input.status==='Active'&&(member.status!=='Active'||pool(member.role)!==pool(input.role)))fail('invitation-required','Reactivation or staff/client conversion requires a new invitation');
      this.db.prepare('UPDATE platform_memberships SET role=?,status=? WHERE organisationId=? AND userId=?').run(input.role,input.status,org.id,input.userId);
      if(input.status==='Inactive'){
        this.db.prepare("UPDATE platform_app_assignments SET status='Inactive' WHERE organisationId=? AND userId=?").run(org.id,input.userId);
        this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId=? AND consumedAt IS NULL AND revokedAt IS NULL').run(this.repo.now(),org.id,input.userId);
      }
      return this.finish(org,input,'MemberUpdated',{userId:input.userId,before:{role:member.role,status:member.status},after:{role:input.role,status:input.status}});
    });
  }
  revokeMemberInvitation(input){
    return this.transaction(()=>{
      const org=this.context(input),member=this.member(org.id,input.userId);
      if(!member||member.role==='MasterAdmin'||member.status!=='Invited')fail('invalid-member','Select a pending non-primary membership');
      this.db.prepare("UPDATE platform_memberships SET status='Inactive' WHERE organisationId=? AND userId=?").run(org.id,input.userId);
      this.db.prepare('UPDATE platform_organisation_invitations SET revokedAt=? WHERE organisationId=? AND userId=? AND consumedAt IS NULL AND revokedAt IS NULL').run(this.repo.now(),org.id,input.userId);
      return this.finish(org,input,'MemberInvitationRevoked',{userId:input.userId});
    });
  }
  assignChambers(input){
    return this.transaction(()=>{
      const org=this.context(input),member=this.member(org.id,input.userId),user=this.repo.user(input.userId);
      if(!member||!['Active','Inactive'].includes(input.status)||!['Owner','Advocate','Clerk'].includes(input.role))fail('invalid-input','Invalid Chambers assignment');
      const old=this.db.prepare("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='advocate'").get(org.id,input.userId);
      if(input.status==='Active'){
        if(!user?.active||member.status!=='Active'||member.role==='Client')fail('invalid-member','Only active staff can receive Chambers access');
        const licence=this.db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(org.id);
        const access=evaluateAppAccess({user,organisation:org,membership:member,app:registry.apps.find(a=>a.id==='advocate'),licence,
          assignment:{organisationId:org.id,userId:user.id,appId:'advocate',status:'Active'},permissions:['advocate:write'],action:'write',now:this.repo.now()});
        if(!access.allowed)fail('invalid-licence','A current writable Chambers licence is required');
        const used=this.usage(org.id).apps.advocate?.staff??0;
        if(old?.status!=='Active'&&licence.staffLimit!==null&&used>=licence.staffLimit)fail('seat-limit-reached','Chambers seat limit reached');
      }else if(!old)fail('invalid-input','Assignment does not exist');
      this.db.prepare("INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,'advocate',?,?) ON CONFLICT(organisationId,userId,appId) DO UPDATE SET role=excluded.role,status=excluded.status").run(org.id,input.userId,input.role,input.status);
      return this.finish(org,input,'ChambersAssignmentUpdated',{userId:input.userId,before:old??null,after:{role:input.role,status:input.status}});
    });
  }
}
