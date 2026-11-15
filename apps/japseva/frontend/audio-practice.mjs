import {audioText} from './audio-copy.mjs';
import {read,write,command} from './storage.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function audioPractice(audio,mantraId,onSaved=()=>{}){
 let practiceContext=false;const settings=el('details'),settingsTitle=el('summary');settings.append(settingsTitle);settings.className='practice-audio-settings';
 let language='en',statusKey='One completed recording = one audio play.';
 const box=el('section');box.className='audio-practice';box.setAttribute('aria-label','Counted audio practice');
 const heading=el('h4','Auto play & audio count'),count=el('output','0 / 108');count.dataset.audioCount=mantraId;
 const label=el('label','Audio playback target'),target=el('input');target.type='number';target.min=1;target.max=1000000;target.step=1;target.value=108;label.append(target);
 const start=el('button','Start auto play'),pause=el('button','Pause auto play'),reset=el('button','Reset audio count'),status=el('p','One completed recording = one audio play.');status.setAttribute('role','status');
 const note=el('p','Audio plays are saved separately from your chanting count and do not complete client certificates. Playback pauses when you leave this page or switch sections.');note.className='muted';box.append(heading,count,label,start,pause,reset,status,note);
 function setStatus(text){statusKey=text;const wording=practiceContext&&text==='Paused. Start auto play restarts the unfinished recording.'?'Paused. Playback restarts this recording.':practiceContext&&text==='Playback could not start. Tap Start auto play to retry.'?'Playback could not start. Tap Play mantra on repeat to retry.':text;status.textContent=audioText(wording,language);status.hidden=practiceContext&&text==='One completed recording = one audio play.';}
 function translate(next){const draft=target.value;language=next;box.setAttribute('aria-label',audioText('Counted audio practice',language));for(const [node,text]of [[heading,practiceContext?'Listen while you count':'Auto play & audio count'],[start,practiceContext?'Play mantra on repeat':'Start auto play'],[pause,practiceContext?'Pause mantra':'Pause auto play'],[reset,'Reset audio count'],[note,practiceContext?'Your japa count changes when you tap the counter.':'Audio plays are saved separately from your chanting count and do not complete client certificates. Playback pauses when you leave this page or switch sections.']])node.textContent=audioText(text,language);label.firstChild.textContent=audioText(practiceContext?'Audio repeat target':'Audio playback target',language);settingsTitle.textContent=audioText('Audio settings',language);setStatus(statusKey);paint();if(!target.disabled)target.value=draft;}
 let running=false,settling=false,invalid=false,played=false,rewinding=false,current={count:0,target:108},generation=0;
 function paint(){count.textContent=`${current.count.toLocaleString('en-IN')} / ${current.target.toLocaleString('en-IN')} ${audioText('audio plays',language)}`;target.value=current.target;target.disabled=running||settling;start.disabled=running||settling;pause.disabled=!running;reset.disabled=running||settling;const loop=(audio.closest('.learning-audio')||audio.closest('article'))?.querySelector('.audio-tools input[type=checkbox]');if(loop){loop.disabled=running||settling;if(running||settling)loop.checked=false;}}
 function rewind(){if(audio.currentTime!==0){rewinding=true;audio.currentTime=0;}}
 async function refresh(){try{const s=await read();current=s.audioPlays[mantraId]||{count:0,target:108};paint();}catch(e){setStatus(e.message);start.disabled=true;}}
 async function save(b){const s=await read(),next=await write(command(s,'/audio/'+mantraId,b),s.version);current=next.audioPlays[mantraId];onSaved(next);paint();return next;}
 function stop(){running=false;generation++;audio.pause();paint();}
 async function play(){audio.loop=false;try{await audio.play();}catch(e){stop();setStatus('Playback could not start. Tap Start auto play to retry.');}}
 start.onclick=async()=>{if(running||settling)return;settling=true;const goal=Number(target.value),revision=generation;try{await save({action:'target',target:goal});if(revision!==generation||document.hidden)return;if(current.count>=current.target){setStatus('Audio target complete. Set a higher target or reset the audio count.');if(practiceContext)settings.open=true;return;}running=true;invalid=false;played=false;rewind();setStatus('Playing. Counting each completed recording.');await play();}catch(e){setStatus(e.message);stop();}finally{settling=false;paint();}};
 pause.onclick=()=>{stop();setStatus('Paused. Start auto play restarts the unfinished recording.');};
 reset.onclick=async()=>{if(running||settling||!confirm(audioText('Reset only this mantra’s audio-play count? Your chanting records are kept.',language)))return;settling=true;try{await save({action:'reset'});rewind();invalid=false;played=false;setStatus('Audio count reset.');}catch(e){setStatus(e.message);}finally{settling=false;paint();}};
 audio.addEventListener('playing',()=>{if(running)played=true;});
 audio.addEventListener('seeking',()=>{if(running){if(rewinding){invalid=false;played=false;}else{invalid=true;stop();setStatus('Skipped audio was not counted. Start again from the beginning.');}}});
 audio.addEventListener('seeked',()=>{rewinding=false;});
 audio.addEventListener('pause',()=>{if(running&&!audio.ended){running=false;generation++;paint();setStatus('Paused. Start auto play restarts the unfinished recording.');}});
 audio.addEventListener('error',()=>{stop();setStatus('Audio could not load. No play was counted.');});
 audio.addEventListener('ended',async()=>{
  if(!running||settling||!audio.ended)return;
  if(invalid){stop();rewind();setStatus('Skipped audio was not counted. Start again from the beginning.');return;}
  if(!played){stop();setStatus('Recording was not fully played. No play was counted.');return;}
  const revision=generation;settling=true;try{await save({action:'increment'});if(current.count>=current.target){stop();setStatus('Audio target complete.');}else if(running&&revision===generation){rewind();invalid=false;played=false;setStatus('Saved. Playing the next repetition.');await play();}}catch(e){stop();setStatus('Could not save audio count: '+e.message);}finally{settling=false;paint();}
 });
 paint();refresh();return {element:box,settings,refresh,stop,translate,setContext(practice){practiceContext=practice;if(practice){settings.append(label,reset);box.append(settings);}else{box.insertBefore(label,start);box.insertBefore(reset,status);settings.remove();}translate(language);}};
}
