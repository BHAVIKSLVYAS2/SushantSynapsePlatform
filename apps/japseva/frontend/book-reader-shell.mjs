import {readPreference,writePreference,mountReadingSettings} from './reader-preferences.mjs';
import {soundRows} from './learning-copy.mjs';
import {capturePage,turnPage,cancelPageTurn} from './book-motion.mjs';
const words={en:{contents:'Contents',previous:'Previous',next:'Next',reading:'Reading',chapter:'Chapter',corner:'Tap corner to turn',previousChapter:'Previous chapter',nextChapter:'Next chapter',previousReading:'Previous reading',nextReading:'Next reading'},hi:{contents:'विषय-सूची',previous:'पिछला',next:'अगला',reading:'पाठ',chapter:'खंड',corner:'पन्ना पलटने के लिए कोना दबाएँ',previousChapter:'पिछला खंड',nextChapter:'अगला खंड',previousReading:'पिछला पाठ',nextReading:'अगला पाठ'},gu:{contents:'વિષયસૂચિ',previous:'પાછળ',next:'આગળ',reading:'પાઠ',chapter:'ખંડ',corner:'પાનું ફેરવવા ખૂણો દબાવો',previousChapter:'પાછલો ખંડ',nextChapter:'આગળનો ખંડ',previousReading:'પાછલો પાઠ',nextReading:'આગળનો પાઠ'}};
const make=(tag,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;return n;};
export function mountBookReader({book,toolbar,library,modeLabel,scriptLabel,ending,onBack,onAdvance}){
 const stage=make('div','book-reader-stage'),scroll=make('div','book-reader-scroll'),corner=make('button','book-page-corner'),hint=make('span','book-corner-hint'),nav=make('nav','book-page-navigation'),previous=make('button'),next=make('button'),status=make('span'),kind=make('small'),position=make('span'),contents=make('button','book-contents');
 let row=null,language='en',matches=[],swipe=null,scriptHome=null,boundaries;
 const controlRow=make('div','book-control-row'),availability=make('p','book-audio-unavailable'),chapterPosition=make('span'),previousTarget=make('small'),nextTarget=make('small');
 controlRow.append(modeLabel);toolbar.append(controlRow);ending.hidden=true;scroll.append(ending);
 // Keep an independent position for each chapter, including across browser visits.
 let saveTimer,restoreFrame=0,restoring=false,positionKey=null,pendingTurn=null;
 const settings=mountReadingSettings(book,toolbar,soundRows,()=>{cancelPageTurn(stage);const max=scroll.scrollHeight-scroll.clientHeight,ratio=max>0?scroll.scrollTop/max:0;return ()=>{scroll.scrollTop=ratio*Math.max(0,scroll.scrollHeight-scroll.clientHeight);savePlace();};});
 function keyFor(active){return active.m.id+':'+(active.reader?.navigation().position??0);}
 function textGeometry(){const text=row?.reader?.element.querySelector('.chapter-verse-pairs:not([hidden]),.chapter-text:not([hidden])')||row?.primaryText;if(!text?.isConnected)return null;return {start:text.getBoundingClientRect().top-scroll.getBoundingClientRect().top+scroll.scrollTop,height:text.getBoundingClientRect().height};}
 function savePlace(){clearTimeout(saveTimer);if(!positionKey||restoring||stage.hidden)return;const text=textGeometry(),ok=writePreference('place:'+positionKey,{top:scroll.scrollTop,max:Math.max(0,scroll.scrollHeight-scroll.clientHeight),width:scroll.clientWidth,offset:text?scroll.scrollTop-text.start:null,textHeight:text?.height});settings.setSaved(ok);}
 function restorePlace(){cancelAnimationFrame(restoreFrame);clearTimeout(saveTimer);positionKey=keyFor(row);const saved=readPreference('place:'+positionKey);restoring=true;scroll.scrollTop=0;restoreFrame=requestAnimationFrame(()=>{restoreFrame=requestAnimationFrame(()=>{if(saved&&Number.isFinite(saved.top)&&saved.top>=0){const max=Math.max(0,scroll.scrollHeight-scroll.clientHeight),text=textGeometry();if(text&&Number.isFinite(saved.offset)&&saved.offset>=0&&saved.textHeight>0){scroll.scrollTop=text.start+saved.offset*text.height/saved.textHeight;}else scroll.scrollTop=saved.width===scroll.clientWidth?saved.top:(saved.max>0?saved.top/saved.max*max:0);}restoring=false;savePlace();});});}
 scroll.addEventListener('scroll',()=>{if(restoring)return;clearTimeout(saveTimer);saveTimer=setTimeout(savePlace,180);},{passive:true});
 window.addEventListener('pagehide',savePlace);document.addEventListener('visibilitychange',()=>{if(document.hidden)savePlace();});
 stage.addEventListener('japseva-chapter-will-change',event=>{savePlace();cancelPageTurn(stage);pendingTurn={snapshot:capturePage(library),direction:event.detail?.direction||1};});
 function restoreScript(){if(scriptHome){const {label,parent,next}=scriptHome;if(parent)parent.insertBefore(label,next?.parentNode===parent?next:null);else label.remove();scriptHome=null;}}
 corner.type=previous.type=next.type=contents.type='button';corner.append(make('span'));corner.firstChild.textContent='↗';corner.firstChild.setAttribute('aria-hidden','true');status.role='status';status.append(kind,position,chapterPosition);nav.append(previous,status,next);stage.append(scroll,hint,corner);book.append(stage,nav);stage.hidden=nav.hidden=true;toolbar.prepend(contents);contents.onclick=onBack;
 function hasChapter(direction){
  const chapter=row?.reader?.navigation(),target=chapter?.position+direction;
  return !!chapter&&target>=0&&target<chapter.total;
 }
 function paint(nextLanguage=language,active=row,filtered=matches,options=boundaries){
  language=nextLanguage;row=active;matches=filtered;boundaries=options;settings.translate(language);
  const t=words[language]||words.en;
  const {atEnd,startLabel,endLabel}=boundaries;
  contents.textContent='← '+t.contents;hint.textContent=t.corner;
  availability.hidden=atEnd||!!row?.audio;availability.textContent={en:'Audio unavailable',hi:'ऑडियो उपलब्ध नहीं',gu:'ઑડિયો ઉપલબ્ધ નથી'}[language];
  previous.replaceChildren(t.previous,previousTarget);next.replaceChildren(t.next,nextTarget);
  const readingIndex=matches.indexOf(row),chapter=row?.reader?.navigation();
  kind.textContent=atEnd?'':t.reading;position.textContent=atEnd?'':readingIndex<0?'—':(readingIndex+1)+' / '+matches.length;
  chapterPosition.textContent=chapter&&!atEnd?t.chapter+' '+(chapter.position+1)+' / '+chapter.total:'';
  const previousChapter=!atEnd&&hasChapter(-1),nextChapter=!atEnd&&hasChapter(1);
  const previousLabel=atEnd?t.previousReading:previousChapter?t.previousChapter:readingIndex>0?t.previousReading:startLabel;
  const nextLabel=nextChapter?t.nextChapter:readingIndex<0||readingIndex===matches.length-1?endLabel:t.nextReading;
  previousTarget.textContent=atEnd?row.m.names[language]:previousChapter?'':matches[readingIndex-1]?.m.names[language]||startLabel;
  nextTarget.textContent=atEnd||nextChapter||readingIndex<0?'':matches[readingIndex+1]?.m.names[language]||endLabel;
  previous.setAttribute('aria-description',previousTarget.textContent);
  next.setAttribute('aria-description',nextTarget.textContent);
  previous.disabled=!row;
  next.disabled=atEnd||!row||(!nextChapter&&readingIndex<0);
  corner.disabled=next.disabled;hint.hidden=next.disabled;
  previous.setAttribute('aria-label',previousLabel);
  next.setAttribute('aria-label',nextLabel);
  corner.setAttribute('aria-label',next.getAttribute('aria-label'));
  nav.setAttribute('aria-label',t.reading);book.classList.toggle('book-has-chapters',!!chapter);
 }
 function step(direction){
  if(!row||(direction>0?next.disabled:previous.disabled))return;
  book.classList.add('book-has-turned');
  if(!boundaries.atEnd&&hasChapter(direction))row.reader.move(row.reader.navigation().position+direction);
  else onAdvance(direction);
 }
 previous.onclick=()=>step(-1);next.onclick=corner.onclick=()=>step(1);
 stage.addEventListener('japseva-chapter-change',()=>{paint();restorePlace();if(pendingTurn){const turn=pendingTurn;pendingTurn=null;turnPage(library,turn.direction,turn.snapshot);}});
 scroll.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('button,input,select,a,summary'))return;swipe={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
 scroll.addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;swipe=null;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.8&&!getSelection().toString())step(dx<0?1:-1);},{passive:true});
 function clearPlace(){cancelAnimationFrame(restoreFrame);clearTimeout(saveTimer);restoring=false;positionKey=null;pendingTurn=null;}
 function showEnding(show){ending.hidden=!show;toolbar.hidden=library.hidden=show;availability.hidden=show||!!row?.audio;}
 return {paint,save:savePlace,capture(){return capturePage(library);},
  open(active,direction,snapshot){settings.close();restoreScript();row=active;showEnding(false);const label=active.reader?.scriptControl()||scriptLabel;scriptHome={label,parent:label.parentNode,next:label.nextSibling};label.hidden=false;controlRow.append(label);scroll.append(toolbar,availability,library);stage.hidden=nav.hidden=false;restorePlace();document.body.classList.add('japseva-book-open');if(snapshot)turnPage(library,direction,snapshot);},
  openEnd(){savePlace();clearPlace();const snapshot=capturePage(library);settings.close();showEnding(true);scroll.scrollTop=0;if(snapshot)turnPage(ending,1,snapshot);},
  close(){savePlace();clearPlace();settings.close();cancelPageTurn(stage);restoreScript();showEnding(false);stage.hidden=nav.hidden=true;book.insertBefore(library,stage);document.body.classList.remove('japseva-book-open');},
  step,scroll
 };
}
