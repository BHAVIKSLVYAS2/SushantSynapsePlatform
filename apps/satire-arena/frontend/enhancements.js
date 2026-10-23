import {record} from './metrics.js';
import {prepareReaction} from './feedback.mjs';
export function enhanceArena(cast){
const $=s=>document.querySelector(s);
const cards=document.querySelectorAll('.arena-card');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.remove('art-pending');prepareReaction(entry.target);observer.unobserve(entry.target);}},{rootMargin:'240px'});cards.forEach(card=>observer.observe(card));}else cards.forEach(card=>{card.classList.remove('art-pending');prepareReaction(card);});
const report=message=>$('#enhancement-status').textContent=message;
function shareNotice(message){report(message);document.dispatchEvent(new CustomEvent('arena-toast',{detail:{message}}));}
async function copyLink(url){
 try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(url);return true;}catch{
  const field=document.createElement('textarea'),previous=document.activeElement;field.value=url;field.setAttribute('aria-label','Link to copy');field.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(field);field.select();let copied=false;
  try{copied=document.execCommand('copy');}catch{}finally{field.remove();previous?.focus({preventScroll:true});}return copied;
 }
}
document.querySelector('#cast').addEventListener('click',async event=>{
 const button=event.target.closest('[data-link-method]');if(!button)return;
 const c=cast.find(c=>c.id===button.closest('[data-character]').dataset.character),method=button.dataset.linkMethod,p=$('[data-character="'+c.id+'"] .daily-punchline'),url=location.origin+'/satire-arena/characters/'+c.id,text=c.name+' \u2014 '+p.textContent+' \u00b7 Fictional parody';
 record('share_selected',method,c.id);
 if(method==='whatsapp'){window.open('https://wa.me/?text='+encodeURIComponent(text+'\n'+url),'_blank','noopener,noreferrer');shareNotice('WhatsApp opened. Send your draft there.');return;}
 if(method==='native'&&navigator.share){try{await navigator.share({title:c.name,text,url});shareNotice('Share handed to your device.');return;}catch(error){if(error.name==='AbortError'){shareNotice('Sharing cancelled.');return;}}}
 if(await copyLink(url)){record('link_copied','copy',c.id);shareNotice('Link copied to clipboard!');}else{const field=document.createElement('input');field.type='url';field.readOnly=true;field.value=url;field.setAttribute('aria-label','Copy this character link');report('Automatic copying is unavailable. Select and copy this link:');$('#enhancement-status').append(field);field.focus();field.select();}
});
let editorialDay='',editorialLoading=null,resultsRequest;
const dayKey=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
async function refreshEditorial(){if(editorialLoading||editorialDay===dayKey())return;editorialLoading=(async()=>{try{const r=await fetch('/api/arena-editorial/today',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();if(data.featured){const a=document.createElement('a');a.href='/satire-arena/posts/'+data.featured.slug;a.textContent=data.featured.title+' \u2014 '+data.featured.punchline;$('#daily-joke').replaceChildren(a);}for(const c of data.characters){const p=$('[data-character="'+c.id+'"] .daily-punchline');if(p)p.textContent=c.daily;}editorialDay=dayKey();}catch{$('#daily-joke').textContent='Enjoy the character Arena. Published jokes are temporarily unavailable.';}finally{editorialLoading=null;}})();return editorialLoading;}
async function refreshResults(){refreshEditorial();resultsRequest?.abort();const current=new AbortController();resultsRequest=current;
 try{const r=await fetch('/api/satire-arena/results',{cache:'no-store',signal:current.signal});if(!r.ok)throw Error();const data=await r.json();if(resultsRequest!==current)return;const days=data.days.map(d=>{const characters=d.characters.filter(c=>cast.some(person=>person.id===c.id));return {...d,characters,total:characters.reduce((n,c)=>n+c.total,0)};}),today=days[0],yesterday=days[1];if(!today)throw Error();
 const leaders=(score,key)=>{const max=Math.max(0,...score.characters.map(c=>c[key]||0));return max?score.characters.filter(c=>c[key]===max).map(c=>cast.find(p=>p.id===c.id)?.name).join(', '):'No reactions yet';};
 $('#today-results').textContent='Today \u00b7 '+today.total+' reactions \u00b7 Most reacted: '+leaders(today,'total')+' \u00b7 Most applauded: '+leaders(today,'applause')+' \u00b7 Most laughter: '+leaders(today,'laugh');$('#yesterday-results').textContent=yesterday?.total?'Yesterday \u00b7 '+yesterday.total+' recorded reactions \u00b7 Most reacted: '+leaders(yesterday,'total'):'Yesterday \u00b7 No reactions recorded.';
 }catch(error){if(error.name!=='AbortError'&&resultsRequest===current){$('#today-results').textContent='Today\u2019s results are temporarily unavailable.';$('#yesterday-results').textContent='Yesterday\u2019s results are temporarily unavailable.';}}
}
return {refreshResults};
}
