// Explicit operator tool. Creates a separate fictional workspace through the
// normal administration and validated business APIs; never resets existing data.
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function seedDemo({origin,adminEmail,adminPassword,adminCookie,demoPassword,request=fetch,onCheckpoint=async()=>{}}){
 if(demoPassword!==undefined&&(typeof demoPassword!=='string'||demoPassword.length<12||demoPassword.length>128))throw Error('Demo password must contain 12–128 characters');
 const sessions=new Set(),accounts=[['Owner','batch.demo.owner@sushantsynapse.com'],['Collector','batch.demo.collector@sushantsynapse.com']].map(([role,email])=>({role,email,password:demoPassword??randomBytes(18).toString('base64url')+'!aA3'}));
 const call=async(route,{cookie='',body,status=200}={})=>{
  const response=await request(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(response.status!==status)throw Error(`${route}: ${response.status} ${data.error||'Unexpected response'}`);
  return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
 };
 const login=async account=>{const result=await call('/api/auth/login',{body:{email:account.email,password:account.password}});if(!result.cookie)throw Error('No sign-in session returned');sessions.add(result.cookie);return result.cookie;};
 try{
  const admin=adminCookie||await login({email:adminEmail,password:adminPassword});
  const index=(await call('/api/organisation-admin',{cookie:admin})).data;
  if(!index.superAdmin)throw Error('Super Admin access required');
  const name='DEMO BatchFee Lite - fictional sample data';
  if(index.organisations.some(org=>org.name===name))throw Error('Demo organisation already exists; refusing to overwrite it');
  const licence={appId:'batchfee-lite',status:'Active',startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+30*86400000).toISOString(),readOnlyUntil:null,staffLimit:2,clientLimit:0};
  const {data:created}=await call('/api/organisation-admin/provision',{cookie:admin,status:201,body:{newAccount:true,name,type:'Education',timezone:'Asia/Kolkata',masterAdminEmail:accounts[0].email,staffLimit:2,clientLimit:0,licences:[licence]}});
  const organisationId=created.organisationId,route='/api/organisation-admin/organisations/'+organisationId;
  await onCheckpoint({origin,organisationId,accounts,status:'Setup in progress; preserve existing state before retrying.'});
  await call('/api/organisation-admin/activate-new-master',{body:{token:created.invitation.token,email:accounts[0].email,name:'Demo Academy Owner',password:accounts[0].password}});
  const overview=async()=>(await call(route,{cookie:admin})).data;
  const change=async(action,body,status=200)=>{const current=await overview();return (await call(route+'/'+action,{cookie:admin,status,body:{version:current.organisation.version,reason:'User-requested fictional BatchFee demo; no real fees or payments',...body}})).data;};
  let current=await overview();accounts[0].userId=current.organisation.masterAdminUserId;
  await change('assignment',{appId:'batchfee-lite',userId:accounts[0].userId,role:'Owner',status:'Active'});
  const invitation=await change('invite',{newAccount:true,email:accounts[1].email,role:'Staff'},201);
  await call('/api/organisation-admin/activate-new-member',{body:{token:invitation.invitation.token,email:accounts[1].email,name:'Demo Fee Collector',password:accounts[1].password}});
  current=await overview();accounts[1].userId=current.members.find(member=>member.email===accounts[1].email)?.userId;
  if(!accounts[1].userId)throw Error('Demo membership missing');
  await change('assignment',{appId:'batchfee-lite',userId:accounts[1].userId,role:'Collector',status:'Active'});
  const owner=await login(accounts[0]),collector=await login(accounts[1]);
  const endpoint='/api/batchfee-lite/organisations/'+organisationId;
  const read=async(cookie=owner)=>(await call(endpoint,{cookie})).data;
  const command=async(type,input)=>{const state=await read();return (await call(endpoint+'/command',{cookie:owner,body:{revision:state.revision,requestId:randomUUID(),type,input}})).data;};
  await command('profile',{name:'DEMO Academy - fictional',owner:'Demo Teacher',mobile:'0000000000',address:'Fictional classroom; no real services or money due',dueDay:5,currency:'INR',sessionMonth:4});
  for(const [name,fee] of [['DEMO Mathematics','1500'],['DEMO English','1000']])await command('batch',{name,subject:name,teacher:'Demo Teacher',days:'Mon, Wed, Fri',startTime:'16:00',endTime:'17:00',fee,frequency:'Monthly',dueDay:5,active:true});
  const batches=(await read()).batches,day=(await read()).today;
  for(const [n,name] of ['DEMO Aarav','DEMO Diya','DEMO Kabir','DEMO Meera'].entries())await command('student',{name,parent:'Demo Parent',mobile:'0000000000',joining:day.slice(0,7)+'-01',notes:'Fictional student for testing only. No contact or payment required.',status:'Active',enrolments:[{batchId:batches[n%2].id}]});
  const students=(await read()).students;
  await command('payment',{studentId:students[0].id,amount:'1500',date:day,mode:'Cash',note:'DEMO full payment; no money received'});
  await command('payment',{studentId:students[1].id,amount:'400',date:day,mode:'UPI',note:'DEMO partial payment; no money received'});
  await command('expense',{amount:'250',date:day,category:'Stationery',note:'DEMO expense; no money spent'});
  const state=await read(collector);
  if(state.accessRole!=='Collector'||state.students.length!==4||state.payments.length!==2)throw Error('Demo verification failed');
  for(const cookie of [owner,collector]){const denied=await request(origin+'/api/chambers/'+organisationId+'/state',{headers:{Cookie:cookie}});if(denied.status!==403)throw Error('Demo user unexpectedly has Chambers access');}
  return {origin,organisationId,loginUrl:origin+'/signin?next=batchfee-lite',accounts,examples:{batches:2,students:4,payments:2,expenses:1},notice:'Fictional demonstration only; no real fees, receipts or payment collection.'};
 }finally{for(const cookie of sessions)try{await call('/api/auth/logout',{cookie,body:{}});}catch{}}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(!process.argv.includes('--apply'))throw Error('Use --apply with administrator credentials on stdin');
  let input='';for await(const chunk of process.stdin)input+=chunk;const settings=JSON.parse(input);input='';
  const origin=settings.origin||'https://apps.sushantsynapse.com';if(!['apps.sushantsynapse.com','127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Unexpected origin');
  const folder=path.resolve('.publish'),file=path.join(folder,'batchfee-demo-access.json');await mkdir(folder,{recursive:true});
  try{await readFile(file);throw Error('Credential file already exists; refusing to overwrite demo access');}catch(error){if(error.code!=='ENOENT')throw error;}
  const result=await seedDemo({...settings,origin,onCheckpoint:checkpoint=>writeFile(file,JSON.stringify(checkpoint,null,2),{mode:0o600,flag:'wx'})});
  await writeFile(file,JSON.stringify(result,null,2),{mode:0o600});console.log('Demo ready. Credentials saved privately under .publish/');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
