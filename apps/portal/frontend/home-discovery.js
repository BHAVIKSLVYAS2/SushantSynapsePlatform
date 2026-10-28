// Shared discovery for guests and signed-in accounts; permissions stay server-owned.
(() => {
 const catalogue=window.SynapseCatalogue;
 let mountEvents;
 const hidden=(node,value)=>{if(node.hidden!==value)node.hidden=value;};
 const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 const attribute=(node,name,value)=>{if(node.getAttribute(name)!==value)node.setAttribute(name,value);};
 function mount(){
  const section=document.querySelector('#free-apps');if(!section)return;if(section.dataset.discoveryReady)return;
  const home=section.closest('.public-home'),grid=section.querySelector('.public-apps'),bar=section.querySelector('.home-filters');if(!grid||!bar)return;
  section.dataset.discoveryReady='true';grid.id='home-tool-grid';grid.setAttribute('role','region');grid.setAttribute('aria-label','Free tools');grid.tabIndex=0;bar.hidden=false;section.classList.add('home-discovery-ready');
  const status=section.querySelector('.home-filter-status'),search=home.querySelector('.home-search');
  let toolbar=home.querySelector('.home-discovery-toolbar');
  if(!toolbar){toolbar=document.createElement('div');toolbar.className='home-discovery-toolbar';search.before(toolbar);toolbar.append(search);const panel=document.createElement('details');panel.className='home-filter-menu';panel.innerHTML='<summary>Filters</summary>';panel.append(bar);toolbar.append(panel);const row=document.createElement('div');row.className='home-active-filters';row.hidden=true;row.innerHTML='<button type="button" hidden></button><button type="button">Clear all</button>';toolbar.after(row);}
  const filters=toolbar.querySelector('.home-filter-menu'),toggle=filters.querySelector('summary'),active=home.querySelector('.home-active-filters'),[chip,clear]=active.querySelectorAll('button');
  mountEvents?.abort();mountEvents=new AbortController();
  const categoryName=()=>bar.querySelector('[data-tool-filter="'+selected+'"]')?.textContent||'All';
  chip.onclick=()=>{selected='all';filter();toggle.focus();};clear.onclick=()=>{selected='all';search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  filters.addEventListener('keydown',event=>{if(event.key==='Escape'){filters.open=false;toggle.focus();}});
  document.addEventListener('click',event=>{if(filters.open&&!filters.contains(event.target))filters.open=false;},{signal:mountEvents.signal});
  search.querySelector('input').placeholder='Search apps…';
  const empty=home.querySelector('.home-search-empty')||document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';if(!empty.isConnected)grid.after(empty);
  let selected=bar.querySelector('[aria-pressed=true]')?.dataset.toolFilter||'all';
  const searchTexts=new WeakMap();
  function filter(){
   const terms=search.querySelector('input').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let count=0,publicCount=0,workspaceCount=0;
   const apps=new Map(catalogue.apps.map(app=>[app.id,app]));
   for(const card of home.querySelectorAll('.public-app,.workspace-card')){
    const app=apps.get(card.dataset.appId);if(!app)continue;
    if(!searchTexts.has(app))searchTexts.set(app,catalogue.appSearchText(app));
    const value=searchTexts.get(app);hidden(card,(selected!=='all'&&!app.groups.includes(selected))||!terms.every(term=>value.includes(term)));
    if(card.matches('.public-app'))hidden(card.closest('.catalogue-item'),card.hidden);
    if(!card.hidden){count++;if(app.public)publicCount++;else workspaceCount++;}
   }
   bar.querySelectorAll('button').forEach(button=>attribute(button,'aria-pressed',String(button.dataset.toolFilter===selected)));
   const feature=home.querySelector('[data-home-vedic]'),featuredApp=catalogue.apps.find(app=>app.homeFeatureOnly);
   if(feature&&featuredApp){hidden(feature,(selected!=='all'&&!featuredApp.groups.includes(selected))||!terms.every(term=>catalogue.appSearchText(featuredApp).includes(term)));if(!feature.hidden)count++;}
   text(status,count+' apps');hidden(empty,count!==0||!home.querySelector('.catalogue-item'));hidden(grid,publicCount===0);hidden(home.querySelector('#workspace-apps'),workspaceCount===0);hidden(search.querySelector('button'),!terms.length);
   text(toggle,selected==='all'?'Filters':'Filters · 1');hidden(chip,selected==='all');text(chip,categoryName()+' ×');attribute(chip,'aria-label','Remove category filter: '+categoryName());hidden(active,selected==='all'&&!terms.length);
  }
  search.querySelector('input').oninput=filter;search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  search.querySelector('input').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();search.querySelector('input').value='';filter();}};
  const dock=home.querySelector('.home-mobile-dock');dock.onclick=event=>{const link=event.target.closest('a');if(!link)return;dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.hasAttribute('data-home-games')){selected='games';search.querySelector('input').value='';}else if(link.getAttribute('href')==='#free-apps')selected='all';else if(link.getAttribute('href')==='#workspace-apps'){selected='all';search.querySelector('input').value='';}filter();};
  bar.onclick=event=>{const button=event.target.closest('[data-tool-filter]');if(button){selected=button.dataset.toolFilter;filter();filters.open=false;toggle.focus();}};
  filter();
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);if(window.SynapseUI)window.SynapseUI.observe(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#free-apps')||n.querySelector('#free-apps')))))mount();});else new MutationObserver(mount).observe(document.querySelector('#platform'),{childList:true,subtree:true});
})();
