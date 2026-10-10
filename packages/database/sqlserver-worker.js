'use strict';
const thread=require('node:worker_threads'),v8=require('node:v8');
const sidecar=process.argv.includes('--native-sidecar');
let workerData=thread.workerData;
const parentPort=sidecar?{on(name,fn){process.on(name,fn);},close(){process.disconnect();}}:thread.parentPort;
const {migrations}=require('./sqlserver-migrations');
let pool,transaction,sql,pending;
function send(memory,status,value){if(sidecar){process.send({status,value});return;}const bytes=v8.serialize(value),header=new Int32Array(memory,0,2);if(bytes.length>memory.byteLength-8){pending={status,bytes};Atomics.store(header,1,bytes.length);Atomics.store(header,0,3);}else{new Uint8Array(memory,8,bytes.length).set(bytes);Atomics.store(header,1,bytes.length);Atomics.store(header,0,status);}Atomics.notify(header,0);}
function rows(result,hidden=false){return (result.recordset||[]).map(row=>{const copy={...row};for(const [key,col]of Object.entries(result.recordset?.columns||{})){if(['BigInt','Int','SmallInt','TinyInt'].includes(col.type?.name)&&typeof copy[key]==='string'){const value=Number(copy[key]);if(!Number.isSafeInteger(value))throw Error('Integer exceeds safe application range');copy[key]=value;}}if(!hidden)for(const key of ['created_order','case_key','client_key','invoice_key','url_hash','scope_hash','family_key','related_key','type_key','pair_low','pair_high'])delete copy[key];return copy;});}
async function query(text,parameters=[]){text=text.replace(/@p(\d+)\b/g,'@synapse_$1');const request=new sql.Request(transaction||pool);for(let i=0;i<parameters.length;i++){const key='synapse_'+i,value=parameters[i];if(value instanceof Uint8Array)request.input(key,sql.VarBinary(sql.MAX),Buffer.from(value));else if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Nonfinite SQL parameter');request.input(key,Number.isInteger(value)?sql.BigInt:sql.Float,value);}else if(typeof value==='boolean')request.input(key,sql.Bit,value);else if(value===null)request.input(key,sql.NVarChar(sql.MAX),null);else if(typeof value==='string')request.input(key,sql.NVarChar(sql.MAX),value);else throw Error('Unsupported SQL parameter type');}return request.query(text);}
async function begin(){if(transaction)throw Error('Nested database transaction');transaction=new sql.Transaction(pool);await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);try{await query("DECLARE @lock INT; EXEC @lock=sys.sp_getapplock @Resource=N'synapse-platform-writes',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=15000; IF @lock<0 THROW 51001,'Workspace is busy. Retry shortly.',1;");}catch(error){await rollback();throw error;}}
async function rollback(){if(!transaction)return;const old=transaction;transaction=null;try{await old.rollback();}catch(error){if(error.code!=='ENOTBEGUN')throw error;}}
async function commit(){const old=transaction;if(!old)throw Error('No database transaction');try{await old.commit();}finally{transaction=null;}}
async function migrate(){await begin();try{
 await query("IF SCHEMA_ID(N'platform') IS NULL EXEC(N'CREATE SCHEMA [platform] AUTHORIZATION [dbo]'); IF OBJECT_ID(N'[platform].[schema_migrations]',N'U') IS NULL CREATE TABLE [platform].[schema_migrations](id NVARCHAR(100) NOT NULL PRIMARY KEY, hash CHAR(64) NOT NULL, applied_at NVARCHAR(30) NOT NULL);");
 for(const migration of migrations()){const found=(await query('SELECT hash FROM [platform].[schema_migrations] WHERE id=@p0',[migration.id])).recordset[0];if(found){if(found.hash!==migration.hash)throw Error('Applied migration checksum changed: '+migration.id);continue;}await query(migration.source);await query('INSERT INTO [platform].[schema_migrations] VALUES(@p0,@p1,@p2)',[migration.id,migration.hash,new Date().toISOString()]);}
 await commit();return {migrations:migrations().length};
 }catch(error){await rollback();throw error;}}
async function verify(){const exists=(await query("SELECT OBJECT_ID(N'[platform].[schema_migrations]',N'U') AS id")).recordset[0]?.id;if(!exists)throw Error('SQL database is not initialized. Run npm run db:sqlserver:init with migration privileges.');const applied=(await query('SELECT id,hash FROM [platform].[schema_migrations]')).recordset;for(const migration of migrations())if(!applied.some(row=>row.id===migration.id&&row.hash===migration.hash))throw Error('SQL database migration missing or changed: '+migration.id);return true;}
// The optional Windows ODBC addon must run on a process main thread, not a V8 worker.
if(!sidecar&&workerData.driver==='mssql/msnodesqlv8'){
 const child=require('node:child_process').fork(__filename,['--native-sidecar'],{stdio:['ignore','ignore','ignore','ipc'],serialization:'advanced',windowsHide:true});
 let waiting,closing=false;
 child.on('message',({status,value})=>{send(waiting,status,value);if(closing){parentPort.close();}});
 child.on('error',()=>{if(waiting)send(waiting,2,{message:'SQL test driver process failed'});});
 child.on('exit',()=>{if(!closing&&waiting)send(waiting,2,{message:'SQL test driver process exited'});});
 parentPort.on('message',message=>{if(message.action==='result'){const {status,bytes}=pending;pending=null;new Uint8Array(message.memory,8,bytes.length).set(bytes);const header=new Int32Array(message.memory,0,2);Atomics.store(header,1,bytes.length);Atomics.store(header,0,status);Atomics.notify(header,0);return;}waiting=message.memory;closing=message.action==='close';child.send({action:message.action,payload:message.payload,connection:workerData});});
}else parentPort.on('message',async({action,payload={},memory,connection})=>{
 if(sidecar)workerData=connection;
 if(action==='result'){const {status,bytes}=pending;pending=null;new Uint8Array(memory,8,bytes.length).set(bytes);const header=new Int32Array(memory,0,2);Atomics.store(header,1,bytes.length);Atomics.store(header,0,status);Atomics.notify(header,0);return;}
 try{let result;
  if(action==='connect'){sql=require(workerData.driver);pool=await new sql.ConnectionPool(workerData.config).connect();result=true;}
  else if(action==='migrate')result=await migrate();
  else if(action==='verify')result=await verify();
  else if(action==='begin'){await begin();result=true;}
  else if(action==='commit'){await commit();result=true;}
  else if(action==='rollback'){await rollback();result=true;}
  else if(action==='close'){await rollback();await pool.close();result=true;}
  else if(action==='native'){result=rows(await query(payload.sql,payload.parameters),true);}
  else if(action==='query'){
   const automatic=payload.query.write&&!transaction;if(automatic)await begin();
   try{const raw=await query(payload.query.text,payload.parameters);result=payload.method==='run'?{changes:raw.rowsAffected.reduce((sum,n)=>sum+n,0)}:payload.method==='get'?rows(raw)[0]:rows(raw);if(automatic)await commit();}catch(error){if(automatic)await rollback();throw error;}
  }else throw Error('Unknown database action');
  send(memory,1,result);if(action==='close')parentPort.close();
 }catch(error){const duplicate=[2601,2627].includes(error.number);send(memory,2,{message:duplicate?'UNIQUE constraint: This record already exists':error.message,code:error.code,number:error.number,status:duplicate?409:undefined});}
});
