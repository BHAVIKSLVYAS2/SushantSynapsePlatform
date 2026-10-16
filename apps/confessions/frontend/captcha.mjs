// First-party, one-use arithmetic check. No third-party widget or tracking.
export function mountCaptcha({api,form,message}){
 const fieldset=document.createElement('fieldset');fieldset.className='captcha';fieldset.hidden=true;
 fieldset.innerHTML='<legend>Quick check</legend><label for="captcha-answer" id="captcha-question">Answer a small sum before posting.</label><div class="captcha-controls"><input id="captcha-answer" inputmode="numeric" autocomplete="off" maxlength="2" pattern="[0-9]{1,2}" aria-describedby="captcha-status" required disabled><button id="captcha-new" type="button">New question</button></div><p id="captcha-status" role="status">No sign-in or personal details needed.</p>';
 form.querySelector('.composer-actions').before(fieldset);
 const answer=fieldset.querySelector('input'),button=fieldset.querySelector('button'),question=fieldset.querySelector('label'),status=fieldset.querySelector('p');let challenge=null,pending=null;
 function reset(){challenge=null;answer.value='';answer.disabled=true;question.textContent='Answer a small sum before posting.';}
 async function load(){if(pending)return pending;reset();button.disabled=true;status.textContent='Getting a question…';pending=(async()=>{try{challenge=await api('/challenge',{method:'POST',body:'{}'});question.textContent=challenge.question;answer.disabled=false;status.textContent='Valid for 5 minutes. Each question works once.';return true;}catch(error){status.textContent=error.message;return false;}finally{button.disabled=false;pending=null;}})();return pending;}
 button.onclick=async()=>{if(await load())answer.focus();};
 message.addEventListener('focus',()=>{fieldset.hidden=false;if(!challenge&&!pending)load();});
 return {
  async values(){fieldset.hidden=false;if(pending)await pending;if(!challenge||challenge.expiresAt<=Date.now()){if(await load()){status.textContent='Please answer the new question before posting.';answer.focus();}return null;}if(!answer.reportValidity())return null;return {captchaId:challenge.id,captchaAnswer:answer.value};},
  reset({collapse=false}={}){reset();fieldset.hidden=collapse;status.textContent='Choose New question when you’re ready to post again.';},
  lock(value){button.disabled=value;answer.readOnly=value;}
 };
}
