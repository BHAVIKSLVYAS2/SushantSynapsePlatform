import {RevealBudget} from './reveal-budget.mjs';
import {allowAds,prepareReward} from './ads.mjs';
import {adConfig} from './ad-config.mjs';
import {mountCaptcha} from './captcha.mjs';
const $=selector=>document.querySelector(selector),stream=$('#stream'),cards=new Map();
// Some mobile browsers latch a gesture to the inner feed at its boundary.
// Hand off only the outward movement; keep native scrolling inside the feed.
function handoff(delta){
 const page=document.scrollingElement;if(!page||!delta)return false;
 const atStart=stream.scrollTop<=1,atEnd=stream.scrollHeight-stream.clientHeight-stream.scrollTop<=1;
 if(!(delta<0&&atStart||delta>0&&atEnd))return false;
 const canScroll=delta<0?page.scrollTop>0:page.scrollTop+page.clientHeight<page.scrollHeight-1;
 if(!canScroll)return false;window.scrollBy({top:delta,behavior:'instant'});return true;
}
stream.addEventListener('wheel',event=>{if(!event.ctrlKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX)){const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stream.clientHeight:1);if(handoff(delta))event.preventDefault();}},{passive:false});
let pan=null;
stream.addEventListener('touchstart',event=>{const touch=event.touches[0];pan=event.touches.length===1?{x:touch.clientX,y:touch.clientY,lastY:touch.clientY}:null;},{passive:true});
stream.addEventListener('touchmove',event=>{if(!pan||event.touches.length!==1){pan=null;return;}const touch=event.touches[0],vertical=pan.y-touch.clientY,horizontal=pan.x-touch.clientX,delta=pan.lastY-touch.clientY;pan.lastY=touch.clientY;if(event.cancelable&&Math.abs(vertical)>8&&Math.abs(vertical)>Math.abs(horizontal)&&handoff(delta))event.preventDefault();},{passive:false});
stream.addEventListener('touchend',()=>pan=null,{passive:true});stream.addEventListener('touchcancel',()=>pan=null,{passive:true});
const node=(tag,text='',className='')=>{const element=document.createElement(tag);element.textContent=text;element.className=className;return element;};
let saved;try{saved=JSON.parse(sessionStorage.getItem('synapse-confession-reveals'));}catch{}
const budget=new RevealBudget(saved);let fetching=false,posting=false,queue=Promise.resolve(),timer,stopped=false;
function updateBudget(){const remaining=budget.remaining;$('#reveal-counter').textContent=remaining+' reveal'+(remaining===1?'':'s')+' left in this set';try{sessionStorage.setItem('synapse-confession-reveals',JSON.stringify(budget.snapshot()));}catch{}}
updateBudget();
async function api(path='',options={}){const response=await fetch('/api/confessions'+path,{cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});let data;try{data=await response.json();}catch{throw Error('The confession box is temporarily unavailable.');}if(!response.ok)throw Error(data.error||'Please try again.');return data;}
async function unlock(){
 const reward=await prepareReward();if(reward.status==='unavailable'){budget.grant();updateBudget();return true;}
 const dialog=$('#reward-dialog');dialog.showModal();const choice=await new Promise(resolve=>{const done=value=>{dialog.removeEventListener('close',closed);$('#watch-ad').onclick=null;$('#skip-ad').onclick=null;if(dialog.open)dialog.close();resolve(value);},closed=()=>done(false);$('#watch-ad').onclick=()=>done(true);$('#skip-ad').onclick=()=>done(false);dialog.addEventListener('close',closed);});
 if(!choice){reward.cancel();return false;}let result;try{result=await reward.watch();}catch{reward.cancel();return false;}if(result?.status==='unavailable'){budget.grant();updateBudget();return true;}if(result?.status!=='granted'){$('#feed-status').textContent='Ad closed before the reward. You can try again when you’re ready.';return false;}budget.grant();updateBudget();return true;
}
function paint(canvas){const rect=canvas.parentElement.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));const context=canvas.getContext('2d'),style=getComputedStyle(document.body);context.fillStyle=style.getPropertyValue('--ui-soft').trim()||getComputedStyle(canvas.parentElement).backgroundColor;context.fillRect(0,0,canvas.width,canvas.height);context.strokeStyle=style.getPropertyValue('--ui-edge').trim();context.lineWidth=ratio;for(let i=-canvas.height;i<canvas.width;i+=24*ratio){context.beginPath();context.moveTo(i,0);context.lineTo(i+canvas.height,canvas.height);context.stroke();}canvas.dataset.ratio=String(ratio);}
function makeCard(meta,{sample,own}={}){
 const article=node('article','','confession');article.dataset.id=meta.id;article.classList.toggle('is-own',!!own);
 const heading=node('div','','confession-meta');const time=new Date(meta.createdAt);heading.append(node('span',sample?'Example · not a real submission':own?'You · shared with everyone':'Someone shared'),node('time',time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})));heading.lastChild.dateTime=meta.createdAt;
 const area=node('div','','scratch-area'),message=node('p','','confession-message'),canvas=document.createElement('canvas'),cover=node('div','','cover-copy');canvas.setAttribute('aria-hidden','true');message.hidden=true;cover.append(node('span',String.fromCodePoint(8596),'scratch-gesture'),node('strong','Scratch here to reveal'),node('small','Rub sideways to uncover'));area.append(message,canvas,cover);
 const actions=node('div','','card-actions'),reveal=node('button','Reveal instead'),progress=node('span','','scratch-progress');progress.hidden=true;progress.setAttribute('aria-hidden','true');reveal.type='button';reveal.className='reveal-alternative';reveal.setAttribute('aria-label','Reveal instead: confession from '+time.toLocaleString('en-IN'));actions.append(reveal,progress);article.append(heading,area,actions);stream.append(article);cards.set(meta.id,{article,sample,own,version:meta.version||0});
 let loaded=false,complete=false,busy=false,drawing=false,last=null,start=null,points=new Set(),pendingPoints=[];
 function feedback(){const amount=Math.min(1,points.size/35);canvas.style.opacity=String(1-amount*.5);area.style.setProperty('--scratch-progress',amount*100+'%');progress.textContent=Math.round(amount*100)+'% uncovered';progress.hidden=complete||!loaded;}
 function finish(focus=false){complete=true;drawing=false;canvas.hidden=true;cover.hidden=true;area.classList.remove('is-scratching');reveal.hidden=true;progress.hidden=true;message.hidden=false;message.setAttribute('tabindex','-1');area.style.height='';if(focus)message.focus({preventScroll:true});}
 async function load(){if(loaded)return true;if(!sample&&!own){if(budget.needsAd(meta.id)&&!await unlock())return false;const data=await api('/'+meta.id);message.textContent=data.message;budget.use(meta.id);updateBudget();}else message.textContent=sample||own;loaded=true;message.hidden=false;return true;}
 async function activate(immediate){if(busy||complete)return;busy=true;reveal.disabled=true;area.setAttribute('aria-busy','true');cover.querySelector('strong').textContent='Revealing...';try{const work=queue.then(async()=>{if(!immediate)area.style.height=area.getBoundingClientRect().height+'px';if(!await load())return;if(immediate)finish(true);else{area.classList.add('is-scratching');paint(canvas);feedback();const active=drawing;drawing=true;for(const point of pendingPoints){if(complete)break;erase(point);}drawing=active&&!complete;pendingPoints=[];}});queue=work.catch(()=>{});await work;}catch(error){$('#feed-status').textContent=error.message;}finally{busy=false;reveal.disabled=false;area.setAttribute('aria-busy','false');cover.querySelector('strong').textContent='Scratch here to reveal';if(!loaded){pendingPoints=[];area.style.height='';}}}
 reveal.onclick=()=>activate(true);
 function erase(event){if(!drawing||complete)return;cover.hidden=true;const bounds=canvas.getBoundingClientRect(),ratio=Number(canvas.dataset.ratio),x=(event.clientX-bounds.left)*ratio,y=(event.clientY-bounds.top)*ratio,context=canvas.getContext('2d');if(x<0||y<0||x>canvas.width||y>canvas.height){last=null;return;}context.globalCompositeOperation='destination-out';context.lineWidth=42*ratio;context.lineCap='round';context.lineJoin='round';context.beginPath();context.moveTo(last?.x??x,last?.y??y);context.lineTo(x,y);context.stroke();context.globalCompositeOperation='source-over';last={x,y};points.add(Math.floor(x/canvas.width*16)+','+Math.floor(y/canvas.height*10));feedback();if(points.size>=35)finish();}
 function scratchPoint(point){if(loaded)erase(point);else{if(pendingPoints.length<400)pendingPoints.push({clientX:point.clientX,clientY:point.clientY});if(!busy)activate(false);}}
 canvas.onpointerdown=event=>{if(complete||event.isPrimary===false||event.button>0)return;drawing=true;last=null;pendingPoints=[];start={x:event.clientX,y:event.clientY,touch:event.pointerType==='touch',horizontal:false};canvas.setPointerCapture(event.pointerId);if(!start.touch)scratchPoint(event);};
 canvas.onpointermove=event=>{if(!drawing||!start)return;if(start.touch&&!start.horizontal){const x=Math.abs(event.clientX-start.x),y=Math.abs(event.clientY-start.y);if(y>8&&y>x){drawing=false;last=null;return;}if(x<4||x<y)return;start.horizontal=true;}const events=event.getCoalescedEvents?.();for(const point of events?.length?events:[event])scratchPoint(point);};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drawing=false;last=null;start=null;};
 const resize=new ResizeObserver(()=>{if(!complete){points.clear();paint(canvas);feedback();}});resize.observe(area);article.cleanup=()=>resize.disconnect();paint(canvas);
 if(!sample&&!own){const report=node('button','Report','report');report.type='button';report.onclick=async()=>{report.disabled=true;try{await api('/'+meta.id+'/report',{method:'POST',body:'{}'});article.cleanup();article.remove();cards.delete(meta.id);$('#feed-status').textContent='Reported and hidden for review. Thank you.';}catch(error){report.disabled=false;$('#feed-status').textContent=error.message;}};actions.append(report);}
 // Own submissions use the same scratch cover; their text stays in this tab.
 return article;
}
async function refresh(){if(fetching)return;fetching=true;$('#refresh').disabled=true;try{const data=await api(),nearBottom=stream.scrollHeight-stream.scrollTop-stream.clientHeight<90;let added=0;const ids=new Set(data.items.map(item=>item.id));for(const [id,card]of cards)if(!card.sample&&!ids.has(id)&&(!card.own||card.version<=(data.version||0))){card.article.cleanup();card.article.remove();cards.delete(id);}for(const item of data.items){if(!cards.has(item.id)){makeCard(item);added++;}}
 $('#empty').hidden=cards.size>0;$('#feed-status').textContent=data.items.length?data.items.length+' shared confessions · refreshed just now':'A quiet moment. Leave a thought below.';$('#moderation').hidden=!data.canModerate;if(nearBottom&&added)stream.scrollTop=stream.scrollHeight;else if(added){$('#new-messages').style.top=(stream.offsetTop+8)+'px';$('#new-messages').hidden=false;$('#new-messages').textContent='See new confessions ↓';}
 }catch(error){$('#feed-status').textContent=error.message+' Your unsent draft is still here.';}finally{fetching=false;$('#refresh').disabled=false;if(!stopped)timer=setTimeout(()=>{if(!document.hidden)refresh();else timer=setTimeout(refresh,30000);},5000);}}
 $('#refresh').onclick=()=>{clearTimeout(timer);refresh();};$('#new-messages').onclick=()=>{stream.scrollTop=stream.scrollHeight;$('#new-messages').hidden=true;stream.focus({preventScroll:true});};
 function updateCounter(event){
  const field=$('#message');let characters=[...field.value];if(characters.length>600&&!event?.isComposing){field.value=characters.slice(0,600).join('');characters=[...field.value];}
  const count=characters.length,near=count>=540;$('#character-count').textContent=count+' / 600'+(count>=600?' · Limit reached':near?' · '+(600-count)+' left':'');
  $('#character-count').classList.toggle('near-limit',near);field.setCustomValidity(count>600?'Keep your confession within 600 characters.':'');
 }
 $('#message').oninput=updateCounter;$('#message').addEventListener('compositionend',()=>updateCounter());
 // Keep actions above the visible keyboard without fixing the composer to the viewport.
 let keyboardFrame;
 function keepComposerVisible(){
  cancelAnimationFrame(keyboardFrame);keyboardFrame=requestAnimationFrame(()=>{
   if(!matchMedia('(max-width:768px)').matches||!$('#composer').contains(document.activeElement))return;
   const viewport=window.visualViewport,bottom=viewport?viewport.offsetTop+viewport.height:innerHeight;
   const actions=$('.composer-actions').getBoundingClientRect();if(actions.bottom>bottom-12)window.scrollBy({top:actions.bottom-bottom+12,behavior:'instant'});
  });
 }
 window.visualViewport?.addEventListener('resize',keepComposerVisible);
 $('#composer').addEventListener('focusin',keepComposerVisible);
 const captcha=mountCaptcha({api,form:$('#composer'),message:$('#message')});
 $('#composer').onsubmit=async event=>{event.preventDefault();if(posting)return;posting=true;$('#post').disabled=true;const draft=$('#message').value;let sent=false,success=false;try{const check=await captcha.values();if(!check)return;captcha.lock(true);sent=true;const result=await api('',{method:'POST',body:JSON.stringify({message:draft,...check})});success=true;makeCard(result,{own:draft});$('#empty').hidden=true;stream.scrollTop=stream.scrollHeight;if($('#message').value===draft)$('#message').value='';$('#message').oninput();$('#post-status').textContent='Shared with everyone. Other browsers will see your confession when their stream refreshes.';}catch(error){$('#post-status').textContent=error.message;}finally{if(sent)captcha.reset({collapse:success});captcha.lock(false);posting=false;$('#post').disabled=false;}};
 $('#samples').onclick=()=>{for(const [i,text]of ['I rehearse saying “you too” and still say it to the waiter who says enjoy your food.','I keep a tiny list of kind things people have said to me.','I bought the birthday cake a day early. There may be a slice missing.'].entries())makeCard({id:'sample-'+i,createdAt:new Date().toISOString()},{sample:text});$('#empty').hidden=true;stream.scrollTop=0;};
 $('#allow-ads').closest('label').hidden=!adConfig.enabled;
 $('#allow-ads').onchange=()=>allowAds($('#allow-ads').checked);
 $('#load-review').onclick=async()=>{try{const data=await api('/moderation');$('#review-items').replaceChildren();for(const item of data.items){const article=node('article'),text=node('p',item.message),status=node('small',item.status+' · expires '+new Date(item.expiresAt).toLocaleDateString('en-IN'));article.append(status,text);for(const action of ['approve','remove']){const button=node('button',action==='approve'?'Approve':'Remove');button.type='button';button.onclick=async()=>{button.disabled=true;try{await api('/moderation/'+item.id,{method:'POST',body:JSON.stringify({action})});article.remove();$('#review-status').textContent='Confession '+(action==='approve'?'approved.':'removed.');clearTimeout(timer);await refresh();}catch(error){button.disabled=false;$('#review-status').textContent=error.message;}};article.append(button);}$('#review-items').append(article);}$('#review-status').textContent=data.items.length+' entries in the review window.';}catch(error){$('#review-status').textContent=error.message;}};
 window.addEventListener('pagehide',()=>{stopped=true;clearTimeout(timer);});window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;refresh();}});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!fetching){clearTimeout(timer);refresh();}});refresh();
