import {$,init,download} from '/shared/local-tools.mjs?v=20261016-wins';
import {compress} from './engine.mjs?v=20261016-wins';
init();let image=null,version=0,output=null,busy=false;
function clear(){output=null;$('#download').disabled=true;$('#preview').hidden=true;}
$('#editor').addEventListener('input',e=>{if(e.target.id!=='photo'){version++;clear();}});
$('#photo').onchange=async()=>{const current=++version;clear();image?.close();image=null;const file=$('#photo').files[0];if(!file)return;try{
 if(file.size>12*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG or WebP image up to 12 MB.');
 const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>24000000){bitmap.close();throw Error('Choose an image smaller than 24 megapixels.');}if(current!==version){bitmap.close();return;}image=bitmap;$('#status').textContent=bitmap.width+' × '+bitmap.height+' pixels · '+Math.ceil(file.size/1024)+' KB. Choose your target and resize.';
 }catch(e){if(current===version){$('#photo').value='';$('#status').textContent=e.message;}}};
$('#editor').onsubmit=async e=>{e.preventDefault();if(busy)return;if(!image){$('#status').textContent='Choose a photo first.';return;}const current=version,snapshot=image;busy=true;clear();$('#create').disabled=true;$('#status').textContent='Preparing your smaller photo…';try{const result=await compress(snapshot,{width:Number($('#width').value),height:Number($('#height').value),kb:Number($('#target').value)});if(current!==version)return;output=result;const preview=await createImageBitmap(result.blob);if(current!==version){preview.close();return;}const c=$('#preview');c.width=preview.width;c.height=preview.height;c.getContext('2d').drawImage(preview,0,0);preview.close();c.hidden=false;$('#download').disabled=false;$('#status').textContent=result.width+' × '+result.height+' pixels · '+Math.ceil(result.blob.size/1024)+' KB. Ready to download.';}catch(error){if(current===version)$('#status').textContent=error.message;}finally{busy=false;$('#create').disabled=false;}};
$('#download').onclick=()=>{if(output)download(output.blob,'resized-photo.jpg');};
