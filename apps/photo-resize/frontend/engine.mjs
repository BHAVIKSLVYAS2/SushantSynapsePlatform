const formats=['image/jpeg','image/png','image/webp'];
function checkAbort(signal){if(signal?.aborted)throw new DOMException('Image processing cancelled.','AbortError');}
export function options(raw={}){
 const value={minKb:0,fit:'fit',format:'image/jpeg',x:50,y:50,zoom:100,rotation:0,dpi:0,upscale:false,...raw};
 if(![value.width,value.height].every(n=>Number.isInteger(n)&&n>=16&&n<=4096)||!Number.isInteger(value.kb)||value.kb<10||value.kb>5000)throw Error('Use dimensions from 16-4096 pixels and a maximum from 10-5000 KB.');
 if(!Number.isInteger(value.minKb)||value.minKb<0||value.minKb>value.kb)throw Error('Minimum KB must be between zero and the maximum KB.');
 if(!formats.includes(value.format)||!['fit','crop'].includes(value.fit)||![0,90,180,270].includes(value.rotation)||typeof value.upscale!=='boolean')throw Error('Choose a supported format, sizing mode and rotation.');
 if(![value.x,value.y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||!Number.isFinite(value.zoom)||value.zoom<100||value.zoom>300)throw Error('Choose crop positions from 0-100 and zoom from 100-300%.');
 if(value.dpi!==0&&(!Number.isInteger(value.dpi)||value.dpi<36||value.dpi>1200||value.format!=='image/jpeg'))throw Error('DPI metadata is supported for JPEG only, from 36-1200. Leave it blank for pixel-only output.');
 if(value.maxBytes!==undefined&&(!Number.isInteger(value.maxBytes)||value.maxBytes<10240||value.maxBytes>value.kb*1024))throw Error('Invalid profile byte limit.');
 return {...value,maxBytes:value.maxBytes??value.kb*1024,minBytes:value.minKb*1024};
}
export function geometry(image,raw){
 const s=options(raw),sw=s.rotation%180?image.height:image.width,sh=s.rotation%180?image.width:image.height;
 if(![sw,sh].every(n=>Number.isInteger(n)&&n>0)||sw*sh>24000000)throw Error('Choose an image up to 24 megapixels.');
 if(s.fit==='fit'){const scale=Math.min(1,s.width/sw,s.height/sh);return {x:0,y:0,width:sw,height:sh,outputWidth:Math.max(1,Math.floor(sw*scale)),outputHeight:Math.max(1,Math.floor(sh*scale)),upscaled:false};}
 const ratio=s.width/s.height,cw=Math.min(sw,sh*ratio)*100/s.zoom,ch=cw/ratio,upscaled=cw<s.width-.001||ch<s.height-.001;
 if(upscaled&&!s.upscale)throw Error('The selected crop is smaller than the requested pixels. Use a larger original, reduce zoom/dimensions, or explicitly allow enlarging. Enlarging cannot restore detail.');
 return {x:(sw-cw)*s.x/100,y:(sh-ch)*s.y/100,width:cw,height:ch,outputWidth:s.width,outputHeight:s.height,upscaled};
}
export function drawImage(canvas,image,raw,size){
 const s=options(raw),g=geometry(image,s);canvas.width=size?.width??g.outputWidth;canvas.height=size?.height??g.outputHeight;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(s.format==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
 ctx.save();ctx.scale(canvas.width/g.width,canvas.height/g.height);ctx.translate(-g.x,-g.y);
 if(s.rotation===90){ctx.translate(image.height,0);ctx.rotate(Math.PI/2);}
 if(s.rotation===180){ctx.translate(image.width,image.height);ctx.rotate(Math.PI);}
 if(s.rotation===270){ctx.translate(0,image.width);ctx.rotate(3*Math.PI/2);}
 ctx.drawImage(image,0,0);ctx.restore();return g;
}
// JFIF density describes physical print size; it never creates extra image detail.
export function jpegDensity(bytes,dpi){
 const result=new Uint8Array(bytes);if(result[0]!==255||result[1]!==216)throw Error('JPEG metadata could not be written.');
 for(let i=2;i+17<result.length;){if(result[i]!==255||result[i+1]===218)break;const length=(result[i+2]<<8)|result[i+3];if(length<2||i+2+length>result.length)break;
  if(result[i+1]===224&&length>=16&&String.fromCharCode(...result.slice(i+4,i+9))==='JFIF\0'){result[i+11]=1;result[i+12]=dpi>>8;result[i+13]=dpi&255;result[i+14]=dpi>>8;result[i+15]=dpi&255;return result;}i+=length+2;
 }
 const marker=Uint8Array.of(255,224,0,16,74,70,73,70,0,1,1,1,dpi>>8,dpi&255,dpi>>8,dpi&255,0,0),output=new Uint8Array(result.length+marker.length);output.set(result.slice(0,2));output.set(marker,2);output.set(result.slice(2),20);return output;
}
export function checkOutput(result,raw){
 const s=options(raw),checks=[{label:'File format',pass:result.blob.type===s.format,detail:result.blob.type},{label:'Maximum file size',pass:result.blob.size<=s.maxBytes,detail:`${result.blob.size.toLocaleString('en-IN')} / ${s.maxBytes.toLocaleString('en-IN')} bytes`},{label:'Minimum file size',pass:result.blob.size>=s.minBytes,detail:s.minBytes?`At least ${s.minBytes.toLocaleString('en-IN')} bytes`:'No minimum set'},{label:'Dimensions',pass:s.fit==='crop'?result.width===s.width&&result.height===s.height:result.width<=s.width&&result.height<=s.height,detail:`${result.width} \u00d7 ${result.height} px${s.fit==='crop'?' (exact)':' (within maximum)'}`}];
 if(s.dpi)checks.push({label:'JPEG print density',pass:result.dpi===s.dpi,detail:`${s.dpi} DPI \u00b7 ${(result.width/s.dpi*2.54).toFixed(2)} \u00d7 ${(result.height/s.dpi*2.54).toFixed(2)} cm`});
 const warnings=[];if(result.upscaled)warnings.push('The image was enlarged. No new face or signature detail was created.');if(result.quality<.5)warnings.push('Strong compression was needed. Check eyes, edges and signature strokes closely.');
 if(result.blob.size<s.minBytes)warnings.push('The file is below the minimum. Use a more detailed/higher-resolution source or recheck the form requirements. This tool does not add filler bytes or noise to fake compliance.');
 return {checks,valid:checks.every(check=>check.pass),warnings};
}
function encode(canvas,format,quality){return new Promise((resolve,reject)=>canvas.toBlob(blob=>{if(!blob)reject(Error('Image export failed. Try a smaller image.'));else if(blob.type!==format)reject(Error('This browser cannot export that format. Choose JPEG or PNG.'));else resolve(blob);},format,quality));}
export async function estimate(image,raw){const s=options(raw);checkAbort(s.signal);const canvas=document.createElement('canvas');try{drawImage(canvas,image,s);const blob=await encode(canvas,s.format,.85);checkAbort(s.signal);return blob.size+(s.dpi?18:0);}finally{canvas.width=canvas.height=1;}}
export async function compress(image,raw){
 const s=options(raw);checkAbort(s.signal);const g=geometry(image,s),canvas=document.createElement('canvas');let w=g.outputWidth,h=g.outputHeight;const budget=s.maxBytes-(s.dpi?18:0);
 try{for(let attempt=0;attempt<12;attempt++){
  checkAbort(s.signal);drawImage(canvas,image,s,{width:w,height:h});let best=null,quality=1;
  const full=await encode(canvas,s.format,1);checkAbort(s.signal);if(full.size<=budget)best=full;
  else if(s.format!=='image/png'){let low=.1,high=1;for(let i=0;i<9;i++){checkAbort(s.signal);const q=(low+high)/2,blob=await encode(canvas,s.format,q);checkAbort(s.signal);if(blob.size<=budget){best=blob;quality=q;low=q;}else high=q;}}
  if(best){if(s.dpi)best=new Blob([jpegDensity(await best.arrayBuffer(),s.dpi)],{type:'image/jpeg'});checkAbort(s.signal);const result={blob:best,width:w,height:h,quality,dpi:s.dpi,upscaled:g.upscaled};return {...result,...checkOutput(result,s)};}
  if(s.fit==='crop')throw Error('The byte limit cannot be reached at these exact dimensions. Exact pixels were preserved; choose JPEG/WebP, a larger KB limit, or a different source.');
  if(w===1&&h===1)break;w=Math.max(1,Math.floor(w*.8));h=Math.max(1,Math.floor(h*.8));
 }throw Error('That file-size limit could not be reached. Choose a larger maximum.');}
 finally{canvas.width=canvas.height=1;}
}
