const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const organisationId=new URLSearchParams(location.search).get('organisation');
let view=null,busy=false,revision=0;
$('#theme').value=window.SynapseTheme.read();$('#theme').addEventListener('change',()=>window.SynapseTheme.write($('#theme').value));
const status=text=>$('#status').textContent=text;
function clear(){revision++;view=null;$('#workspace').hidden=true;$('#workspace').replaceChildren();}
async function api(body,operation='client-access'){
 if(!organisationId||!/^[a-zA-Z0-9-]{1,200}$/.test(organisationId))throw new Error('Choose an organisation from My account.');
 const response=await fetch('/api/chambers/'+encodeURIComponent(organisationId)+'/'+operation,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const result=await response.json();if(!response.ok){const error=new Error(result.error||'Request failed');error.status=response.status;throw error;}return result;
}
function render(){
 const option=(id,label)=>`<option value="${esc(id)}">${esc(label)}</option>`;
 $('#workspace').innerHTML=`<h2>${esc(view.name)}</h2><p>${view.readOnly?'Read-only licence grace: link changes are unavailable.':'Links identify records explicitly. They do not open the client portal.'}</p><section class="card"><h2>Grant a client record link</h2>${view.members.length&&view.records.length?`<form id="grant"><label>Client member<select name="userId">${view.members.map(m=>option(m.userId,`${m.name} · ${m.email}`)).join('')}</select></label><label>Client record<select name="clientId">${view.records.map(r=>option(r.id,r.name)).join('')}</select></label><label>Reason for grant<input name="reason" required maxlength="500"></label><button type="submit" ${view.readOnly?'disabled':''}>Grant link</button></form>`:'<p>An active client member and an unarchived client record are required.</p>'}</section><section class="card"><h2>Existing links</h2>${view.links.length?view.links.map((link,i)=>`<article class="person"><strong>${esc(link.memberName)}</strong><p>${esc(link.email)}</p><p>Client record: ${esc(link.clientName)}</p><p>Link status: ${esc(link.status)}</p>${link.status==='Active'?`<form data-revoke="${i}"><label>Reason for revocation<input name="reason" required maxlength="500"></label><button type="submit" ${view.readOnly?'disabled':''}>Revoke link</button></form>`:''}</article>`).join(''):'<p>No client record links.</p>'}</section>`;
 const members=[...new Map([...view.members,...view.entitlements].map(m=>[m.userId,m])).values()];
 $('#workspace').insertAdjacentHTML('beforeend',`<section class="card"><h2>Client portal access</h2><p>Enabling access shares linked client names and their cases' number, CNR, court, stage and status. Notes, case titles, contacts, documents, hearings and finances are excluded.</p><p>Client seats: ${view.clientSeats.used} / ${view.clientSeats.limit===null?'Unlimited':view.clientSeats.limit}. One active member uses one seat, regardless of record count. Revoking record links alone does not release this seat.</p>${view.entitlements.map(e=>`<p>${esc(e.name)} · ${esc(e.email)} · ${esc(e.status)}</p>`).join('')}${members.length?`<form id="entitlement"><label>Portal member<select name="userId">${members.map(m=>option(m.userId,`${m.name} · ${m.email}`)).join('')}</select></label><label>Portal access<select name="status"><option value="Active">Enable</option><option value="Inactive">Revoke</option></select></label><label>Reason for portal access change<input name="reason" required maxlength="500"></label><button type="submit" ${view.readOnly?'disabled':''}>Save portal access</button></form>`:'<p>An active Client member is required.</p>'}</section>`);
 $('#workspace').hidden=false;
}
async function load(){const current=++revision;const result=await api();if(current!==revision||document.hidden)return;view=result;render();status('Links ready.');}
function failure(error){status(error.status===401?'Session expired. Open My account to sign in again.':error.message+(error.status===409?' Refresh links before retrying.':''));if([401,403].includes(error.status))clear();}
$('#refresh').addEventListener('click',()=>{if(!busy){clear();load().catch(failure);}});
document.addEventListener('submit',async event=>{
 const form=event.target;if(!['grant','entitlement'].includes(form.id)&&!form.hasAttribute('data-revoke'))return;event.preventDefault();if(busy||!view||view.readOnly)return;
 const current=revision,data=Object.fromEntries(new FormData(form)),link=['grant','entitlement'].includes(form.id)?data:view.links[Number(form.dataset.revoke)];
 busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);status('Saving link…');
 try{await api({userId:link.userId,clientId:link.clientId,status:form.id==='entitlement'?data.status:form.id==='grant'?'Active':'Revoked',reason:data.reason,version:view.version},form.id==='entitlement'?'client-entitlement':'client-access');if(current===revision){await load();status(form.id==='entitlement'?'Portal access saved.':'Link saved.');}}
 catch(error){if(current===revision)failure(error);}
 finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=!!view?.readOnly&&b.type==='submit');}
});
addEventListener('pagehide',clear);addEventListener('pageshow',e=>{if(e.persisted){clear();load().catch(failure);}});
document.addEventListener('visibilitychange',()=>{clear();if(!document.hidden)load().catch(failure);});
load().catch(failure);
