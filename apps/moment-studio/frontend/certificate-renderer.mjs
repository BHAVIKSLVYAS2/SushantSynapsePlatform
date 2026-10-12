import {drawWatermark} from './branding.mjs';
// Decimal rupees are parsed into integer paise, preserving exact Indian wording.
export function donationAmount(value){
 const raw=String(value??'').trim();if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(raw))return null;
 const [whole,fraction='']=raw.split('.'),rupees=Number(whole),paise=Number(fraction.padEnd(2,'0'));if(rupees===0&&paise===0)return null;
 const ones=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
 const small=n=>n<20?ones[n]:n<100?tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:''):ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+small(n%100):'');
 let rest=rupees;const parts=[];for(const [unit,label]of [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand']]){const count=Math.floor(rest/unit);if(count)parts.push(small(count)+' '+label);rest%=unit;}if(rest||!parts.length)parts.push(small(rest));
 return {number:'₹'+rupees.toLocaleString('en-IN')+(paise?'.'+String(paise).padStart(2,'0'):''),words:parts.join(' ')+(rupees===1?' Rupee':' Rupees')+(paise?' and '+small(paise)+(paise===1?' Paisa':' Paise'):'')+' Only'};
}
export const templates=['Laurel','Nocturne','Summit','Jubilee'];
export const templateNotes={Laurel:'Ceremonial · engraved gold',Nocturne:'Gala · midnight & gold',Summit:'Modern · architectural',Jubilee:'Celebration · bold graphic'};
export const playfulTemplates=['Jubilee'];
export const accentTemplates=['Summit'];
export const disclaimer='Digitally generated; not independently verified. Issuer is responsible for content. Sushant Synapse provides the tool only.';
export const accents={blue:'#234560',teal:'#216d68',gold:'#82652e',plum:'#68405e',digital:'#6335cf'};
const legacyTemplates={Minimal:'Laurel',Aurora:'Nocturne',Corporate:'Summit',Studio:'Jubilee',Editorial:'Laurel'};
const styles={
 Laurel:{paper:'#fffaf0',ink:'#342d25',muted:'#776951',accent:'#9b7739',family:'Georgia',align:'center',x:150,w:822,title:[204,72,37],name:[327,95,62],presented:300,rule:435,intro:454,description:[489,82],message:[587,45],donation:{title:[192,66,34],name:[292,85,57],presented:267,rule:388,intro:405,description:[438,56]}},
 Nocturne:{paper:'#111d2c',ink:'#fff5df',muted:'#cec4b4',accent:'#e3bf7d',family:'Georgia',align:'center',x:130,w:862,bodyX:125,bodyW:660,bodyAlign:'left',title:[178,69,31],name:[307,108,80],presented:275,rule:441,intro:462,description:[495,81],message:[590,42],donation:{title:[181,66,31],name:[290,89,66],presented:260,rule:393,intro:409,description:[442,52]}},
 Summit:{paper:'#fcfcf8',ink:'#192d3c',muted:'#60717c',accent:'#234560',family:'Arial',align:'left',x:326,w:690,title:[209,81,43],name:[347,88,62],presented:311,rule:450,intro:469,description:[501,79],message:[592,40],donation:{title:[194,76,38],name:[304,85,56],presented:278,rule:403,intro:419,description:[451,43]}},
 Jubilee:{paper:'#fff8ee',ink:'#382558',muted:'#796678',accent:'#68409a',family:'Arial',align:'left',x:110,w:760,title:[185,100,45],name:[337,100,73],presented:305,rule:454,intro:473,description:[506,76],message:[596,37],donation:{title:[178,83,39],name:[303,88,62],presented:276,rule:405,intro:423,description:[453,41]}}
};

// Four authored compositions share only safe fitting, issuer data and export geometry.
export function render(canvas,data,images={},scale=1.25){
 const W=1122,H=W*210/297;
 canvas.width=Math.round(W*scale);canvas.height=Math.round(H*scale);
 const c=canvas.getContext('2d');c.scale(canvas.width/W,canvas.height/H);
 const template=templates.includes(data.template)?data.template:legacyTemplates[data.template]||'Laurel',s=styles[template];
 const ink=s.ink,muted=s.muted,paper=s.paper;
 let accent=template==='Summit'?(accents[data.accent]||s.accent):s.accent;
 const gold=c.createLinearGradient(40,0,W-40,H);gold.addColorStop(0,'#c39a56');gold.addColorStop(.35,'#efd9a2');gold.addColorStop(.65,'#a77e39');gold.addColorStop(1,'#dfbd78');
 c.fillStyle=paper;c.fillRect(0,0,W,H);
 function line(x,y,x2,y2,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 function rect(x,y,w,h,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);}
 function polygon(points,color){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
 function star(x,y,r,color,points=5){polygon(Array.from({length:points*2},(_,i)=>{const a=i*Math.PI/points-Math.PI/2,d=i%2?r*.43:r;return [x+Math.cos(a)*d,y+Math.sin(a)*d];}),color);}
 function circle(x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
 function laurel(x,y,r,color){
  for(const side of [-1,1]){
   c.beginPath();c.moveTo(x,y+r*.8);c.bezierCurveTo(x+side*r*.85,y+r*.7,x+side*r*1.1,y-r*.15,x+side*r*.45,y-r*.85);c.strokeStyle=color;c.lineWidth=1.4;c.stroke();
   for(let i=0;i<7;i++){const a=.35+i*.26,lx=x+side*Math.sin(a)*r*.88,ly=y+Math.cos(a)*r*.83;c.save();c.translate(lx,ly);c.rotate(side*(a+.35));c.beginPath();c.ellipse(0,0,r*.075,r*.20,0,0,Math.PI*2);c.fillStyle=color;c.fill();c.restore();}
  }
 }
 function trophy(x,y,color){
  c.save();c.translate(x,y);c.fillStyle=color;c.beginPath();c.moveTo(-25,-31);c.lineTo(25,-31);c.lineTo(19,-4);c.quadraticCurveTo(0,23,-19,-4);c.closePath();c.fill();
  c.strokeStyle=color;c.lineWidth=4;for(const side of [-1,1]){c.beginPath();c.moveTo(side*24,-24);c.bezierCurveTo(side*46,-28,side*46,2,side*19,5);c.stroke();}
  c.fillRect(-4,13,8,18);c.fillRect(-21,31,42,6);c.restore();
 }
 function image(img,x,y,w,h,plate=false){if(!img)return;if(plate){c.fillStyle='#fffaf0';c.fillRect(x-6,y-4,w+12,h+8);}const ratio=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*ratio)/2,y+(h-img.height*ratio)/2,img.width*ratio,img.height*ratio);}
 function block(text,x,y,w,h,size=22,family='Arial',color=ink,weight='normal',align='center'){
  text=String(text||'').replace(/\s+/g,' ').trim();if(!text)return;
  const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null,split=word=>segmenter?[...segmenter.segment(word)].map(v=>v.segment):Array.from(word);
  let lines=[],fontSize=size;
  for(;fontSize>=5;fontSize--){
   c.font=`${weight} ${fontSize}px ${family}`;lines=[];let current='';
   for(const word of text.split(/\s+/)){
    if(c.measureText((current?current+' ':'')+word).width<=w){current+=(current?' ':'')+word;continue;}
    if(current){lines.push(current);current='';}
    for(const char of split(word)){if(current&&c.measureText(current+char).width>w){lines.push(current);current='';}current+=char;}
   }
   if(current)lines.push(current);if(lines.length*fontSize*1.3<=h)break;
  }
  c.font=`${weight} ${fontSize}px ${family}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
  lines.forEach((text,i)=>c.fillText(text,align==='left'?x:x+w/2,y+h/2+(i-(lines.length-1)/2)*fontSize*1.3));
 }

 if(template==='Laurel'){
  rect(37,35,W-74,708,'#9b7739',1.8);rect(45,43,W-90,698,'#cfb886',.6);rect(54,52,W-108,687,'#a68a57',.6);
  for(const [x,y,flipX,flipY]of [[68,66,1,1],[W-68,66,-1,1],[68,704,1,-1],[W-68,704,-1,-1]]){
   c.save();c.translate(x,y);c.scale(flipX,flipY);line(0,0,42,0,accent,.9);line(0,0,0,42,accent,.9);
   c.beginPath();c.moveTo(8,32);c.bezierCurveTo(34,32,34,8,9,8);c.bezierCurveTo(12,21,22,21,22,12);c.strokeStyle=accent;c.lineWidth=.8;c.stroke();c.restore();
  }
  if(!images.logo||data.logoPosition!=='center'){laurel(561,106,37,accent);star(561,104,14,accent);}
  line(300,186,462,186,'#d7c49e',.8);line(660,186,822,186,'#d7c49e',.8);star(561,185,4,accent,4);
  laurel(561,674,37,accent);circle(561,674,22,'#e6d3a9');circle(561,674,19,paper);star(561,674,11,accent);
 }
 if(template==='Nocturne'){
  rect(35,35,W-70,709,gold,1.5);rect(44,44,W-88,697,'#7a673f',.65);
  for(const side of [-1,1]){
   c.save();c.translate(side===1?58:W-58,58);c.scale(side,1);
   for(let i=0;i<4;i++){const d=i*9;c.beginPath();c.moveTo(0,88-d);c.lineTo(0,d);c.lineTo(88-d,d);c.strokeStyle=gold;c.lineWidth=.8;c.stroke();}
   c.restore();
  }
  c.save();c.globalAlpha=.25;for(let i=0;i<17;i++){const a=(i-8)*.08;line(561+Math.sin(a)*50,20,561+Math.sin(a)*190,145-Math.abs(i-8)*5,'#e3bf7d',.6);}c.restore();
  if(!images.logo||data.logoPosition!=='center'){polygon([[561,75],[584,102],[561,129],[538,102]],gold);polygon([[561,84],[575,102],[561,120],[547,102]],paper);star(561,102,8,s.accent);}
  line(198,181,449,181,'#776643',.6);line(673,181,924,181,'#776643',.6);
  for(const [x,y,flip]of [[58,713,1],[W-58,713,-1]]){c.save();c.translate(x,y);c.scale(flip,1);line(0,0,45,0,gold,.8);line(0,0,0,-72,gold,.8);line(9,-9,35,-9,gold,.8);c.restore();}
  line(836,463,836,619,'#776643',.7);
  polygon([[913,559],[937,559],[935,618],[923,606],[910,618]],'#a78142');polygon([[940,559],[962,559],[968,618],[952,606],[940,618]],'#d9b97b');
  circle(938,526,59,gold);circle(938,526,51,paper);circle(938,526,47,gold);circle(938,526,43,paper);star(938,526,22,s.accent);
  for(let i=0;i<28;i++){const a=i*Math.PI/14;line(938+Math.cos(a)*63,526+Math.sin(a)*63,938+Math.cos(a)*68,526+Math.sin(a)*68,'#b09055',.8);}
 }
 if(template==='Summit'){
  polygon([[0,0],[256,0],[285,735],[0,735]],'#172f40');polygon([[256,0],[264,0],[293,735],[285,735]],gold);
  c.save();c.globalAlpha=.17;for(let i=0;i<5;i++){rect(41+i*15,224+i*15,183-i*22,361-i*45,'#e8cf99',.8);}c.restore();
  polygon([[73,580],[113,523],[148,551],[189,450],[229,580]],'#26495f');
  for(const [x,h]of [[83,89],[125,141],[167,193]]){c.fillStyle=gold;c.fillRect(x,620-h,22,h);}
  star(141,338,37,gold);laurel(141,340,60,'#d4b174');
  line(326,184,1016,184,'#c9d1d2',.8);c.fillStyle=accent;c.fillRect(326,184,104,4);
  polygon([[W-86,0],[W,0],[W,86]],'#e9edf0');line(1016,641,1016,736,'#d2d8db',.7);
 }
 if(template==='Jubilee'){
  c.fillStyle='#382558';c.fillRect(0,0,W,18);c.fillRect(0,735,W,9);
  circle(1086,333,211,'#eed9cf');circle(1086,333,161,'#f6e9d8');
  c.fillStyle='#bd654b';c.fillRect(1019,52,27,637);c.fillStyle='#d6a548';c.fillRect(1056,52,8,637);
  circle(953,283,61,'#382558');circle(953,283,53,'#68409a');trophy(953,281,'#efd192');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;line(953+Math.cos(a)*70,283+Math.sin(a)*70,953+Math.cos(a)*82,283+Math.sin(a)*82,'#b58340',1.2);}
  polygon([[35,184],[55,174],[55,239],[35,249]],'#bd654b');polygon([[35,258],[55,248],[55,313],[35,323]],'#68409a');
  for(const [x,y,r,color]of [[982,540,9,'#bd654b'],[968,590,6,'#68409a'],[96,668,5,'#bd654b'],[997,635,5,'#d6a548']])star(x,y,r,color,4);
  line(110,171,335,171,'#cebaab',1);
 }

 const logoX=data.logoPosition==='left'?95:data.logoPosition==='right'?937:516;
 image(images.logo,logoX,68,90,68,template==='Nocturne'||template==='Summit'&&data.logoPosition==='left');
 block(data.organization,s.x,142,s.w,39,23,'Arial',accent,'600',s.align);
 const isDonation=data.type==='Donation Appreciation',donation=isDonation?donationAmount(data.donationAmount):null,layout=isDonation?s.donation:s;
 const title=data.title||'Certificate of Appreciation';
 block(title,s.x,layout.title[0],s.w,layout.title[1],layout.title[2],s.family,accent,template==='Laurel'?'normal':'600',s.align);
 block(isDonation?'PRESENTED WITH GRATITUDE TO':'PROUDLY PRESENTED TO',s.x,layout.presented,s.w,24,11,'Arial',muted,'600',s.align);
 block(data.recipient||'Recipient Name',s.x,layout.name[0],s.w,layout.name[1],layout.name[2],s.family,ink,template==='Laurel'||template==='Nocturne'?'normal':'700',s.align);
 const ruleX=s.align==='left'?s.x:W/2-130;line(ruleX,layout.rule,ruleX+(s.align==='left'?230:260),layout.rule,accent,.8);
 const bodyX=s.bodyX??s.x,bodyW=s.bodyW??s.w,bodyAlign=s.bodyAlign??s.align;
 block(isDonation?'For your generosity in supporting':'In recognition and sincere appreciation of',bodyX,layout.intro,bodyW,25,16,'Arial',muted,'normal',bodyAlign);
 block(data.description||'your valuable contribution and support to our community',bodyX,layout.description[0],bodyW,layout.description[1],22,'Arial',ink,'normal',bodyAlign);
 if(donation){
  const x=bodyX,w=bodyW,y=500;
  c.save();c.globalAlpha=template==='Nocturne'?.09:.07;c.fillStyle=accent;c.fillRect(x,y,w,91);c.restore();line(x,y,x+w,y,accent,.8);line(x,y+91,x+w,y+91,accent,.8);
  block('DONATION · INR',x+16,y+7,w-32,16,10,'Arial',muted,'600',bodyAlign);
  block(donation.number,x+16,y+26,w-32,34,29,s.family,accent,'600',bodyAlign);
  block(donation.words,x+16,y+63,w-32,24,14,'Arial',muted,'normal',bodyAlign);
 }
 const message=isDonation?[599,38]:s.message;
 block(data.message,bodyX,message[0],bodyW,message[1],17,template==='Laurel'||template==='Nocturne'?'Georgia':'Arial',muted,'normal',bodyAlign);
 image(images.signature,755,643,200,48,template==='Nocturne');
 const date=data.date?new Date(data.date+'T12:00:00'):null,dateText=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'';
 const dateX=template==='Summit'?315:115,dateW=template==='Summit'?290:300;
 block(dateText,dateX,662,dateW,27,17,'Arial',ink);line(dateX+25,697,dateX+dateW-25,697,accent,.7);line(735,697,975,697,accent,.7);
 block(data.location||'DATE OF APPRECIATION',dateX,701,dateW,26,11,'Arial',muted);
 block(data.signatory,690,699,330,22,15,'Arial',ink,'600');block(data.designation,690,720,330,14,10,'Arial',muted);
 block(data.reference,421,718,280,18,10,'Arial',muted);
 drawWatermark(c,{x:270,y:744,width:582,height:34,ink:muted,background:paper});
 c.fillStyle=paper;c.fillRect(80,778,W-160,15);block(disclaimer,90,779,W-180,12,9.5,'Arial',muted);
 return canvas;
}
