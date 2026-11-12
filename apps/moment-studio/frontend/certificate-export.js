import {crc32} from '/shared/crc32.mjs';
// Single-page A4 PDF with a 300 dpi image. Rasterized glyphs preserve local fonts,
// scripts and signatures consistently without remote fonts or PDF dependencies.
export {pdfBlob} from '/shared/canvas-pdf.mjs';
// Lossless canvas PNG with explicit print density, replacing the browser's 96 DPI tag.
export async function pngBlob(canvas,dpi=300){
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create image.')),'image/png'));
 const bytes=new Uint8Array(await blob.arrayBuffer()),parts=[bytes.slice(0,8)];
 const density=new Uint8Array(21),view=new DataView(density.buffer);view.setUint32(0,9);density.set([112,72,89,115],4);
 view.setUint32(8,Math.round(dpi/.0254));view.setUint32(12,Math.round(dpi/.0254));density[16]=1;
 view.setUint32(17,crc32(density.slice(4,17)));
 for(let offset=8;offset<bytes.length;){const length=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0),end=offset+length+12,type=String.fromCharCode(...bytes.slice(offset+4,offset+8));if(type!=='pHYs')parts.push(bytes.slice(offset,end));if(type==='IHDR')parts.push(density);offset=end;}
 return new Blob(parts,{type:'image/png'});
}
export {downloadBlob as download} from '/shared/download.mjs';
