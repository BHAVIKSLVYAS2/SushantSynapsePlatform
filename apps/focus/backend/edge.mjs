import {body,fail,json} from '../../../server/edge-http.mjs';
import {emptyPlan,updatePlan} from './model.mjs';
export async function focus({route,request,repo,user}){
 if(!user)fail(401,'Please sign in to save your tasks');
 if(route!=='focus')fail(404,'Not found');
 const key='focus:'+user.id,current=await repo.setting(key)||emptyPlan();
 if(request.method==='GET')return json(current);
 if(request.method!=='POST')fail(405,'Method not allowed');
 const plan=updatePlan(current,await body(request,4096));
 await repo.commit([repo.settingWrite(key,plan),repo.audit(user.name,'Updated personal focus tasks','focus',{id:user.id})]);return json(plan);
}
