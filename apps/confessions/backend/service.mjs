import {body,fail,json,owner} from '../../../server/edge-http.mjs';
export const storageKey='confessions-v1';
export const empty=()=>({version:0,items:[]});
const lifetime=7*86400000;
export function cleanMessage(value){
 if(typeof value!=='string'||value.trim().length<3||[...value].length>600||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(400,'Write a confession between 3 and 600 characters.');
 return value.trim();
}
export async function confessions(request,{read,write,user,limit,now=Date.now()}){
 const url=new URL(request.url),path=url.pathname.slice('/api/confessions'.length),method=request.method;
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)fail(403,'Origin rejected');
 if(request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'Cross-site request rejected');
 if(!['GET','POST'].includes(method))fail(405,'Method not allowed');
 const moderation=path==='/moderation'||path.startsWith('/moderation/');if(moderation)owner(user);
 if(method==='POST'&&!moderation&&!(await limit()).success)fail(429,'Please wait a minute before trying again.');
 const saved=await read()||empty(),items=saved.items.filter(item=>Date.parse(item.expiresAt)>now),publicItems=items.filter(item=>item.status==='approved'),challenges=(saved.challenges||[]).filter(challenge=>challenge.expiresAt>now);
 async function save(){await write({version:saved.version+1,items,challenges},saved.version);}
 if(method==='POST'&&path==='/challenge'){
  const input=await body(request,128);if(Object.keys(input).length)fail(400,'Quick checks do not need personal details.');if(challenges.length>=100)fail(429,'Quick checks are busy. Please try again in a few minutes.');
  const values=crypto.getRandomValues(new Uint32Array(2)),a=1+values[0]%9,b=1+values[1]%9,id=crypto.randomUUID(),expiresAt=now+300000;
  challenges.push({id,answer:String(a+b),expiresAt});await save();return json({id,question:`What is ${a} + ${b}?`,expiresAt});
 }
 if(method==='GET'&&path==='')return json({version:saved.version,items:publicItems.map(({id,createdAt,expiresAt})=>({id,createdAt,expiresAt})),canModerate:user?.role==='Owner'});
 if(method==='GET'&&path==='/moderation')return json({items,version:saved.version});
 const reveal=path.match(/^\/([\w-]{36})$/);
 if(method==='GET'&&reveal){const item=publicItems.find(item=>item.id===reveal[1]);if(!item)fail(404,'This confession is no longer available.');return json({id:item.id,message:item.message});}
 if(method==='POST'&&path===''){
  const input=await body(request,4096);if(Object.keys(input).some(key=>!['message','captchaId','captchaAnswer'].includes(key)))fail(400,'Send only the confession and quick-check fields.');
  const message=cleanMessage(input.message);if(items.length>=300)fail(503,'The confession box is full. Please try again later.');
  const challenge=challenges.findIndex(challenge=>challenge.id===input.captchaId);
  if(challenge<0)fail(400,'Complete a new quick check before posting.');
  const expected=challenges.splice(challenge,1)[0].answer;
  if(typeof input.captchaAnswer!=='string'||!/^\d{1,2}$/.test(input.captchaAnswer.trim())||input.captchaAnswer.trim()!==expected){await save();fail(400,'That answer was not correct. Get a new question and try again.');}
  const item={id:crypto.randomUUID(),message,status:'approved',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+lifetime).toISOString()};items.push(item);await save();return json({id:item.id,status:'approved',createdAt:item.createdAt,expiresAt:item.expiresAt,version:saved.version+1},201);
 }
 const report=path.match(/^\/([\w-]{36})\/report$/);
 if(method==='POST'&&report){await body(request,256);const item=publicItems.find(item=>item.id===report[1]);if(!item)fail(404,'This confession is no longer available.');item.status='reported';await save();return json({status:'reported'});}
 const review=path.match(/^\/moderation\/([\w-]{36})$/);
 if(method==='POST'&&review){const input=await body(request,512);if(!['approve','remove'].includes(input.action))fail(400,'Choose approve or remove.');const index=items.findIndex(item=>item.id===review[1]);if(index<0)fail(404,'Confession not found.');if(input.action==='remove')items.splice(index,1);else items[index].status='approved';await save();return json({ok:true});}
 fail(404,'Not found');
}
