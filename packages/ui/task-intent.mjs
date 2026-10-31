const paths=Object.freeze({advocate:'/advocate','batchfee-lite':'/batchfee-lite','tournament-lite':'/tournament-lite','digital-samaj':'/digital-samaj','pandit-booking':'/pandit-booking'});
export function taskIntent(value){
 const url=value instanceof URL?value:new URL(value,'https://local.invalid'),appId=url.searchParams.get('next');if(!Object.hasOwn(paths,appId))return null;
 let hash='';try{const target=new URL(url.searchParams.get('returnTo')||paths[appId],url.origin);if(target.origin===url.origin&&target.pathname===paths[appId]&&/^#[a-z][a-z-]{0,59}$/.test(target.hash))hash=target.hash;}catch{}
 return {appId,path:paths[appId],hash};
}
export function accountIntentPath(value){const intent=taskIntent(value);if(!intent)return '/account';const query=new URLSearchParams({next:intent.appId});if(intent.hash)query.set('returnTo',intent.path+intent.hash);return '/account?'+query;}
export function taskDestinations(account,intent){
 if(!intent)return [];return (account.memberships||[]).flatMap(org=>{if(org.status!=='Active'||org.membershipStatus!=='Active')return [];const app=org.apps.find(a=>a.id===intent.appId);if(!app)return [];const client=intent.appId==='advocate'&&org.role==='Client';if(!(client?org.clientPortal==='Available':app.available))return [];return [{name:org.name,path:(client?'/client-portal':intent.path)+'?organisation='+encodeURIComponent(org.id)+(client?'':intent.hash)}];});
}
