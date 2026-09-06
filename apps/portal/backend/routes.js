const {apps}=require('../../../packages/app-registry');
const {fail,readBody}=require('../../../server/http');
function createPortal({store,auth}){
const {owner,hasAppAccess,validAppIds}=auth;
return async function handle({route,method,req,json,user}){
    if(route==='platform'&&method==='GET'){
      const preferences=store.preferences(user.id),available=apps.filter(a=>a.status==='Available'&&hasAppAccess(user,a.id));
      return json(200,{name:'Sushant Synapse Platform',domain:'apps.sushantsynapse.com',user:store.user(user.id),apps:apps.map(a=>({...a,accessible:a.status==='Available'&&hasAppAccess(user,a.id)})),preferences:{favorites:preferences.favorites.filter(id=>available.some(a=>a.id===id)),recent:preferences.recent.filter(r=>available.some(a=>a.id===r.id))},team:user.role==='Owner'?store.users().map(u=>({...u,appIds:store.access(u.id)})):undefined});
    }
    if(route==='platform/preferences'&&method==='PATCH'){
      const input=await readBody(req),favorites=validAppIds(input.favorites);
      if(favorites.some(id=>!hasAppAccess(user,id)))fail(403,'You do not have access to that app');
      const preferences={...store.preferences(user.id),favorites};store.setPreferences(user.id,preferences);return json(200,preferences);
    }
    if(/^platform\/apps\/[^/]+\/launch$/.test(route)&&method==='POST'){
      const app=apps.find(a=>a.id===route.split('/')[2]);if(!app||app.status!=='Available')fail(404,'This app is not available yet');
      if(!hasAppAccess(user,app.id))fail(403,'Ask the platform owner for app access');
      const prefs=store.preferences(user.id);prefs.recent=[{id:app.id,at:new Date().toISOString()},...prefs.recent.filter(r=>r.id!==app.id)].slice(0,12);store.setPreferences(user.id,prefs);return json(200,{path:app.path});
    }
    if(/^platform\/access\/[^/]+$/.test(route)&&method==='PATCH'){
      owner(user);const target=store.user(route.split('/')[2]);if(!target)fail(404,'User not found');if(target.role==='Owner')fail(400,'Owners always have access to available apps');
      const input=await readBody(req),ids=validAppIds(input.appIds);store.transaction(()=>{store.setAccess(target.id,ids);store.audit(user.name,'Updated app access','users',target);});return json(200,{appIds:ids});
    }

fail(404,'Not found');
};
}
module.exports={createPortal};
