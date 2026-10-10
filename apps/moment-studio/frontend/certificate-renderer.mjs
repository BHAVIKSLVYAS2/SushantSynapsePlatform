import {drawWatermark} from './branding.mjs';
// Parse decimal rupees into integer paise so words never depend on rounding.
export function donationAmount(value){
 const raw=String(value??'').trim();
 if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(raw))return null;
 const [whole,fraction='']=raw.split('.'),rupees=Number(whole),paise=Number(fraction.padEnd(2,'0'));
 if(rupees===0&&paise===0)return null;
 const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
 const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
 const small=n=>n<20?ones[n]:n<100?tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:''):ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+small(n%100):'');
 let rest=rupees;const parts=[];
 for(const [unit,label] of [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand']]){const count=Math.floor(rest/unit);if(count)parts.push(small(count)+' '+label);rest%=unit;}
 if(rest||!parts.length)parts.push(small(rest));
 return {number:'₹'+rupees.toLocaleString('en-IN')+(paise?'.'+String(paise).padStart(2,'0'):''),words:parts.join(' ')+(rupees===1?' Rupee':' Rupees')+(paise?' and '+small(paise)+(paise===1?' Paisa':' Paise'):'')+' Only'};
}
// All certificate geometry is in a 1122 × 793.333 A4 landscape coordinate system.
export const templates=['Aurora','Minimal','Corporate','Studio','Editorial'];
export const templateNotes={Aurora:'Luminous · contemporary',Minimal:'Quiet · understated',Corporate:'Sharp · professional',Studio:'Bold · playful',Editorial:'Warm · expressive'};
export const playfulTemplates=['Studio','Editorial'];
export const disclaimer='Digitally generated; not independently verified. Issuer is responsible for content. Sushant Synapse provides the tool only.';
export const accents={blue:'#234560',teal:'#216d68',gold:'#82652e',plum:'#68405e',digital:'#6335cf'};
// Decode the same-origin brand mark before any preview or export is rendered.

const paper='#fffefa';
export function render(canvas,data,images={},scale=1.25){
 canvas.width=Math.round(1122*scale);canvas.height=Math.round(1122*210/297*scale);
 const c=canvas.getContext('2d');c.scale(canvas.width/1122,canvas.height/(1122*210/297));
 const W=1122,H=1122*210/297,t=templates.includes(data.template)?data.template:'Minimal';
 const full=t==='Aurora';
 const playful=playfulTemplates.includes(t);
 const ink=full?'#ffffff':'#253441',muted=full?'#d8e4ff':'#63717a';
 let a=accents[data.accent]||accents.blue;
 if(data.accent==='digital'){a=c.createLinearGradient(80,0,1042,H);a.addColorStop(0,accents.digital);a.addColorStop(.5,'#245ad2');a.addColorStop(1,'#087e8b');}
 c.fillStyle=paper;c.fillRect(0,0,W,H);
 const rect=(x,y,w,h,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);};
 const line=(x,y,x2,y2,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 const poly=(points,color)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();};
 // Five original, print-safe art directions; decoration stays outside the text.
 if(t==='Studio'){
  c.fillStyle='#f5f2ff';c.fillRect(0,0,W,H);a='#5635b6';
  c.fillStyle='#c4f46c';c.fillRect(0,0,28,H);c.fillRect(W-28,0,28,H);
  c.fillStyle=a;c.fillRect(60,60,92,7);c.fillRect(W-152,H-60,92,7);
  const burst=(x,y,r)=>poly(Array.from({length:24},(_,i)=>{const angle=i*Math.PI/12,rad=i%2?r*.65:r;return[x+Math.cos(angle)*rad,y+Math.sin(angle)*rad];}),'#c4f46c');
  burst(W-68,190,45);burst(65,H-175,27);line(85,196,1037,196,'#d7cfea',1);
 }
 if(t==='Editorial'){
  c.fillStyle='#fff4ec';c.fillRect(0,0,W,H);a='#943f31';
  c.fillStyle='#e5b8a2';c.fillRect(0,0,W,14);c.fillRect(0,H-14,W,14);
  for(const [x,y,r]of [[-76,320,160],[W+76,500,160]])for(let i=0;i<5;i++){c.beginPath();c.arc(x,y,r+i*12,0,Math.PI*2);c.strokeStyle='#d5a590';c.lineWidth=1.2;c.stroke();}
  line(80,196,1042,196,'#dfc7bb',1);
  if(!images.logo){c.save();c.translate(561,95);for(let i=0;i<8;i++){c.rotate(Math.PI/4);line(0,11,0,25,a,2);}c.restore();}
 }
 if(full){
  const base=c.createLinearGradient(0,0,W,H);base.addColorStop(0,'#15152f');base.addColorStop(.6,'#142238');base.addColorStop(1,'#123e42');c.fillStyle=base;c.fillRect(0,0,W,H);
  for(const [x,y,r,color]of [[50,25,440,'#7161ce'],[W,H,390,'#32ae99']]){const glow=c.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,color);glow.addColorStop(1,'#14223800');c.fillStyle=glow;c.fillRect(0,0,W,H);}
  c.save();c.globalAlpha=.25;for(let i=0;i<3;i++){c.beginPath();c.ellipse(45,25,140+i*23,245+i*23,-.6,0,Math.PI*2);c.strokeStyle='#c6b8fa';c.lineWidth=1;c.stroke();}c.restore();
  line(80,196,1042,196,'#8bd5ce',.7);a='#b6f6df';
 }
 if(t==='Minimal'){
  c.fillStyle='#fbfcfa';c.fillRect(0,0,W,H);line(80,60,1042,60,'#d2ddd7',1);line(80,H-30,1042,H-30,'#d2ddd7',1);
  c.fillStyle=a;c.fillRect(80,60,80,4);c.fillRect(962,H-34,80,4);line(511,196,611,196,a,2);
 }
 if(t==='Corporate'){
  c.fillStyle='#f9fafc';c.fillRect(0,0,W,H);c.fillStyle=a;c.fillRect(0,0,24,H);c.fillRect(W-24,0,24,H);
  line(60,60,1062,60,'#c4ccd4',1);line(60,H-36,1062,H-36,'#c4ccd4',1);
  const gold='#aa8750';c.fillStyle=gold;c.fillRect(24,0,5,H);c.fillRect(W-29,0,5,H);line(430,196,692,196,gold,2);
 }
 // Layout wraps whole graphemes and reduces type only as needed, never clips text.
 function block(text,x,y,w,h,size=22,family='Arial',color=ink,weight='normal',align='center'){
  text=String(text||'').replace(/\s+/g,' ').trim();if(!text)return;
  let lines=[],s=size;
  const graphemes=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
  const split=word=>graphemes?[...graphemes.segment(word)].map(v=>v.segment):Array.from(word);
  for(;s>=8;s--){c.font=`${weight} ${s}px ${family}`;lines=[];
   for(const paragraph of text.split(/\n/)){let current='';for(const word of paragraph.split(/\s+/)){if(c.measureText((current?current+' ':'')+word).width<=w){current+=(current?' ':'')+word;continue;}if(current){lines.push(current);current='';}for(const char of split(word)){if(c.measureText(current+char).width>w&&current){lines.push(current);current='';}current+=char;}}if(current)lines.push(current);}
   if(lines.length*s*1.35<=h)break;
  }
  c.font=`${weight} ${s}px ${family}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
  lines.forEach((v,i)=>c.fillText(v,align==='left'?x:x+w/2,y+h/2+(i-(lines.length-1)/2)*s*1.35));
 }
 function image(img,x,y,w,h){if(!img)return;const ratio=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*ratio)/2,y+(h-img.height*ratio)/2,img.width*ratio,img.height*ratio);}
 const logoX=data.logoPosition==='left'?95:data.logoPosition==='right'?937:516;
 if(full&&images.logo){c.fillStyle=paper;c.fillRect(logoX-5,63,100,78);}
 image(images.logo,logoX,68,90,68);
 block(data.organization,180,144,762,40,24,'Arial',a,'600');
 const serif=t==='Editorial'?'Georgia':'Arial';
 const isDonation=data.type==='Donation Appreciation',donation=isDonation?donationAmount(data.donationAmount):null;
 const align=t==='Studio'?'left':'center';
 block(data.title||'CERTIFICATE OF APPRECIATION',135,isDonation?210:228,852,68,isDonation?33:35,serif,a,'600',align);
 block(isDonation?'PRESENTED WITH GRATITUDE TO':playful?'AND THE AWARD GOES TO':'PRESENTED TO',align==='left'?135:150,isDonation?279:311,align==='left'?852:822,26,12,'Arial',muted,'normal',align);
 block(data.recipient||'Recipient Name',135,isDonation?310:346,852,isDonation?80:91,t==='Studio'?62:55,serif,ink,t==='Editorial'?'normal':'600',align);
 line(align==='left'?135:355,isDonation?402:449,align==='left'?547:767,isDonation?402:449,a,.7);
 block(isDonation?'For your generosity in supporting':playful?'For the truly legendary achievement of':'In recognition and sincere appreciation of',align==='left'?135:150,isDonation?416:466,align==='left'?852:822,26,17,'Arial',muted,'normal',align);
 block(data.description||'your valuable contribution and support to our community',align==='left'?135:157,donation?445:isDonation?465:501,align==='left'?852:808,donation?45:81,23,'Arial',ink,'normal',align);
 if(donation){
  // A single, bounded amount panel shared by preview, PNG, PDF and print.
  c.save();c.globalAlpha=full?.12:.06;c.fillStyle=a;c.fillRect(157,500,808,91);c.restore();
  line(157,500,965,500,a,.8);line(157,591,965,591,a,.8);
  block('DONATION · INR',177,507,768,16,10,'Arial',muted,'600');
  block(donation.number,177,526,768,34,30,serif,a,'600');
  block(donation.words,177,563,768,24,14,'Arial',muted);
 }
 block(data.message,align==='left'?135:180,donation?599:590,align==='left'?852:762,donation?38:47,17,serif,muted,'normal',align);
 if(full&&images.signature){c.fillStyle=paper;c.fillRect(750,641,210,52);}
 image(images.signature,755,643,200,48);
 const date=data.date?new Date(data.date+'T12:00:00'):null;
 block(date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'',115,668,300,27,18,'Arial',ink);
 line(145,703,385,703,a,.7);line(735,703,975,703,a,.7);
 block(data.location||'DATE OF APPRECIATION',115,709,300,26,12,'Arial',muted);
 block(data.signatory,690,707,330,22,15,'Arial',ink,'600');
 block(data.designation,690,728,330,14,10,'Arial',muted);
 block(data.reference,421,724,280,18,10,'Arial',muted);
 c.save();
 const footerPaper={Aurora:'#142238',Minimal:'#fbfcfa',Corporate:'#f9fafc',Studio:'#f5f2ff',Editorial:'#fff4ec'}[t];
 drawWatermark(c,{x:270,y:744,width:582,height:34,ink:muted,background:footerPaper});
 c.fillStyle=footerPaper;c.fillRect(80,778,W-160,15);
 block(disclaimer,90,779,W-180,12,9.5,'Arial',muted);
 c.restore();
 return canvas;
}
