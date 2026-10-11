
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export const emptyPlan=()=>({revision:0,tasks:[]});
export function updatePlan(current,input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Invalid task command');
 if(!Number.isSafeInteger(input.revision)||input.revision!==current.revision)fail(409,'Your task list changed. Reload and try again.');
 const plan=structuredClone(current);
 const date=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)fail(400,'Choose a valid date');return value;};
 const title=value=>{if(typeof value!=='string'||!value.trim()||value.trim().length>160)fail(400,'Enter a task of up to 160 characters');return value.trim();};
 if(input.type==='add'){
  if(plan.tasks.length>=500)fail(409,'Your list holds up to 500 tasks. Remove older completed tasks first.');
  const day=date(input.date);if(plan.tasks.filter(t=>t.date===day).length>=100)fail(409,'Plan up to 100 tasks per day.');
  if(!['High','Normal','Low'].includes(input.priority))fail(400,'Choose a valid priority');
  if(!Number.isInteger(input.minutes)||input.minutes<5||input.minutes>240)fail(400,'Estimate between 5 and 240 minutes');
  plan.tasks.push({id:crypto.randomUUID(),title:title(input.title),date:day,priority:input.priority,minutes:input.minutes,done:false,createdAt:new Date().toISOString()});
 }else{
  const task=plan.tasks.find(t=>t.id===input.id);if(!task)fail(404,'Task not found');
  if(input.type==='toggle'){if(typeof input.done!=='boolean')fail(400,'Choose a completion state');task.done=input.done;}
  else if(input.type==='rename')task.title=title(input.title);
  else if(input.type==='move'){const day=date(input.date);if(day!==task.date&&plan.tasks.filter(t=>t.date===day).length>=100)fail(409,'Plan up to 100 tasks per day.');task.date=day;}
  else if(input.type==='delete')plan.tasks=plan.tasks.filter(t=>t.id!==task.id);
  else fail(400,'Unknown task command');
 }
 plan.revision++;return plan;
}
