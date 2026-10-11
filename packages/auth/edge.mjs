import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import registry from '../app-registry/index.js';
import {body,fail,json,owner} from '../../server/edge-http.mjs';
const {apps,resolveAppId}=registry,ttl=12*60*60*1000;
const hash=value=>createHash('sha256').update(value).digest('hex');
const cookie=token=>`chambers_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${token?ttl/1000:0}`;
export function appIds(value){if(!Array.isArray(value)||value.length>apps.length||value.some(id=>typeof id!=='string'||!apps.some(a=>a.id===resolveAppId(id)&&a.status==='Available')))fail(400,'Choose available apps');return [...new Set(value.map(resolveAppId))];}
function userInput(b){if(typeof b.name!=='string'||!b.name.trim()||b.name.length>120)fail(400,'Name is required (maximum 120 characters)');if(typeof b.email!=='string'||b.email.length>200||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))fail(400,'Enter a valid email');if(!['Owner','Advocate','Clerk'].includes(b.role))fail(400,'Invalid role');return {name:b.name.trim(),email:b.email.trim().toLowerCase(),role:b.role};}
function passwordHash(password){if(typeof password!=='string'||password.length<12||password.length>128)fail(400,'Use a password between 12 and 128 characters');const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
export function verifyPassword(password,stored){if(typeof password!=='string'||password.length>128)return false;const [salt,key]=String(stored).split(':');if(!/^[a-f0-9]{32}$/.test(salt)||! /^[a-f0-9]{128}$/.test(key))return false;return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(key,'hex'));}
export async function session(request,repo){const token=/(?:^|;\s*)chambers_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('Cookie')||'')?.[1];if(!token)return null;const u=await repo.first('SELECT u.id,u.name,u.email,u.role,u.active,s.token session FROM sessions s JOIN users u ON u.id=s.userId WHERE s.token=? AND s.expires>? AND u.active=1',hash(token),Date.now());return u?{...u,active:true,appIds:await repo.access(u.id)}:null;}
function newSession(repo,id){const token=randomBytes(32).toString('hex');return {cookie:cookie(token),writes:[repo.statement('DELETE FROM sessions WHERE expires<?',Date.now()),repo.statement('INSERT INTO sessions VALUES(?,?,?)',hash(token),id,Date.now()+ttl)]};}
export async function auth(context){
 const {request,repo,user,route,env}=context,method=request.method;
 if(route==='auth/status'&&method==='GET')return json({setupRequired:!(await repo.first('SELECT id FROM users LIMIT 1')),setupProtected:true,authMethod:'password',freeWorkspace:env.FREE_MODE==='true',fullApps:env.FULL_APPS==='true',user:user?await repo.user(user.id):null});
 if(route==='auth/setup'&&method==='POST'){
  const b=await body(request);if(await repo.first('SELECT id FROM users LIMIT 1'))fail(409,'Workspace is already set up');if(!env.SETUP_TOKEN||env.SETUP_TOKEN.length<24||typeof b.setupToken!=='string'||hash(b.setupToken)!==hash(env.SETUP_TOKEN))fail(403,'Setup token required');
  const u=userInput({...b,role:'Owner'}),id=crypto.randomUUID(),password=passwordHash(b.password),s=newSession(repo,id);
  if(b.demo===true)fail(400,'Cloudflare setup does not create demonstration records');
  const {cleanSettings}=await import('../../apps/advocate/backend/settings.js');
  const settings=cleanSettings({name:b.firmName||'My Chambers',advocate:u.name});
  await repo.commit([repo.statement('INSERT INTO users VALUES(?,?,?,?,?,1)',id,u.name,u.email,u.role,password),...repo.accessWrites(id,['advocate']),repo.settingWrite('firm',settings),repo.settingWrite('migrated',true),repo.settingWrite('platform_migrated',true),repo.audit(u.name,'Created workspace','users',{id,name:u.name}),...s.writes]);return json({user:await repo.user(id)},201,{'Set-Cookie':s.cookie});
 }
 if(route==='auth/login'&&method==='POST'){
  if(!env.AUTH_LIMITER)fail(503,'Login protection is unavailable');const limiter=await env.AUTH_LIMITER.limit({key:hash(request.headers.get('CF-Connecting-IP')||'local')});if(!limiter.success)fail(429,'Too many attempts. Try again shortly.');
  const b=await body(request,4096),u=await repo.first('SELECT * FROM users WHERE email=?',typeof b.email==='string'?b.email.trim().toLowerCase():'');
  const valid=verifyPassword(b.password,u?.password||'0'.repeat(32)+':'+ '00'.repeat(64));if(!u?.active||!valid)fail(401,'Email or password is incorrect');
  const s=newSession(repo,u.id);await repo.commit([...s.writes,repo.audit(u.name,'Signed in','users',u)]);return json({user:await repo.user(u.id)},200,{'Set-Cookie':s.cookie});
 }
 if(!user)fail(401,'Please sign in');
 if(route==='auth/logout'&&method==='POST'){await repo.commit([repo.statement('DELETE FROM sessions WHERE token=?',user.session)]);return json({ok:true},200,{'Set-Cookie':cookie('')});}
 if(route==='auth/profile'&&method==='PATCH'){const b=await body(request),u=userInput({...b,role:user.role});await repo.commit([repo.statement('UPDATE users SET name=?,email=? WHERE id=?',u.name,u.email,user.id),repo.audit(user.name,'Updated profile','users',user)]);return json(await repo.user(user.id));}
 if(route==='auth/password'&&method==='POST'){const b=await body(request),u=await repo.first('SELECT password FROM users WHERE id=?',user.id);if(!verifyPassword(b.currentPassword,u.password))fail(400,'Current password is incorrect');const password=passwordHash(b.newPassword),s=newSession(repo,user.id);await repo.commit([repo.statement('UPDATE users SET password=? WHERE id=?',password,user.id),repo.statement('DELETE FROM sessions WHERE userId=?',user.id),...s.writes,repo.audit(user.name,'Changed password','users',user)]);return json({ok:true},200,{'Set-Cookie':s.cookie});}
 const [kind,id,...extra]=route.split('/');if(kind!=='users'||extra.length)fail(404,'Not found');owner(user);const b=await body(request),uid=id||crypto.randomUUID(),old=id?await repo.user(id):null;if(id&&!old)fail(404,'User not found');
 if(method==='POST'&&!id){const u=userInput(b),password=passwordHash(b.password),ids=appIds(b.appIds??['advocate']);await repo.commit([repo.statement('INSERT INTO users VALUES(?,?,?,?,?,1)',uid,u.name,u.email,u.role,password),...repo.accessWrites(uid,ids),repo.audit(user.name,'Added team member','users',{id:uid,name:u.name})]);return json(await repo.user(uid),201);}
 if(method==='PATCH'&&id){const u=userInput({...old,...b}),active=b.active??old.active;if(typeof active!=='boolean')fail(400,'Invalid active state');if(id===user.id&&(!active||u.role!=='Owner'))fail(400,'You cannot deactivate or demote your own owner account');const writes=[repo.statement('UPDATE users SET name=?,email=?,role=?,active=? WHERE id=?',u.name,u.email,u.role,active,id),repo.statement('DELETE FROM sessions WHERE userId=?',id),repo.audit(user.name,'Updated team member','users',{id,name:u.name})];if(b.password)writes.push(repo.statement('UPDATE users SET password=? WHERE id=?',passwordHash(b.password),id));const s=id===user.id?newSession(repo,id):null;if(s)writes.push(...s.writes);await repo.commit(writes);return json(await repo.user(id),200,s?{'Set-Cookie':s.cookie}:{});}
 fail(405,'Method not allowed');
}
