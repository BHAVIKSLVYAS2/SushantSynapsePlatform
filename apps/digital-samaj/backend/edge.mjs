import routes from './edge-routes.cjs';
import {StagedSQL} from '../../../packages/database/d1-staged.mjs';
import {body,fail,access} from '../../../server/edge-http.mjs';
export async function samaj({repo,request,route,user,files,env,organisationUserIds}){
 if(!user)fail(401,'Please sign in');if(!access(user,'digital-samaj'))fail(403,'DIGITAL SAMAJ access required');
 if(request.method!=='GET'){if(!env.SAMAJ_LIMITER)fail(503,'Write protection is unavailable');if(!(await env.SAMAJ_LIMITER.limit({key:user.id})).success)fail(429,'Too many writes. Please wait a minute.');}
 const allowed=id=>!organisationUserIds||organisationUserIds.has(id);
 const sql=new StagedSQL(repo,files),store={sql,transaction:async fn=>fn(),user:async id=>{if(!allowed(id))return null;const u=await repo.user(id);return u?{...u,appIds:organisationUserIds?['digital-samaj']:await repo.access(id)}:null;},users:async()=>{const users=(await repo.users()).filter(u=>allowed(u.id));for(const u of users)u.appIds=organisationUserIds?['digital-samaj']:await repo.access(u.id);return users;}},auth={owner(u){if(organisationUserIds||u?.role!=='Owner')fail(403,'Owner access required');},hasAppAccess:(u,appId)=>allowed(u?.id)&&access(u,appId)};
 const b=['POST','PATCH','DELETE'].includes(request.method)?await body(request,8000000):null;
 // Existing app handlers keep their response contract through this bounded adapter.
 const req={method:request.method,url:request.url,headers:{'content-type':'application/json'},async *[Symbol.asyncIterator](){if(b)yield Buffer.from(JSON.stringify(b));}};
 let status=200,payload;const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}),res={setHeader(k,v){headers.set(k,String(v));},writeHead(code,h={}){status=code;for(const [k,v]of Object.entries(h))headers.set(k,String(v));},end(value){payload=value;}};
 const json=(code,data)=>{status=code;headers.set('Content-Type','application/json; charset=utf-8');payload=JSON.stringify(data);};
 const handler=routes.createDigitalSamaj({store,auth});await handler({route,method:request.method,req,res,json,user});await sql.finish();return new Response(payload,{status,headers});
}
