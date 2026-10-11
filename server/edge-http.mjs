import registry from '../packages/app-registry/index.js';
export function fail(status,message){throw Object.assign(Error(message),{status});}
export async function body(request,limit=8*1024*1024){
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))fail(415,'JSON content type required');
 const reader=request.body?.getReader();if(!reader)fail(400,'Invalid JSON');let total=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();fail(413,'Request is too large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
 let result;try{result=JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Invalid JSON');}if(!result||typeof result!=='object'||Array.isArray(result))fail(400,'Invalid request');return result;
}
export function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
export function owner(user){if(user?.role!=='Owner')fail(403,'Owner access required');}
export function access(user,id){return !!user&&(user.role==='Owner'||(!registry.apps.find(a=>a.id===id)?.ownerOnly&&(user.appIds||[]).includes(id)));}
export function requireApp(user,id){if(!user)fail(401,'Please sign in');if(!access(user,id))fail(403,'App access is not enabled for your account');}
