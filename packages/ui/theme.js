'use strict';
(() => {
 if(window.SynapseTheme&&window.SynapseUI)return;
 try{const value=localStorage.getItem('synapse-language');if(['en','hi','gu'].includes(value)){document.documentElement.lang=value;document.documentElement.dataset.language=value;}}catch{}
 // One mutation subscription point for shared chrome and dynamic app roots.
 const listeners=new Set();
 const observer=new MutationObserver(records=>{for(const listener of listeners)listener(records);});
 observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});
 window.SynapseUI={observe(listener){listeners.add(listener);return ()=>listeners.delete(listener);}};
 let memory='light';
 const customThemes=['deep'];
 const extraThemes={deep:{en:'Deep Black',hi:'गहरा काला',gu:'ઘેરો કાળો'}};
 const valid=value=>['gold','glossy','silver','diamond'].includes(value)?'dark':['light','dark',...customThemes].includes(value)?value:'light';
 const icons='<svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></svg><svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z"/></svg>';
 function preference(){try{return valid(localStorage.getItem('synapse-theme')||localStorage.getItem('chambers-theme')||memory);}catch{return memory;}}
 // Existing app controllers continue receiving a supported light/dark value.
 function read(){const value=preference();return customThemes.includes(value)?'dark':value;}
 function resolved(){return read();}
 function sync(){const value=preference(),dark=resolved()==='dark',theme=dark?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.dataset.themeStyle=customThemes.includes(value)?value:'';if(document.body){document.body.dataset.theme=theme;document.body.dataset.themeStyle=customThemes.includes(value)?value:'';}document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.value=value;button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','synapse-theme-picker');button.setAttribute('aria-expanded',String(Boolean(picker?.open)));button.title='Choose theme';button.setAttribute('aria-label','Theme');});if(picker)picker.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-checked',String(button.dataset.themeChoice===value)));}
 // Only an explicit picker choice should replace a custom palette preference.
 function write(value,explicit=false){const previous=preference();memory=!explicit&&customThemes.includes(previous)&&value==='dark'?previous:valid(value);try{localStorage.setItem('synapse-theme',memory);localStorage.setItem('chambers-theme',memory);}catch{}sync();}
 function control(attributes=''){return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="Dark mode" aria-pressed="${resolved()==='dark'}" value="${read()}" ${attributes}>${icons}</button>`;}
 let picker=null,trigger=null;
 window.SynapseTheme={read,write,control,preference};
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/shared/theme-picker.css';document.head.append(stylesheet);
 function changed(){document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.dispatchEvent(new Event('change',{bubbles:true})));sync();}
 function openPicker(button){
  trigger=button;
  if(!picker){picker=document.createElement('dialog');picker.id='synapse-theme-picker';picker.className='synapse-theme-picker';picker.setAttribute('aria-labelledby','synapse-theme-title');picker.setAttribute('data-language-preserve','');picker.innerHTML='<div class="theme-picker-heading"><h2 id="synapse-theme-title">Theme</h2><button type="button" data-theme-close aria-label="Close theme picker">×</button></div><div role="radiogroup" aria-label="Theme"><button type="button" role="radio" data-theme-choice="light"><span class="theme-swatch swatch-light" aria-hidden="true"></span><span>Light</span></button><button type="button" role="radio" data-theme-choice="dark"><span class="theme-swatch swatch-dark" aria-hidden="true"></span><span>Dark</span></button></div><p>Your choice is saved on this browser.</p>';document.body.append(picker);for(const [key,labels]of Object.entries(extraThemes)){const option=document.createElement('button');option.type='button';option.setAttribute('role','radio');option.dataset.themeChoice=key;option.innerHTML='<span class="theme-swatch swatch-'+key+'" aria-hidden="true"></span><span></span>';picker.querySelector('[role=radiogroup]').append(option);}
   picker.querySelector('[data-theme-close]').onclick=()=>picker.close();picker.addEventListener('close',()=>{sync();if(trigger?.isConnected)trigger.focus();});
   picker.addEventListener('click',event=>{const option=event.target.closest('[data-theme-choice]');if(option){write(option.dataset.themeChoice,true);changed();picker.close();}else if(event.target===picker){const box=picker.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)picker.close();}});
   picker.addEventListener('keydown',event=>{if(!event.target.matches('[data-theme-choice]')||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const options=[...picker.querySelectorAll('[data-theme-choice]')],index=options.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:options.length-1))%options.length;options[next].focus();});
  }
  const lang=document.documentElement.lang,copy=lang==='hi'?['थीम','हल्का','गहरा','थीम बंद करें','आपकी पसंद इस ब्राउज़र में सहेजी जाती है।']:lang==='gu'?['થીમ','લાઇટ','ડાર્ક','થીમ બંધ કરો','તમારી પસંદ આ બ્રાઉઝરમાં સાચવવામાં આવે છે.']:['Theme','Light','Dark','Close theme picker','Your choice is saved on this browser.'];picker.querySelector('h2').textContent=copy[0];picker.querySelector('[role=radiogroup]').setAttribute('aria-label',copy[0]);picker.querySelectorAll('[data-theme-choice]>span:last-child').forEach((span,i)=>{const key=span.parentElement.dataset.themeChoice,label=extraThemes[key]?.[lang]||extraThemes[key]?.en||copy[({light:1,dark:2})[key]];span.textContent=label;span.parentElement.setAttribute('aria-label',label);});picker.querySelector('[data-theme-close]').setAttribute('aria-label',copy[3]);picker.querySelector('p').textContent=copy[4];picker.showModal();sync();picker.querySelector('[aria-checked=true]').focus();
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-theme-toggle]');if(button)openPicker(button);});
 window.addEventListener('storage',event=>{if(event.key!==null&&!['synapse-theme','chambers-theme'].includes(event.key))return;memory='light';sync();changed();});
 window.SynapseUI.observe(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches('body,[data-theme-toggle]')||node.querySelector('[data-theme-toggle]')))))sync();});
 sync();
})();
