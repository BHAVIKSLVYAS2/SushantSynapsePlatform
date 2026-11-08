import {drawWatermark} from './branding.mjs';
﻿export const occasions={
 condolence:{name:'Condolence / sympathy',en:{title:'With heartfelt sympathy',message:'There are no perfect words for a loss like this. Thinking of you and your family, and wishing you care and support in the days ahead.'},hi:{title:'हार्दिक संवेदनाएँ',message:'इस कठिन समय में हमारी संवेदनाएँ आपके और आपके परिवार के साथ हैं। आने वाले दिनों में आपको अपनों का सहारा और स्नेह मिले।'}},
 remembrance:{name:'Remembrance / tribute',en:{title:'Forever in our memories',message:'Remembering a life that touched ours with kindness. The stories we shared and the love we carry will stay with us.'},hi:{title:'स्मृतियों में हमेशा',message:'स्नेह और दया से हमारे जीवन को छूने वाले अपने प्रियजन को याद करते हुए। उनकी यादें और प्यार हमेशा हमारे साथ रहेंगे।'}},
 congratulations:{name:'Congratulations',en:{title:'A moment worth celebrating',message:'Your hard work, patience and courage brought you here. Congratulations on this wonderful milestone!'},hi:{title:'आपकी सफलता पर बधाई!',message:'आपकी मेहनत, धैर्य और हिम्मत रंग लाई। इस खास उपलब्धि पर हार्दिक बधाई!'}},
 birthday:{name:'Birthday',en:{title:'Happy Birthday!',message:'Another year of stories, laughter and wonderful memories. Wishing you a day as special as you are.'},hi:{title:'जन्मदिन मुबारक!',message:'खुशियों, हँसी और खूबसूरत यादों से भरा एक नया साल। आपका दिन आपके जैसा ही खास हो।'}},
 invitation:{name:'Invitation',en:{title:"You're invited!",message:'Good company, happy moments and a reason to celebrate. Come join us!'},hi:{title:'आप सादर आमंत्रित हैं!',message:'अपनों का साथ और खुशियों के कुछ पल। आइए, मिलकर इस खास मौके को यादगार बनाएँ।'}},
 anniversary:{name:'Anniversary',en:{title:'To many more together.',message:'Celebrating your shared stories, little adventures and a love that keeps growing.'},hi:{title:'सालगिरह की शुभकामनाएँ!',message:'साथ बिताए खूबसूरत पलों और बढ़ते प्यार का जश्न। आपका साथ यूँ ही बना रहे।'}},
 festival:{name:'Festival greeting',en:{title:'A little light. A lot of joy.',message:'Wishing you and your loved ones a beautiful celebration filled with warmth, kindness and new beginnings.'},hi:{title:'त्योहार की शुभकामनाएँ!',message:'आपको और आपके परिवार को खुशियों, स्नेह और नई उम्मीदों से भरे त्योहार की हार्दिक शुभकामनाएँ।'}},
 thanks:{name:'Thank you',en:{title:'You made a difference.',message:'For your kindness, your time and all the little things you do. Thank you, from the heart.'},hi:{title:'दिल से धन्यवाद!',message:'आपके समय, सहयोग और छोटी-छोटी कोशिशों के लिए। आपने इस पल को खास बना दिया।'}},
 fun:{name:'Fun poster',en:{title:'Officially the main character.',message:'Big energy. Excellent snack choices. Questionable dance moves. A true original.'},hi:{title:'आज के सुपरस्टार!',message:'शानदार अंदाज़, बेहतरीन नाश्ते की पसंद और मजेदार डांस। आप जैसा कोई नहीं।'}}
};
export const designs={quiet:'Quiet remembrance',confetti:'Confetti',elegant:'Elegant',bloom:'Bloom',bold:'Bold'};
export const palettes={slate:{name:'Slate & ivory',bg:'#f5f3ee',ink:'#323b40',accent:'#63716e',soft:'#d9dfd8'},peach:{name:'Peach',bg:'#fff0e5',ink:'#553029',accent:'#bd513b',soft:'#f7c6b3'},lavender:{name:'Lavender',bg:'#f0eafb',ink:'#3c2e60',accent:'#7056aa',soft:'#d3c2ed'},ocean:{name:'Ocean',bg:'#e8f4f7',ink:'#193d4c',accent:'#28798f',soft:'#b4dce5'},forest:{name:'Forest',bg:'#ecf3e9',ink:'#29452e',accent:'#547d42',soft:'#c8deba'},sunshine:{name:'Sunshine',bg:'#fff7d9',ink:'#59451c',accent:'#a36b12',soft:'#f1d58a'},rose:{name:'Rose',bg:'#fcebf0',ink:'#602a42',accent:'#a74570',soft:'#eabbd0'}};
export const sizes={square:{width:1080,height:1080,name:'Square post'},story:{width:1080,height:1920,name:'Vertical status'}};
export function validate(raw){const data={};for(const [key,max]of Object.entries({title:100,name:80,message:600,details:200,from:80,event:80,when:80,place:100})){data[key]=String(raw[key]??'').trim();if([...data[key]].length>max)throw Error(`${key} is too long (maximum ${max} characters).`);}if(!data.title)throw Error('Add a headline before downloading.');for(const [key,values]of Object.entries({occasion:occasions,design:designs,palette:palettes,format:sizes})){if(!Object.hasOwn(values,raw[key]))throw Error('Choose a valid '+key+'.');data[key]=raw[key];}if(!['en','hi'].includes(raw.language))throw Error('Choose English or Hindi.');data.language=raw.language;return data;}
export function filename(data){const safe=data.title.normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,64)||'moment';return `${safe}-${data.format}.png`;}
const font='"Segoe UI", "Nirmala UI", Arial, sans-serif';
function lines(ctx,text,width){const output=[];const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width<=width){line=candidate;continue;}if(line){output.push(line);line='';}if(ctx.measureText(word).width<=width){line=word;continue;}for(const {segment}of segmenter.segment(word)){if(line&&ctx.measureText(line+segment).width>width){output.push(line);line='';}line+=segment;}}output.push(line);}return output;}
function textBlock(ctx,text,{x,y,width,height,max=44,min=24,bold=false,color,align='center',family}){if(!text)return true;let wrapped,size;for(size=max;size>=min;size--){ctx.font=`${bold?600:400} ${size}px ${family||(bold?'Georgia, "Nirmala UI", serif':font)}`;wrapped=lines(ctx,text,width);if(wrapped.length*size*1.45<=height)break;}if(size<min)return false;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';const step=size*1.45,top=y+(height-wrapped.length*step)/2;wrapped.forEach((line,i)=>ctx.fillText(line,align==='left'?x:x+width/2,top+step*(i+.5)));return true;}
// Occasion-specific compositions share the same measured text and export path.
function botanical(ctx,x,y,scale,p,mirror=false){
 ctx.save();ctx.translate(x,y);ctx.scale(mirror?-scale:scale,scale);ctx.strokeStyle=p.accent;ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,110);ctx.bezierCurveTo(25,55,10,-45,88,-120);ctx.stroke();
 for(let i=0;i<8;i++){const px=12+i*7,py=80-i*24;for(const side of [-1,1]){ctx.save();ctx.translate(px,py);ctx.rotate(side*.72);ctx.globalAlpha=i%2?.65:.9;ctx.fillStyle=i%2?p.soft:p.accent;ctx.beginPath();ctx.ellipse(side*14,-13,10,25,side*.18,0,Math.PI*2);ctx.fill();ctx.restore();}}
 ctx.restore();
}
function portrait(ctx,image,x,y,width,height,radius,p){
 ctx.save();ctx.fillStyle=p.bg;ctx.strokeStyle=p.accent;ctx.lineWidth=2;
 ctx.beginPath();ctx.roundRect(x-9,y-9,width+18,height+18,radius+9);ctx.stroke();
 ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.clip();
 const scale=Math.max(width/image.width,height/image.height);ctx.drawImage(image,x+(width-image.width*scale)/2,y+(height-image.height*scale)/2,image.width*scale,image.height*scale);ctx.restore();
}
function occasionCard(canvas,d,image){
 const {width:w,height:h}=sizes[d.format],p=palettes[d.palette],story=d.format==='story',memorial=d.occasion!=='birthday';
 canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');let fits=true;
 const sans='"Segoe UI", "Nirmala UI", Arial, sans-serif',serif='Georgia, "Nirmala UI", serif';
 const block=(value,x,y,width,height,max,min=24,bold=false,align='center',family=serif,color=p.ink)=>{fits=textBlock(ctx,value,{x,y,width,height,max,min,bold,align,family,color})&&fits;};
 const line=(x,y,width,color=p.accent)=>{ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();ctx.restore();};
 ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
 if(memorial){
  // A single frame and sparse branches leave the person's name as the focus.
  if(d.design==='elegant'){
   ctx.fillStyle=p.soft;ctx.fillRect(0,0,w,story?150:100);line(80,story?150:100,w-160);
   line(80,h-145,w-160);
  }else{
   ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;ctx.strokeRect(42,42,w-84,h-84);
   botanical(ctx,67,story?310:235,.8,p);botanical(ctx,w-67,h-280,.65,p,true);
  }
  if(d.design==='bloom'){
   botanical(ctx,w-110,story?310:235,.8,p,true);
   for(const [x,y]of [[110,story?180:125],[w-110,h-205]]){ctx.save();ctx.fillStyle=p.soft;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.ellipse(x+18*Math.cos(a),y+18*Math.sin(a),12,23,a,0,Math.PI*2);ctx.fill();}ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.restore();}
  }
  const gathering=!!(d.event||d.when||d.place);
  block(d.language==='hi'?'स्नेह और संवेदना के साथ':d.occasion==='remembrance'?'A LIFE REMEMBERED':'WITH DEEPEST SYMPATHY',150,story?76:62,780,42,22,20,false,'center',sans,p.accent);
  if(image){const side=story?370:180;portrait(ctx,image,(w-side)/2,story?225:145,side,side,side/2,p);}
  else{
   // A small olive sprig gives a deliberate focal point when no photo is supplied.
   ctx.save();ctx.translate(w/2-12,story?280:195);ctx.rotate(-.65);botanical(ctx,0,0,.38,p);ctx.restore();
  }
  const titleY=story?(image?670:400):(image?350:262),nameY=story?(image?830:580):(image?440:365);
  block(d.title,140,titleY,800,story?125:76,story?62:43,27);
  block(d.name,130,nameY,820,story?170:115,story?82:64,28,true);
  const messageY=story?(image?1040:820):(image?564:530),messageEnd=story?(gathering?1320:1550):(gathering?735:825);
  const detailsHeight=d.details?(story?105:62):0;
  block(d.message,170,messageY,740,messageEnd-messageY-detailsHeight,story?42:34,22,false,'center',sans);
  if(d.details)block(d.details,160,messageEnd-detailsHeight+8,760,detailsHeight-8,story?29:25,18,false,'center',sans,p.accent);
  if(gathering){
   const y=story?1370:758;line(400,y-15,280);
   block(d.event,145,y,790,story?90:48,story?39:30,22,true);
   block(d.when,145,y+(story?100:55),790,story?65:40,28,20,false,'center',sans);
   block(d.place,145,y+(story?170:100),790,story?95:60,30,20,false,'center',sans);
  }
  const fromY=story?1710:926;line(480,fromY-22,120);
  block(d.from?(d.language==='hi'?'प्रेषक: ':'From: ')+d.from:'',145,fromY,790,story?85:43,story?31:27,20,false,'center',sans);
 }else{
  const modern=['bold','confetti'].includes(d.design);
  if(d.design==='bold'){
   ctx.fillStyle=p.soft;ctx.fillRect(0,0,w,story?690:380);
   ctx.fillStyle=p.accent;ctx.fillRect(0,story?690:380,w,12);
  }else if(d.design==='elegant'){
   ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.strokeRect(42,42,w-84,h-84);ctx.strokeRect(54,54,w-108,h-108);
   line(420,story?195:155,240);
  }else if(d.design==='bloom'){
   ctx.fillStyle=p.soft;ctx.beginPath();ctx.roundRect(64,64,w-128,h-128,story?460:420);ctx.fill();
   ctx.fillStyle=p.bg;ctx.beginPath();ctx.roundRect(88,88,w-176,h-176,story?430:390);ctx.fill();
   botanical(ctx,75,story?400:290,1.1,p);botanical(ctx,w-75,h-300,1,p,true);
  }else{
   // An asymmetric pair of paper arcs plus intentional, edge-only confetti.
   ctx.fillStyle=p.soft;ctx.beginPath();ctx.arc(w+100,-70,story?500:390,0,Math.PI*2);ctx.fill();
   for(let i=0;i<34;i++){const x=50+(i*173)%(w-100),y=45+(i*137)%(h-160);if(x>115&&x<w-115&&y>45&&y<h-100)continue;ctx.save();ctx.translate(x,y);ctx.rotate(i*.73);ctx.fillStyle=i%3?p.accent:p.ink;ctx.globalAlpha=.65;if(i%3){ctx.fillRect(-4,-10,8,20);}else{ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();}ctx.restore();}
  }
  // A hand-drawn four-point star keeps decoration away from the message area.
  const star=(x,y,r)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.2,-r*.2,r,0);ctx.quadraticCurveTo(r*.2,r*.2,0,r);ctx.quadraticCurveTo(-r*.2,r*.2,-r,0);ctx.quadraticCurveTo(-r*.2,-r*.2,0,-r);ctx.fill();ctx.restore();};
  star(155,story?270:190,28);star(w-150,story?580:420,18);
  block(d.language==='hi'?'आज का दिन आपके नाम':'TODAY IS ALL ABOUT YOU',150,story?110:85,780,45,23,21,false,'center',sans,p.accent);
  if(image){const side=story?410:210;portrait(ctx,image,(w-side)/2,story?225:165,side,side,d.design==='elegant'?side/2:side*.46,p);}
  const titleY=image?(story?710:407):(story?320:220),titleH=image?(story?245:125):(story?370:240);
  const starter=occasions.birthday[d.language].title;
  const heading=d.title===starter&&d.language==='en'?'Happy\nBirthday!':d.title;
  block(heading,115,titleY,850,titleH,story?140:image?78:110,34,true,'center',modern?sans:serif);
  const nameY=titleY+titleH+(story?38:20),nameH=story?145:95;
  block(d.name,125,nameY,830,nameH,story?83:62,28,false,'center',serif);
  const messageY=nameY+(d.name?nameH:0)+(story?75:35),end=story?1610:844,detailH=d.details?(story?120:65):0;
  block(d.message,165,messageY,750,end-messageY-detailH,story?43:34,22,false,'center',sans);
  if(d.details)block(d.details,155,end-detailH+4,770,detailH-4,29,20,false,'center',sans,p.accent);
  const fromY=story?1730:920;line(480,fromY-26,120);
  block(d.from,145,fromY,790,story?80:45,story?34:29,22,false,'center',sans);
 }
 drawWatermark(ctx,{x:60,y:h-104,width:w-120,height:64,ink:p.ink,background:p.bg});
 return {fits,width:w,height:h};
}
export function render(canvas,raw,image=null){
 const specific=validate(raw);
 if(['birthday','condolence','remembrance'].includes(specific.occasion))return occasionCard(canvas,specific,image);
 const d=validate(raw),size=sizes[d.format],p=palettes[d.palette];canvas.width=size.width;canvas.height=size.height;const ctx=canvas.getContext('2d'),w=size.width,h=size.height,story=d.format==='story';ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=p.soft;ctx.strokeStyle=p.accent;ctx.lineWidth=3;
 if(d.design==='confetti'){for(let i=0;i<85;i++){const x=(i*137+31)%w,y=(i*197+47)%h;if(x>115&&x<w-115&&y>120&&y<h-140)continue;ctx.save();ctx.translate(x,y);ctx.rotate(i*.71);ctx.fillStyle=i%2?p.accent:p.soft;ctx.globalAlpha=.65;if(i%3){ctx.fillRect(-3,-6,6,14);}else{ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}ctx.restore();}}
 if(d.design==='elegant'){ctx.strokeRect(36,36,w-72,h-72);for(const y of [110,h-100]){ctx.beginPath();ctx.moveTo(w/2-90,y);ctx.lineTo(w/2+90,y);ctx.stroke();}}
 if(d.design==='bloom'){for(const [x,y]of [[52,66],[w-52,h-66]]){for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;ctx.beginPath();ctx.ellipse(x+55*Math.cos(angle),y+55*Math.sin(angle),24,54,angle,0,Math.PI*2);ctx.fill();}ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.soft;}}
 if(d.design==='bold'){
 const orb=(x,y,r)=>{const g=ctx.createRadialGradient(x-r*.35,y-r*.4,5,x,y,r);g.addColorStop(0,p.bg);g.addColorStop(.45,p.soft);g.addColorStop(1,p.accent);ctx.save();ctx.shadowColor=p.soft;ctx.shadowBlur=30;ctx.shadowOffsetY=16;ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();};orb(w+75,0,240);orb(-75,h,220);
 }
 if(d.design==='quiet'){ctx.strokeStyle=p.accent;ctx.lineWidth=2;ctx.strokeRect(42,42,w-84,h-84);for(const flip of [false,true]){ctx.save();if(flip){ctx.translate(w,h);ctx.rotate(Math.PI);}ctx.beginPath();ctx.moveTo(55,190);ctx.quadraticCurveTo(110,105,190,65);ctx.stroke();for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(78+i*19,157-i*18,8,20,-.7,0,Math.PI*2);ctx.fill();}ctx.restore();}}
 // Fine rules and layered botanical ornaments are part of the exported artwork.
 const rule=y=>{ctx.save();ctx.strokeStyle=p.accent;ctx.globalAlpha=.5;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(w/2-90,y);ctx.lineTo(w/2-12,y);ctx.moveTo(w/2+12,y);ctx.lineTo(w/2+90,y);ctx.stroke();ctx.translate(w/2,y);ctx.rotate(Math.PI/4);ctx.fillStyle=p.accent;ctx.fillRect(-3,-3,6,6);ctx.restore();};
 if(['quiet','bloom'].includes(d.design)){for(const flip of [false,true]){ctx.save();if(flip){ctx.translate(w,h);ctx.rotate(Math.PI);}ctx.translate(58,180);ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,85);ctx.bezierCurveTo(8,20,40,-65,95,-120);ctx.stroke();for(let i=0;i<7;i++){for(const side of [-1,1]){ctx.save();ctx.translate(8+i*12,55-i*25);ctx.rotate(side*.7);ctx.fillStyle=i%2?p.soft:p.accent;ctx.globalAlpha=side===1?.35:.6;ctx.beginPath();ctx.ellipse(side*11,-10,8,23,side*.3,0,Math.PI*2);ctx.fill();ctx.restore();}}ctx.restore();}}
 if(['quiet','elegant'].includes(d.design)){ctx.save();ctx.strokeStyle=p.accent;ctx.globalAlpha=.18;ctx.lineWidth=1;ctx.strokeRect(26,26,w-52,h-52);ctx.restore();}
 if(d.design==='bold'){ctx.save();ctx.fillStyle=p.accent;ctx.fillRect(140,story?228:151,92,8);ctx.restore();}else rule(story?220:145);
 const margin=140,content=w-2*margin;let ok=true;
 const block=(text,y,height,max,min,bold=false)=>{ok=textBlock(ctx,text,{x:margin,y,width:content,height,max,min,bold,color:p.ink,align:d.design==='bold'?'left':'center',family:['bold','confetti'].includes(d.design)?font:undefined})&&ok;};
 block(['condolence','remembrance'].includes(d.occasion)?(d.language==='hi'?'स्नेह और स्मरण के साथ':'WITH CARE & REMEMBRANCE'):(d.language==='hi'?'एक खास पल':'A MOMENT TO SHARE'),story?155:85,48,24,20);
 let titleY=story?260:170;
 if(image){const side=story?420:210,x=(w-side)/2,y=story?275:175;ctx.save();ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-8,y-8,side+16,side+16,16);ctx.stroke();ctx.beginPath();ctx.roundRect(x,y,side,side,8);ctx.clip();const scale=Math.max(side/image.width,side/image.height),iw=image.width*scale,ih=image.height*scale;ctx.drawImage(image,x+(side-iw)/2,y+(side-ih)/2,iw,ih);ctx.restore();titleY=y+side+24;}
 const titleH=story?250:image?120:200;block(d.title,titleY,titleH,story?90:76,34,true);
 const nameY=titleY+titleH+8,nameH=d.name?(story?90:60):0;block(d.name,nameY,nameH,story?54:42,24,true);
 const footerY=story?h-260:h-210,detailsH=d.details?(story?140:85):0;
 const messageY=nameY+nameH+(story?30:20),messageEnd=footerY-detailsH-30;
 const messageH=Math.min(story?330:230,messageEnd-messageY);block(d.message,messageY,messageH,story?44:36,24);
 if(d.details)block(d.details,messageEnd+12,detailsH,30,21);
 rule(footerY-10);block(d.from,footerY+12,65,30,22,true);
 drawWatermark(ctx,{x:60,y:h-104,width:w-120,height:64,ink:p.ink,background:p.bg});
 return {fits:ok,width:w,height:h};
}
