import registry from '../../../packages/app-registry/index.js';
import {body,fail,json,owner,access} from '../../../server/edge-http.mjs';
import {appIds} from '../../../packages/auth/edge.mjs';
import {emptySupport,validateSupport} from '../frontend/support-engine.mjs';
const {apps,resolveAppId}=registry;
export async function portal({route,request,repo,user,env}){
 const disabled=env?.FREE_MODE==='true'&&env.FULL_APPS!=='true'?['digital-samaj','batchfee-lite','tournament-lite']:[];
 const enabled=app=>app.status==='Available'&&!disabled.includes(app.id);
 const method=request.method;
 if(route==='support'&&method==='GET'){const value=await repo.setting('platform-support');return json(value?.isActive?value:{...emptySupport});}
 if(!user)fail(401,'Please sign in');
 if(route==='platform/support'){owner(user);if(method==='GET')return json(await repo.setting('platform-support')||{...emptySupport});if(method==='PUT'){let value;try{value=validateSupport(await body(request,4096));}catch(e){fail(e.status||400,e.message);}await repo.commit([repo.settingWrite('platform-support',value),repo.audit(user.name,'Updated support settings','platform-support',{})]);return json(value);}fail(405,'Method not allowed');}
 if(route==='platform'&&method==='GET'){
  const prefs=await repo.preferences(user.id),available=apps.filter(a=>enabled(a)&&(a.public||access(user,a.id)));let team;
  if(user.role==='Owner'){team=await repo.users();for(const u of team)u.appIds=await repo.access(u.id);}
  return json({name:'Sushant Synapse Platform',domain:'apps.sushantsynapse.com',user:await repo.user(user.id),apps:apps.map(a=>({...a,...(disabled.includes(a.id)?{status:'Unavailable',description:'Unavailable in the free cloud workspace.'}:{}),accessible:enabled(a)&&(a.public||access(user,a.id))})),preferences:{favorites:[...new Set(prefs.favorites.map(resolveAppId))].filter(id=>available.some(a=>a.id===id)),recent:prefs.recent.map(r=>({...r,id:resolveAppId(r.id)})).filter((r,i,all)=>all.findIndex(v=>v.id===r.id)===i&&available.some(a=>a.id===r.id))},team});
 }
 if(route==='platform/preferences'&&method==='PATCH'){const b=await body(request),favorites=appIds(b.favorites);if(favorites.some(id=>!apps.find(a=>a.id===id)?.public&&!access(user,id)))fail(403,'You do not have access to that app');const prefs={...await repo.preferences(user.id),favorites};await repo.commit([repo.preferenceWrite(user.id,prefs)]);return json(prefs);}
 if(/^platform\/apps\/[^/]+\/launch$/.test(route)&&method==='POST'){const app=apps.find(a=>a.id===resolveAppId(route.split('/')[2]));if(!app||!enabled(app))fail(404,'This app is unavailable');if(!app.public&&!access(user,app.id))fail(403,'Ask the platform owner for app access');const prefs=await repo.preferences(user.id);prefs.recent=[{id:app.id,at:new Date().toISOString()},...prefs.recent.filter(r=>resolveAppId(r.id)!==app.id)].slice(0,12);await repo.commit([repo.preferenceWrite(user.id,prefs)]);return json({path:app.path});}
 if(/^platform\/access\/[^/]+$/.test(route)&&method==='PATCH'){owner(user);const target=await repo.user(route.split('/')[2]);if(!target)fail(404,'User not found');if(target.role==='Owner')fail(400,'Owners always have access to available apps');const ids=appIds((await body(request)).appIds);await repo.commit([...repo.accessWrites(target.id,ids),repo.audit(user.name,'Updated app access','users',target)]);return json({appIds:ids});}
 fail(404,'Not found');
}
