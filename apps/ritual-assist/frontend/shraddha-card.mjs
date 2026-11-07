import {mountShareResult} from './share-result.mjs';
import {remembranceYears,remembranceRangeLabel} from './remembrance-range.mjs';
import {drawExportBrand} from '/shared/export-brand.mjs';
import {occasionTitle} from './calendar-export.mjs';
import {displayedMonth,monthNames,tithiLabel} from './calendar-display.mjs';

const fonts='"Nirmala UI","Segoe UI",Arial,sans-serif';
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

function shortTime(value,locale){return new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata',hour12:true}).format(new Date(Math.round(value/60000)*60000));}
function displayDate(row,language,labels){
 return row?.date?new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(row.date+'T12:00:00Z')):labels.unresolved;
}
function scheduleLines(row,language,calendar,labels,scope){
 const hi=language==='hi',locale=hi?'hi-IN':'en-IN',lines=[];
 if(!row)return [labels.notReady];
 if(row.conditional||!['computed','counted'].includes(row.status))lines.push(eventText(row,language,calendar,labels)[0]);
 if(scope==='year'&&row.date&&row.date<calendar.planningFrom)lines.push(hi?'बीती तिथि':'Past date');
 if(row.status==='counted')lines.push((hi?'पहला दिन: ':'Day 1: ')+dateLabel(calendar.firstDate,locale));
 if(row.window){
  lines.push(tithiLabel(row.window.number,language)+' · '+monthNames[language][displayedMonth(row.month,row.window.number,calendar.data.calendar)]);
  lines.push((hi?'तिथि अवधि':'Tithi interval')+': '+timeLabel(row.window.start,locale).replace(/ IST$/,'')+' → '+timeLabel(row.window.end,locale));
 }
 for(const day of row.candidates||[])lines.push((hi?'अपराह्न: ':'Aparahna: ')+(day.date!==row.date?dateLabel(day.date,locale)+' · ':'')+shortTime(day.aparahnaStart,locale)+' – '+shortTime(day.aparahnaEnd,locale)+' IST');
 if(scope==='first-year'&&row.kind==='pitru')lines.push(hi?'पहला लागू पितृ पक्ष; पहले वर्ष के बाद हो सकता है।':'First eligible Pitru Paksha; may fall after the first year.');
 return lines;
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

function renderYearOverview(canvas,calendar,years,language,theme,period){
 const hi=language==='hi',labels=copy[language],tone=themes[theme],ctx=canvas.getContext('2d');
 const width=1080,margin=48,inner=width-margin*2,yearWidth=112,cellWidth=(inner-yearWidth)/2;
 const date=new Intl.DateTimeFormat(hi?'hi-IN':'en-IN',{day:'numeric',month:'long',timeZone:'UTC'});
 const layouts=years.map(year=>{
  const cells=cardRows(year).map(rows=>{
   const lines=[];
   for(const row of rows){
    if(lines.length)lines.push({text:'',size:16,weight:400});
    lines.push({text:row.date?date.format(new Date(row.date+'T12:00:00Z')):labels.unresolved,size:34,weight:600});
    if(row.window)lines.push({text:tithiLabel(row.window.number,language),size:26,weight:400});
    if(row.date&&(row.conditional||!['computed','counted'].includes(row.status)))lines.push({text:hi?'संभावित · पुष्टि करें':'Candidate · confirm date',size:24,weight:600});
   }
   if(!rows.length)lines.push({text:labels.notReady,size:26,weight:400});
   return lines.flatMap(line=>{ctx.font=`${line.weight} ${line.size}px ${fonts}`;return (line.text?wrapLines(ctx,line.text,cellWidth-40):['']).map(text=>({...line,text,height:line.size+10}));});
  });
  return {year:year.year,cells,height:Math.max(112,...cells.map(lines=>lines.reduce((sum,line)=>sum+line.height,0)+32))};
 });
 ctx.font=`400 26px ${fonts}`;const locations=wrapLines(ctx,calendar.data.location.name,inner-48),header=220+locations.length*34,tableTop=header+52,footer=220;
 const height=tableTop+layouts.reduce((sum,row)=>sum+row.height,0)+footer;
 canvas.width=width;canvas.height=height;Object.assign(canvas.dataset,{cardTheme:theme,cardLayout:'year-table',cardScope:'year',cardRows:String(years.flatMap(year=>cardRows(year).flat()).length)});
 ctx.fillStyle=tone.back;ctx.fillRect(0,0,width,height);
 roundedRect(ctx,20,20,width-40,height-40,24);ctx.strokeStyle=tone.line;ctx.lineWidth=2;ctx.stroke();
 roundedRect(ctx,margin,40,inner,header-52,18);ctx.fillStyle=tone.night;ctx.fill();
 writeText(ctx,'RITUAL ASSIST',margin+24,82,{size:22,color:tone.onHeader,weight:600});
 writeText(ctx,period,width-margin-24,82,{size:30,color:tone.onHeader,align:'right',weight:600});
 writeText(ctx,labels.title,margin+24,140,{size:42,color:tone.onHeader,weight:600});
 writeText(ctx,hi?'वर्ष के अनुसार स्मरण तिथियाँ':'Year-by-year remembrance dates',margin+24,184,{size:26,color:tone.onHeader});
 locations.forEach((line,i)=>writeText(ctx,line,margin+24,220+i*34,{size:26,color:tone.onHeader}));
 writeText(ctx,hi?'वर्ष':'Year',margin+16,header+32,{size:25,weight:600,color:tone.ink});
 writeText(ctx,hi?'बरसी':'Barsi',margin+yearWidth+20,header+32,{size:27,weight:600,color:tone.ink});
 writeText(ctx,hi?'पितृ पक्ष श्राद्ध':'Pitru Paksha Shraddh',margin+yearWidth+cellWidth+20,header+32,{size:27,weight:600,color:tone.ink});
 let y=tableTop;
 for(const row of layouts){
  ctx.fillStyle=tone.paper;ctx.fillRect(margin,y,inner,row.height);
  writeText(ctx,row.year,margin+16,y+48,{size:32,weight:600,color:tone.ink});
  row.cells.forEach((lines,column)=>{let baseline=y+16;for(const line of lines){baseline+=line.height;writeText(ctx,line.text,margin+yearWidth+column*cellWidth+20,baseline-8,{size:line.size,weight:line.weight,color:line.weight===600?tone.ink:tone.muted});}});
  ctx.strokeStyle=tone.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(margin,y+row.height);ctx.lineTo(width-margin,y+row.height);
  for(const x of [margin+yearWidth,margin+yearWidth+cellWidth]){ctx.moveTo(x,y);ctx.lineTo(x,y+row.height);}ctx.stroke();y+=row.height;
 }
 const notes=[labels.note,hi?'विस्तृत समय के लिए ऐप में एक वर्ष चुनें।':'For detailed timings, select one year in Ritual Assist.'];
 ctx.font=`400 24px ${fonts}`;let baseline=y+40;
 for(const note of notes){for(const line of wrapLines(ctx,note,inner-24)){writeText(ctx,line,width/2,baseline,{size:24,color:tone.muted,align:'center'});baseline+=32;}baseline+=8;}
 ctx.save();ctx.translate(0,-20);drawExportBrand(ctx,{width,height,ink:tone.ink,size:25});ctx.restore();
 const accessible=years.map(year=>year.year+' · '+cardRows(year).flat().map(row=>occasionTitle(row,language)+' · '+displayDate(row,language,labels)+' · '+scheduleLines(row,language,calendar,labels,'year').join(' · ')).join(' | ')).join(' | ');
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Sushant Synapse · ${labels.title} · ${period} · ${calendar.data.location.name} · ${accessible}`);
 return {width,height};
}

export function renderShraddhaCard(canvas,calendar,language='en',selectedYear,theme='ivory',scope='year'){
 if(!['en','hi'].includes(language)||!themes[theme]||!['year','first-year'].includes(scope))throw Error('Unsupported image options.');
 if(!Array.isArray(calendar?.yearly)||calendar.yearly.length!==11)throw Error('The complete 10-year calendar is not available.');
 const years=remembranceYears(calendar,selectedYear??defaultYear(calendar)),year=years[0],period=remembranceRangeLabel(calendar,selectedYear??defaultYear(calendar));if(!year)throw Error('The selected observance year is not available.');
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image card rendering is unavailable in this browser.');
 if(scope==='year'&&years.length>1)return renderYearOverview(canvas,calendar,years,language,theme,period);
 const hi=language==='hi',labels=copy[language],tone=themes[theme],width=1080,margin=56,inner=width-margin*2,bodyWidth=inner-48;
 const title=scope==='first-year'?(hi?'पहला वर्ष और प्रारम्भिक संस्कार':'First year & early rites'):labels.title;
 const source=scope==='first-year'?[...(calendar.early||[]),...(calendar.monthly||[]),...(calendar.annual?[calendar.annual]:[]),...(calendar.pitru?[calendar.pitru]:[])]:years.flatMap(item=>cardRows(item).flat());
 const rows=source.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
 const next=scope==='year'?rows.find(row=>row.date&&row.date>=calendar.planningFrom):null;
 const layouts=(rows.length?rows:[null]).map(row=>{
  let name=row?occasionTitle(row,language):labels.notReady;
  if(row===next&&row)name+=' · '+(hi?'आगामी':'Next');
  ctx.font=`600 28px ${fonts}`;const names=wrapLines(ctx,name,inner*.53-24);
  ctx.font=`600 32px ${fonts}`;const dates=wrapLines(ctx,row?.date?displayDate(row,language,labels):labels.unresolved,inner*.44-24);
  ctx.font=`400 26px ${fonts}`;const details=scheduleLines(row,language,calendar,labels,scope).flatMap(line=>wrapLines(ctx,line,bodyWidth));
  const top=Math.max(names.length*38,dates.length*42);
  return {row,names,dates,details,top,height:top+details.length*36+44};
 });
 ctx.font=`400 26px ${fonts}`;const locations=wrapLines(ctx,calendar.data.location.name,bodyWidth);
 const header=282+(locations.length-1)*36,footer=164,height=Math.max(700,header+layouts.reduce((sum,item)=>sum+item.height,0)+footer+20);
 canvas.width=width;canvas.height=height;canvas.dataset.cardTheme=theme;canvas.dataset.cardLayout='compact';canvas.dataset.cardScope=scope;canvas.dataset.cardRows=String(rows.length);
 ctx.fillStyle=tone.back;ctx.fillRect(0,0,width,height);
 roundedRect(ctx,20,20,width-40,height-40,24);ctx.strokeStyle=tone.line;ctx.lineWidth=2;ctx.stroke();
 roundedRect(ctx,margin,44,inner,header-68,18);ctx.fillStyle=tone.night;ctx.fill();
 writeText(ctx,'RITUAL ASSIST',margin+24,86,{size:22,color:'#e1c38b',weight:600});
 writeText(ctx,scope==='year'?period:(hi?'पहला वर्ष':'FIRST YEAR'),width-margin-24,86,{size:27,color:'#e1c38b',weight:600,align:'right'});
 writeText(ctx,title,margin+24,145,{size:42,color:tone.onHeader,weight:600});
 writeText(ctx,scope==='year'?labels.subtitle:(hi?'मृत्यु की तारीख से: ':'From death: ')+dateLabel(calendar.data.date,hi?'hi-IN':'en-IN'),margin+24,188,{size:26,color:tone.onHeader});
 locations.forEach((line,i)=>writeText(ctx,line,margin+24,234+i*36,{size:26,color:tone.onHeader}));
 let y=header;
 for(const item of layouts){
  if(item.row===next&&next){roundedRect(ctx,margin,y,inner,item.height,12);ctx.fillStyle=tone.wash;ctx.fill();}
  ctx.textAlign='left';item.names.forEach((line,i)=>writeText(ctx,line,margin+24,y+34+i*38,{size:28,color:tone.ink,weight:600}));
  item.dates.forEach((line,i)=>writeText(ctx,line,width-margin-24,y+34+i*42,{size:32,color:tone.ink,weight:600,align:'right'}));
  item.details.forEach((line,i)=>writeText(ctx,line,margin+24,y+item.top+34+i*36,{size:26,color:tone.muted}));
  y+=item.height;ctx.beginPath();ctx.moveTo(margin+24,y);ctx.lineTo(width-margin-24,y);ctx.strokeStyle=tone.line;ctx.lineWidth=1;ctx.stroke();
 }
 ctx.font=`400 23px ${fonts}`;const note=wrapLines(ctx,labels.note,inner-24);
 note.forEach((line,i)=>writeText(ctx,line,width/2,height-footer+48+i*32,{size:23,color:tone.muted,align:'center'}));
 ctx.save();ctx.translate(0,-26);drawExportBrand(ctx,{width,height,ink:tone.ink,size:25});ctx.restore();
 const accessible=rows.map(row=>occasionTitle(row,language)+' · '+(row.date?displayDate(row,language,labels):labels.unresolved)+' · '+scheduleLines(row,language,calendar,labels,scope).join(' · ')).join(' | ');
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Sushant Synapse · Ritual Assist · ${title} · ${scope==='year'?period:calendar.data.date} · ${calendar.data.location.name} · ${accessible}`);
 return {width,height};
}

export function mountShraddhaCard(container,calendar,language='en',activeYear,activeScope='year'){
 let scope=activeScope,year=activeYear??defaultYear(calendar);
 const panel=mountShareResult(container,{
  language,
  title:()=>language==='hi'?'श्राद्ध और बरसी':'Shraddh & Barsi calendar',
  filename:()=>scope==='first-year'?'ritual-assist-first-year.png':`ritual-assist-shraddha-barsi-${year}.png`,
  render:canvas=>{
   const rows=scope==='first-year'?[...(calendar.early||[]),...(calendar.monthly||[]),...(calendar.annual?[calendar.annual]:[]),...(calendar.pitru?[calendar.pitru]:[])]:remembranceYears(calendar,year).flatMap(item=>cardRows(item).flat());
   if(!rows.length)return false;
   canvas.className='shraddha-share-canvas';renderShraddhaCard(canvas,calendar,language,year,'ivory',scope);return true;
  }
 });
 panel.classList.add('shraddha-share');panel.updateScope=(value,nextYear)=>{scope=value;if(nextYear!==undefined)year=nextYear;panel.prepare();};return panel;
}
