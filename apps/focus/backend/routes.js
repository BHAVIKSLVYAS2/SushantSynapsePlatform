const {fail,readBody}=require('../../../server/http');
function createFocus({store}){return async({route,method,req,json,user})=>{
 if(!user)fail(401,'Please sign in to save your tasks');if(route!=='focus')fail(404,'Not found');
 const {emptyPlan,updatePlan}=await import('./model.mjs'),key='focus:'+user.id;
 if(method==='GET')return json(200,store.setting(key)||emptyPlan());if(method!=='POST')fail(405,'Method not allowed');
 const input=await readBody(req,4096);let plan;
 store.transaction(()=>{plan=updatePlan(store.setting(key)||emptyPlan(),input);store.setSetting(key,plan);store.audit(user.name,'Updated personal focus tasks','focus',{id:user.id});});return json(200,plan);
};}module.exports={createFocus};
