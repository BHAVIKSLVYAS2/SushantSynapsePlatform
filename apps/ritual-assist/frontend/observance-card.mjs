import {drawExportBrand} from '/shared/export-brand.mjs';

const palette={back:'#f5f0e5',paper:'#fffdf8',ink:'#263b31',muted:'#65746a',line:'#d7c69d',gold:'#d7b16d',saffron:'#d97839',night:'#12382f',deep:'#0b261f'};
const fonts='"Nirmala UI","Segoe UI",Arial,sans-serif';

const copy={
 en:{title:'Upcoming Hindu Dates',eyebrow:'RITUAL ASSIST  ·  PANCHANG',planning:'Calculated planning dates',confirm:'Please confirm dates with your family tradition and a regional Panchang.',share:'Upcoming observances',empty:'No confirmed upcoming dates are available for this selection.'},
 hi:{title:'आगामी व्रत एवं तिथियाँ',eyebrow:'रिचुअल असिस्ट  ·  पंचांग',planning:'गणना पर आधारित योजना',confirm:'तारीखें परिवार की परम्परा और क्षेत्रीय पंचांग से पक्की करें।',share:'आगामी अनुष्ठान',empty:'इस चयन में कोई निश्चित आगामी तारीख उपलब्ध नहीं है।'}
};

function roundedRect(ctx,x,y,width,height,radius){
 ctx.beginPath();
 ctx.roundRect(x,y,width,height,radius);
}

function drawMandala(ctx,x,y,radius){
 ctx.save();
 ctx.translate(x,y);
 ctx.strokeStyle=palette.gold;
 ctx.globalAlpha=.72;
 ctx.lineWidth=2;
 for(let i=0;i<12;i++){
  ctx.rotate(Math.PI/6);
  ctx.beginPath();
  ctx.ellipse(0,-radius*.56,radius*.14,radius*.48,0,0,Math.PI*2);
  ctx.stroke();
 }
 ctx.beginPath();
 ctx.arc(0,0,radius*.2,0,Math.PI*2);
 ctx.stroke();
 ctx.restore();
}

function dateParts(date,language){
 const locale=language==='hi'?'hi-IN':'en-IN';
 const value=new Date(date+'T12:00:00Z');
 return {
  day:new Intl.DateTimeFormat(locale,{day:'numeric',timeZone:'UTC'}).format(value),
  monthWeekday:new Intl.DateTimeFormat(locale,{weekday:'short',month:'short',timeZone:'UTC'}).format(value)
 };
}

function writeText(ctx,text,x,y,{font,size=28,color=palette.ink,maxWidth,align='left'}={}){
 ctx.font=`${font||''} ${size}px ${fonts}`;
 ctx.fillStyle=color;
 let value=String(text);
 if(maxWidth&&ctx.measureText(value).width>maxWidth){
  const segments=Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value),part=>part.segment);
  while(segments.length>1&&ctx.measureText(segments.join('')+'…').width>maxWidth)segments.pop();
  value=segments.join('')+'…';
 }
 ctx.textAlign=align;
 ctx.fillText(value,x,y);
}

export function renderObservanceCard(canvas,events,{month,location,language='en',view='list'}){
 if(!Array.isArray(events)||events.length===0)throw Error(copy[language]?.empty||copy.en.empty);
 if(!['en','hi'].includes(language))throw Error('Unsupported card language.');
 const width=1080,margin=60,rowHeight=events.some(event=>event.status&&event.status!=='computed')?112:84,headerHeight=236,footerHeight=140,height=headerHeight+events.length*rowHeight+footerHeight;
 canvas.width=width;
 canvas.height=height;
 canvas.dataset.cardRows=String(events.length);canvas.dataset.cardView=view;
 canvas.setAttribute('aria-label',`${location} · ${month} · ${events.map(event=>event.date+' · '+event.title+(event.status&&event.status!=='computed'?' · '+(language==='hi'?'पुष्टि आवश्यक':'Confirmation required'):'')).join('; ')}`);
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Image card rendering is unavailable in this browser.');
 const text=copy[language],locale=language==='hi'?'hi-IN':'en-IN';
 ctx.fillStyle=palette.back;
 ctx.fillRect(0,0,width,height);
 roundedRect(ctx,24,24,width-48,height-48,36);
 ctx.strokeStyle=palette.gold;
 ctx.lineWidth=2;
 ctx.stroke();
 const header=ctx.createLinearGradient(24,24,width-24,headerHeight);
 header.addColorStop(0,palette.night);
 header.addColorStop(1,palette.deep);
 roundedRect(ctx,36,36,width-72,headerHeight-48,28);
 ctx.fillStyle=header;
 ctx.fill();
 drawMandala(ctx,width-90,92,30);
 writeText(ctx,text.eyebrow,margin,88,{size:17,color:palette.gold});
 writeText(ctx,view==='grid'?(language==='hi'?'व्रत कैलेंडर':'Vrat calendar'):text.title,margin,143,{size:40,color:palette.paper,maxWidth:width-margin*2});
 const monthLabel=new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(month+'-15T12:00:00Z'));
 writeText(ctx,location,margin,190,{size:20,color:palette.paper,maxWidth:width/2-80});
 writeText(ctx,monthLabel,width-margin,190,{size:20,color:palette.gold,maxWidth:width/2-80,align:'right'});
 ctx.strokeStyle=palette.gold;
 ctx.globalAlpha=.45;
 ctx.beginPath();
 ctx.moveTo(margin,211);
 ctx.lineTo(width-margin,211);
 ctx.stroke();
 ctx.globalAlpha=1;
 events.forEach((event,index)=>{
  const y=headerHeight+index*rowHeight+4;
  roundedRect(ctx,margin,y,width-margin*2,rowHeight-12,13);
  ctx.fillStyle=palette.paper;
  ctx.fill();
  ctx.fillStyle=palette.saffron;
  roundedRect(ctx,margin,y,5,rowHeight-12,3);
  ctx.fill();
  const date=dateParts(event.date,language);
  writeText(ctx,date.day,margin+22,y+47,{size:31,color:palette.ink});
  writeText(ctx,date.monthWeekday,margin+89,y+45,{size:20,color:palette.muted,maxWidth:230});
  ctx.strokeStyle=palette.line;
  ctx.beginPath();
  ctx.moveTo(margin+348,y+16);
  ctx.lineTo(margin+348,y+rowHeight-28);
  ctx.stroke();
  writeText(ctx,event.title,margin+375,y+45,{size:26,color:palette.ink,maxWidth:width-margin*2-395});
  if(event.status&&event.status!=='computed')writeText(ctx,language==='hi'?'पुष्टि आवश्यक':'Confirmation required',margin+375,y+78,{size:20,color:palette.muted,maxWidth:width-margin*2-395});
 });
 const footerY=headerHeight+events.length*rowHeight+16;
 ctx.strokeStyle=palette.line;
 ctx.beginPath();
 ctx.moveTo(margin,footerY);
 ctx.lineTo(width-margin,footerY);
 ctx.stroke();
 writeText(ctx,text.planning,margin,footerY+29,{size:19,color:palette.muted});
 writeText(ctx,text.confirm,margin,footerY+59,{size:19,color:palette.muted,maxWidth:width-margin*2});
 ctx.save();
 ctx.translate(0,-22);
 drawExportBrand(ctx,{width,height,ink:palette.ink,size:23});
 ctx.restore();
 return {width,height};
}

export function observanceCardPng(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not create the date card. Please try again.')),'image/png'));
}

export function observanceCardCopy(language='en'){
 return copy[language]||copy.en;
}
