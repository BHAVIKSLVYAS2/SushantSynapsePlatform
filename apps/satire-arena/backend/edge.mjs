export const characters=['namo-nimbus','rally-rohan','muffler-mohan'],reactions=['garland','shoe','finger'];
export function roundAt(now=new Date()){return new Date(now.getTime()+19800000).toISOString().slice(0,10);}
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie'};
const encoder=new TextEncoder();
async function hmac(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function identity(request,secret){
 const value=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-arena=([^;]+)/)?.[1],parts=value?.split('.');
 if(parts?.length===2&&/^[a-f0-9-]{36}$/.test(parts[0])&&/^[a-f0-9]{64}$/.test(parts[1])){const expected=await hmac(secret,parts[0]);let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^parts[1].charCodeAt(i);if(!mismatch)return {token:parts[0],cookie:null};}
 const token=crypto.randomUUID();return {token,cookie:`__Host-arena=${token}.${await hmac(secret,token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`};
}
export async function arena(request,env,{now=new Date()}={}){
 const url=new URL(request.url),path=url.pathname,round=roundAt(now),reply=(body,status=200,cookie=null)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{})}});
 const vote=path.match(/^\/api\/satire-arena\/([a-z-]+)\/vote$/),mine=path==='/api/satire-arena/mine';
 if(path!=='/api/satire-arena'&&!vote&&!mine)return reply({error:'Not found.'},404);
 if(!env.ARENA_DB||!env.ARENA_COOKIE_SECRET)return reply({error:'The shared arena is unavailable. No reactions have been recorded.'},503);
 if(!['GET','PUT','DELETE'].includes(request.method)||request.method==='GET'&&vote||request.method==='PUT'&&!vote||request.method==='DELETE'&&!mine)return reply({error:'Method not allowed.'},405);
 const write=request.method!=='GET';
 if(write){
  if(request.headers.get('Origin')!==url.origin)return reply({error:'Open the arena on this website before reacting.'},403);
  if(!env.ARENA_LIMITER)return reply({error:'Voting is temporarily unavailable.'},503);
  const limit=await env.ARENA_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!limit.success)return reply({error:'Please wait a minute before trying again.'},429);
 }
 try{
  const id=await identity(request,env.ARENA_COOKIE_SECRET),voter=await hmac(env.ARENA_COOKIE_SECRET,'ballot:'+id.token),db=env.ARENA_DB.withSession?env.ARENA_DB.withSession('first-primary'):env.ARENA_DB;
  if(write&&id.cookie)return reply({error:'Enable cookies and refresh the arena before reacting.'},428,id.cookie);
  if(vote){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Send a JSON ballot.'},415);
   if(Number(request.headers.get('Content-Length')||0)>1024)return reply({error:'Ballot is too large.'},413);
   let raw='';const reader=request.body?.getReader();if(reader){const chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return reply({error:'Ballot is too large.'},413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}raw=new TextDecoder().decode(bytes);}
   let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid ballot.'},400);}
   if(!body||Array.isArray(body)||Object.keys(body).some(key=>!['reaction','round'].includes(key))||!characters.includes(vote[1])||!reactions.includes(body.reaction))return reply({error:'Choose an available character and reaction.'},400);
   if(body.round!==round)return reply({error:'A new IST round has started. Refresh before reacting.'},409);
   await db.prepare('INSERT INTO arena_votes(voter,character,round,reaction,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(voter,character,round) DO UPDATE SET reaction=excluded.reaction,updated_at=excluded.updated_at').bind(voter,vote[1],round,body.reaction,now.toISOString()).run();return reply(null,204);
  }
  if(mine){
   if(request.method==='DELETE'){if(request.headers.get('X-Arena-Confirm')!=='DELETE')return reply({error:'Confirm removal of your reactions.'},400);await db.prepare('DELETE FROM arena_votes WHERE voter=?').bind(voter).run();return reply(null,204);}
   const rows=await db.prepare('SELECT character,round,reaction,updated_at FROM arena_votes WHERE voter=? ORDER BY round,character').bind(voter).all();return reply({scope:'This browser identity only',votes:rows.results},200,id.cookie);
  }
  const [counts,mineRows]=await db.batch([db.prepare('SELECT character,reaction,COUNT(*) AS count FROM arena_votes WHERE round=? GROUP BY character,reaction').bind(round),db.prepare('SELECT character,reaction FROM arena_votes WHERE round=? AND voter=?').bind(round,voter)]);
  return reply({round,resetsAt:new Date(Date.parse(round+'T00:00:00+05:30')+86400000).toISOString(),votingMode:'browser',characters:characters.map(id=>({id,...Object.fromEntries(reactions.map(reaction=>[reaction,counts.results.find(row=>row.character===id&&row.reaction===reaction)?.count||0])),selected:mineRows.results.find(row=>row.character===id)?.reaction||null}))},200,id.cookie);
 }catch{return reply({error:'The shared arena could not be reached. Refresh to check whether your last reaction saved.'},503);}
}
