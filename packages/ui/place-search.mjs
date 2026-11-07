// Shared bounded request cache; directory entries are public, not location history.
const cache=new Map(),pending=new Map();
export async function lookupPlaces(parameters){
 const query=new URLSearchParams(parameters).toString();
 if(cache.has(query))return cache.get(query);
 if(pending.has(query))return pending.get(query);
 const request=(async()=>{
  const response=await fetch('/api/places?'+query,{credentials:'omit',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('City search unavailable. Try again.');
  const result=await response.json();
  if(cache.size>=64)cache.delete(cache.keys().next().value);
  cache.set(query,result);return result;
 })();
 pending.set(query,request);try{return await request;}finally{pending.delete(query);}
}
export const searchPlaces=(q,{limit=8}={})=>lookupPlaces({q,limit:String(limit)});
export const resolvePlace=async id=>(await lookupPlaces({id})).place;
