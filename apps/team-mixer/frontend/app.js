import {sample,parseNames,constrainedMix,resultText,safeFilename} from './engine.mjs?v=20261010-aakanksha';
import {renderCard,pngBlob,download} from './export.mjs';
const $=s=>document.querySelector(s),media=matchMedia('(prefers-color-scheme: dark)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
$('#theme').outerHTML=window.SynapseTheme.control('id="theme"');function theme(){const p=window.SynapseTheme.read();document.documentElement.dataset.theme=p==='system'?(media.matches?'dark':'light'):p;}$('#theme').addEventListener('change',theme);media.addEventListener('change',theme);theme();
let result=null,busy=false,lastMixed=null,previous=null;
const modeLabel=document.createElement('label');modeLabel.textContent='Split by';
const mode=document.createElement('select');mode.id='split-mode';mode.innerHTML='<option value="teams">Number of teams</option><option value="size">Maximum people per team</option>';modeLabel.append(mode);$('#team-count').closest('.pair').prepend(modeLabel);
const numberLabel=$('label[for=team-count]');numberLabel.append($('#team-count'));numberLabel.firstChild.textContent='Number of teams';
mode.onchange=()=>{numberLabel.firstChild.textContent=mode.value==='size'?'Maximum people per team':'Number of teams';$('#team-count').max=mode.value==='size'?'100':'20';};
const constraints=document.createElement('details');constraints.innerHTML='<summary>Keep people together or apart</summary><p>One group per line; separate exact names with |. Teams stay balanced.</p><label>Keep together<textarea id="keep-together" rows="2" maxlength="16000" placeholder="Aarav | Ananya"></textarea></label><label>Keep apart<textarea id="keep-apart" rows="2" maxlength="16000" placeholder="Meera | Neel"></textarea></label>';$('#setup').append(constraints);
const restore=document.createElement('button');restore.type='button';restore.id='restore-mix';restore.textContent='Restore previous mix';restore.disabled=true;$('#teams').before(restore);
function lock(value){busy=value;document.querySelectorAll('#setup input,#setup textarea,#setup select,#setup button,#exports button').forEach(control=>control.disabled=value);restore.disabled=value||!previous;$('#teams').setAttribute('aria-busy',String(value));}
function clear(){result=null;$('#teams').replaceChildren();$('#empty').hidden=false;$('#exports').hidden=true;$('#export-help').hidden=true;$('#copy-fallback').hidden=true;$('#summary').textContent='';$('#results-title').textContent='A fresh mix awaits.';$('#export-status').textContent='';}
function settings(){return {names:$('#names').value,count:$('#team-count').value,title:$('#title').value,mode:mode.value,together:$('#keep-together').value,apart:$('#keep-apart').value};}
async function show(next,animate=true){
 clear();lock(true);$('#empty').hidden=true;$('#results-title').textContent=next.title;
 const cards=next.teams.map(team=>{const article=document.createElement('article');article.className='team';const header=document.createElement('header'),title=document.createElement('h3'),count=document.createElement('span');title.textContent=team.name;count.textContent=team.members.length+' '+(team.members.length===1?'person':'people');header.append(title,count);const list=document.createElement('ol');for(const name of team.members){const li=document.createElement('li');li.textContent=name;list.append(li);}article.append(header,list);return article;});$('#teams').append(...cards);
 try{if(animate&&!motion.matches)await Promise.all(cards.map(async(card,index)=>{const animation=card.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:index*90,easing:'ease-out',fill:'both'});try{await animation.finished;}finally{animation.cancel();}}));
 result=next;$('#summary').textContent=next.total+' people | '+next.teams.length+' teams';$('#exports').hidden=false;$('#export-help').hidden=false;$('#results-title').setAttribute('tabindex','-1');$('#results-title').focus();}finally{lock(false);}
}
$('#setup').addEventListener('input',()=>{if(!busy){clear();$('#status').textContent='Mix to use your updated names and settings.';}});
$('#setup').addEventListener('change',e=>{if(e.target===mode&&!busy)clear();});
$('#sample').onclick=()=>{if(busy)return;$('#names').value=sample.join('\n');mode.value='teams';mode.onchange();$('#team-count').value='3';$('#title').value='Our teams';clear();$('#status').textContent='Sample names loaded. Mix to try them.';};
$('#setup').onsubmit=async event=>{event.preventDefault();if(busy)return;try{
 const config=settings(),names=parseNames(config.names),amount=Number(config.count);
 if(!Number.isInteger(amount)||amount<2||amount>(config.mode==='size'?100:20))throw Error('Choose a whole number in the shown range.');
 const count=config.mode==='size'?Math.ceil(names.length/amount):amount;
 if(count<2||count>20)throw Error('Choose a size that creates between 2 and 20 teams.');
 const next=constrainedMix(config.names,count,config.title,{together:config.together,apart:config.apart});
 previous=lastMixed;await show(next);lastMixed={result:next,config};restore.disabled=!previous;$('#status').textContent='Teams ready. Everyone is included once. Restore previous mix if you preferred it.';
 }catch(error){$('#status').textContent=error.message;lock(false);}
};
restore.onclick=async()=>{if(busy||!previous)return;const saved=previous;previous=null;const c=saved.config;$('#names').value=c.names;$('#team-count').value=c.count;$('#title').value=c.title;mode.value=c.mode;mode.onchange();$('#keep-together').value=c.together;$('#keep-apart').value=c.apart;await show(saved.result,false);lastMixed=saved;$('#status').textContent='Previous teams and settings restored.';};
$('#copy').onclick=async()=>{if(!result||busy)return;const text=resultText(result);try{if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#export-status').textContent='Team list copied. Paste it into your group chat.';return;}}catch{}$('#copy-text').value=text;$('#copy-fallback').hidden=false;$('#copy-text').focus();$('#copy-text').select();$('#export-status').textContent='Copy the team list below.';};
async function exportTeams(share){if(!result||busy)return;const snapshot=result;lock(true);try{const canvas=document.createElement('canvas');renderCard(canvas,snapshot);const png=await pngBlob(canvas),name=safeFilename(snapshot.title),file=new File([png],name,{type:'image/png'});if(share&&navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({title:'Team Mixer',files:[file]});$('#export-status').textContent='Team card shared.';return;}catch(error){if(error.name==='AbortError'){$('#export-status').textContent='Sharing cancelled. Your teams are still here.';return;}}}download(png,name);$('#export-status').textContent=share?'Team card downloaded. Attach it in your group chat.':'Team card downloaded.';}catch(error){$('#export-status').textContent=error.message;}finally{lock(false);}}
$('#download').onclick=()=>exportTeams(false);$('#share').onclick=()=>exportTeams(true);$('#names').value=sample.join('\n');
