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
  const home=section.closest('.public-home'),hero=home.querySelector('.home-welcome');
  const paths=document.createElement('nav');paths.className='home-entry-paths';paths.setAttribute('aria-label','Choose how to start');
  paths.innerHTML='<a class="home-entry home-entry-explore" href="#free-apps"><span class="home-entry-icon" aria-hidden="true">↗</span><span><strong>Explore Apps</strong><small>Open and use instantly</small><b>Browse Apps <span aria-hidden="true">→</span></b></span></a><a class="home-entry home-entry-workspace" href="/signin"><span class="home-entry-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><rect x="11" y="21" width="26" height="23" rx="5"/><path d="M16 21v-8a8 8 0 0 1 16 0v8" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="24" cy="31" r="3"/></svg></span><span><strong>My Workspace</strong><small>Your personal space</small><b>Sign in <span aria-hidden="true">→</span></b></span></a>';
  const rocket=paths.querySelector('.home-entry-explore .home-entry-icon');rocket.innerHTML='<svg viewBox="0 0 48 48"><path d="M16 24C20 10 29 5 42 5c0 13-5 22-19 26Z" fill="currentColor"/><circle cx="31" cy="16" r="4" fill="var(--ss-bg-secondary)"/><path d="m16 21-8 1-4 9 12-2m10 2-1 9 9-4 1-11M15 34l-7 8 9-5" fill="currentColor"/></svg>';
  hero.after(paths);
  const search=document.createElement('div');search.className='home-search';search.innerHTML='<label for="home-search-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg><span class="sr-only">Search web apps</span><input id="home-search-input" type="search" placeholder="Search apps, tools or games…" autocomplete="off" aria-controls="home-tool-grid"></label><button type="button" class="home-search-clear" aria-label="Clear app search" hidden>Clear</button>';
  bar.before(search);
  const feature=document.createElement('section');feature.className='home-featured';feature.setAttribute('aria-labelledby','home-featured-title');feature.innerHTML='<div class="home-section-heading"><h2 id="home-featured-title">✦ Featured app</h2><a href="/confessions">Open app <span aria-hidden="true">→</span></a></div><a class="home-feature-card" href="/confessions" aria-label="Explore Confessions"><svg class="home-feature-icon" viewBox="0 0 180 160" aria-hidden="true"><use href="/home-art.svg?v=20261018-hub#confessions"></use></svg><div><span class="eyebrow">A LITTLE HUMAN CONNECTION</span><h3>Confessions</h3><p>Share anonymously and scratch to discover what others think.</p><span class="home-feature-open">Open App <span aria-hidden="true">→</span></span></div><div class="home-feature-orb" aria-hidden="true"><span>♡</span></div></a></section>';
  bar.after(feature);const heading=section.querySelector('.access-heading');feature.after(heading);section.querySelector('#free-title').textContent='Explore web apps';
  const empty=document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';grid.after(empty);
  let selected='all';
  function filter(){
   const query=search.querySelector('input').value.trim().toLocaleLowerCase();let count=0;
   grid.querySelectorAll('.public-app').forEach(card=>{card.hidden=(selected!=='all'&&!groups[selected]?.includes(card.getAttribute('href')))||!!(query&&!card.textContent.toLocaleLowerCase().includes(query));if(!card.hidden)count++;});
   bar.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.toolFilter===selected)));
   status.textContent=`${count} tools`;empty.hidden=count!==0;search.querySelector('button').hidden=!query;feature.hidden=selected!=='all'||!!query;
  }
  search.querySelector('input').addEventListener('input',filter);search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  const dock=document.createElement('nav');dock.className='home-mobile-dock';dock.setAttribute('aria-label','Homepage navigation');dock.innerHTML='<a href="#main" aria-current="page"><span aria-hidden="true">⌂</span>Home</a><a href="#free-apps"><span aria-hidden="true">▦</span>Apps</a><a href="#free-apps" data-home-games><span aria-hidden="true">♧</span>Games</a><a href="#workspace-apps"><span aria-hidden="true">♙</span>Workspace</a>';home.append(dock);
  const dockPaths=['M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10','M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z','M7 7h10c3 0 5 10 3 12-2 2-5-3-6-3h-4c-1 0-4 5-6 3C2 17 4 7 7 7Zm0 3v5m-2-2h4m6-1h.1m3 2h.1','M6 10h12v11H6Zm3 0V6a3 3 0 0 1 6 0v4'];dock.querySelectorAll('a>span').forEach((span,i)=>{span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+dockPaths[i]+'"/></svg>';});
  dock.querySelector('[data-home-games]').onclick=()=>{selected='games';search.querySelector('input').value='';filter();};
  dock.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.getAttribute('href')==='#free-apps'&&!link.hasAttribute('data-home-games')){selected='all';filter();}}));
  filter();
  bar.addEventListener('click',event=>{
   const button=event.target.closest('[data-tool-filter]');if(!button)return;
   selected=button.dataset.toolFilter;filter();
  });
 }
 mount();
 new MutationObserver(mount).observe(document.querySelector('#platform')||document.body,{childList:true,subtree:true});
})();
