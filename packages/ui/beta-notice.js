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
 copy.gu={title:'આ બીટા વાપરતાં પહેલાં',intro:'Sushant Synapse હજી બીટામાં છે. સુવિધાઓ બદલાઈ શકે કે કામ ન કરી શકે. કેટલીક સામગ્રી AIની મદદથી, આપોઆપ કે પ્રયોગરૂપે બની હોઈ શકે અને તેમાં ભૂલો હોઈ શકે. જરૂરી માહિતીની ખાતરી કરો.',third:'તૃતીય પક્ષની સેવાઓ, સૉફ્ટવેર અને સામગ્રીની પોતાની શરતો, ગોપનીયતા નીતિ અને લાઇસન્સ છે. સમીક્ષા અધૂરી હોઈ શકે. પરિણામના વ્યાપારી ઉપયોગની મંજૂરી આપોઆપ મળતી નથી.',rights:'આ સ્વીકૃતિ તમારા અધિકાર છોડતી નથી અને તૃતીય પક્ષના લાઇસન્સની મંજૂરી નથી. તે ટ્રૅકિંગ, અપલોડ કે ચુકવણીની સંમતિ નથી. લાગુ શરતોની સમીક્ષા અમારી જવાબદારી છે.',check:'મેં આ બીટા સૂચના વાંચી છે અને તેની મર્યાદા સમજું છું.',continue:'સમજાયું, આગળ વધો',leave:'હમણાં નહીં — માહિતી વાંચો',close:'સૂચના બંધ કરો',reset:'આ સ્વીકૃતિ ભૂલી જાઓ',remember:'સંગ્રહ ઉપલબ્ધ હોય ત્યારે ફક્ત આ સૂચનાની આવૃત્તિ આ બ્રાઉઝરમાં યાદ રહે છે. ખાતું કે સર્વર પર સંમતિનો રેકોર્ડ બનતો નથી.',terms:'ઉપયોગની શરતો',privacy:'ગોપનીયતા',notices:'તૃતીય પક્ષની સૂચનાઓ',contact:'WhatsApp પર સમસ્યા જણાવો',review:'બીટા સૂચના ફરી વાંચો',beta:'બીટા',short:'આ પ્લેટફૉર્મ બીટામાં છે. કેટલીક સામગ્રી AIની મદદથી, આપોઆપ કે પ્રયોગરૂપે બનેલી અને ભૂલવાળી હોઈ શકે. જરૂરી માહિતીની ખાતરી કરો.',details:'બીટા અને તૃતીય પક્ષની માહિતી'};
 function acknowledged(){
  if(memory)return true;
  for(const name of ['localStorage','sessionStorage'])try{if(window[name].getItem(key)===version)return true;}catch{}
  return false;
 }
 function remember(){memory=true;for(const name of ['localStorage','sessionStorage'])try{window[name].setItem(key,version);}catch{}}
 function forget(){memory=false;for(const name of ['localStorage','sessionStorage'])try{window[name].removeItem(key);}catch{};open();}
 let language;try{language=localStorage.getItem('synapse-language');}catch{}
 const requested=new URLSearchParams(location.search).get('lang');if(!['en','hi','gu'].includes(language)&&['en','hi','gu'].includes(requested))language=requested;
 language=['en','hi','gu'].includes(language)?language:'en';
 const dialog=document.createElement('dialog');dialog.id='synapse-beta-dialog';dialog.className='synapse-beta-dialog';
 dialog.setAttribute('aria-labelledby','synapse-beta-title');dialog.setAttribute('aria-describedby','synapse-beta-intro');
 dialog.innerHTML='<h2 id="synapse-beta-title" tabindex="-1"></h2><p id="synapse-beta-intro"></p><p data-beta-third></p><p data-beta-rights></p><nav class="synapse-beta-links" aria-label="Notice information"><a href="/terms#beta-notice" target="_blank" rel="noopener noreferrer" data-beta-terms></a><a href="/privacy" target="_blank" rel="noopener noreferrer" data-beta-privacy></a><a href="/legal/third-party-notices" target="_blank" rel="noopener noreferrer" data-beta-notices></a><a target="_blank" rel="noopener noreferrer" data-beta-contact></a></nav><form><label class="synapse-beta-check"><input type="checkbox" required name="acknowledge"><span></span></label><p class="synapse-beta-storage"></p><div class="synapse-beta-actions"><button type="submit" disabled data-beta-continue></button><button type="button" data-beta-leave></button><button type="button" data-beta-close hidden></button><button type="button" data-beta-reset hidden></button></div></form>';
 document.body.append(dialog);
 // Temporarily host the very same shared menu inside the modal, where it is
 // keyboard-accessible. Restore it to the header on close; no second owner/UI.
 function placeLanguage(){const menu=document.querySelector('.platform-language'),destination=dialog.open?dialog:document.querySelector('.platform-shell-actions');if(menu&&destination&&menu.parentElement!==destination)destination.prepend(menu);}
 window.SynapseUI?.observe(placeLanguage);
 const checkbox=dialog.querySelector('input'),submit=dialog.querySelector('[data-beta-continue]');
 const whatsapp=note.querySelector('a[target="_blank"]').href;dialog.querySelector('[data-beta-contact]').href=whatsapp;
 function render(){
  const text=copy[language];dialog.lang=language;note.lang=language;
  for(const [selector,value]of Object.entries({'#synapse-beta-title':text.title,'#synapse-beta-intro':text.intro,'[data-beta-third]':text.third,'[data-beta-rights]':text.rights,'[data-beta-terms]':text.terms,'[data-beta-privacy]':text.privacy,'[data-beta-notices]':text.notices,'[data-beta-contact]':text.contact,'.synapse-beta-check span':text.check,'.synapse-beta-storage':text.remember,'[data-beta-continue]':text.continue,'[data-beta-leave]':text.leave,'[data-beta-close]':text.close,'[data-beta-reset]':text.reset}))dialog.querySelector(selector).textContent=value;
  note.querySelector('strong').textContent=text.beta;note.querySelector('p').textContent=text.short;
  note.querySelector('a[target="_blank"]').textContent=text.contact;note.querySelector('a[href="/terms#beta-notice"]').textContent=text.details;note.querySelector('[data-beta-review]').textContent=text.review;
 }
 function open(){
  returnFocus=document.activeElement;checkbox.checked=false;submit.disabled=true;
  const accepted=acknowledged();dialog.querySelector('[data-beta-close]').hidden=!accepted;dialog.querySelector('[data-beta-reset]').hidden=!accepted;
  render();if(!dialog.open)dialog.showModal();placeLanguage();dialog.querySelector('h2').focus({preventScroll:true});
 }
 checkbox.addEventListener('change',()=>{submit.disabled=!checkbox.checked;});
 dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();if(!checkbox.checked)return;remember();dialog.close();window.dispatchEvent(new CustomEvent('synapse-beta-acknowledged',{detail:{version}}));});
 dialog.querySelector('[data-beta-leave]').onclick=()=>location.replace('/terms#beta-notice');
 dialog.querySelector('[data-beta-close]').onclick=()=>dialog.close();dialog.querySelector('[data-beta-reset]').onclick=forget;
 dialog.addEventListener('cancel',event=>{if(!acknowledged())event.preventDefault();});
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('close',()=>{placeLanguage();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 const review=note.querySelector('[data-beta-review]');review.hidden=false;review.onclick=open;
 // Legal/contact pages remain readable before acknowledging. No security or
 // privacy decision depends on this browser preference.
 window.SynapseBeta={acknowledged,open,forget,version};render();
 window.addEventListener('synapse-language-change',event=>{language=event.detail.language;render();placeLanguage();});
 if(!acknowledged()&&!/^\/(?:terms|privacy|contact|legal)(?:\/|$)/.test(location.pathname))open();
 window.addEventListener('storage',event=>{if(event.key===key&&acknowledged()&&dialog.open)dialog.close();});
})();
