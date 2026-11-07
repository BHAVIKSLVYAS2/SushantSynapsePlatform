// One document, one shared header, and persistent app-owned section controllers.
const main=document.querySelector('main'),calendarRoot=document.createElement('section');
calendarRoot.id='ritual-calendar-root';
calendarRoot.append(...main.childNodes);main.append(calendarRoot);
const language=calendarRoot.querySelector('.language');
if(language)(document.querySelector('.platform-shell')||main).append(language);
const initial=new URL(location.href);
if(!initial.pathname.includes('/guides')&&(initial.searchParams.has('guide')||initial.searchParams.get('view')==='checklist')){initial.pathname='/ritual-assist/guides';initial.searchParams.delete('view');history.replaceState(history.state,'',initial);}
if(initial.pathname.includes('/guides'))calendarRoot.hidden=true;
const {calendarWorkspace,suspendCalendar}=await import('./calendar.js');
const nav=main.querySelector('.ritual-task-tabs');
let prepRoot,prep,loading,ticket=0,requested='',active='',savedPrep='/ritual-assist/guides';
const scrolls=new Map();
const section=url=>url.pathname.includes('/guides')||url.searchParams.has('guide')||url.searchParams.get('view')==='checklist'?'checklist':url.searchParams.get('view')==='remembrance'?'remembrance':'dates';
async function loadPrep(){
 if(prep)return;
 if(!loading)loading=(async()=>{
  await Promise.all(['arrangements','gallery'].map(name=>new Promise((resolve,reject)=>{
   const link=document.createElement('link');link.rel='stylesheet';link.href='/ritual-assist/'+name+'.css';link.onload=resolve;link.onerror=()=>{link.remove();reject(new Error('Preparation styles could not load.'));};document.head.append(link);
  })));
  return Promise.all([import('./prep-template.mjs'),import('./app.js')]);
 })().catch(error=>{loading=null;throw error;});
 return await loading;
}
const status=document.createElement('p');status.role='status';status.hidden=true;nav.after(status);
async function show(url,{push=false,focus=false}={}){
 const next=section(url),request=++ticket;requested=next;
 if(active&&next!==active){scrolls.set(active,scrollY);if(active==='checklist'){const route=prep.route();savedPrep=route.pathname+route.search;prep?.suspend();}else {calendarWorkspace.suspend();suspendCalendar();}}
 if(push&&url.href!==location.href)history.pushState(history.state,'',url);
 try{
  if(next==='checklist'&&!prep){status.hidden=false;status.textContent=document.getElementById('language').value==='hi'?'तैयारी खुल रही है…':'Opening Ritual Prep…';const [{createPrepRoot},{mountPrep}]=await loadPrep();if(request!==ticket)return;calendarRoot.remove();prepRoot=createPrepRoot();main.append(prepRoot);prep=mountPrep(prepRoot);}
  if(request!==ticket)return;
  status.hidden=true;
  // Detaching the inactive panel retains DOM/state while keeping IDs unique.
  if(next==='checklist'){
   calendarRoot.remove();if(!prepRoot.isConnected)main.append(prepRoot);
   document.body.classList.add('ritual-landing');prep.resume(url);
  }else{
   prepRoot?.remove();if(!calendarRoot.isConnected)main.append(calendarRoot);calendarRoot.hidden=false;
   document.body.classList.remove('ritual-landing');calendarWorkspace.activate(next);
  }
  active=next;document.body.dataset.ritualView=next;
  if(focus){const target=nav.querySelector('[data-ritual-section="'+next+'"]');target?.focus({preventScroll:true});scrollTo({top:scrolls.get(next)||0,behavior:'instant'});}
 }catch{
  if(request!==ticket)return;
  status.hidden=false;status.textContent='Could not open Ritual Prep. Tap Ritual Prep to try again.';
 }
}
nav.addEventListener('click',event=>{
 const control=event.target.closest('[data-ritual-section]');if(!control||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();event.stopImmediatePropagation();
 const next=control.dataset.ritualSection;if(next===active&&requested===active)return;
 const url=new URL(next==='checklist'?savedPrep:'/ritual-assist?view='+next,location.origin);
 void show(url,{push:true,focus:true});
},true);
addEventListener('popstate',()=>void show(new URL(location.href)));
await show(initial);
