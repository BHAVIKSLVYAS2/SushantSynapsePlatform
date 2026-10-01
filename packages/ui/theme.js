'use strict';
(() => {
 const media=matchMedia('(prefers-color-scheme: dark)');
 let memory='system';
 const valid=value=>['light','dark','system'].includes(value)?value:'system';
 const icons='<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></svg><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z"/></svg>';
 function read(){try{return valid(localStorage.getItem('synapse-theme')||localStorage.getItem('chambers-theme')||memory);}catch{return memory;}}
 function resolved(){const value=read();return value==='system'?(media.matches?'dark':'light'):value;}
 function sync(){const value=read(),dark=resolved()==='dark';document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.value=value;button.setAttribute('aria-pressed',String(dark));button.title=dark?'Switch to light mode':'Switch to dark mode';});}
 function write(value){memory=valid(value);try{localStorage.setItem('synapse-theme',memory);localStorage.setItem('chambers-theme',memory);}catch{}sync();}
 function control(attributes=''){return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="Dark mode" aria-pressed="${resolved()==='dark'}" value="${read()}" ${attributes}>${icons}</button>`;}
 window.SynapseTheme={read,write,control};
 document.addEventListener('click',event=>{const button=event.target.closest('[data-theme-toggle]');if(!button)return;write(resolved()==='dark'?'light':'dark');button.dispatchEvent(new Event('change',{bubbles:true}));});
 window.addEventListener('storage',event=>{if(event.key!==null&&!['synapse-theme','chambers-theme'].includes(event.key))return;memory='system';sync();document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.dispatchEvent(new Event('change',{bubbles:true})));});
 media.addEventListener('change',sync);
 new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
 sync();
})();
