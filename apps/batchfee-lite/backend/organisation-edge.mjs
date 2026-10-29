import engine from './engine.js';
import {loadOrganisationScope} from '../../../packages/auth/organisation-scope.mjs';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';

const {empty,apply,view,today,date}=engine;
const roles=new Set(['Owner','Manager','Collector','Viewer']);
const commands={Viewer:[],Collector:['sync','payment'],Manager:['sync','payment','student','batch','import','charge','template','expense']};

async function scope(repo,user,organisationId,action){
 const {organisation,membership,assignment,licence}=await loadOrganisationScope(repo,user.id,organisationId,'batchfee-lite');
 const role=membership?.role==='Client'?null:assignment?.role;
 const access=evaluateAppAccess({user,organisation,membership,assignment,licence,app:{id:'batchfee-lite',status:'Available'},permissions:roles.has(role)?[`batchfee-lite:${action}`]:[],action,now:Date.now()});
 if(!access.allowed)fail(403,'BatchFee Lite access is unavailable for this organisation');
 return {organisation,role,access};
}

export async function organisationBatchfee({repo,user,route,request}){
 if(!user)fail(401,'Please sign in');
 if(route==='batchfee-lite'&&request.method==='GET'){
  const organisations=[];
  for(const org of await repo.all("SELECT o.id,o.name FROM platform_organisations o JOIN platform_app_assignments a ON a.organisationId=o.id WHERE a.userId=? AND a.appId='batchfee-lite' ORDER BY o.name,o.id",user.id)){
   try{const granted=await scope(repo,user,org.id,'read');organisations.push({...org,role:granted.role,mode:granted.access.mode});}catch(error){if(error.status!==403)throw error;}
  }
  return json({organisationScoped:true,organisations});
 }
 const match=/^batchfee-lite\/organisations\/([a-zA-Z0-9-]{1,200})(?:\/(command|backup|restore))?$/.exec(route);
 if(!match)fail(409,'Choose an organisation workspace');
 const [,organisationId,operation]=match,method=request.method;
 if(!['GET','POST'].includes(method))fail(405,'Method not allowed');
 const action=method==='POST'?'write':'read';
 const {organisation,role,access}=await scope(repo,user,organisationId,action);
 if(operation==='staff')fail(404,'Use organisation administration to manage app roles');
 const read=async()=>{const row=await repo.first('SELECT revision,data FROM batchfee_organisation_workspaces WHERE organisationId=?',organisationId);return {revision:row?.revision||0,state:row?JSON.parse(row.data):empty()};};
 const events=async()=>(await repo.all('SELECT at,actor,action,data FROM batchfee_organisation_events WHERE organisationId=? ORDER BY id',organisationId)).map(e=>({...e,data:JSON.parse(e.data)}));
 const current=await read();
 if(!operation&&method==='GET')return json({revision:current.revision,...view(current.state),accessRole:role,readOnly:access.mode==='read-only',organisation:{id:organisationId,name:organisation.name}});
 if(operation==='backup'&&method==='GET'){
  if(role!=='Owner')fail(403,'Only an Owner can export the full backup');
  return json({format:'batchfee-lite-organisation-1',organisationId,events:await events(),exportedAt:new Date().toISOString()});
 }
 if(method!=='POST'||!['command','restore'].includes(operation))fail(405,'Method not allowed');
 if(operation==='restore'&&role!=='Owner')fail(403,'Only an Owner can restore the full backup');
 const input=await body(request,16*1024*1024);
 if('organisationId' in input||'actorUserId' in input||'owner' in input)fail(400,'Scope comes from the session and route');
 if(role!=='Owner'&&(operation!=='command'||!commands[role]?.includes(input.type)))fail(403,'This action is not allowed for your BatchFee role');
 const history=await events();
 const output=state=>({revision:current.revision,...view(state),accessRole:role,readOnly:false,organisation:{id:organisationId,name:organisation.name}});
 if(operation==='command'&&input.requestId){const prior=history.find(e=>e.data.id===input.requestId);if(prior){if(prior.action!==input.type||JSON.stringify(prior.data.input)!==JSON.stringify(input.input||{}))fail(409,'Request key reused with different data');return json(output(current.state));}}
 if(input.revision!==current.revision)fail(409,'Data changed. Refresh before saving again.');
 const writes=[];let state;
 if(operation==='restore'){
  const backup=input.backup;
  if(backup?.format!=='batchfee-lite-organisation-1'||backup.organisationId!==organisationId||!Array.isArray(backup.events)||backup.events.length>50000)fail(400,'Invalid organisation backup');
  if(history.length>backup.events.length)fail(409,'This backup is older than your records');
  for(let n=0;n<history.length;n++)if(JSON.stringify(history[n])!==JSON.stringify(backup.events[n]))fail(409,'Backup conflicts with existing history');
  state=empty();const ids=new Set();let prev='';
  for(const event of backup.events){
   if(!event||typeof event.at!=='string'||!/^20\d\d-\d\d-\d\dT/.test(event.at)||Number.isNaN(Date.parse(event.at))||typeof event.actor!=='string'||event.actor.length>200||event.action!==event.data?.type||ids.has(event.data.id))fail(400,'Invalid backup event');
   const day=date(event.data.day);if(day<prev||day>today())fail(400,'Invalid backup chronology');prev=day;ids.add(event.data.id);apply(state,event.data,day);
  }
  for(const event of backup.events.slice(history.length))writes.push(repo.statement('INSERT INTO batchfee_organisation_events(organisationId,at,actor,action,data) VALUES(?,?,?,?,?)',organisationId,event.at,event.actor,event.action,JSON.stringify(event.data)));
 }else{
  if(!current.state.profile&&!['profile','sync'].includes(input.type))fail(400,'Set up your academy first');
  const id=input.requestId||crypto.randomUUID();if(!/^[\w-]{8,100}$/.test(id))fail(400,'Invalid request key');
  const command={id,type:input.type,input:input.input||{},day:today()},before=JSON.stringify(current.state);
  state=apply(current.state,command,command.day);
  if(input.type==='sync'&&JSON.stringify(state)===before)return json(output(state));
  writes.push(repo.statement('INSERT INTO batchfee_organisation_events(organisationId,at,actor,action,data) VALUES(?,?,?,?,?)',organisationId,new Date().toISOString(),user.id,command.type,JSON.stringify(command)));
 }
 // New workspaces need a parent row before the first event; the two statements
 // commit under the platform revision guard so no partial financial history lands.
 const workspace=repo.statement('INSERT INTO batchfee_organisation_workspaces(organisationId,revision,data) VALUES(?,?,?) ON CONFLICT(organisationId) DO UPDATE SET revision=excluded.revision,data=excluded.data',organisationId,current.revision+1,JSON.stringify(state));
 await repo.commit([workspace,...writes]);current.revision++;return json(output(state));
}
