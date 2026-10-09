import {parseOptions,chooseIndex,landingRotation,presets} from './engine.mjs';
const $=s=>document.querySelector(s),svgNS='http://www.w3.org/2000/svg',media=matchMedia('(prefers-color-scheme: dark)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
$('#theme').outerHTML=window.SynapseTheme.control('id="theme"');
function theme(){const p=window.SynapseTheme.read();document.documentElement.dataset.theme=p==='system'?(media.matches?'dark':'light'):p;}
$('#theme').addEventListener('change',theme);media.addEventListener('change',theme);theme();
let options=[],rotation=0,spinning=false,result=null,history=[];
function node(name,attributes={}){const element=document.createElementNS(svgNS,name);for(const [key,value]of Object.entries(attributes))element.setAttribute(key,String(value));return element;}
function draw(){
 const wheel=$('#wheel');wheel.replaceChildren();wheel.style.transform=`rotate(${rotation}deg)`;
 wheel.setAttribute('aria-label',`Decision wheel with ${options.length} equal choices. Options are listed in the editor.`);
 if(options.length===1)wheel.append(node('circle',{cx:200,cy:200,r:194,class:'slice slice-0'}));
 options.forEach((label,index)=>{
  const step=360/options.length,start=(-90+index*step)*Math.PI/180,end=start+step*Math.PI/180,mid=(start+end)/2;
  if(options.length>1){const d=`M 200 200 L ${200+194*Math.cos(start)} ${200+194*Math.sin(start)} A 194 194 0 ${step>180?1:0} 1 ${200+194*Math.cos(end)} ${200+194*Math.sin(end)} Z`;const slice=node('path',{d,class:`slice slice-${index%8}`});const title=node('title');title.textContent=label;slice.append(title);wheel.append(slice);}
  const x=200+125*Math.cos(mid),y=200+125*Math.sin(mid),angle=mid*180/Math.PI;
  const text=node('text',{x,y,class:'wheel-label',transform:`rotate(${angle>90||angle< -90?angle+180:angle} ${x} ${y})`});
  const max=options.length>16?9:options.length>10?13:19,characters=[...label];text.textContent=characters.length>max?characters.slice(0,max-1).join('')+'\u2026':label;wheel.append(text);
 });
 $('#count').textContent=`${options.length} ${options.length===1?'OPTION LEFT':'EQUAL CHOICES'}`;$('#spin').disabled=spinning||options.length<2;
 $('#wheel-title').textContent=$('#question').value.trim()||'Let the wheel decide.';
}
function clearResult(){result=null;$('#result').hidden=true;$('#share-fallback').hidden=true;}
function update(preserveRotation=false){const next=parseOptions($('#options').value),same=next.length===options.length&&next.every((value,index)=>value===options[index]);options=next;if(!preserveRotation||!same)rotation=0;clearResult();draw();$('#status').textContent='Wheel ready. Every option has an equal chance.';}
$('#options-form').onsubmit=event=>{event.preventDefault();if(spinning)return;try{update();}catch(error){$('#status').textContent=error.message;}};
for(const field of ['#options','#question'])$(field).addEventListener('input',()=>{if(!spinning){clearResult();$('#status').textContent='Update the wheel or spin to use your changes.';$('#spin').disabled=false;}});
function lock(value){spinning=value;document.querySelectorAll('#options-form input,#options-form textarea,#options-form button,[data-preset],#spin,#remove,#share,#clear-history').forEach(control=>control.disabled=value);if(!value){$('#spin').disabled=options.length<2;$('#remove').disabled=options.length<2;$('#clear-history').disabled=history.length===0;}}
function showResult(value,last=false){result={value,title:$('#wheel-title').textContent,last};$('#winner').textContent=value;$('#result .eyebrow').textContent=last?'LAST OPTION REMAINING':'THE WHEEL CHOSE';$('#result').hidden=false;$('#share-fallback').hidden=true;$('#remove').disabled=options.length<2;}
function renderHistory(){
 $('#history').replaceChildren(...history.map(pick=>{const li=document.createElement('li');li.textContent=pick.value;const subtitle=document.createElement('small');subtitle.textContent=pick.title;li.append(subtitle);return li;}));$('#empty-history').hidden=history.length>0;$('#clear-history').disabled=spinning||history.length===0;
}
$('#spin').onclick=async()=>{
 if(spinning)return;
 try{update(true);const index=chooseIndex(options.length),next=landingRotation(rotation,index,options.length);lock(true);$('#status').textContent='Spinning\u2026';
  const animation=$('#wheel').animate([{transform:`rotate(${rotation}deg)`},{transform:`rotate(${next}deg)`}],{duration:motion.matches?0:2600,easing:'cubic-bezier(.14,.72,.16,1)',fill:'forwards'});
  try{await animation.finished;rotation=next;$('#wheel').style.transform=`rotate(${rotation}deg)`;}finally{animation.cancel();}
  showResult(options[index]);history.unshift({...result});history=history.slice(0,20);renderHistory();$('#status').textContent=`Selected: ${options[index]}.`;$('#winner').setAttribute('tabindex','-1');$('#winner').focus();
 }catch(error){$('#status').textContent=error.message;}finally{lock(false);}
};
$('#remove').onclick=()=>{
 if(spinning||!result||options.length<2)return;
 const removed=result.value;options=options.filter(value=>value!==removed);$('#options').value=options.join('\n');rotation=0;clearResult();draw();
 if(options.length===1){showResult(options[0],true);$('#status').textContent=`${removed} removed. Only ${options[0]} remains. Add more options or choose a starter list to spin again.`;}else $('#status').textContent=`${removed} removed. ${options.length} options remain.`;
};
const presetTitles={lunch:"What's for lunch?",tasks:'Which task next?',team:'Which team goes first?'};
document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>{if(spinning)return;$('#options').value=presets[button.dataset.preset].join('\n');$('#question').value=presetTitles[button.dataset.preset];update();});
$('#clear-history').onclick=()=>{history=[];renderHistory();};
$('#share').onclick=async()=>{
 if(!result||spinning)return;const text=`Decision Wheel\n${result.title}\n${result.last?'Remaining option':'Selected'}: ${result.value}\nTry your own wheel: ${location.origin}/decision-wheel`;
 try{if(navigator.share){await navigator.share({title:'Decision Wheel',text});return;}if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#status').textContent='Result copied. Paste it wherever you like.';return;}}catch(error){if(error.name==='AbortError')return;}
 $('#share-text').value=text;$('#share-fallback').hidden=false;$('#share-text').focus();$('#share-text').select();$('#status').textContent='Copy the message below to share your result.';
};
$('#options').value=presets.lunch.join('\n');update();renderHistory();
const listTools=document.createElement('fieldset');
const legend=document.createElement('legend');legend.textContent='Reuse your choices';listTools.append(legend);
const saveList=document.createElement('button');saveList.type='button';saveList.textContent='Export choice list';
const loadLabel=document.createElement('label');loadLabel.textContent='Import choice list (JSON)';
const loadList=document.createElement('input');loadList.type='file';loadList.accept='.json,application/json';loadLabel.append(loadList);listTools.append(saveList,loadLabel);$('#options-form').append(listTools);
saveList.onclick=()=>{if(spinning)return;try{const values=parseOptions($('#options').value),data={format:'synapse-wheel-v1',title:$('#question').value.trim(),options:values},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='decision-wheel-list.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);$('#status').textContent='List exported. Import it whenever you need these choices.';}catch(e){$('#status').textContent=e.message;}};
loadList.onchange=async()=>{try{if(spinning)return;const file=loadList.files[0];if(!file)return;if(file.size>20000)throw Error('Keep choice backups under 20 KB.');const data=JSON.parse(await file.text());if(spinning)throw Error('Wait for the spin to finish.');if(data.format!=='synapse-wheel-v1'||typeof data.title!=='string'||data.title.length>100||!Array.isArray(data.options)||data.options.some(x=>typeof x!=='string'||/[\r\n]/.test(x)))throw Error('Invalid choice-list backup.');const values=parseOptions(data.options.join('\n'));$('#options').value=values.join('\n');$('#question').value=data.title;history=[];update();renderHistory();$('#status').textContent='Choice list imported. Previous picks cleared.';}catch(e){$('#status').textContent=e.message;}finally{loadList.value='';}};
