import {$,init,download} from '/shared/local-tools.mjs?v=20261016-wins';
import {compress,drawImage,geometry,estimate,options} from './engine.mjs?v=20261031-form';
import {profiles} from './profiles.mjs';
init();let image=null,version=0,sourceVersion=0,output=null,busy=false,loading=false,originalBytes=0,originalName='',controller=null,estimateController=null,estimateTimer,estimateWorking=false;
const form=$('#editor');for(const [id,profile]of Object.entries(profiles))$('#profile').add(new Option(profile.name,id));
function clear(){output=null;$('#comparison').textContent='';$('#checks').replaceChildren();$('#download').disabled=true;$('#preview').hidden=true;}
function invalidate(){version++;controller?.abort();estimateController?.abort();clearTimeout(estimateTimer);clear();$('#estimate').textContent='';}
function settings(){const profile=profiles[$('#profile').value];return options({width:Number($('#width').value),height:Number($('#height').value),kb:Number($('#target').value),minKb:Number($('#minimum').value),format:$('#format').value,fit:$('#fit').value,x:Number($('#crop-x').value),y:Number($('#crop-y').value),zoom:Number($('#crop-zoom').value),rotation:Number($('#rotation').value),dpi:Number($('#dpi').value),upscale:$('#upscale').checked,...(profile.maxBytes?{maxBytes:profile.maxBytes}:{})});}
function ui(){
 const exact=$('#fit').value==='crop',profile=profiles[$('#profile').value];$('#crop-controls').hidden=!exact;$('#width-label').textContent=exact?'Exact width (px)':'Maximum width (px)';$('#height-label').textContent=exact?'Exact height (px)':'Maximum height (px)';
 $('#dpi').disabled=$('#format').value!=='image/jpeg';$('#profile-info').hidden=!profile.source;
 if(profile.source){$('#profile-note').textContent=profile.note;$('#profile-source').href=profile.source;$('#profile-source').textContent=profile.reference;$('#profile-checked').textContent='Source checked '+profile.checked+'. Confirm the latest notice before applying.';}
 document.querySelectorAll('[data-kb]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kb===$('#target').value)));
 const signature=$('#document-kind').value==='signature';$('#review-guidance').textContent=signature?'Signatures: keep every stroke inside the crop, on plain white paper and horizontally aligned. Review at actual size. No handwriting, authenticity or blur approval is performed.':'Photos: check the whole face, eyes, lighting, plain background and borders against your own form. No automated face or blur approval is performed.';
}
function cropPreview(){
 $('#crop-preview').hidden=true;$('#crop-heading').hidden=true;$('#crop-status').textContent='';if(!image||$('#fit').value!=='crop')return;
 try{const s=settings(),g=geometry(image,s),scale=Math.min(1,640/g.outputWidth,640/g.outputHeight);drawImage($('#crop-preview'),image,s,{width:Math.max(1,Math.round(g.outputWidth*scale)),height:Math.max(1,Math.round(g.outputHeight*scale))});$('#crop-preview').hidden=false;$('#crop-heading').hidden=false;$('#crop-status').textContent=g.upscaled?'Enlarged crop: no new detail is created. Review carefully.':'';}
 catch(error){$('#crop-status').textContent=error.message;}
}
function scheduleEstimate(){
 clearTimeout(estimateTimer);if(!image)return;const current=version;
 estimateTimer=setTimeout(async()=>{
  if(estimateWorking||busy)return;estimateWorking=true;const pending=estimateController=new AbortController();
  try{const s=settings(),bytes=await estimate(image,{...s,signal:pending.signal});if(current===version)$('#estimate').textContent=(s.format==='image/png'?'PNG estimate before any size reduction: ':'Estimate at 85% quality: ')+(bytes/1024).toFixed(1)+' KB. Final compression and size checks run below.';}
  catch(error){if(current===version&&error.name!=='AbortError')$('#estimate').textContent='Estimate unavailable: '+error.message;}
  finally{estimateWorking=false;if(estimateController===pending)estimateController=null;if(current!==version)scheduleEstimate();}
 },450);
}
function changed(event){if(['photo','profile'].includes(event.target.id))return;
 invalidate();if(!['crop-x','crop-y','crop-zoom','rotation','upscale'].includes(event.target.id))$('#profile').value='custom';
 if($('#format').value!=='image/jpeg')$('#dpi').value='';ui();cropPreview();scheduleEstimate();$('#status').textContent=image?'Settings changed. Resize again to check the new output.':'';
}
form.addEventListener('input',changed);
$('#profile').onchange=()=>{
 invalidate();const p=profiles[$('#profile').value];for(const [id,key]of [['width','width'],['height','height'],['target','kb'],['minimum','minKb'],['fit','fit'],['format','format']])$('#'+id).value=p[key];$('#dpi').value=p.dpi||'';$('#crop-x').value=$('#crop-y').value=50;$('#crop-zoom').value=100;$('#rotation').value='0';$('#upscale').checked=false;if(p.kind)$('#document-kind').value=p.kind;$('#dimensions').open=p.fit==='crop';ui();cropPreview();scheduleEstimate();$('#status').textContent='Profile loaded. Review its source and crop before processing.';
};
$('#photo').onchange=async()=>{
 invalidate();const sourceToken=++sourceVersion;image?.close();image=null;originalBytes=0;$('#original-preview').hidden=true;$('#original-info').textContent='';$('#crop-preview').hidden=true;$('#crop-heading').hidden=true;$('#crop-status').textContent='';const file=$('#photo').files[0];loading=!!file;$('#create').disabled=busy||loading;if(!file)return;$('#status').textContent='Reading the selected image on this device...';
 try{if(file.size>12*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG or WebP image up to 12 MB.');
  let bitmap;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw Error('This image could not be decoded. Choose a valid JPEG, PNG or WebP file.');}
  if(bitmap.width*bitmap.height>24000000){bitmap.close();throw Error('Choose an image up to 24 megapixels.');}if(sourceToken!==sourceVersion){bitmap.close();return;}
  image=bitmap;originalBytes=file.size;originalName=file.name;const c=$('#original-preview'),scale=Math.min(1,640/bitmap.width,640/bitmap.height);c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);c.hidden=false;
  $('#original-info').textContent='Original: '+bitmap.width+' \u00d7 '+bitmap.height+' px \u00b7 '+(file.size/1024).toFixed(1)+' KB';$('#status').textContent=bitmap.width+' \u00d7 '+bitmap.height+' pixels. Choose your target, review any crop, then resize.';cropPreview();scheduleEstimate();
 }catch(error){if(sourceToken===sourceVersion){$('#photo').value='';$('#status').textContent=error.message;}}
 finally{if(sourceToken===sourceVersion){loading=false;$('#create').disabled=busy;}}
};
form.onsubmit=async event=>{
 event.preventDefault();if(busy||loading)return;if(!image){$('#status').textContent='Choose a photo or signature first.';return;}
 let s;try{s=settings();}catch(error){$('#status').textContent=error.message;return;}
 clearTimeout(estimateTimer);estimateController?.abort();const current=version,pending=controller=new AbortController();busy=true;clear();$('#create').disabled=true;$('#cancel').hidden=false;form.setAttribute('aria-busy','true');$('#status').textContent='Preparing the image on this device...';
 try{const result=await compress(image,{...s,signal:pending.signal});if(current!==version)return;
  const preview=await createImageBitmap(result.blob);if(current!==version){preview.close();return;}if(pending.signal.aborted){preview.close();throw new DOMException('Processing cancelled.','AbortError');}
  output=result;const c=$('#preview');c.width=preview.width;c.height=preview.height;c.getContext('2d').drawImage(preview,0,0);preview.close();c.hidden=false;
  $('#comparison').textContent='Before: '+(originalBytes/1024).toFixed(1)+' KB \u2192 After: '+(result.blob.size/1024).toFixed(1)+' KB \u00b7 '+result.width+' \u00d7 '+result.height+' px';
  const heading=document.createElement('h3');heading.textContent=result.valid?'Digital size checks pass':'Digital size checks need attention';const list=document.createElement('ul');
  for(const check of result.checks){const item=document.createElement('li');item.textContent=(check.pass?'Pass: ':'Check: ')+check.label+' - '+check.detail;list.append(item);}
  $('#checks').append(heading,list);for(const warning of result.warnings){const p=document.createElement('p');p.textContent=warning;$('#checks').append(p);}
  $('#download').textContent=result.valid?'Download '+result.blob.type.split('/')[1].toUpperCase():'Download for review (size check failed)';$('#download').disabled=false;$('#status').textContent=result.valid?'Ready to download. Review visual quality and your current official requirements; this is not an acceptance guarantee.':'The output does not meet every size rule. Review the failed checks before using it.';
 }catch(error){if(current===version)$('#status').textContent=error.name==='AbortError'?'Processing cancelled. Your source image is unchanged.':error.message;}
 finally{busy=false;if(controller===pending)controller=null;$('#create').disabled=loading;$('#cancel').hidden=true;form.setAttribute('aria-busy','false');}
};
$('#cancel').onclick=()=>controller?.abort();
$('#download').onclick=()=>{if(output){const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[output.blob.type],base=originalName.replace(/\.[^.]*$/,'').replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,60)||'image';download(output.blob,base+'-resized.'+extension);}};
$('#size-presets').onclick=event=>{const button=event.target.closest('[data-kb]');if(!button)return;$('#target').value=button.dataset.kb;$('#target').dispatchEvent(new Event('input',{bubbles:true}));};
ui();
