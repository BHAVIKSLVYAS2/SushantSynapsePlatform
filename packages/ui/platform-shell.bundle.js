// Generated from app-registry/index.js and ui/platform-shell.js.
(function(root){
// App definitions are code-reviewed. Do not accept launch URLs from user input.
const apps = [
  {id:'confessions',public:true,name:'Confessions',subtitle:'A little secret. A lighter heart.',category:'Play',status:'Available',path:'/confessions',icon:'chat',accent:'green',description:'A public scratch-card chat. New CAPTCHA-checked confessions appear for everyone, across browsers. No name or sign-in requested.',features:['Scratch to reveal','Shared stream','No sign-in']},
  {id:'qr-maker',public:true,name:'QR Maker',subtitle:'A useful shortcut.',category:'Productivity',status:'Available',path:'/qr-maker',icon:'qr',accent:'blue',description:'Create static QR codes for links or text. Preview and download PNG locally, with no account or tracking redirects.',features:['Links & text','PNG download','On-device']},
  {id:'photo-resize',public:true,name:'Photo Resize',subtitle:'Smaller files, simple sharing.',category:'Productivity',status:'Available',path:'/photo-resize',icon:'image',accent:'green',description:'Resize and compress a photo to a target size in KB, on your device. No upload or sign-in.',features:['Target file size','Keep proportions','JPEG download']},
  {id:'bill-splitter',public:true,name:'Bill Splitter',subtitle:'Good company. Clear splits.',category:'Productivity',status:'Available',path:'/bill-splitter',icon:'finance',accent:'blue',description:'Split bills or trip expenses equally, by individual amounts, percentages or shares. Exact paise settlements to copy. No payments or accounts.',features:['Four split methods','Trip expenses','Copy settlements']},
  {id:'moment-studio',public:true,name:'Moment Studio',subtitle:'Recognition worth sharing.',category:'Community',status:'Available',path:'/moment-studio',icon:'star',accent:'blue',description:'Create appreciation certificates, celebrations, invitations and thoughtful condolence cards in English or Hindi. Free branded PNG/PDF exports.',features:['Certificates & cards','Condolences & remembrance','Branded PNG/PDF']},
  { id: 'daily-spark', public: true, name: 'Take a Break', subtitle: 'Seven ways to reset.', category: 'Play', status: 'Available', path: '/take-a-break', icon: 'grid', accent: 'blue', description: 'One-Minute Chaos, Make 24, Crack the Code, Memory Minute, Lights Out, Face-Off, and Decision Wheel in one free play hub.', features: ['Daily & practice games', 'Choose or play', 'Challenge a friend'] },
  { id: 'decision-wheel', public: true, name: 'Decision Wheel', subtitle: 'Less debate. More doing.', category: 'Productivity', status: 'Available', path: '/decision-wheel', icon: 'grid', accent: 'blue', description: 'Spin to choose lunch, tasks or a name. Equal chances, removable winners and shareable results. Free, no login.', features: ['Random picker', 'Remove winners', 'Share results'] },
  { id: 'news', public: true, name: 'Sushant Synapse Times', subtitle: 'Daily newspaper by Aakanksha', category: 'News', status: 'Available', path: '/news', icon: 'knowledge', accent: 'green', description: 'Dated news from credited publishers, shared archives and temporary editions.', features: ['Credited sources', 'Edition search', 'Date archives'] },
 {id:'focus',public:true,name:'Focus',subtitle:'Plan today. Do one thing at a time.',category:'Productivity',status:'Available',path:'/focus',icon:'projects',accent:'blue',description:'An adjustable focus timer and browser-saved daily tasks with priorities, time estimates and unfinished work. No sign-in required; tasks stay on this browser.',features:['Focus timer','Today’s tasks','Time planning']},
 {id:'satire-arena',public:true,name:'Satire Arena',subtitle:'Garland or roast?',category:'Play',status:'Available',path:'/satire-arena',icon:'star',accent:'green',description:'Thirteen fictional political cartoons, yearly reactions and shared cloud-backed Fans vs Critics scores. One changeable ballot per browser and character each calendar year.',features:['Political parody','Yearly reactions','Shared cloud scores']},
  {id:'ritual-assist',public:true,name:'Ritual Assist',subtitle:'Prepare with clarity. Observe with care.',category:'Community',status:'Available',path:'/ritual-assist',icon:'knowledge',accent:'amber',description:'Hindu Shubh ceremonies and Ashubh mourning/remembrance preparation in English and Hindi. Suggested steps, item checklists, family-custom notes and references.',features:['15 Hindu guides','Steps & materials','Print & share']},
  { id: 'team-mixer', public: true, name: 'Team Mixer', subtitle: 'Good people. Fresh combinations.', category: 'Community', status: 'Available', path: '/team-mixer', icon: 'team', accent: 'green', description: 'Split 2-100 names into randomly assigned teams with balanced sizes, animated reveals, a downloadable team card and explicit sharing. Free, no login.', features: ['Balanced team sizes', 'Animated reveal', 'PNG & team list'] },
  { id: 'digital-samaj', name: 'DIGITAL SAMAJ', subtitle: 'Families, roots and community', category: 'Community', status: 'Available', path: '/digital-samaj', icon: 'team', accent: 'green', description: 'Private family registry, verified directory, Vanshavali and member messaging. Requires platform access and a Samaj role.', features: ['Family registry', 'Vanshavali', 'Samaj Connect'] },
  { id: 'tournament-lite', name: 'Tournament Lite', subtitle: 'Less admin. More play.', category: 'Community', status: 'Available', path: '/tournament-lite', icon: 'projects', accent: 'green', description: 'Six sports, automatic fixtures, scoring and public results. Organizers sign in; viewers need no account.', features: ['Six sports', 'Fixtures & brackets', 'Share results'] },
  { id: 'batchfee-lite', name: 'BatchFee Lite', subtitle: 'Less chasing. More teaching.', category: 'Education', status: 'Available', path: '/batchfee-lite', icon: 'finance', accent: 'green', description: 'Batches, students, recurring fees, receipts and WhatsApp reminders. Private academy workspace with owner-delegated staff roles.', features: ['Fee tracking', 'Receipts', 'WhatsApp drafts'] },
  { id: 'timetable-lite', public: true, name: 'Timetable Lite', subtitle: 'A well-planned week starts here', category: 'Education', status: 'Available', path: '/timetable-lite', icon: 'projects', accent: 'blue', description: 'Generate conflict-free weekly timetables for schools, coaching classes and training institutes. No login required.', features: ['Automatic scheduling', 'PDF & image', 'Device-local backups'] },
  { id: 'fund-overlap', public: true, name: 'Fund Lens', subtitle: 'Mutual fund overlap analyzer', category: 'Investing', status: 'Available', path: '/fund-overlap', icon: 'lens', accent: 'blue', description: 'See what your funds have in common. Compare equity holdings, industries and unique contributions using dated official examples and verified secondary sources.', features: ['Holdings overlap', 'Industry comparison', 'What-if analysis'] },
  { id: 'advocate', name: 'Chambers', subtitle: 'Advocate workspace', category: 'Legal', status: 'Available', path: '/advocate', icon: 'scales', accent: 'green', description: 'Cases, clients, hearings and professional fees. Your entire legal practice, in good order.', features: ['Case management', 'Hearing diary', 'Fees & payments'] },
  { id: 'projects', name: 'Projects', subtitle: 'Plan the work ahead', category: 'Productivity', status: 'Planned', icon: 'projects', accent: 'violet', description: 'A future workspace for projects, milestones and team tasks.', features: ['Projects', 'Milestones'] },
  { id: 'finance', name: 'Finance', subtitle: 'Clarity for your business', category: 'Business', status: 'Planned', icon: 'finance', accent: 'amber', description: 'A future app for business income, expenses and financial reporting.', features: ['Income & expenses', 'Reports'] },
  { id: 'knowledge', name: 'Knowledge', subtitle: 'Keep good ideas together', category: 'Productivity', status: 'Planned', icon: 'knowledge', accent: 'blue', description: 'A future home for notes, references and shared knowledge.', features: ['Notes', 'Collections'] },
];
const appAliases={certificates:'moment-studio','celebration-studio':'moment-studio'};
const resolveAppId=id=>Object.hasOwn(appAliases,id)?appAliases[id]:id;

const discovery = {"/fund-overlap":{"label":"INVESTING / FUND LENS","art":"lens","homeDescription":"Compare the holdings shared by your mutual funds.","homeOrder":0,"purpose":"Learn","keywords":"fund mutual investment equity holdings coverage overlap","groups":["planning"]},"/decision-wheel":{"label":"CHOOSE / RANDOM PICKER","art":"wheel","homeDescription":"Add your options and spin to choose one.","homeOrder":1,"purpose":"Organize","keywords":"spin lunch choice decision random import export","groups":["games"]},"/ritual-assist":{"label":"TRADITIONS / HINDU PREPARATION","art":"ritual","homeDescription":"Prepare ritual checklists in English or Hindi.","homeOrder":2,"purpose":"Learn","keywords":"Hindu ritual puja pooja samagri shubh ashubh Ganesh Lakshmi Satyanarayan griha pravesh namkaran wedding vivah havan funeral antyeshti shraddha remembrance rites \u092a\u0942\u091c\u093e \u0936\u094d\u0930\u093e\u0926\u094d\u0927 \u0938\u093e\u092e\u0917\u094d\u0930\u0940","groups":["planning"]},"/confessions":{"label":"PLAY / UNTOLD THOUGHTS","art":"confessions","homeDescription":"Share a confession and scratch to read others.","homeOrder":3,"purpose":"Play","keywords":"confession secrets scratch reveal anonymous thoughts","groups":["games"]},"/qr-maker":{"label":"FREE / EVERYDAY TOOLS","art":"qr","homeDescription":"Create QR codes for links, text or Wi-Fi.","homeOrder":4,"purpose":"Create","keywords":"QR code link text png scan","groups":["utility"]},"/photo-resize":{"label":"FREE / EVERYDAY TOOLS","art":"photo","homeDescription":"Resize a photo to a target file size.","homeOrder":5,"purpose":"Create","keywords":"photo image resize compress KB JPEG form","groups":["utility"]},"/bill-splitter":{"label":"FREE / EVERYDAY TOOLS","art":"fees","homeDescription":"Split bills and work out who owes whom.","homeOrder":6,"purpose":"Organize","keywords":"bill split money rupees trip expenses percentages shares friends","groups":["planning"]},"/moment-studio":{"label":"CREATE / CARDS & CERTIFICATES","art":"cards","homeDescription":"Make certificates, greetings, invitations and remembrance cards.","homeOrder":7,"purpose":"Create","keywords":"certificate appreciation celebration birthday condolence remembrance award CSV batch","groups":["utility"]},"/take-a-break":{"label":"PLAY / YOUR BREAK COLLECTION","art":"pause","homeDescription":"Play puzzles, memory games and One-Minute Chaos.","homeOrder":8,"purpose":"Play","keywords":"Daily Spark Make 24 math number puzzle Crack the Code visual Memory Minute pairs Lights Out Hindi Face-Off Decision Wheel spin lunch choice random pick","groups":["games"]},"/news":{"label":"NEWS / DAILY EDITION","art":"news","homeDescription":"Read credited news, search editions and explore the archives.","homeOrder":9,"purpose":"Learn","keywords":"news newspaper headlines reading archives sources","groups":["media"]},"/timetable-lite":{"label":"EDUCATION / WEEKLY PLANNING","art":"calendar","homeDescription":"Create and print a weekly timetable.","homeOrder":10,"purpose":"Organize","keywords":"school class teacher schedule absence substitute","groups":["planning"]},"/team-mixer":{"label":"GROUPS / RANDOM TEAMS","art":"teams","homeDescription":"Split names into random teams.","homeOrder":11,"purpose":"Organize","keywords":"group teams participant together apart","groups":["games"]},"/focus":{"label":"WORK / FOCUS","art":"calendar","homeDescription":"Plan tasks and use a focus timer.","homeOrder":12,"purpose":"Organize","keywords":"focus pomodoro today tasks todo office work priorities time management timer","groups":["utility"]},"/satire-arena":{"label":"PLAY / POLITICAL PARODY","homeDescription":"React to 13 fictional characters and see yearly scores.","homeOrder":13,"purpose":"Play","keywords":"politician politics cartoon parody satire garland shoe ink fans critics arena yearly vote","groups":["games","media"],"art":"satire"},"/digital-samaj":{"homeOrder":100,"purpose":"Work","art":"community","groups":[]},"/advocate":{"homeOrder":101,"purpose":"Work","art":"chambers","groups":[]},"/tournament-lite":{"homeOrder":102,"purpose":"Work","art":"trophy","groups":[]},"/batchfee-lite":{"homeOrder":103,"purpose":"Work","art":"fees","groups":[]}};
for(const app of apps)Object.assign(app,{art:app.icon==='scales'?'chambers':'documents',purpose:'Work',groups:[],homeOrder:200},discovery[app.path]||{});
for(const app of apps)app.featured=['moment-studio','daily-spark'].includes(app.id);
for(const app of apps.filter(a=>a.catalogueParent)){const parent=apps.find(a=>a.id===app.catalogueParent);if(parent)Object.assign(app,{art:parent.art,purpose:parent.purpose,groups:parent.groups});}
const visibleApps=()=>apps.filter(a=>!a.catalogueParent).slice().sort((a,b)=>a.homeOrder-b.homeOrder);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderFeatured(app){const e=escapeHtml;return '<a class="home-feature-card" href="'+e(app.path)+'" aria-label="Explore '+e(app.name)+'"><svg class="home-feature-icon" viewBox="0 0 180 160" aria-hidden="true"><use href="/home-art.svg#'+e(app.art)+'"></use></svg><div><h3>'+e(app.name)+'</h3><p>'+e(app.homeDescription)+'</p><span class="home-feature-open">Open App &#8594;</span></div></a>';}
function renderCard(app,options={}){
 const e=escapeHtml,signedIn=!!options.signedIn,access=options.access||{},status=access.status||app.status;
 const available=status==='Available'&&(app.public||access.accessible===true);
 const favourite=available&&signedIn?'<button type="button" class="catalogue-favorite favorite" data-action="favorite" data-id="'+e(app.id)+'" aria-pressed="'+!!options.favorite+'" aria-label="'+(options.favorite?'Remove ':'Add ')+e(app.name)+(options.favorite?' from':' to')+' favourites">'+(options.favorite?'&#9733;':'&#9734;')+'</button>':'';
 const visual=app.id==='satire-arena'?'<img class="arena-home-art" src="/satire-arena/cartoon-cast-768.webp" width="768" height="256" loading="lazy" decoding="async" alt="Fictional political cartoon characters">':null;
 const art='<svg class="home-sculpture" viewBox="0 0 180 160" aria-hidden="true" focusable="false"><use href="/home-art.svg#'+e(app.art)+'"></use></svg>';
 if(app.public&&status==='Available')return '<article class="catalogue-item" data-app-id="'+e(app.id)+'"><a class="public-app" data-app-id="'+e(app.id)+'" href="'+e(app.path)+'" aria-label="'+e(app.name)+'"'+(signedIn?' data-action="launch" data-id="'+e(app.id)+'"':'')+'><div class="public-app-head"><span class="public-app-category">'+e(app.label||app.category)+'</span><span class="public-app-arrow" aria-hidden="true">&#8594;</span></div>'+(visual||'<div class="news-visual">'+art+'</div>')+'<div class="public-app-copy"><h2>'+e(app.name)+'</h2><p>'+e(app.homeDescription||app.description)+'</p></div></a>'+favourite+'</article>';
 const label=status==='Planned'?'Planned':status==='Unavailable'?'Unavailable':signedIn?(available?'Available':'Access required'):'Sign-in + app access';
 const action=status!=='Available'?'<span class="not-live">'+(status==='Planned'?'Not available yet':'Currently unavailable')+'</span>':signedIn?(available?'<button class="secondary workspace-launch" data-action="launch" data-id="'+e(app.id)+'">Open '+e(app.name)+' <span aria-hidden="true">&#8594;</span></button>':'<span class="not-live">Contact your platform owner</span>'):'<a class="secondary workspace-launch" href="/signin?next='+e(app.id)+'">Sign in to '+e(app.name)+' <span aria-hidden="true">&#8594;</span></a>';
 return '<article class="workspace-card catalogue-item" data-app-id="'+e(app.id)+'"><div class="workspace-card-art" aria-hidden="true">'+art+'</div><div class="workspace-card-copy"><span class="access-label private">'+label+'</span><h3>'+e(app.name)+'</h3><p>'+e(access.description&&status==='Unavailable'?access.description:app.description)+'</p>'+action+'</div>'+favourite+'</article>';
}
const catalogue={apps,resolveAppId,visibleApps,renderCard,renderFeatured};
if(typeof module==='object'&&module.exports)module.exports=catalogue;
else root.SynapseCatalogue=catalogue;


})(typeof globalThis==='object'?globalThis:this);

'use strict';
// Shared navigation only. App permissions and business state remain app-owned.
(() => {
 if (new URLSearchParams(location.search).get('screen') === '1') return;
 const entries=(window.SynapseCatalogue?.visibleApps()||[]).filter(a=>a.path&&a.status==='Available').map(a=>[a.name,a.path,a.public?'Public tool':'Private workspace']);
 const aliases={'/moment-studio/cards':'/moment-studio','/daily-spark':'/take-a-break'};
 const path=location.pathname.replace(/\/$/,'')||'/';
 const current=entries.find(([,route])=>(aliases[path]||path)===route||path.startsWith(route+'/'));
 const names={'/':'All apps','/signin':'Sign in','/support':'Support','/sponsor':'Sponsorship','/showcase':'Demos','/contact':'Contact','/privacy':'Privacy','/terms':'Usage terms','/legal':'Legal information','/legal/third-party-notices':'Third-party notices'};
 const header=document.createElement('header');header.className='platform-shell';header.setAttribute('aria-label','Sushant Synapse platform');
 header.innerHTML=`<a class="platform-shell-brand" href="/" aria-label="Sushant Synapse home"><img src="/logo-adaptive-192.png" width="32" height="32" alt=""><span>Sushant Synapse<small>PLATFORM</small></span></a><span class="platform-shell-divider" aria-hidden="true"></span><button class="platform-switch" type="button" aria-haspopup="dialog" aria-controls="platform-switcher"><span>${current?.[0]||names[path]||'All apps'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div class="platform-shell-actions">${window.SynapseTheme?.control()||''}<a class="platform-account" href="/signin?section=profile" aria-label="Sign in">Sign in</a></div>`;
 const skip=document.querySelector('body>.skip-link,body>.skip');
 if(skip)skip.after(header);else document.body.prepend(header);
 document.body.classList.add('has-platform-shell');
 // Native navigation stays immediate; this is an indeterminate visual cue only.
 const loader=document.createElement('div');loader.className='platform-transition';loader.hidden=true;
 loader.setAttribute('role','status');loader.setAttribute('aria-live','polite');
 loader.innerHTML='<div class="platform-transition-card"><img src="/logo-adaptive-192.png" width="64" height="64" alt=""><strong>Sushant Synapse</strong><span>Opening app…</span><div class="platform-transition-track" aria-hidden="true"><i></i></div></div>';
 document.body.append(loader);
 let loaderTimeout;
 const clearLoader=()=>{clearTimeout(loaderTimeout);loader.hidden=true;};
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const destination=new URL(link.href,location.href);
  if(destination.origin!==location.origin||!['http:','https:'].includes(destination.protocol))return;
  if(destination.pathname===location.pathname&&destination.search===location.search)return;
  loader.hidden=false;clearTimeout(loaderTimeout);loaderTimeout=setTimeout(clearLoader,8000);
 });
 window.addEventListener('pageshow',clearLoader);
 window.addEventListener('pagehide',clearLoader);
 window.addEventListener('popstate',clearLoader);
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
 async function refreshAccount(initial=false){
  const revision=++authRevision;
  try{
   const request=async()=>{const response=await fetch('/api/auth/status',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('Account status unavailable');return response.json();};
   const status=await(initial?(window.synapseInitialAuthStatus??=request()):request());
   if(revision===authRevision)showAccount(status?.user||null);
  }catch{if(revision===authRevision)showAccount(null);}
 }
 window.addEventListener('synapse-auth-change',event=>{authRevision++;showAccount(event.detail?.user||null);});
 window.addEventListener('pageshow',event=>{if(event.persisted)refreshAccount();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshAccount();});
 refreshAccount(true);

 header.addEventListener('change',event=>{
  if(!event.target.matches('[data-theme-toggle]'))return;
  // Retain app theme listeners while exposing just one platform control.
  document.querySelectorAll('.synapse-header [data-theme-toggle],.auth-theme [data-theme-toggle]').forEach(control=>control.dispatchEvent(new Event('change',{bubbles:true})));
 });
 const modal=document.createElement('dialog');modal.id='platform-switcher';modal.className='platform-switcher';modal.setAttribute('aria-labelledby','platform-switcher-title');
 modal.innerHTML='<div class="platform-switcher-heading"><div><h2 id="platform-switcher-title">Switch app</h2><p>One platform. Choose your workspace or tool.</p></div><button type="button" aria-label="Close app switcher">×</button></div><label class="platform-switcher-search">Find an app<input type="search" placeholder="Search apps" autocomplete="off"></label><nav aria-label="Available platform apps"><p class="platform-switcher-group">Try something today</p><a href="/take-a-break?game=24"><strong>Make 24</strong><span>Daily number puzzle</span></a><a href="/decision-wheel" class="platform-switcher-feature"><strong>Let chance choose</strong><span>Spin the Decision Wheel</span></a><p class="platform-switcher-group">All apps</p><a href="/" class="platform-switcher-home">All apps<span>Home and your collection</span></a>'+entries.map(([name,route,status])=>`<a href="${route}"${current?.[1]===route?' aria-current="page"':''}><strong>${name}</strong><span>${status}${current?.[1]===route?' · Current app':''}</span></a>`).join('')+'</nav><p class="platform-switcher-empty" hidden>No apps match your search.</p><p class="platform-switcher-note">Private workspaces require sign-in and assigned access.</p>';
 document.body.append(modal);
 const trigger=header.querySelector('.platform-switch'),input=modal.querySelector('input');
 trigger.addEventListener('click',()=>{modal.showModal();input.focus();});
 modal.querySelector('button').addEventListener('click',()=>modal.close());
 modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();modal.close();}});
 modal.addEventListener('close',()=>trigger.focus({preventScroll:true}));
 modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();});
 input.addEventListener('input',()=>{modal.querySelectorAll('.platform-switcher-group').forEach(label=>label.hidden=!!input.value.trim());const words=input.value.trim().toLowerCase().split(/\s+/);let count=0;modal.querySelectorAll('nav a').forEach(link=>{link.hidden=!words.every(word=>link.textContent.toLowerCase().includes(word));if(!link.hidden)count++;});modal.querySelector('.platform-switcher-empty').hidden=!!count;});
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

import('/shared/visitors.mjs').catch(()=>{});
