import {arenas} from './catalogue.mjs';
import {record} from './metrics.js';
import {prepareReaction} from './feedback.mjs?v=20261018-fast';
export function enhanceArena(cast,activeArena){
const $=s=>document.querySelector(s);
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('art-pending');prepareReaction(entry.target);observer.unobserve(entry.target);}},{rootMargin:'240px'});document.querySelectorAll('.art-pending').forEach(card=>observer.observe(card));}else document.querySelectorAll('.art-pending').forEach(card=>{card.classList.remove('art-pending');prepareReaction(card);});
const settings=$('.arena-settings')||document.createElement('details');settings.className='arena-settings';if(!settings.hasChildNodes())settings.innerHTML='<summary>Appearance &amp; vibration</summary><p>Choose light, dark or system appearance in the platform header.</p>';
const feedback=$('.feedback-options');if(feedback.parentElement!==settings){feedback.before(settings);settings.append(feedback);}
$('.hero p').textContent='Public life. Pop culture. Plenty to laugh about.';
$('.hero small').textContent='SATIRE ACROSS THE SPOTLIGHT · JUST FOR FUN';
const navigation=document.createElement('nav');navigation.className='arena-navigation';navigation.setAttribute('aria-label','Choose your arena');navigation.innerHTML='<a href="/satire-arena">All arenas</a>'+arenas.map(a=>a.available===false?'<span aria-disabled="true">'+a.name+' <small>Coming next</small></span>':'<a href="/satire-arena/'+a.id+'"'+(a.id===activeArena?' aria-current="page"':'')+'>'+a.name+'</a>').join('');$('.hero').after(navigation);
$('.lineup-heading h2').textContent=arenas.find(a=>a.id===activeArena).name+' Arena';
document.title='Garland or Roast · '+arenas.find(a=>a.id===activeArena).name+' · Satire Arena';
$('.lineup-heading small').textContent=cast.length+' FICTIONAL CHARACTERS · YOUR MOVE';
const today=$('#arena-today')||document.createElement('section');today.className='notice';if(!today.hasChildNodes())today.innerHTML='<h2>Today in the Arena</h2><p id="daily-joke">Original jokes, fictional characters and genuine yearly reactions.</p><a href="/satire-arena/daily">Daily Satire</a> · <a href="/satire-arena/results">Results &amp; history</a><p id="yesterday-results">Yesterday’s results are loading…</p><p id="enhancement-status" role="status"></p>';if(!today.isConnected)$('.lineup-heading').before(today);
const report=message=>$('#enhancement-status').textContent=message;
function shareNotice(message){report(message);document.dispatchEvent(new CustomEvent('arena-toast',{detail:{message}}));}
async function copyLink(url){
 try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(url);return true;}catch{
  const field=document.createElement('textarea'),previous=document.activeElement;field.value=url;field.setAttribute('aria-label','Link to copy');field.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(field);field.select();let copied=false;
  try{copied=document.execCommand('copy');}catch{}finally{field.remove();previous?.focus({preventScroll:true});}return copied;
 }
}
const board=document.createElement('p');board.id='today-results';$('#yesterday-results').before(board);
for(const c of cast){
 const card=$(`[data-character="${c.id}"]`),body=card.querySelector('.card-body'),p=body.querySelector('p');p.classList.add('daily-punchline');
 const ribbon=card.querySelector('.leader-ribbon');body.insertBefore(ribbon,body.querySelector('.card-meta'));
 const heading=body.querySelector('h2'),words=c.name.split(' '),lead=document.createElement('span');lead.className='character-name-lead';lead.textContent=words.shift();heading.replaceChildren(lead,document.createTextNode(' '+words.join(' ')));
 const links=document.createElement('div');links.className='character-share-links';
 for(const [method,label]of [['native','Share link'],['whatsapp','WhatsApp'],['copy','Copy link']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=async()=>{
  const url=location.origin+'/satire-arena/characters/'+c.id,text=c.name+' — '+p.textContent+' · Fictional parody';
  record('share_selected',method,c.id);
  if(method==='whatsapp'){window.open('https://wa.me/?text='+encodeURIComponent(text+'\n'+url),'_blank','noopener,noreferrer');shareNotice('WhatsApp opened. Send your draft there.');return;}
  if(method==='native'&&navigator.share){try{await navigator.share({title:c.name,text,url});shareNotice('Share handed to your device.');return;}catch(e){if(e.name==='AbortError'){shareNotice('Sharing cancelled.');return;}}}
  if(await copyLink(url)){record('link_copied','copy',c.id);shareNotice('Link copied to clipboard!');}
  else{const field=document.createElement('input');field.type='url';field.readOnly=true;field.value=url;field.setAttribute('aria-label','Copy this character link');report('Automatic copying is unavailable. Select and copy this link:');$('#enhancement-status').append(field);field.focus();field.select();}
 };links.append(button);}body.append(links);
}
// Keep the existing ballot controls and handlers while composing a continuous feed.
for(const c of cast){
 const card=$(`[data-character="${c.id}"]`),body=card.querySelector('.card-body'),stage=card.querySelector('.portrait-stage');
 const hero=document.createElement('a');hero.className='character-hero';hero.href='/satire-arena/characters/'+c.id;hero.setAttribute('aria-label','Biography and punchlines for '+c.name);card.prepend(hero);hero.append(body,stage.querySelector('.portrait'));
 const voting=document.createElement('section');voting.className='character-voting';voting.setAttribute('aria-label','Reaction voting for '+c.name);voting.innerHTML='<div class="reaction-heading"><strong>▥ &nbsp; PICK YOUR REACTION</strong></div>';card.append(voting);voting.append(stage.querySelector('.reactions'));voting.querySelector('.reaction-heading').append(body.querySelector('.card-total'));
 const confirmation=document.createElement('div');confirmation.className='vote-confirmation';const copy=document.createElement('div');copy.className='vote-confirmation-copy';copy.append(body.querySelector('.choice-badge'),body.querySelector('.vote-state'));confirmation.append(copy);card.append(confirmation);
 const menu=document.createElement('details');menu.className='character-share-menu';menu.innerHTML='<summary>Share ↗</summary>';menu.append(body.querySelector('[data-share-character]'),body.querySelector('.character-share-links'));confirmation.append(menu);
 stage.remove();body.querySelector('.card-meta').remove();
}
$('.arena-footer').before($('.score'),today,settings);
const footer=document.createElement('p');footer.innerHTML='<a href="/contact">Report content / feedback</a> · <a href="/satire-arena/editor">Editorial desk</a><br>More free fun: <a href="/daily-spark">Make 24</a> · <a href="/decision-wheel">Decision Wheel</a> · <a href="/moment-studio">Moment Studio</a>';$('.arena-footer').prepend(footer);
async function refresh(){
 try{const r=await fetch('/api/arena-editorial/today',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(data.featured){const a=document.createElement('a');a.href='/satire-arena/posts/'+data.featured.slug;a.textContent=data.featured.title+' — '+data.featured.punchline;$('#daily-joke').replaceChildren(a);}for(const c of data.characters){const p=$(`[data-character="${c.id}"] .daily-punchline`);if(p)p.textContent=c.daily;}}catch{$('#daily-joke').textContent='Enjoy the character Arena. Published jokes are temporarily unavailable.';}
 try{const r=await fetch('/api/satire-arena/results',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();for(const d of data.days){d.characters=d.characters.filter(s=>cast.some(c=>c.id===s.id));d.total=d.characters.reduce((n,c)=>n+c.total,0);}const day=data.days[1];const score=data.days[0],leaders=key=>{const max=Math.max(0,...score.characters.map(c=>c[key]||0));return max?score.characters.filter(c=>c[key]===max).map(c=>cast.find(x=>x.id===c.id)?.name).join(', '):'No reactions yet';};$('#today-results').textContent='Today · '+score.total+' reactions · Most reacted: '+leaders('total')+' · Most applauded: '+leaders('applause')+' · Most laughter: '+leaders('laugh');$('#yesterday-results').textContent=day.total?`Yesterday · ${day.total} recorded reactions · Most reacted: ${day.characters.filter(c=>c.total===day.characters[0].total).map(c=>cast.find(x=>x.id===c.id)?.name).join(', ')}`:'Yesterday · No reactions recorded.';}catch{$('#yesterday-results').textContent='Yesterday’s results are temporarily unavailable.';}
}
refresh();let day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});setInterval(()=>{const next=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});if(!document.hidden&&next!==day){day=next;refresh();}},30000);
}
