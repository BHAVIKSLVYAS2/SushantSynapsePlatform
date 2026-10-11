import {handle as frontend} from './worker.mjs';
import {edgeApi} from '../../server/edge-index.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(env.AUTH_METHOD==='access'&&url.pathname==='/access-login'){
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
   if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)return new Response('Email-code sign-in is awaiting Cloudflare Access setup.',{status:503,headers:{'Cache-Control':'no-store'}});
   return Response.redirect(url.origin+'/signin',302);
  }
  // The existing public source endpoints continue at the edge. Private APIs never
  // fall through to the laptop or share staging/production storage bindings.
  if(url.pathname.startsWith('/api/')||url.pathname==='/healthz'){
   const publicFund=url.pathname.startsWith('/api/fund-overlap/')&&!/^\/api\/fund-overlap\/(portfolio|watchlists|plans|nav)(\/|$)/.test(url.pathname);
   if(publicFund||url.pathname==='/api/news/sources')return frontend(request,env,req=>edgeApi(req,env));
   return edgeApi(request,env);
  }
  // Page readiness now comes from D1, including on the separate staging hostname.
  const {default:pages}=await import('./pages.json',{with:{type:'json'}});
  const canonical=['/news/','/advocate/','/fund-overlap/','/signin/'].includes(url.pathname)?url.pathname.slice(0,-1):url.pathname;
  if(pages[canonical]){
   if(env.FREE_MODE==='true'&&/^\/(digital-samaj|batchfee-lite|tournament-lite)(\/|$)/.test(canonical))return new Response('This workspace is unavailable in the free cloud version. Existing records are preserved in the local workspace.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
   const response=await env.ASSETS.fetch(new Request(new URL(pages[canonical],url)));
   const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Synapse-Frontend','cloudflare');
   headers.set('X-Content-Type-Options','nosniff');headers.set('X-Frame-Options','DENY');headers.set('Referrer-Policy','same-origin');
   headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
   // Preserve the existing anonymous-home advertising policy and nonce handling.
   if(canonical==='/'){const {default:ads}=await import('../../packages/ui/adsense.cjs');if(ads.eligibleHome(canonical,request.headers.get('Cookie')||'')&&response.ok){const nonce=crypto.randomUUID();headers.set('Content-Security-Policy',ads.homePolicy(nonce));headers.delete('Content-Length');headers.delete('ETag');return new Response(request.method==='HEAD'?null:ads.renderHome(await response.text(),nonce),{status:response.status,headers});}}
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
   return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
  }
  let assetPath;try{assetPath=decodeURIComponent(url.pathname);}catch{return new Response('Not found',{status:404});}
  if(assetPath.startsWith('/_pages/')||assetPath.startsWith('/_edge/'))return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  return env.ASSETS.fetch(request);
 }
};
