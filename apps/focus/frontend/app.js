
import {mountFocusTimer} from './focus-timer.mjs';
mountFocusTimer();
const $=id=>document.getElementById(id),today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
let plan={revision:0,tasks:[]},signedIn=false,busy=false,selected=null;
$('plan-date').value=today();
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
async function api(method='GET',input){const r=await fetch('/api/focus',{method,headers:{'Content-Type':'application/json'},body:input?JSON.stringify(input):undefined});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'Unable to save tasks'),{status:r.status});return data;}
function draw(){
 const day=$('plan-date').value,tasks=plan.tasks.filter(t=>t.date===day),done=tasks.filter(t=>t.done).length,planned=tasks.reduce((n,t)=>n+t.minutes,0),remaining=tasks.filter(t=>!t.done).reduce((n,t)=>n+t.minutes,0);
 $('summary').textContent=signedIn?done+' of '+tasks.length+' complete - '+planned+' min planned - '+remaining+' min remaining':'Sign in to save your personal task list.';
 $('task-list').replaceChildren();$('carry-list').replaceChildren();$('empty-list').hidden=!signedIn||tasks.length>0;
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
 for(const task of sorted(tasks))$('task-list').append(row(task));const carry=sorted(plan.tasks.filter(t=>!t.done&&t.date<day));for(const task of carry)$('carry-list').append(row(task,true));$('carry-section').hidden=!signedIn||carry.length===0;
 const task=plan.tasks.find(t=>t.id===selected&&!t.done);if(!task)selected=null;$('current-task').textContent=task?'Focusing on: '+task.title:'Choose a task, or start an open focus session.';
 $('task-form').querySelector('button[type=submit]').disabled=busy;
}
async function command(input){if(busy||!signedIn)return;busy=true;draw();$('task-status').textContent='Saving-';try{plan=await api('POST',{...input,revision:plan.revision});$('task-status').textContent='Saved.';if(input.type==='add')$('task-form').elements.title.value='';}catch(e){$('task-status').textContent=e.message;if(e.status===409){try{plan=await api();}catch{}}if(e.status===401){signedIn=false;$('task-form').hidden=true;$('signin-note').hidden=false;plan={revision:0,tasks:[]};}}finally{busy=false;draw();}}
$('task-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;command({type:'add',title:form.elements.title.value,date:$('plan-date').value,priority:form.elements.priority.value,minutes:Number(form.elements.minutes.value)});});
$('plan-date').addEventListener('change',()=>{if($('plan-date').value)draw();});$('todayBtn').addEventListener('click',()=>{$('plan-date').value=today();draw();});
try{plan=await api();signedIn=true;$('task-form').hidden=false;$('signin-note').hidden=true;}catch(e){if(e.status!==401)$('task-status').textContent='Unable to load tasks. Refresh to try again.';}draw();
