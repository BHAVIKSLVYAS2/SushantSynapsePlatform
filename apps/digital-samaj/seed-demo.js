'use strict';
// Always creates a new temporary workspace. Never opens data/chambers.sqlite.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{randomBytes}=require('node:crypto'),{Readable}=require('node:stream');
const {Store}=require('../advocate/backend/store');
const {createAuth}=require('../../packages/auth');
const {createDigitalSamaj}=require('./backend/routes');
async function seed(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'digital-samaj-demo-')),store=new Store(root),auth=createAuth({store,initializeWorkspace(){}}),handler=createDigitalSamaj({store,auth}),password=randomBytes(18).toString('base64url');
 async function invoke(fn,route,user,body){let result;await fn({route,method:'POST',req:Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]),{headers:{'content-type':'application/json'}}),res:{setHeader(){}},user,json(status,data){if(status>=400)throw Error(data.error);result=data;}});return result;}
 try{
  const setup=await invoke(auth.handle,'auth/setup',null,{name:'Demo Administrator',email:'admin@samaj.example',password});const owner=setup.user;
  const reviewer=await invoke(auth.handle,'users',owner,{name:'Demo Reviewer',email:'reviewer@samaj.example',role:'Advocate',password,appIds:['digital-samaj']});
  const c=await invoke(handler,'digital-samaj',owner,{name:'Demonstration Samaj'}),base='digital-samaj/'+c.id;
  await invoke(handler,base+'/grants',owner,{userId:reviewer.id,role:'SAMAJ_ADMIN',scope:'ALL',scopeValue:''});
  const d=await invoke(handler,base+'/drafts',owner,{});const data={family:{name:'Vyas Family',state:'Gujarat',district:'Surat',nativeVillage:'Demo village',gotra:'Bharadwaj'},head:{englishName:'Ramesh Vyas',hindiName:'रमेश व्यास',dob:'1970-02-12',occupation:'Teacher'},members:[{data:{englishName:'Meera Vyas',hindiName:'मीरा व्यास',dob:'1974-06-01'},type:'MaritalFamily',relationship:'Spouse'},{data:{englishName:'Anjali Vyas',hindiName:'अंजलि व्यास',dob:'2000-08-14'},type:'BirthFamily',relationship:'Child'},{data:{englishName:'Mohan Vyas',hindiName:'मोहन व्यास',isDeceased:true,dob:'1940-01-01',dateOfDeath:'2020-01-01'},type:'BirthFamily',relationship:'Father'}],privacy:{dob:'SAMAJ'}};
  const req=Object.assign(Readable.from([Buffer.from(JSON.stringify({revision:1,step:9,data}))]),{headers:{'content-type':'application/json'}});await handler({route:base+'/drafts/'+d.id,method:'PATCH',req,user:owner,json(){}});
  await invoke(handler,base+'/drafts/'+d.id+'/submit',owner,{revision:2,consent:true});
  for(const r of store.sql.prepare("SELECT id FROM samaj_reviews WHERE status='PENDING'").all())await invoke(handler,base+'/reviews/'+r.id,reviewer,{decision:'APPROVE',reason:'Fictional demonstration information'});
  console.log('Fictional demo created in: '+root);console.log('Accounts: admin@samaj.example and reviewer@samaj.example');console.log('Temporary demo password: '+password);console.log(`PowerShell: $env:DATA_DIR='${root}'; $env:PORT='3012'; npm.cmd start`);
 }finally{store.sql.close();}
}
if(require.main===module)seed().catch(e=>{console.error(e.message);process.exitCode=1;});module.exports={seed};
