import engine from './engine.js';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';
const output=r=>({id:r.id,revision:r.revision,publicToken:r.public_token,...engine.view(JSON.parse(r.data))});
export async function tournamentScope(repo,user,organisationId,action='read'){
 const organisation=await repo.first('SELECT * FROM platform_organisations WHERE id=?',organisationId);
 const membership=await repo.first('SELECT * FROM platform_memberships WHERE organisationId=? AND userId=?',organisationId,user.id);
 const assignment=await repo.first("SELECT * FROM platform_app_assignments WHERE organisationId=? AND userId=? AND appId='tournament-lite'",organisationId,user.id);
 const licence=await repo.first("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='tournament-lite'",organisationId);
 const staff=membership?.role!=='Client'&&['Owner','Advocate'].includes(assignment?.role);
 const access=evaluateAppAccess({user,organisation,membership,assignment,licence,app:{id:'tournament-lite',status:'Available'},permissions:staff?['tournament-lite:read','tournament-lite:write']:[],action,now:Date.now()});
 if(!access.allowed)fail(403,'Tournament access is unavailable for this organisation');
 return {organisation,assignment,access};
}
export async function organisationTournament({repo,user,route,request}){
 const parts=route.split('/');
 if(parts[1]==='public'&&parts.length===3&&request.method==='GET'){
  const row=await repo.first('SELECT e.*,o.organisationId FROM tournament_lite_events e JOIN tournament_lite_ownership o ON o.eventId=e.id WHERE e.public_token=?',parts[2]);
  if(!row||!JSON.parse(row.data).published)fail(404,'Tournament is not shared');
  // A public share remains an explicit publication, and stops with its organisation/licence.
  const org=await repo.first('SELECT status FROM platform_organisations WHERE id=?',row.organisationId);
  const licence=await repo.first("SELECT * FROM platform_app_licences WHERE organisationId=? AND appId='tournament-lite'",row.organisationId);
  const now=Date.now(),end=licence?.endsAt===null?Infinity:Date.parse(licence?.endsAt);
  if(org?.status!=='Active'||!['Active','Trial'].includes(licence?.status)||!(Date.parse(licence.startsAt)<=now&&now<end))fail(404,'Tournament is not shared');
  const data=output(row);delete data.contact;delete data.publicToken;delete data.revision;
  data.participants=data.participants.map(({members,...participant})=>participant);return json(data);
 }
 if(!user)fail(401,'Please sign in');
 if(route==='tournament-lite'&&request.method==='GET'){
  const organisations=[];
  for(const org of await repo.all("SELECT o.id,o.name FROM platform_organisations o JOIN platform_app_assignments a ON a.organisationId=o.id WHERE a.userId=? AND a.appId='tournament-lite' ORDER BY o.name,o.id",user.id))try{const granted=await tournamentScope(repo,user,org.id);organisations.push({...org,role:granted.assignment.role,mode:granted.access.mode});}catch(error){if(error.status!==403)throw error;}
  return json({organisationScoped:true,organisations});
 }
 const match=/^tournament-lite\/organisations\/([a-zA-Z0-9-]{1,200})(?:\/([a-zA-Z0-9-]{1,200}))?$/.exec(route);if(!match)fail(409,'Choose an organisation workspace');
 const [,organisationId,eventId]=match,method=request.method;
 if(!['GET','POST'].includes(method))fail(405,'Method not allowed');
 const granted=await tournamentScope(repo,user,organisationId,method==='GET'?'read':'write');
 if(method==='GET'){
  if(eventId)fail(404,'Not found');
  return json({organisation:{id:organisationId,name:granted.organisation.name},readOnly:granted.access.mode==='read-only',tournaments:(await repo.all('SELECT e.* FROM tournament_lite_events e JOIN tournament_lite_ownership o ON o.eventId=e.id WHERE o.organisationId=?',organisationId)).map(output)});
 }
 const input=await body(request,600000);if('organisationId' in input||'actorUserId' in input||'owner' in input)fail(400,'Scope comes from the session and route');
 if(!eventId){
  const row={id:crypto.randomUUID(),revision:1,public_token:crypto.randomUUID(),data:JSON.stringify(engine.create(input))};
  await repo.commit([repo.statement('INSERT INTO tournament_lite_events VALUES(?,?,?,?,?)',row.id,user.id,1,row.public_token,row.data),repo.statement('INSERT INTO tournament_lite_ownership(eventId,organisationId) VALUES(?,?)',row.id,organisationId)]);return json(output(row));
 }
 const row=await repo.first('SELECT e.* FROM tournament_lite_events e JOIN tournament_lite_ownership o ON o.eventId=e.id WHERE e.id=? AND o.organisationId=?',eventId,organisationId);if(!row)fail(404,'Tournament not found');
 if(input.revision!==row.revision)fail(409,'Tournament changed. Refresh before saving again.');
 row.data=JSON.stringify(engine.apply(JSON.parse(row.data),input.type,input.input||{}));row.revision++;
 await repo.commit([repo.statement('UPDATE tournament_lite_events SET revision=?,data=? WHERE id=?',row.revision,row.data,row.id)]);return json(output(row));
}
