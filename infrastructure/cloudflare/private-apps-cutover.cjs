'use strict';
// Offline, explicit legacy mapping from a fresh authorised D1 export. Never runs
// at Worker startup and never alters the source export or a live database.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite'),{randomUUID}=require('node:crypto');
const files=['0007-batchfee-organisations.sql','0008-samaj-organisations.sql'];
const migrations=files.map(name=>fs.readFileSync(path.join(__dirname,'d1-free-migrations',name),'utf8'));
const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
function preparePrivateAppsCutover(db,organisationId){
 if(typeof organisationId!=='string'||!/^[a-zA-Z0-9-]{1,200}$/.test(organisationId))throw Error('Explicit organisation ID is required');
 const org=db.prepare('SELECT * FROM platform_organisations WHERE id=?').get(organisationId);
 if(!org||org.status!=='Active')throw Error('Choose an active existing organisation');
 const master=db.prepare('SELECT u.* FROM users u JOIN platform_memberships m ON m.userId=u.id WHERE m.organisationId=? AND m.userId=? AND m.status=\'Active\' AND m.role=\'MasterAdmin\'').get(organisationId,org.masterAdminUserId);
 if(!master?.active||master.role!=='Owner')throw Error('Legacy Owner must be the active primary Master Admin');
 const chambers=db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(organisationId),now=Date.now();
 if(!chambers||!['Active','Trial'].includes(chambers.status)||Date.parse(chambers.startsAt)>now||(chambers.endsAt!==null&&Date.parse(chambers.endsAt)<=now))throw Error('An active Chambers licence is required');
 const revision=db.prepare('SELECT revision FROM edge_revision WHERE id=1').get().revision;
 const legacy=db.prepare('SELECT * FROM batchfee_workspace WHERE id=1').get(),events=db.prepare('SELECT at,actor,action,data FROM batchfee_events ORDER BY id').all();
 const communities=db.prepare('SELECT id FROM samaj_communities ORDER BY id').all(),grants=db.prepare('SELECT DISTINCT user_id FROM samaj_grants').all();
 if(events.length&&!legacy)throw Error('BatchFee history is missing its workspace');
 if(communities.length>1)throw Error('Map each legacy Samaj explicitly before cutover');
 if(db.prepare('SELECT COUNT(*) n FROM batchfee_organisation_workspaces').get().n||db.prepare('SELECT COUNT(*) n FROM batchfee_legacy_ownership').get().n||db.prepare('SELECT COUNT(*) n FROM samaj_organisation_ownership').get().n)throw Error('A private app ownership mapping already exists');
 const staff=db.prepare('SELECT user_id,role FROM batchfee_staff').all();
 const eligible=userId=>!!db.prepare("SELECT 1 FROM platform_memberships m JOIN users u ON u.id=m.userId WHERE m.organisationId=? AND m.userId=? AND m.status='Active' AND m.role!='Client' AND u.active=1").get(organisationId,userId);
 if([...staff.map(row=>row.user_id),...grants.map(row=>row.user_id)].some(id=>!eligible(id)))throw Error('Legacy app user is not an active member of the selected organisation');
 if(grants.length&&!grants.some(row=>row.user_id===master.id))throw Error('Primary Master Admin lacks the existing Samaj grant');
 const writes=[],add=(sql,...values)=>writes.push({sql,values});let assignments=0;
 const terms=appId=>{
  if(db.prepare('SELECT 1 FROM platform_app_licences WHERE organisationId=? AND appId=?').get(organisationId,appId))throw Error(appId+' licence already exists; review it in administration');
  add('INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit,version) VALUES(?,?,?,?,?,?,?,?,1)',organisationId,appId,chambers.status,chambers.startsAt,chambers.endsAt,chambers.readOnlyUntil,chambers.staffLimit,0);
 };
 if(legacy){
  const assigned=[{id:master.id,role:'Owner'},...staff.filter(row=>row.user_id!==master.id).map(row=>({id:row.user_id,role:row.role}))];
  if(chambers.staffLimit!==null&&assigned.length>chambers.staffLimit)throw Error('BatchFee assignments exceed available staff seats');
  terms('batchfee-lite');
  for(const item of assigned){add('INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,?,?,?)',organisationId,item.id,'batchfee-lite',item.role,'Active');assignments++;}
  add('INSERT INTO batchfee_organisation_workspaces(organisationId,revision,data) VALUES(?,?,?)',organisationId,legacy.revision,legacy.data);
  for(const event of events)add('INSERT INTO batchfee_organisation_events(organisationId,at,actor,action,data) VALUES(?,?,?,?,?)',organisationId,event.at,event.actor,event.action,event.data);
  add('INSERT INTO batchfee_legacy_ownership(legacyWorkspaceId,organisationId) VALUES(1,?)',organisationId);
 }
 if(communities.length){
  const assigned=[master.id,...grants.map(row=>row.user_id).filter(id=>id!==master.id)];
  if(chambers.staffLimit!==null&&assigned.length>chambers.staffLimit)throw Error('Samaj assignments exceed available staff seats');
  terms('digital-samaj');
  for(const id of assigned){add('INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,?,?,?)',organisationId,id,'digital-samaj',id===master.id?'Owner':'Member','Active');assignments++;}
  add('INSERT INTO samaj_organisation_ownership(samajId,organisationId) VALUES(?,?)',communities[0].id,organisationId);
 }
 if(!writes.length)throw Error('No legacy private app records require cutover');
 const at=Date.now();
 add('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)',organisationId,master.id,'PrivateAppsMapped',at,JSON.stringify({reason:'Explicit legacy BatchFee and Samaj ownership cutover',batchfeeEvents:events.length,samajCommunities:communities.length}));
 add('UPDATE platform_organisations SET version=version+1 WHERE id=?',organisationId);
 const guard=randomUUID(),sql=[`INSERT INTO edge_write_guard(id,valid) VALUES('${guard}',(SELECT revision=${revision} FROM edge_revision WHERE id=1));`,...writes.map(write=>{let index=0;return write.sql.replaceAll('?',()=>literal(write.values[index++]))+';';}),'UPDATE edge_revision SET revision=revision+1 WHERE id=1;',`DELETE FROM edge_write_guard WHERE id='${guard}';`].join('\n');
 const before={legacy:JSON.stringify(legacy),events:JSON.stringify(events),samaj:JSON.stringify(communities)};
 db.exec('BEGIN');try{db.exec(sql);if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Cutover foreign keys failed');if(JSON.stringify(db.prepare('SELECT * FROM batchfee_workspace WHERE id=1').get())!==before.legacy||JSON.stringify(db.prepare('SELECT at,actor,action,data FROM batchfee_events ORDER BY id').all())!==before.events||JSON.stringify(db.prepare('SELECT id FROM samaj_communities ORDER BY id').all())!==before.samaj)throw Error('Legacy data changed');db.exec('ROLLBACK');}catch(error){db.exec('ROLLBACK');throw error;}
 return {sql,summary:{organisationId,batchfeeEvents:events.length,samajCommunities:communities.length,assignments,expectedRevision:revision,legacyPreserved:true}};
}
if(require.main===module){
 const [source,organisationId,target]=process.argv.slice(2);if(!source||!organisationId||!target||fs.existsSync(target))throw Error('Provide a fresh export, explicit organisation ID and new output directory');
 const db=new DatabaseSync(':memory:');try{db.exec('PRAGMA foreign_keys=OFF');db.exec(fs.readFileSync(source,'utf8'));db.exec('PRAGMA foreign_keys=ON');for(const migration of migrations)db.exec(migration);if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source foreign keys failed');const result=preparePrivateAppsCutover(db,organisationId);fs.mkdirSync(target,{recursive:true,mode:0o700});fs.writeFileSync(path.join(target,'enable.sql'),result.sql,{mode:0o600});fs.writeFileSync(path.join(target,'summary.json'),JSON.stringify(result.summary,null,2),{mode:0o600});console.log(JSON.stringify(result.summary));}finally{db.close();}
}
module.exports={preparePrivateAppsCutover};
