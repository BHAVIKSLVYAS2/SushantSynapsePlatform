import {shlokas,shlokaById,shlokaText} from './shloki-content.mjs';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
export function mountShlokiReader(parent,{onChoose}){
 let current=shlokas[0],language='en',large=false,revision=0;
 const root=el('article',null,'shloki-reader');root.setAttribute('aria-label','Shloki');parent.replaceChildren(root);
 function show(id,lang){
  const focusKey=root.contains(document.activeElement)?document.activeElement.dataset.shlokiFocus:null,meaningOpen=root.querySelector('.shloki-meaning')?.open||false,sourceOpen=root.querySelector('.shloki-sources')?.open||false;
  current=shlokaById(id);language=lang;const stamp=++revision,hi=lang==='hi',t=(en,hin)=>hi?hin:en;
  root.replaceChildren();root.lang=lang;root.dataset.large=String(large);
  const label=el('label',t('Choose a shloka','श्लोक चुनें')),select=el('select');select.id='shloki-select';label.htmlFor=select.id;
  select.dataset.shlokiFocus='select';for(const item of shlokas){const option=el('option',item.title[lang]);option.value=item.id;select.append(option);}label.append(select);root.append(label);
  if(!current){select.selectedIndex=-1;const missing=el('p',t('This reading is unavailable. Choose a shloka above.','यह पाठ उपलब्ध नहीं है। ऊपर से कोई श्लोक चुनें।'));missing.role='status';root.append(missing);select.onchange=()=>onChoose(select.value);return;}
  const item=current;select.value=item.id;select.onchange=()=>onChoose(select.value);
  const tools=el('div',null,'shloki-tools'),bigger=el('button',t('Larger text','बड़े अक्षर')),copy=el('button',t('Copy text','पाठ कॉपी करें')),download=el('button',t('Download text','पाठ डाउनलोड करें'));
  for(const button of [bigger,copy,download])button.type='button';bigger.setAttribute('aria-pressed',String(large));bigger.onclick=()=>{large=!large;root.dataset.large=String(large);bigger.setAttribute('aria-pressed',String(large));};
  const status=el('p',null,'fine');status.role='status';status.setAttribute('aria-live','polite');
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(shlokaText(item,lang));if(stamp===revision)status.textContent=t('Text copied.','पाठ कॉपी हुआ।');}catch{if(stamp===revision)status.textContent=t('Copy is unavailable. Use Download text.','कॉपी उपलब्ध नहीं है। पाठ डाउनलोड करें।');}};
  download.onclick=()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+shlokaText(item,lang)],{type:'text/plain;charset=utf-8'})),a=el('a');a.href=url;a.download='shloki-'+item.id+'-'+lang+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);};tools.append(bigger,copy,download);root.append(tools);
  const heading=el('h2',item.title[lang]);heading.id='shloki-title';heading.tabIndex=-1;root.append(heading);
  const verses=el('div',null,'shloki-verses');for(const verse of item.verses){const block=el('section',null,'shloki-verse');if(item.verses.length>1)block.append(el('h3',verse.locator));const script=el('p',verse.sanskrit,'shloki-script');script.lang='sa';script.translate=false;block.append(script);verses.append(block);}root.append(verses);
  const meaning=el('details',null,'shloki-meaning');meaning.open=meaningOpen;meaning.append(el('summary',t('Meaning','भावार्थ')));for(const verse of item.verses){if(item.verses.length>1)meaning.append(el('h3',verse.locator));meaning.append(el('p',verse.meaning[lang]));}root.append(meaning);
  const sources=el('details',null,'shloki-sources');sources.open=sourceOpen;sources.append(el('summary',t('Source','संदर्भ')));const link=el('a',item.source.title);link.href=item.source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);
  // Four-verse groups provide a direct locator for each verse, not just the first.
  if(item.verses.length===4){const links=el('ul');for(const verse of item.verses){const li=el('li'),a=el('a',verse.locator);a.href=item.source.url.replace(/\d+\/$/,verse.locator.split('.').at(-1)+'/');a.target='_blank';a.rel='noopener noreferrer';li.append(a);links.append(li);}sources.append(links);}root.append(sources);
  const index=shlokas.indexOf(item),navigation=el('nav',null,'shloki-tools');navigation.setAttribute('aria-label',t('Shloka navigation','श्लोक नेविगेशन'));
  const previous=el('button',t('Previous','पिछला')),next=el('button',t('Next','अगला')),position=el('span',(index+1)+' / '+shlokas.length,'fine');position.role='status';previous.type=next.type='button';previous.disabled=index===0;next.disabled=index===shlokas.length-1;
  previous.onclick=()=>onChoose(shlokas[index-1].id);next.onclick=()=>onChoose(shlokas[index+1].id);navigation.append(previous,position,next);root.append(navigation,status);
  previous.dataset.shlokiFocus='previous';next.dataset.shlokiFocus='next';
  const focusTarget={select,previous,next}[focusKey];if(focusTarget)(focusTarget.disabled?heading:focusTarget).focus({preventScroll:true});
 }
 return {show};
}
