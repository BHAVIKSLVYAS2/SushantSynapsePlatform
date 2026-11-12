import {read,write,command} from './storage.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function audioPractice(audio,mantraId,onSaved=()=>{}){
 const box=el('section');box.className='audio-practice';box.setAttribute('aria-label','Counted audio practice');
 const heading=el('h4','Auto play & audio count'),count=el('output','0 / 108');count.dataset.audioCount=mantraId;
 const label=el('label','Audio playback target'),target=el('input');target.type='number';target.min=1;target.max=1000000;target.step=1;target.value=108;label.append(target);
 const start=el('button','Start auto play'),pause=el('button','Pause auto play'),reset=el('button','Reset audio count'),status=el('p','One completed recording = one audio play.');status.setAttribute('role','status');
 const note=el('p','Audio plays are saved separately from your chanting count and do not complete client certificates. Playback pauses when you leave this page or switch sections.');note.className='muted';box.append(heading,count,label,start,pause,reset,status,note);
 let running=false,settling=false,invalid=false,played=false,rewinding=false,current={count:0,target:108},generation=0;
 function paint(){count.textContent=`${current.count.toLocaleString('en-IN')} / ${current.target.toLocaleString('en-IN')} audio plays`;target.value=current.target;target.disabled=running||settling;start.disabled=running||settling;pause.disabled=!running;reset.disabled=running||settling;const loop=audio.closest('article')?.querySelector('.audio-tools input[type=checkbox]');if(loop){loop.disabled=running||settling;if(running||settling)loop.checked=false;}}
 function rewind(){if(audio.currentTime!==0){rewinding=true;audio.currentTime=0;}}
 async function refresh(){try{const s=await read();current=s.audioPlays[mantraId]||{count:0,target:108};paint();}catch(e){status.textContent=e.message;start.disabled=true;}}
 async function save(b){const s=await read(),next=await write(command(s,'/audio/'+mantraId,b),s.version);current=next.audioPlays[mantraId];onSaved(next);paint();return next;}
 function stop(){running=false;generation++;audio.pause();paint();}
 async function play(){audio.loop=false;try{await audio.play();}catch(e){stop();status.textContent='Playback could not start. Tap Start auto play to retry.';}}
 start.onclick=async()=>{if(running||settling)return;settling=true;const goal=Number(target.value),revision=generation;try{await save({action:'target',target:goal});if(revision!==generation||document.hidden)return;if(current.count>=current.target){status.textContent='Audio target complete. Set a higher target or reset the audio count.';return;}running=true;invalid=false;played=false;rewind();status.textContent='Playing. Counting each completed recording.';await play();}catch(e){status.textContent=e.message;stop();}finally{settling=false;paint();}};
 pause.onclick=()=>{stop();status.textContent='Paused. Start auto play restarts the unfinished recording.';};
 reset.onclick=async()=>{if(running||settling||!confirm('Reset only this mantra’s audio-play count? Your chanting records are kept.'))return;settling=true;try{await save({action:'reset'});rewind();invalid=false;played=false;status.textContent='Audio count reset.';}catch(e){status.textContent=e.message;}finally{settling=false;paint();}};
 audio.addEventListener('playing',()=>{if(running)played=true;});
 audio.addEventListener('seeking',()=>{if(running){if(rewinding){invalid=false;played=false;}else{invalid=true;stop();status.textContent='Skipped audio was not counted. Start again from the beginning.';}}});
 audio.addEventListener('seeked',()=>{rewinding=false;});
 audio.addEventListener('pause',()=>{if(running&&!audio.ended){running=false;generation++;paint();status.textContent='Paused. Start auto play restarts the unfinished recording.';}});
 audio.addEventListener('error',()=>{stop();status.textContent='Audio could not load. No play was counted.';});
 audio.addEventListener('ended',async()=>{
  if(!running||settling||!audio.ended)return;
  if(invalid){stop();rewind();status.textContent='Skipped audio was not counted. Start again from the beginning.';return;}
  if(!played){stop();status.textContent='Recording was not fully played. No play was counted.';return;}
  const revision=generation;settling=true;try{await save({action:'increment'});if(current.count>=current.target){stop();status.textContent='Audio target complete.';}else if(running&&revision===generation){rewind();invalid=false;played=false;status.textContent='Saved. Playing the next repetition.';await play();}}catch(e){stop();status.textContent='Could not save audio count: '+e.message;}finally{settling=false;paint();}
 });
 paint();refresh();return {element:box,refresh,stop};
}
