const careModule=await import(typeof document==='undefined'?'../../../packages/care/engine.mjs':'/shared/care-engine.mjs');
const {empty:emptyCare,validate:validateCare,command:careCommand}=careModule;
// Persistence-independent rental ledger. All stored money is integer paise.
const LIMIT=10000000000;
const fail=message=>{throw Error(message);};
const text=(value,label,max=120,optional=false)=>{if(typeof value!=='string'||value.length>max||(!optional&&!value.trim()))fail(`${label} is required (maximum ${max} characters).`);return value.trim();};
const integer=(value,label,min=0,max=LIMIT)=>{if(!Number.isSafeInteger(value)||value<min||value>max)fail(`${label} must be a whole number from ${min} to ${max}.`);return value;};
const choice=(value,values,label)=>{if(!values.includes(value))fail(`Choose a valid ${label}.`);return value;};
const id=value=>{if(typeof value!=='string'||! /^[a-f0-9-]{36}$/.test(value))fail('Invalid record ID.');return value;};
export const today=()=>new Date(Date.now()+19800000).toISOString().slice(0,10);
export function day(value){if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)fail('Enter a valid date between 2000 and 2099.');return value;}
export function month(value){if(typeof value!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value))fail('Enter a valid month between 2000 and 2099.');return value;}
export function paise(value){if(typeof value!=='string'||!/^\d{1,9}(\.\d{1,2})?$/.test(value.trim()))fail('Enter an amount with no more than two decimal places.');const [whole,fraction='']=value.trim().split('.');return integer(Number(whole)*100+Number(fraction.padEnd(2,'0')),'Amount');}
export const money=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value/100);
export const empty=()=>({format:'kiraya-saathi',schemaVersion:2,revision:0,owner:'',properties:[],tenancies:[],bills:[],payments:[],deposits:[],expenses:[],care:emptyCare()});
export const billTotal=b=>b.rent+b.maintenance+b.adjustments.reduce((sum,a)=>sum+a.amount,0);
export const paid=(s,billId)=>s.payments.filter(p=>p.billId===billId&&!p.voidReason).reduce((sum,p)=>sum+p.amount,0);
export const balance=(s,b)=>billTotal(b)-paid(s,b.id);
export const depositBalance=(s,tenancyId)=>s.deposits.filter(d=>d.tenancyId===tenancyId).reduce((sum,d)=>sum+(d.kind==='received'?d.amount:-d.amount),0);
export const dueDate=(s,b)=>`${b.month}-${String(Math.min(s.tenancies.find(t=>t.id===b.tenancyId).dueDay,new Date(Number(b.month.slice(0,4)),Number(b.month.slice(5)),0).getDate())).padStart(2,'0')}`;
export const active=(s,propertyId)=>s.tenancies.find(t=>t.propertyId===propertyId&&!t.end);
const array=(value,max,label)=>{if(!Array.isArray(value)||value.length>max)fail(`Invalid ${label} or record limit exceeded.`);return value;};
const unique=(rows,key,label)=>{if(new Set(rows.map(key)).size!==rows.length)fail(`Duplicate ${label}.`);};
export function validate(input){
 if(!input||input.format!=='kiraya-saathi'||![1,2].includes(input.schemaVersion))fail('Choose a Kiraya Saathi supported backup.');
 if(new TextEncoder().encode(JSON.stringify(input)).length>20000000)fail('Backup exceeds the 20 MB limit.');
 if(input.schemaVersion===2&&!input.care)fail('Maintenance records are missing from this version-2 backup.');
 const s=empty();s.revision=integer(input.revision,'Revision',0,Number.MAX_SAFE_INTEGER);s.owner=text(input.owner,'Owner name',120,true);
 s.properties=array(input.properties,100,'properties').map(p=>({id:id(p.id),name:text(p.name,'Property name'),type:choice(p.type,['flat','shop','home'],'property type'),address:text(p.address,'Address',400,true)}));
 s.tenancies=array(input.tenancies,500,'tenancies').map(t=>({id:id(t.id),propertyId:id(t.propertyId),name:text(t.name,'Tenant name'),phone:text(t.phone,'Phone',30,true),start:day(t.start),end:t.end?day(t.end):null,dueDay:integer(t.dueDay,'Due day',1,31),depositExpected:integer(t.depositExpected,'Agreed deposit'),rates:array(t.rates,200,'rent changes').map(r=>({from:month(r.from),rent:integer(r.rent,'Rent',1),maintenance:integer(r.maintenance,'Maintenance')}))}));
 for(const t of s.tenancies){
  if(!s.properties.some(p=>p.id===t.propertyId)||t.end&&t.end<t.start||!t.rates.length||t.rates[0].from!==t.start.slice(0,7))fail('Invalid property, tenancy dates or initial rent.');
  for(let i=1;i<t.rates.length;i++)if(t.rates[i].from<=t.rates[i-1].from)fail('Rent changes must have unique increasing months.');
 }
 for(let i=0;i<s.tenancies.length;i++)for(let j=i+1;j<s.tenancies.length;j++){const a=s.tenancies[i],b=s.tenancies[j];if(a.propertyId===b.propertyId&&a.start<=(b.end||'2099-12-31')&&b.start<=(a.end||'2099-12-31'))fail('Tenancy dates overlap for this property.');}
 s.bills=array(input.bills,12000,'bills').map(b=>({id:id(b.id),tenancyId:id(b.tenancyId),month:month(b.month),rent:integer(b.rent,'Rent',1),maintenance:integer(b.maintenance,'Maintenance'),adjustments:array(b.adjustments,200,'bill adjustments').map(a=>({amount:integer(a.amount,'Adjustment',-LIMIT),reason:text(a.reason,'Adjustment description',240),date:day(a.date)}))}));
 for(const b of s.bills){const t=s.tenancies.find(t=>t.id===b.tenancyId);if(!t||b.month<t.start.slice(0,7)||t.end&&b.month>t.end.slice(0,7)||billTotal(b)<0||billTotal(b)>LIMIT)fail('Invalid bill period or total.');}
 s.payments=array(input.payments,20000,'payments').map(p=>({id:id(p.id),billId:id(p.billId),amount:integer(p.amount,'Payment',1),date:day(p.date),method:choice(p.method,['UPI','Cash','Bank transfer','Cheque','Other'],'payment method'),reference:text(p.reference,'Reference',120,true),voidReason:text(p.voidReason||'','Void reason',240,true)}));
 if(s.payments.some(p=>!s.bills.some(b=>b.id===p.billId)))fail('Payment references an unknown bill.');
 for(const b of s.bills)if(balance(s,b)<0)fail('Payment exceeds the bill balance.');
 s.deposits=array(input.deposits,10000,'deposit entries').map(d=>({id:id(d.id),tenancyId:id(d.tenancyId),kind:choice(d.kind,['received','refund','deduction'],'deposit action'),amount:integer(d.amount,'Deposit amount',1),date:day(d.date),note:text(d.note,'Deposit note',240)}));
 for(const t of s.tenancies){let held=0;for(const d of s.deposits.filter(d=>d.tenancyId===t.id).sort((a,b)=>a.date.localeCompare(b.date))){held+=d.kind==='received'?d.amount:-d.amount;if(held<0||held>LIMIT)fail('Deposit refund or deduction exceeds the deposit held on that date.');}}
 if(s.deposits.some(d=>!s.tenancies.some(t=>t.id===d.tenancyId)))fail('Unknown deposit tenancy.');
 s.expenses=array(input.expenses,10000,'expenses').map(e=>({id:id(e.id),propertyId:id(e.propertyId),amount:integer(e.amount,'Expense',1),date:day(e.date),note:text(e.note,'Expense description',240)}));
 if(s.expenses.some(e=>!s.properties.some(p=>p.id===e.propertyId)))fail('Unknown expense property.');
 for(const key of ['properties','tenancies','bills','payments','deposits','expenses'])unique(s[key],r=>r.id,key+' IDs');
 unique(s.bills,b=>b.tenancyId+':'+b.month,'monthly bills');s.care=validateCare(input.care,{scopes:s.properties.map(p=>p.id),requireScope:true});for(const v of s.care.visits.filter(v=>v.expenseId)){const expense=s.expenses.find(e=>e.id===v.expenseId),task=s.care.tasks.find(t=>t.id===v.taskId),item=s.care.items.find(i=>i.id===task.itemId);if(!expense||expense.id!==v.id||expense.amount!==v.cost||expense.date!==v.date||expense.propertyId!==item.scopeId)fail('Maintenance expense link does not match its recorded cost.');}return s;
}
const nextMonth=m=>{const n=new Date(m+'-01T00:00:00Z');n.setUTCMonth(n.getUTCMonth()+1);return n.toISOString().slice(0,7);};
function issue(s,through){month(through);if(through>today().slice(0,7))fail('Choose the current month or an earlier month.');for(const t of s.tenancies){const last=t.end&&t.end.slice(0,7)<through?t.end.slice(0,7):through;for(let m=t.start.slice(0,7);m<=last;m=nextMonth(m))if(!s.bills.some(b=>b.tenancyId===t.id&&b.month===m)){const rate=t.rates.filter(r=>r.from<=m).at(-1);s.bills.push({id:crypto.randomUUID(),tenancyId:t.id,month:m,rent:rate.rent,maintenance:rate.maintenance,adjustments:[]});}}}
export function command(input,action,b={}){
 const s=validate(input),newId=()=>crypto.randomUUID(),record=(key,value)=>s[key].find(r=>r.id===value)||fail('Record not found.');
 if(action.startsWith('care.')){s.care=careCommand(s.care,action,b,{scopes:s.properties.map(p=>p.id),requireScope:true});if(action==='care.complete'&&b.recordExpense){const visit=s.care.visits.find(v=>v.id===b.visitId),task=s.care.tasks.find(t=>t.id===visit.taskId),item=s.care.items.find(i=>i.id===task.itemId);if(!visit.cost)fail('Enter a paid cost above zero before recording an owner expense.');s.expenses.push({id:visit.id,propertyId:item.scopeId,amount:visit.cost,date:visit.date,note:'Maintenance: '+task.title});visit.expenseId=visit.id;}}
 else if(action==='owner')s.owner=text(b.owner,'Owner name');
 else if(action==='property.add')s.properties.push({id:newId(),name:text(b.name,'Property name'),type:b.type,address:b.address||''});
 else if(action==='tenancy.add'){
  record('properties',b.propertyId);if(active(s,b.propertyId))fail('Close the current tenancy before adding a new tenant.');
  s.tenancies.push({id:newId(),propertyId:b.propertyId,name:b.name,phone:b.phone||'',start:b.start,end:null,dueDay:b.dueDay,depositExpected:b.depositExpected,rates:[{from:day(b.start).slice(0,7),rent:b.rent,maintenance:b.maintenance}]});
 }else if(action==='bills.ensure')issue(s,b.through);
 else if(action==='bill.adjust'){
  const bill=record('bills',b.billId);integer(b.amount,'Adjustment',-LIMIT);if(!b.amount)fail('Adjustment cannot be zero.');bill.adjustments.push({amount:b.amount,reason:b.reason,date:today()});
 }else if(action==='payment.add'){
  const bill=record('bills',b.billId);integer(b.amount,'Payment',1);if(b.amount>balance(s,bill))fail('Payment exceeds the remaining bill balance.');if(day(b.date)>today())fail('A payment cannot be recorded in the future.');
  s.payments.push({id:newId(),billId:b.billId,amount:b.amount,date:b.date,method:b.method,reference:b.reference||'',voidReason:''});
 }else if(action==='payment.void'){
  const p=record('payments',b.paymentId);if(p.voidReason)fail('Payment is already void.');p.voidReason=text(b.reason,'Void reason',240);
 }else if(action==='deposit.add'){
  record('tenancies',b.tenancyId);if(day(b.date)>today())fail('A deposit entry cannot be in the future.');s.deposits.push({id:newId(),tenancyId:b.tenancyId,kind:b.kind,amount:b.amount,date:b.date,note:b.note});
 }else if(action==='tenancy.close'){
  const t=record('tenancies',b.tenancyId);if(t.end)fail('This tenancy is already closed.');day(b.end);if(b.end<t.start||b.end>today())fail('Move-out must be between the start date and today.');const later=s.bills.filter(bill=>bill.tenancyId===t.id&&bill.month>b.end.slice(0,7));if(later.some(bill=>bill.adjustments.length||s.payments.some(p=>p.billId===bill.id)))fail('A later bill has payment or adjustment history. Review those records before backdating move-out.');s.bills=s.bills.filter(bill=>!later.includes(bill));t.end=b.end;issue(s,b.end.slice(0,7));
 }else if(action==='rent.change'){
  const t=record('tenancies',b.tenancyId);month(b.from);if(t.end||b.from<=t.rates.at(-1).from||s.bills.some(bill=>bill.tenancyId===t.id&&bill.month>=b.from))fail('Choose a later month with no issued bills for this tenancy.');t.rates.push({from:b.from,rent:b.rent,maintenance:b.maintenance});
 }else if(action==='expense.add'){if(day(b.date)>today())fail('An expense cannot be in the future.');s.expenses.push({id:newId(),propertyId:b.propertyId,amount:b.amount,date:b.date,note:b.note});}
 else fail('Unknown rental action.');
 s.revision++;return validate(s);
}
export function receipt(s,paymentId){const p=s.payments.find(p=>p.id===paymentId);if(!p||p.voidReason)fail('Only recorded, non-void payments have receipts.');const bill=s.bills.find(b=>b.id===p.billId),tenant=s.tenancies.find(t=>t.id===bill.tenancyId),property=s.properties.find(r=>r.id===tenant.propertyId);return {owner:s.owner,payment:p,bill,tenant,property,receiptId:'KS-'+p.id};}
