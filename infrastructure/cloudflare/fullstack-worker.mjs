import {handle as frontend} from './worker.mjs';
import {edgeApi} from '../../server/edge-index.mjs';
import {cloudPages} from '../../apps/satire-arena/backend/cloud-pages.mjs';
import adsense from '../../packages/ui/adsense.cjs';
import vedicPrivacy from '../../apps/rashifal-kundli/privacy.cjs';
import {accountIntentPath} from '../../packages/ui/task-intent.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/_static/')||url.pathname.startsWith('/_fund-runtime/')){
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{'Cache-Control':'no-store'}});
   const asset=await env.ASSETS.fetch(request),headers=new Headers(asset.headers);
   if(url.pathname.startsWith('/_fund-runtime/'))headers.set('Cache-Control','public, max-age=31536000, immutable');
   // Missing/retired release URLs must never become long-lived cached errors.
   if(![200,206,304].includes(asset.status))headers.set('Cache-Control','no-store');
   return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers});
  }
  if(env.ORGANISATIONS_ENABLED==='true'&&['/signin','/signin/'].includes(url.pathname)&&['GET','HEAD'].includes(request.method))return Response.redirect(url.origin+accountIntentPath(url),302);
  const {default:organisationPages}=await import('./organisation-pages.json',{with:{type:'json'}});
  if(organisationPages[url.pathname]){
   if(env.ORGANISATIONS_ENABLED!=='true')return new Response('Not found',{status:404});
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
   const asset=await env.ASSETS.fetch(new Request(new URL(organisationPages[url.pathname],url)));
   const headers=new Headers(asset.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Frame-Options','DENY');headers.set('Referrer-Policy','no-referrer');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
   return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers});
  }
  if(url.pathname.startsWith('/_organisations/'))return new Response('Not found',{status:404});
  const satirePage=await cloudPages(request,req=>edgeApi(req,env));if(satirePage)return adsense.responseWithAds(satirePage,url.pathname,request.headers.get('Cookie')||'',crypto.randomUUID(),request.method);
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
   if(env.FREE_MODE==='true'&&env.FULL_APPS!=='true'&&/^\/(digital-samaj|batchfee-lite|tournament-lite)(\/|$)/.test(canonical))return new Response('This workspace is unavailable in the free cloud version. Existing records are preserved in the local workspace.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
   const response=await env.ASSETS.fetch(new Request(new URL(pages[canonical],url)));
   const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Synapse-Frontend','cloudflare');
   headers.set('X-Content-Type-Options','nosniff');headers.set('X-Frame-Options','DENY');headers.set('Referrer-Policy','same-origin');
   headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
   if(vedicPrivacy.isVedic(canonical))for(const [key,value]of Object.entries(vedicPrivacy.headers))headers.set(key,value);
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
   let body=response.body;
   if(env.ORGANISATIONS_ENABLED==='true'&&canonical==='/advocate'&&response.ok){body=(await response.text()).replace('</head>','<link rel="stylesheet" href="/advocate/organisation-preview.css"></head>').replace(/<script src="((?:\/_static\/[a-f0-9]{32})?\/app\.js)"><\/script>/,(_,src)=>'<script src="/advocate/organisation-preview.js"></script><script src="'+src+'"></script>');headers.delete('Content-Length');headers.delete('ETag');}
   const pageResponse=new Response(request.method==='HEAD'?null:body,{status:response.status,headers});
   return adsense.responseWithAds(pageResponse,canonical,request.headers.get('Cookie')||'',crypto.randomUUID(),request.method);
  }
  let assetPath;try{assetPath=decodeURIComponent(url.pathname);}catch{return new Response('Not found',{status:404});}
  if(assetPath.startsWith('/_pages/')||assetPath.startsWith('/_edge/'))return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  return env.ASSETS.fetch(request);
 }
};
