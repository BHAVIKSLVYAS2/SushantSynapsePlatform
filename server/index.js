const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {cleanSettings}=require('../apps/advocate/backend/settings');
const {createAuth}=require('../packages/auth');
const {createPortal}=require('../apps/portal/backend/routes');
const {createSupport}=require('../apps/portal/backend/support');
const {createFocus}=require('../apps/focus/backend/routes');
const {createRitualCalendar}=require('../apps/ritual-assist/backend/routes');
const {createAdvocate}=require('../apps/advocate/backend/routes');
const {createFundOverlap}=require('../apps/fund-overlap/backend/routes');
const {createNews}=require('../apps/news/backend/routes');
const {createBatchFee}=require('../apps/batchfee-lite/backend/routes');
const {createTournament}=require('../apps/tournament-lite/backend/routes');
const {createDigitalSamaj}=require('../apps/digital-samaj/backend/routes');
const {createConfessions}=require('../apps/confessions/backend/routes.cjs');
const {createArena}=require('../apps/satire-arena/backend/routes');
const {staticAssets}=require('./static-assets');
const adsense=require('../packages/ui/adsense.cjs');
const {randomUUID}=require('node:crypto');
const {fail}=require('./http');
const ROOT=path.resolve(__dirname,'..');
const production=process.env.NODE_ENV==='production';
const publicOrigin=process.env.PUBLIC_ORIGIN?new URL(process.env.PUBLIC_ORIGIN).origin:'';
const adminPreview=process.env.ORG_ADMIN_PREVIEW==='1';
if(adminPreview){
 const previewRoot=fs.realpathSync(path.resolve(process.env.DATA_DIR||path.join(ROOT,'data')));
 const relative=path.relative(require('node:os').tmpdir(),previewRoot);
 if(!['test','development'].includes(process.env.NODE_ENV)||!process.env.DATA_DIR||!relative||relative.startsWith('..')||path.isAbsolute(relative)||!['127.0.0.1','localhost','::1'].includes(process.env.HOST||'127.0.0.1')||(process.env.DATABASE_PROVIDER&&process.env.DATABASE_PROVIDER!=='sqlite'))throw Error('Organisation admin preview requires a disposable DATA_DIR under the OS temporary directory, loopback binding and non-production SQLite');
}
let administration;
let organisationChambers,previewQueue=Promise.resolve();
if(production&&(!publicOrigin||!publicOrigin.startsWith('https://')))throw Error('Production requires an HTTPS PUBLIC_ORIGIN');
if(production&&(!process.env.SETUP_TOKEN||process.env.SETUP_TOKEN.length<24))throw Error('Production requires a SETUP_TOKEN of at least 24 characters');
const store=new Store(process.env.DATA_DIR||path.join(ROOT,'data'));
const auth=createAuth({store,secureCookie:production||process.env.COOKIE_SECURE==='1',initializeWorkspace(input,user){store.setSetting('firm',cleanSettings({name:input.firmName||'My Chambers',advocate:user.name}));if(input.demo===true)store.demo();}});
const portal=createPortal({store,auth});
const visitorCounter=require('../apps/portal/backend/visitors.cjs').createVisitors({store});
const support=createSupport({store,auth});
const focus=createFocus({store});
const ritualCalendar=createRitualCalendar();
const news=createNews({auth,store});
const batchFee=createBatchFee({auth,store});
const tournament=createTournament({auth,store});
const digitalSamaj=createDigitalSamaj({auth,store});
const satireArena=createArena({store});
const confessionApp=createConfessions({store,auth});
const feedbackApp=require('../apps/feedback/backend/routes.cjs').createFeedback({store,auth});
const panditBooking=require('../apps/pandit-booking/backend/routes.cjs').createPanditBooking({store,auth});
const metricsBuckets=new Map();
const advocate=createAdvocate({store,auth});
const fundOverlap=createFundOverlap({auth,store,cacheDir:path.join(process.env.DATA_DIR||path.join(ROOT,'data'),'fund-overlap-cache')});
async function dispatch(req,res) {
  const json = (code,data) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    const url = new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/arena-editorial')||url.pathname.startsWith('/api/arena-metrics')||url.pathname.startsWith('/satire-arena/')||url.pathname==='/sitemap.xml'||url.pathname==='/robots.txt'){
      const {editorial,editorialKey,published,empty}=await import('../apps/satire-arena/backend/editorial.mjs');
      const {publicEditorialPath,publicPage}=await import('../apps/satire-arena/backend/public-pages.mjs');
      const origin=publicOrigin||`http://${req.headers.host}`;
      let response;
      if(url.pathname.startsWith('/api/arena-editorial')||url.pathname.startsWith('/api/arena-metrics')){
        const host=req.headers.host||'';if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)&&(!publicOrigin||host!==new URL(publicOrigin).host))fail(403,'Host rejected');
        if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Cross-site request rejected');
        const {Readable}=require('node:stream');
        const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
        if(url.pathname.startsWith('/api/arena-metrics')){
          const {metrics,metricsKey}=await import('../apps/satire-arena/backend/metrics.mjs');let baseline;
          response=await metrics(request,{enabled:process.env.ARENA_ANALYTICS_ENABLED==='true',user:auth.session(req),read:async()=>{baseline=store.setting(metricsKey);return baseline;},write:async next=>store.transaction(()=>{if(JSON.stringify(store.setting(metricsKey))!==JSON.stringify(baseline))fail(409,'Metrics changed');store.setSetting(metricsKey,next);}),limit:async()=>{const minute=Math.floor(Date.now()/60000),key=req.socket.remoteAddress;for(const [id,bucket]of metricsBuckets)if(bucket.minute!==minute)metricsBuckets.delete(id);let bucket=metricsBuckets.get(key);if(!bucket){if(metricsBuckets.size>=1000)return {success:false};bucket={minute,count:0};metricsBuckets.set(key,bucket);}return {success:++bucket.count<=60};}});
        }else response=await editorial(request,{user:auth.session(req),read:async()=>store.setting(editorialKey),write:async(next,version)=>store.transaction(()=>{if((store.setting(editorialKey)||empty()).version!==version)fail(409,'Content changed. Reload before saving.');store.setSetting(editorialKey,next);store.audit(auth.session(req).name,'Updated satire editorial library','satire-arena',{version:next.version});})});
      }else if(publicEditorialPath(url.pathname)){
        let results=null;if(url.pathname==='/satire-arena/results'){
          const {arena}=await import('../apps/satire-arena/backend/edge.mjs'),{arenaDatabase}=require('../apps/satire-arena/backend/routes');
          const result=await arena(new Request(origin+'/api/satire-arena/results'),{ARENA_DB:arenaDatabase(store),ARENA_COOKIE_SECRET:process.env.ARENA_COOKIE_SECRET});if(!result.ok)fail(503,'Arena results are temporarily unavailable');results=await result.json();
        }
        response=publicPage(new Request(new URL(req.url,origin),{method:req.method}),published(store.setting(editorialKey)||empty()),results);
      }
      if(response){response=await adsense.responseWithAds(response,url.pathname,req.headers.cookie||'',randomUUID(),req.method);for(const [key,value]of response.headers)res.setHeader(key,value);res.writeHead(response.status);return res.end(Buffer.from(await response.arrayBuffer()));}
    }
    if(url.pathname==='/healthz'&&req.method==='GET')return json(200,{status:'ok'});
    if(url.pathname==='/advocate/'){res.writeHead(308,{Location:'/advocate'+url.search});return res.end();}
    if(url.pathname==='/news/'){res.writeHead(308,{Location:'/news'+url.search});return res.end();}
    if (!url.pathname.startsWith('/api/')) {
      if(['/admin','/super-admin'].includes(url.pathname)&&!adminPreview){res.writeHead(404);return res.end('Not found');}
      const assets=adminPreview?{...staticAssets,...require('../apps/admin/backend/preview-assets.cjs')}:staticAssets;
      const name=assets[url.pathname];if(!name){res.writeHead(404);return res.end('Not found');}
      if(url.pathname.startsWith('/rashifal-kundli')&&!fs.existsSync(path.join(ROOT,name))){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});return res.end('The Vedic verification preview build is unavailable.');}
      if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Method not allowed');
      res.setHeader('Content-Type',(name.endsWith('.js')||name.endsWith('.mjs'))?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.png')?'image/png':name.endsWith('.webp')?'image/webp':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8');
      if(name.endsWith('.txt'))res.setHeader('Content-Type','text/plain; charset=utf-8');
      if(name.endsWith('.json'))res.setHeader('Content-Type','application/json; charset=utf-8');
      if(name.endsWith('.mp3'))res.setHeader('Content-Type','audio/mpeg');
      if(name.endsWith('.wav'))res.setHeader('Content-Type','audio/wav');
      let contents=req.method==='HEAD'?undefined:fs.readFileSync(path.join(ROOT,name));
      const vedic=require('../apps/rashifal-kundli/privacy.cjs');
      if(vedic.isVedic(url.pathname))for(const [key,value]of Object.entries(vedic.headers))res.setHeader(key,value);
      if(contents&&name.endsWith('.html')&&!vedic.isVedic(url.pathname))contents=Buffer.from(require('../packages/ui/beta-html.cjs').betaHtml(require('../packages/ui/theme-html.cjs').earlyTheme(contents.toString())));
      if(adminPreview&&name==='apps/advocate/frontend/index.html'&&contents)contents=Buffer.from(contents.toString().replace('</head>','<link rel="stylesheet" href="/advocate/organisation-preview.css"></head>').replace('<script src="/app.js"></script>','<script src="/advocate/organisation-preview.js"></script><script src="/app.js"></script>'));
      if(adsense.eligiblePage(url.pathname,req.headers.cookie||'')){const nonce=randomUUID();res.setHeader('Content-Security-Policy',adsense.pagePolicy(nonce));if(contents)contents=Buffer.from(adsense.renderPage(contents.toString(),nonce));}
      res.setHeader('Cache-Control',vedic.isVedic(url.pathname)?vedic.headers['Cache-Control']:name.endsWith('.html')?'no-store':'no-cache');return res.end(contents);
    }
    const host = req.headers.host || '';
    const localHost=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    if (!localHost && (!publicOrigin||host!==new URL(publicOrigin).host)) fail(403,'Host rejected');
    const allowedOrigin=localHost?`http://${host}`:publicOrigin;
    if (req.headers.origin && req.headers.origin!==allowedOrigin) fail(403,'Origin rejected');
    if (req.headers['sec-fetch-site']==='cross-site') fail(403,'Cross-site request rejected');
    const route=url.pathname.slice(5), method=req.method;
    if(url.pathname==='/api/platform/visitors')return await visitorCounter(req,res,allowedOrigin);
    if(url.pathname==='/api/confessions'||url.pathname.startsWith('/api/confessions/'))return await confessionApp(req,res,allowedOrigin);
    if(url.pathname==='/api/feedback'||url.pathname.startsWith('/api/feedback/'))return await feedbackApp(req,res,allowedOrigin);
    if(url.pathname==='/api/pandit-booking'||url.pathname.startsWith('/api/pandit-booking/'))return await panditBooking(req,res,allowedOrigin);
    if(url.pathname==='/api/satire-arena'||url.pathname.startsWith('/api/satire-arena/'))return await satireArena(req,res,allowedOrigin);
    const user=auth.session(req);
    const context={route,method,req,res,json,user};
    if(route==='organisation-admin'||route.startsWith('organisation-admin/')){
      if(!adminPreview)return json(404,{error:'Not found'});
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return json(403,{error:'Local preview only'});
      if(!user&&!(['organisation-admin/activate-new-master','organisation-admin/activate-new-member'].includes(route)&&method==='POST'))return json(401,{error:'Please sign in'});
      try{administration ||= import('../apps/admin/backend/routes.mjs').then(({createOrganisationAdmin})=>createOrganisationAdmin({db:store.nativeSqlite,exportSql:options=>store.exportSql(options)}));return await (await administration)(context);}
      catch{return json(503,{error:'Administration preview requires a prepared temporary workspace'});}
    }
    if(route==='chambers'||route.startsWith('chambers/')||route.startsWith('client-portal/')){
      if(!adminPreview)return json(404,{error:'Not found'});
      if(!user)return json(401,{error:'Please sign in'});
      organisationChambers ||= import('../apps/advocate/backend/organisation-routes.mjs').then(({createOrganisationChambers})=>createOrganisationChambers({db:store.nativeSqlite}));
      return await (await organisationChambers)(context);
    }
    if(adminPreview&&!['auth/status','auth/login','auth/logout','auth/profile','auth/password'].includes(route))return json(409,{error:'This temporary preview requires explicit organisation-scoped APIs; legacy workspace access is disabled'});
    if(route.startsWith('auth/')||route==='users'||route.startsWith('users/'))return await auth.handle(context);
    if(route==='support'||route==='platform/support')return await support(context);
    if(route==='focus'||route.startsWith('focus/'))return await focus(context);
    if(route==='ritual-assist/calendar'||route==='ritual-assist/observances')return await ritualCalendar(context);
    if(route==='news'||route.startsWith('news/'))return await news(context);
    if(route==='tournament-lite'||route.startsWith('tournament-lite/'))return await tournament(context);
    if(route==='digital-samaj'||route.startsWith('digital-samaj/'))return await digitalSamaj(context);
    if(route==='fund-overlap'||route.startsWith('fund-overlap/'))return await fundOverlap(context);
    if(!user)fail(401,'Please sign in');
    if(route==='ledger'&&method==='GET')return json(200,{markdown:fs.readFileSync(path.join(ROOT,'docs/FUNCTIONALITY_LEDGER.md'),'utf8')});
    if(route==='platform'||route.startsWith('platform/'))return await portal(context);
    if(route==='batchfee-lite'||route.startsWith('batchfee-lite/'))return await batchFee(context);
    return await advocate(context);
}
const server=http.createServer(async(req,res)=>{
 try{
  if(store.provider==='sqlserver'&&req.url.startsWith('/api/')){
   // A success response is published only after the enclosing transaction commits.
   const headers=new Map();let code=200,body;
   const staged={headersSent:false,setHeader(name,value){headers.set(name,value);},writeHead(status,values={}){code=status;for(const [name,value]of Object.entries(values))headers.set(name,value);},end(value){body=value;}};
   await store.requestContext(()=>dispatch(req,staged));
   for(const [name,value]of headers)res.setHeader(name,value);res.writeHead(code);res.end(body);
  }else if(adminPreview&&req.url.startsWith('/api/')){
   const previous=previewQueue;let release;previewQueue=new Promise(resolve=>{release=resolve;});await previous;
   try{await dispatch(req,res);}finally{release();}
  }else await dispatch(req,res);
 }catch(error){if(!res.headersSent){res.writeHead(error.status||400,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:error.message.includes('UNIQUE constraint')?'This record already exists':error.message}));}else res.end();}
});
server.requestTimeout=60000;
server.listen(process.env.PORT===undefined?3000:Number(process.env.PORT),process.env.HOST||'127.0.0.1',()=>console.log(`Sushant Synapse Platform running at http://localhost:${server.address().port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.sql.close();process.exit(0);}));
