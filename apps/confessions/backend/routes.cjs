const {Readable}=require('node:stream');
function createConfessions({store,auth}){
 const buckets=new Map();
 return async(req,res,origin)=>{
  const {confessions,storageKey,empty}=await import('./service.mjs');
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await confessions(request,{user:auth.session(req),read:async()=>store.setting(storageKey),write:async(next,version)=>store.transaction(()=>{if((store.setting(storageKey)||empty()).version!==version)throw Object.assign(Error('Confessions changed. Please try again.'),{status:409});store.setSetting(storageKey,next);}),limit:async()=>{const minute=Math.floor(Date.now()/60000);for(const [id,bucket]of buckets)if(bucket.minute!==minute)buckets.delete(id);const id=req.socket.remoteAddress;if(!buckets.has(id)){if(buckets.size>=10000)return {success:false};buckets.set(id,{minute,count:0});}return {success:++buckets.get(id).count<=6};}});
  for(const [name,value]of response.headers)res.setHeader(name,value);res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));
 };
}
module.exports={createConfessions};
