import {contactMessage,whatsappLink} from './whatsapp-engine.mjs';
const themeMedia=matchMedia('(prefers-color-scheme:dark)');
function applyTheme(){if(!window.SynapseTheme)return;const value=window.SynapseTheme.read();document.documentElement.dataset.theme=value==='system'?(themeMedia.matches?'dark':'light'):value;}
applyTheme();themeMedia.addEventListener('change',applyTheme);window.addEventListener('storage',applyTheme);document.addEventListener('change',event=>{if(event.target.matches('[data-theme-toggle]'))applyTheme();});
for(const button of document.querySelectorAll('[data-theme-toggle]'))if(!button.querySelector('svg')&&window.SynapseTheme){button.classList.add('theme-toggle');button.innerHTML=window.SynapseTheme.control().match(/<button[^>]*>([\s\S]*)<\/button>/)[1];}
for(const form of document.querySelectorAll('form[data-whatsapp-kind]')){
 const panel=form.querySelector('[data-whatsapp-preview]'),preview=panel.querySelector('textarea'),link=panel.querySelector('a'),status=panel.querySelector('[role=status]');
 function clear(){panel.hidden=true;link.removeAttribute('href');preview.value='';status.textContent='';}
 form.addEventListener('input',clear);form.addEventListener('change',clear);window.addEventListener('pageshow',clear);
 form.addEventListener('submit',event=>{
  event.preventDefault();try{const message=contactMessage(form.dataset.whatsappKind,Object.fromEntries(new FormData(form)),location.pathname);preview.value=message;link.href=whatsappLink(message);panel.hidden=false;status.textContent='Press Send in WhatsApp to deliver your message. If it did not open, use the link below.';link.focus();link.click();}catch(error){panel.hidden=false;link.removeAttribute('href');status.textContent=error.message;}
 });
 panel.querySelector('button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(preview.value);status.textContent='Message copied. Paste it into WhatsApp and press Send.';}catch{preview.focus();preview.select();status.textContent='Select and copy the message, then paste it into WhatsApp.';}});
 form.hidden=false;
}
