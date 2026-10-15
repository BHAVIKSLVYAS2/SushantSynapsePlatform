import {body,fail,json} from '../../../server/edge-http.mjs';
export const metricsKey='satire-arena-aggregate-events-v1';
const events=['arena_view','post_view','character_open','reaction_saved','share_selected','link_copied','image_download','tool_click'];
export async function metrics(request,{enabled=false,user,read,write,limit,now=new Date()}){
 const path=new URL(request.url).pathname;
 if(path==='/api/arena-metrics/config'&&request.method==='GET')return json({enabled});
 if(path!=='/api/arena-metrics')fail(404,'Not found');
 if(request.method==='GET'){if(!user)fail(401,'Please sign in');if(user.role!=='Owner')fail(403,'Owner access required');return json({enabled,measurement:'Unverified aggregate action counts, not unique people, confirmed delivery or downstream visits. No visitor identifiers or returning-visitor measurement.',days:await read()||[]});}
 if(request.method!=='POST')fail(405,'Method not allowed');
 if(!enabled)return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 if(request.headers.get('Origin')!==new URL(request.url).origin)fail(403,'Origin rejected');
 if(!limit||!(await limit()).success)fail(429,'Please wait before recording another action');
 const input=await body(request,1024);if(Object.keys(input).some(k=>!['event','content','method','source'].includes(k))||!events.includes(input.event)||typeof input.content!=='string'||!/^([a-z0-9-]{1,90})$/.test(input.content)||!['none','native','whatsapp','copy','image'].includes(input.method)||!['direct','internal','search','social','other'].includes(input.source))fail(400,'Invalid aggregate event');
 const day=new Date(now.getTime()+19800000).toISOString().slice(0,10),rows=await read()||[],next=structuredClone(rows.filter(r=>r.day>=new Date(Date.parse(day)-29*86400000).toISOString().slice(0,10)));let row=next.find(r=>r.day===day);if(!row){row={day,counts:{}};next.push(row);}const key=[input.event,input.content,input.method,input.source].join(':');if(!(key in row.counts)&&Object.keys(row.counts).length>=1000)fail(429,'Daily aggregate capacity reached');row.counts[key]=(row.counts[key]||0)+1;while(next.length>1&&new TextEncoder().encode(JSON.stringify(next)).length>700000)next.splice(next.findIndex(r=>r.day===next.map(d=>d.day).sort()[0]),1);await write(next);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
}
