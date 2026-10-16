// Homepage discovery is transient UI state; app access stays server-owned.
(() => {
 const groups={
  utility:['/qr-maker','/photo-resize','/moment-studio','/focus'],
  games:['/confessions','/take-a-break','/decision-wheel','/team-mixer','/satire-arena'],
  planning:['/bill-splitter','/timetable-lite','/ritual-assist','/fund-overlap'],
  media:['/news','/satire-arena']
 };
 function mount(){
  const section=document.querySelector('#free-apps');
  if(!section||section.dataset.discoveryReady)return;
  section.dataset.discoveryReady='true';
  const grid=section.querySelector('.public-apps'),bar=section.querySelector('.home-filters');
  if(!grid||!bar)return;
  grid.id='home-tool-grid';grid.setAttribute('role','region');grid.setAttribute('aria-label','Free tools');grid.tabIndex=0;
  bar.hidden=false;section.classList.add('home-discovery-ready');
  const status=section.querySelector('.home-filter-status');
  bar.addEventListener('click',event=>{
   const button=event.target.closest('[data-tool-filter]');if(!button)return;
   const key=button.dataset.toolFilter;let count=0;
   bar.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
   grid.querySelectorAll('.public-app').forEach(card=>{
    card.hidden=key!=='all'&&!groups[key]?.includes(card.getAttribute('href'));
    if(!card.hidden){count++;if(!matchMedia('(prefers-reduced-motion:reduce)').matches)card.animate([{opacity:.35},{opacity:1}],{duration:180});}
   });
   grid.scrollTop=0;const label=document.createElement('span');label.textContent='tools';status.replaceChildren(document.createTextNode(`${count} `),label);
  });
 }
 mount();
 new MutationObserver(mount).observe(document.querySelector('#platform')||document.body,{childList:true,subtree:true});
})();
