// Shared discovery for guests and signed-in accounts; permissions stay server-owned.
(() => {
 const catalogue=window.SynapseCatalogue;
 function mount(){
  const section=document.querySelector('#free-apps');if(!section)return;if(section.dataset.discoveryReady)return;
  const home=section.closest('.public-home'),grid=section.querySelector('.public-apps'),bar=section.querySelector('.home-filters');if(!grid||!bar)return;
  section.dataset.discoveryReady='true';grid.id='home-tool-grid';grid.setAttribute('role','region');grid.setAttribute('aria-label','Free tools');grid.tabIndex=0;bar.hidden=false;section.classList.add('home-discovery-ready');
  const status=section.querySelector('.home-filter-status'),search=home.querySelector('.home-search');
  const toolbar=document.createElement('div');toolbar.className='home-discovery-toolbar';search.before(toolbar);toolbar.append(search);
  const filters=document.createElement('details');filters.className='home-filter-menu';const toggle=document.createElement('summary');toggle.textContent='Filters';filters.append(toggle,bar);toolbar.append(filters);
  const active=document.createElement('div');active.className='home-active-filters';const chip=document.createElement('button');chip.type='button';const clear=document.createElement('button');clear.type='button';clear.textContent='Clear all';active.append(chip,clear);toolbar.after(active);
  const categoryName=()=>bar.querySelector('[data-tool-filter="'+selected+'"]')?.textContent||'All';
  chip.onclick=()=>{selected='all';filter();toggle.focus();};clear.onclick=()=>{selected='all';search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  filters.addEventListener('keydown',event=>{if(event.key==='Escape'){filters.open=false;toggle.focus();}});
  document.addEventListener('click',event=>{if(filters.isConnected&&!filters.contains(event.target))filters.open=false;});
  search.querySelector('input').placeholder='Search apps…';
  const empty=home.querySelector('.home-search-empty')||document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';if(!empty.isConnected)grid.after(empty);
  let selected=bar.querySelector('[aria-pressed=true]')?.dataset.toolFilter||'all';
  function filter(){
   const terms=search.querySelector('input').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let count=0,publicCount=0,workspaceCount=0;
   for(const card of home.querySelectorAll('.public-app,.workspace-card')){
    const app=catalogue.apps.find(a=>a.id===card.dataset.appId);if(!app)continue;
    const text=catalogue.appSearchText(app);card.hidden=(selected!=='all'&&!app.groups.includes(selected))||!terms.every(term=>text.includes(term));
    if(card.matches('.public-app'))card.closest('.catalogue-item').hidden=card.hidden;
    if(!card.hidden){count++;if(app.public)publicCount++;else workspaceCount++;}
   }
   bar.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.toolFilter===selected)));
   const feature=home.querySelector('[data-home-vedic]'),featuredApp=catalogue.apps.find(app=>app.homeFeatureOnly);
   if(feature&&featuredApp){feature.hidden=(selected!=='all'&&!featuredApp.groups.includes(selected))||!terms.every(term=>catalogue.appSearchText(featuredApp).includes(term));if(!feature.hidden)count++;}
   status.textContent=count+' apps';empty.hidden=count!==0||!home.querySelector('.catalogue-item');grid.hidden=publicCount===0;home.querySelector('#workspace-apps').hidden=workspaceCount===0;search.querySelector('button').hidden=!terms.length;
   toggle.textContent=selected==='all'?'Filters':'Filters · 1';chip.hidden=selected==='all';chip.textContent=categoryName()+' ×';chip.setAttribute('aria-label','Remove category filter: '+categoryName());active.hidden=selected==='all'&&!terms.length;
  }
  search.querySelector('input').oninput=filter;search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  search.querySelector('input').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();search.querySelector('input').value='';filter();}};
  const dock=home.querySelector('.home-mobile-dock');dock.onclick=event=>{const link=event.target.closest('a');if(!link)return;dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.hasAttribute('data-home-games')){selected='games';search.querySelector('input').value='';}else if(link.getAttribute('href')==='#free-apps')selected='all';else if(link.getAttribute('href')==='#workspace-apps'){selected='all';search.querySelector('input').value='';}filter();};
  bar.onclick=event=>{const button=event.target.closest('[data-tool-filter]');if(button){selected=button.dataset.toolFilter;filter();filters.open=false;toggle.focus();}};
  filter();
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);if(window.SynapseUI)window.SynapseUI.observe(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#free-apps')||n.querySelector('#free-apps')))))mount();});else new MutationObserver(mount).observe(document.querySelector('#platform'),{childList:true,subtree:true});
})();
