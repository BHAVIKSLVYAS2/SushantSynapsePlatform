import {visitors,visitorKey} from '../apps/portal/backend/visitors.mjs';
import {confessions,storageKey as confessionsKey} from '../apps/confessions/backend/service.mjs';
import {feedback,storageKey as feedbackKey} from '../apps/feedback/backend/service.mjs';
import {D1Repository,Conflict} from '../packages/database/d1.mjs';
import {PrivateFiles} from '../packages/storage/r2.mjs';
import {session,auth} from '../packages/auth/edge.mjs';
import {accessSession,accessAuth} from '../packages/auth/access.mjs';
import {FreeD1Repository} from '../packages/database/d1-free.mjs';
import {D1PrivateFiles} from '../packages/storage/d1.mjs';
import {portal} from '../apps/portal/backend/edge.mjs';
import {focus} from '../apps/focus/backend/edge.mjs';
import {chambers} from '../apps/advocate/backend/edge.mjs';
import {batchfee} from '../apps/batchfee-lite/backend/edge.mjs';
import {tournament} from '../apps/tournament-lite/backend/edge.mjs';
import {ritual} from '../apps/ritual-assist/backend/edge.mjs';
import {news} from '../apps/news/backend/edge.mjs';
import {privateFunds} from '../apps/fund-overlap/backend/edge-private.mjs';
import {samaj} from '../apps/digital-samaj/backend/edge.mjs';
import {arena} from '../apps/satire-arena/backend/edge.mjs';
import {editorial,editorialKey} from '../apps/satire-arena/backend/editorial.mjs';
import {metrics,metricsKey} from '../apps/satire-arena/backend/metrics.mjs';
import {fail,json} from './edge-http.mjs';
import {organisationAdmin} from '../apps/admin/backend/edge.mjs';
import {organisationTournament} from '../apps/tournament-lite/backend/organisation-edge.mjs';
import {organisationBatchfee} from '../apps/batchfee-lite/backend/organisation-edge.mjs';
import {organisationSamaj} from '../apps/digital-samaj/backend/organisation-edge.mjs';
import {organisationChambers} from '../apps/advocate/backend/organisation-edge.mjs';
import {edgeBooking,bookingOrganisations} from '../apps/pandit-booking/backend/service.mjs';
export async function edgeApi(request,env){
 let repo;
 try{
  const url=new URL(request.url),configured=env.PUBLIC_ORIGIN;if(!configured)fail(503,'PUBLIC_ORIGIN is not configured');if(url.origin!==configured)fail(403,'Host rejected');
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==configured)fail(403,'Origin rejected');if(request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'Cross-site request rejected');
  if(env.MAINTENANCE_MODE==='true')fail(503,'The workspace is undergoing maintenance. Please try again shortly.');
  const free=env.FREE_MODE==='true';
  if(!env.PLATFORM_DB||(!free&&!env.PRIVATE_FILES))fail(503,'Cloudflare backend storage is not configured');
  // Public editorial snapshots need one atomic setting read, not a workspace revision.
  if(['/api/arena-editorial/public','/api/arena-editorial/today'].includes(url.pathname)){
   const publicRepo=new (free?FreeD1Repository:D1Repository)(env.PLATFORM_DB);
   return editorial(request,{read:()=>publicRepo.setting(editorialKey)});
  }
  // Arena owns its cookie identity, atomic ballots and public score queries.
  if(url.pathname==='/api/satire-arena'||url.pathname.startsWith('/api/satire-arena/'))return arena(request,{...env,ARENA_DB:env.PLATFORM_DB});
  repo=await new (free?FreeD1Repository:D1Repository)(env.PLATFORM_DB,env.FULL_APPS==='true'?49:45).begin();
  if(url.pathname==='/healthz'&&request.method==='GET'){await repo.first('SELECT id FROM users LIMIT 1');return json({status:'ok',storage:free?'d1-free':'d1-r2',documents:true});}
  if(!url.pathname.startsWith('/api/'))fail(404,'Not found');const route=url.pathname.slice(5);
  if(free&&((env.FULL_APPS!=='true'&&(/^(digital-samaj|batchfee-lite|tournament-lite|news|fund-overlap)(\/|$)/.test(route)||route==='ritual-assist/calendar'||route==='ritual-assist/observances'))||/^(backup|backup.sql|restore)(\/|$)/.test(route)))fail(503,'This feature is unavailable in the free cloud workspace.');
  const useAccess=env.AUTH_METHOD==='access';
  const user=useAccess?await accessSession(request,repo,env):await session(request,repo),files=free?new D1PrivateFiles(repo):new PrivateFiles(env.PRIVATE_FILES,repo),context={request,route,user,repo,files,env};let result;
  if(env.ORGANISATIONS_ENABLED==='true'){
   if(useAccess)fail(503,'Organisation accounts require password authentication');
   if(route==='organisation-admin'||route.startsWith('organisation-admin/'))result=await organisationAdmin(context);
   else if(route==='pandit-booking'||route.startsWith('pandit-booking/'))result=await edgeBooking(context);
   else if(route==='tournament-lite'||route.startsWith('tournament-lite/'))result=await organisationTournament(context);
   else if(route==='batchfee-lite'||route.startsWith('batchfee-lite/'))result=await organisationBatchfee(context);
   else if(route==='digital-samaj'||route.startsWith('digital-samaj/'))result=await organisationSamaj(context);
   else if(route==='chambers'||route.startsWith('chambers/')||route.startsWith('client-portal/'))result=await organisationChambers(context);
   else if(['auth/status','auth/login','auth/logout','auth/profile','auth/password'].includes(route))result=await auth(context);
   else if(route==='platform'||route==='platform/preferences'||/^platform\/apps\/[^/]+\/launch$/.test(route)){
    if(!user)fail(401,'Please sign in');
    // Keep shared preferences while deriving private app access from live org policy.
    const response=await organisationChambers({...context,route:'chambers',request:new Request(request.url,{headers:request.headers})});
    const {organisations}=await response.json();
    const tournamentResponse=await organisationTournament({...context,route:'tournament-lite',request:new Request(request.url,{headers:request.headers})});
    const tournamentAccess=await tournamentResponse.json();
    const batchfeeResponse=await organisationBatchfee({...context,route:'batchfee-lite',request:new Request(request.url,{headers:request.headers})});
    const batchfeeAccess=await batchfeeResponse.json();
    const samajResponse=await organisationSamaj({...context,route:'digital-samaj',request:new Request(request.url,{headers:request.headers})});
    const samajAccess=await samajResponse.json();
    const bookingAccess=await bookingOrganisations(repo,user);
    result=await portal({...context,user:{...user,role:'Clerk',appIds:[...(organisations.length?['advocate']:[]),...(tournamentAccess.organisations.length?['tournament-lite']:[]),...(batchfeeAccess.organisations.length?['batchfee-lite']:[]),...(samajAccess.communities.length||samajAccess.canSetup?['digital-samaj']:[]),...(bookingAccess.length?['pandit-booking']:[])]}});
    if(route==='platform'&&result.ok){const data=await result.json();data.apps=data.apps.map(app=>!app.public&&!['advocate','tournament-lite','batchfee-lite','digital-samaj','pandit-booking'].includes(app.id)?{...app,status:'Unavailable',accessible:false,description:'Organisation integration is not available for this app yet.'}:app);result=json(data);}
   }else if(!(/^(platform\/visitors|feedback|confessions|arena-metrics|arena-editorial|satire-arena|news)(\/|$)/.test(route)||route==='support'||route==='ritual-assist/calendar'||route==='ritual-assist/observances'))fail(409,'Use organisation-scoped APIs. Other private applications are unavailable.');
   if(result){if(request.method==='GET'&&!await repo.unchanged())throw new Conflict();return result;}
  }
  if(route==='pandit-booking'||route.startsWith('pandit-booking/'))result=await edgeBooking(context);
  else if(route==='feedback'||route.startsWith('feedback/')){
   const canModerate=!!user&&(env.ORGANISATIONS_ENABLED==='true'?(await repo.first('SELECT active FROM platform_super_admins WHERE userId=?',user.id))?.active===1:user.role==='Owner');
   result=await feedback(request,{canModerate,read:()=>repo.setting(feedbackKey),write:next=>repo.commit([repo.settingWrite(feedbackKey,next)]),limit:()=>env.CONFESSIONS_LIMITER?.limit({key:'feedback:'+request.headers.get('CF-Connecting-IP')})||{success:false}});
  }else if(route==='platform/visitors'){
 if(!['GET','POST'].includes(request.method))fail(405,'Method not allowed');
 if(request.method==='POST'&&!(await env.CONFESSIONS_LIMITER?.limit({key:'platform-visitors:'+request.headers.get('CF-Connecting-IP')}))?.success)fail(429,'Please try again later.');
 result=await visitors(request,{readVisitors:()=>repo.setting(visitorKey),writeVisitors:next=>repo.commit([repo.settingWrite(visitorKey,next)])});
 }else if(route==='confessions'||route.startsWith('confessions/'))result=await confessions(request,{user,read:()=>repo.setting(confessionsKey),write:next=>repo.commit([repo.settingWrite(confessionsKey,next)]),limit:()=>env.CONFESSIONS_LIMITER?.limit({key:'confessions:'+request.headers.get('CF-Connecting-IP')})||{success:false}});
  else if(route==='arena-metrics'||route.startsWith('arena-metrics/'))result=await metrics(request,{enabled:env.ARENA_ANALYTICS_ENABLED==='true',user,read:()=>repo.setting(metricsKey),write:next=>repo.commit([repo.settingWrite(metricsKey,next)]),limit:()=>env.ARENA_LIMITER?.limit({key:'metrics:'+request.headers.get('CF-Connecting-IP')})||{success:false}});
  else if(route==='arena-editorial'||route.startsWith('arena-editorial/'))result=await editorial(request,{user,read:()=>repo.setting(editorialKey),write:next=>repo.commit([repo.settingWrite(editorialKey,next),repo.audit(user.name,'Updated satire editorial library','satire-arena',{version:next.version})])});
  else if(route==='satire-arena'||route.startsWith('satire-arena/'))result=await arena(request,{...env,ARENA_DB:env.PLATFORM_DB});
  else if(route.startsWith('auth/')||route==='users'||route.startsWith('users/'))result=await (useAccess?accessAuth:auth)(context);
  else if(route==='platform'||route.startsWith('platform/')||route==='support')result=await portal(context);
  else if(route==='focus'||route.startsWith('focus/'))result=await focus(context);
  else if(route==='ritual-assist/calendar'||route==='ritual-assist/observances')result=await ritual(context);
  else if(route==='batchfee-lite'||route.startsWith('batchfee-lite/'))result=await batchfee(context);
  else if(route==='tournament-lite'||route.startsWith('tournament-lite/'))result=await tournament(context);
  else if(route==='news'||route.startsWith('news/'))result=await news(context);
  else if(route==='digital-samaj'||route.startsWith('digital-samaj/'))result=await samaj(context);
  else if(route==='fund-overlap'||route.startsWith('fund-overlap/'))result=await privateFunds(context);
  else if(route==='ledger'){if(!user)fail(401,'Please sign in');if(request.method!=='GET')fail(405,'Method not allowed');const asset=await env.ASSETS.fetch(new Request(new URL('/_edge/functionality-ledger.md',url)));if(!asset.ok)fail(503,'Ledger unavailable');result=json({markdown:await asset.text()});}
  else result=await chambers(context);
  if(request.method==='GET'&&!await repo.unchanged())throw new Conflict();return result;
 }catch(e){
  if(e.name==='OrganisationError'||e.constructor?.name==='OrganisationError')return json({error:e.message,code:e.code},{forbidden:403,conflict:409,'invalid-state':409,'seat-limit-reached':409}[e.code]||400);
  if(e instanceof Conflict)return json({error:e.message},409);
  if(e.status)return json({error:e.message},e.status);
  if(String(e.message).includes('free_document_capacity'))return json({error:'The 100 MB document storage limit has been reached. No changes were saved.'},409);
  if(String(e.message).includes('free_workspace_capacity'))return json({error:'The free workspace capacity limit has been reached. No changes were saved.'},409);
  if(String(e.message).includes('UNIQUE constraint'))return json({error:'This record already exists'},409);
  // Validation engines throw ordinary errors; unexpected infrastructure failures
  // are kept out of the public response, never reported as a successful save.
  if(/D1_|R2|binding|migrations|SQLITE|staged|permission query/i.test(String(e.message)))return json({error:'Cloudflare backend unavailable. Check storage configuration and migrations.'},503);
  return json({error:e.message||'Invalid request'},400);
 }
}
