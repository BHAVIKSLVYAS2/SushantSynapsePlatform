// Shared discovery for guests and signed-in accounts; permissions stay server-owned.
(() => {
 const catalogue=window.SynapseCatalogue;
 function mount(){
  const section=document.querySelector('#free-apps');if(!section)return;if(section.dataset.discoveryReady)return;
  const home=section.closest('.public-home'),grid=section.querySelector('.public-apps'),bar=section.querySelector('.home-filters');if(!grid||!bar)return;
  section.dataset.discoveryReady='true';grid.id='home-tool-grid';grid.setAttribute('role','region');grid.setAttribute('aria-label','Free tools');grid.tabIndex=0;bar.hidden=false;section.classList.add('home-discovery-ready');
  const status=section.querySelector('.home-filter-status'),search=home.querySelector('.home-search');
  section.querySelector('#free-title').textContent='Explore apps';
  const empty=home.querySelector('.home-search-empty')||document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';if(!empty.isConnected)grid.after(empty);
  let selected=bar.querySelector('[aria-pressed=true]')?.dataset.toolFilter||'all';
  function filter(){
   const terms=search.querySelector('input').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let count=0,publicCount=0,workspaceCount=0;
   for(const card of home.querySelectorAll('.public-app,.workspace-card')){
    const app=catalogue.apps.find(a=>a.id===card.dataset.appId);if(!app)continue;
    const text=[app.name,app.description,app.homeDescription,app.keywords,app.category].join(' ').toLocaleLowerCase();card.hidden=(selected!=='all'&&!app.groups.includes(selected))||!terms.every(term=>text.includes(term));
    if(card.matches('.public-app'))card.closest('.catalogue-item').hidden=card.hidden;
    if(!card.hidden){count++;if(app.public)publicCount++;else workspaceCount++;}
   }
   bar.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.toolFilter===selected)));
   status.textContent=count+' apps';empty.hidden=count!==0||!home.querySelector('.catalogue-item');grid.hidden=publicCount===0;home.querySelector('#workspace-apps').hidden=workspaceCount===0;search.querySelector('button').hidden=!terms.length;
  }
  search.querySelector('input').oninput=filter;search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  search.querySelector('input').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();search.querySelector('input').value='';filter();}};
  const dock=home.querySelector('.home-mobile-dock');dock.onclick=event=>{const link=event.target.closest('a');if(!link)return;dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.hasAttribute('data-home-games')){selected='games';search.querySelector('input').value='';}else if(link.getAttribute('href')==='#free-apps')selected='all';else if(link.getAttribute('href')==='#workspace-apps'){selected='all';search.querySelector('input').value='';}filter();};
  bar.onclick=event=>{const button=event.target.closest('[data-tool-filter]');if(button){selected=button.dataset.toolFilter;filter();}};
  filter();
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);new MutationObserver(mount).observe(document.querySelector('#platform'),{childList:true,subtree:true});
})();
