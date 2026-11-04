import {downloadBlob} from '/shared/download.mjs';
import {drawExportBrand} from '/shared/export-brand.mjs';
import {displayedMonth,monthNames,tithiLabel} from './panchang.mjs';

const palette={back:'#f5f0e5',paper:'#fffdf8',ink:'#263b31',muted:'#65746a',line:'#d7c69d',gold:'#d7b16d',saffron:'#d97839',night:'#12382f',deep:'#0b261f'};
const fonts='"Nirmala UI","Segoe UI",Arial,sans-serif';
const selectedYears=new WeakMap();
const copy={
 en:{title:'Shraddha & Barsi',subtitle:'Annual remembrance dates',year:'Observance year',place:'Observance place',barsi:'BARSI / SAMVATSARI',shraddha:'PITRU PAKSHA SHRADDHA',notReady:'Not applicable yet · confirm with family tradition',candidate:'Candidate date · please confirm with family tradition',calculated:'Calculated date · confirm with a regional Panchang',unresolved:'Date requires confirmation',noOverlap:'No Aparahna overlap · confirm with a regional Panchang',tie:'Close candidate dates · confirm with a regional Panchang',near:'Near a tithi boundary · confirm with a regional Panchang',tithi:'Tithi',interval:'Tithi interval · IST',aparahna:'Aparahna candidates · IST',earlier:'Earlier this year',note:'Calculated planning dates · confirm with your family tradition and a regional Panchang.',download:'Download year PNG',share:'Share year PNG',preview:'Preview this year’s card',help:'Choose a year to view and share its Barsi and Pitru Paksha dates. The full year-by-year details remain available in the calendar and PDF.',downloaded:'Year card downloaded.',shared:'Share sheet opened for your calendar image.',cancelled:'Sharing cancelled. Your image is still available.',fallback:'Image downloaded. Attach it in your message.',empty:'Not applicable yet · date requires confirmation',status:'Share status',error:'Could not create the calendar image. Please try again.'},
 hi:{title:'श्राद्ध और बरसी',subtitle:'वार्षिक स्मरण तारीखें',year:'अनुष्ठान का वर्ष',place:'अनुष्ठान का स्थान',barsi:'बरसी / संवत्सरी',shraddha:'पितृ पक्ष श्राद्ध',notReady:'अभी लागू नहीं · पारिवारिक रीति से पुष्टि करें',candidate:'संभावित तारीख · पारिवारिक रीति से पक्की करें',calculated:'गणना की तारीख · क्षेत्रीय पंचांग से पक्की करें',unresolved:'तारीख निश्चित करने की आवश्यकता',noOverlap:'अपराह्न का मेल नहीं · क्षेत्रीय पंचांग से पक्की करें',tie:'संभावित तारीखें पास हैं · क्षेत्रीय पंचांग से पक्की करें',near:'तिथि सीमा के पास · क्षेत्रीय पंचांग से पक्की करें',tithi:'तिथि',interval:'तिथि का समय · IST',aparahna:'अपराह्न के संभावित समय · IST',earlier:'इस वर्ष की बीती तारीख',note:'गणना पर आधारित योजना · पारिवारिक रीति और क्षेत्रीय पंचांग से तारीखें पक्की करें।',download:'वर्ष का PNG डाउनलोड करें',share:'वर्ष का PNG साझा करें',preview:'इस वर्ष के कार्ड का पूर्वावलोकन',help:'बरसी और पितृ पक्ष की तारीखें देखने और साझा करने के लिए वर्ष चुनें। पूरा वर्ष-दर-वर्ष विवरण कैलेंडर और PDF में उपलब्ध है।',downloaded:'वर्ष का कार्ड डाउनलोड हुआ।',shared:'कैलेंडर चित्र साझा करने के लिए तैयार है।',cancelled:'साझा करना रद्द हुआ। चित्र अभी भी उपलब्ध है।',fallback:'चित्र डाउनलोड हुआ। इसे अपने संदेश में संलग्न करें।',empty:'अभी लागू नहीं · तारीख की पुष्टि आवश्यक है',status:'साझा करने की स्थिति',error:'कैलेंडर चित्र नहीं बन सका। फिर प्रयास करें।'}
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
 let height=75;
 const locale=language==='hi'?'hi-IN':'en-IN';
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 34px ${fonts}`;
  height+=wrapLines(ctx,eventDate(row,locale,labels),width).length*38+5;
  ctx.font=`400 18px ${fonts}`;
  height+=eventText(row,language,calendar,labels).reduce((count,line)=>count+wrapLines(ctx,line,width).length*23,0)+10;
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
 writeText(ctx,title,x+18,y+25,{size:17,color:palette.muted,maxWidth:width-36,weight:600});
 let top=y+78;
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 34px ${fonts}`;
  ctx.fillStyle=palette.ink;
  for(const line of wrapLines(ctx,eventDate(row,locale,labels),width-36)){ctx.fillText(line,x+18,top);top+=38;}
  top+=4;
  ctx.font=`400 18px ${fonts}`;
  ctx.fillStyle=palette.muted;
  for(const line of eventText(row,language,calendar,labels)){
   for(const wrapped of wrapLines(ctx,line,width-36)){ctx.fillText(wrapped,x+18,top);top+=23;}
  }
  top+=8;
 }
}

function cardRows(year){
 return [year.annual||[],year.pitru||[]];
}

function defaultYear(calendar){
 const next=calendar.yearly.flatMap(year=>cardRows(year).flat().map(row=>({
  year:year.year,
  date:[row.date,...(row.candidates||[]).map(day=>day.date)].filter(date=>date&&date>=calendar.planningFrom).sort()[0]
 }))).filter(row=>row.date).sort((a,b)=>a.date.localeCompare(b.date))[0];
 return next?.year??calendar.yearly[0].year;
}

function accessibleRows(calendar,language,selected){
 const locale=language==='hi'?'hi-IN':'en-IN',labels=copy[language];
 const year=selected||calendar.yearly[0];
 return `${year.year}: ${cardRows(year).flatMap((rows,index)=>[index?'Pitru Paksha Shraddha':'Barsi / Samvatsari',...rows.map(row=>[row.date?dateLabel(row.date,locale):'candidate',...eventText(row,language,calendar,labels)].join(' · '))]).join(' · ')}`;
}

export function renderShraddhaCard(canvas,calendar,language='en',selectedYear){
 if(!['en','hi'].includes(language))throw Error('Unsupported calendar image language.');
 if(!Array.isArray(calendar?.yearly)||calendar.yearly.length!==11)throw Error('The complete 10-year calendar is not available.');
 const year=calendar.yearly.find(item=>item.year===Number(selectedYear??defaultYear(calendar)));
 if(!year)throw Error('The selected observance year is not available.');
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Image card rendering is unavailable in this browser.');
 const labels=copy[language],width=1080,margin=48,header=230,footer=128,padding=18,gap=16;
 const contentWidth=width-margin*2,eventWidth=(contentWidth-padding*2-gap)/2;
 const contentHeight=Math.max(210,...cardRows(year).map(rows=>cellHeight(ctx,rows,language,calendar,labels,eventWidth-36)))+padding*2;
 const height=header+contentHeight+footer;
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
 mandala(ctx,width-78,76,25);
 writeText(ctx,'RITUAL ASSIST  ·  PANCHANG',margin+12,73,{size:14,color:palette.gold,weight:600});
 writeText(ctx,labels.title,margin+12,120,{size:34,color:palette.paper,weight:600,maxWidth:width-margin*2-24});
 writeText(ctx,labels.subtitle,margin+12,155,{size:17,color:palette.paper,maxWidth:width-margin*2-24});
 writeText(ctx,String(year.year),margin+12,199,{size:28,color:palette.gold,weight:600});
 writeText(ctx,`${labels.place}: ${calendar.data.location.name}`,width-margin-12,198,{size:16,color:palette.paper,maxWidth:contentWidth*.56,align:'right'});
 const top=header;
 roundedRect(ctx,margin,top,contentWidth,contentHeight,16);
 ctx.fillStyle=palette.paper;
 ctx.fill();
 const firstX=margin+padding,secondX=firstX+eventWidth+gap;
 drawEvent(ctx,year.annual||[],{x:firstX,y:top+padding,width:eventWidth,height:contentHeight-padding*2,kind:'annual',language,calendar,labels});
 drawEvent(ctx,year.pitru||[],{x:secondX,y:top+padding,width:eventWidth,height:contentHeight-padding*2,kind:'pitru',language,calendar,labels});
 writeText(ctx,labels.note,width/2,height-footer+35,{size:14,color:palette.muted,align:'center',maxWidth:contentWidth});
 ctx.save();
 ctx.translate(0,-20);
 drawExportBrand(ctx,{width,height,ink:palette.ink,size:17});
 ctx.restore();
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',`Sushant Synapse · Ritual Assist · ${labels.title} · ${year.year} · ${calendar.data.location.name} · ${accessibleRows(calendar,language,year)}`);
 return {width,height};
}

export function shraddhaCardPng(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error(copy.en.error)),'image/png'));
}

export function mountShraddhaCard(container,calendar,language='en'){
 const labels=copy[language],panel=document.createElement('section'),initialYear=selectedYears.get(calendar)??defaultYear(calendar);
 panel.className='shraddha-share card';
 panel.setAttribute('aria-labelledby','shraddha-share-title');
 const heading=document.createElement('h3');
 heading.id='shraddha-share-title';
 heading.textContent=labels.title;
 const help=document.createElement('p');
 help.className='fine';
 help.textContent=labels.help;
 const yearLabel=document.createElement('label');
 yearLabel.className='shraddha-year-control';
 yearLabel.textContent=labels.year;
 const yearSelect=document.createElement('select');
 yearSelect.id='shraddha-year';
 yearSelect.setAttribute('aria-label',labels.year);
 for(const year of calendar.yearly){const option=document.createElement('option');option.value=String(year.year);option.textContent=String(year.year);yearSelect.append(option);}
 yearSelect.value=String(initialYear);
 yearLabel.append(yearSelect);
 const preview=document.createElement('details');
 preview.className='shraddha-share-preview';
 const summary=document.createElement('summary');
 summary.textContent=labels.preview;
 const canvas=document.createElement('canvas');
 canvas.className='shraddha-share-canvas';
 const render=()=>renderShraddhaCard(canvas,calendar,language,yearSelect.value);
 render();
 yearSelect.addEventListener('change',()=>{selectedYears.set(calendar,Number(yearSelect.value));render();preview.open=true;status.textContent='';});
 preview.append(summary,canvas);
 const status=document.createElement('p');
 status.className='fine';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 const actions=document.createElement('div');
 actions.className='shraddha-share-actions';
 const fileName=()=>`ritual-assist-shraddha-barsi-${yearSelect.value}.png`;
 const download=document.createElement('button');
 download.type='button';
 download.className='primary';
 download.textContent=labels.download;
 download.addEventListener('click',async()=>{
  const name=fileName();
  try{downloadBlob(await shraddhaCardPng(canvas),name,{cleanupDelay:1000});status.textContent=labels.downloaded;}
  catch(error){status.textContent=error.message||labels.error;}
 });
 const share=document.createElement('button');
 share.type='button';
 share.textContent=labels.share;
 share.addEventListener('click',async()=>{
  const name=fileName(),year=yearSelect.value;
  try{
   const png=await shraddhaCardPng(canvas),file=new File([png],name,{type:'image/png'});
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    try{await navigator.share({title:`${labels.title} · ${year}`,text:labels.note,files:[file]});status.textContent=labels.shared;}
    catch(error){if(error.name==='AbortError')status.textContent=labels.cancelled;else throw error;}
   }else{downloadBlob(png,name,{cleanupDelay:1000});status.textContent=labels.fallback;}
  }catch(error){status.textContent=error.message||labels.error;}
 });
 actions.append(download,share);
 panel.append(heading,help,yearLabel,actions,status,preview);
 container.append(panel);
 return panel;
}
