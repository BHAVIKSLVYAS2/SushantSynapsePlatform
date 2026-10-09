import {brandReady,requireBrand} from '/moment-studio/branding.mjs';
import {render,templates,playfulTemplates,donationAmount,disclaimer} from '/moment-studio/certificate-renderer.mjs';
import {pdfBlob,pngBlob,download} from '/moment-studio/certificate-export.js';
import {certificateRows,zip} from '/moment-studio/batch.mjs';
const $=s=>document.querySelector(s),form=$('#details'),canvas=$('#certificate'),status=$('#status'),images={},versions={logo:0,signature:0};
$('#certificate-disclaimer').textContent=disclaimer;
let dirty=false;
form.addEventListener('input',()=>dirty=true);
document.querySelector('.studio-nav').addEventListener('click',event=>{
 const link=event.target.closest('a');if(!link||!dirty||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 if(!confirm('You have an unfinished certificate. Switching sections clears its recipient details and signature. Stay here to export it, or continue?'))event.preventDefault();
});
const types={
 'Donation Appreciation':'Your generosity and commitment are greatly appreciated.',
 'Volunteer Appreciation':'Your time, dedication and selfless service make a meaningful difference.',
 'Community Service':'Thank you for helping build a stronger, kinder community.',
 'Blood Donation':'Your life-saving gift brings hope to those who need it most.',
 'Event Contribution':'Your enthusiasm and support helped make this event a success.',
 'Teaching / Mentoring':'Your guidance and encouragement open doors to a brighter future.',
 'General Appreciation':'Your kindness, commitment and support are sincerely appreciated.'
};
const funAwards={
 'Best Friend':{description:'being my partner in crime, unpaid therapist and favourite bad influence',message:'Five stars for friendship. Would share snacks and questionable ideas with you again.'},
 'Best Wife':{description:'being my favourite person, adventure partner and reason to smile every day',message:'You deserve a trophy for putting up with me. Please accept this certificate until the trophy budget improves.'},
 'Best Husband':{description:'being my favourite teammate through big dreams and tiny everyday adventures',message:'Life with you is my favourite adventure. Even when the adventure is deciding what to eat.'},
 'Best Partner':{description:'turning ordinary days into our favourite memories',message:'Of all the people I could annoy for a lifetime, I choose you. Lucky you!'},
 'Best Mom':{description:'giving world-class hugs, endless encouragement and suspiciously accurate advice',message:'Awarded for finding everything I said was lost. Your superpowers remain unexplained.'},
 'Best Dad':{description:'always showing up with support, practical wisdom and a fully stocked supply of dad jokes',message:'Your jokes have earned countless eye-rolls. Your kindness has earned this award.'},
 'Best Sibling':{description:'being my original teammate, lifelong rival and keeper of embarrassing stories',message:'Thanks for sharing the childhood, the chaos and occasionally the remote.'},
 'Office MVP':{description:'saving the day, sharing the credit and knowing which meeting could have been an email',message:'Your superpower is getting things done. Your reward is this certificate and our eternal gratitude.'},
 'Chai Champion':{description:'bringing people together one perfectly timed chai break at a time',message:'Some heroes wear capes. You put the kettle on. We know who we would call first.'},
 'Legendary Latecomer':{description:'making every arrival feel like a highly anticipated special appearance',message:'This award was ready on time. We knew you would get here eventually.'}
};
for(const [label,names] of [['Community & contribution',Object.keys(types)],['Fun & personal awards',Object.keys(funAwards)]]){
 const group=document.createElement('optgroup');group.label=label;
 for(const name of names)group.append(new Option(name,name));
 form.elements.type.append(group);
}
const today=new Date();form.elements.date.value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
form.elements.reference.value=`SS-${today.getFullYear()}-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;
for(const [i,name] of templates.entries()){
 const label=document.createElement('label');label.className='template';const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');
 const radio=document.createElement('input');radio.type='radio';radio.name='template';radio.value=name;radio.checked=i===0;
 label.append(thumb,radio,document.createTextNode(name));$('#templates').append(label);
 render(thumb,{template:name,accent:'blue',title:playfulTemplates.includes(name)?'Best Friend Award':'',recipient:playfulTemplates.includes(name)?'Your favourite human':'Thank you',message:playfulTemplates.includes(name)?funAwards['Best Friend'].message:types['Donation Appreciation']},{},.35);
}
let automaticTemplate=true;
const suggestedTemplate=()=>!funAwards[form.elements.type.value]?'Classic':['Best Wife','Best Husband','Best Partner','Best Mom'].includes(form.elements.type.value)?'Sweetheart':['Office MVP','Legendary Latecomer','Best Dad'].includes(form.elements.type.value)?'Comic':'Confetti';
function syncTemplate(){
 if(automaticTemplate)form.elements.template.value=suggestedTemplate();
 const fixedPalette=playfulTemplates.includes(form.elements.template.value);
 form.elements.accent.disabled=fixedPalette;
 form.elements.accent.closest('label').hidden=fixedPalette;
 $('#template-suggestion').textContent=automaticTemplate?'A matching design is selected for your award. You can choose any design.':'Your chosen design stays selected when you change award type.';
}
$('#templates').addEventListener('change',()=>{automaticTemplate=false;syncTemplate();});
function data(){const value=Object.fromEntries(new FormData(form));for(const key of Object.keys(value))if(typeof value[key]==='string')value[key]=value[key].trim();const award=funAwards[value.type];value.message ||= award?.message||types[value.type];if(award){value.title ||= value.type+' Award';value.description ||= award.description;}return value;}
function syncWording(){
 const award=funAwards[form.elements.type.value];
 form.elements.description.required=!award;
 form.elements.description.placeholder=award?.description||'e.g. supporting our community education programme';
 form.elements.title.placeholder=award?form.elements.type.value+' Award':'Certificate of Appreciation';
 form.elements.message.placeholder=award?.message||'Use suggested wording, or write your own';
 form.elements.description.setCustomValidity('');
}
form.elements.type.addEventListener('change',()=>{if(form.elements.type.value!=='Donation Appreciation'){form.elements.donationAmount.value='';$('#donation-words').value='';}syncWording();syncTemplate();});
syncWording();syncTemplate();
function syncDonation(){
 const enabled=form.elements.type.value==='Donation Appreciation',input=form.elements.donationAmount;
 $('#donation-fields').hidden=!enabled;input.disabled=!enabled;$('#donation-words').disabled=!enabled;
 const amount=donationAmount(input.value);
 input.setCustomValidity(enabled&&input.value&&!amount?'Enter an amount from ₹0.01 to ₹99,99,99,999.99, with up to two decimal places.':'');
 $('#donation-words').value=enabled&&amount?amount.words:'';
 return enabled?amount:null;
}
let frame;function preview(){const amount=syncDonation();cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const d=data();render(canvas,d,images);const description=`${d.title||'Certificate of Appreciation'} presented to ${d.recipient||'Recipient Name'} for ${d.description||'their contribution'}. ${d.message}`;canvas.setAttribute('aria-label',description+(amount?' Donation of '+amount.number+'. '+amount.words+'.':'')+' '+disclaimer);$('#preview-description').textContent=d.recipient?description:'Add their name and contribution to make this certificate yours.';});}
let pendingImages=0;
function valid(){if(!brandReady){status.textContent='The platform logo could not load. Reload before generating.';return false;}syncDonation();if(pendingImages){status.textContent='Please wait for your image to finish loading.';return false;}const value=data();for(const name of ['recipient','description'])form.elements[name].setCustomValidity(value[name]?'':'Please enter this detail.');return form.reportValidity();}
form.addEventListener('input',()=>{for(const name of ['recipient','description'])form.elements[name].setCustomValidity('');$('#downloads').hidden=true;status.textContent='';preview();});
form.addEventListener('change',preview);
form.addEventListener('submit',e=>{e.preventDefault();if(!valid())return;preview();$('#downloads').hidden=false;status.textContent='Your certificate is ready. Choose PDF, PNG or print.';$('#downloads').scrollIntoView({behavior:'smooth',block:'nearest'});});
for(const kind of ['logo','signature']){
 $('#'+kind).addEventListener('change',async e=>{
  const version=++versions[kind],file=e.target.files[0];if(!file)return;
  pendingImages++;
  try{if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPEG or WebP image up to 5 MB.');
   const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>24000000){bitmap.close();throw Error('Please choose an image smaller than 24 megapixels.');}
   const local=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));local.width=Math.max(1,Math.round(bitmap.width*ratio));local.height=Math.max(1,Math.round(bitmap.height*ratio));local.getContext('2d').drawImage(bitmap,0,0,local.width,local.height);bitmap.close();
   if(version!==versions[kind])return;images[kind]=local;status.textContent='Image added locally.';preview();
  }catch(error){if(version!==versions[kind])return;e.target.value='';status.textContent=error.message||'This image could not be read. Try another file.';}finally{pendingImages--;}
 });
}
for(const button of document.querySelectorAll('[data-remove]'))button.onclick=()=>{const kind=button.dataset.remove;versions[kind]++;delete images[kind];$('#'+kind).value='';$('#downloads').hidden=true;preview();};
for(const format of ['pdf','png'])$('#'+format).onclick=async()=>{
 if(!valid())return;const button=$('#'+format),dpi=format==='png'&&$('#png-quality').value==='600'?600:300;
 const snapshot=data();let output;button.disabled=true;status.textContent='Preparing your download…';
 try{
  await new Promise(resolve=>requestAnimationFrame(resolve));await document.fonts.ready;
  requireBrand();output=render(document.createElement('canvas'),snapshot,images,(dpi===600?7016:3508)/1122);
  const blob=format==='pdf'?pdfBlob(output):await pngBlob(output,dpi);
  const name=snapshot.recipient.replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,60)||'appreciation';download(blob,`${name}-certificate.${format}`);
  status.textContent=format==='png'?`PNG ready: ${output.width} × ${output.height} pixels, ${dpi} DPI. Recipient details stay in this tab.`:'Download prepared. Recipient details stay in this tab.';
 }catch(error){status.textContent='Download failed. '+error.message+(dpi===600?' Try the smaller 300 DPI PNG option.':'');}
 finally{if(output){output.width=1;output.height=1;}button.disabled=false;}
};
$('#print').onclick=()=>{if(valid()){requireBrand();render(canvas,data(),images,3508/1122);window.print();}};
window.addEventListener('beforeprint',()=>{document.body.classList.toggle('brand-unavailable',!brandReady);if(brandReady)render(canvas,data(),images,3508/1122);});window.addEventListener('afterprint',preview);
const media=matchMedia('(prefers-color-scheme: dark)');let preference='system';try{preference=window.SynapseTheme.read();}catch{}
$('#theme').value=preference;function theme(){document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;}$('#theme').onchange=e=>{preference=e.target.value;try{window.SynapseTheme.write(preference);}catch{}theme();};media.addEventListener('change',theme);theme();preview();

// Explicitly saved organisation branding only; recipient and signature data are never persisted.
const organisationKey='synapse.certificates.organisations.v1',organisationStatus=$('#organisation-status'),savedSelect=$('#saved-organisation');
let savedOrganisations=[],lastOrganisation='';
const positions=['left','center','right'];
function refreshOrganisations(selected=''){
 savedSelect.replaceChildren(new Option('Choose a saved organisation',''));
 for(const entry of savedOrganisations)savedSelect.add(new Option(entry.name,entry.id));
 savedSelect.value=selected;$('#delete-organisation').disabled=!selected;
}
function storeOrganisations(entries,last){
 try{localStorage.setItem(organisationKey,JSON.stringify({version:1,entries,last}));savedOrganisations=entries;lastOrganisation=last;return true;}
 catch{organisationStatus.textContent='Could not save changes. Browser storage may be full or unavailable; your current certificate still works.';return false;}
}
async function reuseOrganisation(id){
 const entry=savedOrganisations.find(value=>value.id===id);if(!entry)return;
 const version=++versions.logo;delete images.logo;$('#logo').value='';
 form.elements.organization.value=entry.name;form.elements.logoPosition.value=entry.position;
 $('#downloads').hidden=true;preview();
 organisationStatus.textContent='Organisation reused. Edits are saved only when you choose Save organisation.';
 if(entry.logo){pendingImages++;try{
  const img=new Image();img.src=entry.logo;await img.decode();
  if(img.width>512||img.height>512)throw Error('Invalid saved logo dimensions');
  if(version===versions.logo){images.logo=img;preview();}
 }catch{if(version===versions.logo)organisationStatus.textContent='Organisation name restored, but its saved logo could not be loaded. Please upload it again.';}
 finally{pendingImages--;}}
}
try{
 const raw=localStorage.getItem(organisationKey);
 if(raw){
  if(raw.length>4000000)throw Error('Saved branding is too large');
  const value=JSON.parse(raw);
  if(value.version!==1||!Array.isArray(value.entries)||value.entries.length>10)throw Error('Invalid saved branding');
  const ids=new Set();
  for(const entry of value.entries){
   if(!entry||typeof entry.id!=='string'||entry.id.length>80||ids.has(entry.id)||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>100||!positions.includes(entry.position)||typeof entry.logo!=='string'||entry.logo.length>400000||(entry.logo&&!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(entry.logo)))throw Error('Invalid saved organisation');
   ids.add(entry.id);
  }
  savedOrganisations=value.entries.map(({id,name,position,logo})=>({id,name,position,logo}));lastOrganisation=typeof value.last==='string'?value.last:'';
 }
}catch{organisationStatus.textContent='Saved organisations could not be read. You can still create certificates and save new organisations.';}
refreshOrganisations(lastOrganisation);
savedSelect.onchange=()=>{
 const id=savedSelect.value;$('#delete-organisation').disabled=!id;
 if(id){void reuseOrganisation(id);storeOrganisations(savedOrganisations,id);}
};
$('#save-organisation').onclick=()=>{
 const name=form.elements.organization.value.trim();
 if(!name){organisationStatus.textContent='Enter an organisation name before saving.';form.elements.organization.focus();return;}
 if(pendingImages){organisationStatus.textContent='Please wait for the image to finish loading.';return;}
 const existing=savedOrganisations.find(entry=>entry.name.toLocaleLowerCase()===name.toLocaleLowerCase());
 if(!existing&&savedOrganisations.length>=10){organisationStatus.textContent='You can save up to 10 organisations. Delete one before adding another.';return;}
 let logo='';
 if(images.logo){const thumb=document.createElement('canvas'),img=images.logo,ratio=Math.min(1,256/Math.max(img.width,img.height));thumb.width=Math.max(1,Math.round(img.width*ratio));thumb.height=Math.max(1,Math.round(img.height*ratio));thumb.getContext('2d').drawImage(img,0,0,thumb.width,thumb.height);logo=thumb.toDataURL('image/png');}
 const entry={id:existing?.id||crypto.randomUUID(),name,position:form.elements.logoPosition.value,logo};
 const entries=existing?savedOrganisations.map(value=>value.id===existing.id?entry:value):[...savedOrganisations,entry];
 if(storeOrganisations(entries,entry.id)){refreshOrganisations(entry.id);organisationStatus.textContent='Organisation saved in this browser. Its name and logo will be available next time.';}
};
$('#delete-organisation').onclick=()=>{
 const id=savedSelect.value;if(!id)return;
 const entries=savedOrganisations.filter(entry=>entry.id!==id);
 if(storeOrganisations(entries,'')){refreshOrganisations();organisationStatus.textContent='Saved organisation deleted from this browser. The current certificate is unchanged.';}
};
if(lastOrganisation)void reuseOrganisation(lastOrganisation);

const batch=document.createElement('details');batch.innerHTML='<summary>Certificates for a group</summary><p>Import up to 20 recipients. CSV headings: recipient,description. The current design, organisation, signature and platform branding apply to every certificate. Details stay in this tab.</p><button type="button" id="batch-template">Download CSV template</button><label>Recipient CSV<input type="file" id="batch-file" accept=".csv,text/csv"></label><ol id="batch-preview"></ol><button type="button" id="batch-export" disabled>Download PDF batch (ZIP)</button><p id="batch-status" role="status"></p>';form.after(batch);
let batchRows=[],batchBusy=false;
$('#batch-template').onclick=()=>download(new Blob(['recipient,description\r\nSample Recipient,helping our community\r\n'],{type:'text/csv;charset=utf-8'}),'certificate-recipients.csv');
$('#batch-file').onchange=async event=>{if(batchBusy)return;batchRows=[];$('#batch-export').disabled=true;$('#batch-preview').replaceChildren();try{const file=event.target.files[0];if(!file)return;if(file.size>50000)throw Error('Use a CSV under 50 KB.');batchRows=certificateRows(await file.text());for(const row of batchRows){const li=document.createElement('li');li.textContent=row.recipient+(row.description?' — '+row.description:'');$('#batch-preview').append(li);}$('#batch-export').disabled=false;$('#batch-status').textContent='Review these names before exporting.';dirty=true;}catch(error){$('#batch-status').textContent=error.message;}finally{event.target.value='';}};
$('#batch-export').onclick=async()=>{if(batchBusy||!batchRows.length)return;try{requireBrand();syncDonation();if(pendingImages)throw Error('Wait for images to finish loading.');const base=data(),rows=batchRows.map(row=>({...base,recipient:row.recipient,description:row.description||base.description}));if(rows.some(row=>!row.description))throw Error('Add a common contribution or supply each description in the CSV.');if(!form.elements.donationAmount.checkValidity())throw Error('Check the donation amount.');batchBusy=true;const controls=[...form.elements,...batch.querySelectorAll('input,button')],prior=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);try{await document.fonts.ready;const files=[];let bytes=0;for(const [i,row]of rows.entries()){await new Promise(resolve=>requestAnimationFrame(resolve));requireBrand();const output=render(document.createElement('canvas'),row,{...images},3508/1122);try{const pdf=pdfBlob(output),data=new Uint8Array(await pdf.arrayBuffer());bytes+=data.length;if(bytes>50000000)throw Error('Batch exceeds 50 MB. Use fewer recipients.');files.push({name:String(i+1).padStart(2,'0')+'-'+(row.recipient.replace(/[^\p{L}\p{N}_-]/gu,'-').slice(0,60)||'recipient')+'.pdf',data});$('#batch-status').textContent=`Prepared ${i+1} of ${rows.length}.`;}finally{output.width=1;output.height=1;}}download(zip(files),'moment-studio-certificates.zip');$('#batch-status').textContent=`${files.length} branded certificates downloaded.`;}finally{controls.forEach((c,i)=>c.disabled=prior[i]);}}catch(error){$('#batch-status').textContent='Batch not exported: '+error.message;}finally{batchBusy=false;}};

if(!brandReady){document.body.classList.add('brand-unavailable');status.textContent='The platform logo could not load. Reload before generating.';}
