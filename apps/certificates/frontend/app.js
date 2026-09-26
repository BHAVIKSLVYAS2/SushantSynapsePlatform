import {render,templates,donationAmount} from './renderer.js';
import {pdfBlob,download} from './export.js';
const $=s=>document.querySelector(s),form=$('#details'),canvas=$('#certificate'),status=$('#status'),images={},versions={logo:0,signature:0};
const types={
 'Donation Appreciation':'Your generosity and commitment are greatly appreciated.',
 'Volunteer Appreciation':'Your time, dedication and selfless service make a meaningful difference.',
 'Community Service':'Thank you for helping build a stronger, kinder community.',
 'Social Service':'Your compassion and service inspire positive change in society.',
 'Blood Donation':'Your life-saving gift brings hope to those who need it most.',
 'Event Contribution':'Your enthusiasm and support helped make this event a success.',
 'Sponsorship Appreciation':'Your generous partnership helps turn our shared vision into reality.',
 'Teaching / Mentoring':'Your guidance and encouragement open doors to a brighter future.',
 'Outstanding Contribution':'Your exceptional dedication and impact deserve our deepest appreciation.',
 'General Appreciation':'Your kindness, commitment and support are sincerely appreciated.',
 'Custom':'With heartfelt gratitude for the difference you make.'
};
for(const name of Object.keys(types))form.elements.type.add(new Option(name,name));
const today=new Date();form.elements.date.value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
form.elements.reference.value=`SS-${today.getFullYear()}-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;
for(const [i,name] of templates.entries()){
 const label=document.createElement('label');label.className='template';const thumb=document.createElement('canvas');thumb.setAttribute('aria-hidden','true');
 const radio=document.createElement('input');radio.type='radio';radio.name='template';radio.value=name;radio.checked=i===0;
 label.append(thumb,radio,document.createTextNode(name));$('#templates').append(label);
 render(thumb,{template:name,accent:'blue',recipient:'Thank you',message:types['Donation Appreciation']},{},.2);
}
function data(){const value=Object.fromEntries(new FormData(form));for(const key of Object.keys(value))if(typeof value[key]==='string')value[key]=value[key].trim();value.message ||= types[value.type];return value;}
function syncDonation(){
 const enabled=form.elements.type.value==='Donation Appreciation',input=form.elements.donationAmount;
 $('#donation-fields').hidden=!enabled;input.disabled=!enabled;
 const amount=donationAmount(input.value);
 input.setCustomValidity(enabled&&input.value&&!amount?'Enter an amount from ₹0.01 to ₹99,99,99,999.99, with up to two decimal places.':'');
 $('#donation-words').value=enabled&&amount?amount.words:'';
 return enabled?amount:null;
}
let frame;function preview(){const amount=syncDonation();cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const d=data();render(canvas,d,images);const description=`${d.title||'Certificate of Appreciation'} presented to ${d.recipient||'Recipient Name'} for ${d.description||'their contribution'}. ${d.message}${amount?' Donation of '+amount.number+'. '+amount.words+'.':''}`;canvas.setAttribute('aria-label',description);$('#preview-description').textContent=d.recipient?description:'Add their name and contribution to make this certificate yours.';});}
let pendingImages=0;
function valid(){syncDonation();if(pendingImages){status.textContent='Please wait for your image to finish loading.';return false;}for(const name of ['recipient','description'])form.elements[name].setCustomValidity(form.elements[name].value.trim()?'':'Please enter this detail.');return form.reportValidity();}
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
const exportCanvas=()=>render(document.createElement('canvas'),data(),images,3508/1122);
for(const format of ['pdf','png'])$('#'+format).onclick=async()=>{if(!valid())return;const button=$('#'+format);button.disabled=true;status.textContent='Preparing your download…';try{await new Promise(resolve=>requestAnimationFrame(resolve));const output=exportCanvas();const blob=format==='pdf'?pdfBlob(output):await new Promise((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(Error('Could not create image.')),'image/png'));const name=data().recipient.replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,60)||'appreciation';download(blob,`${name}-certificate.${format}`);status.textContent='Download prepared. Your information stays in this tab.';}catch(error){status.textContent='Download failed. '+error.message;}finally{button.disabled=false;}};
$('#print').onclick=()=>{if(valid()){render(canvas,data(),images,3508/1122);window.print();}};
window.addEventListener('beforeprint',()=>render(canvas,data(),images,3508/1122));window.addEventListener('afterprint',preview);
const media=matchMedia('(prefers-color-scheme: dark)');let preference='system';try{preference=window.SynapseTheme.read();}catch{}
$('#theme').value=preference;function theme(){document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;}$('#theme').onchange=e=>{preference=e.target.value;try{window.SynapseTheme.write(preference);}catch{}theme();};media.addEventListener('change',theme);theme();preview();
