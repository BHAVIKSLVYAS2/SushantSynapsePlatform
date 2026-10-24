let data;
function mount(){if(location.pathname!=='/')return;const footer=document.querySelector('.synapse-legal-footer');if(!footer)return;const existing=footer.querySelector('#visitor-count');if(existing){const text=data?new Intl.NumberFormat('en-IN').format(data.count)+' estimated unique browsers':'Visitor count unavailable';if(existing.textContent!==text)existing.textContent=text;return;}const el=document.createElement('span');el.id='visitor-count';el.title='Estimated unique browsers across this website since activation. Cleared storage or other browsers can count again.';el.style.cssText='display:block;flex-basis:100%;font-size:12px;color:var(--ui-muted,currentColor);font-variant-numeric:tabular-nums';el.textContent=data?new Intl.NumberFormat('en-IN').format(data.count)+' estimated unique browsers':'Visitor count unavailable';footer.append(el);}
if(location.pathname==='/'){const observe=records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('.synapse-legal-footer')||n.querySelector('.synapse-legal-footer')))))mount();};if(window.SynapseUI)window.SynapseUI.observe(observe);else new MutationObserver(observe).observe(document.body,{childList:true,subtree:true});}
async function request(method,id){
 const response=await fetch('/api/platform/visitors',{method,cache:'no-store',...(id?{headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}:{})});
 if(response.status===409)return null;
 if(!response.ok)throw Error('Counter unavailable');
 return response.json();
}
try{
 let id;try{const key='synapse-platform-visitor-v1';id=localStorage.getItem(key);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'')){id=crypto.randomUUID();localStorage.setItem(key,id);}}catch{id=null;}
 for(let attempt=0;attempt<3&&!data;attempt++)data=await request(id?'POST':'GET',id);
 if(!data)throw Error('Counter busy');
 mount();
}catch{mount();}
