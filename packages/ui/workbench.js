'use strict';
// Decorative presentation only: never inspect inputs, records, permissions or exports.
(() => {
 const app=document.body.dataset.uiApp;
 const apps={portal:'teams',advocate:'chambers','batchfee-lite':'fees','digital-samaj':'community','tournament-lite':'trophy','fund-overlap':'lens','moment-studio':'cards','ritual-assist':'ritual','timetable-lite':'calendar','team-mixer':'teams','decision-wheel':'wheel','take-a-break':'pause','pocket-pause':'pause','daily-spark':'spark',news:'news','satire-arena':'satire',support:'ritual',sponsor:'teams',legal:'documents'};
 if(!app)return;
 function art(name,cls){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 180 160');svg.setAttribute('class',cls);svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','/home-art.svg?v=20261011-inner#'+name);svg.append(use);return svg;}
 function sectionMark(heading){const label=heading.textContent.toLowerCase();if(/fee|payment|expense|billing|finance|donation/.test(label))return 'fees';if(/case|court|hearing|chamber/.test(label))return 'chambers';if(/team|member|people|client|family|profile|account/.test(label))return 'community';if(/calendar|date|week|timetable|schedule/.test(label))return 'calendar';if(/document|report|task|note|history|activity|security|access/.test(label))return 'documents';if(/award|certificate|tournament|match|winner/.test(label))return 'trophy';return apps[app]||'documents';}
 function decorate(){
  if(document.querySelector('.public-home'))return;
  if(app==='batchfee-lite')for(const glyph of document.querySelectorAll('aside nav .nav-icon')){if(glyph.querySelector('.ui-nav-art'))continue;const page=glyph.closest('button')?.dataset.id,name=({Home:'calendar',Students:'community',Batches:'teams',Fees:'fees',Notifications:'news',More:'documents'})[page]||'documents';glyph.replaceChildren(art(name,'ui-nav-art'));}
  for(const box of document.querySelectorAll('main .page-heading,main .page-top,main .hero,main .intro,.auth-layout .welcome-copy')){
   if(box.querySelector('.ui-tool-art,.ui-workspace-art')||box.matches('.studio-intro')||box.closest('.scene'))continue;
   const title=box.querySelector('h1,h2');if(title){box.classList.add('ui-workspace-heading');box.append(art(sectionMark(title),'ui-workspace-art'));}
  }
  for(const heading of document.querySelectorAll('main .panel>h2,main .card>h2,main .card-heading h2,main .card-heading h3,main .section-heading h2,main .settings-grid h2,main .library>h2')){
   if(heading.querySelector('.ui-section-art')||heading.closest('.scene,#print-area,.print-report'))continue;
   heading.classList.add('ui-section-heading');heading.prepend(art(sectionMark(heading),'ui-section-art'));
  }
 }
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});};
 decorate();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
})();
