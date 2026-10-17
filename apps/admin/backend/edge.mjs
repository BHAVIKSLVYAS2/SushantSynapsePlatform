import {createOrganisationAdmin} from './routes-d1.mjs';
import {OrganisationD1SQL} from '../../../packages/database/organisation-d1-sql.mjs';
import {json,fail} from '../../../server/edge-http.mjs';
export async function organisationAdmin({request,repo,user,route,env}){
 if(request.method==='POST'){
  const limiter=env.ORG_ADMIN_LIMITER||env.AUTH_LIMITER;
  if(!limiter)fail(503,'Administration protection is unavailable');
  const result=await limiter.limit({key:'organisation:'+request.headers.get('CF-Connecting-IP')});if(!result.success)fail(429,'Too many administration requests. Try again shortly.');
 }
 const db=new OrganisationD1SQL(repo),handle=await createOrganisationAdmin({db});
 const response=await handle({route,method:request.method,req:request,user,json:(status,data)=>json(data,status)});
 if(response.ok)await db.finish();return response;
}
