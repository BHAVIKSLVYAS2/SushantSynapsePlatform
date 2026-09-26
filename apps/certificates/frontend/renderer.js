// All certificate geometry is in a 1122 × 793.333 A4 landscape coordinate system.
export const templates=['Classic','Modern','Minimal','Elegant','Community','Corporate'];
export const accents={blue:'#234560',teal:'#216d68',gold:'#82652e',plum:'#68405e'};
// Decode the same-origin brand mark before any preview or export is rendered.
const brandLogo=await (async()=>{const logo=new Image();logo.src='/logo-adaptive-192.png';try{await logo.decode();return logo;}catch{return null;}})();
const ink='#253441',muted='#63717a',paper='#fffefa';
export function render(canvas,data,images={},scale=1.25){
 canvas.width=Math.round(1122*scale);canvas.height=Math.round(1122*210/297*scale);
 const c=canvas.getContext('2d');c.scale(canvas.width/1122,canvas.height/(1122*210/297));
 const W=1122,H=1122*210/297,a=accents[data.accent]||accents.blue,t=data.template||'Classic';
 c.fillStyle=paper;c.fillRect(0,0,W,H);
 const rect=(x,y,w,h,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);};
 const line=(x,y,x2,y2,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 const poly=(points,color)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();};
 if(t==='Classic'){rect(26,26,W-52,H-52,a,3);rect(35,35,W-70,H-70,a,.7);for(const x of [47,W-47])for(const y of [47,H-47]){c.save();c.translate(x,y);c.rotate(Math.PI/4);rect(-5,-5,10,10,a);c.restore();}line(430,192,692,192,a);}
 if(t==='Modern'){poly([[0,0],[200,0],[0,75]],a);poly([[0,0],[70,0],[0,160]],'#cadbdf');poly([[W,H],[W-140,H],[W,H-100]],a);line(80,207,1042,207,a,2);}
 if(t==='Minimal'){line(80,60,1042,60,a,2);line(80,H-30,1042,H-30,a);line(511,195,611,195,a,3);}
 if(t==='Elegant'){rect(24,24,W-48,H-48,a);rect(42,42,W-84,H-84,a,2);for(const x of [42,W-42])for(const y of [42,H-42]){c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.fillStyle=paper;c.fill();c.strokeStyle=a;c.stroke();}line(410,199,530,199,a);line(592,199,712,199,a);poly([[561,192],[568,199],[561,206],[554,199]],a);}
 if(t==='Community'){for(let i=0;i<8;i++){c.save();c.translate(35+i*9,95+i*62);c.rotate(-.4);c.beginPath();c.ellipse(0,0,13,28,0,0,Math.PI*2);c.fillStyle=i%2?a:'#d9e5dd';c.fill();c.restore();c.save();c.translate(W-35-i*9,H-95-i*62);c.rotate(-.4);c.beginPath();c.ellipse(0,0,13,28,0,0,Math.PI*2);c.fillStyle=i%2?a:'#d9e5dd';c.fill();c.restore();}line(160,62,962,62,a);line(160,H-30,962,H-30,a);}
 if(t==='Corporate'){c.fillStyle=a;c.fillRect(0,0,22,H);c.fillRect(0,0,W,15);rect(48,40,W-88,H-80,'#ced7dd');c.fillStyle=a;c.fillRect(72,221,5,320);line(80,H-64,1042,H-64,a);}
 // Layout wraps whole graphemes and reduces type only as needed, never clips text.
 function block(text,x,y,w,h,size=22,family='Arial',color=ink,weight='normal'){
  text=String(text||'').replace(/\s+/g,' ').trim();if(!text)return;
  let lines=[],s=size;
  const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
  const split=word=>graphemes?[...graphemes.segment(word)].map(v=>v.segment):Array.from(word);
  for(;s>=8;s--){c.font=`${weight} ${s}px ${family}`;lines=[];
   for(const paragraph of text.split(/\n/)){let current='';for(const word of paragraph.split(/\s+/)){if(c.measureText((current?current+' ':'')+word).width<=w){current+=(current?' ':'')+word;continue;}if(current){lines.push(current);current='';}for(const char of split(word)){if(c.measureText(current+char).width>w&&current){lines.push(current);current='';}current+=char;}}if(current)lines.push(current);}
   if(lines.length*s*1.35<=h)break;
  }
  c.font=`${weight} ${s}px ${family}`;c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';
  lines.forEach((v,i)=>c.fillText(v,x+w/2,y+h/2+(i-(lines.length-1)/2)*s*1.35));
 }
 function image(img,x,y,w,h){if(!img)return;const ratio=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*ratio)/2,y+(h-img.height*ratio)/2,img.width*ratio,img.height*ratio);}
 image(images.logo,data.logoPosition==='left'?95:data.logoPosition==='right'?937:516,68,90,68);
 block(data.organization,180,144,762,40,24,'Arial',a,'600');
 const serif=['Classic','Elegant','Community'].includes(t)?'Georgia':'Arial';
 block(data.title||'CERTIFICATE OF APPRECIATION',135,228,852,68,35,serif,a);
 block('PRESENTED TO',150,311,822,26,12,'Arial',muted);
 block(data.recipient||'Recipient Name',135,346,852,91,55,serif,ink);
 line(355,449,767,449,a,.7);
 block('In recognition and sincere appreciation of',150,466,822,26,17,'Arial',muted);
 block(data.description||'your valuable contribution and support to our community',157,501,808,81,23,'Arial',ink);
 block(data.message,180,590,762,47,17,serif,muted);
 image(images.signature,755,643,200,48);
 const date=data.date?new Date(data.date+'T12:00:00'):null;
 block(date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'',115,668,300,27,18,'Arial',ink);
 line(145,703,385,703,a,.7);line(735,703,975,703,a,.7);
 block(data.location||'DATE OF APPRECIATION',115,709,300,26,12,'Arial',muted);
 block(data.signatory,690,707,330,22,15,'Arial',ink,'600');
 block(data.designation,690,733,330,20,12,'Arial',muted);
 block(data.reference,421,729,280,18,10,'Arial',muted);
 const credit='Created with Sushant Synapse';
 c.font='10px Arial';
 const creditWidth=c.measureText(credit).width,markWidth=brandLogo?20:0,left=(W-creditWidth-markWidth)/2;
 c.save();
 if(brandLogo){c.globalAlpha=.65;image(brandLogo,left,770,15,15);c.globalAlpha=1;}
 c.fillStyle='#7b858c';c.textAlign='left';c.textBaseline='middle';c.fillText(credit,left+markWidth,777.5);
 c.restore();
 return canvas;
}
