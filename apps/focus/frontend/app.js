
import {mountFocusTimer} from './focus-timer.mjs';
import {emptyPlan,updatePlan} from './task-model.mjs';
mountFocusTimer();
const $=id=>document.getElementById(id),today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
let plan={revision:0,tasks:[]},storageReady=false,busy=false,selected=null;
$('plan-date').value=today();
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const STORAGE_KEY='synapse-focus-plan-v1';
function readPlan(){
 const raw=localStorage.getItem(STORAGE_KEY);if(raw===null)return emptyPlan();
 const value=JSON.parse(raw);
 if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.tasks)||value.tasks.length>500)throw Error('Stored task data could not be read. Your saved data has been kept.');
 const ids=new Set();for(const task of value.tasks){if(!task||typeof task.id!=='string'||ids.has(task.id)||typeof task.title!=='string'||!task.title.trim()||task.title.length>160||typeof task.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(task.date)||typeof task.createdAt!=='string'||typeof task.done!=='boolean'||!['High','Normal','Low'].includes(task.priority)||!Number.isInteger(task.minutes)||task.minutes<5||task.minutes>240)throw Error('Stored task data could not be read. Your saved data has been kept.');ids.add(task.id);}
 return value;
}

function draw(){
 const day=$('plan-date').value,tasks=plan.tasks.filter(t=>t.date===day),done=tasks.filter(t=>t.done).length,planned=tasks.reduce((n,t)=>n+t.minutes,0),remaining=tasks.filter(t=>!t.done).reduce((n,t)=>n+t.minutes,0);
 $('summary').textContent=storageReady?done+' of '+tasks.length+' complete - '+planned+' min planned - '+remaining+' min remaining':'Tasks save in this browser. No sign-in needed.';
 $('task-list').replaceChildren();$('carry-list').replaceChildren();$('empty-list').hidden=!storageReady||tasks.length>0;
 const sorted=rows=>rows.sort((a,b)=>Number(a.done)-Number(b.done)||['High','Normal','Low'].indexOf(a.priority)-['High','Normal','Low'].indexOf(b.priority)||a.createdAt.localeCompare(b.createdAt));
 function row(task,carry=false){
  const li=node('li',undefined,'task-row'+(task.done?' done':'')+(selected===task.id?' selected':'')),checkbox=node('input');checkbox.type='checkbox';checkbox.checked=task.done;checkbox.disabled=busy;checkbox.setAttribute('aria-label','Complete '+task.title);checkbox.addEventListener('change',()=>command({type:'toggle',id:task.id,done:checkbox.checked}));li.append(checkbox);
  const copy=node('div',undefined,'task-copy');copy.append(node('span',task.title,'task-title'),node('span',task.priority+' priority - '+task.minutes+' min'+(carry?' - '+task.date:''),'task-meta'));const actions=node('div',undefined,'task-actions');
  function button(text,fn){const b=node('button',text);b.type='button';b.disabled=busy;b.addEventListener('click',fn);actions.append(b);}
  if(carry)button('Bring to this day',()=>command({type:'move',id:task.id,date:$('plan-date').value}));
  if(!task.done)button('Focus on this',()=>{selected=task.id;draw();$('startBtn').focus();});
  button('Edit',()=>{const title=prompt('Task title',task.title);if(title!==null)command({type:'rename',id:task.id,title});});
  button('Remove',()=>command({type:'delete',id:task.id}));copy.append(actions);li.append(copy);return li;
 }
 for(const task of sorted(tasks))$('task-list').append(row(task));const carry=sorted(plan.tasks.filter(t=>!t.done&&t.date<day));for(const task of carry)$('carry-list').append(row(task,true));$('carry-section').hidden=!storageReady||carry.length===0;
 const task=plan.tasks.find(t=>t.id===selected&&!t.done);if(!task)selected=null;$('current-task').textContent=task?'Focusing on: '+task.title:'Choose a task, or start an open focus session.';
 $('task-form').querySelector('button[type=submit]').disabled=busy||!storageReady;
}
function command(input){if(busy||!storageReady)return;busy=true;draw();try{
 const current=readPlan();const next=updatePlan(current,{...input,revision:plan.revision});
 localStorage.setItem(STORAGE_KEY,JSON.stringify(next));plan=next;$('task-status').textContent='Saved in this browser.';if(input.type==='add')$('task-form').elements.title.value='';
}catch(e){$('task-status').textContent=e.status?e.message:'Unable to save in browser storage. Your existing tasks have been kept.';if(e.status===409){try{plan=readPlan();}catch{}}}finally{busy=false;draw();}}

$('task-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;command({type:'add',title:form.elements.title.value,date:$('plan-date').value,priority:form.elements.priority.value,minutes:Number(form.elements.minutes.value)});});
$('plan-date').addEventListener('change',()=>{if($('plan-date').value)draw();});$('todayBtn').addEventListener('click',()=>{$('plan-date').value=today();draw();});
function load(){try{plan=readPlan();storageReady=true;}catch{storageReady=false;$('task-status').textContent='Browser storage could not be read. Enable storage or check your saved data, then refresh. Your saved data has been kept.';}draw();}
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY||event.key===null)load();});
load();
