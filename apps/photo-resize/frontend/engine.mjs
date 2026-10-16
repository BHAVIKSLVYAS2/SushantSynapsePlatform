export async function compress(image,{width,height,kb}){
 if(![width,height].every(x=>Number.isInteger(x)&&x>=64&&x<=4096)||!Number.isInteger(kb)||kb<10||kb>5000)throw Error('Use dimensions from 64–4096 pixels and a target from 10–5000 KB.');
 const scale=Math.min(1,width/image.width,height/image.height);let w=Math.max(1,Math.floor(image.width*scale)),h=Math.max(1,Math.floor(image.height*scale));
 const canvas=document.createElement('canvas'),limit=kb*1024;
 const encode=q=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('JPEG export failed.')),'image/jpeg',q));
 for(let attempt=0;attempt<12;attempt++){
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
  let best=null,low=.15,high=.95;for(let i=0;i<8;i++){const quality=(low+high)/2,blob=await encode(quality);if(blob.size<=limit){best=blob;low=quality;}else high=quality;}
  if(best)return {blob:best,width:w,height:h};
  if(w===1&&h===1)break;w=Math.max(1,Math.floor(w*.8));h=Math.max(1,Math.floor(h*.8));
 }throw Error('That target could not be reached. Choose a larger file size.');
}
