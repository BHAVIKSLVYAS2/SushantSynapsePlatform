import {crc32} from './crc32.mjs';

// Stored (uncompressed) ZIP, preserving callers' existing filename flags.
export function zip(files,{utf8=true}={}){
 const chunks=[],central=[],encoder=new TextEncoder();let offset=0;
 function header(size,values){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const [at,value,bits]of values)bits===16?view.setUint16(at,value,true):view.setUint32(at,value,true);return bytes;}
 for(const file of files){
  const name=encoder.encode(file.name),data=file.data,checksum=crc32(data),flags=utf8?0x800:0;
  const local=header(30,[[0,0x04034b50],[4,20,16],[6,flags,16],[14,checksum],[18,data.length],[22,data.length],[26,name.length,16]]);
  chunks.push(local,name,data);
  central.push(header(46,[[0,0x02014b50],[4,20,16],[6,20,16],[8,flags,16],[16,checksum],[20,data.length],[24,data.length],[28,name.length,16],[42,offset]]),name);
  offset+=local.length+name.length+data.length;
 }
 const size=central.reduce((sum,bytes)=>sum+bytes.length,0);
 return new Blob([...chunks,...central,header(22,[[0,0x06054b50],[8,files.length,16],[10,files.length,16],[12,size],[16,offset]])],{type:'application/zip'});
}
