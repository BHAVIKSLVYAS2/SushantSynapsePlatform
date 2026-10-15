// Optional aggregate measurement. No cookie, localStorage, fingerprint or raw referrer.
let enabled=false;fetch('/api/arena-metrics/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{enabled=!!data?.enabled;if(enabled)record(location.pathname.includes('/posts/')?'post_view':location.pathname.includes('/characters/')?'character_open':'arena_view');}).catch(()=>{});
function source(){try{if(!document.referrer)return 'direct';const host=new URL(document.referrer).hostname;if(host===location.hostname)return 'internal';if(/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com)$/.test(host))return 'search';if(/(^|\.)(facebook.com|instagram.com|t.co|whatsapp.com)$/.test(host))return 'social';return 'other';}catch{return 'other';}}
export function record(event,method='none',content=location.pathname.split('/').filter(Boolean).pop()||'arena'){
 if(!enabled||!/^[a-z0-9-]{1,90}$/.test(content))return;
 fetch('/api/arena-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,content,method,source:source()}),keepalive:true}).catch(()=>{});
}
document.addEventListener('click',event=>{const target=event.target.closest('a,button');if(!target)return;if(target.matches('[data-share]'))record(target.dataset.share==='image'?'share_selected':'share_selected',target.dataset.share);if(target.matches('[data-share-character],#share-arena'))record('share_selected','image',target.dataset.shareCharacter||'standings');if(target.matches('a[href="/daily-spark"],a[href="/decision-wheel"],a[href="/moment-studio"]'))record('tool_click','none',target.getAttribute('href').slice(1));});
document.addEventListener('arena-measure',event=>record(event.detail.event,event.detail.method,event.detail.content));
document.addEventListener('click',event=>{const button=event.target.closest('.expand-portrait');if(button?.getAttribute('aria-expanded')==='true')record('character_open','none',button.closest('[data-character]').dataset.character);});
