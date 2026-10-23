import {prepareSound,playSound,stopSound} from './sound.mjs?v=20261018-playful';
import {enhanceArena} from './enhancements.js?v=20261018-yearly';
// Unlock audio on press so setup finishes before the click feedback.
document.addEventListener('pointerdown',event=>{const button=event.target.closest('[data-reaction]');if(button&&!button.disabled&&document.querySelector('#reaction-sound').checked)prepareSound();});
document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('[data-reaction]:not(:disabled)')&&document.querySelector('#reaction-sound').checked)prepareSound();});
document.addEventListener('change',event=>{if(event.target.id==='reaction-sound'&&!event.target.checked)stopSound();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
window.addEventListener('pagehide',stopSound);
import {cast as allCast,reactions,tally} from './catalogue.mjs?v=20261011-speakers';
import {playReaction,stopVibration,prepareReaction} from './feedback.mjs?v=20261018-fast';
const activeArena=location.pathname.includes('/news-anchors')?'news-anchors':'politicians',cast=allCast.filter(c=>c.arena===activeArena),arenaPath=location.pathname.replace(/\/$/,'')||'/satire-arena';
const $=s=>document.querySelector(s),api='/api/satire-arena';let round=null,busy=false,pending=null,loading=null,lastLoaded=0,shareBusy=false,toastTimer,rolloverAttempt=0,revision=0,saving=null,syncError=false;
const media=matchMedia('(prefers-color-scheme: dark)');function applyTheme(){const value=window.SynapseTheme.read();document.documentElement.dataset.theme=value==='system'?(media.matches?'dark':'light'):value;}
document.querySelector('[data-theme-toggle]').outerHTML=window.SynapseTheme.control();document.addEventListener('change',event=>{if(event.target.matches('[data-theme-toggle]'))applyTheme();});media.addEventListener('change',applyTheme);applyTheme();
async function request(path='',options={}){const response=await fetch(api+path,{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(12000),...options});const body=response.status===204?null:await response.json().catch(()=>null);if(!response.ok){const error=Error(body?.error||'The arena could not load. Try again.');error.status=response.status;throw error;}return body;}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=!message;}
function toast(message){clearTimeout(toastTimer);$('#reaction-toast').textContent=message;$('#reaction-toast').hidden=false;toastTimer=setTimeout(()=>$('#reaction-toast').hidden=true,4200);}
document.addEventListener('arena-toast',event=>{if(typeof event.detail?.message==='string')toast(event.detail.message);});
function reactionMessage(character,reaction){const name=cast.find(c=>c.id===character).name;return {garland:`A garland for ${name}!`,applause:`Applause for ${name}!`,shoe:`Shoe thrown at ${name}!`,finger:`Ink thrown at ${name}!`,tomato:`Tomato tossed at ${name}!`,laugh:`Laughing with ${name}!`}[reaction];}
function countdown(){const remaining=Date.parse(round?.resetsAt)-Date.now();if(!round||!Number.isFinite(remaining)){$('#reset-countdown').textContent='Resets 1 January, midnight IST';$('#mini-countdown').textContent='1 January IST';return;}if(remaining<=0){$('#reset-countdown').textContent='New round starting · Refreshing scores…';$('#mini-countdown').textContent='New round';if(!busy&&!loading&&!document.hidden&&Date.now()-rolloverAttempt>10000){rolloverAttempt=Date.now();load();}return;}const minutes=Math.ceil(remaining/60000),days=Math.floor(minutes/1440),text=`Resets 1 Jan in ${days?days+"d ":""}${Math.floor(minutes/60)%24}h ${minutes%60}m`;$('#reset-countdown').textContent=text;$('#mini-countdown').textContent=text;}
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
async function load(){if(loading)return loading;const requestedRevision=revision;loading=(async()=>{try{const fresh=await request();if(requestedRevision!==revision)return;round={...fresh,characters:fresh.characters.filter(s=>cast.some(c=>c.id===s.id))};syncError=false;lastLoaded=Date.now();render();}catch(e){if(requestedRevision!==revision)return;syncError=true;render();notice(round?'Scores could not sync. Showing the last known totals. Try Refresh arena.':e.message);}finally{loading=null;}})();return loading;}
async function vote(character,reaction){
 if(busy||!round)return;
 const snapshot=structuredClone(round),ballotRound=round.round,score=round.characters.find(c=>c.id===character);
 if(!score)return;
 if($('#reaction-sound').checked){prepareSound();playSound(reaction);}
 revision++;busy=true;saving=character;
 if(score.selected!==reaction){if(score.selected)score[score.selected]=Math.max(0,(score[score.selected]||0)-1);score[reaction]=(score[reaction]||0)+1;score.selected=reaction;}
 render();notice('');clearTimeout(toastTimer);$('#reaction-toast').hidden=true;
 const card=$('[data-character="'+character+'"]'),prepared=prepareReaction(card).catch(()=>{});
 try{
  await request('/'+character+'/vote',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reaction,round:ballotRound})});
  saving=null;render();await prepared;
  document.dispatchEvent(new CustomEvent('arena-measure',{detail:{event:'reaction_saved',method:'none',content:character}}));
  pending=null;$('#pending').hidden=true;history.replaceState(null,'',arenaPath);
  playReaction(card,reaction,{haptics:$('#haptics').checked});toast(reactionMessage(character,reaction));
  if(loading)await loading;await load();if(!syncError)notice('Reaction saved. You can change it until 1 January, midnight IST.');
 }catch(e){
  round=snapshot;saving=null;render();
  if(loading)await loading;
  // A network timeout may follow a committed write: reconcile without replaying it.
  await load();notice(e.status===428?'Enable cookies, then refresh the arena before reacting. Your pick was not saved.':e.status===409?'The yearly round changed. Scores refreshed; choose again.':e.message+' Your pick could not be confirmed. Check the refreshed scores before retrying.');
 }finally{busy=false;saving=null;render();}
}
for(const [i,c]of cast.entries()){
 const article=document.createElement('article');article.className='arena-card'+(i===0?'':' art-pending');article.id='character-'+c.id;article.dataset.character=c.id;article.innerHTML=`<div class="portrait-stage"><div class="portrait portrait-${c.portrait}" role="img" aria-label="${c.name}, a fictional parody cartoon"><span>FICTIONAL PARODY</span><div class="leader-ribbon" hidden></div></div><div class="reactions" role="group" aria-label="Reactions for ${c.name}">${reactions.map(r=>`<button type="button" data-reaction="${r.id}" data-side="${r.side}" title="${r.name}" disabled aria-pressed="false" aria-label="${r.name} for ${c.name}"><span aria-hidden="true">${r.icon}</span><b>${r.name}</b><strong>—</strong></button>`).join('')}</div></div><div class="card-body"><small>${c.tag}</small><h2>${c.name}</h2><p>${c.copy}</p><div class="card-meta"><strong class="card-total">Loading scores…</strong><button type="button" data-share-character="${c.id}" aria-label="Share ${c.name} standings" disabled>Share ↗</button></div><span class="choice-badge" hidden></span><p class="vote-state" role="status">Loading shared scores…</p></div>`;article.querySelectorAll('[data-reaction]').forEach(b=>b.onclick=()=>vote(c.id,b.dataset.reaction));article.querySelector('[data-share-character]').onclick=()=>shareStandings(c.id);$('#cast').append(article);
}
const query=new URLSearchParams(location.search),character=query.get('character'),reaction=query.get('reaction');if(cast.some(c=>c.id===character)&&reactions.some(r=>r.id===reaction)){pending={character,reaction};$('#pending-copy').textContent=`Your reaction is ready: ${cast.find(c=>c.id===character).name} · ${reactions.find(r=>r.id===reaction).name}. Confirm to make it count.`;$('#pending').hidden=false;}
$('#confirm').onclick=()=>pending&&vote(pending.character,pending.reaction);$('#cancel').onclick=()=>{pending=null;$('#pending').hidden=true;history.replaceState(null,'',arenaPath);};$('#refresh').onclick=()=>{notice('');load();};
$('#export').onclick=async()=>{try{const data=await request('/mine'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='satire-arena-my-reactions.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Your browser’s reactions exported. Keep the file private.');}catch(e){notice(e.message);}};
$('#remove').onclick=async()=>{if(busy||!confirm('Remove every reaction saved under this browser identity? This also updates the shared scores.'))return;busy=true;render();try{await request('/mine',{method:'DELETE',headers:{'X-Arena-Confirm':'DELETE'}});if(loading)await loading;await load();if(round)notice('Your saved reactions were removed.');}catch(e){notice(e.message);}finally{busy=false;render();}};
$('#haptics').addEventListener('change',()=>{if(!$('#haptics').checked)stopVibration();});if(typeof navigator.vibrate!=='function'){$('#haptics').checked=false;$('#haptics').disabled=true;$('#haptic-help').textContent='Animations are on. Vibration is unavailable in this browser.';}document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVibration();});
load();setInterval(()=>{if(!document.hidden&&!busy)load();},30000);setInterval(()=>{if(!document.hidden)countdown();},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy)load();});

// Share only a snapshot of public totals, never cookie identity or selected ballots.
const shareArtwork=new Map();
function artwork(src){if(!shareArtwork.has(src))shareArtwork.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{shareArtwork.delete(src);reject(Error('Share artwork could not load. Try again.'));};img.src=src;}));return shareArtwork.get(src);}
async function shareStandings(character=null){
 if(!round||shareBusy||busy||syncError)return;shareBusy=true;render();const snapshot={round:round.round,characters:round.characters.map(({selected,...publicScore})=>({...publicScore}))};
 try{
  const people=character?cast.filter(c=>c.id===character):cast,files=['cast-fast.webp','extra-cast-fast.webp','new-cast-fast.webp','highway-budget-fast.webp','speakers-fast.webp'];
  const images=await Promise.all(people.map(c=>artwork('/satire-arena/'+(c.arena==='news-anchors'?'anchors-fast.webp':files[c.portrait>=11?4:c.portrait>=9?3:Math.floor(c.portrait/3)])))),logo=await artwork('/logo-adaptive-192.png');
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=character?1080:1890;const ctx=canvas.getContext('2d');
  // Fixed export-art palette; interface theme never changes the shared image.
  const ink='#172a31',paper='#fff6e5',fan='#16715c',critic='#b94139',amused='#7355ad';ctx.fillStyle=paper;ctx.fillRect(0,0,canvas.width,canvas.height);
  function text(value,x,y,size=28,color=ink,weight=600){ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI", Arial, sans-serif`;ctx.fillText(value,x,y);}
  function portrait(c,img,x,y,size){const anchor=c.arena==='news-anchors',cell=img.naturalWidth/(anchor?3:c.portrait>=9?2:3);ctx.save();ctx.beginPath();ctx.roundRect(x,y,size,size,20);ctx.clip();ctx.drawImage(img,(anchor?(c.portrait-13)%3:c.portrait>=11?c.portrait-11:c.portrait>=9?c.portrait-9:c.portrait%3)*cell,anchor?Math.floor((c.portrait-13)/3)*cell:0,cell,c.portrait>=9?cell:img.naturalHeight,x,y,size,size);ctx.restore();}
  const short=n=>new Intl.NumberFormat('en-IN',{notation:'compact',maximumFractionDigits:1}).format(n);
  ctx.drawImage(logo,54,42,56,56);text('SUSHANT SYNAPSE · SATIRE ARENA',128,80,22);text('Garland or Roast',54,166,64);text((activeArena==='news-anchors'?'News Anchors':'Politicians')+' · Yearly reactions · '+snapshot.round.slice(0,4)+' · IST',54,212,25,ink,400);
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
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();document.dispatchEvent(new CustomEvent('arena-measure',{detail:{event:'image_download',method:'image',content:character||'standings'}}));setTimeout(()=>URL.revokeObjectURL(url),60000);toast('Share card downloaded. Attach it wherever you like.');
 }catch(e){notice(e.message);}finally{shareBusy=false;render();}
}
$('#share-arena').onclick=()=>shareStandings();
enhanceArena(cast,activeArena);
