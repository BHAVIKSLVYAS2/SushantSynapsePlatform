import {downloadBlob} from '/shared/download.mjs';
import {drawExportBrand} from '/shared/export-brand.mjs';
import {displayedMonth,monthNames,tithiLabel} from './panchang.mjs';

const palette={back:'#f5f0e5',paper:'#fffdf8',ink:'#263b31',muted:'#65746a',line:'#d7c69d',gold:'#d7b16d',saffron:'#d97839',night:'#12382f',deep:'#0b261f'};
const fonts='"Nirmala UI","Segoe UI",Arial,sans-serif';
const copy={
 en:{title:'Shraddha & Barsi',subtitle:'A considered 10-year remembrance calendar',range:'Current year + next 10 years',place:'Observance place',barsi:'BARSI / SAMVATSARI',shraddha:'PITRU PAKSHA SHRADDHA',notReady:'Not applicable yet · confirm with family tradition',candidate:'Candidate date · please confirm with family tradition',calculated:'Calculated date · confirm with a regional Panchang',unresolved:'Date requires confirmation',noOverlap:'No Aparahna overlap · confirm with a regional Panchang',tie:'Close candidate dates · confirm with a regional Panchang',near:'Near a tithi boundary · confirm with a regional Panchang',tithi:'Tithi',interval:'Tithi interval · IST',aparahna:'Aparahna candidates · IST',earlier:'Earlier this year',note:'Calculated planning dates · confirm with your family tradition and a regional Panchang.',download:'Download 10-year PNG',share:'Share 10-year PNG',preview:'Preview shareable 10-year PNG',help:'A high-resolution image with both annual Barsi and Pitru Paksha Shraddha dates, calculations and confirmation notes.',downloaded:'10-year PNG downloaded.',shared:'Share sheet opened for your calendar image.',cancelled:'Sharing cancelled. Your image is still available.',fallback:'Image downloaded. Attach it in your message.',empty:'Not applicable yet · date requires confirmation',status:'Share status',error:'Could not create the calendar image. Please try again.'},
 hi:{title:'श्राद्ध और बरसी',subtitle:'स्मरण के लिए अगले 10 वर्षों का विचारपूर्ण कैलेंडर',range:'वर्तमान वर्ष और अगले 10 वर्ष',place:'अनुष्ठान का स्थान',barsi:'बरसी / संवत्सरी',shraddha:'पितृ पक्ष श्राद्ध',notReady:'अभी लागू नहीं · पारिवारिक रीति से पुष्टि करें',candidate:'संभावित तारीख · पारिवारिक रीति से पक्की करें',calculated:'गणना की तारीख · क्षेत्रीय पंचांग से पक्की करें',unresolved:'तारीख निश्चित करने की आवश्यकता',noOverlap:'अपराह्न का मेल नहीं · क्षेत्रीय पंचांग से पक्की करें',tie:'संभावित तारीखें पास हैं · क्षेत्रीय पंचांग से पक्की करें',near:'तिथि सीमा के पास · क्षेत्रीय पंचांग से पक्की करें',tithi:'तिथि',interval:'तिथि का समय · IST',aparahna:'अपराह्न के संभावित समय · IST',earlier:'इस वर्ष की बीती तारीख',note:'गणना पर आधारित योजना · पारिवारिक रीति और क्षेत्रीय पंचांग से तारीखें पक्की करें।',download:'अगले 10 वर्ष का PNG डाउनलोड करें',share:'अगले 10 वर्ष का PNG साझा करें',preview:'अगले 10 वर्ष के साझा PNG का पूर्वावलोकन',help:'दोनों वार्षिक बरसी और पितृ पक्ष श्राद्ध की तारीखों, गणना और पुष्टि संबंधी जानकारी वाला उच्च-गुणवत्ता चित्र।',downloaded:'अगले 10 वर्षों का PNG डाउनलोड हुआ।',shared:'कैलेंडर चित्र साझा करने के लिए तैयार है।',cancelled:'साझा करना रद्द हुआ। चित्र अभी भी उपलब्ध है।',fallback:'चित्र डाउनलोड हुआ। इसे अपने संदेश में संलग्न करें।',empty:'अभी लागू नहीं · तारीख की पुष्टि आवश्यक है',status:'साझा करने की स्थिति',error:'कैलेंडर चित्र नहीं बन सका। फिर प्रयास करें।'}
};

function roundedRect(ctx,x,y,width,height,radius){
 ctx.beginPath();
 ctx.roundRect(x,y,width,height,radius);
}

function writeText(ctx,text,x,y,{size=18,color=palette.ink,maxWidth,align='left',weight=400}={}){
 ctx.font=`${weight} ${size}px ${fonts}`;
 ctx.fillStyle=color;
 ctx.textAlign=align;
 let value=String(text);
 if(maxWidth&&ctx.measureText(value).width>maxWidth){
  const words=value.split(/\s+/),lines=[];
  let line='';
  for(const word of words){
   const next=line?line+' '+word:word;
   if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;
  }
  if(line)lines.push(line);
  lines.forEach((part,index)=>ctx.fillText(part,x,y+index*22));
  return lines.length;
 }
 ctx.fillText(value,x,y);
 return 1;
}

function mandala(ctx,x,y,radius){
 ctx.save();
 ctx.translate(x,y);
 ctx.strokeStyle=palette.gold;
 ctx.globalAlpha=.55;
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

function dateLabel(date,locale){
 return date?new Intl.DateTimeFormat(locale,{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'';
}

function timeLabel(value,locale){
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata',hour12:false}).format(new Date(Math.round(value/60000)*60000))+' IST';
}

function eventText(row,language,calendar,labels){
 if(!row)return [labels.notReady];
 const locale=language==='hi'?'hi-IN':'en-IN',lines=[];
 const state=row.conditional?labels.candidate:row.status==='computed'?labels.calculated:row.status==='no-aparahna'?labels.noOverlap:row.status==='two-day-tie'?labels.tie:row.status==='near'?labels.near:labels.unresolved;
 lines.push(state);
 if(row.status==='computed'&&row.date&&row.date<calendar.planningFrom)lines.push(labels.earlier);
 if(row.window){
  const month=monthNames[language][displayedMonth(row.month,row.window.number,calendar.data.calendar)];
  lines.push(`${labels.tithi}: ${tithiLabel(row.window.number,language)} · ${month}`);
  lines.push(`${labels.interval}: ${timeLabel(row.window.start,locale)} → ${timeLabel(row.window.end,locale)}`);
  for(const day of row.candidates||[])lines.push(`${labels.aparahna}: ${dateLabel(day.date,locale)} · ${timeLabel(day.aparahnaStart,locale)} → ${timeLabel(day.aparahnaEnd,locale)}`);
 }
 return lines;
}

function wrapLines(ctx,text,width){
 const result=[];
 let line='';
 for(const word of String(text).split(/\s+/)){
  const next=line?line+' '+word:word;
  if(line&&ctx.measureText(next).width>width){result.push(line);line=word;}else line=next;
 }
 if(line)result.push(line);
 return result;
}

function eventDate(row,locale,labels){
 return row?.date?dateLabel(row.date,locale):row?.candidates?.length?row.candidates.map(day=>dateLabel(day.date,locale)).join(' · '):labels.empty;
}

function cellHeight(ctx,rows,language,calendar,labels,width){
 let height=47;
 const locale=language==='hi'?'hi-IN':'en-IN';
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 21px ${fonts}`;
  height+=wrapLines(ctx,eventDate(row,locale,labels),width).length*22+5;
  ctx.font=`400 15px ${fonts}`;
  height+=eventText(row,language,calendar,labels).reduce((count,line)=>count+wrapLines(ctx,line,width).length*19,0)+10;
 }
 return height;
}

function drawEvent(ctx,rows,{x,y,width,height,kind,language,calendar,labels}){
 const locale=language==='hi'?'hi-IN':'en-IN',title=kind==='annual'?labels.barsi:labels.shraddha;
 roundedRect(ctx,x,y,width,height,12);
 ctx.fillStyle=palette.paper;
 ctx.fill();
 ctx.fillStyle=palette.saffron;
 roundedRect(ctx,x,y,5,height,3);
 ctx.fill();
 writeText(ctx,title,x+18,y+25,{size:13,color:palette.muted,maxWidth:width-36,weight:600});
 let top=y+50;
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 21px ${fonts}`;
  ctx.fillStyle=palette.ink;
  for(const line of wrapLines(ctx,eventDate(row,locale,labels),width-36)){ctx.fillText(line,x+18,top);top+=22;}
  top+=4;
  ctx.font=`400 15px ${fonts}`;
  ctx.fillStyle=palette.muted;
  for(const line of eventText(row,language,calendar,labels)){
   for(const wrapped of wrapLines(ctx,line,width-36)){ctx.fillText(wrapped,x+18,top);top+=19;}
  }
  top+=8;
 }
}

function cardRows(year){
 return [year.annual||[],year.pitru||[]];
}

function accessibleRows(calendar,language){
 const locale=language==='hi'?'hi-IN':'en-IN',labels=copy[language];
 return calendar.yearly.map(year=>`${year.year}: ${cardRows(year).flatMap((rows,index)=>[index?'Pitru Paksha Shraddha':'Barsi / Samvatsari',...rows.map(row=>[row.date?dateLabel(row.date,locale):'candidate',...eventText(row,language,calendar,labels)].join(' · '))]).join(' · ')}`).join('; ');
}

export function renderShraddhaCard(canvas,calendar,language='en'){
 if(!['en','hi'].includes(language))throw Error('Unsupported calendar image language.');
 if(!Array.isArray(calendar?.yearly)||calendar.yearly.length!==11)throw Error('The complete 10-year calendar is not available.');
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Image card rendering is unavailable in this browser.');
 const labels=copy[language],locale=language==='hi'?'hi-IN':'en-IN',width=1080,margin=44,header=270,footer=168,rowGap=12,padding=14;
 const contentWidth=width-margin*2,yearWidth=94,gap=12,eventWidth=(contentWidth-yearWidth-gap*2)/2;
 const rowHeights=calendar.yearly.map(year=>Math.max(168,...cardRows(year).map(rows=>cellHeight(ctx,rows,language,calendar,labels,eventWidth-36)))+padding*2);
 const height=header+rowHeights.reduce((sum,value)=>sum+value+rowGap,0)+footer;
 canvas.width=width;
 canvas.height=height;
 ctx.fillStyle=palette.back;
 ctx.fillRect(0,0,width,height);
 roundedRect(ctx,18,18,width-36,height-36,28);
 ctx.strokeStyle=palette.gold;
 ctx.lineWidth=2;
 ctx.stroke();
 const gradient=ctx.createLinearGradient(24,24,width-24,header);
 gradient.addColorStop(0,palette.night);
 gradient.addColorStop(1,palette.deep);
 roundedRect(ctx,30,30,width-60,header-28,22);
 ctx.fillStyle=gradient;
 ctx.fill();
 mandala(ctx,width-75,78,27);
 writeText(ctx,'RITUAL ASSIST  ·  PANCHANG',margin+12,82,{size:15,color:palette.gold,weight:600});
 writeText(ctx,labels.title,margin+12,137,{size:38,color:palette.paper,weight:600,maxWidth:width-margin*2-24});
 writeText(ctx,labels.subtitle,margin+12,174,{size:19,color:palette.paper,maxWidth:width-margin*2-24});
 const first=calendar.yearly[0].year,last=calendar.yearly.at(-1).year;
 writeText(ctx,`${labels.range}  ·  ${first}–${last}`,margin+12,215,{size:16,color:palette.gold});
 writeText(ctx,`${labels.place}: ${calendar.data.location.name}`,width-margin-12,215,{size:16,color:palette.paper,maxWidth:contentWidth*.56,align:'right'});
 let top=header;
 for(let index=0;index<calendar.yearly.length;index++){
  const year=calendar.yearly[index],height=rowHeights[index];
  roundedRect(ctx,margin,top,contentWidth,height,14);
  ctx.fillStyle=index%2?palette.paper:'#faf6ed';
  ctx.fill();
  ctx.fillStyle=palette.night;
  roundedRect(ctx,margin,top,yearWidth,height,12);
  ctx.fill();
  writeText(ctx,String(year.year),margin+yearWidth/2,top+height/2+7,{size:19,color:palette.paper,align:'center',weight:600});
  const firstX=margin+yearWidth+gap,secondX=firstX+eventWidth+gap;
  drawEvent(ctx,year.annual||[],{x:firstX,y:top+padding,width:eventWidth,height:height-padding*2,kind:'annual',language,calendar,labels});
  drawEvent(ctx,year.pitru||[],{x:secondX,y:top+padding,width:eventWidth,height:height-padding*2,kind:'pitru',language,calendar,labels});
  top+=height+rowGap;
 }
 writeText(ctx,labels.note,width/2,height-footer+48,{size:15,color:palette.muted,align:'center',maxWidth:contentWidth});
 drawExportBrand(ctx,{width,height,ink:palette.ink,size:18});
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',`${labels.title} · ${labels.range} · ${calendar.data.location.name} · ${accessibleRows(calendar,language)}`);
 return {width,height};
}

export function shraddhaCardPng(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error(copy.en.error)),'image/png'));
}

export function mountShraddhaCard(container,calendar,language='en'){
 const labels=copy[language],panel=document.createElement('section');
 panel.className='shraddha-share card';
 panel.setAttribute('aria-labelledby','shraddha-share-title');
 const heading=document.createElement('h3');
 heading.id='shraddha-share-title';
 heading.textContent=labels.title;
 const help=document.createElement('p');
 help.className='fine';
 help.textContent=labels.help;
 const preview=document.createElement('details');
 preview.className='shraddha-share-preview';
 const summary=document.createElement('summary');
 summary.textContent=labels.preview;
 const canvas=document.createElement('canvas');
 canvas.className='shraddha-share-canvas';
 renderShraddhaCard(canvas,calendar,language);
 preview.append(summary,canvas);
 const status=document.createElement('p');
 status.className='fine';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 const actions=document.createElement('div');
 actions.className='shraddha-share-actions';
 const name='ritual-assist-shraddha-barsi-10-year.png';
 const download=document.createElement('button');
 download.type='button';
 download.className='primary';
 download.textContent=labels.download;
 download.addEventListener('click',async()=>{
  try{downloadBlob(await shraddhaCardPng(canvas),name,{cleanupDelay:1000});status.textContent=labels.downloaded;}
  catch(error){status.textContent=error.message||labels.error;}
 });
 const share=document.createElement('button');
 share.type='button';
 share.textContent=labels.share;
 share.addEventListener('click',async()=>{
  try{
   const png=await shraddhaCardPng(canvas),file=new File([png],name,{type:'image/png'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({title:labels.title,text:labels.note,files:[file]});status.textContent=labels.shared;}
    catch(error){if(error.name==='AbortError')status.textContent=labels.cancelled;else throw error;}
   }else{downloadBlob(png,name,{cleanupDelay:1000});status.textContent=labels.fallback;}
  }catch(error){status.textContent=error.message||labels.error;}
 });
 actions.append(download,share);
 panel.append(heading,help,actions,status,preview);
 container.append(panel);
 return panel;
}
