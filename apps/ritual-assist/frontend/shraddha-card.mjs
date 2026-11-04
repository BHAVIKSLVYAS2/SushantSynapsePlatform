import {downloadBlob} from '/shared/download.mjs';
import {drawExportBrand} from '/shared/export-brand.mjs';
import {displayedMonth,monthNames,tithiLabel} from './panchang.mjs';

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

function writeText(ctx,text,x,y,{size=18,color=themes.ivory.ink,align='left',weight=400}={}){
 ctx.font=`${weight} ${size}px ${fonts}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(text),x,y);
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


const themes={
 ivory:{back:'#f4f0e8',paper:'#fffdf8',ink:'#263e38',muted:'#53665e',line:'#d8d4c6',gold:'#8b6634',night:'#183e35',deep:'#102e28',onHeader:'#fffdf8',wash:'#eee8dc'},
 midnight:{back:'#101d2a',paper:'#1b2c3c',ink:'#f5f0e5',muted:'#c5d1d7',line:'#3e5363',gold:'#e1c38b',night:'#203a4a',deep:'#142b38',onHeader:'#fffdf8',wash:'#253c4d'}
};
const selectedThemes=new WeakMap();
function shortTime(value,locale){return new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata',hour12:true}).format(new Date(Math.round(value/60000)*60000));}
function summaryLines(row,language,calendar,labels){
 const hi=language==='hi',locale=hi?'hi-IN':'en-IN',lines=[];
 if(!row)return [labels.notReady];
 if(row.conditional||row.status!=='computed')lines.push(eventText(row,language,calendar,labels)[0]);
 if(row.date&&row.date<calendar.planningFrom)lines.push(labels.earlier);
 if(row.window)lines.push(tithiLabel(row.window.number,language)+' · '+monthNames[language][displayedMonth(row.month,row.window.number,calendar.data.calendar)]);
 if(row.date){const day=(row.candidates||[]).find(day=>day.date===row.date);if(day)lines.push((hi?'अपराह्न':'Aparahna')+' · '+shortTime(day.aparahnaStart,locale)+' – '+shortTime(day.aparahnaEnd,locale)+' IST');}
 else if(row.candidates?.length)lines.push((hi?'संभावित तारीखें: ':'Candidate dates: ')+row.candidates.map(day=>dateLabel(day.date,locale)).join(' / '));
 return lines;
}
function displayDate(row,language,labels){
 return row?.date?new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(row.date+'T12:00:00Z')):labels.unresolved;
}
function eventHeight(ctx,rows,language,calendar,labels,width){
 let height=92;
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 54px ${fonts}`;height+=wrapLines(ctx,displayDate(row,language,labels),width-72).length*68;
  ctx.font=`400 28px ${fonts}`;height+=summaryLines(row,language,calendar,labels).reduce((sum,line)=>sum+wrapLines(ctx,line,width-72).length*40,0)+38;
 }
 return Math.max(310,height);
}
function drawEvent(ctx,rows,{x,y,width,height,kind,language,calendar,labels,tone}){
 roundedRect(ctx,x,y,width,height,22);ctx.fillStyle=tone.paper;ctx.fill();ctx.strokeStyle=tone.line;ctx.lineWidth=1.5;ctx.stroke();
 ctx.fillStyle=tone.gold;roundedRect(ctx,x+30,y+32,5,27,2);ctx.fill();
 writeText(ctx,kind==='annual'?labels.barsi:labels.shraddha,x+50,y+54,{size:25,color:tone.muted,weight:600});
 let top=y+127;
 for(const row of rows.length?rows:[null]){
  ctx.font=`600 54px ${fonts}`;ctx.fillStyle=tone.ink;
  for(const line of wrapLines(ctx,displayDate(row,language,labels),width-72)){ctx.fillText(line,x+36,top);top+=68;}
  top+=4;ctx.font=`400 28px ${fonts}`;ctx.fillStyle=tone.muted;
  for(const line of summaryLines(row,language,calendar,labels))for(const part of wrapLines(ctx,line,width-72)){ctx.fillText(part,x+36,top);top+=40;}
  top+=34;
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

export function renderShraddhaCard(canvas,calendar,language='en',selectedYear,theme='ivory'){
 if(!['en','hi'].includes(language))throw Error('Unsupported calendar image language.');
 if(!themes[theme])throw Error('Unsupported calendar image theme.');
 if(!Array.isArray(calendar?.yearly)||calendar.yearly.length!==11)throw Error('The complete 10-year calendar is not available.');
 const year=calendar.yearly.find(item=>item.year===Number(selectedYear??defaultYear(calendar)));if(!year)throw Error('The selected observance year is not available.');
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image card rendering is unavailable in this browser.');
 const labels=copy[language],tone=themes[theme],width=1080,margin=64,eventWidth=width-margin*2;
 const heights=cardRows(year).map(rows=>eventHeight(ctx,rows,language,calendar,labels,eventWidth));
 const locationLines=(()=>{ctx.font=`400 27px ${fonts}`;return wrapLines(ctx,calendar.data.location.name,eventWidth-72);})();
 const header=350+Math.max(0,locationLines.length-1)*38,footer=188,gap=24;
 const height=Math.max(1350,header+heights[0]+heights[1]+gap+footer);
 canvas.width=width;canvas.height=height;canvas.dataset.cardTheme=theme;canvas.dataset.cardLayout='portrait';
 ctx.fillStyle=tone.back;ctx.fillRect(0,0,width,height);
 roundedRect(ctx,24,24,width-48,height-48,32);ctx.strokeStyle=tone.line;ctx.lineWidth=2;ctx.stroke();
 const gradient=ctx.createLinearGradient(0,0,width,header);gradient.addColorStop(0,tone.night);gradient.addColorStop(1,tone.deep);
 roundedRect(ctx,margin,56,eventWidth,header-80,24);ctx.fillStyle=gradient;ctx.fill();
 writeText(ctx,'RITUAL ASSIST',margin+36,109,{size:23,color:'#e1c38b',weight:600});
 writeText(ctx,labels.title,margin+36,177,{size:48,color:tone.onHeader,weight:600});
 writeText(ctx,labels.subtitle,margin+36,219,{size:27,color:tone.onHeader});
 writeText(ctx,String(year.year),width-margin-36,110,{size:35,color:'#e1c38b',weight:600,align:'right'});
 ctx.font=`400 27px ${fonts}`;ctx.fillStyle=tone.onHeader;ctx.textAlign='left';
 locationLines.forEach((line,i)=>ctx.fillText(line,margin+36,276+i*38));
 drawEvent(ctx,year.annual||[],{x:margin,y:header,width:eventWidth,height:heights[0],kind:'annual',language,calendar,labels,tone});
 drawEvent(ctx,year.pitru||[],{x:margin,y:header+heights[0]+gap,width:eventWidth,height:heights[1],kind:'pitru',language,calendar,labels,tone});
 ctx.font=`400 24px ${fonts}`;ctx.fillStyle=tone.muted;ctx.textAlign='center';
 const note=wrapLines(ctx,labels.note,eventWidth-24);note.forEach((line,i)=>ctx.fillText(line,width/2,height-footer+55+i*34));
 ctx.save();ctx.translate(0,-34);drawExportBrand(ctx,{width,height,ink:tone.ink,size:26});ctx.restore();
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Sushant Synapse · Ritual Assist · ${labels.title} · ${year.year} · ${calendar.data.location.name} · ${accessibleRows(calendar,language,year)}`);
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
 const themeLabel=document.createElement('label');themeLabel.textContent=language==='hi'?'कार्ड का रंग':'Card colour';
 const themeSelect=document.createElement('select');themeSelect.id='shraddha-theme';themeSelect.setAttribute('aria-label',themeLabel.textContent);
 for(const [value,label]of [['ivory',language==='hi'?'आइवरी':'Ivory'],['midnight',language==='hi'?'मिडनाइट':'Midnight']])themeSelect.add(new Option(label,value));
 themeSelect.value=selectedThemes.get(calendar)||'ivory';themeLabel.append(themeSelect);
 const appearance=document.createElement('div');appearance.className='shraddha-card-options';appearance.append(yearLabel,themeLabel);
 const preview=document.createElement('details');
 preview.className='shraddha-share-preview';
 const summary=document.createElement('summary');
 summary.textContent=labels.preview;
 const canvas=document.createElement('canvas');
 canvas.className='shraddha-share-canvas';
 const render=()=>renderShraddhaCard(canvas,calendar,language,yearSelect.value,themeSelect.value);
 render();
 document.fonts?.ready.then(()=>{if(canvas.isConnected)render();});
 yearSelect.addEventListener('change',()=>{selectedYears.set(calendar,Number(yearSelect.value));render();preview.open=true;status.textContent='';});
 themeSelect.addEventListener('change',()=>{selectedThemes.set(calendar,themeSelect.value);render();preview.open=true;status.textContent='';});
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
 panel.append(heading,help,appearance,actions,status,preview);
 container.append(panel);
 return panel;
}
