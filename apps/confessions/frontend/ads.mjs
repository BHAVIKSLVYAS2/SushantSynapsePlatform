import {adConfig} from './ad-config.mjs';
const validSlot=value=>typeof value==='string'&&/^\d{5,20}$/.test(value);
export const rewardedConfigured=()=>adConfig.enabled&&/^\/\d+\/[\w/.-]+$/.test(adConfig.rewardedUnit||'');
let consent=false,gptLoading=null,displayLoaded=false;
function script(src){return new Promise((resolve,reject)=>{const node=document.createElement('script'),timer=setTimeout(()=>{node.remove();reject(Error('Ad unavailable'));},8000);node.async=true;node.nonce=document.querySelector('script[nonce]')?.nonce||'';node.src=src;node.onload=()=>{clearTimeout(timer);resolve();};node.onerror=()=>{clearTimeout(timer);reject(Error('Ad unavailable'));};document.head.append(node);});}
export function allowAds(value){consent=value;if(!value||!adConfig.enabled)return;mountDisplay();}
function mountDisplay(){
 if(displayLoaded||!Object.values(adConfig.display).some(validSlot))return;displayLoaded=true;
 const targets=[...document.querySelectorAll('[data-ad-placement]')].filter(node=>validSlot(adConfig.display[node.dataset.adPlacement]));
 // Side inventory is desktop-only; never request a hidden mobile impression.
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting||!consent)continue;const node=entry.target;if(!node.getClientRects().length)continue;observer.unobserve(node);const unit=document.createElement('ins');unit.className='adsbygoogle';unit.dataset.adClient=adConfig.publisher;unit.dataset.adSlot=adConfig.display[node.dataset.adPlacement];unit.dataset.adFormat='auto';unit.dataset.fullWidthResponsive='true';node.append(unit);(window.adsbygoogle=window.adsbygoogle||[]).push({});}},{rootMargin:'120px'});
 for(const node of targets){node.hidden=false;observer.observe(node);}script('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+adConfig.publisher).catch(()=>{for(const node of targets)node.hidden=true;});
}
export async function prepareReward(){
 if(!consent||!rewardedConfigured())return {status:'unavailable'};
 window.googletag=window.googletag||{cmd:[]};
 gptLoading||=script('https://securepubads.g.doubleclick.net/tag/js/gpt.js');try{await gptLoading;}catch{return {status:'unavailable'};}if(!consent)return {status:'unavailable'};
 return new Promise(resolve=>{
  let slot,settled=false,shown=false,granted=false;
  const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);if(slot){const ads=googletag.pubads();for(const [type,fn]of events)ads.removeEventListener(type,fn);googletag.destroySlots([slot]);}resolve(value);};
  const events=[['rewardedSlotReady',event=>{if(event.slot!==slot)return;clearTimeout(timer);resolve({status:'ready',watch:()=>{if(shown||settled)return Promise.resolve({status:'cancelled'});shown=true;return new Promise(done=>{resolve=done;try{if(event.makeRewardedVisible()===false)finish({status:'unavailable'});}catch{finish({status:'unavailable'});}});},cancel:()=>finish({status:'cancelled'})});}],['rewardedSlotGranted',event=>{if(event.slot===slot)granted=true;}],['rewardedSlotClosed',event=>{if(event.slot===slot)finish({status:granted?'granted':'cancelled'});} ],['slotRenderEnded',event=>{if(event.slot===slot&&event.isEmpty)finish({status:'unavailable'});}]];
  const timer=setTimeout(()=>finish({status:'unavailable'}),10000);
  googletag.cmd.push(()=>{if(settled)return;try{slot=googletag.defineOutOfPageSlot(adConfig.rewardedUnit,googletag.enums.OutOfPageFormat.REWARDED);if(!slot){finish({status:'unavailable'});return;}const ads=googletag.pubads();slot.addService(ads);for(const [type,fn]of events)ads.addEventListener(type,fn);googletag.enableServices();googletag.display(slot);}catch{finish({status:'unavailable'});}});
 });
}
