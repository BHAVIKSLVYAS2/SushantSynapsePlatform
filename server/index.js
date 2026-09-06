const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {Store}=require('../apps/advocate/backend/store');
const {cleanSettings}=require('../apps/advocate/backend/settings');
const {createAuth}=require('../packages/auth');
const {createPortal}=require('../apps/portal/backend/routes');
const {createAdvocate}=require('../apps/advocate/backend/routes');
const {staticAssets}=require('./static-assets');
const {fail}=require('./http');
const ROOT=path.resolve(__dirname,'..');
const production=process.env.NODE_ENV==='production';
const publicOrigin=process.env.PUBLIC_ORIGIN?new URL(process.env.PUBLIC_ORIGIN).origin:'';
if(production&&(!publicOrigin||!publicOrigin.startsWith('https://')))throw Error('Production requires an HTTPS PUBLIC_ORIGIN');
if(production&&(!process.env.SETUP_TOKEN||process.env.SETUP_TOKEN.length<24))throw Error('Production requires a SETUP_TOKEN of at least 24 characters');
const store=new Store(process.env.DATA_DIR||path.join(ROOT,'data'));
const auth=createAuth({store,secureCookie:production||process.env.COOKIE_SECURE==='1',initializeWorkspace(input,user){store.setSetting('firm',cleanSettings({name:input.firmName||'My Chambers',advocate:user.name}));if(input.demo===true)store.demo();}});
const portal=createPortal({store,auth});
const advocate=createAdvocate({store,auth});
const server = http.createServer(async (req,res) => {
  const json = (code,data) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  try {
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/healthz'&&req.method==='GET')return json(200,{status:'ok'});
    if(url.pathname==='/advocate/'){res.writeHead(308,{Location:'/advocate'+url.search});return res.end();}
    if (!url.pathname.startsWith('/api/')) {
      const assets=staticAssets;
      const name=assets[url.pathname];if(!name){res.writeHead(404);return res.end('Not found');}
      if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Method not allowed');
      res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.png')?'image/png':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8');
      res.setHeader('Cache-Control','no-cache');return res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(ROOT,name)));
    }
    const host = req.headers.host || '';
    const localHost=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    if (!localHost && (!publicOrigin||host!==new URL(publicOrigin).host)) fail(403,'Host rejected');
    const allowedOrigin=localHost?`http://${host}`:publicOrigin;
    if (req.headers.origin && req.headers.origin!==allowedOrigin) fail(403,'Origin rejected');
    if (req.headers['sec-fetch-site']==='cross-site') fail(403,'Cross-site request rejected');
    const route=url.pathname.slice(5), method=req.method;
    const user=auth.session(req);
    const context={route,method,req,res,json,user};
    if(route.startsWith('auth/')||route==='users'||route.startsWith('users/'))return await auth.handle(context);
    if(!user)fail(401,'Please sign in');
    if(route==='ledger'&&method==='GET')return json(200,{markdown:fs.readFileSync(path.join(ROOT,'docs/FUNCTIONALITY_LEDGER.md'),'utf8')});
    if(route==='platform'||route.startsWith('platform/'))return await portal(context);
    return await advocate(context);
  } catch (error) {
    if(!res.headersSent)json(error.status||400,{error:error.message.includes('UNIQUE constraint')?'This record already exists':error.message});else res.end();
  }
});
server.listen(process.env.PORT===undefined?3000:Number(process.env.PORT),process.env.HOST||'127.0.0.1',()=>console.log(`Sushant Synapse Platform running at http://localhost:${server.address().port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{store.sql.close();process.exit(0);}));
