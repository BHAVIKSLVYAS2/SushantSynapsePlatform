import {cast} from './catalogue.mjs';
const status=document.querySelector('#share-status');
const url=document.querySelector('link[rel=canonical]')?.href||location.href;
const sample=!!document.querySelector('.sample-preview');
let record=()=>{};
if(!sample)import('./metrics.js').then(module=>{record=module.record;}).catch(()=>{});
const track=(...args)=>{if(!sample)record(...args);};
const title=(sample?'Sample · ':'')+(document.querySelector('h1')?.textContent||'Satire Arena');
const punchline=document.querySelector('.punchline')?.textContent||document.querySelector('meta[name=description]')?.content||'';
document.querySelectorAll('[data-share]').forEach(button=>button.onclick=async()=>{
 try{
  const method=button.dataset.share;
  if(method==='copy'){await navigator.clipboard.writeText(url);track('link_copied','copy');status.textContent='Link copied.';}
  if(method==='whatsapp'){window.open('https://wa.me/?text='+encodeURIComponent(title+' — '+punchline+'\nFictional satire\n'+url),'_blank','noopener,noreferrer');status.textContent='WhatsApp opened. Choose a recipient and send there.';}
  if(method==='native'){if(navigator.share){await navigator.share({title,text:punchline+' · Fictional satire',url});status.textContent='Share handed to your device.';}else{await navigator.clipboard.writeText(url);status.textContent='Link copied. Paste it into your preferred app.';}}
  if(method==='image'){
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff6e5';ctx.fillRect(0,0,1080,1080);ctx.fillStyle='#172a31';
   const lines=(text,y,size,max=950)=>{ctx.font=`600 ${size}px sans-serif`;let line='';for(const word of text.split(/\s+/)){if(ctx.measureText(line+' '+word).width>max){ctx.fillText(line,64,y);y+=size*1.4;line=word;}else line+=(line?' ':'')+word;}ctx.fillText(line,64,y);return y+size*1.4;};
   lines('SUSHANT SYNAPSE · SATIRE ARENA',90,28);let y=lines(title,180,48);y=lines(punchline,y+30,34);
   const source=document.querySelector('.satire-art'),character=cast.find(c=>location.pathname==='/satire-arena/characters/'+c.id);if(source||character){const img=new Image();const files=['cartoon-cast.png','extra-cast-v2.png','new-cast.png','highway-budget-expressions.png','speakers-expressions.png'];img.src=source?source.src:'/satire-arena/'+(character.arena==='news-anchors'?'anchors-fast.webp':files[character.portrait>=11?4:character.portrait>=9?3:Math.floor(character.portrait/3)]);await img.decode();const height=Math.min(320,Math.max(0,850-y));if(character){const i=character.portrait,cell=img.naturalWidth/(i>=13?3:i>=9?2:3);ctx.drawImage(img,(i>=13?(i-13)%3:i>=11?i-11:i>=9?i-9:i%3)*cell,i>=13?Math.floor((i-13)/3)*cell:0,cell,i>=9?cell:img.naturalHeight,64,y,height,height);}else{const width=Math.min(950,height*img.naturalWidth/img.naturalHeight);ctx.drawImage(img,64,y,width,height);}}
   lines(sample?'SAMPLE EDITION · FICTIONAL SATIRE':'FICTIONAL SATIRE · NOT FACTUAL REPORTING',940,24);lines(url.replace(location.origin,''),990,21);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image could not be created');const src=URL.createObjectURL(blob),a=document.createElement('a');a.href=src;a.download='satire-arena.png';a.click();track('image_download','image');setTimeout(()=>URL.revokeObjectURL(src),60000);status.textContent='Image downloaded. Add the link when sharing.';
  }
 }catch(e){status.textContent=e.name==='AbortError'?'Sharing cancelled.':'Sharing unavailable. Copy this link: '+url;}
});
