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
  const groupLabels=[['all','All'],['home','Home & property'],['utility','Everyday tools'],['planning','Planning'],['create','Cards & certificates'],['traditions','Traditions'],['games','Play'],['work','Workspaces']];
  bar.replaceChildren(...groupLabels.map(([id,label])=>{const b=document.createElement('button');b.type='button';b.dataset.toolFilter=id;b.textContent=label;b.setAttribute('aria-controls','home-tool-grid');b.setAttribute('aria-pressed',String(id==='all'));return b;}));
  home.querySelector('.home-shortcuts')?.remove();
  let toolbar=home.querySelector('.home-discovery-toolbar');
  if(!toolbar){toolbar=document.createElement('div');toolbar.className='home-discovery-toolbar';search.before(toolbar);toolbar.append(search);const panel=document.createElement('details');panel.className='home-filter-menu';panel.innerHTML='<summary>Filters</summary>';panel.append(bar);toolbar.append(panel);const row=document.createElement('div');row.className='home-active-filters';row.hidden=true;row.innerHTML='<button type="button" hidden></button><button type="button">Clear all</button>';toolbar.after(row);}
  const filters=toolbar.querySelector('.home-filter-menu'),toggle=filters.querySelector('summary'),active=home.querySelector('.home-active-filters'),[chip,clear]=active.querySelectorAll('button');
  let filterLabel=toggle.querySelector('.home-filter-label');if(!filterLabel){filterLabel=document.createElement('span');filterLabel.className='home-filter-label';filterLabel.textContent=toggle.textContent;toggle.replaceChildren(filterLabel);}
  mountEvents?.abort();mountEvents=new AbortController();
  const categoryName=()=>bar.querySelector('[data-tool-filter="'+selected+'"]')?.textContent||'All';
  chip.onclick=()=>{selected='all';filter();toggle.focus();};clear.onclick=()=>{selected='all';search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  filters.addEventListener('keydown',event=>{if(event.key==='Escape'){filters.open=false;toggle.focus();}});
  document.addEventListener('click',event=>{if(filters.open&&!filters.contains(event.target))filters.open=false;},{signal:mountEvents.signal});
  search.querySelector('input').placeholder='Search apps…';
  const empty=home.querySelector('.home-search-empty')||document.createElement('p');empty.className='home-search-empty';empty.hidden=true;empty.setAttribute('role','status');empty.textContent='No apps match your search. Try another word or category.';if(!empty.isConnected)grid.after(empty);
  let selected=bar.querySelector('[aria-pressed=true]')?.dataset.toolFilter||'all';
  const searchTexts=new WeakMap();let layoutRefresh=()=>{};
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
   text(status,count+' apps');hidden(empty,count!==0||!home.querySelector('.catalogue-item'));hidden(grid,publicCount===0&&(!feature||feature.hidden));hidden(home.querySelector('#workspace-apps'),workspaceCount===0);hidden(search.querySelector('button'),!terms.length);
   attribute(filters,'data-active',String(selected!=='all'));text(filterLabel,selected==='all'?'Filters':'Filters · 1');hidden(chip,selected==='all');text(chip,categoryName()+' ×');attribute(chip,'aria-label','Remove category filter: '+categoryName());hidden(active,selected==='all'&&!terms.length);
   const footer=home.querySelector('.home-mobile-dock');if(footer){const current=footer.querySelector('[aria-current]'),target=selected==='games'?footer.querySelector('[data-home-games]'):current?.getAttribute('href')==='#workspace-apps'?current:footer.querySelector('a');for(const link of footer.querySelectorAll('a')){if(link===target)attribute(link,'aria-current','location');else link.removeAttribute('aria-current');}}
   layoutRefresh();
  }
  search.querySelector('input').oninput=filter;search.querySelector('button').onclick=()=>{search.querySelector('input').value='';filter();search.querySelector('input').focus();};
  search.querySelector('input').onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();search.querySelector('input').value='';filter();}else if(event.key==='ArrowDown'){const first=home.querySelector('.catalogue-item:not([hidden]) .public-app:not([hidden]),[data-home-vedic]:not([hidden]) .home-vedic-primary,.workspace-card:not([hidden]) .workspace-launch:not([aria-disabled=true])');if(first){event.preventDefault();first.focus();first.scrollIntoView({block:'nearest'});}}};
  const dock=home.querySelector('.home-mobile-dock');dock.onclick=event=>{const link=event.target.closest('a');if(!link)return;dock.querySelectorAll('a').forEach(a=>a.removeAttribute('aria-current'));link.setAttribute('aria-current','location');if(link.hasAttribute('data-home-games'))selected='games';else selected='all';search.querySelector('input').value='';filter();};
  bar.onclick=event=>{const button=event.target.closest('[data-tool-filter]');if(button){selected=button.dataset.toolFilter;filter();filters.open=false;toggle.focus();}};
  filter();window.SynapseHomeView?.mount();layoutRefresh=mountLayout(home);window.SynapseHomeAgent?.mount(home);
 }
 mount();window.addEventListener('synapse-catalogue-change',mount);if(window.SynapseUI)window.SynapseUI.observe(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('#free-apps')||n.querySelector('#free-apps')))))mount();});else new MutationObserver(mount).observe(document.querySelector('#platform'),{childList:true,subtree:true});
 function mountLayout(home){
  const key='synapse-home-layout-v1',grids=[...home.querySelectorAll('.public-apps,.workspace-grid')];
  const cards=()=>grids.flatMap(g=>[...g.children].filter(c=>c.matches('.catalogue-item')));
  const defaults=cards().map(c=>c.dataset.appId),known=new Set(defaults);
  const clean=value=>Array.isArray(value)?[...new Set(value.filter(id=>typeof id==='string'&&known.has(id)))]:[];
  let state={order:[],pins:[]},editing=false,drag=null;
  try{const saved=JSON.parse(localStorage.getItem(key));state={order:clean(saved?.order),pins:clean(saved?.pins)};}catch{}
  const copy={en:['Edit layout','Done','Reset layout','Drag a handle or use the arrows. Pinned apps stay first. Saved on this device.','Pin','Unpin','Move earlier','Move later','Drag to move','Layout saved on this device.','Storage unavailable; layout lasts until this page closes.'],hi:['क्रम बदलें','हो गया','मूल क्रम','हैंडल खींचें या तीर दबाएँ। पिन किए ऐप पहले रहेंगे। क्रम इस डिवाइस पर सहेजा जाता है।','पिन करें','पिन हटाएँ','पहले करें','बाद में करें','खींचकर स्थान बदलें','क्रम इस डिवाइस पर सहेजा गया।','स्टोरेज उपलब्ध नहीं; यह क्रम पेज बंद होने तक रहेगा।'],gu:['ક્રમ બદલો','પૂર્ણ','મૂળ ક્રમ','હેન્ડલ ખેંચો અથવા તીર દબાવો. પિન કરેલી ઍપ પહેલાં રહેશે. ક્રમ આ ઉપકરણ પર સચવાય છે.','પિન કરો','પિન દૂર કરો','પહેલાં ખસેડો','પછી ખસેડો','ખેંચીને ખસેડો','ક્રમ આ ઉપકરણ પર સચવાયો.','સ્ટોરેજ ઉપલબ્ધ નથી; ક્રમ પેજ બંધ થાય ત્યાં સુધી રહેશે.']};
  const words=()=>copy[(document.documentElement.lang||'en').split('-')[0]]||copy.en;
  const tools=document.createElement('div');tools.className='home-layout-toolbar';tools.setAttribute('translate','no');
  const edit=document.createElement('button'),reset=document.createElement('button'),hint=document.createElement('p'),notice=document.createElement('p');
  edit.type=reset.type='button';edit.className='home-layout-edit';reset.className='home-layout-reset';hint.className='home-layout-hint';notice.className='sr-only';notice.setAttribute('role','status');
  const menu=document.querySelector('.platform-settings'),choices=menu.querySelector('.platform-settings-panel,.home-view-options'),done=document.createElement('button');done.type='button';done.className='home-layout-done';choices.append(edit,reset);tools.append(done,hint,notice);home.querySelector('.home-discovery-toolbar').after(tools);done.onclick=()=>{editing=false;paint();menu.querySelector('summary').focus();};
  const controls=new Map();
  for(const card of cards()){
   const row=document.createElement('div');row.className='home-layout-controls';row.setAttribute('translate','no');
   const buttons=['pin','earlier','later','drag'].map(action=>{const b=document.createElement('button');b.type='button';b.dataset.layoutAction=action;b.textContent={pin:'☆',earlier:'←',later:'→',drag:'⠿'}[action];row.append(b);return b;});
   card.append(row);controls.set(card,buttons);
   buttons[0].onclick=()=>{const id=card.dataset.appId;state.pins=state.pins.includes(id)?state.pins.filter(x=>x!==id):[...state.pins,id];paint();save();buttons[0].focus();};
   buttons.slice(1,3).forEach((button,i)=>button.onclick=()=>{const siblings=peers(card),index=siblings.indexOf(card),target=siblings[index+(i?1:-1)];if(target)move(card,target);button.focus();});
   buttons[3].addEventListener('pointerdown',event=>{
    if(!editing||event.button!==0)return;event.preventDefault();buttons[3].setPointerCapture(event.pointerId);drag={card,x:event.clientX,y:event.clientY,target:null,frame:0};card.classList.add('home-layout-dragging');
    const scroll=()=>{if(!drag)return;const y=drag.y;if(y<90)window.scrollBy(0,-12);else if(y>innerHeight-90)window.scrollBy(0,12);drag.frame=requestAnimationFrame(scroll);};scroll();
   });
   buttons[3].addEventListener('pointermove',event=>{if(!drag||drag.card!==card)return;drag.x=event.clientX;drag.y=event.clientY;const target=document.elementFromPoint(drag.x,drag.y)?.closest('.catalogue-item');cards().forEach(c=>c.classList.remove('home-layout-drop'));drag.target=target!==card&&peers(card).includes(target)?target:null;drag.target?.classList.add('home-layout-drop');});
   const finish=event=>{if(!drag||drag.card!==card)return;const target=drag.target;cancelAnimationFrame(drag.frame);drag=null;cards().forEach(c=>c.classList.remove('home-layout-dragging','home-layout-drop'));if(event.type==='pointerup'&&target)move(card,target);};
   buttons[3].addEventListener('pointerup',finish);buttons[3].addEventListener('pointercancel',finish);buttons[3].addEventListener('lostpointercapture',finish);
  }
  function peers(card){return [...card.parentElement.children].filter(c=>!c.hidden&&c.matches('.catalogue-item')&&state.pins.includes(c.dataset.appId)===state.pins.includes(card.dataset.appId));}
  function move(card,target){const siblings=[...card.parentElement.children],from=siblings.indexOf(card),to=siblings.indexOf(target);card.parentElement.insertBefore(card,from<to?target.nextSibling:target);state.order=cards().map(c=>c.dataset.appId);paint();save();}
  function save(){try{localStorage.setItem(key,JSON.stringify(state));notice.textContent=words()[9];}catch{notice.textContent=words()[10];}}
  function paint(){
   const w=words(),order=[...state.order,...defaults.filter(id=>!state.order.includes(id))];
   for(const grid of grids){const before=[...grid.children].filter(c=>c.matches('.catalogue-item')),list=[...before];list.sort((a,b)=>Number(state.pins.includes(b.dataset.appId))-Number(state.pins.includes(a.dataset.appId))||order.indexOf(a.dataset.appId)-order.indexOf(b.dataset.appId));if(list.some((c,i)=>c!==before[i]))list.forEach(c=>grid.append(c));}
   const feature=home.querySelector('[data-home-vedic]'),publicGrid=grids[0],rent=publicGrid.querySelector('[data-app-id=kiraya-saathi]');if(feature){const anchor=rent&&!rent.hidden?rent:[...publicGrid.children].find(c=>c.matches('.catalogue-item')&&!c.hidden);if(anchor===rent){if(rent.nextElementSibling!==feature)rent.after(feature);}else if(anchor){if(feature.nextElementSibling!==anchor)anchor.before(feature);}else if(feature.parentElement!==publicGrid)publicGrid.append(feature);}tools.hidden=!editing;done.textContent=w[1];edit.textContent=editing?w[1]:w[0];edit.setAttribute('aria-pressed',String(editing));reset.textContent=w[2];reset.hidden=false;hint.hidden=!editing;hint.textContent=w[3];home.classList.toggle('home-layout-editing',editing);
   for(const card of cards()){const b=controls.get(card);if(!b)continue;const pinned=state.pins.includes(card.dataset.appId),name=card.querySelector('.compact-app-name')?.textContent||card.dataset.appId;card.classList.toggle('home-layout-pinned',pinned);b[0].textContent=pinned?'★':'☆';b[0].setAttribute('aria-pressed',String(pinned));[pinned?w[5]:w[4],w[6],w[7],w[8]].forEach((label,i)=>{b[i].setAttribute('aria-label',label+': '+name);b[i].title=label;});const siblings=peers(card),index=siblings.indexOf(card);b[1].disabled=index<=0;b[2].disabled=index===siblings.length-1;card.querySelector('.home-layout-controls').hidden=!editing;}
  }
  edit.onclick=()=>{editing=!editing;paint();menu.open=false;if(editing)done.focus();else menu.querySelector('summary').focus();};reset.onclick=()=>{state={order:[],pins:[]};paint();save();};
  home.addEventListener('click',event=>{if(editing&&event.target.closest('.catalogue-item>.compact-app')){event.preventDefault();event.stopPropagation();}},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&editing&&home.isConnected){editing=false;paint();menu.querySelector('summary').focus();}});
  let lastLanguage=document.documentElement.lang;const observer=new MutationObserver(()=>{if(lastLanguage!==document.documentElement.lang){lastLanguage=document.documentElement.lang;paint();}});observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  mountEvents.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
  paint();return paint;
 }
})();
