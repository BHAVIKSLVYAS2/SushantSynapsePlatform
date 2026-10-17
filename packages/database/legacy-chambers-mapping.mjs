import {createHash} from 'node:crypto';
import registry from '../app-registry/index.js';
import {OrganisationRepository, OrganisationError} from './organisation-repository.mjs';
import {evaluateAppAccess} from '../auth/organisation-policy.mjs';

const fail=(code,message)=>{throw new OrganisationError(code,message);};
const digest=value=>createHash('sha256').update(JSON.stringify(value,(_,item)=>item instanceof Uint8Array?Buffer.from(item).toString('hex'):item)).digest('hex');
function transaction(db,fn){
  if(db.isTransaction)fail('transaction-active','Mapping requires its own transaction');
  db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}
}

// Offline migration service, deliberately not called from current app routes.
// Roles/exclusions must be selected explicitly for every existing global account.
export class LegacyChambersMapping {
  constructor(repository){
    if(!(repository instanceof OrganisationRepository))fail('invalid-repository','An organisation repository is required');
    this.repo=repository;this.db=repository.db;
  }
  plan({actorUserId,organisationId,accounts}){
    this.repo.requireSuperAdmin(actorUserId);
    if(this.db.prepare('SELECT appId FROM platform_legacy_workspaces LIMIT 1').get()||
      this.db.prepare('SELECT recordId FROM chambers_record_ownership LIMIT 1').get()||
      this.db.prepare('SELECT fileId FROM chambers_file_ownership LIMIT 1').get())fail('already-mapped','Legacy Chambers ownership has already been selected');
    const organisation=this.db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(organisationId);
    if(!organisation||organisation.status!=='Active')fail('invalid-state','Select an activated organisation');
    const memberships=this.db.prepare('SELECT * FROM platform_memberships WHERE organisationId=? ORDER BY userId').all(organisationId);
    if(memberships.length!==1||memberships[0].userId!==organisation.masterAdminUserId||memberships[0].role!=='MasterAdmin'||memberships[0].status!=='Active'||
      this.db.prepare('SELECT userId FROM platform_app_assignments WHERE organisationId=? LIMIT 1').get(organisationId))fail('invalid-state','Select an organisation with only its activated primary Master Admin and no app assignments');
    const users=this.db.prepare('SELECT * FROM users ORDER BY id').all();
    if(!Array.isArray(accounts)||accounts.length!==users.length)fail('invalid-mapping','Explicitly map or exclude every existing account');
    const selected=new Map();
    for(const account of accounts){
      if(!account||typeof account.userId!=='string'||selected.has(account.userId)||!users.some(user=>user.id===account.userId)||
        ![null,'MasterAdmin','Administrator','Staff'].includes(account.role)||
        ![null,'Owner','Advocate','Clerk'].includes(account.appRole)||
        (account.role===null&&account.appRole!==null))fail('invalid-mapping','Invalid or duplicate account mapping');
      selected.set(account.userId,{userId:account.userId,role:account.role,appRole:account.appRole});
    }
    const grants=this.db.prepare('SELECT * FROM app_access ORDER BY userId,appId').all();
    let activeMembers=0,activeAssignments=0;
    for(const user of users){
      const choice=selected.get(user.id);
      if(user.id===organisation.masterAdminUserId){if(choice.role!=='MasterAdmin'||user.active!==1)fail('invalid-mapping','The active primary Master Admin must be retained');}
      else if(choice.role==='MasterAdmin')fail('invalid-mapping','Only the selected primary Master Admin can have that role');
      if(choice.role!==null&&user.active===1)activeMembers++;
      if(choice.appRole!==null){
        if(choice.appRole!==user.role||(user.role!=='Owner'&&!grants.some(g=>g.userId===user.id&&g.appId==='advocate')))fail('invalid-mapping','Mapping must preserve existing Chambers access and app role');
        if(user.active===1)activeAssignments++;
      }
    }
    const licence=this.db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(organisationId);
    const master=users.find(user=>user.id===organisation.masterAdminUserId);
    const access=evaluateAppAccess({user:{...master,active:master.active===1},organisation,membership:memberships[0],
      app:registry.apps.find(app=>app.id==='advocate'),licence,
      assignment:{organisationId,userId:master.id,appId:'advocate',status:'Active'},permissions:['advocate:write'],action:'write',now:this.repo.now()});
    if(!access.allowed)fail('invalid-licence','A current writable Chambers licence is required');
    if((organisation.staffLimit!==null&&activeMembers>organisation.staffLimit)||(licence.staffLimit!==null&&activeAssignments>licence.staffLimit))fail('seat-limit-reached','Existing active accounts exceed the selected staff capacity');
    const records=this.db.prepare('SELECT * FROM records ORDER BY kind,id').all();
    const files=this.db.prepare('SELECT * FROM files ORDER BY id').all();
    const snapshotHash=digest({users,grants,records,files,organisation,memberships,licence,
      settings:this.db.prepare('SELECT * FROM settings ORDER BY id').all(),
      preferences:this.db.prepare('SELECT * FROM platform_preferences ORDER BY userId').all()});
    const normalized=[...selected.values()].sort((a,b)=>a.userId<b.userId?-1:a.userId>b.userId?1:0);
    const fingerprint=digest({organisationId,snapshotHash,accounts:normalized});
    return {organisationId,fingerprint,snapshotHash,accounts:normalized,records,files,
      counts:{records:records.length,files:files.length,members:normalized.filter(a=>a.role!==null).length,activeMembers,activeAssignments,excluded:normalized.filter(a=>a.role===null).length}};
  }
  preview(input){return transaction(this.db,()=>{
    const {organisationId,fingerprint,counts}=this.plan(input);
    return {organisationId,fingerprint,counts};
  });}
  apply(input){return transaction(this.db,()=>{
    const plan=this.plan(input);
    if(typeof input.fingerprint!=='string'||input.fingerprint!==plan.fingerprint)fail('conflict','Legacy data or mapping changed; preview again');
    const now=this.repo.now();
    for(const choice of plan.accounts){
      if(choice.role===null)continue;
      const user=this.repo.user(choice.userId),status=user.active?'Active':'Inactive';
      if(choice.role!=='MasterAdmin')this.db.prepare('INSERT INTO platform_memberships(organisationId,userId,role,status,createdAt) VALUES(?,?,?,?,?)').run(plan.organisationId,user.id,choice.role,status,now);
      if(choice.appRole!==null)this.db.prepare('INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,?,?,?)').run(plan.organisationId,user.id,'advocate',choice.appRole,status);
    }
    this.db.prepare("INSERT INTO platform_legacy_workspaces(appId,organisationId,mappedAt,snapshotHash) VALUES('advocate',?,?,?)").run(plan.organisationId,now,plan.snapshotHash);
    const firm=this.db.prepare("SELECT data FROM settings WHERE id='firm'").get();
    if(firm)this.db.prepare('INSERT INTO chambers_workspace_settings(organisationId,data) VALUES(?,?)').run(plan.organisationId,firm.data);
    for(const record of plan.records)this.db.prepare('INSERT INTO chambers_record_ownership(kind,recordId,organisationId) VALUES(?,?,?)').run(record.kind,record.id,plan.organisationId);
    for(const file of plan.files)this.db.prepare('INSERT INTO chambers_file_ownership(fileId,organisationId) VALUES(?,?)').run(file.id,plan.organisationId);
    this.repo.audit(plan.organisationId,input.actorUserId,'LegacyChambersMapped',now,{fingerprint:plan.fingerprint,...plan.counts});
    return {organisationId:plan.organisationId,counts:plan.counts};
  });}
}
