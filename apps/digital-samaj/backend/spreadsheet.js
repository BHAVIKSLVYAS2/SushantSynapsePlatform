'use strict';
// Bounded, read-only first-sheet XLSX import. No macros, formulas or filesystem extraction.
const {inflateRawSync}=require('node:zlib');
const {fail}=require('../../../server/http');
function csv(source){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)fail(400,'CSV contains an unclosed quoted field');row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);return records(rows);
}
function records(rows){if(rows.length<2||rows.length>501)fail(400,'Import requires a header and 1–500 rows');const headers=rows.shift().map(h=>String(h||'').replace(/^\uFEFF/,'').trim());if(headers.length>60||headers.some(h=>!h||h.length>200)||new Set(headers).size!==headers.length)fail(400,'Use 1–60 unique column headings');return {headers,rows:rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,String(row[i]??'')])))};}
const xmlText=s=>s.replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,v=>({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[v]??String.fromCodePoint(Math.min(0x10ffff,parseInt(v.slice(v[2]==='x'?3:2,-1),v[2]==='x'?16:10)))));
function xlsx(buffer){
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}if(end<0)fail(400,'Invalid XLSX archive');
 const entries=buffer.readUInt16LE(end+10);if(entries>2000)fail(400,'Workbook has too many entries');let pos=buffer.readUInt32LE(end+16),expanded=0;const files=new Map();
 for(let i=0;i<entries;i++){
  if(pos+46>buffer.length||buffer.readUInt32LE(pos)!==0x02014b50)fail(400,'Invalid ZIP directory');const method=buffer.readUInt16LE(pos+10),flags=buffer.readUInt16LE(pos+8),size=buffer.readUInt32LE(pos+20),uncompressed=buffer.readUInt32LE(pos+24),nl=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),offset=buffer.readUInt32LE(pos+42),name=buffer.toString('utf8',pos+46,pos+46+nl);pos+=46+nl+extra+comment;
  if(!['xl/sharedStrings.xml','xl/worksheets/sheet1.xml','xl/workbook.xml'].includes(name))continue;
  if(flags&1||![0,8].includes(method)||uncompressed>4000000||expanded+uncompressed>6000000||offset+30>buffer.length||buffer.readUInt32LE(offset)!==0x04034b50)fail(400,'Unsupported or oversized workbook');
  const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28);if(start+size>buffer.length)fail(400,'Invalid ZIP entry');const input=buffer.subarray(start,start+size),contents=method===8?inflateRawSync(input,{maxOutputLength:4000000}):input;if(contents.length!==uncompressed)fail(400,'Invalid ZIP size');expanded+=contents.length;const xml=contents.toString('utf8');if(/<!DOCTYPE|<!ENTITY/i.test(xml))fail(400,'XML entities are not supported');files.set(name,xml);
 }
 const source=files.get('xl/worksheets/sheet1.xml');if(!source)fail(400,'Workbook must contain sheet1');if(/<f(?:\s|>)/.test(source))fail(400,'Export calculated cells as values before importing');
 const strings=[...(files.get('xl/sharedStrings.xml')||'').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(t=>xmlText(t[1])).join(''));
 const rows=[];for(const match of source.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)){
  const row=[];for(const cell of match[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){const ref=/\br="([A-Z]+)\d+"/.exec(cell[1])?.[1];if(!ref)fail(400,'Cell address is missing');let column=0;for(const char of ref)column=column*26+char.charCodeAt(0)-64;if(column>60)fail(400,'Maximum 60 columns');const type=/\bt="([^"]+)"/.exec(cell[1])?.[1],value=/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(cell[2])?.[1]||'';row[column-1]=type==='s'?(strings[Number(value)]??''):type==='inlineStr'?[...cell[2].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m=>xmlText(m[1])).join(''):xmlText(value);}
  if(row.some(Boolean))rows.push(Array.from({length:row.length},(_,i)=>row[i]||''));if(rows.length>501)fail(400,'Maximum 500 data rows');
 }
 const result=records(rows);result.excelDateSystem=/date1904="(?:1|true)"/.test(files.get('xl/workbook.xml')||'')?1904:1900;return result;
}
module.exports={csv,xlsx};
