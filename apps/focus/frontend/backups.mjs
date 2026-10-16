export function validatePlan(value){
 if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.tasks)||value.tasks.length>500)throw Error('Invalid task backup.');
 const ids=new Set(),days=new Map();
 const tasks=value.tasks.map(t=>{
  if(!t||typeof t.id!=='string'||!t.id||t.id.length>100||ids.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>160||!['High','Normal','Low'].includes(t.priority)||!Number.isInteger(t.minutes)||t.minutes<5||t.minutes>240||typeof t.done!=='boolean'||typeof t.createdAt!=='string'||!Number.isFinite(Date.parse(t.createdAt))||typeof t.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!Number.isFinite(Date.parse(t.date+'T00:00:00Z'))||new Date(t.date+'T00:00:00Z').toISOString().slice(0,10)!==t.date||(t.order!==undefined&&(!Number.isSafeInteger(t.order)||t.order<0)))throw Error('Invalid task in backup. Existing tasks have been kept.');
  ids.add(t.id);days.set(t.date,(days.get(t.date)||0)+1);if(days.get(t.date)>100)throw Error('A day can hold up to 100 tasks.');
  return {id:t.id,title:t.title,date:t.date,priority:t.priority,minutes:t.minutes,done:t.done,createdAt:t.createdAt,...(t.order===undefined?{}:{order:t.order})};
 });return {revision:value.revision,tasks};
}
export function mergeBackup(current,backup){
 if(backup?.format!=='synapse-focus-v1')throw Error('Choose a Focus task backup.');
 const clean=validatePlan(current),incoming=validatePlan(backup.plan),ids=new Map(clean.tasks.map(t=>[t.id,t]));
 for(const task of incoming.tasks){if(ids.has(task.id)){if(JSON.stringify(ids.get(task.id))!==JSON.stringify(task))throw Error('This backup has a different version of an existing task. No tasks were changed.');}else{clean.tasks.push(task);ids.set(task.id,task);}}
 return validatePlan({...clean,revision:current.revision+1});
}
