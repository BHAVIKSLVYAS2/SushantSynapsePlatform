import {requestJson} from '/shared/http.mjs';
import {prepareSound,playSound,stopSound} from './sound.mjs';
import {prepareReaction,playReaction,stopVibration} from './feedback.mjs';

// One browser-ballot lifecycle for arena feeds and individual character pages.
export function createReactionController(options){
 const state={snapshot:null,busy:false,saving:null,syncError:true,lastLoaded:0};let loading=null,revision=0;
 const changed=()=>options.change?.(state);
 const request=(path='',settings={})=>requestJson('/api/satire-arena'+path,settings);
 async function load(){if(loading)return loading;const version=revision;loading=(async()=>{try{const fresh=await request(options.arena?'?arena='+encodeURIComponent(options.arena)+'&summary=1':'');if(version!==revision)return;state.snapshot={...fresh,characters:fresh.characters.filter(c=>!options.ids||options.ids.includes(c.id))};state.syncError=false;state.lastLoaded=Date.now();changed();options.synced?.(state);}catch(error){if(version!==revision)return;state.syncError=true;changed();options.error?.(error,'load');}finally{loading=null;}})();return loading;}
 async function vote(id,reaction){if(state.busy||state.syncError||!state.snapshot)return;const score=state.snapshot.characters.find(c=>c.id===id);if(!score)return;
  const previous=structuredClone(state.snapshot),round=previous.round;
  if(options.sound?.()){prepareSound();playSound(reaction);}
  revision++;state.busy=true;state.saving=id;if(score.selected!==reaction){if(score.selected)score[score.selected]=Math.max(0,(score[score.selected]||0)-1);score[reaction]=(score[reaction]||0)+1;score.selected=reaction;}changed();options.start?.(id,reaction);
  const target=options.target(id),prepared=prepareReaction(target).catch(()=>{});
  try{await request('/'+id+'/vote',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reaction,round})});state.saving=null;changed();await prepared;playReaction(target,reaction,{haptics:!!options.haptics?.()});options.confirmed?.(id,reaction);if(loading)await loading;await load();if(!state.syncError)options.saved?.(id,reaction);}
  catch(error){state.snapshot=previous;state.saving=null;changed();if(loading)await loading;await load();options.error?.(error,'vote');}
  finally{state.busy=false;state.saving=null;changed();}
 }
 async function remove(){if(state.busy)return;state.busy=true;changed();try{await request('/mine',{method:'DELETE',headers:{'X-Arena-Confirm':'DELETE'}});if(loading)await loading;await load();return true;}finally{state.busy=false;changed();}}
 const press=event=>{const button=event.target.closest('[data-reaction]');if(button&&!button.disabled&&options.root.contains(button)&&options.sound?.())prepareSound();};
 const key=event=>{if(['Enter',' '].includes(event.key))press(event);};
 const visibility=()=>{if(document.hidden){stopSound();stopVibration();}else if(!state.busy)load();};
 const mute=()=>{if(!options.sound?.())stopSound();if(!options.haptics?.())stopVibration();};
 options.root.addEventListener('pointerdown',press);options.root.addEventListener('keydown',key);options.root.addEventListener('change',mute);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stopSound);
 const timer=setInterval(()=>{if(!document.hidden&&!state.busy)load();},30000);
 return {state,request,load,vote,remove,dispose(){clearInterval(timer);options.root.removeEventListener('pointerdown',press);options.root.removeEventListener('keydown',key);options.root.removeEventListener('change',mute);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stopSound);}};
}
