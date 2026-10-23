// Shared discovery for guests and signed-in accounts; permissions stay server-owned.
(() => {
 const catalogue=window.SynapseCatalogue;
 let dispose=()=>{};
 function carousel(track,heading,label,{featured=false}={}){
  const controls=document.createElement('div');controls.className='home-carousel-arrows';
  const previous=document.createElement('button'),next=document.createElement('button');previous.type=next.type='button';previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','Previous '+label);next.setAttribute('aria-label','Next '+label);controls.append(previous,next);heading.classList.add('home-carousel-heading');heading.append(controls);
  const dots=document.createElement('div');dots.className='home-carousel-dots';dots.setAttribute('role','group');dots.setAttribute('aria-label',label+' pages');track.after(dots);
  track.id ||= featured?'home-feature-track':'home-tool-grid';previous.setAttribute('aria-controls',track.id);next.setAttribute('aria-controls',track.id);track.classList.add('home-carousel-track');track.setAttribute('role','region');track.setAttribute('aria-label',label);track.setAttribute('aria-roledescription','carousel');track.tabIndex=0;
  let targets=[],active=0,frame=0;
  function offsets(){const bounds=track.getBoundingClientRect(),max=Math.max(0,track.scrollWidth-track.clientWidth);return targets.map(el=>Math.min(max,Math.max(0,el.getBoundingClientRect().left-bounds.left+track.scrollLeft)));}
  function go(index){const values=offsets();if(!values.length)return;track.scrollTo({left:values[Math.max(0,Math.min(index,values.length-1))],behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function update(){
   const items=[...track.children].filter(el=>!el.hidden),perPage=2;targets=items.filter((_,i)=>i%perPage===0);
   const values=offsets();active=values.reduce((best,left,i)=>Math.abs(left-track.scrollLeft)<Math.abs(values[best]-track.scrollLeft)?i:best,0);
   if(dots.childElementCount!==targets.length){dots.replaceChildren(...targets.map((_,i)=>{const button=document.createElement('button'),mark=document.createElement('span');button.type='button';button.setAttribute('aria-label',label+' page '+(i+1)+' of '+targets.length);button.setAttribute('aria-controls',track.id);button.append(mark);button.onclick=()=>go(i);return button;}));}
   [...dots.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===active)));previous.disabled=active===0;next.disabled=active>=targets.length-1;controls.hidden=dots.hidden=targets.length<2;
  }
  function scrolled(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;update();});}
  function keydown(event){if(event.target!==track||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();go(event.key==='Home'?0:event.key==='End'?targets.length-1:active+(event.key==='ArrowRight'?1:-1));}
  previous.onclick=()=>go(active-1);next.onclick=()=>go(active+1);track.addEventListener('scroll',scrolled,{passive:true});track.addEventListener('keydown',keydown);const observer=new ResizeObserver(update);observer.observe(track);update();
  return {update,reset(){track.scrollTo({left:0,behavior:'instant'});update();},destroy(){observer.disconnect();cancelAnimationFrame(frame);track.removeEventListener('scroll',scrolled);track.removeEventListener('keydown',keydown);controls.remove();dots.remove();heading.classList.remove('home-carousel-heading');track.classList.remove('home-carousel-track');}};
 }
 function mount(){
  const section=document.querySelector('#free-apps');if(!section){dispose();dispose=()=>{};return;}if(section.dataset.discoveryReady)return;
  const home=section.closest('.public-home'),grid=section.querySelector('.public-apps'),bar=section.querySelector('.home-filters');if(!grid||!bar)return;
  dispose();section.dataset.discoveryReady='true';grid.id='home-tool-grid';grid.setAttribute('role','region');grid.setAttribute('aria-label','Free tools');grid.tabIndex=0;bar.hidden=false;section.classList.add('home-discovery-ready');
  const status=section.querySelector('.home-filter-status'),search=home.querySelector('.home-search');
  const feature=home.querySelector('.home-featured')||document.createElement('section');feature.className='home-featured';feature.setAttribute('aria-labelledby','home-featured-title');
  feature.innerHTML='<div class="home-section-heading"><h2 id="home-featured-title">Featured apps</h2></div><div class="home-feature-grid">'+catalogue.featuredApps().filter(a=>grid.querySelector('[data-app-id="'+a.id+'"].public-app')).map(catalogue.renderFeatured).join('')+'</div>';
  if(!feature.isConnected)bar.after(feature);const heading=section.querySelector('.access-heading');if(feature.nextElementSibling!==heading)feature.after(heading);section.querySelector('#free-title').textContent='Explore apps';
  const empty=home.querySelector('.home-search-empty')||document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';if(!empty.isConnected)grid.after(empty);
  const featuredCarousel=carousel(feature.querySelector('.home-feature-grid'),feature.querySelector('.home-section-heading'),'Featured apps',{featured:true});
  dispose=()=>featuredCarousel.destroy();
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
   status.textContent=count+' apps';empty.hidden=count!==0||!home.querySelector('.catalogue-item');grid.hidden=publicCount===0;home.querySelector('#workspace-apps').hidden=workspaceCount===0;search.querySelector('button').hidden=!terms.length;feature.hidden=selected!=='all'||!!terms.length||['favorites','recent'].includes(home.dataset.collection);
   featuredCarousel.update();
  }
  search.querySelector('input').oninput=filter;search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  search.querySelector('input').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();search.querySelector('input').value='';filter();}};
  const dock=home.querySelector('.home-mobile-dock');dock.onclick=event=>{const link=event.target.closest('a');if(!link)return;dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.hasAttribute('data-home-games')){selected='games';search.querySelector('input').value='';}else if(link.getAttribute('href')==='#free-apps')selected='all';else if(link.getAttribute('href')==='#workspace-apps'){selected='all';search.querySelector('input').value='';}filter();};
  bar.onclick=event=>{const button=event.target.closest('[data-tool-filter]');if(button){selected=button.dataset.toolFilter;filter();}};
  filter();
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);new MutationObserver(mount).observe(document.querySelector('#platform'),{childList:true,subtree:true});
})();
