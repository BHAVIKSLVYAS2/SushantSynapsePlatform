const {randomUUID,randomBytes,scryptSync,timingSafeEqual,createHash}=require('node:crypto');
const {fail,readBody}=require('../../server/http');
const {apps}=require('../app-registry');
function createAuth({store,secureCookie,initializeWorkspace}){
const SESSION_TTL=12*60*60*1000;
const hashToken=value=>createHash('sha256').update(value).digest('hex');
const failures=new Map();
function passwordHash(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) fail(400, 'Use a password between 12 and 128 characters');
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}
function userInput(input) {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120) fail(400, 'Name is required (maximum 120 characters)');
  if (typeof input.email !== 'string' || input.email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) fail(400, 'Enter a valid email');
  if (!['Owner', 'Advocate', 'Clerk'].includes(input.role)) fail(400, 'Invalid role');
  return { name: input.name.trim(), email: input.email.trim().toLowerCase(), role: input.role };
}
function newSession(res, userId) {
  const token = randomBytes(32).toString('hex');
  store.sql.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  store.sql.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token), userId, Date.now() + SESSION_TTL);
  res.setHeader('Set-Cookie', `chambers_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secureCookie?'; Secure':''}`);
}
function session(req) {
  const token = /(?:^|;\s*)chambers_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (!token) return null;
  const row = store.sql.prepare('SELECT userId FROM sessions WHERE token=? AND expires>?').get(hashToken(token), Date.now());
  const user = row && store.user(row.userId);
  return user?.active ? { ...user, session: hashToken(token) } : null;
}
function owner(user) { if (user.role !== 'Owner') fail(403, 'Only the chamber owner can perform this action'); }
function hasAppAccess(user, appId) { return user.role==='Owner'||store.access(user.id).includes(appId); }
function validAppIds(ids) { if(!Array.isArray(ids)||ids.some(id=>!apps.some(a=>a.id===id&&a.status==='Available'))||new Set(ids).size!==ids.length)fail(400,'Choose valid available apps');return ids; }

async function handle({route,method,req,res,json,user}){
    if(route==='auth/status'&&method==='GET')return json(200,{setupRequired:store.users().length===0,setupProtected:!!process.env.SETUP_TOKEN,user:user?{id:user.id,name:user.name,email:user.email,role:user.role}:null});
    if(route==='auth/setup'&&method==='POST'){
      if(store.users().length)fail(409,'Workspace is already configured');
      const input=await readBody(req);if(store.users().length)fail(409,'Workspace is already configured');
      if(process.env.SETUP_TOKEN&&(typeof input.setupToken!=='string'||!timingSafeEqual(Buffer.from(hashToken(input.setupToken)),Buffer.from(hashToken(process.env.SETUP_TOKEN)))))fail(403,'The setup token is incorrect');
      const u=userInput({...input,role:'Owner'}), password=passwordHash(input.password),id=randomUUID();
      store.transaction(()=>{store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(id,u.name,u.email,u.role,password);store.setAccess(id,['advocate']);initializeWorkspace(input,u);store.audit(u.name,'Created workspace','users',{id,name:u.name});});
      newSession(res,id);return json(201,{user:store.user(id)});
    }
    if(route==='auth/login'&&method==='POST'){
      const input=await readBody(req);const key=(req.socket.remoteAddress||'')+':'+(typeof input.email==='string'?input.email.trim().toLowerCase().slice(0,200):'');
      if(failures.size>10000)for(const [k,v]of failures)if(v.until<Date.now())failures.delete(k);
      const attempt=failures.get(key);if(attempt&&attempt.count>=10&&attempt.until>Date.now())fail(429,'Too many attempts. Try again in 15 minutes.');
      const u=store.sql.prepare('SELECT * FROM users WHERE email=?').get(typeof input.email==='string'?input.email.trim().toLowerCase():'');
      const valid=verifyPassword(input.password,u?.password||'00000000000000000000000000000000:'+ '00'.repeat(64));
      if(!u||!u.active||!valid){failures.set(key,{count:attempt&&attempt.until>Date.now()?attempt.count+1:1,until:Date.now()+900000});fail(401,'Email or password is incorrect');}
      failures.delete(key);newSession(res,u.id);store.audit(u.name,'Signed in','users',u);return json(200,{user:store.user(u.id)});
    }
    if(!user)fail(401,'Please sign in');
    if(route==='auth/logout'&&method==='POST'){store.sql.prepare('DELETE FROM sessions WHERE token=?').run(user.session);res.setHeader('Set-Cookie',`chambers_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie?'; Secure':''}`);return json(200,{ok:true});}
    if(route==='auth/profile'&&method==='PATCH'){
      const input=await readBody(req),updated=userInput({name:input.name,email:input.email,role:user.role});
      if(store.users().some(u=>u.id!==user.id&&u.email===updated.email))fail(409,'Email is already in use');
      store.transaction(()=>{store.sql.prepare('UPDATE users SET name=?,email=? WHERE id=?').run(updated.name,updated.email,user.id);store.audit(user.name,'Updated profile','users',{id:user.id,name:updated.name});});return json(200,store.user(user.id));
    }
    if(route==='auth/password'&&method==='POST'){
      const input=await readBody(req),u=store.sql.prepare('SELECT * FROM users WHERE id=?').get(user.id);
      if(!verifyPassword(input.currentPassword,u.password))fail(400,'Current password is incorrect');
      const hash=passwordHash(input.newPassword);store.transaction(()=>{store.sql.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);store.sql.prepare('DELETE FROM sessions WHERE userId=?').run(user.id);store.audit(user.name,'Changed password','users',user);});newSession(res,user.id);return json(200,{ok:true});
    }

const [kind,id,action,...extra]=route.split('/');if(action||extra.length)fail(404,'Not found');
    if(kind==='users'){
      owner(user);const input=await readBody(req);
      if(method==='POST'&&!id){const u=userInput(input);if(store.users().some(x=>x.email===u.email))fail(409,'Email is already in use');const password=passwordHash(input.password);const uid=randomUUID();const appIds=validAppIds(input.appIds??['advocate']);store.transaction(()=>{store.sql.prepare('INSERT INTO users VALUES(?,?,?,?,?,1)').run(uid,u.name,u.email,u.role,password);store.setAccess(uid,appIds);store.audit(user.name,'Added team member','users',{id:uid,name:u.name});});return json(201,store.user(uid));}
      if(method==='PATCH'&&id){const old=store.user(id);if(!old)fail(404,'User not found');const u=userInput({...old,...input});const active=input.active??old.active;if(typeof active!=='boolean')fail(400,'Invalid active state');if(id===user.id&&(!active||u.role!=='Owner'))fail(400,'You cannot deactivate or demote your own owner account');if(store.users().some(x=>x.email===u.email&&x.id!==id))fail(409,'Email is already in use');const password=input.password?passwordHash(input.password):null;store.transaction(()=>{store.sql.prepare('UPDATE users SET name=?,email=?,role=?,active=? WHERE id=?').run(u.name,u.email,u.role,active?1:0,id);if(password)store.sql.prepare('UPDATE users SET password=? WHERE id=?').run(password,id);store.sql.prepare('DELETE FROM sessions WHERE userId=?').run(id);store.audit(user.name,'Updated team member','users',{id,name:u.name});});if(id===user.id)newSession(res,id);return json(200,store.user(id));}
      fail(405,'Method not allowed');
    }

fail(404,'Not found');
}
return {session,owner,hasAppAccess,validAppIds,handle};
}
module.exports={createAuth};
