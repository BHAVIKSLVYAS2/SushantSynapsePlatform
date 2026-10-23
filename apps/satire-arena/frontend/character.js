import {reactions} from './cast.mjs';
import {createReactionController} from './reaction-controller.mjs';
import {prepareReaction} from './feedback.mjs';
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
 const buttons=[...root.querySelectorAll('[data-reaction]')],status=root.querySelector('#character-vote-status'),total=root.querySelector('#character-total'),sound=root.querySelector('#character-sound'),refresh=root.querySelector('#character-refresh');
 let snapshot=null,busy=false,offline=true;
 const score=()=>snapshot?.characters.find(c=>c.id===root.dataset.character);
 function render(){const current=score();for(const button of buttons){button.disabled=busy||offline||!current;button.setAttribute('aria-pressed',String(current?.selected===button.dataset.reaction));button.querySelector('strong').textContent=current?current[button.dataset.reaction]||0:'\u2014';}total.textContent=current?reactions.reduce((n,r)=>n+(current[r.id]||0),0)+' reactions this year':'Scores unavailable';refresh.disabled=busy;root.querySelector('.file-voting').setAttribute('aria-busy',String(busy));}
 function selectedMessage(){const selected=reactions.find(r=>r.id===score()?.selected);return selected?'You chose '+selected.name+'. Tap another to change your yearly pick.':'Your move. One changeable pick for this year.';}
 const controller=createReactionController({root,ids:[root.dataset.character],target:()=>root.querySelector('.file-hero'),sound:()=>sound.checked,haptics:()=>false,
  change:state=>{snapshot=state.snapshot;busy=state.busy;offline=state.syncError;render();},synced:()=>status.textContent=selectedMessage(),start:()=>status.textContent='Saving your pick\u2026',saved:()=>status.textContent='Saved! '+selectedMessage(),
  error:(error,phase)=>{status.textContent=phase==='load'?(snapshot?'Showing last synced scores. ':'')+error.message:error.status===409?'A new yearly round has started. Scores refreshed; choose again.':error.status===428?'Enable cookies, then refresh scores before reacting.':error.message+' Check the refreshed scores before trying again.';}
 });
 for(const button of buttons)button.onclick=()=>controller.vote(root.dataset.character,button.dataset.reaction);
 refresh.onclick=()=>controller.load();sound.onchange=()=>{sound.parentElement.lastChild.textContent=sound.checked?' Sound on':' Sound off';};
 controller.load();
}
