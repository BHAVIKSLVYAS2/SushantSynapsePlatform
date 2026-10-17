'use strict';
// Loaded only by the guarded temporary preview, outside the cloud asset allowlist.
window.ChambersOrganisationPreview=true;
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.querySelector('.synapse-legal-footer nav');
 if(nav)nav.insertAdjacentHTML('afterbegin','<a href="/account">My account</a>');
});
