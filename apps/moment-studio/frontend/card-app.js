import {downloadBlob as download} from '/shared/download.mjs';
import {brandReady,requireBrand} from '/moment-studio/branding.mjs';
import {mountWritingAssistant} from '/moment-studio/writing-ui.mjs';
import {occasions,designs,palettes,validate,render,filename} from '/moment-studio/card-renderer.mjs?v=20261016-personal-memorial';

const $=selector=>document.querySelector(selector);
const form=$('#editor'),canvas=$('#card'),media=matchMedia('(prefers-color-scheme: dark)');
$('#theme').outerHTML=window.SynapseTheme.control('id="theme"');
function theme(){
 const preference=window.SynapseTheme.read();
 document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;
}
$('#theme').addEventListener('change',theme);
media.addEventListener('change',theme);
theme();

const params=new URLSearchParams(location.search),initialOccasion=params.get('occasion');
const memorial=['condolence','remembrance'].includes(initialOccasion);
const allowed=Object.keys(occasions).filter(id=>memorial===['condolence','remembrance'].includes(id));
for(const id of allowed)$('#occasion').add(new Option(occasions[id].name,id));
for(const [id,value]of Object.entries(palettes))$('#palette').add(new Option(value.name,id));
const presets={birthday:['confetti','peach'],congratulations:['elegant','sunshine'],anniversary:['bloom','rose'],festival:['bloom','sunshine'],thanks:['bloom','forest'],invitation:['elegant','lavender'],fun:['bold','ocean'],condolence:['quiet','slate'],remembrance:['quiet','slate']};
let customDesign=false,customPalette=false;
let image=null,imageVersion=0,pending=false,busy=false,ready=false,dirty=false;
const edited={title:false,message:false};
let remembranceGatheringOpen=false;

function thumbnails(){
 const occasion=form.elements.occasion.value,selected=form.elements.design?.value;
 $('#designs').replaceChildren();
 for(const [id,name]of Object.entries(designs)){
  if(memorial&&!['quiet','elegant','bloom'].includes(id)||!memorial&&id==='quiet')continue;
  const label=document.createElement('label');
  label.className='design-choice';
  const input=document.createElement('input');
  input.type='radio';input.name='design';input.value=id;input.checked=id===selected;
  input.addEventListener('change',()=>customDesign=true);
  const thumb=document.createElement('canvas');
  thumb.setAttribute('aria-hidden','true');
  render(thumb,{...occasions[occasion][form.elements.language.value],occasion,language:form.elements.language.value,design:id,palette:form.elements.palette.value,format:'square'});
  label.append(thumb,input,document.createTextNode(name));
  $('#designs').append(label);
 }
}
function starterWording(){
 const starter=occasions[form.elements.occasion.value][form.elements.language.value];
 if(!edited.title)form.elements.title.value=starter.title;
 if(!edited.message)form.elements.message.value=starter.message;
}
function controls(){
 for(const id of ['download','share'])$('#'+id).disabled=!ready||pending||busy;
 $('#remove-photo').disabled=!image&&!pending;
}
function cardData(){
 const data=Object.fromEntries(new FormData(form));
 const includeEvent=data.occasion==='invitation'||['condolence','remembrance'].includes(data.occasion)&&$('#remembrance-gathering').open;
 if(includeEvent){
  const date=$('#event-date').value;
  const dateText=date?new Intl.DateTimeFormat(data.language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z')):'';
  if(data.occasion==='invitation')data.details=[dateText,$('#event-time').value,$('#event-venue').value,data.details].filter(Boolean).join(' · ');
  else {data.event=$('#event-name').value;data.when=[dateText,$('#event-time').value].filter(Boolean).join(' · ');data.place=$('#event-venue').value;}
 }
 return data;
}
function draw(){
 try{
  const data=validate(cardData()),result=render(canvas,data,image);
  ready=result.fits&&brandReady;
  canvas.classList.toggle('story',data.format==='story');
  canvas.setAttribute('aria-label',data.title+(data.name?' for '+data.name:'')+'. '+data.message+'. '+[data.event,data.when,data.place,data.details].filter(Boolean).join('. ')+'. '+data.from+'.');
  $('#design-name').textContent=designs[data.design];
  $('#preview-description').textContent=result.width+' × '+result.height+' pixels · '+designs[data.design]+' · '+palettes[data.palette].name;
  $('#fit-status').textContent=!brandReady?'The platform logo could not load. Reload before exporting.':ready?'':'Some wording does not fit. Shorten it, remove the photo or choose Vertical status in More options.';
 }catch(error){
  ready=false;$('#fit-status').textContent=error.message;
 }
 controls();
}
function syncOccasion(){
 const id=form.elements.occasion.value,invitation=id==='invitation',remembrance=id==='remembrance';
 $('#studio-title').textContent=memorial?'Condolences & remembrance':'Cards & greetings';
 $('#recipient-label').textContent=memorial?'Person’s name':invitation?'Guest name':'Recipient name';
 form.elements.name.placeholder=memorial?'Name of the person':invitation?'Optional guest name':'e.g. Aarav';
 $('#headline-label').textContent=invitation?'Event name':remembrance?'Tribute headline':'Headline';
 form.elements.title.placeholder=invitation?'e.g. Family get-together':'Your card headline';
 $('#message-label').textContent=id==='condolence'?'Sympathy message':remembrance?'Tribute message':invitation?'Invitation message':'Your message';
 $('#sender-label').textContent=invitation?'Host':'From';
 form.elements.from.placeholder=invitation?'Host name':'Your name';
 $('#event-fields').hidden=!invitation&&!memorial;
 $('#memorial-event-field').hidden=!memorial;
 $('#event-heading').textContent=id==='condolence'?'Add an event or prayer meeting':'Add a remembrance gathering';
 $('#invitation-events').hidden=!invitation;
 $('#event-heading').hidden=invitation;
 $('#remembrance-gathering').open=invitation||memorial&&remembranceGatheringOpen;
 if(invitation)$('#name-field').before($('#title-field'));
 else $('#title-field').before($('#name-field'));
 const [design,palette]=presets[id];
 if(!customPalette)form.elements.palette.value=palette;
 thumbnails();
 if(!customDesign)form.elements.design.value=design;
 document.querySelectorAll('.studio-nav a').forEach(link=>{
  link.removeAttribute('aria-current');
  if(link.dataset.studioSection===(memorial?'condolences':'cards'))link.setAttribute('aria-current','page');
 });
 draw();
}

form.addEventListener('input',event=>{
 dirty=true;
 if(Object.hasOwn(edited,event.target.name))edited[event.target.name]=true;
 if(event.target.id==='photo')return;
 $('#status').textContent='';$('#wording-status').textContent='';
 if(!['occasion','language'].includes(event.target.name))draw();
});
form.addEventListener('change',event=>{
 if(!['photo','occasion','language','palette'].includes(event.target.id))draw();
});
form.onsubmit=event=>event.preventDefault();
$('#occasion').addEventListener('change',()=>{starterWording();syncOccasion();});
$('#language').addEventListener('change',()=>{starterWording();thumbnails();draw();});
$('#palette').addEventListener('change',()=>{customPalette=true;thumbnails();draw();});
$('#remembrance-gathering').addEventListener('toggle',()=>{
 if(!['condolence','remembrance'].includes(form.elements.occasion.value))return;
 remembranceGatheringOpen=$('#remembrance-gathering').open;
 dirty=true;draw();
});
document.addEventListener('click',event=>{
 const link=event.target.closest('a');
 if(link?.matches('.studio-nav a[aria-current=page]')&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();return;}
 if(!link||!link.matches('.studio-nav a,.platform-shell a,.platform-switcher a')||!dirty||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 if(!confirm('You have an unfinished card. Switching sections clears its text and photo. Stay here to download it, or continue?'))event.preventDefault();
});
mountWritingAssistant({
 trigger:$('#open-ai'),panel:$('#ai-sheet'),maxLength:600,
 getText:()=>form.elements.message.value,
 getContext:()=>({occasion:form.elements.occasion.value,language:form.elements.language.value,recipient:form.elements.name.value,sender:form.elements.from.value,title:form.elements.title.value,date:$('#event-date').value,time:$('#event-time').value,location:$('#event-venue').value,details:form.elements.details.value}),
 apply:text=>{form.elements.message.value=text;edited.message=true;dirty=true;draw();$('#wording-status').textContent='Reviewed AI wording applied. You can edit it freely.';}
});
$('#suggest').onclick=()=>{
 const starter=occasions[form.elements.occasion.value][form.elements.language.value];
 if(edited.message&&form.elements.message.value.trim()&&form.elements.message.value!==starter.message&&!confirm('Replace your message with the suggested wording?'))return;
 form.elements.message.value=starter.message;
 edited.message=false;dirty=true;draw();
 $('#wording-status').textContent='Suggested message applied. You can edit it freely.';
};
$('#copy-message').onclick=async()=>{
 const message=form.elements.message.value.trim();
 if(!message){$('#copy-status').textContent='Write a message first.';return;}
 const text=message+'\n\nCreated with Sushant Synapse · Moment Studio\n'+location.origin+'/moment-studio';
 try{
  if(navigator.clipboard){
   await navigator.clipboard.writeText(text);
   $('#copy-status').textContent='Message copied with Moment Studio credit.';
   return;
  }
 }catch{}
 $('#message-copy').value=text;$('#message-copy-label').hidden=false;
 $('#message-copy').focus();$('#message-copy').select();
 $('#copy-status').textContent='Copy your message below.';
};
$('#photo').onchange=async()=>{
 const file=$('#photo').files[0];
 if(!file)return;
 dirty=true;
 const version=++imageVersion;
 pending=true;image=null;draw();
 $('#photo-status').textContent='Loading your photo locally...';
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPEG or WebP photo.');
  if(file.size>5*1024*1024)throw Error('Photo must be 5 MB or smaller.');
  const url=await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>resolve(reader.result);
   reader.onerror=()=>reject(Error('This photo could not be read.'));
   reader.readAsDataURL(file);
  });
  if(version!==imageVersion)return;
  const loaded=new Image();loaded.src=url;await loaded.decode();
  if(loaded.naturalWidth*loaded.naturalHeight>24e6||!loaded.naturalWidth||!loaded.naturalHeight)throw Error('Choose a photo no larger than 24 megapixels.');
  if(version!==imageVersion)return;
  const thumb=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(loaded.naturalWidth,loaded.naturalHeight));
  thumb.width=Math.max(1,Math.round(loaded.naturalWidth*ratio));thumb.height=Math.max(1,Math.round(loaded.naturalHeight*ratio));
  thumb.getContext('2d').drawImage(loaded,0,0,thumb.width,thumb.height);
  image=thumb;
  $('#photo-status').textContent='Photo added locally. The preview uses a centre crop.';
 }catch(error){
  if(version===imageVersion){
   $('#photo').value='';
   $('#photo-status').textContent=error.message==='The source image cannot be decoded.'?'This photo could not be opened. Choose a valid PNG, JPEG or WebP.':error.message;
  }
 }finally{
  if(version===imageVersion){pending=false;draw();}
 }
};
$('#remove-photo').onclick=()=>{
 imageVersion++;pending=false;image=null;dirty=true;$('#photo').value='';
 $('#photo-status').textContent='Photo removed.';draw();
};
function blob(){
 return new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create the image. Please try again.')),'image/png'));
}
async function exportCard(share){
 if(!ready||pending||busy)return;
 busy=true;controls();
 try{
  requireBrand();
  const data=validate(cardData());render(canvas,data,image);
  const png=await blob(),name=filename(data),file=new File([png],name,{type:'image/png'});
  if(share&&navigator.canShare?.({files:[file]})&&navigator.share){
   try{
    await navigator.share({files:[file],title:'Moment Studio'});
    $('#status').textContent='Card shared.';return;
   }catch(error){
    if(error.name==='AbortError'){$('#status').textContent='Sharing cancelled. Your card is still here.';return;}
   }
  }
  download(png,name);
  $('#status').textContent=share?'Card downloaded. Attach it in WhatsApp or your favourite app.':'PNG downloaded. Your card is ready to send.';
 }catch(error){$('#status').textContent=error.message;}
 finally{busy=false;controls();}
}
$('#download').onclick=()=>exportCard(false);
$('#share').onclick=()=>exportCard(true);
const drop=$('#photo-drop');
for(const type of ['dragenter','dragover'])drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add('drag-active');});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag-active'));
drop.addEventListener('drop',event=>{
 event.preventDefault();drop.classList.remove('drag-active');
 const files=event.dataTransfer?.files;
 if(!files?.length)return;
 if(files.length!==1){$('#photo-status').textContent='Drop one photo at a time.';return;}
 const transfer=new DataTransfer();transfer.items.add(files[0]);$('#photo').files=transfer.files;
 $('#photo').dispatchEvent(new Event('change',{bubbles:true}));
});
const language=params.get('language');
form.elements.occasion.value=allowed.includes(initialOccasion)?initialOccasion:memorial?'condolence':'birthday';
if(['en','hi'].includes(language))form.elements.language.value=language;
$('#design-options').open=matchMedia('(min-width:761px)').matches;
starterWording();syncOccasion();
