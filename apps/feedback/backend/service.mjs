import {body,fail,json} from '../../../server/edge-http.mjs';
export const storageKey='platform-feedback-v1';
export const empty=()=>({version:0,items:[]});
export const statuses=['Open','Under review','Planned','In progress','Shipped','Not planned'];
const categories=['Feature request','Bug report','Improvement'];
const text=(value,min,max,label)=>{if(typeof value!=='string'||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(400,`${label}: use ${min}–${max} characters.`);return value.trim();};
const fields=(input,allowed)=>{if(Object.keys(input).some(key=>!allowed.includes(key)))fail(400,'Unexpected fields.');};
const identity=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
export async function feedback(request,{read,write,limit,canModerate=false,now=Date.now()}){
 const url=new URL(request.url),path=url.pathname.slice('/api/feedback'.length),method=request.method;
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'Origin rejected');
 if(!['GET','POST'].includes(method))fail(405,'Method not allowed');
 if(method==='POST'&&request.headers.get('Origin')!==url.origin)fail(403,'Origin required');
 const cookieName=url.protocol==='https:'?'__Host-synapse_feedback':'synapse_feedback';
 let token=new RegExp('(?:^|;\\s*)'+cookieName+'=([a-f0-9]{64})(?:;|$)').exec(request.headers.get('Cookie')||'')?.[1],newToken=!token;
 if(newToken&&method!=='GET')fail(409,'Open the feedback board before contributing. Enable cookies and try again.');
 token||=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 const actor=await identity(token),headers=newToken?{'Set-Cookie':`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${url.protocol==='https:'?'; Secure':''}`}:{},saved=await read()||empty(),items=saved.items;
 const result=(data,status=200)=>json(data,status,headers);
 const project=item=>({id:item.id,title:item.title,description:item.description,category:item.category,app:item.app,status:item.status,createdAt:item.createdAt,votes:item.voters.length,voted:item.voters.includes(actor),commentCount:item.comments.filter(c=>!c.hidden).length,reported:item.reporters.includes(actor),...(canModerate?{hidden:!!item.hidden,reports:item.reporters.length}:{})});
 async function save(){const next={version:saved.version+1,items};if(new TextEncoder().encode(JSON.stringify(next)).length>900000)fail(503,'The board is at capacity. Please contact the platform administrator.');await write(next,saved.version);}
 if(method==='GET'&&path===''){
  if([...url.searchParams.keys()].some(k=>!['q','status','sort','page','moderation'].includes(k))||[...url.searchParams.keys()].some(k=>url.searchParams.getAll(k).length!==1))fail(400,'Invalid search parameters.');
  const q=url.searchParams.get('q')||'',status=url.searchParams.get('status')||'',sort=url.searchParams.get('sort')||'top',page=Number(url.searchParams.get('page')||1),moderation=url.searchParams.get('moderation');
  if(q.length>120||status&&!statuses.includes(status)||!['top','new'].includes(sort)||!Number.isSafeInteger(page)||page<1||page>100||moderation&&!['0','1'].includes(moderation))fail(400,'Invalid search or filter.');
  if(moderation==='1'&&!canModerate)fail(403,'Administrator access required');
  const words=q.trim().toLowerCase().split(/\s+/).filter(Boolean),filtered=items.filter(i=>(!i.hidden||moderation==='1')&&(!status||i.status===status)&&words.every(w=>`${i.title} ${i.description} ${i.app}`.toLowerCase().includes(w))).sort((a,b)=>(sort==='top'?b.voters.length-a.voters.length:0)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
  return result({items:filtered.slice((page-1)*20,page*20).map(project),total:filtered.length,page,hasMore:filtered.length>page*20,canModerate,statuses,categories});
 }
 const match=path.match(/^\/([a-f0-9-]{36})(?:\/(vote|comments|report|moderate))?$/);
 if(method==='GET'&&match&&!match[2]){const item=items.find(i=>i.id===match[1]&&(!i.hidden||canModerate));if(!item)fail(404,'Request not found');return result({...project(item),comments:item.comments.filter(c=>!c.hidden||canModerate).map(c=>({id:c.id,message:c.message,createdAt:c.createdAt,...(canModerate?{hidden:!!c.hidden}:{})})),canModerate,statuses});}
 if(method!=='POST'||path!==''&&!match)fail(404,'Not found');
 if(match?.[2]==='moderate'&&!canModerate)fail(403,'Administrator access required');
 if(!(await limit()).success)fail(429,'Please wait a minute before contributing again.');
 const input=await body(request,12000);
 if(path===''){
  fields(input,['title','description','category','app','website']);if(input.website)fail(400,'Unable to submit.');
  const title=text(input.title,8,120,'Title'),description=text(input.description,20,2000,'Description'),app=text(input.app||'Platform',1,80,'App');if(!categories.includes(input.category))fail(400,'Choose a category');
  if(items.some(i=>!i.hidden&&i.title.toLowerCase()===title.toLowerCase()))fail(409,'A request with this title already exists. Search and vote for it instead.');
  if(items.length>=200)fail(503,'The board is at capacity. Please contact the administrator.');
  const item={id:crypto.randomUUID(),title,description,app,category:input.category,status:'Open',createdAt:new Date(now).toISOString(),creator:actor,voters:[],reporters:[],comments:[]};items.push(item);await save();return result(project(item),201);
 }
 const item=items.find(i=>i.id===match[1]&&(!i.hidden||canModerate));if(!item)fail(404,'Request not found');
 if(match[2]==='vote'){
  fields(input,['voted']);if(typeof input.voted!=='boolean')fail(400,'Choose a vote state');
  if(input.voted&&!item.voters.includes(actor)){if(item.voters.length>=5000)fail(409,'Voting capacity reached for this request.');item.voters.push(actor);}else if(!input.voted)item.voters=item.voters.filter(v=>v!==actor);
 }else if(match[2]==='comments'){
  fields(input,['message','website']);if(input.website)fail(400,'Unable to submit.');if(item.comments.length>=30)fail(409,'Discussion is full. Please add a separate request if needed.');
  const message=text(input.message,3,1000,'Comment');item.comments.push({id:crypto.randomUUID(),message,createdAt:new Date(now).toISOString(),creator:actor});
 }else if(match[2]==='report'){
  fields(input,[]);if(!item.reporters.includes(actor)){if(item.reporters.length>=1000)fail(409,'Report already queued for review');item.reporters.push(actor);}
 }else if(match[2]==='moderate'){
  fields(input,['status','hidden','commentId']);if(!Object.keys(input).length)fail(400,'Choose a moderation action');
  if(input.status!==undefined){if(!statuses.includes(input.status))fail(400,'Choose a status');item.status=input.status;}
  if(input.hidden!==undefined){if(typeof input.hidden!=='boolean')fail(400,'Choose visibility');if(input.commentId){const comment=item.comments.find(c=>c.id===input.commentId);if(!comment)fail(404,'Comment not found');comment.hidden=input.hidden;}else item.hidden=input.hidden;}
  else if(input.commentId!==undefined)fail(400,'Choose comment visibility');
 }else fail(404,'Not found');
 await save();return result(project(item));
}
