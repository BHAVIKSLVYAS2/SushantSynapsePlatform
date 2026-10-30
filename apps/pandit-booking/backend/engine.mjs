export const roles=['Owner','Dispatcher','Reviewer','Pandit','Customer'];
export const messageLimit=80;
export const empty=()=>({version:0,services:[],profiles:[],bookings:[],reports:[],audit:[],blocked:[]});
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const text=(v,min,max,label)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))fail(400,`${label}: use ${min}–${max} characters`);return v.trim();};
const integer=(v,min,max,label)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail(400,`Invalid ${label}`);return v;};
const choice=(v,list,label)=>{if(!list.includes(v))fail(400,`Invalid ${label}`);return v;};
const fields=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))fail(400,'Unexpected fields');};
const list=(v,max,label)=>{if(!Array.isArray(v)||v.length>max||new Set(v).size!==v.length)fail(400,`Invalid ${label}`);return v.map(x=>text(x,1,100,label));};
const operator=a=>['Owner','Dispatcher'].includes(a.role),reviewer=a=>['Owner','Reviewer'].includes(a.role);
const allow=(a,rs)=>{if(!rs.includes(a.role))fail(403,'This action is not permitted');};
const get=(xs,id)=>{const r=xs.find(x=>x.id===id);if(!r)fail(404,'Not found');return r;};
const interval=(start,end,now)=>{if(typeof start!=='string'||typeof end!=='string'||new Date(Date.parse(start)).toJSON()!==start||new Date(Date.parse(end)).toJSON()!==end)fail(400,'Use valid UTC timestamps');const s=Date.parse(start),e=Date.parse(end);if(!(s>now&&s<now+366*86400000&&e>s&&e-s<=12*3600000))fail(400,'Choose a future interval within one year, up to 12 hours');return {start,end};};
const live=b=>['Requested','Confirmed'].includes(b.status);
const overlap=(a,b,buffer=0)=>Date.parse(a.start)<Date.parse(b.end)+buffer&&Date.parse(b.start)<Date.parse(a.end)+buffer;
const publicProfile=p=>({id:p.id,name:p.name,city:p.city,areas:p.areas,languages:p.languages,serviceIds:p.serviceIds,bio:p.bio,travelKm:p.travelKm,windows:p.windows,status:p.status,approvalLabel:'Profile reviewed by the operator; not a background check'});
function bookingView(b,a){
 const own=b.customerId===a.id,assigned=b.panditId===a.id;
 if(!own&&!operator(a)&&!(assigned&&['Confirmed','Completed','NoShow'].includes(b.status)))return null;
 const sensitive=own||operator(a)||(assigned&&b.status==='Confirmed');
 return {id:b.id,customerName:b.customerName,panditName:b.panditName,service:b.service,start:b.start,end:b.end,timezone:'Asia/Kolkata',city:b.city,area:b.area,mode:b.mode,attendees:b.attendees,language:b.language,status:b.status,createdAt:b.createdAt,quote:b.quote,terms:b.terms,checklist:b.checklist,proposal:b.proposal,events:b.events,messageLimit,messages:b.messages.map(({id,actorId,role,text,at})=>({id,role,text,at,own:actorId===a.id})),review:b.review,...(sensitive?{address:b.address,contact:b.contact,notes:b.notes}:{}),own,assigned};
}
export function view(s,a,publicOnly=false){
 const profiles=s.profiles.filter(p=>p.status==='Approved').map(publicProfile),services=s.services.filter(x=>x.active),reviews=s.bookings.filter(b=>b.review?.status==='Published'&&profiles.some(p=>p.id===b.panditId)).map(b=>({panditId:b.panditId,rating:b.review.rating,text:b.review.text}));
 if(publicOnly)return {services,profiles,reviews};
 const bookings=s.bookings.map(b=>bookingView(b,a)).filter(Boolean),now=Date.now();
 const reminders=bookings.filter(b=>b.status==='Confirmed'&&Date.parse(b.start)>now&&Date.parse(b.start)-now<=86400000).map(b=>({id:b.id,message:'Ceremony within 24 hours. Review your preparation checklist.'}));
 return {version:s.version,role:a.role,userId:a.id,services:operator(a)?s.services:services,profiles:reviewer(a)?s.profiles:s.profiles.filter(p=>p.id===a.id||p.status==='Approved').map(p=>p.id===a.id?p:publicProfile(p)),bookings,reminders,reviewQueue:reviewer(a)?s.bookings.filter(b=>b.review).map(b=>({id:b.id,panditName:b.panditName,review:b.review})):[],reports:operator(a)?s.reports:s.reports.filter(r=>r.actorId===a.id).map(({id,bookingId,reason,status,reply,createdAt})=>({id,bookingId,reason,status,reply,createdAt})),audit:a.role==='Owner'?s.audit.slice(-100).reverse():[],blocked:a.role==='Owner'?s.blocked:[],reviews};
}
export function mutate(state,a,action,input,{now=Date.now(),eligible=()=>true}={}){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Command input must be an object');
 if(!roles.includes(a.role))fail(403,'No booking role');const s=structuredClone(state),at=new Date(now).toISOString(),uid=()=>crypto.randomUUID();let target='';
 const event=(b,type,reason)=>{if(b.events.length>=150)fail(409,'Booking history capacity reached');b.events.push({type,role:a.role,at,...(reason?{reason}:{})});};
 const mine=()=>{const b=get(s.bookings,input.id);if(!bookingView(b,a))fail(404,'Not found');target=b.id;return b;};
 const available=(p,t,except)=>{if(p.status!=='Approved'||!eligible(p.id,'Pandit'))fail(409,'Pandit is not currently available');if(!p.windows.some(w=>w.start<=t.start&&w.end>=t.end))fail(409,'Choose a published available time');if(s.bookings.some(b=>b.id!==except&&b.panditId===p.id&&b.status==='Confirmed'&&overlap(b,t,3600000)))fail(409,'Pandit already has a booking within the one-hour travel buffer');};
 if(action==='service'){
  allow(a,['Owner','Dispatcher']);fields(input,['id','name','description','durationMinutes','preparation','samagri','priceNote','terms','active','modes']);
  const r={id:input.id||uid(),name:text(input.name,2,100,'Puja name'),description:text(input.description,5,1500,'Description'),durationMinutes:integer(input.durationMinutes,30,720,'duration'),preparation:text(input.preparation,0,1500,'Preparation'),samagri:text(input.samagri,0,1500,'Samagri'),priceNote:text(input.priceNote,0,200,'Price basis'),terms:text(input.terms,5,1000,'Cancellation terms'),active:input.active,modes:list(input.modes,2,'mode')};
  if(typeof r.active!=='boolean'||!r.modes.length||r.modes.some(x=>!['At venue','Online'].includes(x)))fail(400,'Choose service modes and publication status');if(input.id)Object.assign(get(s.services,input.id),r);else{if(s.services.length>=40)fail(409,'Service capacity reached');s.services.push(r);}target=r.id;
 }else if(action==='profile'){
  allow(a,['Pandit']);fields(input,['name','city','areas','languages','serviceIds','bio','travelKm']);
  const r={id:a.id,name:text(input.name,2,100,'Display name'),city:text(input.city,2,100,'City'),areas:list(input.areas,12,'service area'),languages:list(input.languages,8,'language'),serviceIds:list(input.serviceIds,40,'service'),bio:text(input.bio,10,1500,'Experience'),travelKm:integer(input.travelKm,0,500,'travel radius'),status:'Pending',windows:s.profiles.find(p=>p.id===a.id)?.windows||[]};
  if(!r.areas.length||!r.languages.length||!r.serviceIds.length||r.serviceIds.some(id=>!s.services.some(x=>x.id===id&&x.active)))fail(400,'Choose active services, languages and areas');const old=s.profiles.find(p=>p.id===a.id);if(old)Object.assign(old,r);else{if(s.profiles.length>=100)fail(409,'Profile capacity reached');s.profiles.push(r);}target=a.id;
 }else if(action==='approve'){
  allow(a,['Owner','Reviewer']);fields(input,['id','status','reason']);const p=get(s.profiles,input.id);if(p.id===a.id)fail(403,'A different reviewer must approve this profile');p.status=choice(input.status,['Approved','Rejected','Suspended'],'approval');p.reviewReason=text(input.reason,5,300,'Review reason');target=p.id;
 }else if(action==='availability'){
  allow(a,['Pandit']);fields(input,['windows']);const p=get(s.profiles,a.id);if(!Array.isArray(input.windows)||input.windows.length>60)fail(400,'Up to 60 availability windows');const windows=input.windows.map(w=>{fields(w,['start','end']);return interval(w.start,w.end,now);}).sort((x,y)=>x.start.localeCompare(y.start));if(windows.some((w,i)=>i&&overlap(w,windows[i-1])))fail(400,'Availability windows overlap');if(s.bookings.some(b=>b.panditId===p.id&&b.status==='Confirmed'&&!windows.some(w=>w.start<=b.start&&w.end>=b.end)))fail(409,'Keep availability for confirmed bookings; reschedule first');p.windows=windows;target=p.id;
 }else if(action==='request'){
  allow(a,['Customer']);fields(input,['requestKey','serviceId','panditId','start','city','area','address','contact','mode','attendees','language','notes','acceptTerms']);const key=text(input.requestKey,16,100,'Request key');if(s.bookings.some(b=>b.customerId===a.id&&b.requestKey===key))return state;if(s.blocked.includes(a.id))fail(403,'Booking requests are restricted. Contact the operator.');if(s.bookings.filter(b=>b.customerId===a.id&&live(b)).length>=5)fail(429,'You already have five active requests');if(s.bookings.length>=400)fail(409,'Booking pilot capacity reached');
  const service=get(s.services,input.serviceId),p=get(s.profiles,input.panditId);if(!service.active||!p.serviceIds.includes(service.id)||!p.languages.includes(input.language))fail(400,'Choose an active service and supported language');if(typeof input.start!=='string'||!Number.isFinite(Date.parse(input.start)))fail(400,'Invalid start time');const times=interval(input.start,new Date(Date.parse(input.start)+service.durationMinutes*60000).toISOString(),now);available(p,times);
  const city=text(input.city,2,100,'City'),area=text(input.area,1,100,'Area'),mode=choice(input.mode,service.modes,'service mode');if(mode==='At venue'&&(city.toLowerCase()!==p.city.toLowerCase()||!p.areas.some(x=>x.toLowerCase()===area.toLowerCase())))fail(400,'Choose a published city and service area');if(input.acceptTerms!==true)fail(400,'Accept the cancellation terms');
  const b={id:uid(),requestKey:key,customerId:a.id,customerName:a.name,panditId:p.id,panditName:p.name,service:{id:service.id,name:service.name,durationMinutes:service.durationMinutes,preparation:service.preparation,samagri:service.samagri,priceNote:service.priceNote},...times,city,area,mode,attendees:integer(input.attendees,1,1000,'attendees'),language:text(input.language,1,100,'language'),address:text(input.address,mode==='At venue'?5:0,600,'Address'),contact:text(input.contact,5,150,'Contact'),notes:text(input.notes,0,1500,'Instructions'),terms:service.terms,quote:'',status:'Requested',createdAt:at,checklist:[],proposal:null,events:[],messages:[],review:null};event(b,'Requested');s.bookings.push(b);target=b.id;
 }else if(action==='confirm'){
  allow(a,['Owner','Dispatcher']);fields(input,['id','quote']);const b=mine();if(b.status!=='Requested')fail(409,'Only a request can be confirmed');if(!eligible(b.customerId,'Customer')||s.blocked.includes(b.customerId))fail(409,'Customer access is unavailable');if(Date.parse(b.start)<=now)fail(409,'The requested time has passed');available(get(s.profiles,b.panditId),b,b.id);b.quote=text(input.quote,1,200,'Agreed scope / quote');b.status='Confirmed';event(b,'Confirmed');
 }else if(action==='cancel'||action==='decline'){
  allow(a,action==='cancel'?['Customer','Owner','Dispatcher']:['Owner','Dispatcher']);fields(input,['id','reason']);const b=mine();if(!live(b)||action==='decline'&&b.status!=='Requested')fail(409,'This action is unavailable');const reason=text(input.reason,3,300,'Reason');b.status=action==='cancel'?'Cancelled':'Declined';b.proposal=null;event(b,b.status,reason);
 }else if(action==='reschedule'){
  allow(a,['Customer','Pandit','Owner','Dispatcher']);fields(input,['id','start','reason']);const b=mine();if(b.status!=='Confirmed')fail(409,'Only confirmed bookings can be rescheduled');if(typeof input.start!=='string'||!Number.isFinite(Date.parse(input.start)))fail(400,'Invalid time');const times=interval(input.start,new Date(Date.parse(input.start)+b.service.durationMinutes*60000).toISOString(),now);available(get(s.profiles,b.panditId),times,b.id);b.proposal={...times,by:a.id,role:a.role,reason:text(input.reason,3,300,'Reason'),expiresAt:new Date(now+48*3600000).toISOString()};event(b,'Reschedule proposed');
 }else if(action==='accept-reschedule'){
  fields(input,['id']);const b=mine(),p=b.proposal;if(b.status!=='Confirmed'||!p||Date.parse(p.expiresAt)<=now||Date.parse(p.start)<=now)fail(409,'No current reschedule proposal');if(p.by===a.id||(p.role==='Customer'?!operator(a):a.id!==b.customerId))fail(403,'The other party must accept this proposal');available(get(s.profiles,b.panditId),p,b.id);b.start=p.start;b.end=p.end;b.proposal=null;event(b,'Rescheduled');
 }else if(action==='complete'||action==='no-show'){
  allow(a,action==='complete'?['Customer','Owner','Dispatcher']:['Owner','Dispatcher']);fields(input,['id']);const b=mine();if(b.status!=='Confirmed'||Date.parse(b.end)>now)fail(409,'The confirmed ceremony must have ended');b.status=action==='complete'?'Completed':'NoShow';b.proposal=null;event(b,b.status);
 }else if(action==='message'){
  fields(input,['id','text']);const b=mine();if(!live(b)||b.messages.length>=messageLimit)fail(409,'Conversation is closed or at capacity');b.messages.push({id:uid(),actorId:a.id,role:a.role,text:text(input.text,1,1500,'Message'),at});
 }else if(action==='checklist'){
  fields(input,['id','items']);const b=mine();if(!live(b))fail(409,'Preparation is closed');if(!Array.isArray(input.items)||input.items.length>40)fail(400,'Up to 40 checklist items');b.checklist=input.items.map(i=>{fields(i,['text','done','responsibility']);if(typeof i.done!=='boolean')fail(400,'Invalid checklist state');return {text:text(i.text,1,150,'Item'),done:i.done,responsibility:choice(i.responsibility,['Customer','Pandit'],'responsibility')};});event(b,'Preparation updated');
 }else if(action==='review'){
  allow(a,['Customer']);fields(input,['id','rating','text']);const b=mine();if(b.status!=='Completed'||b.review)fail(409,'One review per completed booking');b.review={rating:integer(input.rating,1,5,'rating'),text:text(input.text,5,1000,'Review'),status:'Pending'};event(b,'Review submitted');
 }else if(action==='moderate-review'){
  allow(a,['Owner','Reviewer']);fields(input,['id','status']);const b=get(s.bookings,input.id);if(!b.review)fail(404,'No review');b.review.status=choice(input.status,['Published','Hidden'],'review status');target=b.id;
 }else if(action==='report'){
  fields(input,['id','reason']);const b=mine();if(s.reports.filter(r=>r.actorId===a.id&&r.status==='Open').length>=10||s.reports.length>=200)fail(429,'Report capacity reached');s.reports.push({id:uid(),bookingId:b.id,actorId:a.id,reason:text(input.reason,5,1500,'Concern'),status:'Open',reply:'',createdAt:at});
 }else if(action==='resolve-report'){
  allow(a,['Owner','Dispatcher']);fields(input,['id','reply']);const r=get(s.reports,input.id);r.reply=text(input.reply,5,1500,'Reply');r.status='Resolved';target=r.id;
 }else if(action==='block'){
  allow(a,['Owner']);fields(input,['userId','blocked']);const id=text(input.userId,1,200,'Member');if(typeof input.blocked!=='boolean'||id===a.id)fail(400,'Invalid restriction');if(input.blocked&&!s.blocked.includes(id))s.blocked.push(id);if(!input.blocked)s.blocked=s.blocked.filter(x=>x!==id);target=id;
 }else fail(400,'Unknown action');
 if(s.audit.length>=3000)fail(409,'Pilot audit capacity reached');s.audit.push({id:uid(),actorId:a.id,action,target,at});s.version++;if(new TextEncoder().encode(JSON.stringify(s)).length>850000)fail(409,'Pilot workspace capacity reached');return s;
}
