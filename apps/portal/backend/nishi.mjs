import {localIntent,validateIntent,localizePlan,extractionPrompt} from '../../../packages/nishi/planner.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function nishi(request,env={}){
 const url=new URL(request.url),ready=env.NISHI_AI_ENABLED==='true'&&!!env.AI&&!!env.NISHI_LIMITER&&!!env.PLATFORM_DB;
 if(request.method==='GET')return json({ai:ready,scope:['ritual','japseva','kundali']});
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==url.origin)return json({error:'Same-origin request required'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
 const reader=request.body?.getReader();let size=0,parts=[];if(!reader)return json({error:'Message required'},400);for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return json({error:'Message too long'},413);}parts.push(value);}
 let body;try{const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}body=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid JSON'},400);}
 if(typeof body?.message!=='string'||!body.message.trim()||body.message.length>600)return json({error:'Use a message of 1 to 600 characters'},400);
 let plan=localIntent(body.message),source='local',reason='';
 if(ready&&body.useAI===true){
  if(!(await env.NISHI_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'})).success)return json({error:'Please wait before asking again'},429);
  try{
   const day=new Date().toISOString().slice(0,10),usage=await env.PLATFORM_DB.prepare('INSERT INTO nishi_daily_usage(day,calls) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET calls=calls+1 WHERE calls<50 RETURNING calls').bind(day).first();if(!usage)throw Error('budget');
   let timer;const result=await Promise.race([env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8-fast',{messages:[{role:'system',content:extractionPrompt},{role:'user',content:body.message}],max_tokens:350,temperature:0}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),15000);})]).finally(()=>clearTimeout(timer));
   const text=typeof result.response==='string'?result.response.trim().replace(/^```(?:json)?\s*|\s*```$/g,''):'',extracted=JSON.parse(text),submitted=body.message.toLocaleLowerCase();
   for(const field of ['name','place'])if(typeof extracted[field]==='string'&&!submitted.includes(extracted[field].toLocaleLowerCase()))extracted[field]='';
   for(const field of ['date','time'])if(typeof extracted[field]==='string'&&!body.message.includes(extracted[field]))extracted[field]='';
   if(extracted.accuracy==='exact'&&!/\bexact\b|सटीक|चोक्कस|ચોક્કસ/i.test(body.message))extracted.accuracy='unknown';
   const candidate=validateIntent(extracted);if(candidate.kind==='unsupported'&&plan.kind!=='unsupported')throw Error('unsupported');plan=candidate;source='cloudflare';
  }catch{reason='AI unavailable or daily pilot limit reached; this is a local draft.';}
 }
 return json({plan:localizePlan(plan,body.language),source,reason});
}
