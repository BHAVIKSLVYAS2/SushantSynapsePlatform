import {body,fail,json,owner} from '../../server/edge-http.mjs';
import registry from '../app-registry/index.js';
const {apps}=registry;
let cachedKeys;
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export function accessConfig(env){
 const issuer=env.ACCESS_TEAM_DOMAIN;
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer||'')||!env.ACCESS_AUD)fail(503,'Email-code sign-in is awaiting Cloudflare Access setup.');
 return {issuer,audience:env.ACCESS_AUD};
}
// Verify the signature as well as the audience; an email header alone is never identity.
export async function accessSession(request,repo,env){
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||/(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get('Cookie')||'')?.[1];
 if(!token)return null;
 const {issuer,audience}=accessConfig(env);
 try{
  if(token.length>12000)fail(401,'Invalid sign-in token');
  const parts=token.split('.');if(parts.length!==3)fail(401,'Invalid sign-in token');
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1]))),now=Date.now()/1000;
  if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(audience)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+30||(claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>now+30))||claims.type!=='app'||typeof claims.email!=='string'||typeof claims.sub!=='string')fail(401,'Invalid or expired sign-in token');
  if(!cachedKeys||cachedKeys.issuer!==issuer||cachedKeys.expires<Date.now()){
   const response=await fetch(issuer+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});
   if(!response.ok)fail(503,'Email-code sign-in is temporarily unavailable');
   const data=await response.json();if(!Array.isArray(data.keys)||data.keys.length>20)fail(503,'Invalid sign-in key configuration');
   cachedKeys={issuer,expires:Date.now()+300000,keys:data.keys};
  }
  const jwk=cachedKeys.keys.find(k=>k.kid===header.kid&&k.kty==='RSA');if(!jwk)fail(401,'Unknown sign-in key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))fail(401,'Invalid sign-in signature');
  const user=await repo.first('SELECT id,name,email,role,active FROM users WHERE email=? AND active=1',claims.email.toLowerCase());
  if(!user)fail(403,'Your email has no active workspace account. Contact the owner.');
  return {...user,active:true,appIds:await repo.access(user.id)};
 }catch(error){if(error.status)throw error;fail(401,'Invalid sign-in token');}
}
export async function accessAuth({request,route,repo,user,env}){
 if(route==='auth/status'&&request.method==='GET')return json({setupRequired:false,authMethod:'access',loginPath:'/access-login',logoutPath:'/cdn-cgi/access/logout',user:user?await repo.user(user.id):null});
 if(route==='auth/login'||route==='auth/setup'||route==='auth/password')fail(409,'Use email-code sign-in. Passwords and workspace setup are managed outside this free deployment.');
 if(!user)fail(401,'Please sign in using your email code');
 if(route==='auth/logout'&&request.method==='POST')return json({ok:true,redirect:'/cdn-cgi/access/logout'});
 if(route==='auth/profile'&&request.method==='PATCH'){
  const b=await body(request,8192);if(b.email!==user.email)fail(400,'Email changes require updating Cloudflare Access and the workspace account together');
  const name=cleanName(b.name);await repo.commit([repo.statement('UPDATE users SET name=? WHERE id=?',name,user.id),repo.audit(user.name,'Updated profile','users',user)]);return json(await repo.user(user.id));
 }
 if(!/^users(?:\/[^/]+)?$/.test(route))fail(404,'Not found');owner(user);
 const id=route.split('/')[1],b=await body(request,8192),old=id?await repo.user(id):null;
 if(id&&!old)fail(404,'User not found');if(b.password)fail(400,'Passwords are disabled for email-code accounts');
 const name=cleanName(b.name??old?.name),email=b.email??old?.email,role=b.role??old?.role;
 if(typeof email!=='string'||email.length>200||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Enter a valid email');if(!['Owner','Advocate','Clerk'].includes(role))fail(400,'Invalid role');
 if(request.method==='POST'&&!id){
  if((await repo.first('SELECT COUNT(*) n FROM users')).n>=25)fail(409,'The free workspace supports up to 25 accounts');
  const ids=b.appIds??['advocate'];if(!Array.isArray(ids)||ids.some(x=>!apps.some(a=>a.id===x&&a.status==='Available')))fail(400,'Choose available apps');
  const uid=crypto.randomUUID();await repo.commit([repo.statement('INSERT INTO users VALUES(?,?,?,?,?,1)',uid,name,email.trim().toLowerCase(),role,'access-only:'+crypto.randomUUID()),...repo.accessWrites(uid,[...new Set(ids)]),repo.audit(user.name,'Added email-code account','users',{id:uid,name})]);return json(await repo.user(uid),201);
 }
 if(request.method==='PATCH'&&id){
  const active=b.active??old.active;if(typeof active!=='boolean')fail(400,'Invalid active state');if(id===user.id&&(!active||role!=='Owner'||email!==user.email))fail(400,'You cannot deactivate, demote or change your own owner email');
  await repo.commit([repo.statement('UPDATE users SET name=?,email=?,role=?,active=? WHERE id=?',name,email.trim().toLowerCase(),role,active,id),repo.statement('DELETE FROM sessions WHERE userId=?',id),repo.audit(user.name,'Updated email-code account','users',{id,name})]);return json(await repo.user(id));
 }
 fail(405,'Method not allowed');
}
function cleanName(name){if(typeof name!=='string'||!name.trim()||name.length>120)fail(400,'Name is required (maximum 120 characters)');return name.trim();}
