import {reactions} from './catalogue.mjs';
import {prepareSound,playSound,stopSound} from './sound.mjs?v=20261018-playful';
import {playReaction,prepareReaction} from './feedback.mjs?v=20261018-fast';

const root=document.querySelector('.character-file');
if(root){
 prepareReaction(root.querySelector('.file-hero')).catch(()=>{});
 const comedy=root.querySelector('[data-comedy-lines]');
 if(comedy){
  let lines=[];try{lines=JSON.parse(comedy.dataset.comedyLines);}catch{}
  if(Array.isArray(lines)&&lines.length&&lines.every(line=>typeof line==='string')){
   const line=comedy.querySelector('[data-comedy-line]'),take=comedy.querySelector('[data-comedy-take]'),message=comedy.querySelector('[data-comedy-status]'),copy=comedy.querySelector('[data-comedy-copy]');let index=0,copying=false;
   comedy.querySelector('[data-comedy-controls]').hidden=false;
   comedy.querySelector('[data-comedy-next]').onclick=()=>{index=(index+1)%lines.length;line.textContent=lines[index];take.textContent=String(index+1).padStart(2,'0');message.textContent='';comedy.querySelector('.file-copy-field')?.remove();};
   copy.onclick=async()=>{
    if(copying)return;copying=true;copy.disabled=true;
    const selected=index,text=lines[index]+' — '+comedy.dataset.comedyName+' · Fictional satire · Sushant Synapse';let copied=false;
    try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(text);copied=true;}catch{
     const field=document.createElement('textarea');field.value=text;field.readOnly=true;field.className='file-copy-field';field.setAttribute('aria-label','Copy this fictional punchline');comedy.append(field);field.select();
     try{copied=document.execCommand('copy');}catch{}
     if(copied)field.remove();
    }finally{copying=false;copy.disabled=false;}
    if(selected===index)message.textContent=copied?'Punchline copied. Pass the laugh along.':'Select and copy the punchline below.';
   };
  }
 }
 const api='/api/satire-arena',buttons=[...root.querySelectorAll('[data-reaction]')],status=root.querySelector('#character-vote-status'),total=root.querySelector('#character-total'),sound=root.querySelector('#character-sound'),refresh=root.querySelector('#character-refresh');
 let snapshot=null,busy=false,loading=null,revision=0,offline=true;
 async function request(path='',options={}){const response=await fetch(api+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),...options});const data=response.status===204?null:await response.json().catch(()=>null);if(!response.ok){const error=Error(data?.error||'Scores could not load. Please try again.');error.status=response.status;throw error;}return data;}
 const score=()=>snapshot?.characters.find(c=>c.id===root.dataset.character);
 function render(){const current=score();for(const button of buttons){button.disabled=busy||offline||!current;button.setAttribute('aria-pressed',String(current?.selected===button.dataset.reaction));button.querySelector('strong').textContent=current?current[button.dataset.reaction]||0:'—';}total.textContent=current?reactions.reduce((n,r)=>n+(current[r.id]||0),0)+' reactions this year':'Scores unavailable';refresh.disabled=busy;root.querySelector('.file-voting').setAttribute('aria-busy',String(busy));}
 function selectedMessage(){const selected=reactions.find(r=>r.id===score()?.selected);return selected?'You chose '+selected.name+'. Tap another to change your yearly pick.':'Your move. One changeable pick for this year.';}
 async function load(){if(loading)return loading;const version=revision;loading=(async()=>{try{const data=await request();if(version!==revision)return;snapshot=data;offline=false;render();status.textContent=selectedMessage();}catch(e){if(version!==revision)return;offline=true;render();status.textContent=(snapshot?'Showing last synced scores. ':'')+e.message;}finally{loading=null;}})();return loading;}
 for(const button of buttons){
  const unlock=()=>{if(!button.disabled&&sound.checked)prepareSound();};button.addEventListener('pointerdown',unlock);button.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))unlock();});
  button.onclick=async()=>{
   if(busy||offline||!score())return;
   const reaction=button.dataset.reaction,previous=structuredClone(snapshot),round=snapshot.round;
   if(sound.checked){prepareSound();playSound(reaction);}
   const current=score();if(current.selected!==reaction){if(current.selected)current[current.selected]=Math.max(0,(current[current.selected]||0)-1);current[reaction]=(current[reaction]||0)+1;current.selected=reaction;}
   revision++;busy=true;render();status.textContent='Saving your pick…';const hero=root.querySelector('.file-hero'),prepared=prepareReaction(hero).catch(()=>{});
   try{await request('/'+root.dataset.character+'/vote',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({round,reaction})});await prepared;playReaction(hero,reaction,{haptics:false});if(loading)await loading;await load();if(!offline)status.textContent='Saved! '+selectedMessage();}
   catch(e){snapshot=previous;render();if(loading)await loading;await load();status.textContent=e.status===409?'A new yearly round has started. Scores refreshed; choose again.':e.status===428?'Enable cookies, then refresh scores before reacting.':e.message+' Check the refreshed scores before trying again.';}
   finally{busy=false;render();}
  };
 }
 refresh.onclick=()=>load();sound.onchange=()=>{sound.parentElement.lastChild.textContent=sound.checked?' Sound on':' Sound off';if(!sound.checked)stopSound();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();else if(!busy)load();});window.addEventListener('pagehide',stopSound);
 setInterval(()=>{if(!document.hidden&&!busy)load();},30000);
 load();
}
