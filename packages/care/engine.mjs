// Shared rules only. Each host owns its own care records and storage revision.
const fail=m=>{throw Error(m);};
const text=(v,label,max=160,optional=false)=>{if(typeof v!=='string'||v.length>max||!optional&&!v.trim())fail(`Enter ${label} (maximum ${max} characters).`);return v.trim();};
const id=v=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(v))fail('Invalid care record ID.');return v;};
const integer=(v,max,label)=>{if(!Number.isSafeInteger(v)||v<0||v>max)fail(`Invalid ${label}.`);return v;};
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function date(v){if(typeof v!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)fail('Enter a valid date between 2000 and 2099.');return v;}
export function addMonths(v,n){date(v);integer(n,120,'repeat interval');const [y,m,d]=v.split('-').map(Number),x=new Date(Date.UTC(y,m-1+n,1,12)),last=new Date(Date.UTC(x.getUTCFullYear(),x.getUTCMonth()+1,0,12)).getUTCDate();x.setUTCDate(Math.min(d,last));return date(x.toISOString().slice(0,10));}
export function paise(v){if(typeof v!=='string'||!/^\d{1,8}(\.\d{1,2})?$/.test(v))fail('Enter an amount with up to two decimal places.');const [a,b='']=v.split('.');return integer(Number(a)*100+Number(b.padEnd(2,'0')),10000000000,'cost');}
export const money=v=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(v/100);
export const empty=()=>({items:[],tasks:[],visits:[]});
const rows=(v,max)=>{if(!Array.isArray(v)||v.length>max)fail('Care record limit exceeded or invalid backup.');return v;};
const optionalDate=v=>v?date(v):'';
function attachment(raw){if(!raw)return null;const name=text(raw.name,'a file name',160),type=raw.type,data=raw.data;if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(type)||typeof data!=='string'||data.length>1400000||!data.length||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))fail('Receipt must be a PDF, PNG, JPEG or WebP under 1 MB.');const size=data.length*3/4-(data.endsWith('==')?2:data.endsWith('=')?1:0);if(size>1048576)fail('Receipt exceeds 1 MB.');const head=atob(data.slice(0,40));if(type==='application/pdf'&&!head.startsWith('%PDF-')||type==='image/png'&&!head.startsWith('\x89PNG\r\n\x1a\n')||type==='image/jpeg'&&!head.startsWith('\xff\xd8\xff')||type==='image/webp'&&(!head.startsWith('RIFF')||head.slice(8,12)!=='WEBP'))fail('The receipt file does not match its format.');return {name,type,data};}
export function validate(input,options={}){
 const raw=input||empty(),s=empty(),scopes=options.scopes||[],services=options.services||[];
 s.items=rows(raw.items,300).map(x=>({id:id(x.id),name:text(x.name,'an item name'),scopeId:text(x.scopeId||'','a property',80,!options.requireScope),purchased:optionalDate(x.purchased),warrantyEnd:optionalDate(x.warrantyEnd),contact:text(x.contact||'','a contact',160,true),notes:text(x.notes||'','notes',500,true),archived:!!x.archived,receipt:attachment(x.receipt)}));
 for(const x of s.items){if(x.scopeId&&!scopes.includes(x.scopeId)||options.requireScope&&!x.scopeId)fail('Choose an existing property.');if(x.purchased&&x.warrantyEnd&&x.warrantyEnd<x.purchased)fail('Warranty expiry must follow the purchase date.');}
 s.tasks=rows(raw.tasks,600).map(t=>({id:id(t.id),itemId:t.itemId?id(t.itemId):'',title:text(t.title,'a service or renewal name'),kind:t.kind,due:date(t.due),repeatMonths:integer(t.repeatMonths,120,'repeat months'),serviceId:text(t.serviceId||'','a bill link',80,true),done:!!t.done,archived:!!t.archived}));
 for(const t of s.tasks){if(!['service','renewal'].includes(t.kind)||t.itemId&&!s.items.some(i=>i.id===t.itemId)||options.requireScope&&!t.itemId||t.serviceId&&!services.includes(t.serviceId))fail('Invalid service, item or existing bill link.');}
 s.visits=rows(raw.visits,5000).map(v=>({id:id(v.id),taskId:id(v.taskId),date:date(v.date),cost:integer(v.cost,10000000000,'service cost'),note:text(v.note||'','service notes',500,true),expenseId:text(v.expenseId||'','an expense link',80,true)}));
 for(const v of s.visits)if(!s.tasks.some(t=>t.id===v.taskId))fail('Service history references an unknown task.');
 for(const key of ['items','tasks','visits'])if(new Set(s[key].map(x=>x.id)).size!==s[key].length)fail('Duplicate care record IDs.');
 if(new TextEncoder().encode(JSON.stringify(s)).length>15000000)fail('Care records exceed 15 MB. Export receipts and reduce attachments.');return s;
}
export function command(input,action,b,options={}){
 const s=validate(input,options),find=(key,value)=>s[key].find(x=>x.id===value)||fail('Care record not found.');
 if(action==='care.item'){const record={id:b.id||crypto.randomUUID(),name:b.name,scopeId:b.scopeId||'',purchased:b.purchased||'',warrantyEnd:b.warrantyEnd||'',contact:b.contact||'',notes:b.notes||'',archived:false,receipt:b.receipt||null};if(b.id){const old=find('items',b.id);if(old.scopeId!==record.scopeId&&s.tasks.some(t=>t.itemId===old.id))fail('Keep the original property once service history or tasks exist.');Object.assign(old,record);}else s.items.push(record);}
 else if(action==='care.task'){const record={id:b.id||crypto.randomUUID(),itemId:b.itemId||'',title:b.title,kind:b.kind,due:b.due,repeatMonths:Number(b.repeatMonths),serviceId:b.serviceId||'',done:false,archived:false};if(b.id){const old=find('tasks',b.id);if(old.itemId!==record.itemId&&s.visits.some(v=>v.taskId===old.id))fail('Keep the original item for a task with service history.');Object.assign(old,record);}else s.tasks.push(record);}
 else if(action==='care.complete'){const t=find('tasks',b.taskId);if(t.done||t.archived||t.itemId&&find('items',t.itemId).archived)fail('This task is already completed or archived.');const d=date(b.date);if(d>today())fail('Completed work cannot be dated in the future.');const visit={id:id(b.visitId),taskId:t.id,date:d,cost:paise(b.cost),note:b.note||'',expenseId:''};s.visits.push(visit);if(t.repeatMonths)t.due=addMonths(d,t.repeatMonths);else t.done=true;}
 else if(action==='care.archiveItem')find('items',b.id).archived=true;
 else if(action==='care.restoreItem')find('items',b.id).archived=false;
 else if(action==='care.archiveTask')find('tasks',b.id).archived=true;
 else if(action==='care.restoreTask')find('tasks',b.id).archived=false;
 else fail('Unknown care action.');return validate(s,options);
}
export function dueRows(s,asOf=today(),scopeId=''){
 date(asOf);const within=day=>Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(asOf+'T12:00:00Z'))/86400000),visible=i=>!i.archived&&(!scopeId||i.scopeId===scopeId),out=[];
 for(const item of s.items.filter(visible))if(item.warrantyEnd)out.push({id:item.id,type:'warranty',title:item.name+' · warranty',due:item.warrantyEnd,itemId:item.id,days:within(item.warrantyEnd)});
 for(const t of s.tasks.filter(t=>!t.done&&!t.archived)){const item=s.items.find(i=>i.id===t.itemId);if(item&&!visible(item)||scopeId&&!item)continue;out.push({id:t.id,type:t.kind,title:t.title,due:t.due,itemId:t.itemId,days:within(t.due)});}
 return out.sort((a,b)=>a.due.localeCompare(b.due));
}
export function calendar(rows){const esc=s=>String(s).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(',','\\,').replaceAll(';','\\;'),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Sushant Synapse//Care reminders//EN','CALSCALE:GREGORIAN'];for(const r of rows)lines.push('BEGIN:VEVENT','UID:care-'+r.type+'-'+r.id+'@sushantsynapse.com','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+r.due.replaceAll('-',''),'SUMMARY:'+esc(r.title),'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:'+esc(r.title),'END:VALARM','END:VEVENT');lines.push('END:VCALENDAR');const encoder=new TextEncoder(),fold=line=>{let out='',part='';for(const c of line){if(encoder.encode(part+c).length>73){out+=part+'\r\n ';part='';}part+=c;}return out+part;};return lines.map(fold).join('\r\n')+'\r\n';}
