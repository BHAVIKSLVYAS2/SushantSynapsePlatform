import {body,fail,json} from '../../../server/edge-http.mjs';
export const visitorKey='platform-visitors-v1';
// HyperLogLog: bounded aggregate, ~3.25% standard error; no identities retained.
export async function visitors(request,{readVisitors,writeVisitors}){
 const previous=await readVisitors(),saved=previous||{registers:Array(1024).fill(0)};
 const registers=saved.registers.slice();
 function result(){const m=registers.length,zero=registers.filter(v=>v===0).length;
  let estimate=.7213/(1+1.079/m)*m*m/registers.reduce((sum,v)=>sum+2**-v,0);
  if(estimate<=2.5*m&&zero)estimate=m*Math.log(m/zero);
  return json({count:Math.round(estimate),estimated:true});
 }
 if(request.method==='GET')return result();
 const input=await body(request,128);
 if(Object.keys(input).length!==1||typeof input.id!=='string'||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(input.id)||!/^[0-9a-f-]+$/i.test(input.id))fail(400,'Invalid browser identifier.');
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.id.toLowerCase())));
 const index=(bytes[0]<<2)|(bytes[1]>>>6);let rank=1;
 for(let bit=10;bit<256;bit++){if(bytes[bit>>>3]&(1<<(7-(bit%8))))break;rank++;}
 if(rank>registers[index]){registers[index]=rank;await writeVisitors({registers},previous);}
 return result();
}
