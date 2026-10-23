import {cast,reactions as options} from '../frontend/catalogue.mjs';
export const characters=cast.map(c=>c.id),reactions=options.map(r=>r.id);
export function roundAt(now=new Date()){return new Date(now.getTime()+19800000).toISOString().slice(0,10);}
export function annualRoundAt(now=new Date()){return roundAt(now).slice(0,4)+'-01-01';}
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie'};
const encoder=new TextEncoder();
async function hmac(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function identity(request,secret){
 const value=request.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-arena=([^;]+)/)?.[1],parts=value?.split('.');
 if(parts?.length===2&&/^[a-f0-9-]{36}$/.test(parts[0])&&/^[a-f0-9]{64}$/.test(parts[1])){const expected=await hmac(secret,parts[0]);let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^parts[1].charCodeAt(i);if(!mismatch)return {token:parts[0],cookie:null};}
 const token=crypto.randomUUID();return {token,cookie:`__Host-arena=${token}.${await hmac(secret,token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`};
}
export async function arena(request,env,{now=new Date()}={}){
 const url=new URL(request.url),path=url.pathname,round=annualRoundAt(now),nextRound=(Number(round.slice(0,4))+1)+'-01-01',reply=(body,status=200,cookie=null)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{...headers,...(cookie?{'Set-Cookie':cookie}:{})}});
 const vote=path.match(/^\/api\/satire-arena\/([a-z-]+)\/vote$/),mine=path==='/api/satire-arena/mine',results=path==='/api/satire-arena/results';
 if(path!=='/api/satire-arena'&&!vote&&!mine&&!results)return reply({error:'Not found.'},404);
 if(!env.ARENA_DB||!env.ARENA_COOKIE_SECRET)return reply({error:'The shared arena is unavailable. No reactions have been recorded.'},503);
 if(!['GET','PUT','DELETE'].includes(request.method)||request.method==='GET'&&vote||request.method==='PUT'&&!vote||request.method==='DELETE'&&!mine)return reply({error:'Method not allowed.'},405);
 const write=request.method!=='GET';
 if(write){
  if(request.headers.get('Origin')!==url.origin)return reply({error:'Open the arena on this website before reacting.'},403);
  if(!env.ARENA_LIMITER)return reply({error:'Voting is temporarily unavailable.'},503);
  const limit=await env.ARENA_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!limit.success)return reply({error:'Please wait a minute before trying again.'},429);
 }
 try{
  if(results){
   if(request.method!=='GET')return reply({error:'Method not allowed.'},405);
   const start=new Date(Date.parse(roundAt(now)+'T00:00:00+05:30')-29*86400000),db=env.ARENA_DB;
   const retained=await db.prepare('SELECT character,reaction,updated_at FROM arena_all_votes WHERE updated_at>=? AND updated_at<=?').bind(start.toISOString(),now.toISOString()).all();
   const rows={results:[]};for(const row of retained.results){const day=roundAt(new Date(row.updated_at));let group=rows.results.find(x=>x.round===day&&x.character===row.character&&x.reaction===row.reaction);if(!group){group={round:day,character:row.character,reaction:row.reaction,count:0};rows.results.push(group);}group.count++;}
   const days=Array.from({length:30},(_,i)=>{const day=roundAt(new Date(now.getTime()-i*86400000)),scores=characters.map(id=>{const score={id,...Object.fromEntries(reactions.map(r=>[r,Number(rows.results.find(x=>x.round===day&&x.character===id&&x.reaction===r)?.count||0)]))};return {...score,total:reactions.reduce((n,r)=>n+score[r],0)};}).filter(c=>c.total>0).sort((a,b)=>b.total-a.total||a.id.localeCompare(b.id));return {round:day,total:scores.reduce((n,c)=>n+c.total,0),characters:scores};});
   return reply({days,scope:'Last 30 IST days by retained ballot last-update time, including later privacy removals. Yearly scores reset only on 1 January. Not a political poll.'});
  }
  const id=await identity(request,env.ARENA_COOKIE_SECRET),voter=await hmac(env.ARENA_COOKIE_SECRET,'ballot:'+id.token),db=env.ARENA_DB.withSession?env.ARENA_DB.withSession('first-primary'):env.ARENA_DB;
  if(write&&id.cookie)return reply({error:'Enable cookies and refresh the arena before reacting.'},428,id.cookie);
  if(vote){
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'Send a JSON ballot.'},415);
   if(Number(request.headers.get('Content-Length')||0)>1024)return reply({error:'Ballot is too large.'},413);
   let raw='';const reader=request.body?.getReader();if(reader){const chunks=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024){await reader.cancel();return reply({error:'Ballot is too large.'},413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}raw=new TextDecoder().decode(bytes);}
   let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid ballot.'},400);}
   if(!body||Array.isArray(body)||Object.keys(body).some(key=>!['reaction','round'].includes(key))||!characters.includes(vote[1])||!reactions.includes(body.reaction))return reply({error:'Choose an available character and reaction.'},400);
   if(body.round!==round)return reply({error:'A new yearly IST round has started. Refresh before reacting.'},409);
   const target=cast.find(c=>c.id===vote[1])?.arena==='news-anchors'?'arena_anchors_votes':['rally-raja','debate-dastan'].includes(vote[1])?'arena_speakers_votes':['highway-hari','budget-beena'].includes(vote[1])?'arena_additions_votes':'arena_cast_votes';
   await db.batch([db.prepare('DELETE FROM arena_votes WHERE voter=? AND character=? AND round=?').bind(voter,vote[1],round),db.prepare('DELETE FROM arena_expanded_votes WHERE voter=? AND character=? AND round=?').bind(voter,vote[1],round),db.prepare(`INSERT INTO ${target}(voter,character,round,reaction,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(voter,character,round) DO UPDATE SET reaction=excluded.reaction,updated_at=excluded.updated_at`).bind(voter,vote[1],round,body.reaction,now.toISOString())]);return reply(null,204);
  }
  if(mine){
   if(request.method==='DELETE'){if(request.headers.get('X-Arena-Confirm')!=='DELETE')return reply({error:'Confirm removal of your reactions.'},400);await db.batch([db.prepare('DELETE FROM arena_votes WHERE voter=?').bind(voter),db.prepare('DELETE FROM arena_expanded_votes WHERE voter=?').bind(voter),db.prepare('DELETE FROM arena_cast_votes WHERE voter=?').bind(voter),db.prepare('DELETE FROM arena_additions_votes WHERE voter=?').bind(voter),db.prepare('DELETE FROM arena_speakers_votes WHERE voter=?').bind(voter),db.prepare('DELETE FROM arena_anchors_votes WHERE voter=?').bind(voter)]);return reply(null,204);}
   const rows=await db.prepare('SELECT character,round,reaction,updated_at FROM arena_all_votes WHERE voter=? ORDER BY round,character').bind(voter).all();return reply({scope:'This browser identity only',votes:rows.results},200,id.cookie);
  }
  // Retain legacy daily rows; count only the latest yearly choice per identity.
  const annualVotes='SELECT voter,character,reaction FROM (SELECT voter,character,reaction,ROW_NUMBER() OVER(PARTITION BY voter,character ORDER BY updated_at DESC,round ASC) AS annual_position FROM arena_all_votes WHERE round>=? AND round<?) AS yearly WHERE annual_position=1';
  const [counts,mineRows]=await db.batch([db.prepare('SELECT character,reaction,COUNT(*) AS count FROM ('+annualVotes+') AS ballots GROUP BY character,reaction').bind(round,nextRound),db.prepare('SELECT character,reaction FROM ('+annualVotes+') AS ballots WHERE voter=?').bind(round,nextRound,voter)]);
  return reply({round,resetsAt:new Date(nextRound+'T00:00:00+05:30').toISOString(),votingMode:'browser',characters:characters.map(id=>({id,...Object.fromEntries(reactions.map(reaction=>[reaction,counts.results.find(row=>row.character===id&&row.reaction===reaction)?.count||0])),selected:mineRows.results.find(row=>row.character===id)?.reaction||null}))},200,id.cookie);
 }catch{return reply({error:'The shared arena could not be reached. Refresh to check whether your last reaction saved.'},503);}
}
