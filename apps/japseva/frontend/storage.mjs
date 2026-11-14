import {audioMantraIds} from './library.mjs';
export const empty=()=>({format:'japseva-backup',schemaVersion:2,version:0,clients:[],sankalps:[],audioPlays:{}});
const fail=message=>{throw Error(message);};
const text=(v,label,max=120)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail(`${label} is required (maximum ${max} characters).`);return v.trim();};
const int=(v,max,label,min=1)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail(`${label} must be a whole number from ${min} to ${max}.`);return v;};
const date=v=>{if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))fail('Invalid practice date.');return new Date(v).toISOString();};
const id=v=>{if(typeof v!=='string'||! /^[a-f0-9-]{36}$/.test(v))fail('Invalid record ID.');return v;};
export function validate(input){
 if(!input||input.format!=='japseva-backup'||![1,2].includes(input.schemaVersion))fail('Choose a supported JapSeva backup.');
 if(new TextEncoder().encode(JSON.stringify(input)).length>1000000)fail('This workspace exceeds the 1 MB limit.');
 const s=empty();s.version=int(input.version,Number.MAX_SAFE_INTEGER,'Version',0);
 if(input.audioPlays!==undefined){if(!input.audioPlays||typeof input.audioPlays!=='object'||Array.isArray(input.audioPlays)||Object.keys(input.audioPlays).some(k=>!audioMantraIds.includes(k)))fail('Invalid audio practice.');for(const [key,r]of Object.entries(input.audioPlays)){const target=int(r.target,1000000,'Audio target');s.audioPlays[key]={target,count:int(r.count,target,'Audio plays',0)};}}
 if(!Array.isArray(input.clients)||input.clients.length>200||!Array.isArray(input.sankalps)||input.sankalps.length>200)fail('Invalid workspace record limits.');
 s.clients=input.clients.map(c=>({id:id(c.id),name:text(c.name,'Client name'),createdAt:date(c.createdAt)}));
 const ids=new Set(s.clients.map(c=>c.id));if(ids.size!==s.clients.length)fail('Duplicate client IDs.');
 s.sankalps=input.sankalps.map(r=>{
  if(!ids.has(r.clientId)||!Array.isArray(r.history)||r.history.length>5000)fail('Invalid client or practice history.');
  const target=int(r.target,100000000,'Target'),count=int(r.count,target,'Count',0),days=new Set();
  const history=r.history.map(h=>{const at=date(h.at),day=new Date(Date.parse(at)+19800000).toISOString().slice(0,10);if(h.day!==day||days.has(day))fail('Invalid daily history.');days.add(day);return {at,day,amount:int(h.amount,Number.MAX_SAFE_INTEGER,'Daily repetitions')};});
  const corrections=(r.corrections||[]).map(c=>({at:date(c.at),amount:int(c.amount,target,'Correction'),reason:text(c.reason,'Correction reason',240)}));if(corrections.length>5000)fail('Too many corrections.');
  if(history.reduce((n,h)=>n+h.amount,0)-corrections.reduce((n,c)=>n+c.amount,0)!==count)fail('History does not match the repetition count.');
  if((count===target)!==Boolean(r.completedAt))fail('Completion must match the target.');
  return {id:id(r.id),clientId:r.clientId,mantra:text(r.mantra,'Mantra',1000),mantraId:typeof r.mantraId==='string'?r.mantraId.slice(0,60):'',practitioner:text(r.practitioner,'Practitioner name'),target,count,createdAt:date(r.createdAt),completedAt:r.completedAt?date(r.completedAt):null,history,corrections};
 });
 if(new Set(s.sankalps.map(r=>r.id)).size!==s.sankalps.length)fail('Duplicate sankalp IDs.');return s;
}
export function command(state,path,b,now=new Date().toISOString()){
 const s=structuredClone(state);
 if(audioMantraIds.some(key=>path==='/audio/'+key)){
  const key=path.slice('/audio/'.length);s.audioPlays||={};const r=s.audioPlays[key]||{count:0,target:108};
  if(b.action==='target'){const target=int(b.target,1000000,'Audio target');if(target<r.count)fail('Target cannot be lower than completed audio plays. Reset the audio count first.');r.target=target;}
  else if(b.action==='increment'){if(r.count>=r.target)fail('Audio target is already complete.');r.count++;}
  else if(b.action==='reset')r.count=0;else fail('Unknown audio action.');s.audioPlays[key]=r;
 }else if(path==='/clients'){if(s.clients.length>=200)fail('Maximum 200 clients.');s.clients.push({id:crypto.randomUUID(),name:text(b.name,'Client name'),createdAt:now});}
 else if(path==='/sankalps'){
  if(s.sankalps.length>=200)fail('Maximum 200 sankalps.');if(!s.clients.some(c=>c.id===b.clientId))fail('Choose one of your clients.');
  s.sankalps.push({id:crypto.randomUUID(),clientId:b.clientId,mantra:text(b.mantra,'Mantra',1000),mantraId:b.mantraId||'',practitioner:text(b.practitioner,'Practitioner name'),target:int(b.target,100000000,'Target'),count:0,createdAt:now,completedAt:null,history:[],corrections:[]});
 }else if(/^\/[a-f0-9-]{36}\/count$/.test(path)){
  const r=s.sankalps.find(r=>r.id===path.split('/')[1]);if(!r)fail('Sankalp not found.');const amount=int(b.amount,1000000,'Repetitions');if(r.count+amount>r.target)fail('This count exceeds the remaining target.');
  const day=new Date(Date.parse(now)+19800000).toISOString().slice(0,10),previous=r.history.find(h=>h.day===day);if(previous){previous.amount+=amount;previous.at=now;}else r.history.push({day,at:now,amount});r.count+=amount;if(r.count===r.target)r.completedAt=now;
 }else if(/^\/[a-f0-9-]{36}\/correct$/.test(path)){
  const r=s.sankalps.find(r=>r.id===path.split('/')[1]);if(!r)fail('Sankalp not found.');
  const amount=int(b.amount,r.count,'Correction');r.corrections||=[];r.corrections.push({at:now,amount,reason:text(b.reason,'Correction reason',240)});r.count-=amount;r.completedAt=null;
 }else fail('Unknown practice action.');
 s.version++;return validate(s);
}
export function certificate(state,recordId){const r=state.sankalps.find(r=>r.id===recordId);if(!r)fail('Sankalp not found.');if(r.count!==r.target)fail('Complete the target before creating a certificate.');return {...structuredClone(r),client:state.clients.find(c=>c.id===r.clientId).name,certificateId:'JS-'+r.id};}
let database;
export async function open(){
 if(database)return database;if(!globalThis.indexedDB)fail('Browser storage is unavailable. Enable storage to save your practice.');
 return new Promise((resolve,reject)=>{const req=indexedDB.open('synapse-japseva',3);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('workspace'))req.result.createObjectStore('workspace');};req.onerror=()=>reject(req.error||Error('Could not open browser storage.'));req.onblocked=()=>reject(Error('Close other JapSeva tabs and retry.'));req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};});
}
export async function read(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace'),req=tx.objectStore('workspace').get('state');tx.oncomplete=()=>{try{resolve(req.result?validate(req.result):empty());}catch(e){reject(e);}};tx.onerror=()=>reject(tx.error);});}
export async function write(next,expected){
 const checked=validate(next),db=await open();return new Promise((resolve,reject)=>{let conflict=false;const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace'),req=store.get('state');req.onsuccess=()=>{if((req.result?.version||0)!==expected){conflict=true;tx.abort();return;}store.put(checked,'state');};tx.oncomplete=()=>resolve(checked);tx.onerror=()=>{};tx.onabort=()=>reject(conflict?Error('Progress changed in another tab. Refresh before saving again.'):tx.error||Error('Could not save in this browser.'));});
}
export async function restore(input,expected){const next=validate(input);next.version=expected+1;return write(next,expected);}
