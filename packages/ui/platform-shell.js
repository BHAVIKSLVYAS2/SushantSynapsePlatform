'use strict';
// Shared navigation only. App permissions and business state remain app-owned.
(() => {
 if (new URLSearchParams(location.search).get('screen') === '1') return;
 const entries = [
  ['Moment Studio','/moment-studio','Public tool'],
  ['Take a Break','/take-a-break','Public tool'],
  ['Decision Wheel','/decision-wheel','Public tool'],
  ['News','/news','Public tool'],
  ['Focus','/focus','Browser-saved tasks and timer'],
  ['Chambers','/advocate','Private workspace'],
  ['DIGITAL SAMAJ','/digital-samaj','Private workspace'],
  ['Tournament Lite','/tournament-lite','Organizer sign-in'],
  ['BatchFee Lite','/batchfee-lite','Private workspace'],
  ['Team Mixer','/team-mixer','Public tool'],
  ['Timetable Lite','/timetable-lite','Public tool'],
  ['Fund Lens','/fund-overlap','Public tool'],
  ['Ritual Assist','/ritual-assist','Public tool'],
  ['Satire Arena','/satire-arena','Public tool']
 ];
 const aliases={'/moment-studio/cards':'/moment-studio','/daily-spark':'/take-a-break','/pocket-pause':'/take-a-break'};
 const path=location.pathname.replace(/\/$/,'')||'/';
 const current=entries.find(([,route])=>(aliases[path]||path)===route||path.startsWith(route+'/'));
 const names={'/':'All apps','/signin':'Sign in','/support':'Support','/sponsor':'Sponsorship','/showcase':'Demos','/contact':'Contact','/privacy':'Privacy','/terms':'Usage terms','/legal':'Legal information','/legal/third-party-notices':'Third-party notices'};
 const header=document.createElement('header');header.className='platform-shell';header.setAttribute('aria-label','Sushant Synapse platform');
 header.innerHTML=`<a class="platform-shell-brand" href="/" aria-label="Sushant Synapse home"><img src="/logo-adaptive-192.png" width="32" height="32" alt=""><span>Synapse<small>PLATFORM</small></span></a><span class="platform-shell-divider" aria-hidden="true"></span><button class="platform-switch" type="button" aria-haspopup="dialog" aria-controls="platform-switcher"><span>${current?.[0]||names[path]||'All apps'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div class="platform-shell-actions">${window.SynapseTheme?.control()||''}<a class="platform-account" href="/signin?section=profile" aria-label="Sign in">Sign in</a></div>`;
 const skip=document.querySelector('body>.skip-link,body>.skip');
 if(skip)skip.after(header);else document.body.prepend(header);
 document.body.classList.add('has-platform-shell');
 const account=header.querySelector('.platform-account');
 let authRevision=0;
 function showAccount(user){
  const name=typeof user?.name==='string'?user.name.trim():'';
  const parts=name.split(/\s+/u).filter(Boolean);
  const first=part=>{const segment=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(part)[Symbol.iterator]().next().value?.segment:Array.from(part)[0];return segment||'';};
  const initials=parts.slice(0,2).map(first).join('').toLocaleUpperCase();
  account.textContent=user?(initials||'U'):'Sign in';
  account.setAttribute('aria-label',user?'My profile'+(name?' — '+name:''):'Sign in');
  account.title=user?'Signed in'+(name?' as '+name:''):'Sign in';
  account.classList.toggle('platform-account-avatar',!!user);
 }
 async function refreshAccount(){
  const revision=++authRevision;
  try{
   const response=await fetch('/api/auth/status',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(6000)});
   const status=response.ok?await response.json():null;
   if(revision===authRevision)showAccount(status?.user||null);
  }catch{if(revision===authRevision)showAccount(null);}
 }
 window.addEventListener('synapse-auth-change',event=>{authRevision++;showAccount(event.detail?.user||null);});
 window.addEventListener('pageshow',event=>{if(event.persisted)refreshAccount();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAccount();});
 refreshAccount();

 header.addEventListener('change',event=>{
  if(!event.target.matches('[data-theme-toggle]'))return;
  // Retain app theme listeners while exposing just one platform control.
  document.querySelectorAll('.synapse-header [data-theme-toggle],.auth-theme [data-theme-toggle]').forEach(control=>control.dispatchEvent(new Event('change',{bubbles:true})));
 });
 const modal=document.createElement('dialog');modal.id='platform-switcher';modal.className='platform-switcher';modal.setAttribute('aria-labelledby','platform-switcher-title');
 modal.innerHTML='<div class="platform-switcher-heading"><div><h2 id="platform-switcher-title">Switch app</h2><p>One platform. Choose your workspace or tool.</p></div><button type="button" aria-label="Close app switcher">×</button></div><label class="platform-switcher-search">Find an app<input type="search" placeholder="Search apps" autocomplete="off"></label><nav aria-label="Available platform apps"><a href="/" class="platform-switcher-home">All apps<span>Home and your collection</span></a>'+entries.map(([name,route,status])=>`<a href="${route}"${current?.[1]===route?' aria-current="page"':''}><strong>${name}</strong><span>${status}${current?.[1]===route?' · Current app':''}</span></a>`).join('')+'</nav><p class="platform-switcher-empty" hidden>No apps match your search.</p><p class="platform-switcher-note">Private workspaces require sign-in and assigned access.</p>';
 document.body.append(modal);
 const trigger=header.querySelector('.platform-switch'),input=modal.querySelector('input');
 trigger.addEventListener('click',()=>{modal.showModal();input.focus();});
 modal.querySelector('button').addEventListener('click',()=>modal.close());
 modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();modal.close();}});
 modal.addEventListener('close',()=>trigger.focus({preventScroll:true}));
 modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();});
 input.addEventListener('input',()=>{const words=input.value.trim().toLowerCase().split(/\s+/);let count=0;modal.querySelectorAll('nav a').forEach(link=>{link.hidden=!words.every(word=>link.textContent.toLowerCase().includes(word));if(!link.hidden)count++;});modal.querySelector('.platform-switcher-empty').hidden=!!count;});
 // Existing headers keep their local action handlers; classify them after app rerenders.
 function reconcile(){
  document.querySelectorAll('.synapse-header').forEach(local=>{
   local.classList.add('platform-app-toolbar');
   const actions=[...local.querySelectorAll('.header-actions a,.header-actions button,.top-actions button,.header-actions select')].filter(el=>!el.matches('[data-theme-toggle],#all-apps,.profile-button')&&!el.closest('.theme-control,.theme-picker')&&el.getAttribute('href')!=='/'&&!el.getAttribute('href')?.startsWith('/signin'));
   local.classList.toggle('platform-toolbar-empty',!actions.length);
  });
 }
 reconcile();new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('.synapse-header')||n.querySelector('.synapse-header')||n.closest('.synapse-header')))))reconcile();
 }).observe(document.body,{childList:true,subtree:true});
})();
