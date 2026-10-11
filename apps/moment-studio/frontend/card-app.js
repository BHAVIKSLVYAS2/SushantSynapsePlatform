import {brandReady,requireBrand} from '/moment-studio/branding.mjs';
import {condolenceMessage} from '/moment-studio/messages.mjs';
import {occasions,designs,palettes,validate,render,filename} from '/moment-studio/card-renderer.mjs';
const $=s=>document.querySelector(s),form=$('#editor'),canvas=$('#card'),media=matchMedia('(prefers-color-scheme: dark)');
// Use the shared platform default and preserve explicit theme preferences.
$('#theme').outerHTML=window.SynapseTheme.control('id="theme"');function theme(){const p=window.SynapseTheme.read();document.documentElement.dataset.theme=p==='system'?(media.matches?'dark':'light'):p;}$('#theme').addEventListener('change',theme);media.addEventListener('change',theme);theme();
const params=new URLSearchParams(location.search),initialOccasion=params.get('occasion'),memorial=['condolence','remembrance'].includes(initialOccasion);
const allowed=Object.keys(occasions).filter(id=>memorial===['condolence','remembrance'].includes(id));
for(const id of allowed)$('#occasion').add(new Option(occasions[id].name,id));
for(const [id,value]of Object.entries(palettes))$('#palette').add(new Option(value.name,id));
let customDesign=false,customPalette=false;
function thumbnails(){
 const occasion=form.elements.occasion.value,selected=form.elements.design?.value;
 $('#designs').replaceChildren();
 for(const [id,name]of Object.entries(designs)){
  if(memorial&&!['quiet','elegant','bloom'].includes(id)||!memorial&&id==='quiet')continue;
  const label=document.createElement('label');label.className='design-choice';const input=document.createElement('input');input.type='radio';input.name='design';input.value=id;input.checked=id===selected;input.addEventListener('change',()=>customDesign=true);
  const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');render(thumb,{...occasions[occasion][form.elements.language.value],occasion,language:form.elements.language.value,design:id,palette:memorial?'slate':'peach',format:'square'});label.append(thumb,input,document.createTextNode(name));$('#designs').append(label);
 }
}
$('#palette').addEventListener('change',()=>customPalette=true);
let image=null,imageVersion=0,pending=false,busy=false,ready=false;
let dirty=false;
form.addEventListener('input',()=>dirty=true);
document.addEventListener('click',event=>{
 const link=event.target.closest('a');if(!link||!link.matches('.studio-nav a,#certificate-shortcut,.platform-shell a,.platform-switcher a')||!dirty||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 if(!confirm('You have an unfinished card. Switching sections clears its text and photo. Stay here to download it, or continue?'))event.preventDefault();
});
function controls(){for(const id of ['download','share'])$('#'+id).disabled=!ready||pending||busy;$('#remove-photo').disabled=!image&&!pending;}
function draw(){try{const data=validate(cardData()),result=render(canvas,data,image);ready=result.fits&&brandReady;canvas.classList.toggle('story',data.format==='story');canvas.setAttribute('aria-label',`${data.title}${data.name?' for '+data.name:''}. ${data.message}. ${data.details}. ${data.from}.`);$('#preview-description').textContent=result.width+' x '+result.height+' pixels | '+designs[data.design]+' | '+palettes[data.palette].name;$('#fit-status').textContent=!brandReady?'The platform logo could not load. Reload before exporting.':ready?'':'Some wording does not fit. Shorten it, remove the photo or choose Vertical status before exporting.';}catch(error){ready=false;$('#fit-status').textContent=error.message;}controls();}
form.addEventListener('input',event=>{if(event.target.id==='photo')return;$('#status').textContent='';draw();});form.addEventListener('change',event=>{if(event.target.id!=='photo')draw();});form.onsubmit=event=>event.preventDefault();
$('#suggest').onclick=()=>{const text=occasions[form.elements.occasion.value][form.elements.language.value];form.elements.title.value=text.title;form.elements.message.value=text.message;draw();$('#status').textContent='Suggested headline and message applied. Your other details are unchanged.';};
$('#photo').onchange=async()=>{
 const file=$('#photo').files[0];if(!file)return;const version=++imageVersion;pending=true;image=null;draw();$('#photo-status').textContent='Loading your photo locally...';let url;
 try{if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPEG or WebP photo.');if(file.size>5*1024*1024)throw Error('Photo must be 5 MB or smaller.');url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('This photo could not be read.'));reader.readAsDataURL(file);});if(version!==imageVersion)return;const loaded=new Image();loaded.src=url;await loaded.decode();if(loaded.naturalWidth*loaded.naturalHeight>24e6||!loaded.naturalWidth||!loaded.naturalHeight)throw Error('Choose a photo no larger than 24 megapixels.');if(version!==imageVersion)return;const thumb=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(loaded.naturalWidth,loaded.naturalHeight));thumb.width=Math.max(1,Math.round(loaded.naturalWidth*ratio));thumb.height=Math.max(1,Math.round(loaded.naturalHeight*ratio));thumb.getContext('2d').drawImage(loaded,0,0,thumb.width,thumb.height);image=thumb;$('#photo-status').textContent='Photo added locally. The preview uses a centre crop.';
 }catch(error){if(version===imageVersion){$('#photo').value='';$('#photo-status').textContent=error.message==='The source image cannot be decoded.'?'This photo could not be opened. Choose a valid PNG, JPEG or WebP.':error.message;}}
 finally{if(version===imageVersion){pending=false;draw();}}
};
$('#remove-photo').onclick=()=>{imageVersion++;pending=false;image=null;$('#photo').value='';$('#photo-status').textContent='Photo removed.';draw();};
function blob(){return new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create the image. Please try again.')),'image/png'));}
function download(file,name){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function exportCard(share){if(!ready||pending||busy)return;busy=true;controls();try{requireBrand();const data=validate(cardData());render(canvas,data,image);const png=await blob(),name=filename(data),file=new File([png],name,{type:'image/png'});if(share&&navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'Moment Studio'});$('#status').textContent='Card shared.';return;}catch(error){if(error.name==='AbortError'){$('#status').textContent='Sharing cancelled. Your card is still here.';return;}}}download(png,name);$('#status').textContent=share?'Card downloaded. Attach it in WhatsApp or your favourite app.':'PNG downloaded. Your card is ready to send.';}catch(error){$('#status').textContent=error.message;}finally{busy=false;controls();}}
$('#download').onclick=()=>exportCard(false);$('#share').onclick=()=>exportCard(true);
let messageVariant=0;
function syncOccasion(){
 const id=form.elements.occasion.value;
 $('#studio-title').textContent=memorial?'Condolences & remembrance':'Cards & greetings';
 $('#condolence-tools').hidden=id!=='condolence';$('#suggest').hidden=id==='condolence';
 $('#recipient-label').textContent=memorial?'Person’s name':id==='invitation'?'Guest / occasion name':'Name or recipient';
 $('#sender-label').textContent=id==='invitation'?'Host':'From';
 $('#event-fields').hidden=!['invitation','remembrance'].includes(id);
 $('#event-heading').textContent=id==='remembrance'?'Remembrance gathering (optional)':'Event details';
 const presets={birthday:['confetti','peach'],congratulations:['elegant','sunshine'],anniversary:['bloom','rose'],festival:['bloom','sunshine'],thanks:['bloom','forest'],invitation:['elegant','lavender'],fun:['bold','ocean']};
 const [design,palette]=memorial?['quiet','slate']:presets[id];
 thumbnails();if(!customDesign)form.elements.design.value=design;if(!customPalette)form.elements.palette.value=palette;
 document.querySelectorAll('.studio-nav a').forEach(a=>{a.removeAttribute('aria-current');if(a.dataset.studioSection===(memorial?'condolences':'cards'))a.setAttribute('aria-current','page');});draw();
}
let previousOccasion=null;
$('#occasion').addEventListener('change',()=>{
 const language=form.elements.language.value,prior=occasions[previousOccasion]?.[language],next=occasions[form.elements.occasion.value][language];
 if(prior&&form.elements.title.value===prior.title)form.elements.title.value=next.title;
 if(prior&&form.elements.message.value===prior.message)form.elements.message.value=next.message;
 previousOccasion=form.elements.occasion.value;syncOccasion();
});
$('#generate-message').onclick=()=>{const copy=condolenceMessage({language:form.elements.language.value,tone:$('#message-tone').value,connection:$('#connection').value,variant:messageVariant++});form.elements.title.value=copy.title;form.elements.message.value=copy.message;draw();$('#status').textContent='Thoughtful wording generated. Review and edit it to suit the person and situation.';};
$('#copy-message').onclick=async()=>{const message=form.elements.message.value.trim();if(!message){$('#status').textContent='Write or generate a message first.';return;}const text=message+'\n\nCreated with Sushant Synapse · Moment Studio\n'+location.origin+'/moment-studio';try{if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#status').textContent='Message copied with Moment Studio credit.';return;}}catch{}$('#message-copy').value=text;$('#message-copy-label').hidden=false;$('#message-copy').focus();$('#message-copy').select();$('#status').textContent='Copy your message below.';};
const language=params.get('language');form.elements.occasion.value=allowed.includes(initialOccasion)?initialOccasion:allowed[0];if(['en','hi'].includes(language))form.elements.language.value=language;const initial=occasions[form.elements.occasion.value][form.elements.language.value];form.elements.title.value=initial.title;form.elements.message.value=initial.message;previousOccasion=form.elements.occasion.value;syncOccasion();draw();

// Combine event fields at render/export time, preserving separately typed details.
function cardData(){
 const data=Object.fromEntries(new FormData(form));
 if(['invitation','remembrance'].includes(data.occasion)){
  const date=$('#event-date').value;
  const dateText=date?new Intl.DateTimeFormat(data.language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z')):'';
  data.details=[dateText,$('#event-time').value,$('#event-venue').value,data.details].filter(Boolean).join(' · ');
 }
 return data;
}
$('#language').addEventListener('change',thumbnails);
$('#suggest').addEventListener('click',()=>dirty=true);
$('#generate-message').addEventListener('click',()=>dirty=true);
const drop=$('#photo-drop');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag-active');});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag-active'));
drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('drag-active');const files=event.dataTransfer?.files;if(!files?.length)return;$('#personalise').open=true;if(files.length!==1){$('#photo-status').textContent='Drop one photo at a time.';return;}const transfer=new DataTransfer();transfer.items.add(files[0]);$('#photo').files=transfer.files;dirty=true;$('#photo').dispatchEvent(new Event('change',{bubbles:true}));});
