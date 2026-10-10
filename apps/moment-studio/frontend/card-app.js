import {brandReady,requireBrand} from '/moment-studio/branding.mjs';
import {condolenceMessage} from '/moment-studio/messages.mjs';
import {occasions,designs,palettes,validate,render,filename} from '/moment-studio/card-renderer.mjs';
const $=s=>document.querySelector(s),form=$('#editor'),canvas=$('#card'),media=matchMedia('(prefers-color-scheme: dark)');
// Dark-first for new Studio visitors; preserve every explicit platform preference.
try{if(!localStorage.getItem('synapse-theme')&&!localStorage.getItem('chambers-theme'))window.SynapseTheme.write('dark');}catch{window.SynapseTheme.write('dark');}
$('#theme').outerHTML=window.SynapseTheme.control('id="theme"');function theme(){const p=window.SynapseTheme.read();document.documentElement.dataset.theme=p==='system'?(media.matches?'dark':'light'):p;}$('#theme').addEventListener('change',theme);media.addEventListener('change',theme);theme();
for(const [id,value]of Object.entries(occasions)){const option=new Option(value.name,id);$('#occasion').add(option);}for(const [id,value]of Object.entries(palettes))$('#palette').add(new Option(value.name,id));
for(const [id,name]of Object.entries(designs)){const label=document.createElement('label');label.className='design-choice';const input=document.createElement('input');input.type='radio';input.name='design';input.value=id;input.checked=id==='elegant';const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');render(thumb,{...occasions.birthday.en,occasion:'birthday',language:'en',design:id,palette:'slate',format:'square'});label.append(thumb,input,document.createTextNode(name));$('#designs').append(label);}
let image=null,imageVersion=0,pending=false,busy=false,ready=false;
let dirty=false;
form.addEventListener('input',()=>dirty=true);
document.querySelector('main').addEventListener('click',event=>{
 const link=event.target.closest('a');if(!link||!link.matches('.studio-nav a,#certificate-shortcut')||!dirty||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 if(!confirm('You have an unfinished card. Switching sections clears its text and photo. Stay here to download it, or continue?'))event.preventDefault();
});
function controls(){for(const id of ['download','share'])$('#'+id).disabled=!ready||pending||busy;$('#remove-photo').disabled=!image&&!pending;}
function draw(){try{const data=validate(Object.fromEntries(new FormData(form))),result=render(canvas,data,image);ready=result.fits&&brandReady;canvas.classList.toggle('story',data.format==='story');canvas.setAttribute('aria-label',`${data.title}${data.name?' for '+data.name:''}. ${data.message}. ${data.details}. ${data.from}.`);$('#preview-description').textContent=result.width+' x '+result.height+' pixels | '+designs[data.design]+' | '+palettes[data.palette].name;$('#fit-status').textContent=!brandReady?'The platform logo could not load. Reload before exporting.':ready?'':'Some wording does not fit. Shorten it, remove the photo or choose Vertical status before exporting.';}catch(error){ready=false;$('#fit-status').textContent=error.message;}controls();}
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
async function exportCard(share){if(!ready||pending||busy)return;busy=true;controls();try{requireBrand();const data=validate(Object.fromEntries(new FormData(form)));render(canvas,data,image);const png=await blob(),name=filename(data),file=new File([png],name,{type:'image/png'});if(share&&navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'Moment Studio'});$('#status').textContent='Card shared.';return;}catch(error){if(error.name==='AbortError'){$('#status').textContent='Sharing cancelled. Your card is still here.';return;}}}download(png,name);$('#status').textContent=share?'Card downloaded. Attach it in WhatsApp or your favourite app.':'PNG downloaded. Your card is ready to send.';}catch(error){$('#status').textContent=error.message;}finally{busy=false;controls();}}
$('#download').onclick=()=>exportCard(false);$('#share').onclick=()=>exportCard(true);
let messageVariant=0;
function syncOccasion(){const memorial=['condolence','remembrance'].includes(form.elements.occasion.value);$('#condolence-tools').hidden=form.elements.occasion.value!=='condolence';if(memorial){form.elements.design.value='quiet';form.elements.palette.value='slate';}document.querySelectorAll('.studio-nav a').forEach(a=>{a.removeAttribute('aria-current');if(a.dataset.studioSection===(memorial?'condolences':'cards'))a.setAttribute('aria-current','page');});draw();}
$('#occasion').addEventListener('change',syncOccasion);
$('#generate-message').onclick=()=>{const copy=condolenceMessage({language:form.elements.language.value,tone:$('#message-tone').value,connection:$('#connection').value,variant:messageVariant++});form.elements.title.value=copy.title;form.elements.message.value=copy.message;draw();$('#status').textContent='Thoughtful wording generated. Review and edit it to suit the person and situation.';};
$('#copy-message').onclick=async()=>{const message=form.elements.message.value.trim();if(!message){$('#status').textContent='Write or generate a message first.';return;}const text=message+'\n\nCreated with Sushant Synapse · Moment Studio\n'+location.origin+'/moment-studio';try{if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#status').textContent='Message copied with Moment Studio credit.';return;}}catch{}$('#message-copy').value=text;$('#message-copy-label').hidden=false;$('#message-copy').focus();$('#message-copy').select();$('#status').textContent='Copy your message below.';};
const params=new URLSearchParams(location.search),occasion=params.get('occasion'),language=params.get('language');form.elements.occasion.value=Object.hasOwn(occasions,occasion)?occasion:'birthday';if(['en','hi'].includes(language))form.elements.language.value=language;const initial=occasions[form.elements.occasion.value][form.elements.language.value];form.elements.title.value=initial.title;form.elements.message.value=initial.message;syncOccasion();draw();

// Workspace shortcuts reuse the existing editor, validation and export handlers.
const recent=new Set(),favorites=new Set();let filter='all';
const tools=[
 {id:'card',name:'Card artboard',keywords:'birthday greeting media image',run:()=>canvas.scrollIntoView({behavior:'instant',block:'center'})},
 {id:'certificate',name:'Certificates & awards',keywords:'recognition pdf png media',run:()=>document.querySelector('[data-studio-section="certificates"]').click()},
 {id:'invitation',name:'Invitation preset',keywords:'event celebration party',run:()=>preset('invitation')},
 {id:'wording',name:'Suggested wording',keywords:'words text prompts english hindi',run:()=>$('#suggest').click()},
 {id:'copy',name:'Copy message',keywords:'clipboard text words',run:()=>$('#copy-message').click()},
 {id:'remembrance',name:'Condolence preset',keywords:'sympathy remembrance comfort text',run:()=>preset('condolence')},
 {id:'photo',name:'Add a local photo',keywords:'upload image media drop',run:()=>$('#photo').click()}
];
function applyFilter(){let count=0;document.querySelectorAll('[data-tool]').forEach(tile=>{tile.hidden=!(filter==='all'||tile.dataset.category===filter||filter==='recent'&&recent.has(tile.dataset.tool));if(!tile.hidden)count++;});$('#tool-empty').hidden=count>0;$('#tool-empty').textContent=filter==='ai'?'No AI service is connected. Use Text & Prompts for private, editable wording.':'No recent tools yet. Run a preset or use a wording action to get started.';}
function remember(id){recent.delete(id);recent.add(id);applyFilter();}
function preset(id){if(dirty&&!confirm('Replace the headline and message with this preset? Your name, details and photo stay.'))return;form.elements.occasion.value=id;syncOccasion();$('#suggest').click();dirty=true;remember(id==='condolence'?'remembrance':id);}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));applyFilter();}));
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.preset)));
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{remember('wording');$('#'+(button.dataset.action==='copy'?'copy-message':'suggest')).click();}));
document.querySelectorAll('[data-favorite]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.favorite;if(favorites.has(id))favorites.delete(id);else favorites.add(id);button.setAttribute('aria-pressed',String(favorites.has(id)));button.textContent=favorites.has(id)?'★ Favorited':'☆ Favorite';}));
$('#suggest').addEventListener('click',()=>{dirty=true;remember('wording');});
$('#generate-message').addEventListener('click',()=>{dirty=true;remember('remembrance');});
$('#copy-message').addEventListener('click',()=>remember('wording'));
$('#choose-photo').addEventListener('click',()=>$('#photo').click());
const drop=$('#photo-drop');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag-active');});
drop.addEventListener('dragleave',event=>{if(!drop.contains(event.relatedTarget))drop.classList.remove('drag-active');});
drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('drag-active');const files=event.dataTransfer?.files;if(!files?.length)return;if(files.length!==1){$('#photo-status').textContent='Drop one photo at a time.';return;}const transfer=new DataTransfer();transfer.items.add(files[0]);$('#photo').files=transfer.files;dirty=true;remember('card');$('#photo').dispatchEvent(new Event('change',{bubbles:true}));});
const command=$('#studio-command'),search=$('#command-search'),results=$('#command-results');let commandTrigger;
function renderCommands(){results.replaceChildren();const query=search.value.trim().toLowerCase();const matches=tools.filter(tool=>(tool.name+' '+tool.keywords).toLowerCase().includes(query)).sort((a,b)=>Number(favorites.has(b.id))-Number(favorites.has(a.id)));for(const tool of matches){const button=document.createElement('button');button.type='button';button.textContent=(favorites.has(tool.id)?'★ ':'')+tool.name;button.addEventListener('click',()=>{command.close();remember(tool.id);tool.run();});results.append(button);}$('#command-empty').hidden=matches.length>0;}
function openCommand(){if(command.open)return;commandTrigger=document.activeElement;search.value='';renderCommands();command.showModal();search.focus();}
$('#open-command').addEventListener('click',openCommand);$('#close-command').addEventListener('click',()=>command.close());search.addEventListener('input',renderCommands);
command.addEventListener('close',()=>commandTrigger?.focus());
command.addEventListener('click',event=>{if(event.target===command){const rect=command.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)command.close();}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}});
command.addEventListener('keydown',event=>{const buttons=[...results.querySelectorAll('button')];if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(!buttons.length)return;const index=buttons.indexOf(document.activeElement),next=index<0?(event.key==='ArrowDown'?0:buttons.length-1):(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();}if(event.key==='Enter'&&document.activeElement===search&&buttons.length){event.preventDefault();buttons[0].click();}});
