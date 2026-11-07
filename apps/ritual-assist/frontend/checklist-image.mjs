import {drawExportBrand} from '/shared/export-brand.mjs';

// A clean paper export, independent of the screen theme and checklist filters.
export function renderChecklistImage(canvas,{title,date,items,language='en'}){
 const hi=language==='hi',width=1000,pad=48,ctx=canvas.getContext('2d');
 if(!ctx)throw Error(hi?'चित्र उपलब्ध नहीं है। PDF सहेजें।':'Image unavailable. Use Save PDF.');
 const font=size=>`${size}px "Segoe UI", "Nirmala UI", Arial, sans-serif`;
 function wrap(text,max,size){
  ctx.font=font(size);const lines=[];let line='';
  const parts=String(text||'').split(/\s+/u);
  for(const word of parts){
   if(ctx.measureText((line?line+' ':'')+word).width<=max){line+=(line?' ':'')+word;continue;}
   if(line){lines.push(line);line='';}
   const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(language,{granularity:'grapheme'}).segment(word)].map(v=>v.segment):Array.from(word);
   for(const part of segments){if(line&&ctx.measureText(line+part).width>max){lines.push(line);line='';}line+=part;}
  }
  if(line)lines.push(line);return lines.length?lines:['—'];
 }
 const heading=wrap(title,width-pad*2,34),rows=items.map(item=>{
  const name=wrap(item.label,430,25),quantity=wrap(item.quantity,140,23),arranger=wrap(item.arranger,230,23);
  return {...item,name,quantity,arranger,height:Math.max(name.length,quantity.length,arranger.length)*34+32};
 });
 const tableY=120+heading.length*44+(date?40:0),height=tableY+58+rows.reduce((sum,row)=>sum+row.height,0)+104;
 if(height>16000)throw Error(hi?'यह सूची चित्र के लिए बहुत लंबी है। PDF सहेजें।':'This checklist is too long for a readable image. Use Save PDF.');
 canvas.width=width;canvas.height=height;canvas.dataset.checklistRows=String(rows.length);
 canvas.setAttribute('aria-label',title+' · '+items.map(i=>i.label).join('; '));
 ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.textBaseline='top';
 ctx.fillStyle='#526174';ctx.font=font(20);ctx.fillText('RITUAL ASSIST',pad,36);
 ctx.fillStyle='#172d36';ctx.font=font(34);heading.forEach((line,i)=>ctx.fillText(line,pad,78+i*44));
 if(date){ctx.font=font(22);ctx.fillStyle='#526174';ctx.fillText(date+' · '+(hi?'अनुष्ठान की तिथि':'Ritual date'),pad,84+heading.length*44);}
 ctx.fillStyle='#eaf2ef';ctx.fillRect(pad,tableY,width-pad*2,58);ctx.fillStyle='#245b50';ctx.font=font(22);
 for(const [text,x]of [[hi?'सामग्री':'Item',pad+48],[hi?'मात्रा':'Quantity',550],[hi?'व्यवस्था':'Arranged by',710]])ctx.fillText(text,x,tableY+16);
 let y=tableY+58;
 for(const row of rows){
  ctx.strokeStyle='#d5dedb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,y+row.height);ctx.lineTo(width-pad,y+row.height);ctx.stroke();
  ctx.strokeStyle=row.done?'#245b50':'#8a9896';ctx.lineWidth=2;ctx.strokeRect(pad+2,y+19,22,22);
  if(row.done){ctx.beginPath();ctx.moveTo(pad+6,y+30);ctx.lineTo(pad+12,y+36);ctx.lineTo(pad+21,y+23);ctx.stroke();}
  for(const [lines,x,size]of [[row.name,pad+48,25],[row.quantity,550,23],[row.arranger,710,23]]){ctx.font=font(size);ctx.fillStyle='#172d36';lines.forEach((line,i)=>ctx.fillText(line,x,y+16+i*34));}
  y+=row.height;
 }
 ctx.font=font(19);ctx.fillStyle='#526174';ctx.fillText(hi?'नाम और जिम्मेदारियाँ साझा करने से पहले जाँचें।':'Review names and responsibilities before sharing.',pad,y+24);
 drawExportBrand(ctx,{width,height,size:20});return true;
}
