import {sponsorConfig} from '/sponsor-config.mjs';
import {chooseSponsor,sponsorPages} from '/shared/sponsorship-engine.mjs';
const mutedKey='synapse-sponsor-muted';let muted=false;
try{muted=sessionStorage.getItem(mutedKey)==='1';}catch{/* Blocked storage still permits dismissing this page. */}
const node=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;el.textContent=text;return el;};
function mount(){
 for(const slot of document.querySelectorAll('[data-sponsor-slot]')){
  const route=location.pathname.replace(/\/$/,'')||'/';
  if(sponsorPages[slot.dataset.sponsorSlot]!==route||slot.previousElementSibling?.matches('[data-google-ad-preview]'))continue;
  const preview=node('aside','synapse-google-ad-preview','');
  preview.dataset.googleAdPreview='';preview.setAttribute('aria-label','Google advertisement placement preview');
  preview.append(node('span','synapse-google-ad-label','Advertisement · Preview'),node('h2','synapse-google-ad-title','Google ads will appear here'),node('p','synapse-google-ad-description','Reserved ad space · Integration pending'));
  slot.before(preview);
 }
 for(const slot of document.querySelectorAll('[data-sponsor-slot]')){
  if(slot.dataset.sponsorReady)continue;slot.dataset.sponsorReady='1';
  const page=slot.dataset.sponsorSlot,route=location.pathname.replace(/\/$/,'')||'/';
  if(muted||!sponsorConfig.enabled||sponsorPages[page]!==route){slot.hidden=true;continue;}
  const campaign=chooseSponsor(sponsorConfig,page);
  if(!campaign&&page!=='home'){slot.hidden=true;continue;}
  const heading=node('div','synapse-sponsor-heading','');
  heading.append(node('span','synapse-sponsor-label',campaign?'Advertisement · Paid sponsorship':'Sponsorship opportunity'));
  const dismiss=node('button','synapse-sponsor-dismiss','Hide for this visit');dismiss.type='button';dismiss.onclick=()=>{muted=true;try{sessionStorage.setItem(mutedKey,'1');}catch{}document.querySelectorAll('[data-sponsor-slot]').forEach(s=>s.hidden=true);};heading.append(dismiss);
  const body=node('div','synapse-sponsor-body',''),copy=node('div','synapse-sponsor-copy','');
  if(campaign)copy.append(node('span','synapse-sponsor-brand',campaign.sponsor));
  copy.append(node('h2','synapse-sponsor-title',campaign?.title||'A little space for a thoughtful brand.'),node('p','synapse-sponsor-description',campaign?.description||'Introduce your business through one quiet, clearly labelled placement.'));
  const link=node('a','synapse-sponsor-link',campaign?'Visit advertiser ↗':'Explore sponsorship');link.href=campaign?.url||'/sponsor';
  if(campaign){link.target='_blank';link.rel='sponsored nofollow noopener noreferrer';link.setAttribute('aria-label','Visit '+campaign.sponsor+' (opens in a new tab)');}
  body.append(copy,link);slot.replaceChildren(heading,body);slot.hidden=false;slot.setAttribute('aria-label',campaign?'Advertisement':'Sponsorship opportunity');
 }
}
mount();
// The portal replaces its public HTML after checking authentication.
const platform=document.querySelector('#platform');if(platform)new MutationObserver(mount).observe(platform,{childList:true});
