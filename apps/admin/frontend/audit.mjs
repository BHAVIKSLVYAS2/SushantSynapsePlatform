const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const platform=location.pathname==='/platform-audit';
if(platform){document.title='Platform audit';$('h1').textContent='Platform audit';$('.preview-note').textContent=(document.documentElement.dataset.runtime==='cloud'?'Organisation workspace: ':'Local preview: ')+'Super Admin bootstrap and recovery export metadata. Export creation does not confirm delivery or restoration.';}
const organisation=new URLSearchParams(location.search).get('organisation');let revision=0,next=null;
const words=value=>value.replace(/([a-z])([A-Z])/g,'$1 $2');
const labels={scope:'Scope',includesAccountHashes:'Includes account hashes',includesDocuments:'Includes documents',excludesSessions:'Excludes sessions',reason:'Reason',before:'Before',after:'After',userId:'Member ID',masterAdminUserId:'Primary administrator ID',previousUserId:'Previous member ID',appId:'App ID',appIds:'Apps',staffLimit:'Staff seats',clientLimit:'Client seats',startsAt:'Starts at',endsAt:'Ends at',readOnlyUntil:'Read-only until',previousMasterRole:'Previous administrator role',links:'Links cleared'};
function detail(key,value){const text=value===null?(['staffLimit','clientLimit'].includes(key)?'Unlimited':'None'):Array.isArray(value)?value.join(', '):String(value);return `<dt>${esc(labels[key]||words(key))}</dt><dd>${value&&typeof value==='object'&&!Array.isArray(value)?'<dl>'+Object.entries(value).map(([k,v])=>detail(k,v)).join('')+'</dl>':esc(text)}</dd>`;}
$('#theme').value=window.SynapseTheme.read();$('#theme').addEventListener('change',()=>window.SynapseTheme.write($('#theme').value));
function clear(){revision++;next=null;$('#workspace').hidden=true;$('#workspace').replaceChildren();$('#older').hidden=true;}
async function load(before){
 const action=$('#filter select').value;clear();const current=revision;$('#status').textContent='Checking access…';
 try{
  if(platform&&organisation)throw new Error('Open platform history without an organisation selection.');
  if(!platform&&(!organisation||!/^[a-zA-Z0-9-]{1,200}$/.test(organisation)))throw new Error('Choose an organisation from administration.');
  const params=new URLSearchParams({limit:'20'});if(action)params.set('action',action);if(before)params.set('before',before);
  const response=await fetch((platform?'/api/organisation-admin/platform-audit':'/api/organisation-admin/organisations/'+encodeURIComponent(organisation)+'/audit')+'?'+params,{cache:'no-store'}),data=await response.json();
  if(current!==revision||document.hidden)return;
  if(!response.ok)throw new Error(response.status===401?'Session expired. Open My account to sign in again.':data.error||'Audit unavailable');
  $('#filter select').innerHTML='<option value="">All actions</option>'+data.actions.map(a=>`<option value="${esc(a)}">${esc(words(a))}</option>`).join('');$('#filter select').value=action;
  $('#workspace').innerHTML=`<h2>${esc(platform?'Platform-wide events':data.organisation.name)}</h2>${data.events.map(event=>`<article class="card"><h3>${esc(words(event.action))}</h3><p>Event ${event.id} · ${esc(new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(new Date(event.at)))} IST</p><p>Actor ID: ${esc(event.actorUserId)}</p><dl>${Object.entries(event.details).map(([key,value])=>detail(key,value)).join('')}</dl></article>`).join('')||'<p>No matching events.</p>'}`;
  $('#workspace').hidden=false;next=data.nextBefore;$('#older').hidden=!next;$('#status').textContent='Audit ready.';
 }catch(error){if(current===revision){clear();$('#status').textContent=error.message;}}
}
$('#filter').addEventListener('submit',event=>{event.preventDefault();load();});$('#refresh').addEventListener('click',()=>load());$('#older').addEventListener('click',()=>load(next));
addEventListener('pagehide',clear);addEventListener('pageshow',event=>{if(event.persisted)load();});document.addEventListener('visibilitychange',()=>{clear();if(!document.hidden)load();});load();
