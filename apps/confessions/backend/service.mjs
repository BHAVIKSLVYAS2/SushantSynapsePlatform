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
 const saved=await read()||empty(),items=saved.items.filter(item=>Date.parse(item.expiresAt)>now),publicItems=items.filter(item=>item.status==='approved');
 async function save(){await write({version:saved.version+1,items},saved.version);}
 if(method==='GET'&&path==='')return json({items:publicItems.map(({id,createdAt,expiresAt})=>({id,createdAt,expiresAt})),canModerate:user?.role==='Owner'});
 if(method==='GET'&&path==='/moderation')return json({items,version:saved.version});
 const reveal=path.match(/^\/([\w-]{36})$/);
 if(method==='GET'&&reveal){const item=publicItems.find(item=>item.id===reveal[1]);if(!item)fail(404,'This confession is no longer available.');return json({id:item.id,message:item.message});}
 if(method==='POST'&&path===''){
  const input=await body(request,4096);if(Object.keys(input).some(key=>key!=='message'))fail(400,'Send only the confession text.');
  const message=cleanMessage(input.message);if(items.length>=300)fail(503,'The confession box is full. Please try again later.');
  const item={id:crypto.randomUUID(),message,status:'pending',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+lifetime).toISOString()};items.push(item);await save();return json({id:item.id,status:'pending',createdAt:item.createdAt,expiresAt:item.expiresAt},201);
 }
 const report=path.match(/^\/([\w-]{36})\/report$/);
 if(method==='POST'&&report){await body(request,256);const item=publicItems.find(item=>item.id===report[1]);if(!item)fail(404,'This confession is no longer available.');item.status='reported';await save();return json({status:'reported'});}
 const review=path.match(/^\/moderation\/([\w-]{36})$/);
 if(method==='POST'&&review){const input=await body(request,512);if(!['approve','remove'].includes(input.action))fail(400,'Choose approve or remove.');const index=items.findIndex(item=>item.id===review[1]);if(index<0)fail(404,'Confession not found.');if(input.action==='remove')items.splice(index,1);else items[index].status='approved';await save();return json({ok:true});}
 fail(404,'Not found');
}
