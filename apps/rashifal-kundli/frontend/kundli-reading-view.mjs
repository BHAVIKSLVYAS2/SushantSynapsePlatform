import {buildKundliReading} from './kundli-reading.mjs';
import {nature,presence,planet,houseContext,readingText,pick} from './kundli-reading-copy.mjs';
import {signName,bodyName} from './locale.mjs';
import {nakshatraName} from './display-text.mjs';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
export function mountKundliReading(container,report,language='en',name=''){
 const model=buildKundliReading(report),t=readingText[language],root=el('section',undefined,'kundli-reading');root.dataset.readingModel=model.modelId;
 const title=el('h2',t.title);if(name){title.append(document.createTextNode(' / '));const personal=el('span',name);personal.setAttribute('translate','no');title.append(personal);}title.id='kundli-reading-title';title.tabIndex=-1;root.append(title,el('p',t.intro,'kundli-reading-intro'));
 const identity=el('dl',undefined,'kundli-identity');for(const [key,label]of [['rising',t.rising],['moon',t.moon],['nakshatra',t.star]])if(model.identity[key]){const item=el('div');item.append(el('dt',label),el('dd',key==='nakshatra'?nakshatraName(model.identity[key],language):signName(model.identity[key],language)));identity.append(item);}root.append(identity);
 if(!model.limits.houseReading)root.append(el('p',t.partial,'kundli-reading-notice'));
 const navigation=el('div',undefined,'kundli-reading-navigation'),topicPicker=el('details',undefined,'kundli-topic-picker');topicPicker.append(el('summary',t.jump));const nav=el('nav',undefined,'kundli-topic-nav');nav.setAttribute('aria-label',t.jump);for(const id of [...Object.keys(model.topics),'future']){const link=el('a',t[id]);link.href='#kundli-'+id;link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();topicPicker.open=false;const target=root.querySelector('#kundli-'+id);if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}});nav.append(link);}topicPicker.append(nav);navigation.append(topicPicker);root.append(navigation);
 const cards=el('div',undefined,'kundli-reading-grid');
 const context=data=>`${t.connection} ${pick(houseContext[data.rulerHouse-1],language)}${language==='hi'?' से।':language==='gu'?' સાથે.':'.'}`;
 function evidence(card,id,data){const why=el('details'),summary=el('summary',t.basis);why.append(summary);if(data.house){why.append(el('p',`${t.house} ${data.house}: ${signName(data.sign,language)} · ${t.ruler}: ${bodyName(data.ruler,language)} · ${t.placed} ${t.house} ${data.rulerHouse} (${signName(data.rulerSign,language)})`));why.append(el('p',data.occupants.length?`${t.occupants}: ${data.occupants.map(body=>bodyName(body,language)).join(', ')}`:t.emptyHouse));}
  else why.append(el('p',`${t.moon}: ${signName(data.moon,language)}${data.rising?' · '+t.rising+': '+signName(data.rising,language):''}`));
  card.append(why);
 }
 for(const [id,data]of Object.entries(model.topics)){
  const card=el('article',undefined,'kundli-topic');card.id='kundli-'+id;card.dataset.topic=id;card.dataset.status=data?'available':'unavailable';card.append(el('h3',t[id]));
  if(!data){card.append(el('p',t.unavailable));cards.append(card);continue;}
  card.dataset.rule=`${id}-${data.sign??data.moon}-${data.rulerHouse??''}`;
  if(id==='personality'){card.append(el('p',pick(nature[data.moon-1],language),'kundli-topic-lead'));if(data.rising&&data.rising!==data.moon)card.append(el('p',t.rising+': '+pick(nature[data.rising-1],language)));}
  else if(id==='appearance'){card.append(el('p',pick(presence[data.rising-1],language),'kundli-topic-lead'),el('p',context(data)),el('p',t.appearanceLimit,'kundli-topic-note'));}
  else if(id==='career'){card.append(el('p',`${t.careerStart} ${pick(planet[data.ruler][1],language)}.`,'kundli-topic-lead'),el('p',pick(nature[data.sign-1],language)),el('p',context(data)),el('p',t.careerEnd,'kundli-topic-note'));}
  else {const prefix={money:'moneyLead',relationships:'relationshipLead',learning:'learningLead',home:'homeLead'}[id];const lead=id==='money'?pick(planet[data.ruler][0],language):pick(nature[data.sign-1],language);card.append(el('p',`${t[prefix]} ${lead}`,'kundli-topic-lead'),el('p',context(data)));const tip=el('p',t[{money:'moneyTip',relationships:'relationshipTip',learning:'learningTip',home:'homeTip'}[id]],'kundli-topic-action');tip.prepend(el('strong',t.tip+' · '));card.append(tip);}
  evidence(card,id,data);cards.append(card);
 }
 root.append(cards);
 const future=el('section',undefined,'kundli-future');future.id='kundli-future';future.dataset.topic='future';future.dataset.status=model.periods.length?'available':'unavailable';future.append(el('h3',t.future));
 const date=boundary=>{const local=boundary.local.status==='available';return new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short',timeZone:local?'Asia/Kolkata':'UTC'}).format(new Date(boundary.utcInstant))+' '+(local?'IST':'UTC');};
 if(!model.periods.length)future.append(el('p',t.periodUnavailable));
 else {future.append(el('p',`${t.asOf}: ${new Intl.DateTimeFormat(language,{dateStyle:'medium',timeZone:'Asia/Kolkata'}).format(new Date(model.calculatedAtUtc))}`));const list=el('ol',undefined,'kundli-periods');model.periods.forEach((period,index)=>{const item=el('li');item.dataset.major=period.major;item.dataset.minor=period.minor;item.dataset.start=period.start.utcInstant;item.dataset.end=period.end.utcInstant;item.append(el('span',index===0?t.current:t.upcoming,'kundli-period-label'),el('h4',`${bodyName(period.major,language)} / ${bodyName(period.minor,language)}`),el('p',`${date(period.start)} → ${date(period.end)}`),el('p',`${t.periodTheme}: ${pick(planet[period.major][0],language)} · ${pick(planet[period.minor][0],language)}`));list.append(item);});future.append(list,el('p',t.periodNote,'kundli-topic-note'));}
 root.append(future);
 const methods=el('details',undefined,'kundli-reading-methods');methods.append(el('summary',t.methods),el('p',t.methodNote));for(const [name,url]of [['AstroSage','https://www.astrosage.com/kundli/how-to-read-kundli.asp'],['Prokerala','https://www.prokerala.com/astrology/kundli/'],['Astroyogi','https://www.astroyogi.com/blog/planets-which-governs-your-career.aspx']]){const link=el('a',name);link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';methods.append(link,document.createTextNode(' '));}root.append(methods);container.append(root);
 return {destroy(){root.remove();}};
}
