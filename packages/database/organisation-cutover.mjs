import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import {OrganisationRepository,migrateOrganisationSchema,organisationTables} from './organisation-repository.mjs';
import {LegacyChambersMapping} from './legacy-chambers-mapping.mjs';

// Offline planner for a restored recovery copy, never a runtime HTTP operation.
// It returns parameterised statements for a separately reviewed atomic D1 batch.
export function prepareOrganisationCutover(db,{email,password,legacyMasterAdminUserId}){
 if(typeof email!=='string'||email.length>200||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Valid Super Admin email required');
 if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Use a password between 12 and 128 characters');
 email=email.trim().toLowerCase();
 if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='platform_super_admins'").get())throw Error('Choose an unmigrated recovery copy; do not re-bootstrap an existing organisation database');
 if(db.prepare('SELECT id FROM users WHERE lower(email)=?').get(email))throw Error('Requested email already exists; do not overwrite its credentials');
 const master=db.prepare("SELECT * FROM users WHERE id=? AND role='Owner' AND active=1").get(legacyMasterAdminUserId);
 if(!master)throw Error('Explicitly select an active existing Chambers Owner as the retained primary Master Admin');
 const revision=db.prepare('SELECT revision FROM edge_revision WHERE id=1').get()?.revision;
 if(!Number.isSafeInteger(revision))throw Error('D1 revision metadata is missing');
 const originalUsers=db.prepare('SELECT * FROM users ORDER BY id').all();
 const grants=db.prepare('SELECT * FROM app_access').all();
 const profile=db.prepare("SELECT data FROM settings WHERE id='firm'").get();
 let name;try{name=JSON.parse(profile?.data||'{}').name;}catch{throw Error('Existing Chambers profile is invalid');}
 if(typeof name!=='string'||!name.trim()||name.length>160)name='Existing Chambers';
 migrateOrganisationSchema(db);const service=new OrganisationRepository(db),userId=randomUUID(),salt=randomBytes(16).toString('hex');
 const credential=salt+':'+scryptSync(password,salt,64).toString('hex');
 db.prepare("INSERT INTO users(id,name,email,role,password,active) VALUES(?,'Super Admin',?,'Clerk',?,1)").run(userId,email,credential);
 service.bootstrapSuperAdmin({userId});
 const licence={appId:'advocate',status:'Active',startsAt:'2020-01-01T00:00:00.000Z',endsAt:null,readOnlyUntil:null,staffLimit:25,clientLimit:0};
 const created=service.provision({actorUserId:userId,name,type:'Legal',masterAdminUserId:master.id,staffLimit:25,clientLimit:0,licences:[licence]});
 service.acceptInvitation({actorUserId:master.id,token:created.invitation.token});
 const accounts=[...originalUsers.map(user=>{
  const existingAccess=user.role==='Owner'||grants.some(g=>g.userId===user.id&&g.appId==='advocate');
  return {userId:user.id,role:user.id===master.id?'MasterAdmin':existingAccess?'Staff':null,appRole:existingAccess?user.role:null};
 }),{userId,role:null,appRole:null}];
 const mapper=new LegacyChambersMapping(service),input={actorUserId:userId,organisationId:created.organisationId,accounts};
 const preview=mapper.preview(input),mapped=mapper.apply({...input,fingerprint:preview.fingerprint});
 const token=randomUUID(),statements=[{sql:'PRAGMA defer_foreign_keys=ON',values:[]},{sql:'INSERT INTO edge_write_guard(id,valid) SELECT ?,revision=? FROM edge_revision WHERE id=1',values:[token,revision]},
  {sql:"INSERT INTO users(id,name,email,role,password,active) VALUES(?,'Super Admin',?,'Clerk',?,1)",values:[userId,email,credential]}];
 for(const table of organisationTables.filter(t=>t!=='platform_organisation_migrations'))for(const row of db.prepare('SELECT * FROM '+table).all()){
  statements.push({sql:'INSERT INTO '+table+'('+Object.keys(row).join(',')+') VALUES('+Object.keys(row).map(()=>'?').join(',')+')',values:Object.values(row)});
 }
 statements.push({sql:'UPDATE edge_revision SET revision=revision+1 WHERE id=1',values:[]},{sql:'DELETE FROM edge_write_guard WHERE id=?',values:[token]});
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Prepared cutover violates foreign keys');
 for(const old of originalUsers){const current=db.prepare('SELECT * FROM users WHERE id=?').get(old.id);if(JSON.stringify(current)!==JSON.stringify(old))throw Error('Existing identity changed during cutover preparation');}
 return {statements,summary:{superAdminUserId:userId,organisationId:created.organisationId,retainedMasterAdminUserId:master.id,counts:mapped.counts,sourceRevision:revision}};
}
