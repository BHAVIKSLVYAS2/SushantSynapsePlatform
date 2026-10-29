import {body,fail,json} from '../../../server/edge-http.mjs';
import {empty,mutate,view,roles} from './engine.mjs';
import {loadOrganisationScope} from '../../../packages/auth/organisation-scope.mjs';
import {evaluateAppAccess} from '../../../packages/auth/organisation-policy.mjs';
export async function bookingOrganisations(repo,user){
 if(!user)return [];
 const rows=await repo.all("SELECT o.id,o.name,o.status orgStatus,m.role memberRole,m.status memberStatus,a.role appRole,a.status assignmentStatus,l.status licenceStatus,l.startsAt,l.endsAt,l.readOnlyUntil FROM platform_organisations o JOIN platform_memberships m ON m.organisationId=o.id AND m.userId=? JOIN platform_app_assignments a ON a.organisationId=o.id AND a.userId=m.userId AND a.appId='pandit-booking' JOIN platform_app_licences l ON l.organisationId=o.id AND l.appId=a.appId ORDER BY o.name,o.id LIMIT 50",user.id);
 return rows.filter(r=>roles.includes(r.appRole)&&(r.appRole==='Customer'?r.memberRole==='Client':r.memberRole!=='Client')&&evaluateAppAccess({user,organisation:{id:r.id,status:r.orgStatus},membership:{organisationId:r.id,userId:user.id,role:r.memberRole,status:r.memberStatus},assignment:{organisationId:r.id,userId:user.id,appId:'pandit-booking',status:r.assignmentStatus},licence:{organisationId:r.id,appId:'pandit-booking',status:r.licenceStatus,startsAt:r.startsAt,endsAt:r.endsAt,readOnlyUntil:r.readOnlyUntil},app:{id:'pandit-booking',status:'Available'},permissions:['pandit-booking:read'],action:'read',now:Date.now()}).allowed).map(r=>({id:r.id,name:r.name,role:r.appRole}));
}
export async function scope(repo,user,org,action='read'){
 if(!user)fail(401,'Please sign in through My account');
 const rows=await loadOrganisationScope(repo,user.id,org,'pandit-booking'),role=rows.assignment?.role;
 const valid=roles.includes(role)&&(role==='Customer'?rows.membership?.role==='Client':rows.membership?.role!=='Client');
 const access=evaluateAppAccess({user,...rows,app:{id:'pandit-booking',status:'Available'},permissions:valid?['pandit-booking:read','pandit-booking:write']:[],action,now:Date.now()});
 if(!access.allowed)fail(403,'Pandit Booking access is unavailable for this organisation');return {actor:{id:user.id,name:user.name,role},organisation:rows.organisation,readOnly:access.mode==='read-only'};
}
export async function bookingApi(request,{user,organisations,grant,read,write,eligible,limit,publicEnabled,publicOperators=async()=>[],publicLimit=async()=>({success:true})}){
 const url=new URL(request.url),path=url.pathname.slice('/api/pandit-booking'.length),method=request.method;
 if(!['GET','POST'].includes(method))fail(405,'Method not allowed');
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'Origin rejected');
 if(method==='POST'&&request.headers.get('Origin')!==url.origin)fail(403,'Origin required');
 if(url.search)fail(400,'Unexpected query parameters');
 if(method==='GET'&&(!user||path.startsWith('/public/'))&&!(await publicLimit()).success)fail(429,'Too many searches; please try again shortly');
 if(path===''&&method==='GET')return json({organisations:user?await organisations():[],publicOperators:await publicOperators(),signedIn:!!user,pilot:true});
 const match=/^\/(public\/)?([a-zA-Z0-9-]{1,200})$/.exec(path);if(!match)fail(404,'Not found');
 const [,pub,org]=match;
 if(pub){if(method!=='GET')fail(405,'Method not allowed');if(!await publicEnabled(org))fail(404,'No published operator');const state=await read(org)||empty(),ids=await eligible(org);state.profiles=state.profiles.filter(p=>ids.get(p.id)==='Pandit');return json(view(state,null,true));}
 const access=await grant(org,method==='GET'?'read':'write');
 const state=await read(org)||empty();
 if(method==='GET'){const current=await eligible(org);state.profiles=state.profiles.filter(p=>p.id===access.actor.id||['Owner','Reviewer'].includes(access.actor.role)||current.get(p.id)==='Pandit');return json({...view(state,access.actor),organisation:{id:org,name:access.organisation.name},readOnly:access.readOnly,pilot:true});}
 if(!(await limit(user.id)).success)fail(429,'Too many requests; please try again shortly');
 const input=await body(request,24000);if(Object.keys(input).some(k=>!['version','action','input'].includes(k))||!Number.isSafeInteger(input.version)||typeof input.action!=='string')fail(400,'Invalid command');
 if(input.version!==state.version)fail(409,'Booking workspace changed. Refresh before saving.');
 const members=await eligible(org),next=mutate(state,access.actor,input.action,input.input,{eligible:(id,role)=>members.get(id)===role});
 if(next!==state)await write(org,next,state.version);
 return json({saved:true,version:next.version});
}
export async function edgeBooking({request,repo,user,env}){
 const organisationMode=env.ORGANISATIONS_ENABLED==='true';
 if(!organisationMode)fail(503,'Pandit Booking requires organisation mode on Workers');
 return bookingApi(request,{user,grant:(org,action)=>scope(repo,user,org,action),
  publicOperators:async()=>{const now=new Date().toISOString();return repo.all("SELECT o.id,o.name FROM platform_organisations o JOIN platform_app_licences l ON l.organisationId=o.id AND l.appId='pandit-booking' JOIN pandit_booking_workspaces w ON w.organisationId=o.id WHERE o.status='Active' AND l.status IN ('Active','Trial') AND l.startsAt<=? AND (l.endsAt IS NULL OR l.endsAt>?) ORDER BY o.name,o.id LIMIT 50",now,now);},
  organisations:()=>bookingOrganisations(repo,user),
  publicEnabled:async org=>{const r=await repo.first("SELECT o.status,l.status licence,l.startsAt,l.endsAt FROM platform_organisations o JOIN platform_app_licences l ON l.organisationId=o.id AND l.appId='pandit-booking' WHERE o.id=?",org),now=Date.now();return r?.status==='Active'&&['Active','Trial'].includes(r.licence)&&Date.parse(r.startsAt)<=now&&(r.endsAt===null||now<Date.parse(r.endsAt));},
  eligible:async org=>new Map((await repo.all("SELECT a.userId,a.role FROM platform_app_assignments a JOIN platform_memberships m ON m.organisationId=a.organisationId AND m.userId=a.userId JOIN users u ON u.id=a.userId WHERE a.organisationId=? AND a.appId='pandit-booking' AND a.status='Active' AND m.status='Active' AND u.active=1 AND ((a.role='Customer' AND m.role='Client') OR (a.role<>'Customer' AND m.role<>'Client'))",org)).map(r=>[r.userId,r.role])),
  read:async org=>{const r=await repo.first('SELECT data FROM pandit_booking_workspaces WHERE organisationId=?',org);return r?JSON.parse(r.data):null;},
  write:async(org,next)=>repo.commit([repo.statement('INSERT INTO pandit_booking_workspaces(organisationId,version,data) VALUES(?,?,?) ON CONFLICT(organisationId) DO UPDATE SET version=excluded.version,data=excluded.data',org,next.version,JSON.stringify(next))]),
  publicLimit:()=>env.ORG_ADMIN_LIMITER?.limit({key:'pandit-public:'+request.headers.get('CF-Connecting-IP')})||env.AUTH_LIMITER?.limit({key:'pandit-public:'+request.headers.get('CF-Connecting-IP')})||{success:false},
  limit:id=>env.ORG_ADMIN_LIMITER?.limit({key:'pandit:'+id})||env.AUTH_LIMITER?.limit({key:'pandit:'+id})||{success:false}});
}
