'use strict';
const {Worker}=require('node:worker_threads'),path=require('node:path'),v8=require('node:v8');
const {configFromEnv}=require('./sqlserver-config');
const {compile}=require('./sqlserver-dialect');
class SqlServerDatabase {
 constructor(options={}){
  this.provider='sqlserver';this.inTransaction=false;this.closed=false;
  const connection=options.connection||configFromEnv();
  this.worker=new Worker(path.join(__dirname,'sqlserver-worker.js'),{workerData:connection});
  this.worker.on('error',()=>{this.closed=true;});this.worker.unref();
  try{this.call('connect');if(options.migrate)this.call('migrate');else this.call('verify');}catch(error){try{this.call('close');}catch{}this.closed=true;void this.worker.terminate();throw error;}
 }
 // Preserve the application's synchronous validation/transaction API during migration.
 // Network IO lives on a dedicated worker; callers block. Use one Node instance initially.
 call(action,payload={}){
  if(this.closed)throw Error('SQL Server connection is closed');
  let memory=new SharedArrayBuffer(1024*1024),header=new Int32Array(memory,0,2);
  this.worker.postMessage({action,payload,memory});
  while(true){
   if(Atomics.wait(header,0,0,45000)==='timed-out'){this.closed=true;void this.worker.terminate();throw Error('SQL Server request timed out; connection discarded');}
   const status=Atomics.load(header,0),length=Atomics.load(header,1);
   if(status===3){if(length>256*1024*1024){this.closed=true;void this.worker.terminate();throw Error('Database result exceeds 256 MB');}memory=new SharedArrayBuffer(length+8);header=new Int32Array(memory,0,2);this.worker.postMessage({action:'result',memory});continue;}
   const value=v8.deserialize(Buffer.from(new Uint8Array(memory,8,length)));
   if(status===2){const error=Error(value.message);error.code=value.code;error.number=value.number;error.status=value.status;throw error;}
   return value;
  }
 }
 prepare(sql){const query=compile(sql);return Object.fromEntries(['get','all','run'].map(method=>[method,(...parameters)=>{if(parameters.length!==query.parameters)throw Error('SQL parameter count mismatch');return this.call('query',{query,parameters,method});}]));}
 exec(sql){
  // Existing initialization batches contain only fixed, registered repository statements.
  for(const part of sql.split(';').map(s=>s.trim()).filter(Boolean))this.prepare(part).run();
 }
 native(sql,parameters=[]){return this.call('native',{sql,parameters});}
 begin(){this.call('begin');this.inTransaction=true;}
 commit(){this.call('commit');this.inTransaction=false;}
 rollback(){try{this.call('rollback');}finally{this.inTransaction=false;}}
 close(){if(this.closed)return;try{this.call('close');}finally{this.closed=true;void this.worker.terminate();}}
}
module.exports={SqlServerDatabase};
