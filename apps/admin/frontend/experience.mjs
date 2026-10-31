import {escapeHtml as esc} from '/shared/text.mjs';
const $=(s,root=document)=>root.querySelector(s);
const zone='Asia/Kolkata';
export const localDate=value=>value?new Date(new Date(value).getTime()+19800000).toISOString().slice(0,-1):'';
export const apiDate=value=>value?new Date(value+'+05:30').toISOString():null;
const date=value=>value?new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(value))+' IST':'No expiry';
const cap=n=>n===null?'Unlimited':String(n);
const roles={advocate:['Clerk','Advocate','Owner'],'tournament-lite':['Advocate','Owner'],'batchfee-lite':['Viewer','Collector','Manager','Owner'],'digital-samaj':['Member','Owner'],'pandit-booking':['Customer','Pandit','Dispatcher','Reviewer','Owner']};
function validateDates(start,end,grace){
 end.setCustomValidity('');grace.setCustomValidity('');
 if(end.value&&start.value&&apiDate(end.value)<=apiDate(start.value))end.setCustomValidity('End time must follow the start time.');
 if(grace.value&&(!end.value||apiDate(grace.value)<=apiDate(end.value)))grace.setCustomValidity('Read-only grace must follow an end time.');
}
const formSection={invite:'people',member:'people','revoke-invitation':'people',assignment:'apps',licence:'apps',limits:'settings',status:'governance',transfer:'governance','master-invitation':'governance','recovery-export':'governance'};
const appName=(index,id)=>index.apps?.find(app=>app.id===id)?.name||id;
function appAccessState(org,app){
 if(org.status==='Suspended')return 'Organisation suspended';
 if(org.status==='PendingActivation')return 'Organisation pending activation';
 if(org.status!=='Active')return 'Organisation unavailable';
 if(org.membershipStatus!=='Active')return 'Organisation membership inactive';
 if(app.id==='advocate'&&org.role==='Client')return org.clientPortal==='Available'?'Client portal available':'Client portal approval required';
 if(app.available)return app.mode==='read-only'?'Read-only access':'Ready to open';
 if(app.reason==='community-grant-required')return 'Community permission required';
 if(app.reason==='missing-assignment')return app.role?'App assignment inactive':'No app role assigned';
 return 'App access unavailable';
}
function appAccessNextStep(org,app){
 if(org.status==='Suspended')return 'Contact your platform Super Admin to review the organisation status.';
 if(org.status==='PendingActivation')return 'Ask the primary Master Admin to complete organisation activation.';
 if(org.status!=='Active')return 'Contact your platform Super Admin to review the organisation status.';
 if(org.membershipStatus!=='Active')return 'Ask your organisation Master Admin to review your membership.';
 if(app.id==='advocate'&&org.role==='Client')return org.clientPortal==='Available'?'Open your Chambers client portal.':'Ask your administrator to approve Chambers client access.';
 if(app.available)return '';
 if(app.reason==='community-grant-required')return 'Ask the DIGITAL SAMAJ community administrator to grant access.';
 if(app.reason==='missing-assignment')return 'Ask your organisation Master Admin to review this product licence and role assignment.';
 return 'Ask your platform administrator to review this app licence and assignment.';
}
export function accountProductCards(memberships,index){
 const products=memberships.flatMap(org=>org.apps.map(app=>{
  const clientPortal=app.id==='advocate'&&org.role==='Client';
  const state=appAccessState(org,app),next=appAccessNextStep(org,app);
  const href=clientPortal?`/client-portal?organisation=${encodeURIComponent(org.id)}`:`/${encodeURIComponent(app.id)}?organisation=${encodeURIComponent(org.id)}`;
  const canOpen=clientPortal?org.clientPortal==='Available':app.available;
  const action=canOpen?`<a class="account-app-action" href="${href}">${clientPortal?'Open Chambers client portal':`Open ${esc(app.name||appName(index,app.id))}${app.mode==='read-only'?' (read-only)':''}`}</a>`:'';
  return `<article class="account-app-card"><div class="account-app-heading"><h3>${esc(clientPortal?'Chambers client portal':app.name||appName(index,app.id))}</h3><span class="badge">${esc(state)}</span></div><p class="account-app-organisation">Organisation: <strong>${esc(org.name)}</strong></p><p>App role: <strong>${esc(app.role||'Not assigned')}</strong></p><p>Organisation membership: ${esc(org.role)} · ${esc(org.membershipStatus)}</p>${next?`<p class="form-help">${esc(next)}</p>`:''}${action}</article>`;
 }));
 return `<section class="account-product-section" aria-labelledby="account-products-title"><h2 id="account-products-title">Private app access</h2><p>Platform sign-in is shared for convenience, but each product has its own licence and app role. Access to one product does not grant access to another.</p>${products.length?`<div class="account-app-grid">${products.join('')}</div>`:'<p class="empty-state">No private app memberships yet. Public apps remain available from the Curio catalogue. Accept an invitation below to access a private product.</p>'}</section>`;
}
export function accountOrganisationCards(memberships){
 return `<section class="account-organisation-section" aria-labelledby="account-organisations-title"><h2 id="account-organisations-title">Organisation membership</h2><p>Organisation membership and staff/client seat limits are shared at this level. They do not replace a product licence or an app-specific role.</p>${memberships.length?`<div class="account-org-grid">${memberships.map(org=>`<article class="account-org-card"><h3>${esc(org.name)}</h3><p>${esc(org.role)} · ${esc(org.membershipStatus)} membership</p><p>Organisation status: ${esc(org.status)}</p>${org.administration?`<a href="/admin?organisation=${encodeURIComponent(org.id)}">Manage this organisation</a>`:''}${org.clientAccessManagement?`<a href="/client-access?organisation=${encodeURIComponent(org.id)}">Manage client record links</a>`:''}</article>`).join('')}</div>`:'<p class="empty-state">No organisation memberships</p>'}</section>`;
}
export function licenceFields(index,{field,select,limitField},l={}){
 return select('Product','appId',index.apps.map(a=>[a.id,a.name]),l.appId)+select('Product licence status','status',['Scheduled','Trial','Active','Suspended','Expired','Revoked'],l.status||'Active')+'<p class="form-help full">This licence applies only to the selected product. Licence dates use India time (IST, UTC+05:30), including when your device uses another timezone. Blank end date means no expiry. Read-only grace is optional and applies after expiry under the existing licence policy.</p>'+field('Product access starts · India time','startsAt',localDate(l.startsAt||new Date().toISOString()),'datetime-local','required step="0.001"')+field('Product access ends · India time (optional)','endsAt',localDate(l.endsAt),'datetime-local','step="0.001"')+field('Read-only grace ends · India time (optional)','readOnlyUntil',localDate(l.readOnlyUntil),'datetime-local','step="0.001"')+limitField('Product staff seats','staffLimit',l.staffLimit??null)+limitField('Product client seats','clientLimit',l.clientLimit??null);
}
export function overview(index,view){
 const org=view?.organisation;if(!org)return '<section class="card"><h2>No organisations to manage</h2><p>Accept an invitation below, or create an organisation if you are a Super Admin.</p></section>';
 const master=view.members.find(m=>m.userId===org.masterAdminUserId);
 return `<section class="org-overview"><p class="eyebrow">Selected organisation</p><h2>${esc(org.name)} <span class="badge">${esc(org.status)}</span></h2><p>${esc(org.type)} · ${esc(org.timezone)} · Primary Master Admin: ${esc(master?.name||'Pending activation')}</p><div class="metrics"><div class="metric"><strong>${view.usage.members.staff} / ${cap(org.staffLimit)}</strong><span>Organisation staff seats</span></div><div class="metric"><strong>${view.usage.members.client} / ${cap(org.clientLimit)}</strong><span>Organisation client seats</span></div><div class="metric"><strong>${org.licences.length}</strong><span>Separately licensed products</span></div></div><p class="form-help">Organisation seat usage includes active members and reserved invitations. Each product has separate staff/client seats.</p></section>`;
}
export function people(view){return `<section class="card"><h3>People in this organisation</h3><p>Membership joins a person to this organisation. An app assignment separately gives them a role in a specific app.</p><div class="people">${view.members.map(m=>`<article class="person"><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small><span class="badge">${esc(m.role==='MasterAdmin'?'Master Admin':m.role)}</span><small>${esc(m.status)}${m.active?'':' · Account inactive'}</small></article>`).join('')}</div></section>`;}
export function apps(index,view){
 return `<section class="card"><h3>Product licences</h3><p>Each licence is for one named product; enabling it does not enable another product. Organisation membership and organisation seat limits are shared separately. Public and personal tools do not need an organisation licence.</p><div class="licences">${view.organisation.licences.map(l=>`<article class="licence"><h4>${esc(appName(index,l.appId))} <span class="badge">${esc(l.status)}</span></h4><p>Product staff seats: ${view.usage.apps[l.appId]?.staff||0} / ${cap(l.staffLimit)} · Product client seats: ${view.usage.apps[l.appId]?.client||0} / ${cap(l.clientLimit)}</p><dl class="licence-dates"><dt>Starts</dt><dd>${esc(date(l.startsAt))}</dd><dt>Ends</dt><dd>${esc(date(l.endsAt))}</dd><dt>Read-only grace ends</dt><dd>${l.readOnlyUntil?esc(date(l.readOnlyUntil)):'Not configured'}</dd></dl></article>`).join('')||'<p>No product licences configured.</p>'}</div></section><section class="card"><h3>Product-specific app roles</h3><p>Each assignment applies only inside its named product. Organisation membership, a different product licence, or a role in another app does not grant this access.</p><div class="people">${view.assignments.map(a=>`<article class="person"><strong>${esc(view.members.find(m=>m.userId===a.userId)?.name||a.userId)}</strong><small>Product: ${esc(appName(index,a.appId))}</small><small>Role in ${esc(appName(index,a.appId))}: ${esc(a.role)}</small><small>Product assignment: ${esc(a.status)}</small></article>`).join('')||'<p>No product-specific roles assigned yet.</p>'}</div></section>`;
}
function section(id,title,content){return `<section data-admin-section="${id}" aria-labelledby="section-${id}" hidden><h2 id="section-${id}" tabindex="-1">${title}</h2>${content}</section>`;}
export function organisePanels(index,view){
 const panels=$('#panels'),commands=[...panels.querySelectorAll('form[data-command]')],groups={people:'',apps:'',settings:'',governance:''};
 let provision='';for(const form of commands){if(form.dataset.command==='provision')provision=form.parentElement.outerHTML;else groups[formSection[form.dataset.command]]+=form.parentElement.outerHTML;}
 const org=view?.organisation;
 const intro='<details class="access-model"><summary>How organisation and product access work</summary><strong>Person → Organisation membership → Product licence → Role in that product</strong><p>Organisation membership and staff/client limits are shared at the organisation level. Each product has its own licence and app roles. Platform sign-in is shared; products do not share app roles or business records through this screen. Master Admin manages their organisation; Super Admin governs the platform. Neither role automatically grants app business permissions.</p></details>';
 const audit=org?`<a href="/organisation-audit?organisation=${encodeURIComponent(org.id)}">Review organisation audit</a>`:'';
 const nav=org||index.superAdmin?'<nav class="admin-sections" aria-label="Organisation tasks">'+[...(org?[['overview','Overview'],['people','People'],['apps','Apps & access'],['settings','Settings']]:[]),...(index.superAdmin?[['governance','Governance']]:[])].map(([id,label])=>`<a href="#${id}" data-admin-nav="${id}">${label}</a>`).join('')+'</nav>':'';
 panels.innerHTML=intro+nav+(org?section('overview','Organisation home',`<div class="task-grid">${[['people','People','Invite people and manage organisation membership.'],['apps','Apps & access','Review each product licence and its separate app-role assignments.'],['settings','Settings','Review organisation-wide details and seat limits.']].map(([id,label,copy])=>`<a href="#${id}" data-admin-nav="${id}" class="task-card"><strong>${label}</strong><span>${copy}</span></a>`).join('')}</div>${org.status==='PendingActivation'?'<p class="notice">Awaiting primary Master Admin activation. Share the one-time invitation privately; enabling a product licence does not activate membership or assign an app role.</p>':''}`)+section('people','People',people(view)+groups.people)+section('apps','Apps & access',apps(index,view)+groups.apps)+section('settings','Settings',`<section class="card"><h3>Organisation details</h3><dl class="licence-dates"><dt>Name</dt><dd>${esc(org.name)}</dd><dt>Type</dt><dd>${esc(org.type)}</dd><dt>Timezone</dt><dd>${esc(org.timezone)}</dd></dl><p>Contact your Super Admin for changes beyond your organisation permissions.</p>${audit}</section>`+groups.settings):'')+(index.superAdmin?section('governance','Platform governance','<p>Sensitive and infrequent actions. Reasons are recorded in the audit. Existing confirmation and password checks still apply.</p><p><a href="/platform-audit">Review platform audit</a></p>'+groups.governance):'')+provision;
 if(index.superAdmin){
  const directory=document.createElement('details');directory.className='card org-directory';directory.open=true;directory.innerHTML=`<summary>Organisations <span class="badge">${index.organisations.length}</span></summary><label>Find an organisation<input type="search" id="org-search" autocomplete="off" placeholder="Search by name or status"></label><div class="org-list">${index.organisations.map(o=>`<button type="button" data-select-org="${esc(o.id)}" aria-pressed="${o.id===org?.id}"><strong>${esc(o.name)}</strong><span>${esc(o.status)}</span></button>`).join('')}</div><p class="org-empty" hidden>No matching organisations.</p><button type="button" data-open-create>Create an organisation</button>`;
  $('#summary').prepend(directory);
  $('#org-search').oninput=event=>{let shown=0;directory.querySelectorAll('[data-select-org]').forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(event.target.value.trim().toLowerCase());if(!el.hidden)shown++;});$('.org-empty',directory).hidden=shown>0;};
  directory.querySelectorAll('[data-select-org]').forEach(button=>button.onclick=()=>{const select=$('#organisation');select.value=button.dataset.selectOrg;select.dispatchEvent(new Event('change'));});
  $('[data-open-create]',directory).onclick=()=>{const detail=$('form[data-command="provision"]')?.parentElement;if(detail){detail.open=true;detail.scrollIntoView({block:'start'});$('input',detail)?.focus();}};
 }
 const assignment=$('form[data-command="assignment"]');
 if(assignment){const update=()=>{const app=assignment.elements.appId.value;assignment.elements.role.innerHTML=(roles[app]||[]).map(r=>`<option>${r}</option>`).join('');};assignment.elements.appId.addEventListener('change',update);update();}
 const licence=$('form[data-command="licence"]');
 if(licence){
  licence.insertAdjacentHTML('afterbegin','<p class="licence-state full" aria-live="polite"></p>');
  const update=()=>{const id=licence.elements.appId.value,existing=org.licences.find(l=>l.appId===id),defaults={status:'Active',startsAt:new Date().toISOString(),endsAt:null,readOnlyUntil:null,staffLimit:null,clientLimit:null};
   for(const name of ['status','startsAt','endsAt','readOnlyUntil','staffLimit','clientLimit'])licence.elements[name].value=name.endsWith('At')||name==='readOnlyUntil'?localDate((existing||defaults)[name]):(existing||defaults)[name]??'';
   licence.elements.reason.value='';$('.licence-state',licence).textContent=existing?'Editing existing licence · version '+existing.version+'. Unsaved changes are reset when switching apps.':'New licence · no saved values for this app. Choose dates and seat limits before saving.';
   $('button[type="submit"]',licence).textContent=existing?'Save licence':'Create licence';
   validateDates(licence.elements.startsAt,licence.elements.endsAt,licence.elements.readOnlyUntil);
  };licence.elements.appId.addEventListener('change',update);licence.addEventListener('input',()=>validateDates(licence.elements.startsAt,licence.elements.endsAt,licence.elements.readOnlyUntil));update();
 }
 return {selectSection(id,focus=false){id=['overview','people','apps','settings','governance'].includes(id)?id:'overview';if(id==='governance'&&!index.superAdmin)id='overview';panels.querySelectorAll('[data-admin-section]').forEach(el=>el.hidden=el.dataset.adminSection!==id);panels.querySelectorAll('.admin-sections a').forEach(a=>{if(a.dataset.adminNav===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});if(focus)$('#section-'+id)?.focus();}};
}

export function mountWizard(form,{index,select,field,limitField}){
 const detail=form.parentElement;detail.classList.add('creation-flow');form.noValidate=true;
 const heading=['Organisation details','Primary Master Admin','Apps and seat limits','Review and confirm'];
 const fields=[...form.querySelectorAll(':scope>label,:scope>p')];
 const sets=heading.map((title,i)=>{const fieldset=document.createElement('fieldset');fieldset.dataset.step=i;fieldset.innerHTML=`<legend tabindex="-1">${i+1}. ${title}</legend>`;form.append(fieldset);return fieldset;});
 for(const label of fields){const name=$('input,select',label)?.name;sets[['name','type','timezone'].includes(name)?0:['newAccount','masterAdminEmail'].includes(name)?1:name==='reason'?3:2].append(label);}
 sets[0].insertAdjacentHTML('beforeend','<p class="form-help full">Use the organisation’s usual name. No organisation or account is created until you confirm the final review.</p>');
 sets[1].insertAdjacentHTML('beforeend','<p class="form-help full">One primary Master Admin manages people and app assignments. They receive an activation invitation, not automatic app permissions. Invitation delivery is manual.</p>');
 sets[2].insertAdjacentHTML('afterbegin','<p class="form-help full">Choose initial product licences and limits. Each licence is a separate choice, not a bundle. Blank seat limits mean unlimited; zero means no seats. Organisation membership seats are shared, while each product has separate app seats.</p>');
 form.elements.orgStaff.min='1';
 form.elements.status.innerHTML=['Active','Trial','Scheduled'].map(s=>`<option>${s}</option>`).join('');
 const extra=document.createElement('div');extra.className='full extra-licences';sets[2].append(extra);
 const add=document.createElement('button');add.type='button';add.textContent='Add another product licence';add.className='full';sets[2].append(add);let extraId=0;
 const rawLicences=()=>[Object.fromEntries(new FormData(form)),...[...extra.children].map(block=>Object.fromEntries([...block.querySelectorAll('input,select')].map(el=>[el.dataset.licenceField,el.value])))];
 add.onclick=()=>{const block=document.createElement('fieldset');block.className='additional-licence';block.innerHTML='<legend>Additional product licence</legend>'+licenceFields(index,{select,field,limitField},{appId:index.apps.find(a=>!rawLicences().some(l=>l.appId===a.id))?.id})+'<button type="button" data-remove-licence>Remove this product licence</button>';extra.append(block);block.querySelectorAll('input,select').forEach(el=>{el.dataset.licenceField=el.name;el.name='extra-'+extraId+'-'+el.name;});extraId++;block.querySelector('[data-licence-field=status]').innerHTML=['Active','Trial','Scheduled'].map(s=>`<option>${s}</option>`).join('');$('[data-remove-licence]',block).onclick=()=>block.remove();$('select',block).focus();};
 const review=document.createElement('div');review.className='wizard-review full';sets[3].prepend(review);
 const progress=document.createElement('ol');progress.className='wizard-progress';progress.setAttribute('aria-label','Organisation creation steps');progress.innerHTML=heading.map((title,i)=>`<li data-progress="${i}">${i+1}. ${title}</li>`).join('');form.prepend(progress);
 const submit=$('button[type="submit"]',form);submit.textContent='Create organisation';
 const actions=document.createElement('div');actions.className='wizard-actions full';actions.innerHTML='<button type="button" data-wizard-back>Back</button><button type="button" data-wizard-next>Continue</button>';actions.append(submit);form.append(actions);
 let step=0;
 const valid=n=>{const timezone=form.elements.timezone;timezone.setCustomValidity('');try{new Intl.DateTimeFormat('en',{timeZone:timezone.value});}catch{timezone.setCustomValidity('Enter a valid timezone, for example Asia/Kolkata.');}
  const appControls=[form.elements.appId,...extra.querySelectorAll('[data-licence-field=appId]')];appControls.forEach(el=>el.setCustomValidity(appControls.filter(other=>other.value===el.value).length>1?'Choose each app only once.':''));
  validateDates(form.elements.startsAt,form.elements.endsAt,form.elements.readOnlyUntil);for(const block of extra.children)validateDates($('[data-licence-field=startsAt]',block),$('[data-licence-field=endsAt]',block),$('[data-licence-field=readOnlyUntil]',block));
  const invalid=[...sets[n].querySelectorAll('input,select')].find(el=>!el.checkValidity());if(invalid){show(n);invalid.reportValidity();return false;}return true;};
 function show(n,focus=false){step=Math.min(3,Math.max(0,n));sets.forEach((set,i)=>set.hidden=i!==step);progress.querySelectorAll('li').forEach((el,i)=>{if(i===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});$('[data-wizard-back]',form).hidden=step===0;$('[data-wizard-next]',form).hidden=step===3;submit.hidden=step!==3;
  if(step===3){const data=Object.fromEntries(new FormData(form)),app=form.elements.appId.selectedOptions[0]?.textContent;review.innerHTML='<p>Confirm these details before creating the organisation and its primary invitation. Each product licence is a separate choice; enabling one does not enable or grant access to another. Organisation member seats are shared at the organisation level.</p><dl class="licence-dates">'+[['Organisation',data.name],['Type',data.type],['Timezone',data.timezone],['Primary Master Admin',data.masterAdminEmail],['Account type',data.newAccount==='true'?'New account · activation required':'Existing active account'],['Organisation staff / clients',`${data.orgStaff||'Unlimited'} / ${data.orgClients||'Unlimited'}`],['Product',app],['Product licence status',data.status],['Product access starts',date(apiDate(data.startsAt))],['Product access ends',date(apiDate(data.endsAt))],['Read-only grace',data.readOnlyUntil?date(apiDate(data.readOnlyUntil)):'Not configured'],['Product staff / clients',`${data.staffLimit||'Unlimited'} / ${data.clientLimit||'Unlimited'}`]].map(([key,value])=>`<dt>${key}</dt><dd>${esc(value)}</dd>`).join('')+'</dl><p>The organisation starts pending activation. No product-specific app role is automatically assigned.</p>';}
  if(step===3){review.insertAdjacentHTML('beforeend',rawLicences().slice(1).map(l=>`<h4>${esc(index.apps.find(a=>a.id===l.appId)?.name||l.appId)}</h4><p>Separate product licence: ${esc(l.status)} · Product staff seats ${esc(l.staffLimit||'Unlimited')} · Product client seats ${esc(l.clientLimit||'Unlimited')}</p><p>Starts ${esc(date(apiDate(l.startsAt)))} · Ends ${esc(date(apiDate(l.endsAt)))} · Read-only grace ${l.readOnlyUntil?esc(date(apiDate(l.readOnlyUntil))):'Not configured'}</p>`).join(''));}
  if(focus)$('legend',sets[step]).focus();
 }
 const go=n=>{history.pushState({...history.state,adminWizardStep:n},'','#create/'+(n+1));show(n,true);};
 detail.addEventListener('toggle',()=>{if(detail.open&&!location.hash.startsWith('#create/')){show(0);history.pushState({...history.state,adminWizardStep:0},'','#create/1');}else if(!detail.open&&location.hash.startsWith('#create/'))history.replaceState(history.state,'','#overview');});
 $('[data-wizard-next]',form).onclick=()=>{if(valid(step))go(step+1);};$('[data-wizard-back]',form).onclick=()=>{if(history.state?.adminWizardStep===step)history.back();else go(step-1);};
 // Enter on earlier steps advances instead of bypassing the review screen.
 form.addEventListener('submit',event=>{if(step<3){event.preventDefault();event.stopImmediatePropagation();if(valid(step))go(step+1);return;}for(let i=0;i<4;i++)if(!valid(i)){show(i);const invalid=$('input:invalid,select:invalid',sets[i]);invalid?.reportValidity();event.preventDefault();event.stopImmediatePropagation();break;}},true);
 show(0);
 return {licences:rawLicences,close(){detail.open=false;},restore(){const match=/^#create\/([1-4])$/.exec(location.hash);if(!match)return;const target=Number(match[1])-1;detail.open=true;for(let i=0;i<target;i++)if(!valid(i)){show(i);return;}show(target);}};
}
