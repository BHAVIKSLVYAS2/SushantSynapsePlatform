'use strict';
(() => {
 if(window.SynapseBeta)return;
 const key='synapse-beta-acknowledgement',version='2026-10-19.1';
 const note=document.querySelector('[data-synapse-beta]');if(!note)return;
 let memory=false,returnFocus;
 const copy={
  en:{title:'Before you use this beta',intro:'Sushant Synapse is in beta. Features may change or fail. Some content may be AI-assisted, automatically generated or experimental and contain errors. Verify important information before relying on it.',
   third:'Third-party services, software and content have their own terms, privacy policies and licences. Reviews may be incomplete. Outputs are not automatically cleared for commercial use.',
   rights:'This acknowledgement does not waive your rights or clear third-party licences. It does not authorise tracking, uploads or payments; reviewing applicable terms remains our responsibility.',
   check:'I have read this beta notice and understand these limitations.',continue:'Acknowledge & continue',leave:'Not now — read information',close:'Close notice',reset:'Forget this acknowledgement',remember:'Only this notice version is remembered on this browser when storage is available. No account or server consent record is created.',terms:'Usage terms',privacy:'Privacy',notices:'Third-party notices',contact:'Report an issue on WhatsApp',review:'Review beta notice',beta:'Beta',short:'This platform is in beta. Some content may be AI-assisted, automatically generated or experimental and can contain errors. Verify important information.',details:'Beta & third-party information'},
  hi:{title:'बीटा इस्तेमाल करने से पहले',intro:'Sushant Synapse अभी बीटा में है। सुविधाएँ बदल सकती हैं या विफल हो सकती हैं। कुछ सामग्री AI की मदद से, अपने-आप या प्रयोग के तौर पर बनी हो सकती है और उसमें गलतियाँ हो सकती हैं। ज़रूरी जानकारी की पुष्टि करें।',
   third:'तीसरे पक्ष की सेवाओं, सॉफ़्टवेयर और सामग्री की अपनी शर्तें, गोपनीयता नीतियाँ और लाइसेंस हैं। उनकी समीक्षा अधूरी हो सकती है। आउटपुट के व्यावसायिक उपयोग की अनुमति अपने-आप नहीं मिलती।',
   rights:'यह स्वीकृति आपके अधिकार नहीं छोड़ती और तीसरे पक्ष के लाइसेंस की अनुमति नहीं है। यह ट्रैकिंग, अपलोड या भुगतान की सहमति नहीं है। लागू शर्तों की समीक्षा हमारी ज़िम्मेदारी है।',
   check:'मैंने यह बीटा सूचना पढ़ी है और इसकी सीमाएँ समझता/समझती हूँ।',continue:'समझ लिया, आगे बढ़ें',leave:'अभी नहीं — जानकारी पढ़ें',close:'सूचना बंद करें',reset:'यह स्वीकृति भूलें',remember:'स्टोरेज उपलब्ध होने पर केवल इस सूचना का संस्करण इसी ब्राउज़र में याद रखा जाता है। कोई खाता या सर्वर पर सहमति का रिकॉर्ड नहीं बनता।',terms:'इस्तेमाल की शर्तें',privacy:'गोपनीयता',notices:'तीसरे पक्ष की सूचनाएँ',contact:'WhatsApp पर समस्या बताएँ',review:'बीटा सूचना फिर पढ़ें',beta:'बीटा',short:'यह प्लेटफ़ॉर्म बीटा में है। कुछ सामग्री AI की मदद से, अपने-आप या प्रयोग के तौर पर बनी हो सकती है और उसमें गलतियाँ हो सकती हैं। ज़रूरी जानकारी की पुष्टि करें।',details:'बीटा और तीसरे पक्ष की जानकारी'}
 };
 function acknowledged(){
  if(memory)return true;
  for(const name of ['localStorage','sessionStorage'])try{if(window[name].getItem(key)===version)return true;}catch{}
  return false;
 }
 function remember(){memory=true;for(const name of ['localStorage','sessionStorage'])try{window[name].setItem(key,version);}catch{}}
 function forget(){memory=false;for(const name of ['localStorage','sessionStorage'])try{window[name].removeItem(key);}catch{};open();}
 let language;try{language=localStorage.getItem('synapse-language');}catch{}
 const requested=new URLSearchParams(location.search).get('lang');if(requested==='en'||requested==='hi')language=requested;
 language=language==='hi'?'hi':'en';
 const dialog=document.createElement('dialog');dialog.id='synapse-beta-dialog';dialog.className='synapse-beta-dialog';
 dialog.setAttribute('aria-labelledby','synapse-beta-title');dialog.setAttribute('aria-describedby','synapse-beta-intro');
 dialog.innerHTML='<div class="synapse-beta-language" role="group" aria-label="Notice language"><button type="button" data-beta-language="en" lang="en">English</button><button type="button" data-beta-language="hi" lang="hi">हिन्दी</button></div><h2 id="synapse-beta-title" tabindex="-1"></h2><p id="synapse-beta-intro"></p><p data-beta-third></p><p data-beta-rights></p><nav class="synapse-beta-links" aria-label="Notice information"><a href="/terms#beta-notice" target="_blank" rel="noopener noreferrer" data-beta-terms></a><a href="/privacy" target="_blank" rel="noopener noreferrer" data-beta-privacy></a><a href="/legal/third-party-notices" target="_blank" rel="noopener noreferrer" data-beta-notices></a><a target="_blank" rel="noopener noreferrer" data-beta-contact></a></nav><form><label class="synapse-beta-check"><input type="checkbox" required name="acknowledge"><span></span></label><p class="synapse-beta-storage"></p><div class="synapse-beta-actions"><button type="submit" disabled data-beta-continue></button><button type="button" data-beta-leave></button><button type="button" data-beta-close hidden></button><button type="button" data-beta-reset hidden></button></div></form>';
 document.body.append(dialog);
 const checkbox=dialog.querySelector('input'),submit=dialog.querySelector('[data-beta-continue]');
 const whatsapp=note.querySelector('a[target="_blank"]').href;dialog.querySelector('[data-beta-contact]').href=whatsapp;
 function render(){
  const text=copy[language];dialog.lang=language;note.lang=language;
  for(const [selector,value]of Object.entries({'#synapse-beta-title':text.title,'#synapse-beta-intro':text.intro,'[data-beta-third]':text.third,'[data-beta-rights]':text.rights,'[data-beta-terms]':text.terms,'[data-beta-privacy]':text.privacy,'[data-beta-notices]':text.notices,'[data-beta-contact]':text.contact,'.synapse-beta-check span':text.check,'.synapse-beta-storage':text.remember,'[data-beta-continue]':text.continue,'[data-beta-leave]':text.leave,'[data-beta-close]':text.close,'[data-beta-reset]':text.reset}))dialog.querySelector(selector).textContent=value;
  note.querySelector('strong').textContent=text.beta;note.querySelector('p').textContent=text.short;
  note.querySelector('a[target="_blank"]').textContent=text.contact;note.querySelector('a[href="/terms#beta-notice"]').textContent=text.details;note.querySelector('[data-beta-review]').textContent=text.review;
  dialog.querySelectorAll('[data-beta-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.betaLanguage===language)));
 }
 function open(){
  returnFocus=document.activeElement;checkbox.checked=false;submit.disabled=true;
  const accepted=acknowledged();dialog.querySelector('[data-beta-close]').hidden=!accepted;dialog.querySelector('[data-beta-reset]').hidden=!accepted;
  render();if(!dialog.open)dialog.showModal();dialog.querySelector('h2').focus({preventScroll:true});
 }
 checkbox.addEventListener('change',()=>{submit.disabled=!checkbox.checked;});
 dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();if(!checkbox.checked)return;remember();dialog.close();window.dispatchEvent(new CustomEvent('synapse-beta-acknowledged',{detail:{version}}));});
 dialog.querySelector('[data-beta-leave]').onclick=()=>location.replace('/terms#beta-notice');
 dialog.querySelector('[data-beta-close]').onclick=()=>dialog.close();dialog.querySelector('[data-beta-reset]').onclick=forget;
 dialog.addEventListener('cancel',event=>{if(!acknowledged())event.preventDefault();});
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 dialog.querySelectorAll('[data-beta-language]').forEach(button=>button.onclick=()=>{language=button.dataset.betaLanguage;try{localStorage.setItem('synapse-language',language);}catch{}document.querySelector('[data-interface-language="'+language+'"]')?.click();render();});
 const review=note.querySelector('[data-beta-review]');review.hidden=false;review.onclick=open;
 // Legal/contact pages remain readable before acknowledging. No security or
 // privacy decision depends on this browser preference.
 window.SynapseBeta={acknowledged,open,forget,version};render();
 document.addEventListener('click',event=>{const control=event.target.closest('[data-interface-language]');if(control){language=control.dataset.interfaceLanguage==='hi'?'hi':'en';render();}});
 document.addEventListener('change',event=>{if(event.target.id==='language'&&['en','hi'].includes(event.target.value)){language=event.target.value;render();}});
 if(!acknowledged()&&!/^\/(?:terms|privacy|contact|legal)(?:\/|$)/.test(location.pathname))open();
 window.addEventListener('storage',event=>{if(event.key===key&&acknowledged()&&dialog.open)dialog.close();});
})();
