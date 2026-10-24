// Transport only: callers own permissions, view revisions and reconciliation.
const pending=new Map();
export function requestJson(url,{timeoutMs=12000,dedupeKey,signal,...options}={}){
 const method=options.method||'GET';if(dedupeKey&&method!=='GET')throw Error('Only GET requests may be deduplicated');
 const key=dedupeKey&&!signal?JSON.stringify([dedupeKey,url,options.credentials||'same-origin',Array.from(new Headers(options.headers).entries())]):null;
 if(key&&pending.has(key))return pending.get(key);
 const task=(async()=>{const timeout=AbortSignal.timeout(timeoutMs),combined=signal?AbortSignal.any([signal,timeout]):timeout;
  const response=await fetch(url,{cache:'no-store',credentials:'same-origin',...options,signal:combined});let data=null;
  if(response.status!==204){try{data=await response.json();}catch{if(response.ok)throw Object.assign(Error('The server returned an invalid response.'),{status:502});}}
  if(!response.ok)throw Object.assign(Error(data?.error||'The request could not be completed. Try again.'),{status:response.status,code:data?.code});return data;
 })().finally(()=>{if(key)pending.delete(key);});if(key)pending.set(key,task);return task;
}
