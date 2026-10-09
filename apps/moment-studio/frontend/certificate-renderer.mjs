import {brandLogo,drawWatermark} from './branding.mjs';
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
export const templates=['Classic','Corporate','Minimal','Community','Aurora','Confetti','Sweetheart','Comic'];
export const playfulTemplates=['Confetti','Sweetheart','Comic'];
export const disclaimer='Digitally generated; not independently verified. Issuer is responsible for content. Sushant Synapse provides the tool only.';
export const accents={blue:'#234560',teal:'#216d68',gold:'#82652e',plum:'#68405e',digital:'#6335cf'};
// Decode the same-origin brand mark before any preview or export is rendered.

const ink='#253441',muted='#63717a',paper='#fffefa';
export function render(canvas,data,images={},scale=1.25){
 canvas.width=Math.round(1122*scale);canvas.height=Math.round(1122*210/297*scale);
 const c=canvas.getContext('2d');c.scale(canvas.width/1122,canvas.height/(1122*210/297));
 const W=1122,H=1122*210/297,t=data.template||'Classic';
 const full=t==='Aurora';
 const playful=playfulTemplates.includes(t);
 const ink=full?'#ffffff':'#253441',muted=full?'#d8e4ff':'#63717a';
 let a=accents[data.accent]||accents.blue;
 if(data.accent==='digital'){a=c.createLinearGradient(80,0,1042,H);a.addColorStop(0,accents.digital);a.addColorStop(.5,'#245ad2');a.addColorStop(1,'#087e8b');}
 c.fillStyle=paper;c.fillRect(0,0,W,H);
 const rect=(x,y,w,h,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);};
 const line=(x,y,x2,y2,color,width=1)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 const poly=(points,color)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();};
 // Print palettes belong to the artwork and are independent of the app theme.
 const palettes={Confetti:['#fff9e9','#7954bb','#e9ad3e','#51a79a','#e98383'],Sweetheart:['#fff5f5','#a54468','#e9a8b6','#f4d8c5'],Comic:['#fffbea','#27374e','#f9cf48','#eb7662','#75bfc4']};
 if(playful){
  const colors=palettes[t];c.fillStyle=colors[0];c.fillRect(0,0,W,H);a=colors[1];
  if(t==='Confetti'){
   for(let i=0;i<28;i++){const x=22+(i*173)%1080,y=20+(i*97)%745;if(x>110&&x<1012&&y>135&&y<735)continue;c.save();c.translate(x,y);c.rotate(i*.83);c.fillStyle=colors[2+i%3];if(i%2)c.fillRect(-4,-8,8,16);else{c.beginPath();c.arc(0,0,5,0,Math.PI*2);c.fill();}c.restore();}
   rect(113,211,896,431,'#e8ddbf',1);
   // A little party crown above the heading.
   if(!images.logo){poly([[519,99],[526,65],[547,84],[561,56],[577,84],[599,65],[603,99]],colors[2]);line(527,106,595,106,a,4);}
  }
  if(t==='Sweetheart'){
   rect(31,31,W-62,H-62,colors[2],2);rect(41,41,W-82,H-82,colors[3]);
   const heart=(x,y,size,color)=>{c.save();c.translate(x,y);c.scale(size,size);c.beginPath();c.moveTo(0,.7);c.bezierCurveTo(-1.6,-.3,-.7,-1.4,0,-.65);c.bezierCurveTo(.7,-1.4,1.6,-.3,0,.7);c.fillStyle=color;c.fill();c.restore();};
   for(const [x,y,s] of [[88,97,28],[1034,105,21],[76,590,17],[1043,582,26],[104,678,12],[1016,666,12]])heart(x,y,s,colors[2]);
   if(!images.logo)heart(561,93,26,a);line(461,198,536,198,colors[2],2);line(586,198,661,198,colors[2],2);
  }
  if(t==='Comic'){
   c.save();c.fillStyle=colors[2];c.fillRect(0,0,W,36);c.fillRect(0,H-36,W,36);
   for(let x=12;x<W;x+=18)for(const y of [12,30,H-24,H-6]){c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fillStyle=a;c.fill();}
   poly([[30,163],[91,174],[72,221],[105,207],[48,286],[59,230],[30,243]],colors[3]);
   poly([[W-30,480],[W-91,491],[W-72,538],[W-105,524],[W-48,603],[W-59,547],[W-30,560]],colors[4]);
   const bannerY=data.type==='Donation Appreciation'?201:215,bannerH=data.type==='Donation Appreciation'?76:89;
   c.fillStyle=a;c.fillRect(133,bannerY+10,866,bannerH);c.fillStyle=colors[2];c.fillRect(123,bannerY,866,bannerH);rect(123,bannerY,866,bannerH,a,3);
   if(!images.logo)poly([[522,102],[531,61],[549,80],[563,52],[580,81],[602,65],[596,104]],colors[3]);c.restore();
  }
 }
 if(full){
  const background=c.createLinearGradient(0,0,W,H);
  background.addColorStop(0,'#25134f');background.addColorStop(.48,'#102853');background.addColorStop(1,'#064852');
  c.fillStyle=background;c.fillRect(0,0,W,H);
  // Luminous ribbons and circuit details stay at the edges of the reading area.
  const glow=c.createLinearGradient(0,0,W,250);
  glow.addColorStop(0,'#ae67ff');glow.addColorStop(.5,'#527dff');glow.addColorStop(1,'#38e0db');
  c.save();c.globalAlpha=.32;
  poly([[0,0],[465,0],[215,107],[0,228]],glow);
  poly([[W,H],[W-465,H],[W-215,H-107],[W,H-228]],glow);
  c.globalAlpha=.16;
  poly([[0,0],[305,0],[0,310]],glow);
  poly([[W,H],[W-305,H],[W,H-310]],glow);
  c.restore();
  rect(28,28,W-56,H-56,'#79b7dc',.8);
  for(const flip of [false,true]){c.save();if(flip){c.translate(W,H);c.rotate(Math.PI);}
   for(let i=0;i<4;i++){const x=48+i*18,y=160-i*22;line(x,42,x,y,'#77cef0',.8);line(x,y,x+36,y+36,'#77cef0',.8);c.beginPath();c.arc(x+36,y+36,2.5,0,Math.PI*2);c.fillStyle='#99f5ee';c.fill();}
   c.restore();}
  line(430,199,692,199,glow,3);
  a='#a9f4ed';
 }
 if(t==='Classic'){rect(26,26,W-52,H-52,a,3);rect(35,35,W-70,H-70,a,.7);for(const x of [47,W-47])for(const y of [47,H-47]){c.save();c.translate(x,y);c.rotate(Math.PI/4);rect(-5,-5,10,10,a);c.restore();}line(430,192,692,192,a);}
 if(t==='Modern'){poly([[0,0],[200,0],[0,75]],a);poly([[0,0],[70,0],[0,160]],'#cadbdf');poly([[W,H],[W-140,H],[W,H-100]],a);line(80,207,1042,207,a,2);}
 if(t==='Minimal'){
 const sphere=(x,y,r)=>{const g=c.createRadialGradient(x-r*.4,y-r*.4,2,x,y,r);g.addColorStop(0,paper);g.addColorStop(.5,'#d5dfda');g.addColorStop(1,'#708b7d');c.save();c.shadowColor='#526e6022';c.shadowBlur=20;c.shadowOffsetY=12;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();};sphere(-85,110,150);sphere(W+85,H-110,150);
line(80,60,1042,60,a,2);line(80,H-30,1042,H-30,a);line(511,195,611,195,a,3);}
 if(t==='Elegant'){rect(24,24,W-48,H-48,a);rect(42,42,W-84,H-84,a,2);for(const x of [42,W-42])for(const y of [42,H-42]){c.beginPath();c.arc(x,y,17,0,Math.PI*2);c.fillStyle=paper;c.fill();c.strokeStyle=a;c.stroke();}line(410,199,530,199,a);line(592,199,712,199,a);poly([[561,192],[568,199],[561,206],[554,199]],a);}
 if(t==='Community'){for(let i=0;i<8;i++){c.save();c.translate(35+i*9,95+i*62);c.rotate(-.4);c.beginPath();c.ellipse(0,0,13,28,0,0,Math.PI*2);c.fillStyle=i%2?a:'#d9e5dd';c.fill();c.restore();c.save();c.translate(W-35-i*9,H-95-i*62);c.rotate(-.4);c.beginPath();c.ellipse(0,0,13,28,0,0,Math.PI*2);c.fillStyle=i%2?a:'#d9e5dd';c.fill();c.restore();}line(160,62,962,62,a);line(160,H-30,962,H-30,a);}
 if(t==='Corporate'){
  const gold='#a58a53',wash=c.createLinearGradient(0,0,W,H);
  wash.addColorStop(0,'#edf1f5');wash.addColorStop(.4,paper);wash.addColorStop(.7,paper);wash.addColorStop(1,'#f2ede3');
  c.fillStyle=wash;c.fillRect(0,0,W,H);
  // Architectural corner panels and fine engraving sit outside the text area.
  c.save();c.globalAlpha=.07;
  poly([[0,0],[300,0],[0,260]],a);poly([[W,H],[W-300,H],[W,H-260]],a);
  c.globalAlpha=.12;
  for(let i=0;i<9;i++){line(0,116+i*14,116+i*14,0,a,.6);line(W,H-116-i*14,W-116-i*14,H,a,.6);}
  c.restore();
  rect(19,19,W-38,H-38,a,7);rect(31,31,W-62,H-62,gold,1.2);rect(41,41,W-82,H-82,a,.6);
  for(const [x,y,sx,sy] of [[49,49,1,1],[W-49,49,-1,1],[49,H-49,1,-1],[W-49,H-49,-1,-1]]){
   line(x,y,x+72*sx,y,gold,2);line(x,y,x,y+72*sy,gold,2);
   poly([[x+7*sx,y+17*sy],[x+12*sx,y+12*sy],[x+17*sx,y+17*sy],[x+12*sx,y+22*sy]],gold);
  }
  line(403,198,541,198,gold,.8);line(581,198,719,198,gold,.8);
  poly([[561,192],[567,198],[561,204],[555,198]],gold);
 }
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
 const logoX=data.logoPosition==='left'?95:data.logoPosition==='right'?937:516;
 if(full&&images.logo){c.fillStyle=paper;c.fillRect(logoX-5,63,100,78);}
 image(images.logo,logoX,68,90,68);
 block(data.organization,180,144,762,40,24,'Arial',a,'600');
 const serif=['Classic','Corporate','Elegant','Community'].includes(t)?'Georgia':'Arial';
 const isDonation=data.type==='Donation Appreciation',donation=isDonation?donationAmount(data.donationAmount):null;
 block(data.title||'CERTIFICATE OF APPRECIATION',135,isDonation?210:228,852,68,isDonation?33:35,serif,a,playful?'bold':'normal');
 block(isDonation?'PRESENTED WITH GRATITUDE TO':playful?'AND THE AWARD GOES TO':'PRESENTED TO',150,isDonation?279:311,822,26,12,'Arial',muted);
 block(data.recipient||'Recipient Name',135,isDonation?310:346,852,isDonation?80:91,55,serif,ink);
 line(355,isDonation?402:449,767,isDonation?402:449,a,.7);
 block(isDonation?'For your generosity in supporting':playful?'For the truly legendary achievement of':'In recognition and sincere appreciation of',150,isDonation?416:466,822,26,17,'Arial',muted);
 block(data.description||'your valuable contribution and support to our community',157,donation?445:isDonation?465:501,808,donation?45:81,23,'Arial',ink);
 if(donation){
  // A single, bounded amount panel shared by preview, PNG, PDF and print.
  c.save();c.globalAlpha=full?.12:.06;c.fillStyle=a;c.fillRect(157,500,808,91);c.restore();
  line(157,500,965,500,a,.8);line(157,591,965,591,a,.8);
  block('DONATION · INR',177,507,768,16,10,'Arial',muted,'600');
  block(donation.number,177,526,768,34,30,serif,a,'600');
  block(donation.words,177,563,768,24,14,'Arial',muted);
 }
 block(data.message,180,donation?599:590,762,donation?38:47,17,serif,muted);
 if(full&&images.signature){c.fillStyle=paper;c.fillRect(750,641,210,52);}
 image(images.signature,755,643,200,48);
 const date=data.date?new Date(data.date+'T12:00:00'):null;
 block(date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'',115,668,300,27,18,'Arial',ink);
 line(145,703,385,703,a,.7);line(735,703,975,703,a,.7);
 block(data.location||'DATE OF APPRECIATION',115,709,300,26,12,'Arial',muted);
 block(data.signatory,690,707,330,22,15,'Arial',ink,'600');
 block(data.designation,690,733,330,20,12,'Arial',muted);
 block(data.reference,421,724,280,18,10,'Arial',muted);
 c.save();
 drawWatermark(c,{x:270,y:744,width:582,height:34,ink:muted,background:full?'#102853':paper});
 c.fillStyle=full?'#102853':paper;c.fillRect(80,778,W-160,15);
 block(disclaimer,90,779,W-180,12,9.5,'Arial',muted);
 c.restore();
 return canvas;
}
