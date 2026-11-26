'use strict';
const $ = id => document.getElementById(id);
const canvas=document.querySelector('canvas'), audio=document.querySelector('audio'), video=document.querySelector('video');
const files={}, images={}, slots={}, patterns={cover:/\.(jpe?g|png|webp)$/i,logo:/\.(jpe?g|png|webp)$/i};
let worker, busy=false, generation=0, mediaUrl, resultUrl, ticker, started, fraction=0;
const supported=typeof Worker==='function' && typeof WebAssembly==='object' && typeof DecompressionStream==='function';
$('parallelOption').hidden=!(window.crossOriginIsolated && typeof SharedArrayBuffer==='function' && navigator.hardwareConcurrency>1);
const mb = bytes => (bytes/1048576).toFixed(1)+' MiB';
const time = sec => Math.floor(sec/60)+':'+String(Math.floor(sec%60)).padStart(2,'0');
function releaseResult(){
  if(resultUrl)URL.revokeObjectURL(resultUrl);
  resultUrl=null; video.removeAttribute('src'); video.load(); $('result').hidden=true;
}
function dimensions(){
  const r=$('ratio').value, image=images.cover;
  const ratio=r==='Original'?(image?image.width/image.height:1):r.split(':').reduce((a,b)=>a/b);
  const side=Number($('resolution').value);
  const width=side*Math.max(1,ratio),height=side*Math.max(1,1/ratio);
  const scale=Math.min(1,side*16/9/Math.max(width,height));
  return [width,height].map(x=>Math.max(2,Math.round(x*scale/2)*2));
}
function paint(target,w,h){
  target.width=w;target.height=h;
  const ctx=target.getContext('2d'),cover=images.cover;
  ctx.fillStyle=$('bg').value;ctx.fillRect(0,0,w,h);
  if(!cover)return;
  const fill=Math.max(w/cover.width,h/cover.height);
  if($('blur').checked){
    ctx.save();ctx.filter='blur('+Math.max(4,w*.025)+'px)';
    const scale=fill*1.18;
    ctx.drawImage(cover,(w-cover.width*scale)/2,(h-cover.height*scale)/2,cover.width*scale,cover.height*scale);ctx.restore();
  }
  const scale=($('fit').value==='Fit'?Math.min(w/cover.width,h/cover.height):fill)*Number($('zoom').value)/100;
  const iw=cover.width*scale,ih=cover.height*scale;
  ctx.drawImage(cover,(w-iw)*Number($('x').value)/100,(h-ih)*Number($('y').value)/100,iw,ih);
  if(images.logo){
    const k=Math.min(w*.17/images.logo.width,h*.13/images.logo.height);
    ctx.drawImage(images.logo,w*.95-images.logo.width*k,h*.05,images.logo.width*k,images.logo.height*k);
  }
  const font=Math.min(w,h)*Number($('size').value)/100;
  const y={Top:h*.08+font,Centre:h*.48,Bottom:h*.90-font*.6}[$('position').value];
  ctx.fillStyle=$('ink').value;ctx.textAlign='center';ctx.font='bold '+font+'px sans-serif';
  ctx.fillText($('titleText').value,w/2,y,w*.9);
  ctx.font=font*.65+'px sans-serif';ctx.fillText($('artist').value,w/2,y+font*.9,w*.9);
}
function refresh(){
  const [w,h]=dimensions(),scale=Math.min(1,800/Math.max(w,h));
  paint(canvas,Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));
  $('estimate').textContent=w+' × '+h+' · '+$('fps').value+' fps · MP4'+(Number.isFinite(audio.duration)?' · '+time(audio.duration):'');
  $('warning').textContent=!supported?'This browser needs WebAssembly, workers and gzip decompression.':
    w*h>8300000 || files.media?.size>200*1048576 || (navigator.deviceMemory<=4 && w*h>=2073600)?'Large exports need more device memory. Choose 720p if encoding fails.':'';
  $('generate').disabled=!supported||busy||!files.media||!images.cover;
}
function clearFile(kind){
  delete files[kind];images[kind]?.close();delete images[kind];
  if(kind==='media'){
    audio.pause();audio.removeAttribute('src');audio.load();
    if(mediaUrl)URL.revokeObjectURL(mediaUrl);mediaUrl=null;
  }
  const slot=slots[kind];slot.input.value='';slot.info.textContent='';slot.remove.hidden=true;
  releaseResult();refresh();
}
async function choose(kind,file){
  if(!file||busy)return;
  clearFile(kind);
  const ext=kind==='media'?($('mode').selectedIndex?/\.mp4$/i:/\.(wav|mp3|aac|m4a|flac|ogg)$/i):patterns[kind];
  if(!ext.test(file.name)||!file.size){$('status').textContent='Choose a non-empty file in one of the listed formats.';return;}
  files[kind]=file;
  try{
    let detail=file.name+' · '+mb(file.size);
    if(kind==='media'){
      audio.src=mediaUrl=URL.createObjectURL(file);
      $('filename').value=file.name.replace(/\.[^.]+$/,'')+'-cover';
    }else{
      const head=new Uint8Array(await file.slice(0,12).arrayBuffer());
      const mark=String.fromCharCode(...head);
      if(!(head[0]===255&&head[1]===216&&head[2]===255) &&
         !(head[0]===137&&mark.slice(1,4)==='PNG') &&
         !(mark.startsWith('RIFF')&&mark.slice(8)==='WEBP'))throw Error('Unsupported image format');
      const img=await createImageBitmap(file);
      if(files[kind]!==file){img.close();return;}
      images[kind]=img;detail+=' · '+img.width+' × '+img.height;
    }
    slots[kind].info.textContent=detail;slots[kind].remove.hidden=false;
    $('status').textContent=files.media&&images.cover?'Ready':'Choose a recording and cover image.';
    refresh();
    if(kind==='cover'&&matchMedia('(max-width:700px)').matches)$('preview').scrollIntoView({block:'start'});
  }catch{if(files[kind]===file){clearFile(kind);$('status').textContent='That image could not be decoded.';}}
}
function upload(kind,label,accept,parent){
  const box=document.createElement('div');box.className='drop';
  const title=document.createElement('label'),input=document.createElement('input'),info=document.createElement('small'),remove=document.createElement('button');
  title.textContent=label;input.type='file';input.accept=accept;input.id=kind;title.append(input);
  remove.type='button';remove.textContent='Remove';remove.hidden=true;remove.setAttribute('aria-label','Remove '+label);
  box.append(title,info,remove);$(parent).append(box);slots[kind]={input,info,remove};
  input.onchange=()=>choose(kind,input.files[0]);remove.onclick=()=>clearFile(kind);
  box.ondragover=e=>e.preventDefault();box.ondrop=e=>{e.preventDefault();choose(kind,e.dataTransfer.files[0]);};
}
upload('media','Recording · WAV, MP3, AAC, M4A, FLAC or OGG','.wav,.mp3,.aac,.m4a,.flac,.ogg','uploads');
upload('cover','Cover image · JPG, PNG or WebP','.jpg,.jpeg,.png,.webp','uploads');
upload('logo','Optional logo','.jpg,.jpeg,.png,.webp','logoSlot');
$('mode').onchange=()=>{
  clearFile('media');slots.media.input.accept=$('mode').selectedIndex?'.mp4':'.wav,.mp3,.aac,.m4a,.flac,.ogg';
  slots.media.input.parentElement.firstChild.textContent=$('mode').selectedIndex?'Existing MP4 video':'Recording · WAV, MP3, AAC, M4A, FLAC or OGG';
  $('preserve').checked=Boolean($('mode').selectedIndex);
};
audio.onloadedmetadata=refresh;
audio.onerror=()=>{if(mediaUrl)$('status').textContent='Audio preview unavailable. The encoder will check the original file.';};
$('settings').oninput=e=>{if(e.target.type!=='file'){releaseResult();refresh();}};
$('fit').onchange=()=>{if($('fit').value==='Crop')$('zoom').value=125;refresh();};
function finish(label){
  generation++;worker?.terminate();worker=null;clearInterval(ticker);busy=false;
  $('settings').disabled=false;$('cancel').hidden=true;$('status').textContent=label;refresh();
}
$('cancel').onclick=()=>finish('Cancelled. Your inputs are ready to use again.');
function filename(){
  const safe=$('filename').value.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').trim().replace(/\.mp4$/i,'').replace(/[. ]+$/,'');
  $('download').download=(safe||'music-video')+'.mp4';
}
$('filename').oninput=filename;
$('config').onsubmit=async e=>{
  e.preventDefault();if(busy||$('generate').disabled)return;
  busy=true;const job=++generation;started=performance.now();fraction=0;
  $('settings').disabled=true;$('cancel').hidden=false;releaseResult();audio.pause();
  $('status').textContent='Preparing media';document.querySelector('progress').value=0;
  $('clock').textContent='';ticker=setInterval(()=>{
    const seconds=(performance.now()-started)/1000;
    $('clock').textContent='Elapsed '+time(seconds)+(fraction>.05&&fraction<.98&&seconds>10?' · Approximately '+time(seconds*(1-fraction)/fraction)+' remaining':'');
  },500);
  try{
    const [w,h]=dimensions(),cover=document.createElement('canvas');paint(cover,w,h);
    const png=await new Promise(resolve=>cover.toBlob(resolve,'image/png'));cover.width=cover.height=1;
    if(job!==generation)return;if(!png)throw Error('Cover too large for this device. Choose a smaller frame.');
    worker=new Worker('/audio-to-video/worker.js');
    worker.onerror=()=>finish('Failed to start or complete encoding. Reload or try 720p.');
    worker.onmessage=({data})=>{
      if(job!==generation)return;
      if(data.error){finish('Failed · '+data.error);return;}
      if(data.phase)$('status').textContent=data.phase;
      if(Number.isFinite(data.fraction)){fraction=Math.max(0,data.fraction);document.querySelector('progress').value=fraction;}
      if(data.bytes){
        const blob=new Blob([data.bytes],{type:'video/mp4'});
        video.src=$('download').href=resultUrl=URL.createObjectURL(blob);
        filename();$('result').hidden=false;$('metadata').textContent=data.width+' × '+data.height+' · '+time(data.duration)+' · '+data.codec+' · '+mb(blob.size);
        document.querySelector('progress').value=1;finish('Completed');
      }
    };
    worker.postMessage({media:files.media,cover:png,width:w,fps:$('fps').value,rate:$('rate').value,effect:$('effect').value,preserve:$('preserve').checked,replace:Boolean($('mode').selectedIndex),parallel:$('parallel').checked});
  }catch(error){if(job===generation)finish('Failed · '+error.message);}
};
$('reset').onclick=()=>{for(const kind of Object.keys(slots))clearFile(kind);$('config').reset();$('mode').onchange();$('clock').textContent='';document.querySelector('progress').value=0;$('status').textContent='Choose your recording and cover image.';};
window.addEventListener('pagehide',()=>{if(busy)finish('Cancelled');});
refresh();
