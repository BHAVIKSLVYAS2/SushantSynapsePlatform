import {reportStructure} from './pdf-structure.mjs';
// Local, paginated canvas rendering keeps browser-shaped Indic glyphs and SVG charts.
export async function reportPdf(markup){
 await document.fonts.ready;
 const doc=new DOMParser().parseFromString(markup,'text/html'),pages=[];
 const width=1240,height=1754,margin=72,bottom=height-margin;
 let canvas,ctx,y,semanticNode;
 function page(){canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,width,height);ctx.fillStyle='#17232d';y=margin;pages.push({canvas,runs:[]});}
 function paintText(value,x,baseline,size){
  ctx.fillText(value,x,baseline);
  let offset=0;
  for(const match of value.matchAll(/\S+\s*/gu)){
   const end=ctx.measureText(value.slice(0,match.index+match[0].length)).width;
   pages[pages.length-1].runs.push({node:semanticNode,value:match[0],x:x+offset,baseline,size,width:end-offset});
   offset=end;
  }
 }
 function room(h){if(y+h>bottom)page();}
 function lines(text,w,size){ctx.font=`${size}px system-ui, sans-serif`;const out=[];let line='';for(const word of text.trim().split(/\s+/)){if(ctx.measureText(line+(line?' ':'')+word).width>w&&line){out.push(line);line='';}if(ctx.measureText(word).width>w){for(const ch of word){if(ctx.measureText(line+ch).width>w&&line){out.push(line);line='';}line+=ch;}}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
 function text(value,size=21,bold=false){const wrapped=lines(value,width-2*margin,size),lineHeight=size*1.5;room(Math.min(wrapped.length,2)*lineHeight);for(const line of wrapped){room(lineHeight);ctx.font=`${bold?'bold ':''}${size}px system-ui, sans-serif`;ctx.fillStyle='#17232d';paintText(line,margin,y+size,size);y+=lineHeight;}y+=12;}
 function table(node){const rows=[...node.rows],n=rows[0]?.cells.length;if(!n)return;const compact=node.classList.contains('report-house-table');const available=width-2*margin,weights=compact?[.075,.32,.605]:[...rows[0].cells].map(c=>c.classList.contains('report-house-column')?.075:(1-([...rows[0].cells].filter(c=>c.classList.contains('report-house-column')).length*.075))/(n-[...rows[0].cells].filter(c=>c.classList.contains('report-house-column')).length)),sizes=weights.map(w=>w*available);let header;
  function row(r,repeated=false){const cells=[...r.cells],wrapped=cells.map((c,i)=>lines(c.textContent,sizes[i]-20,19)),h=Math.max(...wrapped.map(a=>a.length))*29+20;room(h);let x=margin;cells.forEach((c,i)=>{semanticNode=repeated?null:c;ctx.fillStyle=r.parentElement.tagName==='THEAD'?'#eef2f4':'white';ctx.fillRect(x,y,sizes[i],h);ctx.strokeStyle='#9aa8b2';ctx.strokeRect(x,y,sizes[i],h);ctx.fillStyle='#17232d';ctx.font=`${c.tagName==='TH'?'bold ':''}19px system-ui, sans-serif`;wrapped[i].forEach((s,j)=>paintText(s,x+10,y+30+j*29,19));x+=sizes[i];});y+=h;}
  const rowHeight=r=>Math.max(...[...r.cells].map((c,i)=>lines(c.textContent,sizes[i]-20,19).length))*29+20;
  const captionHeight=node.caption?lines(node.caption.textContent,width-2*margin,23).length*34.5+12:0;
  room(captionHeight+rows.slice(0,2).reduce((sum,r)=>sum+rowHeight(r),0));
  semanticNode=node.caption;
  if(node.caption)text(node.caption.textContent,23,true);
  for(const r of rows){if(r.parentElement.tagName==='THEAD')header=r;if(y+rowHeight(r)>bottom){page();if(header&&r!==header)row(header,true);}row(r);}y+=20;
 }
 async function walk(node){if(node.nodeType!==1)return;const tag=node.tagName;if(tag==='TABLE'){table(node);return;}if(tag==='svg'||tag==='SVG'){const clone=node.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='polygon,rect{fill:white;stroke:#17232d;stroke-width:1.2}text{fill:#17232d;font:13px system-ui,sans-serif;dominant-baseline:hanging}.report-grahas{font-size:15px;font-weight:650}';clone.prepend(style);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));try{const image=new Image();image.src=url;await image.decode();const w=730,h=w*(image.naturalHeight/image.naturalWidth||1);room(h+20);ctx.drawImage(image,(width-w)/2,y,w,h);y+=h+20;}finally{URL.revokeObjectURL(url);}return;}
  if(tag==='FIGURE'){
   const chart=node.querySelector('svg'),caption=node.querySelector('figcaption');
   if(chart&&caption){
    const [, ,w,h]=chart.getAttribute('viewBox').split(/\s+/).map(Number);
    room(lines(caption.textContent,width-2*margin,21).length*31.5+12+730*h/w+20);
   }
  }
  if(['H1','H2','H3','P','DT','DD','LI','FIGCAPTION'].includes(tag)){
   const size=tag==='H1'?34:tag==='H2'?28:tag==='H3'?24:21;
   const next=node.nextElementSibling;
   if(/^H[123]$/.test(tag)&&next?.tagName==='P'){
    const headingHeight=lines(node.textContent,width-2*margin,size).length*size*1.5+12;
    room(headingHeight+Math.min(2,lines(next.textContent,width-2*margin,21).length)*31.5);
   }
   semanticNode=node;
   text(node.textContent,size,/^H|DT|FIGCAPTION/.test(tag));return;
  }
  for(const child of node.children)await walk(child);
 }
 page();await walk(doc.body);return encodePages(pages,doc.querySelector('article')?.lang||'en');
}

// The bitmap preserves the browser's Indic shaping. A parallel Unicode layer
// uses the same baselines for selection, search and extraction.
function encodePages(pages,language){
 const encoder=new TextEncoder(),chunks=[],offsets=[0];
 let length=0;
 function add(value){
  const bytes=typeof value==='string'?encoder.encode(value):value;
  chunks.push(bytes);length+=bytes.length;
 }
 function object(id,body){
  offsets[id]=length;add(`${id} 0 obj\n${body}\nendobj\n`);
 }
 function stream(id,data,attributes=''){
  offsets[id]=length;add(`${id} 0 obj\n<< /Length ${data.length} ${attributes} >>\nstream\n`);
  add(data);add('\nendstream\nendobj\n');
 }
 // Give each combining mark a narrow, selectable region in the invisible layer.
 const advance=ch=>/\p{M}/u.test(ch)?100:1000;
 const characters=new Map();
 for(const page of pages)for(const run of page.runs)for(const ch of run.value){
  if(!characters.has(ch))characters.set(ch,characters.size);
 }
 const alphabet=[...characters.keys()],fontCount=Math.ceil(alphabet.length/250);
 const glyphId=3+pages.length*3,firstFont=glyphId+2;
 const hex=(value,length)=>value.toString(16).padStart(length,'0');
 const fontRefs=Array.from({length:fontCount},(_,i)=>`/F${i} ${firstFont+2*i} 0 R`).join(' ');
 add('%PDF-1.4\n');
 const rootId=firstFont+fontCount*2,parentTree=rootId+1;
 const tags=reportStructure(rootId,parentTree,pages,object);
 object(1,`<< /Type /Catalog /Pages 2 0 R /Lang (${['en','hi','gu'].includes(language)?language:'en'}) /MarkInfo << /Marked true >> /StructTreeRoot ${rootId} 0 R >>`);
 object(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
 stream(glyphId,'1000 0 d0');
 stream(glyphId+1,'100 0 d0');
 for(let f=0;f<fontCount;f++){
  const set=alphabet.slice(f*250,(f+1)*250),id=firstFont+2*f;
  const mappings=set.map((ch,i)=>{
   const utf16=ch.split('').map(unit=>hex(unit.charCodeAt(0),4)).join('');
   return `<${hex(i+1,2)}> <${utf16}>`;
  });
  let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /ReadingUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<01> <FA>\nendcodespacerange\n';
  for(let j=0;j<mappings.length;j+=100){
   const group=mappings.slice(j,j+100);
   cmap+=`${group.length} beginbfchar\n${group.join('\n')}\nendbfchar\n`;
  }
  stream(id+1,cmap+'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend');
  const names=set.map((_,i)=>'/g'+(i+1));
  object(id,`<< /Type /Font /Subtype /Type3 /FontBBox [0 -250 1000 1000] /FontMatrix [.001 0 0 .001 0 0] /CharProcs << ${names.map((n,i)=>n+' '+(advance(set[i])===100?glyphId+1:glyphId)+' 0 R').join(' ')} >> /Encoding << /Type /Encoding /Differences [1 ${names.join(' ')}] >> /FirstChar 1 /LastChar ${set.length} /Widths [${set.map(advance).join(' ')}] /Resources << >> /ToUnicode ${id+1} 0 R >>`);
 }
 pages.forEach(({canvas,runs},i)=>{
  const id=3+i*3;
  object(id,`<< /Type /Page /Parent 2 0 R /StructParents ${i} /Tabs /S /MediaBox [0 0 595.28 841.89] /Resources << /Font << ${fontRefs} >> /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
  const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]),ch=>ch.charCodeAt(0));
  stream(id+1,jpeg,`/Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`);
  const sx=595.28/canvas.width,sy=841.89/canvas.height;
  let commands='/Artifact BMC\nq\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\nEMC\nBT\n3 Tr\n';
  let previous;
  for(const run of runs){
   if(run.group!==previous){
    if(previous!==undefined)commands+='EMC\n';
    commands+=run.group===null?'/Artifact BMC\n':`/${tags.get(run.node).role} << /MCID ${run.group} >> BDC\n`;
    previous=run.group;
   }
   const chars=Array.from(run.value);
   if(!chars.length||!run.width)continue;
   commands+=`1 0 0 1 ${(run.x*sx).toFixed(3)} ${(841.89-run.baseline*sy).toFixed(3)} Tm\n${(100000*run.width*sx/(chars.reduce((sum,ch)=>sum+advance(ch),0)*run.size*sy)).toFixed(4)} Tz\n`;
   let font=-1,encoded='';
   for(const ch of chars){
    const index=characters.get(ch),next=Math.floor(index/250);
    if(next!==font){
     if(encoded)commands+=`<${encoded}> Tj\n`;
     commands+=`/F${next} ${(run.size*sy).toFixed(4)} Tf\n`;encoded='';font=next;
    }
    encoded+=hex(index%250+1,2);
   }
   commands+=`<${encoded}> Tj\n`;
  }
  stream(id+2,commands+(previous===undefined?'':'EMC\n')+'ET\n');
 });
 const start=length,count=offsets.length;
 add(`xref\n0 ${count}\n0000000000 65535 f \n`);
 for(let id=1;id<count;id++)add(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`);
 add(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 return new Blob(chunks,{type:'application/pdf'});
}
