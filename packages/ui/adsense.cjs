const publisher='ca-pub-1894051755496526';
const publicPages=new Set([
 '/', '/qr-maker', '/photo-resize', '/bill-splitter', '/moment-studio',
 '/moment-studio/cards', '/moment-studio/certificates', '/take-a-break',
 '/daily-spark', '/decision-wheel', '/focus', '/news', '/ritual-assist',
 '/ritual-assist/calendar', '/team-mixer', '/timetable-lite', '/fund-overlap',
 '/satire-arena', '/satire-arena/politicians', '/satire-arena/news-anchors',
 '/satire-arena/actors', '/satire-arena/corporates', '/privacy', '/terms',
 '/contact', '/legal', '/legal/third-party-notices', '/showcase', '/support',
]);
const eligiblePage=(pathname,cookie='')=>{
 const route=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
 const publicEditorial=route==='/satire-arena/daily'||route==='/satire-arena/results'||/^\/satire-arena\/(?:posts|categories|characters)\/[a-z0-9-]+$/.test(route);
 return !/(?:^|;\s*)chambers_session=[^;]+/.test(cookie)&&(publicPages.has(route)||publicEditorial);
};
function renderPage(html,nonce){
 if(!/^[a-zA-Z0-9-]{32,64}$/.test(nonce))throw Error('Invalid response nonce');
 const code=`<meta name="google-adsense-account" content="${publisher}"><script data-synapse-ad-loader>(()=>{const nonce=document.currentScript.nonce;const load=()=>{const script=document.createElement('script');script.async=true;script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}';script.crossOrigin='anonymous';script.nonce=nonce;document.head.append(script);};const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if('requestIdleCallback' in window)requestIdleCallback(load,{timeout:1000});else setTimeout(load,0);}));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();})();</script>`;
 return html.replace('</head>',code+'</head>').replace(/<script\b/g,`<script nonce="${nonce}"`);
}
function pagePolicy(nonce){
 return `default-src 'self'; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-src https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;
}
async function responseWithAds(response,pathname,cookie,nonce,method='GET'){
 if(!eligiblePage(pathname,cookie)||!response.ok||!/^text\/html\b/i.test(response.headers.get('Content-Type')||''))return response;
 const headers=new Headers(response.headers);headers.set('Content-Security-Policy',pagePolicy(nonce));headers.delete('Content-Length');headers.delete('ETag');
 return new Response(method==='HEAD'?null:renderPage(await response.text(),nonce),{status:response.status,statusText:response.statusText,headers});
}
module.exports={publisher,eligiblePage,renderPage,pagePolicy,responseWithAds};
