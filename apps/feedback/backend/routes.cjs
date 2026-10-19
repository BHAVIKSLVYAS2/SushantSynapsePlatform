const {Readable}=require('node:stream');
function createFeedback({store,auth}){
 const buckets=new Map();
 return async(req,res,origin)=>{
  const {feedback,storageKey,empty}=await import('./service.mjs'),user=auth.session(req);
  const canModerate=!!user&&(process.env.ORG_ADMIN_PREVIEW==='1'?store.nativeSqlite.prepare('SELECT active FROM platform_super_admins WHERE userId=?').get(user.id)?.active===1:user.role==='Owner');
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await feedback(request,{canModerate,read:async()=>store.setting(storageKey),write:async(next,version)=>store.transaction(()=>{if((store.setting(storageKey)||empty()).version!==version)throw Object.assign(Error('Feedback changed. Please refresh and try again.'),{status:409});store.setSetting(storageKey,next);}),limit:async()=>{const minute=Math.floor(Date.now()/60000);for(const [key,b]of buckets)if(b.minute!==minute)buckets.delete(key);const key=req.socket.remoteAddress;if(!buckets.has(key)){if(buckets.size>=10000)return {success:false};buckets.set(key,{minute,count:0});}return {success:++buckets.get(key).count<=12};}});
  for(const [name,value]of response.headers)res.setHeader(name,value);res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));
 };
}
module.exports={createFeedback};
