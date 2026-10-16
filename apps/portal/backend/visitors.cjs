const {Readable}=require('node:stream');
exports.createVisitors=({store})=>{
 const buckets=new Map();
 return async(req,res,origin)=>{
  const {fail}=require('../../../server/http');
  if(!['GET','POST'].includes(req.method))fail(405,'Method not allowed');
  if(req.method==='POST'){
   const minute=Math.floor(Date.now()/60000),id=req.socket.remoteAddress;
   for(const [key,b]of buckets)if(b.minute!==minute)buckets.delete(key);
   let b=buckets.get(id);if(!b){if(buckets.size>=10000)fail(429,'Please try again later.');b={minute,count:0};buckets.set(id,b);}
   if(++b.count>6)fail(429,'Please try again later.');
  }
  const {visitors,visitorKey}=await import('./visitors.mjs');
  const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
  const response=await visitors(request,{readVisitors:async()=>store.setting(visitorKey),writeVisitors:async(next,previous)=>store.transaction(()=>{if(JSON.stringify(store.setting(visitorKey))!==JSON.stringify(previous))fail(409,'Visitor count changed. Retry.');store.setSetting(visitorKey,next);})});
  for(const [key,value]of response.headers)res.setHeader(key,value);res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));
 };
};
