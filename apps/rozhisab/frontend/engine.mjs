// Integer paise and thousandths of a unit; round half up once per bill component.
export const VERSION=1;
export const icons=['milk','flower','news','home','water','laundry','car','tiffin','service'];
export const today=(now=new Date())=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const fail=message=>{throw new Error(message);};
export function date(value){if(typeof value!=='string'||!/^20\d\d-\d\d-\d\d$/.test(value))fail('Invalid date');const [y,m,d]=value.split('-').map(Number),x=new Date(y,m-1,d,12);if(x.getFullYear()!==y||x.getMonth()!==m-1||x.getDate()!==d)fail('Invalid date');return value;}
export const shift=(value,days)=>{date(value);const [y,m,d]=value.split('-').map(Number);return today(new Date(y,m-1,d+days,12));};
export const daysInMonth=(y,m)=>new Date(y,m,0,12).getDate();
export function period(month,cycle=1){if(!/^20\d\d-\d\d$/.test(month)||!Number.isInteger(cycle)||cycle<1||cycle>28)fail('Invalid billing period');const [y,m]=month.split('-').map(Number);if(m<1||m>12)fail('Invalid billing period');const start=`${month}-${String(cycle).padStart(2,'0')}`,end=shift(today(new Date(y,m,cycle,12)),-1);return {key:start,start,end,month,cycle};}
export function monthShift(month,n){period(month);const [y,m]=month.split('-').map(Number);return today(new Date(y,m-1+n,1,12)).slice(0,7);}
export function currentMonth(day=today(),cycle=1){date(day);return Number(day.slice(-2))<cycle?monthShift(day.slice(0,7),-1):day.slice(0,7);}
export function dates(from,to){date(from);date(to);const out=[];for(let d=from;d<=to;d=shift(d,1))out.push(d);return out;}
export function decimal(raw,digits=2){const s=String(raw).trim();if(!new RegExp('^(0|[1-9]\\d{0,6})(\\.\\d{1,'+digits+'})?$').test(s))fail('Enter a valid non-negative amount or quantity');const [a,b='']=s.split('.');return Number(a)*10**digits+Number(b.padEnd(digits,'0'));}
export const quantity=raw=>decimal(raw,3);
export const money=(paise,lang='en')=>new Intl.NumberFormat({en:'en-IN',hi:'hi-IN',gu:'gu-IN'}[lang]||'en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2}).format(paise/100);
export const units=q=>String(q/1000);
const round=(n,d)=>{const value=(BigInt(n)+BigInt(d)/2n)/BigInt(d);if(value>BigInt(Number.MAX_SAFE_INTEGER))fail('Amount exceeds safe billing limits');return Number(value);};
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(value)?value:fail('Invalid record identifier');
const label=(v,max=80)=>typeof v==='string'&&v.trim().length<=max?v.trim():fail('Invalid text');
export function emptyState(){return {version:VERSION,revision:0,services:[],entries:{},pauses:[],payments:[],closed:{},settings:{cycleDay:1,language:'en',reminder:false}};}
export function config(raw){
 const name=label(raw.name);if(!name)fail('Service name is required');const start=date(raw.start),end=raw.end?date(raw.end):'';if(end&&end<start)fail('End date must follow start date');
 const schedule=raw.schedule;if(!['daily','weekly','weekdays','monthly'].includes(schedule))fail('Choose a schedule');
 const weekdays=Array.isArray(raw.weekdays)?[...new Set(raw.weekdays.map(Number))].sort():[];
 if(weekdays.some(n=>!Number.isInteger(n)||n<0||n>6)||(['weekly','weekdays'].includes(schedule)&&!weekdays.length)||(schedule==='weekly'&&weekdays.length!==1))fail('Choose the scheduled weekdays');
 const monthDay=Number(raw.monthDay||1);if(!Number.isInteger(monthDay)||monthDay<1||monthDay>31)fail('Monthly day must be 1–31');
 const billing=raw.billing;if(!['quantity','monthly'].includes(billing))fail('Choose a billing method');const policy=raw.policy||'none';if(!['none','perVisit','proportional'].includes(policy))fail('Choose an absence rule');
 const paidLeaves=Number(raw.paidLeaves||0);if(!Number.isInteger(paidLeaves)||paidLeaves<0||paidLeaves>366)fail('Invalid paid leave allowance');
 const q=quantity(raw.quantity),rate=decimal(raw.rate),deduction=decimal(raw.deduction||0);if(q<=0)fail('Default quantity must be greater than zero');
 return {name,vendor:label(raw.vendor||''),icon:icons.includes(raw.icon)?raw.icon:'service',start,end,schedule,weekdays,monthDay,billing,policy,paidLeaves,quantity:q,rate,deduction,unit:label(raw.unit||'unit',24)||'unit',active:raw.active!==false};
}
export function configuration(service,day){return service.revisions.filter(r=>r.from<=day).at(-1)||null;}
export const entryKey=(serviceId,day)=>serviceId+'@'+day;
export function delivery(state,service,day,asOf=today()){
 date(day);const c=configuration(service,day),future=day>asOf,paused=state.pauses.some(p=>p.serviceId===service.id&&p.from<=day&&p.to>=day),within=!!c&&c.active&&c.start<=day&&(!c.end||c.end>=day);
 const [y,m,d]=day.split('-').map(Number),weekday=new Date(y,m-1,d,12).getDay();
 const scheduled=within&&!paused&&(c.schedule==='daily'||(['weekly','weekdays'].includes(c.schedule)&&c.weekdays.includes(weekday))||(c.schedule==='monthly'&&d===Math.min(c.monthDay,daysInMonth(y,m))));
 const override=state.entries[entryKey(service.id,day)],q=future||!within||paused?0:override??(scheduled?c.quantity:0);
 return {config:c,scheduled,future,paused,quantity:q,status:future?'future':paused?'paused':scheduled?(q===0?'absent':q>c.quantity?'extra':'delivered'):q>0?'extra':'unscheduled'};
}
export function bill(state,service,p,asOf=today()){
 const frozen=state.closed[p.key]?.bills.find(b=>b.serviceId===service.id);if(frozen)return structuredClone(frozen);
 const end=p.end<asOf?p.end:asOf,all=dates(p.start,p.end),rows=end>=p.start?dates(p.start,end).map(day=>({date:day,...delivery(state,service,day,asOf)})):[];
 let variable=0n,salary=0n,deductionNumerator=0n,perVisit=0n,absentIndex=0,totalQuantity=0,extras=0,delivered=0,absent=0;
 const expected=all.filter(d=>delivery(state,service,d,p.end).scheduled).length;
 for(const row of rows){const c=row.config;if(!c)continue;const inRange=c.active&&c.start<=row.date&&(!c.end||c.end>=row.date);
  if(row.scheduled&&row.quantity===0)absent++;if(row.quantity>0)delivered++;totalQuantity+=row.quantity;extras+=Math.max(0,row.quantity-(row.scheduled?c.quantity:0));
  if(c.billing==='quantity')variable+=BigInt(row.quantity)*BigInt(c.rate);
  else if(inRange){salary+=BigInt(c.rate);if(row.scheduled&&!row.quantity){absentIndex++;if(absentIndex>c.paidLeaves){if(c.policy==='perVisit')perVisit+=BigInt(c.deduction);if(c.policy==='proportional'&&expected)deductionNumerator+=BigInt(c.rate);}}}
 }
 const quantityCharge=round(variable,1000),salaryCharge=round(salary,all.length),deductions=Math.min(salaryCharge,Number(perVisit)+round(deductionNumerator,expected||1)),last=configuration(service,end)||service.revisions[0];
 return {serviceId:service.id,name:last.name,vendor:last.vendor,unit:last.unit,period:p,through:end,delivered,absent,quantity:totalQuantity,extraQuantity:extras,quantityCharge,salaryCharge,deductions,total:quantityCharge+salaryCharge-deductions,rates:[...new Set(rows.filter(r=>r.config).map(r=>r.config.rate))],rows:rows.map(r=>({date:r.date,status:r.status,quantity:r.quantity,rate:r.config?.rate||0,billing:r.config?.billing||'quantity',scheduled:r.scheduled}))};
}
export function summary(state,p,asOf=today()){
 const bills=state.services.filter(s=>s.revisions[0].from<=p.end).map(service=>{
  const b=bill(state,service,p,asOf);let prior=service.opening||0,month=currentMonth(service.revisions[0].from,p.cycle);
  while(period(month,p.cycle).start<p.start){prior+=bill(state,service,period(month,p.cycle),asOf).total;month=monthShift(month,1);}
  const priorPaid=state.payments.filter(x=>x.serviceId===service.id&&x.date<p.start).reduce((n,x)=>n+x.amount,0),paid=state.payments.filter(x=>x.serviceId===service.id&&x.date>=p.start&&x.date<=p.end&&x.date<=asOf).reduce((n,x)=>n+x.amount,0),carry=prior-priorPaid;
  return {...b,carry,paid,balance:carry+b.total-paid};
 });return {period:p,bills,total:bills.reduce((n,b)=>n+b.total,0),carry:bills.reduce((n,b)=>n+b.carry,0),paid:bills.reduce((n,b)=>n+b.paid,0),balance:bills.reduce((n,b)=>n+b.balance,0),closed:!!state.closed[p.key]};
}
export function locked(state,day){return Object.values(state.closed).some(x=>x.period.start<=day&&x.period.end>=day);}
function writable(state,from,to=from){if(Object.values(state.closed).some(x=>from<=x.period.end&&to>=x.period.start))fail('Reopen the closed bill before changing these dates');}
export function command(original,type,data,asOf=today()){
 const state=structuredClone(original),find=serviceId=>state.services.find(s=>s.id===serviceId)||fail('Service not found');date(asOf);
 if(type==='service'){
  const c=config(data.config),from=date(data.from);if(from>c.start&&!data.id)fail('A new service must be effective by its start date');if(Object.values(state.closed).some(x=>x.period.end>=from))fail('Changes must start after the last closed bill, or reopen it first');
  if(data.id){const s=find(data.id);if(from<s.revisions[0].from)fail('Changes cannot precede the service history');s.revisions=s.revisions.filter(r=>r.from!==from);s.revisions.push({...c,from});s.revisions.sort((a,b)=>a.from.localeCompare(b.from));}
  else{const key=id(data.newId);if(state.services.some(s=>s.id===key))fail('Duplicate service');state.services.push({id:key,opening:decimal(data.opening||0),revisions:[{...c,from}]});}
 }else if(type==='attendance'){
  const s=find(data.serviceId),from=date(data.from),to=date(data.to||from);if(to<from||dates(from,to).length>366)fail('Choose up to 366 dates');writable(state,from,to);if(to>asOf)fail('Future deliveries cannot be billed');const q=quantity(data.quantity);
  for(const d of dates(from,to)){const item=delivery(state,s,d,asOf);if(!item.config||!item.config.active||d<item.config.start||(item.config.end&&d>item.config.end)||item.paused)continue;if(data.scheduledOnly&&!item.scheduled)continue;if(data.reset)delete state.entries[entryKey(s.id,d)];else state.entries[entryKey(s.id,d)]=q;}
 }else if(type==='pause'){
  find(data.serviceId);const from=date(data.from),to=date(data.to);if(to<from)fail('Pause end must follow its start');writable(state,from,to);if(state.pauses.some(p=>p.id===data.id))fail('Duplicate pause');state.pauses.push({id:id(data.id),serviceId:data.serviceId,from,to});
 }else if(type==='removePause'){
  const p=state.pauses.find(p=>p.id===data.id)||fail('Pause not found');writable(state,p.from,p.to);state.pauses=state.pauses.filter(p=>p.id!==data.id);
 }else if(type==='payment'){
  const s=find(data.serviceId),d=date(data.date);if(d>asOf||d<s.revisions[0].from)fail('Payment date must be within service history and not in the future');writable(state,d);const amount=decimal(data.amount);if(!amount)fail('Payment must be greater than zero');if(!['cash','upi','other'].includes(data.method))fail('Choose a payment method');const key=id(data.id);if(state.payments.some(x=>x.id===key))fail('Duplicate payment');state.payments.push({id:key,serviceId:s.id,date:d,amount,method:data.method,note:label(data.note||'',240)});
 }else if(type==='removePayment'){
  const p=state.payments.find(p=>p.id===data.id)||fail('Payment not found');writable(state,p.date);state.payments=state.payments.filter(p=>p.id!==data.id);
 }else if(type==='close'){
  const p=period(data.month,state.settings.cycleDay);if(p.end>=asOf)fail('Only completed billing periods can be closed');if(state.closed[p.key])fail('This bill is already closed');state.closed[p.key]={period:p,bills:state.services.filter(s=>s.revisions[0].from<=p.end).map(s=>bill(state,s,p,asOf)),closedAt:asOf};
 }else if(type==='reopen'){
  const p=period(data.month,state.settings.cycleDay);if(Object.values(state.closed).some(x=>x.period.start>p.start))fail('Reopen later bills first');delete state.closed[p.key];
 }else if(type==='settings'){
  const day=Number(data.cycleDay);if(!Number.isInteger(day)||day<1||day>28)fail('Billing cycle starts on day 1–28');if(day!==state.settings.cycleDay&&Object.keys(state.closed).length)fail('Reopen all bills before changing the billing cycle');state.settings={cycleDay:day,language:['en','hi','gu'].includes(data.language)?data.language:'en',reminder:!!data.reminder};
 }else fail('Unknown change');state.revision=original.revision+1;return state;
}
export function validateBackup(input){
 if(!input||input.version!==VERSION||!Array.isArray(input.services)||!Array.isArray(input.payments)||!Array.isArray(input.pauses)||!input.entries||!input.closed)fail('Unsupported or invalid RozHisab backup');const state=emptyState(),seen=new Set();
 for(const raw of input.services){const key=id(raw.id);if(seen.has(key)||!Array.isArray(raw.revisions)||!raw.revisions.length)fail('Invalid or duplicate service');seen.add(key);const revisions=raw.revisions.map(r=>({...config({...r,quantity:units(r.quantity),rate:r.rate/100,deduction:r.deduction/100}),from:date(r.from)}));for(let i=1;i<revisions.length;i++)if(revisions[i].from<=revisions[i-1].from)fail('Invalid service history');if(revisions[0].from>revisions[0].start)fail('Invalid service start');if(!Number.isSafeInteger(raw.opening)||raw.opening<0)fail('Invalid opening balance');state.services.push({id:key,opening:decimal(raw.opening/100),revisions});}
 const unique=new Set();for(const raw of input.payments){if(unique.has(raw.id))fail('Duplicate payment');unique.add(raw.id);const s=state.services.find(s=>s.id===raw.serviceId);if(!s||!Number.isSafeInteger(raw.amount)||raw.amount<=0||!['cash','upi','other'].includes(raw.method))fail('Invalid payment');const d=date(raw.date);if(d<s.revisions[0].from||d>today())fail('Invalid payment date');state.payments.push({id:id(raw.id),serviceId:s.id,date:d,amount:decimal(raw.amount/100),method:raw.method,note:label(raw.note||'',240)});}
 for(const [key,q]of Object.entries(input.entries)){const [serviceId,d,...rest]=key.split('@');if(rest.length||!seen.has(serviceId)||!Number.isSafeInteger(q)||q<0)fail('Invalid attendance');date(d);if(d>today())fail('Future attendance is not allowed');state.entries[entryKey(serviceId,d)]=quantity(units(q));}
 const pauseIds=new Set();for(const raw of input.pauses){if(!seen.has(raw.serviceId)||date(raw.to)<date(raw.from)||pauseIds.has(raw.id))fail('Invalid pause');pauseIds.add(raw.id);state.pauses.push({id:id(raw.id),serviceId:raw.serviceId,from:raw.from,to:raw.to});}
 state.settings=command(state,'settings',input.settings||{cycleDay:1},today()).settings;
 for(const [key,value]of Object.entries(input.closed).sort(([a],[b])=>a.localeCompare(b))){const p=period(value.period?.month,state.settings.cycleDay);if(p.key!==key||p.end>=today())fail('Invalid closed period');const bills=state.services.filter(s=>s.revisions[0].from<=p.end).map(s=>bill(state,s,p,p.end));if(JSON.stringify(bills)!==JSON.stringify(value.bills))fail('Closed bill does not match its history');state.closed[key]={period:p,bills,closedAt:date(value.closedAt)};}
 if(!Number.isSafeInteger(input.revision)||input.revision<0)fail('Invalid backup revision');state.revision=input.revision;return state;
}
