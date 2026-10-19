'use strict';
// Offline, fail-closed preparation from an authorised D1 export. No network calls.
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const schema=fs.readFileSync(path.join(__dirname,'../../apps/tournament-lite/database/002-organisation.sql'),'utf8');
function prepareTournamentCutover(db){
 const before=db.prepare('SELECT id,owner,revision,public_token,data FROM tournament_lite_events ORDER BY id').all();
 if(db.prepare("SELECT name FROM sqlite_master WHERE name='tournament_lite_ownership'").get()&&db.prepare('SELECT COUNT(*) n FROM tournament_lite_ownership').get().n)throw Error('Tournament ownership already mapped');
 const revision=db.prepare('SELECT revision FROM edge_revision WHERE id=1').get().revision;
 const owners=new Map(),orgs=new Set();
 for(const event of before){
  const memberships=db.prepare("SELECT m.organisationId FROM platform_memberships m JOIN platform_organisations o ON o.id=m.organisationId JOIN users u ON u.id=m.userId WHERE m.userId=? AND m.status='Active' AND m.role!='Client' AND o.status='Active' AND u.active=1").all(event.owner);
  if(memberships.length!==1)throw Error('Tournament owner needs one unambiguous active organisation');
  owners.set(event.id,memberships[0].organisationId);orgs.add(memberships[0].organisationId);
 }
 const writes=[],add=(sql,...values)=>writes.push({sql,values}),now=Date.now();let assignments=0;
 for(const organisationId of orgs){
  const licence=db.prepare("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='advocate'").get(organisationId);
  if(!licence||!['Active','Trial'].includes(licence.status)||Date.parse(licence.startsAt)>now||(licence.endsAt!==null&&Date.parse(licence.endsAt)<=now))throw Error('An active existing licence is required for restored Tournament access');
  if(db.prepare("SELECT appId FROM platform_app_licences WHERE organisationId=? AND appId='tournament-lite'").get(organisationId))throw Error('Tournament licence already exists; use administration');
  const eligible=db.prepare("SELECT DISTINCT u.id,u.role FROM users u JOIN platform_memberships m ON m.userId=u.id WHERE m.organisationId=? AND m.status='Active' AND m.role!='Client' AND u.active=1 AND u.role IN ('Owner','Advocate') AND (u.role='Owner' OR EXISTS(SELECT 1 FROM app_access a WHERE a.userId=u.id AND a.appId='tournament-lite'))").all(organisationId);
  if([...before].some(e=>owners.get(e.id)===organisationId&&!eligible.some(u=>u.id===e.owner)))throw Error('Existing owner has no legacy Tournament authority');
  if(licence.staffLimit!==null&&eligible.length>licence.staffLimit)throw Error('Restored assignments would exceed the existing seat limit');
  add('INSERT INTO platform_app_licences(organisationId,appId,status,startsAt,endsAt,readOnlyUntil,staffLimit,clientLimit,version) VALUES(?,?,?,?,?,?,?,?,1)',organisationId,'tournament-lite',licence.status,licence.startsAt,licence.endsAt,licence.readOnlyUntil,licence.staffLimit,0);
  for(const user of eligible){add('INSERT INTO platform_app_assignments(organisationId,userId,appId,role,status) VALUES(?,?,?,?,?)',organisationId,user.id,'tournament-lite',user.role,'Active');assignments++;}
  const org=db.prepare('SELECT masterAdminUserId FROM platform_organisations WHERE id=?').get(organisationId);
  add('INSERT INTO platform_organisation_audit(organisationId,actorUserId,action,at,details) VALUES(?,?,?,?,?)',organisationId,org.masterAdminUserId,'TournamentOrganisationsEnabled',now,JSON.stringify({reason:'Restore existing Tournament access after organisation cutover',appId:'tournament-lite',records:before.filter(e=>owners.get(e.id)===organisationId).length}));
 }
 for(const [eventId,organisationId]of owners)add('INSERT INTO tournament_lite_ownership(eventId,organisationId) VALUES(?,?)',eventId,organisationId);
 const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
 const token=require('node:crypto').randomUUID();
 const sql=[`INSERT INTO edge_write_guard(id,valid) SELECT '${token}',revision=${revision} FROM edge_revision WHERE id=1;`,...writes.map(w=>{let i=0;return w.sql.replaceAll('?',()=>literal(w.values[i++]))+';';}),'UPDATE edge_revision SET revision=revision+1 WHERE id=1;',`DELETE FROM edge_write_guard WHERE id='${token}';`].join('\n');
 db.exec('BEGIN');try{if(!db.prepare("SELECT name FROM sqlite_master WHERE name='tournament_lite_ownership'").get())db.exec(schema);db.exec(sql);if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Foreign key verification failed');if(JSON.stringify(db.prepare('SELECT id,owner,revision,public_token,data FROM tournament_lite_events ORDER BY id').all())!==JSON.stringify(before))throw Error('Tournament data changed');db.exec('ROLLBACK');}catch(error){db.exec('ROLLBACK');throw error;}
 return {sql,summary:{events:before.length,organisations:orgs.size,assignments,expectedRevision:revision,preservedEventBytes:true}};
}
if(require.main===module){const [source,target]=process.argv.slice(2);if(!source||!target||fs.existsSync(target))throw Error('Provide an export path and a new output directory');const db=new DatabaseSync(':memory:');try{db.exec('PRAGMA foreign_keys=OFF');db.exec(fs.readFileSync(source,'utf8'));db.exec('PRAGMA foreign_keys=ON');if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source foreign keys failed');const result=prepareTournamentCutover(db);fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'enable.sql'),result.sql);fs.writeFileSync(path.join(target,'summary.json'),JSON.stringify(result.summary,null,2));console.log(JSON.stringify(result.summary));}finally{db.close();}}
module.exports={prepareTournamentCutover};
