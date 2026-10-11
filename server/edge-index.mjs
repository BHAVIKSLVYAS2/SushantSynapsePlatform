import {D1Repository,Conflict} from '../packages/database/d1.mjs';
import {PrivateFiles} from '../packages/storage/r2.mjs';
import {session,auth} from '../packages/auth/edge.mjs';
import {accessSession,accessAuth} from '../packages/auth/access.mjs';
import {FreeD1Repository} from '../packages/database/d1-free.mjs';
import {D1PrivateFiles} from '../packages/storage/d1.mjs';
import {portal} from '../apps/portal/backend/edge.mjs';
import {chambers} from '../apps/advocate/backend/edge.mjs';
import {batchfee} from '../apps/batchfee-lite/backend/edge.mjs';
import {tournament} from '../apps/tournament-lite/backend/edge.mjs';
import {ritual} from '../apps/ritual-assist/backend/edge.mjs';
import {news} from '../apps/news/backend/edge.mjs';
import {privateFunds} from '../apps/fund-overlap/backend/edge-private.mjs';
import {samaj} from '../apps/digital-samaj/backend/edge.mjs';
import {arena} from '../apps/satire-arena/backend/edge.mjs';
import {fail,json} from './edge-http.mjs';
export async function edgeApi(request,env){
 let repo;
 try{
  const url=new URL(request.url),configured=env.PUBLIC_ORIGIN;if(!configured)fail(503,'PUBLIC_ORIGIN is not configured');if(url.origin!==configured)fail(403,'Host rejected');
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==configured)fail(403,'Origin rejected');if(request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'Cross-site request rejected');
  if(env.MAINTENANCE_MODE==='true')fail(503,'The workspace is undergoing maintenance. Please try again shortly.');
  const free=env.FREE_MODE==='true';
  if(!env.PLATFORM_DB||(!free&&!env.PRIVATE_FILES))fail(503,'Cloudflare backend storage is not configured');
  repo=await new (free?FreeD1Repository:D1Repository)(env.PLATFORM_DB).begin();
  if(url.pathname==='/healthz'&&request.method==='GET'){await repo.first('SELECT id FROM users LIMIT 1');return json({status:'ok',storage:free?'d1-free':'d1-r2',documents:true});}
  if(!url.pathname.startsWith('/api/'))fail(404,'Not found');const route=url.pathname.slice(5);
  if(free&&(/^(digital-samaj|batchfee-lite|tournament-lite|news|fund-overlap)(\/|$)/.test(route)||route==='ritual-assist/calendar'||/^(backup|backup.sql|restore)(\/|$)/.test(route)))fail(503,'This feature is unavailable in the free cloud workspace.');
  const useAccess=env.AUTH_METHOD==='access';
  const user=useAccess?await accessSession(request,repo,env):await session(request,repo),files=free?new D1PrivateFiles(repo):new PrivateFiles(env.PRIVATE_FILES,repo),context={request,route,user,repo,files,env};let result;
  if(route==='satire-arena'||route.startsWith('satire-arena/'))result=await arena(request,{...env,ARENA_DB:env.PLATFORM_DB});
  else if(route.startsWith('auth/')||route==='users'||route.startsWith('users/'))result=await (useAccess?accessAuth:auth)(context);
  else if(route==='platform'||route.startsWith('platform/')||route==='support')result=await portal(context);
  else if(route==='ritual-assist/calendar')result=await ritual(context);
  else if(route==='batchfee-lite'||route.startsWith('batchfee-lite/'))result=await batchfee(context);
  else if(route==='tournament-lite'||route.startsWith('tournament-lite/'))result=await tournament(context);
  else if(route==='news'||route.startsWith('news/'))result=await news(context);
  else if(route==='digital-samaj'||route.startsWith('digital-samaj/'))result=await samaj(context);
  else if(route==='fund-overlap'||route.startsWith('fund-overlap/'))result=await privateFunds(context);
  else if(route==='ledger'){if(!user)fail(401,'Please sign in');if(request.method!=='GET')fail(405,'Method not allowed');const asset=await env.ASSETS.fetch(new Request(new URL('/_edge/functionality-ledger.md',url)));if(!asset.ok)fail(503,'Ledger unavailable');result=json({markdown:await asset.text()});}
  else result=await chambers(context);
  if(request.method==='GET'&&!await repo.unchanged())throw new Conflict();return result;
 }catch(e){
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
