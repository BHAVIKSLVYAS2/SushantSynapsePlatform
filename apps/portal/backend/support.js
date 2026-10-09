const {fail,readBody}=require('../../../server/http');
function createSupport({store,auth}){return async({route,method,req,json,user})=>{
 const {emptySupport,validateSupport}=await import('../frontend/support-engine.mjs');
 const settings=()=>store.setting('platform-support')||{...emptySupport};
 if(route==='support'&&method==='GET'){const value=settings();return json(200,value.isActive?value:{...emptySupport});}
 if(route==='platform/support'){
  if(!user)fail(401,'Please sign in');auth.owner(user);
  if(method==='GET')return json(200,settings());
  if(method==='PUT'){const input=await readBody(req,4096);let value;try{value=validateSupport(input);}catch(e){fail(400,e.message);}store.transaction(()=>{store.setSetting('platform-support',value);store.audit(user.name,'Updated support settings','platform-support',{isActive:value.isActive});});return json(200,value);}
 }
 fail(405,'Method not allowed');
};}
module.exports={createSupport};
