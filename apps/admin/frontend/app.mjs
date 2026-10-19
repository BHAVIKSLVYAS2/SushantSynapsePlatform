import {escapeHtml as esc} from '/shared/text.mjs';
const $=selector=>document.querySelector(selector);
let index,view,busy=false,revision=0;
let accountSessionSeen=false;
const accountPage=location.pathname==='/account';
$('.admin-header').insertAdjacentHTML('afterend','<nav class="admin-footer" aria-label="Account navigation"><a href="/account">My account</a><button id="switch-account" type="button" hidden>Switch account</button></nav>');
if(accountPage){document.title='My account · Sushant Synapse';$('.intro h1').textContent='My account';$('.intro p').textContent='Your organisations, memberships and assigned apps.';$('#organisation').closest('label').hidden=true;}
const themeControl=$('[data-theme-select]');
themeControl.value=window.SynapseTheme.read();
themeControl.addEventListener('change',()=>window.SynapseTheme.write(themeControl.value));
const cap=n=>n===null?'Unlimited':n;
const opts=(values,current)=>values.map(v=>{const [value,label]=Array.isArray(v)?v:[v,v];return `<option value="${esc(value)}"${value===current?' selected':''}>${esc(label)}</option>`;}).join('');
const field=(label,name,value='',type='text',extra='')=>`<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select=(label,name,values,current)=>`<label>${esc(label)}<select name="${name}">${opts(values,current)}</select></label>`;
// Shared by both local administration entry pages; no secret enters a URL/storage.
$('#signin').outerHTML=`<section class="card" id="signin" hidden><h2>Sign in</h2><form id="admin-login">${field('Account email','email','','email','required autocomplete="username"')}${field('Password','password','','password','required maxlength="128" autocomplete="current-password"')}<button type="submit">Sign in</button></form><details><summary>Activate a new Master Admin account</summary><p>Use the secret supplied privately by your Super Admin. Existing accounts should sign in and accept their invitation below.</p><form id="new-master">${field('Invitation secret','token','','text','required minlength="64" maxlength="64" autocomplete="off" spellcheck="false"')}${field('Invited email','email','','email','required maxlength="200" autocomplete="username"')}${field('Your name','name','','text','required maxlength="120" autocomplete="name"')}${field('Choose a password','password','','password','required minlength="12" maxlength="128" autocomplete="new-password"')}<button type="submit">Activate account</button></form></details></section>`;
const reason=()=>field('Reason for change','reason','','text','required maxlength="500"');
$('#new-master [name="token"]').closest('label').firstChild.textContent='New account invitation secret';
$('#signin summary').textContent='Activate a new account';
$('#signin details p').textContent='Use the secret shared privately by your administrator. Existing accounts should sign in and accept their invitation below.';
$('#new-master').insertAdjacentHTML('afterbegin',select('New account invitation type','primary',[['true','Primary Master Admin'],['false','Organisation staff or client']],'true'));
$('.toolbar').insertAdjacentHTML('beforeend','<button id="admin-signout" type="button">Sign out</button>');
const form=(id,title,body,submit)=>`<details class="card"><summary>${title}</summary><form data-command="${id}">${body}${reason()}<button type="submit">${submit}</button></form></details>`;
function status(text){$('#status').textContent=text;}
async function api(path='',body){const response=await fetch('/api/organisation-admin'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await response.json();if(!response.ok){const error=new Error(data.error||'Request failed');error.status=response.status;throw error;}return data;}
function controls(disabled){busy=disabled;document.querySelectorAll('button,#organisation').forEach(el=>el.disabled=disabled);}
function secret(result){if(!result.invitation)return;$('#secret').value=result.invitation.token;$('#secret-panel').hidden=false;$('#secret-panel').scrollIntoView({block:'nearest'});}
function clearSecret(){$('#secret').value='';$('#secret-panel').hidden=true;$('#accept [name="token"]').value='';}
function clearCredentials(){for(const id of ['admin-login','new-master'])$('#'+id).reset();$('#own-password')?.reset();const password=$('form[data-command="recovery-export"] [name="password"]');if(password)password.value='';}
const limitField=(label,name,value)=>field(label+' (blank = unlimited)',name,value===null?'':value,'number','min="0" step="1"');
function licenceFields(l={}){return select('App','appId',index.apps.map(a=>[a.id,a.name]),l.appId)+select('Licence status','status',['Scheduled','Trial','Active','Suspended','Expired','Revoked'],l.status||'Active')+field('Starts at (UTC)','startsAt',l.startsAt||new Date().toISOString(),'text','required')+field('Ends at (UTC, blank = no expiry)','endsAt',l.endsAt)+field('Read-only until (UTC, optional)','readOnlyUntil',l.readOnlyUntil)+limitField('App staff seats','staffLimit',l.staffLimit??null)+limitField('App client seats','clientLimit',l.clientLimit??null);}
function render(){
 const org=view?.organisation,usage=view?.usage;
 $('#summary').innerHTML=org?`<h2>${esc(org.name)} <span class="badge">${esc(org.status)}</span></h2><div class="metrics"><div class="metric"><strong>${usage.members.staff} / ${cap(org.staffLimit)}</strong><span>Staff seats, including invitations</span></div><div class="metric"><strong>${usage.members.client} / ${cap(org.clientLimit)}</strong><span>Client seats, including invitations</span></div><div class="metric"><strong>${org.licences.length}</strong><span>App licences</span></div></div>`:'<p>No organisations to manage. You can accept an invitation below.</p>';
 let html='';
 if(org){
  html+=`<div class="panel-grid"><section class="card"><h2>Members</h2><div class="people">${view.members.map(m=>`<div class="person"><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small><span class="badge">${esc(m.role)}</span><small>${esc(m.status)}${m.active?'':' · Account inactive'}</small></div>`).join('')}</div></section><section class="card"><h2>App licences</h2><div class="licences">${org.licences.map(l=>`<div class="licence"><strong>${esc(index.apps.find(a=>a.id===l.appId)?.name||l.appId)}</strong><span class="badge">${esc(l.status)}</span><small>Staff ${usage.apps[l.appId]?.staff||0} / ${cap(l.staffLimit)} · Clients ${usage.apps[l.appId]?.client||0} / ${cap(l.clientLimit)}</small><small>Ends ${esc(l.endsAt||'without expiry')}</small></div>`).join('')}</div></section></div>`;
  const members=view.members.map(m=>[m.userId,`${m.name} · ${m.role} · ${m.status}`]);
  html+=form('invite','Invite or reissue invitation',field('Existing account email','email','','email','required')+select('Membership role','role',['Staff','Administrator','Client']),'Create invitation');
  html+=form('member','Update a membership',select('Member','userId',members)+select('Membership role','role',['Staff','Administrator','Client'])+select('Membership status','status',['Active','Inactive']),'Update membership');
  html+=form('revoke-invitation','Revoke a pending invitation',select('Invited member','userId',view.members.filter(m=>m.status==='Invited'&&m.role!=='MasterAdmin').map(m=>[m.userId,m.name])),'Revoke invitation');
  html+=form('assignment','App access',select('App','appId',index.apps.filter(a=>(index.assignmentApps||['advocate']).includes(a.id)).map(a=>[a.id,a.name]))+select('Member','userId',members)+select('App role','role',['Clerk','Advocate','Owner'])+select('Assignment status','status',['Active','Inactive']),'Save app access');
  if(index.superAdmin){
   if(['Active','Suspended'].includes(org.status))html+=form('status','Organisation availability','<p>Suspension blocks organisation access and invitation acceptance. Memberships, records and licence dates are preserved. Reactivation rechecks existing permissions and licences.</p>'+select('Organisation status','status',[org.status==='Active'?['Suspended','Suspend organisation']:['Active','Reactivate organisation']])+field('Type organisation name to confirm','confirmation','','text','required maxlength="160" autocomplete="off"'),'Update organisation status');
   html+=form('licence','Manage an app licence',licenceFields(org.licences[0]),'Save licence');
   html+=form('limits','Organisation seat limits',limitField('Organisation staff seats','staffLimit',org.staffLimit)+limitField('Organisation client seats','clientLimit',org.clientLimit),'Save limits');
   html+=form('transfer','Transfer primary Master Admin',select('New primary Master Admin','userId',view.members.filter(m=>m.status==='Active'&&['Staff','Administrator'].includes(m.role)).map(m=>[m.userId,m.name]))+select('Previous Master Admin becomes','previousMasterRole',['Staff','Administrator']),'Transfer Master Admin');
   if(org.status==='PendingActivation')html+=form('master-invitation','Primary activation invitation',select('Invitation action','revokeOnly',[['false','Reissue'],['true','Revoke']]),'Update activation invitation');
  }
 }
 if(index.superAdmin)html+=form('provision','Create an organisation',field('Organisation name','name','','text','required maxlength="160"')+field('Organisation type','type','Legal','text','required maxlength="80"')+field('Master Admin account email','masterAdminEmail','','email','required')+field('Timezone','timezone','Asia/Kolkata','text','required')+limitField('Organisation staff seats','orgStaff',5)+limitField('Organisation client seats','orgClients',0)+licenceFields({appId:'advocate',staffLimit:5,clientLimit:0}),'Create organisation');
 $('#panels').innerHTML=html;
 const assignmentForm=$('form[data-command="assignment"]');
 assignmentForm?.elements.appId.addEventListener('change',()=>{assignmentForm.elements.role.innerHTML=opts(assignmentForm.elements.appId.value==='tournament-lite'?['Advocate','Owner']:['Clerk','Advocate','Owner']);});
 if(org)$('#panels').insertAdjacentHTML('afterbegin',`<section class="card"><a href="/organisation-audit?organisation=${encodeURIComponent(org.id)}">Review organisation audit</a></section>`);
 if(index.superAdmin)$('#panels').insertAdjacentHTML('beforeend','<section class="card"><a href="/platform-audit">Review platform audit</a></section>');
 if(index.superAdmin&&index.recoveryExportAvailable!==false)$('#panels').insertAdjacentHTML('beforeend',form('recovery-export','Platform recovery backup','<p>This downloads all organisations, private records, documents, account password hashes and audit history. Keep the file private. Sessions are excluded. Restore offline into a new empty SQLite database.</p>'+field('Your current password','password','','password','required maxlength="128" autocomplete="current-password"')+field('Type EXPORT ALL ORGANISATIONS','confirmation','','text','required autocomplete="off"'),'Download full recovery backup'));
 const provision=$('form[data-command="provision"]');
 if(provision)provision.insertAdjacentHTML('afterbegin',select('Master Admin account type','newAccount',[['false','Existing active account'],['true','New account — invitation activation required']],'false'));
 const invite=$('form[data-command="invite"]');
 if(invite){
  invite.insertAdjacentHTML('afterbegin',select('Invited account type','newAccount',[['false','Existing active account'],['true','New or pending account']],'false'));
  const type=invite.elements.newAccount,emailLabel=invite.elements.email.closest('label').firstChild;
  type.addEventListener('change',()=>{emailLabel.textContent=type.value==='true'?'New or pending account email':'Existing account email';});
 }
 const appSelect=$('form[data-command="licence"] select[name="appId"]');
 appSelect?.addEventListener('change',()=>{const l=org.licences.find(l=>l.appId===appSelect.value);if(!l)return;for(const name of ['status','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'])appSelect.form.elements[name].value=l[name]??'';});
}
async function load(selected,strict=false){
 if(accountPage){
  const current=++revision,account=await api('/account');if(current!==revision||document.hidden)return;
  index=account;view=null;clearCredentials();$('#signin').hidden=true;$('#workspace').hidden=false;$('#accept-panel').hidden=false;
  $('#summary').innerHTML=`<h2>${esc(account.identity.name)}</h2><p>${esc(account.identity.email)}</p>${account.superAdmin?'<p><a href="/super-admin">Open Super Admin</a></p>':''}`;
  $('#panels').innerHTML=account.memberships.length?account.memberships.map(org=>`<section class="card"><h2>${esc(org.name)}</h2><p>${esc(org.role)} · ${esc(org.membershipStatus)} membership · Organisation ${esc(org.status)}</p>${org.administration?`<p><a href="/admin?organisation=${encodeURIComponent(org.id)}">Manage this organisation</a></p>`:''}${org.role==='Client'?'<p>Client portal unavailable — not implemented yet.</p>':org.apps.map(app=>`<div class="licence"><strong>${esc(app.name)}</strong><p>${app.assigned?'Assigned role: '+esc(app.role):'No app assignment'}</p>${app.available?`<a href="/${app.id==='tournament-lite'?'tournament-lite':'advocate'}?organisation=${encodeURIComponent(org.id)}">Open ${esc(app.name)}${app.mode==='read-only'?' (read-only)':''}</a>`:`<p>App access unavailable. ${app.reason==='missing-assignment'?'Ask your Master Admin for an app assignment.':'Your membership, organisation and licence must allow access.'}</p>`}</div>`).join('')}</section>`).join(''):'<section class="card"><h2>No organisation memberships</h2><p>Accept an invitation below or ask your organisation administrator for one.</p></section>';
  const cards=$('#panels').querySelectorAll('section');account.memberships.forEach((org,i)=>{if(org.clientAccessManagement)cards[i].insertAdjacentHTML('beforeend',`<p><a href="/client-access?organisation=${encodeURIComponent(org.id)}">Manage client record links</a></p>`);});
  account.memberships.forEach((org,i)=>{if(org.role==='Client'){const message=[...cards[i].querySelectorAll('p')].find(p=>p.textContent.startsWith('Client portal unavailable'));if(message){if(org.clientPortal==='Available')message.innerHTML=`<a href="/client-portal?organisation=${encodeURIComponent(org.id)}">Open client portal</a>`;else message.textContent='Client portal unavailable. Ask your administrator to approve record links and portal access.';}}});
  accountSessionSeen=true;$('#account-security')?.remove();
  $('#workspace').insertAdjacentHTML('beforeend',`<details class="card" id="account-security"><summary>Change your password</summary><p>Use 12–128 characters. Other sessions will be signed out; this session will be renewed.</p><form id="own-password">${field('Current password','currentPassword','','password','required maxlength="128" autocomplete="current-password"')}${field('New password','newPassword','','password','required minlength="12" maxlength="128" autocomplete="new-password"')}${field('Confirm new password','confirmation','','password','required minlength="12" maxlength="128" autocomplete="new-password"')}<button type="submit">Change password</button></form></details>`);
  status('Account ready.');return;
 }
 const current=++revision;index=await api();if(current!==revision)return;
 if(strict&&selected&&!index.organisations.some(o=>o.id===selected))throw new Error('Organisation administration is unavailable for this account.');
 $('#switch-account').hidden=true;
 if(location.pathname==='/super-admin'&&!index.superAdmin){
  clearSecret();clearCredentials();view=null;$('#panels').replaceChildren();$('#summary').replaceChildren();$('#organisation').replaceChildren();$('#workspace').hidden=true;$('#accept-panel').hidden=true;$('#switch-account').hidden=false;
  throw new Error('Super Admin access is required for this page. Switch account to sign in with your Super Admin email.');
 }
 $('#workspace').hidden=false;$('#accept-panel').hidden=false;$('#signin').hidden=true;clearCredentials();
 $('#organisation').innerHTML=opts(index.organisations.map(o=>[o.id,`${o.name} · ${o.status}`]),selected);
 if(selected&&index.organisations.some(o=>o.id===selected))$('#organisation').value=selected;
 view=$('#organisation').value?await api('/organisations/'+encodeURIComponent($('#organisation').value)):null;
 if(current!==revision)return;render();status('Workspace ready.');
}
async function run(task){if(busy)return;controls(true);status('Saving…');try{await task();}catch(error){status(accountPage&&accountSessionSeen&&error.status===401?'Session expired. Sign in again.':error.message+(error.status===409?' Refresh the workspace before retrying.':''));if([401,403].includes(error.status)&&error.code!=='reauthentication-failed'){clearSecret();if(accountPage)clearAccount();$('#workspace').hidden=true;view=null;}if(error.status===401)$('#signin').hidden=false;}finally{controls(false);}}
function licenceData(data){return {appId:data.appId,status:data.status,startsAt:data.startsAt,endsAt:data.endsAt||null,readOnlyUntil:data.readOnlyUntil||null,staffLimit:data.staffLimit===''?null:Number(data.staffLimit),clientLimit:data.clientLimit===''?null:Number(data.clientLimit)};}
document.addEventListener('submit',event=>{
 if(event.target.id==='own-password'){
  event.preventDefault();const form=event.target,data=Object.fromEntries(new FormData(form)),passwordRevision=revision;
  run(async()=>{try{
   if(data.newPassword!==data.confirmation)throw new Error('New passwords do not match');
   const response=await fetch('/api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:data.currentPassword,newPassword:data.newPassword}),cache:'no-store'});
   const result=await response.json();if(!response.ok){const error=new Error(result.error||'Password change failed');error.status=response.status;throw error;}
   clearCredentials();if(passwordRevision===revision&&!document.hidden){await load();status('Password changed. Other sessions are signed out; this session was renewed.');}
  }finally{form.reset();}});return;
 }
 if(['admin-login','new-master'].includes(event.target.id)){
  event.preventDefault();const form=event.target,data=Object.fromEntries(new FormData(form));
  run(async()=>{
   if(form.id==='new-master'){
    await api(data.primary==='false'?'/activate-new-member':'/activate-new-master',data);clearCredentials();status('Account activated. Sign in with your invited email and chosen password.');
   }else{
    const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Sign-in failed');
    clearCredentials();await load(new URLSearchParams(location.search).get('organisation'),true);
    if(accountPage&&index?.superAdmin)location.assign('/super-admin');
   }
  });return;
 }
 const form=event.target;if(!form.dataset.command&&form.id!=='accept')return;event.preventDefault();
 const data=Object.fromEntries(new FormData(form)),command=form.dataset.command,selected=$('#organisation').value;
 run(async()=>{
  let result;
  if(command==='recovery-export'){
   try{
    const response=await fetch('/api/organisation-admin/recovery-export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});
    if(!response.ok){const problem=await response.json();const error=new Error(problem.error||'Recovery export failed');error.status=response.status;error.code=problem.code;throw error;}
    const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='synapse-platform-recovery.sql';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    form.reset();status('Recovery backup downloaded. Store it privately; restore offline into a new empty database.');
   }finally{form.elements.password.value='';}
   return;
  }
  if(form.id==='accept')result=await api('/accept',{primary:data.primary==='true',token:data.token});
  else if(command==='provision')result=await api('/provision',{newAccount:data.newAccount==='true',name:data.name,type:data.type,timezone:data.timezone,masterAdminEmail:data.masterAdminEmail,staffLimit:data.orgStaff===''?null:Number(data.orgStaff),clientLimit:data.orgClients===''?null:Number(data.orgClients),licences:[licenceData(data)]});
  else{
   let body={...data,version:view.organisation.version};
   if(command==='invite')body.newAccount=data.newAccount==='true';
   if(command==='licence')body={...body,...licenceData(data),licenceVersion:view.organisation.licences.find(l=>l.appId===data.appId)?.version||0};
   if(command==='limits')for(const name of ['staffLimit','clientLimit'])body[name]=data[name]===''?null:Number(data[name]);
   if(command==='master-invitation')body.revokeOnly=data.revokeOnly==='true';
   result=await api('/organisations/'+encodeURIComponent(selected)+'/'+command,body);
  }
  clearSecret();await load(result.organisationId||selected);secret(result);status('Change saved.');
 });
});
$('#organisation').addEventListener('change',()=>{clearSecret();run(()=>load($('#organisation').value));});
$('#refresh').addEventListener('click',()=>run(()=>load($('#organisation').value)));
$('#dismiss-secret').addEventListener('click',clearSecret);
const signOut=()=>run(async()=>{
 const response=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 if(!response.ok&&response.status!==401)throw new Error('Sign-out failed');
 clearSecret();clearCredentials();view=null;index=null;revision++;accountSessionSeen=false;
 $('#panels').replaceChildren();$('#summary').replaceChildren();$('#organisation').replaceChildren();
 $('#workspace').hidden=true;$('#accept-panel').hidden=true;$('#signin').hidden=false;$('#switch-account').hidden=true;status('Please sign in');
});
$('#admin-signout').addEventListener('click',signOut);$('#switch-account').addEventListener('click',signOut);
addEventListener('pagehide',()=>{clearSecret();clearCredentials();});
function clearAccount(){if(!accountPage)return;revision++;clearCredentials();index=null;view=null;$('#workspace').hidden=true;$('#accept-panel').hidden=true;$('#summary').replaceChildren();$('#panels').replaceChildren();$('#account-security')?.remove();}
addEventListener('pagehide',clearAccount);
async function revalidateAccount(){clearAccount();try{await load();}catch(error){clearAccount();status(accountSessionSeen&&error.status===401?'Session expired. Sign in again.':error.message);if(error.status===401)$('#signin').hidden=false;}}
addEventListener('pageshow',event=>{if(accountPage&&event.persisted)revalidateAccount();});
document.addEventListener('visibilitychange',()=>{if(accountPage){clearAccount();if(!document.hidden)revalidateAccount();}});
try{await load(new URLSearchParams(location.search).get('organisation'),true);}catch(error){status(error.message);if(error.status===401)$('#signin').hidden=false;}
