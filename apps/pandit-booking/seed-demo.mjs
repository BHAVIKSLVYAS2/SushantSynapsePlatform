// Explicit operator tool: uses normal governance and booking APIs, never direct SQL.
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function seedDemo({origin,adminEmail,adminPassword,adminCookie,demoPassword,local=false,request=fetch,onProgress=()=>{},onCheckpoint=async()=>{}}){
 if(demoPassword!==undefined&&(typeof demoPassword!=='string'||demoPassword.length<12||demoPassword.length>128))throw Error('Demo password must contain 12–128 characters');
 const sessions=new Set();
 const call=async(route,{cookie='',body,status=200}={})=>{const response=await request(origin+route,{method:body?'POST':'GET',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(response.status!==status)throw Error(`${route}: ${response.status} ${data.error||'Unexpected response'}`);return {data,cookie:response.headers.get('set-cookie')?.split(';')[0]};};
 const login=async(email,password)=>{const result=await call('/api/auth/login',{body:{email,password}});if(!result.cookie)throw Error('No sign-in session returned');sessions.add(result.cookie);return result.cookie;};
 const accounts=[['Operator','booking.demo.operator@sushantsynapse.com'],['Pandit','booking.demo.pandit@sushantsynapse.com'],['Customer','booking.demo.customer@sushantsynapse.com']].map(([role,email])=>({role,email,password:demoPassword??randomBytes(18).toString('base64url')+'!aA3'}));
 let orgId;
 try {
  if(local){
   if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local demo must use localhost');
   if(!(await call('/api/auth/status')).data.setupRequired)throw Error('Local demo requires a fresh empty workspace');
   orgId='local';await onCheckpoint({origin,organisationId:orgId,accounts,status:'Local demo setup in progress'});
   const setup=await call('/api/auth/setup',{status:201,body:{name:'Demo Booking Operator',firmName:'DEMO workspace - fictional data only',email:accounts[0].email,password:accounts[0].password}});if(setup.cookie)sessions.add(setup.cookie);
   const operator=setup.cookie||await login(accounts[0].email,accounts[0].password);
   for(const account of accounts.slice(1)){const created=await call('/api/users',{cookie:operator,status:201,body:{name:'Demo '+account.role+' (fictional)',email:account.email,password:account.password,role:account.role==='Pandit'?'Advocate':'Clerk',appIds:['pandit-booking']}});account.userId=created.data.id;}
  }else{
  const admin=adminCookie||await login(adminEmail,adminPassword);
  const index=(await call('/api/organisation-admin',{cookie:admin})).data;if(!index.superAdmin)throw Error('Super Admin access required');
  const name='DEMO Pandit Booking - fictional sample data';if(index.organisations.some(o=>o.name===name))throw Error('Demo organisation already exists; refusing to overwrite it');
  const licence={appId:'pandit-booking',status:'Active',startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+30*86400000).toISOString(),readOnlyUntil:null,staffLimit:3,clientLimit:2};
  const created=(await call('/api/organisation-admin/provision',{cookie:admin,status:201,body:{newAccount:true,name,type:'Booking',timezone:'Asia/Kolkata',masterAdminEmail:accounts[0].email,staffLimit:3,clientLimit:2,licences:[licence]}})).data;
  orgId=created.organisationId;await onCheckpoint({origin,organisationId:orgId,accounts,status:'Setup in progress; do not overwrite or reset these accounts.'});onProgress({organisationId:orgId,step:'Organisation provisioned'});
  await call('/api/organisation-admin/activate-new-master',{body:{token:created.invitation.token,email:accounts[0].email,name:'Demo Booking Operator',password:accounts[0].password}});
  const route='/api/organisation-admin/organisations/'+orgId;
  const overview=async()=>(await call(route,{cookie:admin})).data;
  const change=async(action,body,status=200)=>{const current=await overview();return (await call(route+'/'+action,{cookie:admin,status,body:{version:current.organisation.version,reason:'User-requested fictional booking demo; no real services',...body}})).data;};
  let current=await overview();await change('assignment',{appId:'pandit-booking',userId:current.organisation.masterAdminUserId,role:'Owner',status:'Active'});
  for(const account of accounts.slice(1)){
   const invitation=await change('invite',{newAccount:true,email:account.email,role:account.role==='Customer'?'Client':'Staff'},201);
   await call('/api/organisation-admin/activate-new-member',{body:{token:invitation.invitation.token,email:account.email,name:'Demo '+account.role+' (fictional)',password:account.password}});
   current=await overview();const member=current.members.find(m=>m.email===account.email);if(!member)throw Error('Demo membership missing');account.userId=member.userId;
   await change('assignment',{appId:'pandit-booking',userId:member.userId,role:account.role,status:'Active'});
  }
  }
  const cookies=[];for(const account of accounts)cookies.push(await login(account.email,account.password));
  const booking='/api/pandit-booking/'+orgId,get=async cookie=>(await call(booking,{cookie})).data;
  const command=async(cookie,action,input)=>{const state=await get(cookie);await call(booking,{cookie,body:{version:state.version,action,input}});return get(cookie);};
  const [operator,pandit,customer]=cookies;
  for(const name of ['Ganesh Puja','Satyanarayan Puja','Griha Pravesh'])await command(operator,'service',{name:'DEMO: '+name,description:'Fictional sample ceremony for testing. No real service is offered.',durationMinutes:60,preparation:'Demo: prepare a clean space and review the checklist.',samagri:'Demo: customer brings flowers; Pandit brings the guide.',priceNote:'Demo only - discuss the scope; no payment is collected.',terms:'DEMO ONLY. No real booking, service or payment. Cancel or reschedule this sample freely.',active:true,modes:['At venue','Online']});
  const services=(await get(operator)).services;
  await command(pandit,'profile',{name:'Demo Pandit (fictional)',city:'Ahmedabad',areas:['Paldi','Satellite'],languages:['Hindi','Gujarati','English'],serviceIds:services.map(s=>s.id),bio:'FICTIONAL DEMO PROFILE. For testing booking screens only; this is not a real provider.',travelKm:20});
  const dates=[5,6,7].map(offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10));
  await command(pandit,'availability',{windows:dates.map(date=>({start:new Date(date+'T09:00:00+05:30').toISOString(),end:new Date(date+'T18:00:00+05:30').toISOString()}))});
  await command(operator,'approve',{id:accounts[1].userId,status:'Approved',reason:'Explicit fictional demo approval only; not identity or background verification.'});
  const examples=[];
  for(let i=0;i<3;i++){
   const before=new Set((await get(customer)).bookings.map(b=>b.id));
   const next=await command(customer,'request',{requestKey:randomUUID(),serviceId:services[i].id,panditId:accounts[1].userId,start:new Date(dates[i]+'T10:00:00+05:30').toISOString(),city:'Ahmedabad',area:'Paldi',mode:'At venue',language:'Hindi',attendees:5,contact:'demo-customer@example.invalid',address:'DEMO ONLY - fictional venue; no visit or travel.',notes:'Fictional sample booking requested by the platform owner for testing.',acceptTerms:true});
   const item=next.bookings.find(b=>!before.has(b.id));if(!item)throw Error('Demo booking not returned');
   if(i===1){await command(operator,'confirm',{id:item.id,quote:'DEMO scope agreed. No real service or payment.'});await command(customer,'checklist',{id:item.id,items:[{text:'Demo flowers',responsibility:'Customer',done:false},{text:'Demo guide',responsibility:'Pandit',done:true}]});await command(pandit,'message',{id:item.id,text:'DEMO: Your sample request is confirmed. Review the preparation checklist.'});}
   if(i===2)await command(customer,'cancel',{id:item.id,reason:'Demo cancellation to demonstrate the booking timeline.'});
   examples.push({id:item.id,date:dates[i],status:i===0?'Requested':i===1?'Confirmed':'Cancelled'});
  }
  for(const cookie of [pandit,customer]){const denied=await request(origin+(local?'/api/state':'/api/chambers/'+orgId+'/state'),{headers:{Cookie:cookie}});if(denied.status!==403)throw Error('Demo user unexpectedly has Chambers access');}
  if(local){
   const create=async(kind,body)=>(await call('/api/'+kind,{cookie:operator,status:201,body})).data;
   const date=offset=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(Date.now()+offset*86400000));
   const client=await create('clients',{name:'DEMO Client - fictional',email:'demo-client@example.invalid'}),matter=await create('cases',{title:'DEMO Client v Sample Respondent',clientId:client.id,court:'DEMO Court - fictional matter',notes:'Fictional case for checking the Chambers interface.'});
   await create('hearings',{caseId:matter.id,date:date(-1),time:'10:00',purpose:'DEMO: record the missing outcome'});await create('hearings',{caseId:matter.id,date:date(3),time:'11:00',purpose:'DEMO: upcoming hearing'});
   await create('tasks',{caseId:matter.id,title:'DEMO overdue filing',due:date(-2),priority:'High'});await create('tasks',{caseId:matter.id,title:'DEMO prepare documents',due:date(2)});
   await create('invoices',{caseId:matter.id,clientId:client.id,description:'DEMO fee only - no money due',amount:2500,date:date(-3),due:date(3)});
  }
  return {origin,organisationId:orgId,local,loginUrl:origin+'/signin?next=pandit-booking',bookingUrl:origin+'/pandit-booking?organisation='+orgId,...(local?{chambersUrl:origin+'/advocate'}:{}),accounts,examples,notice:'Fictional demo only. Completion requires an ended ceremony; future bookings are not fabricated as completed.'};
 }catch(error){if(orgId)onProgress({organisationId:orgId,step:'Partial setup; preserve existing demo state and investigate before retrying'});throw error;}
 finally{for(const cookie of sessions)try{await call('/api/auth/logout',{cookie,body:{}});}catch{}}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(!process.argv.includes('--apply'))throw Error('Use --apply with administrator credentials on stdin; this creates a separate fictional demo organisation.');
  let input='';for await(const chunk of process.stdin)input+=chunk;const settings=JSON.parse(input);input='';
  const origin=settings.origin||'https://apps.sushantsynapse.com',url=new URL(origin);if(!['apps.sushantsynapse.com','127.0.0.1','localhost'].includes(url.hostname))throw Error('Unexpected origin');
  const folder=path.resolve('.publish'),file=path.resolve(folder,settings.local?'pandit-demo-local-access.json':'pandit-demo-access.json');await mkdir(folder,{recursive:true});
  try{await readFile(file);throw Error('Credential file already exists; refusing to overwrite demo access.');}catch(error){if(error.code!=='ENOENT')throw error;}
  const result=await seedDemo({...settings,origin,onCheckpoint:checkpoint=>writeFile(file,JSON.stringify(checkpoint,null,2),{mode:0o600,flag:'wx'}),onProgress:progress=>process.stderr.write(JSON.stringify(progress)+'\n')});await writeFile(file,JSON.stringify(result,null,2),{mode:0o600,flag:'w'});console.log('Demo ready. Credentials saved privately under .publish/');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
