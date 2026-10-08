// Single-page A4 PDF with a 300 dpi image. Rasterized glyphs preserve local fonts,
// scripts and signatures consistently without remote fonts or PDF dependencies.
export function pdfBlob(canvas){
 const raw=atob(canvas.toDataURL('image/jpeg',.98).split(',')[1]);
 const jpeg=Uint8Array.from(raw,c=>c.charCodeAt(0));
 const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length;};
 const object=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`);};
 add('%PDF-1.4\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.889764 595.275591] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
 const commands='q\n841.889764 0 0 595.275591 0 0 cm\n/Im0 Do\nQ\n';
 object(5,`<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
 const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
 add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 return new Blob(chunks,{type:'application/pdf'});
}
// Lossless canvas PNG with explicit print density, replacing the browser's 96 DPI tag.
export async function pngBlob(canvas,dpi=300){
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create image.')),'image/png'));
 const bytes=new Uint8Array(await blob.arrayBuffer()),parts=[bytes.slice(0,8)];
 const density=new Uint8Array(21),view=new DataView(density.buffer);view.setUint32(0,9);density.set([112,72,89,115],4);
 view.setUint32(8,Math.round(dpi/.0254));view.setUint32(12,Math.round(dpi/.0254));density[16]=1;
 let crc=0xffffffff;for(const byte of density.slice(4,17)){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}view.setUint32(17,(crc^0xffffffff)>>>0);
 for(let offset=8;offset<bytes.length;){const length=new DataView(bytes.buffer,bytes.byteOffset+offset,4).getUint32(0),end=offset+length+12,type=String.fromCharCode(...bytes.slice(offset+4,offset+8));if(type!=='pHYs')parts.push(bytes.slice(offset,end));if(type==='IHDR')parts.push(density);offset=end;}
 return new Blob(parts,{type:'image/png'});
}
export function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
