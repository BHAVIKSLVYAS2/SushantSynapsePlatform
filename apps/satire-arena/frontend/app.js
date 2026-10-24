import {downloadBlob} from '/shared/download.mjs';
import {createReactionController} from './reaction-controller.mjs';
import {createCard} from './cards.mjs';
import {enhanceArena} from './enhancements.js';
import {cast as allCast,arenas,portraitArt,reactions,tally} from './cast.mjs';
const activeArena=arenas.find(a=>location.pathname.replace(/\/$/,'')==='/satire-arena/'+a.id)?.id||'politicians',cast=allCast.filter(c=>c.arena===activeArena),arenaPath=location.pathname.replace(/\/$/,'')||'/satire-arena';
const $=s=>document.querySelector(s);let round=null,busy=false,pending=null,lastLoaded=0,shareBusy=false,toastTimer,rolloverAttempt=0,saving=null,syncError=false;
function notice(message){$('#notice').textContent=message;$('#notice').hidden=!message;}
function toast(message){clearTimeout(toastTimer);$('#reaction-toast').textContent=message;$('#reaction-toast').hidden=false;toastTimer=setTimeout(()=>$('#reaction-toast').hidden=true,4200);}
document.addEventListener('arena-toast',event=>{if(typeof event.detail?.message==='string')toast(event.detail.message);});
function reactionMessage(character,reaction){const name=cast.find(c=>c.id===character).name;return {garland:`A garland for ${name}!`,applause:`Applause for ${name}!`,shoe:`Shoe thrown at ${name}!`,finger:`Ink thrown at ${name}!`,tomato:`Tomato tossed at ${name}!`,laugh:`Laughing with ${name}!`}[reaction];}
function countdown(){const remaining=Date.parse(round?.resetsAt)-Date.now();if(!round||!Number.isFinite(remaining)){$('#reset-countdown').textContent='Resets 1 January, midnight IST';$('#mini-countdown').textContent='1 January IST';return;}if(remaining<=0){$('#reset-countdown').textContent='New round starting · Refreshing scores…';$('#mini-countdown').textContent='New round';if(!busy&&!document.hidden&&Date.now()-rolloverAttempt>10000){rolloverAttempt=Date.now();load();}return;}const minutes=Math.ceil(remaining/60000),days=Math.floor(minutes/1440),text=`Resets 1 Jan in ${days?days+"d ":""}${Math.floor(minutes/60)%24}h ${minutes%60}m`;for(const el of [$('#reset-countdown'),$('#mini-countdown')])if(el.textContent!==text)el.textContent=text;}
function render(){
 const {fans,critics,amused}=tally(round?.characters);$('#amused').textContent=round?amused:'—';
 $('#fans').textContent=round?fans:'—';$('#critics').textContent=round?critics:'—';$('#round').textContent=round?.round?.slice(0,4)||'—';$('#verdict').textContent=!round?'Shared scores unavailable':fans+critics===0?(amused?'The crowd is just laughing.':'Who will make the first move?'):fans===critics?'A dead heat!':fans>critics?'Fans have the edge.':'Critics have the edge.';
 const total=fans+critics+amused;for(const [id,value]of [['meter',fans],['meter-critics',critics],['meter-amused',amused]]){$('#'+id).style.width=(round&&total?value/total*100:0)+'%';$('#'+id).classList.toggle('is-dominant',value>0&&value===Math.max(fans,critics,amused));}$('.meter').setAttribute('aria-label',round?`${fans} fans, ${critics} critics, ${amused} amused. ${total} reactions this year.`:'Shared scores unavailable');
 for(const [id,value]of [['fans',fans],['critics',critics],['amused',amused]])$('#mini-'+id).textContent=round?value:'—';
 $('#live-state').textContent=round?(syncError?'Last synced · ':'Live · ')+new Date(lastLoaded).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'}):'Offline · Scores unavailable';$('#live-state').classList.toggle('is-live',!!round&&!syncError);countdown();
 const leaders=round?.characters.map(s=>({id:s.id,roasts:(s.shoe||0)+(s.finger||0)+(s.tomato||0),garlands:s.garland||0}))||[],mostRoasts=Math.max(0,...leaders.map(s=>s.roasts)),mostGarlands=Math.max(0,...leaders.map(s=>s.garlands));
 const day=round?Math.floor((Date.now()+19800000)/86400000):0,spotlight=round?cast[((day%cast.length)+cast.length)%cast.length]:null;$('#spotlight').textContent=spotlight?'Main event · '+spotlight.name:'Main event unavailable';$('#spotlight').href=spotlight?'#character-'+spotlight.id:'#cast';
 for(const c of cast){const card=$(`[data-character="${c.id}"]`),score=round?.characters.find(x=>x.id===c.id);for(const r of reactions){const button=card.querySelector(`[data-reaction="${r.id}"]`);button.disabled=busy||!round||syncError;button.setAttribute('aria-pressed',String(score?.selected===r.id));button.querySelector('strong').textContent=score?score[r.id]:'—';}}
 for(const c of cast){const card=$(`[data-character="${c.id}"]`),score=round?.characters.find(s=>s.id===c.id),leader=leaders.find(s=>s.id===c.id),selected=reactions.find(r=>r.id===score?.selected);card.querySelector('.card-total').textContent=score?reactions.reduce((n,r)=>n+(score[r.id]||0),0)+' reactions this year':'Scores unavailable';const badge=card.querySelector('.choice-badge');card.classList.toggle('is-saving',saving===c.id);card.setAttribute('aria-busy',String(saving===c.id));badge.hidden=!selected;badge.textContent=selected?'✓ You chose '+selected.name:'';card.querySelector('.vote-state').textContent=saving===c.id?'Saving your pick…':syncError?'Scores are temporarily offline. Refresh before reacting.':selected?'Your yearly pick is saved. Tap another to change it.':round?'One pick per year. Make your move.':'Connect to the shared arena to react.';const ribbon=card.querySelector('.leader-ribbon'),labels=[];if(leader&&mostRoasts>0&&leader.roasts===mostRoasts)labels.push(leaders.filter(s=>s.roasts===mostRoasts).length>1?'Joint most roasted':'Most roasted this year');if(leader&&mostGarlands>0&&leader.garlands===mostGarlands)labels.push(leaders.filter(s=>s.garlands===mostGarlands).length>1?'Joint top garlanded':'Top garlanded');ribbon.hidden=!labels.length;ribbon.textContent=labels.join(' · ');card.classList.toggle('main-event',c.id===spotlight?.id);card.querySelector('[data-share-character]').disabled=!round||shareBusy||syncError||busy;}
 $('#confirm').disabled=busy||!round||syncError;$('#refresh').disabled=busy;$('#remove').disabled=busy;$('#share-arena').disabled=!round||shareBusy||syncError||busy;
}
let extras;
const controller=createReactionController({arena:activeArena,root:document.querySelector('.arena'),ids:cast.map(c=>c.id),target:id=>$('[data-character="'+id+'"]'),sound:()=>$('#reaction-sound').checked,haptics:()=>$('#haptics').checked,
 change:state=>{round=state.snapshot;busy=state.busy;saving=state.saving;syncError=state.syncError;lastLoaded=state.lastLoaded;render();},
 synced:state=>extras?.refreshResults(state.snapshot.days),start:()=>{notice('');clearTimeout(toastTimer);$('#reaction-toast').hidden=true;},
 confirmed:(character,reaction)=>{document.dispatchEvent(new CustomEvent('arena-measure',{detail:{event:'reaction_saved',method:'none',content:character}}));pending=null;$('#pending').hidden=true;history.replaceState(null,'',arenaPath);toast(reactionMessage(character,reaction));},
 saved:()=>notice('Reaction saved. You can change it until 1 January, midnight IST.'),
 error:(error,phase)=>notice(phase==='load'?(round?'Scores could not sync. Showing the last known totals. Try Refresh arena.':error.message):error.status===428?'Enable cookies, then refresh the arena before reacting. Your pick was not saved.':error.status===409?'The yearly round changed. Scores refreshed; choose again.':error.message+' Your pick could not be confirmed. Check the refreshed scores before retrying.')
});
const load=()=>controller.load(),vote=(id,reaction)=>controller.vote(id,reaction),request=(...args)=>controller.request(...args);
const fragment=document.createDocumentFragment();for(const [i,c]of cast.entries())fragment.append(createCard(c,i,{vote,share:shareStandings}));$('#cast').append(fragment);
const query=new URLSearchParams(location.search),character=query.get('character'),reaction=query.get('reaction');if(cast.some(c=>c.id===character)&&reactions.some(r=>r.id===reaction)){pending={character,reaction};$('#pending-copy').textContent=`Your reaction is ready: ${cast.find(c=>c.id===character).name} · ${reactions.find(r=>r.id===reaction).name}. Confirm to make it count.`;$('#pending').hidden=false;}
$('#confirm').onclick=()=>pending&&vote(pending.character,pending.reaction);$('#cancel').onclick=()=>{pending=null;$('#pending').hidden=true;history.replaceState(null,'',arenaPath);};$('#refresh').onclick=()=>{notice('');load();};
$('#export').onclick=async()=>{try{const data=await request('/mine');downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),'satire-arena-my-reactions.json',{cleanupDelay:1000});notice('Your browser’s reactions exported. Keep the file private.');}catch(e){notice(e.message);}};
$('#remove').onclick=async()=>{if(busy||!confirm('Remove every reaction saved under this browser identity? This also updates the shared scores.'))return;try{if(await controller.remove())notice('Your saved reactions were removed.');}catch(error){notice(error.message);}};
if(typeof navigator.vibrate!=='function'){$('#haptics').checked=false;$('#haptics').disabled=true;$('#haptic-help').textContent='Animations are on. Vibration is unavailable in this browser.';}
let countdownTimer;function scheduleCountdown(){clearTimeout(countdownTimer);if(document.hidden)return;countdown();countdownTimer=setTimeout(scheduleCountdown,60000-Date.now()%60000+20);}document.addEventListener('visibilitychange',scheduleCountdown);scheduleCountdown();

// Share only a snapshot of public totals, never cookie identity or selected ballots.
const shareArtwork=new Map();
function artwork(src){if(!shareArtwork.has(src))shareArtwork.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{shareArtwork.delete(src);reject(Error('Share artwork could not load. Try again.'));};img.src=src;}));return shareArtwork.get(src);}
async function shareStandings(character=null){
 if(!round||shareBusy||busy||syncError)return;shareBusy=true;render();const snapshot={round:round.round,characters:round.characters.map(({selected,...publicScore})=>({...publicScore}))};
 try{
  const people=character?cast.filter(c=>c.id===character):cast;
  const images=await Promise.all(people.map(c=>artwork('/satire-arena/'+portraitArt(c).file))),logo=await artwork('/logo-adaptive-192.png');
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=character?1080:1890;const ctx=canvas.getContext('2d');
  // Fixed export-art palette; interface theme never changes the shared image.
  const ink='#172a31',paper='#fff6e5',fan='#16715c',critic='#b94139',amused='#7355ad';ctx.fillStyle=paper;ctx.fillRect(0,0,canvas.width,canvas.height);
  function text(value,x,y,size=28,color=ink,weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI", Arial, sans-serif`;ctx.fillText(value,x,y);}
  function portrait(c,img,x,y,size){const art=portraitArt(c),cell=img.naturalWidth/art.columns;ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,20);ctx.clip();ctx.drawImage(img,art.column*cell,art.row*cell,cell,cell,x,y,size,size);ctx.restore();}
  const short=n=>new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:1}).format(n);
  ctx.drawImage(logo,54,42,56,56);text('SUSHANT SYNAPSE · SATIRE ARENA',128,80,22);text('Garland or Roast',54,166,64);text(arenas.find(a=>a.id===activeArena).name+' · Yearly reactions · '+snapshot.round.slice(0,4)+' · IST',54,212,25,ink,400);
  if(character){
   const c=people[0],score=snapshot.characters.find(s=>s.id===c.id);portrait(c,images[0],315,246,450);text(c.name,54,760,46);const joke=$('[data-character="'+c.id+'"] .daily-punchline')?.textContent||c.copy;ctx.font='400 26px "Segoe UI", Arial';let words=joke.split(/\s+/),first='';while(words.length&&ctx.measureText(first+' '+words[0]).width<950)first+=(first?' ':'')+words.shift();text(first,54,805,26,ink,400);if(words.length){let second=words.join(' ');while(ctx.measureText(second).width>920)second=second.slice(0,-1);text(second+(second!==words.join(' ')?'…':''),54,839,26,ink,400);}const values=tally([score]);
   [['Fans',values.fans,fan],['Critics',values.critics,critic],['Amused',values.amused,amused]].forEach(([label,value,color],i)=>{const x=54+i*324;text(label,x,873,24,color);text(short(value),x,934,52,color);});
  }else{
   const totals=tally(snapshot.characters);[['Fans',totals.fans,fan],['Critics',totals.critics,critic],['Amused',totals.amused,amused]].forEach(([label,value,color],i)=>{const x=54+i*324;text(label,x,280,24,color);text(short(value),x,345,58,color);});
   for(const [i,c]of people.entries()){const x=54+(i%3)*324,y=390+Math.floor(i/3)*270,score=snapshot.characters.find(s=>s.id===c.id),v=tally([score]);portrait(c,images[i],x,y,148);text(c.name,x,y+185,25);text(`Fans ${short(v.fans)} · Critics ${short(v.critics)}`,x,y+216,18,ink,400);text(`Amused ${short(v.amused)}`,x,y+243,18,ink,400);}
  }
  text('FICTIONAL CARTOONS · NOT A POLL · NO ENDORSEMENT',54,canvas.height-82,21);text('Browser reactions · Snapshot of shared yearly totals',54,canvas.height-50,20,ink,400);text('apps.sushantsynapse.com/satire-arena/'+(character?'characters/'+character:'results'),54,canvas.height-20,20,ink,400);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not create the share card.')),'image/png')),file=new File([blob],`garland-or-roast-${character||'standings'}-${snapshot.round}.png`,{type:'image/png'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'Garland or Roast · Satire Arena'});toast('Share handed to your device. Your private choices stay private.');return;}catch(e){if(e.name==='AbortError'){toast('Sharing cancelled. Your reactions are unchanged.');return;}}}
  downloadBlob(blob,file.name);document.dispatchEvent(new CustomEvent('arena-measure',{detail:{event:'image_download',method:'image',content:character||'standings'}}));toast('Share card downloaded. Attach it wherever you like.');
 }catch(e){notice(e.message);}finally{shareBusy=false;render();}
}
$('#share-arena').onclick=()=>shareStandings();
extras=enhanceArena(cast,activeArena);
load();
