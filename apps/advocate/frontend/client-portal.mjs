const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const organisation=new URLSearchParams(location.search).get('organisation');let revision=0;
$('#theme').value=window.SynapseTheme.read();$('#theme').addEventListener('change',()=>window.SynapseTheme.write($('#theme').value));
function clear(){revision++;$('#workspace').hidden=true;$('#workspace').replaceChildren();}
async function load(){
 clear();const current=revision;$('#status').textContent='Checking access…';
 try{
  if(!organisation||!/^[a-zA-Z0-9-]{1,200}$/.test(organisation))throw new Error('Choose an organisation from My account.');
  const response=await fetch('/api/client-portal/'+encodeURIComponent(organisation),{cache:'no-store'}),data=await response.json();
  if(current!==revision||document.hidden)return;
  if(!response.ok)throw new Error(response.status===401?'Session expired. Open My account to sign in again.':data.error||'Client portal access is unavailable');
  $('#workspace').innerHTML=`<h2>${esc(data.organisation.name)}</h2><p>Read-only${data.licenceMode==='read-only'?' · Licence grace':''}. Details are maintained by your chambers.</p>${data.clients.map(client=>`<section class="card"><h2>${esc(client.name)}</h2>${data.cases.filter(c=>c.clientId===client.id).map(c=>`<article class="person"><h3>${esc(c.number||'Case details')}</h3><dl>${[['CNR',c.cnr],['Court',c.court],['Stage',c.stage],['Status',c.status]].map(([label,value])=>`<dt>${label}</dt><dd>${esc(value||'Not entered')}</dd>`).join('')}</dl></article>`).join('')||'<p>No case details to show.</p>'}</section>`).join('')}`;
  $('#workspace').hidden=false;$('#status').textContent='Portal ready.';
 }catch(error){if(current===revision){clear();$('#status').textContent=error.message;}}
}
$('#refresh').addEventListener('click',load);addEventListener('pagehide',clear);addEventListener('pageshow',event=>{if(event.persisted)load();});
document.addEventListener('visibilitychange',()=>{clear();if(!document.hidden)load();});load();
