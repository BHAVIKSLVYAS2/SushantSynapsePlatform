import {cast} from '../frontend/catalogue.mjs';
import {body,fail,json} from '../../../server/edge-http.mjs';
export const editorialKey='satire-arena-editorial-v1';
export const categories=['political-parody','office','technology','indian-life','social-trends'];
export const empty=()=>({version:0,posts:[],characters:[]});
const text=(value,max,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(400,'Invalid or missing text field');return value.trim();};
export function validate(input,current=empty()){
 if(!Number.isInteger(input.version)||input.version!==current.version)fail(409,'Content changed. Reload before saving.');
 if(!Array.isArray(input.posts)||input.posts.length>100||!Array.isArray(input.characters)||input.characters.length>cast.length)fail(400,'Content capacity exceeded');
 const slugs=new Set(),ids=new Set();
 const posts=input.posts.map(p=>{
  const slug=text(p.slug,90,true);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slugs.has(slug))fail(400,'Use a unique lowercase URL slug');slugs.add(slug);
  if(!categories.includes(p.category)||!['en','hi'].includes(p.language)||!['draft','published','hidden'].includes(p.status))fail(400,'Invalid category, language or publication status');
  if(typeof p.publishAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(p.publishAt)||!Number.isFinite(Date.parse(p.publishAt)))fail(400,'Publication time needs an explicit timezone');
  if(new Date(p.publishAt.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)!==p.publishAt.slice(0,10))fail(400,'Invalid publication date');
  const image=text(p.image||'',160);if(image&&!/^\/satire-arena\/(cartoon-cast|extra-cast-v2|new-cast|highway-budget-expressions|speakers-expressions)\.png$/.test(image))fail(400,'Choose existing Arena artwork');
  return {slug,title:text(p.title,120,true),punchline:text(p.punchline,280,true),story:text(p.story||'',5000),category:p.category,language:p.language,status:p.status,publishAt:new Date(p.publishAt).toISOString(),featured:!!p.featured,image,imageAlt:image?text(p.imageAlt,200,true):''};
 });
 const characters=input.characters.map(c=>{if(!cast.some(x=>x.id===c.id)||ids.has(c.id))fail(400,'Invalid or duplicate character');ids.add(c.id);if(!Array.isArray(c.punchlines)||c.punchlines.length>60)fail(400,'Too many punchlines');return {id:c.id,bio:text(c.bio||'',1000),tagline:text(c.tagline||'',200),punchlines:c.punchlines.map(p=>{if(!/^\d{4}-\d\d-\d\d$/.test(p.day)||!Number.isFinite(Date.parse(p.day+'T00:00:00Z'))||new Date(p.day+'T00:00:00Z').toISOString().slice(0,10)!==p.day)fail(400,'Invalid punchline date');return {day:p.day,text:text(p.text,280,true)};})};});
 return {version:current.version+1,posts,characters};
}
export function published(data=empty(),now=new Date()){
 const posts=data.posts.filter(p=>p.status==='published'&&Date.parse(p.publishAt)<=now.getTime()).sort((a,b)=>b.publishAt.localeCompare(a.publishAt));
 const day=new Date(now.getTime()+19800000).toISOString().slice(0,10),choices=posts.filter(p=>p.featured),pool=choices.length?choices:posts;
 const featured=pool.length?pool[Math.floor(Date.parse(day)/86400000)%pool.length]:null;
 return {posts,featured,characters:data.characters.map(c=>({...c,punchlines:c.punchlines.filter(p=>p.day<=day).sort((a,b)=>b.day.localeCompare(a.day)),daily:c.punchlines.find(p=>p.day===day)?.text||c.tagline||cast.find(x=>x.id===c.id).copy}))};
}
export async function editorial(request,{user,read,write,now=new Date()}){
 const path=new URL(request.url).pathname;
 if(path==='/api/arena-editorial/public'||path==='/api/arena-editorial/today'){if(request.method!=='GET')fail(405,'Method not allowed');const data=published(await read()||empty(),now);if(path.endsWith('/today'))return json({featured:data.featured?{slug:data.featured.slug,title:data.featured.title,punchline:data.featured.punchline}:null,characters:data.characters.map(c=>({id:c.id,daily:c.daily}))});return json(data);}
 if(!user)fail(401,'Please sign in');if(user.role!=='Owner')fail(403,'Owner access required');
 if(path!=='/api/arena-editorial')fail(404,'Not found');
 if(request.method==='GET')return json(await read()||empty(),200,{'X-Robots-Tag':'noindex'});
 if(request.method!=='PUT')fail(405,'Method not allowed');
 if(request.headers.get('Origin')!==new URL(request.url).origin)fail(403,'Origin rejected');
 const input=await body(request,800000),current=await read()||empty(),next=validate(input,current);if(new TextEncoder().encode(JSON.stringify(next)).length>750000)fail(413,'Editorial library is full');await write(next,current.version);return json(next);
}
