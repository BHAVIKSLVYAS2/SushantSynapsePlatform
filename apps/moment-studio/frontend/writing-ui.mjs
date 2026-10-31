import {createLocalWriter,writingActions,writingLanguages} from './local-writing.mjs';

// One assistant inside each existing editor; the host owns rendering and dirty state.
export function mountWritingAssistant({trigger,panel,getContext,getText,apply,maxLength=600}){
 const writer=createLocalWriter();let controller=null,checkVersion=0,snapshot='',available=false;
 panel.classList.add('writing-assistant');panel.removeAttribute('aria-live');
 panel.innerHTML=`<div class="writing-heading"><h3>AI writing</h3><button type="button" id="close-ai">Close</button></div>
 <p class="hint">Runs on your device where supported. Your wording is not sent to an AI server. The browser may need a model download; nothing downloads until you choose Generate.</p>
 <p id="ai-capability" role="status"></p>
 <label for="ai-action">Writing action<select id="ai-action"></select></label>
 <label for="ai-prompt">Describe what you need<textarea id="ai-prompt" rows="3" maxlength="1000" placeholder="Write a professional birthday invitation for my family"></textarea></label>
 <details id="ai-personalization"><summary>Personalize <span>Optional · reuses your editor details</span></summary>
 <div class="writing-fields"><label>Occasion<input id="ai-occasion" maxlength="100" placeholder="e.g. Diwali or retirement"></label><label>Recipient name<input id="ai-recipient" maxlength="100"></label><label>Sender name<input id="ai-sender" maxlength="100"></label><label>Relationship<input id="ai-relationship" maxlength="100" placeholder="e.g. colleague or sister"></label><label>Event date<input id="ai-date" type="date"></label><label>Event location<input id="ai-location" maxlength="100"></label></div>
 <p class="hint">Unknown details are omitted. Add only what matters for this wording.</p></details>
 <div class="writing-fields"><label>Tone<select id="ai-tone"><option value="warm">Warm</option><option value="formal">Formal</option><option value="friendly">Friendly</option><option value="emotional">Emotional</option><option value="neutral">Neutral</option></select></label><label>Language<select id="ai-language"></select></label><label>Desired length<select id="ai-length"><option value="short">Short</option><option value="medium" selected>Medium</option><option value="long">Long · up to the editor limit</option></select></label></div>
 <div class="writing-buttons"><button type="button" id="generate-ai" class="primary" disabled>Generate with local AI</button><button type="button" id="cancel-ai" hidden>Cancel</button></div>
 <p id="ai-status" role="status" aria-live="polite"></p>
 <label for="ai-result">Review and edit the suggestion<textarea id="ai-result" rows="5"></textarea></label>
 <p class="hint">AI can make mistakes. Check names, dates, locations and meaning before applying. No missing event information should be treated as confirmed.</p>
 <button type="button" id="apply-ai" hidden>Apply to design</button>`;
 const $=id=>panel.querySelector('#'+id),result=$('ai-result'),generate=$('generate-ai'),status=$('ai-status'),applyButton=$('apply-ai'),cancelButton=$('cancel-ai');
 result.maxLength=maxLength;result.value='';
 for(const [key,label]of Object.entries(writingActions))$('ai-action').add(new Option(label,key));
 for(const [key,label]of Object.entries(writingLanguages))$('ai-language').add(new Option(label,key));
 // Assistant fields are not editor fields. Keep their input/change events out of
 // host preview/dirty handlers and shared language form synchronization.
 panel.addEventListener('input',event=>event.stopPropagation());panel.addEventListener('change',event=>event.stopPropagation());
 const busy=value=>{panel.setAttribute('aria-busy',String(value));for(const control of panel.querySelectorAll('input,select,textarea'))control.disabled=value;generate.disabled=value||!available;cancelButton.hidden=!value;applyButton.disabled=value;};
 async function check(){
  const version=++checkVersion;available=false;generate.disabled=true;$('ai-capability').textContent='Checking local AI support…';
  const state=await writer.availability($('ai-language').value);if(version!==checkVersion||panel.hidden)return;
  $('ai-capability').textContent=state.message;available=state.qualityApproved&&['available','downloadable','downloading'].includes(state.state);generate.disabled=!available;
  generate.textContent=state.state==='downloadable'?'Download browser model & generate':state.state==='downloading'?'Wait for model & generate':'Generate with local AI';
 }
 function close(){checkVersion++;controller?.abort();panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}
 trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
 trigger.textContent='AI writing';
 trigger.onclick=()=>{
  if(!panel.hidden){close();return;}
  const context=getContext();for(const key of ['occasion','recipient','sender','relationship','date','location'])$('ai-'+key).value=context[key]||'';
  $('ai-language').value=Object.hasOwn(writingLanguages,context.language)?context.language:'en';
  panel.hidden=false;trigger.setAttribute('aria-expanded','true');status.textContent='';result.value='';applyButton.hidden=true;
  $('ai-prompt').focus();check();
 };
 $('close-ai').onclick=close;
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
 $('ai-language').addEventListener('change',()=>{applyButton.hidden=true;result.value='';check();});
 cancelButton.onclick=()=>controller?.abort();
 generate.onclick=async()=>{
  if(controller||!available)return;
  const context={...getContext()};for(const key of ['occasion','recipient','sender','relationship','date','location'])context[key]=$('ai-'+key).value.trim();
  const input={action:$('ai-action').value,prompt:$('ai-prompt').value,text:getText(),context,language:$('ai-language').value,tone:$('ai-tone').value,length:$('ai-length').value,maxLength};
  if(input.action==='generate'&&!input.prompt.trim()){status.textContent='Describe the wording you need.';$('ai-prompt').focus();return;}
  if(input.action!=='generate'&&!input.text.trim()){status.textContent='Write some text in the editor before choosing a rewrite action.';return;}
  if(['hi','gu','hinglish'].includes(input.language))return;
  snapshot=JSON.stringify({text:getText(),context:getContext()});controller=new AbortController();busy(true);applyButton.hidden=true;status.textContent='Preparing the local model…';
  const timeout=setTimeout(()=>controller?.abort(),120000);let ready=false;
  try{
   const suggestion=await writer.write(input,{signal:controller.signal,onProgress:event=>{status.textContent=event.stage==='download'?`Downloading browser model: ${Math.round(event.progress*100)}%.`:event.stage==='checking'?'Checking real English model output and detail preservation…':'Writing on this device…';}});
   result.value=suggestion.text;applyButton.hidden=false;ready=true;status.textContent='AI suggestion ready. Review and edit it before applying. '+suggestion.checks+'.';
  }catch(error){status.textContent=error.name==='AbortError'?'Cancelled waiting for local AI. Your editor text is unchanged. The browser may continue managing its model download.':'No suggestion applied. '+(error.message||'Local AI could not finish. Try again.');}
  finally{clearTimeout(timeout);controller=null;busy(false);if(ready&&!panel.hidden)result.focus();}
 };
 applyButton.onclick=()=>{
  const text=result.value.trim();if(!text){status.textContent='Write a suggestion before applying.';result.focus();return;}
  if([...text].length>maxLength){status.textContent=`Shorten the suggestion to ${maxLength} characters.`;return;}
  if(snapshot!==JSON.stringify({text:getText(),context:getContext()})&&!confirm('The editor changed while this suggestion was open. Replace its current wording with the reviewed suggestion?'))return;
  apply(text);close();
 };
 return {close};
}
