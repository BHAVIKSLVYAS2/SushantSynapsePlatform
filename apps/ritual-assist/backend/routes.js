const {Worker}=require('node:worker_threads'),path=require('node:path');
const {isIP}=require('node:net');
const {readBody,fail}=require('../../../server/http');
function createRitualCalendar(){
 let active=0;const budget=new Map();
 return async({method,req,json})=>{
  if(method!=='POST')fail(405,'Use POST to calculate a remembrance plan');
  const input=await readBody(req,2048),{calendarInput}=await import('./calendar-input.mjs');
  const forwarded=req.headers['cf-connecting-ip'],local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const data=calendarInput(input),now=Date.now(),key=local&&typeof forwarded==='string'&&isIP(forwarded)?forwarded:req.socket.remoteAddress||'local';
  for(const [ip,value]of budget)if(now-value.start>=60000)budget.delete(ip);
  const slot=budget.get(key)||{start:now,count:0};if(slot.count>=6||active>=2||budget.size>=1000&&!budget.has(key))fail(429,'The calendar is busy. Please try again in a minute');slot.count++;budget.set(key,slot);active++;
  try{const result=await new Promise((resolve,reject)=>{
   const worker=new Worker(path.join(__dirname,'calendar-thread.mjs'),{workerData:data});
   const timer=setTimeout(()=>{void worker.terminate();reject(Error('Calculation timed out. Please try again'));},20000);
   worker.once('message',message=>{clearTimeout(timer);void worker.terminate();message.error?reject(Error(message.error)):resolve(message.result);});
   worker.once('error',error=>{clearTimeout(timer);reject(error);});worker.once('exit',()=>{clearTimeout(timer);reject(Error('Calculation interrupted. Please try again'));});
  });return json(200,{result});}finally{active--;}
 };
}
module.exports={createRitualCalendar};
