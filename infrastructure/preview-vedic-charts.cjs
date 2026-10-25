'use strict';
// Loopback-only development harness. Not imported by platform server or export.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
async function createPreviewServer(port=0,{birth=false,rashifal=false,timeMachine=false,matching=false}={}){
 if([birth,rashifal,timeMachine,matching].filter(Boolean).length>1)throw new TypeError('Choose one preview.');
 const entry=matching?'matching':timeMachine?'time-machine':rashifal?'rashifal':birth?'birth':'preview';
 const bundle=await require('esbuild').build({entryPoints:[path.join(root,`apps/rashifal-kundli/dev/${entry}.mjs`)],
  bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
 const assets=new Map([
  ['/', ['text/html; charset=utf-8',fs.readFileSync(path.join(root,`apps/rashifal-kundli/dev/${entry}.html`))]],
  [`/${entry}.mjs`,['text/javascript; charset=utf-8',bundle.outputFiles[0].contents]],
  ['/chart-view.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/chart-view.css'))]],
  ['/tokens.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'packages/ui/premium.bundle.css'))]],
  ['/theme.js',['text/javascript; charset=utf-8',fs.readFileSync(path.join(root,'packages/ui/theme.js'))]]
 ]);
 if(rashifal)for(let sign=1;sign<=12;sign++)for(const theme of ['light','dark'])assets.set(`/rashifal-kundli/moon-signs/${sign}-${theme}.webp`,['image/webp',fs.readFileSync(path.join(root,`apps/rashifal-kundli/frontend/assets/moon-signs/${sign}-${theme}.webp`))]);
 if(birth||matching||timeMachine)assets.set('/birth-app.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/birth-app.css'))]);
 if(birth||matching)assets.set('/rulebook.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/rulebook.css'))]);
 if(birth)assets.set('/advanced.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/advanced.css'))]);
 if(birth){const worker=await require('esbuild').build({entryPoints:[path.join(root,'apps/rashifal-kundli/dev/sensitivity-worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});assets.set('/sensitivity-worker.mjs',['text/javascript; charset=utf-8',worker.outputFiles[0].contents]);assets.set('/sensitivity.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/sensitivity.css'))]);}
 if(birth||timeMachine)assets.set('/time-machine.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/time-machine.css'))]);
 if(rashifal){assets.set('/rashifal.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/rashifal.css'))]);assets.set('/preview.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/preview.css'))]);const html=assets.get('/');html[1]=Buffer.from(html[1].toString().replace('</head>','<link rel="stylesheet" href="/preview.css"></head>'));}
 if(rashifal){const worker=await require('esbuild').build({entryPoints:[path.join(root,'apps/rashifal-kundli/frontend/rashifal-worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});assets.set('/rashifal-worker.mjs',['text/javascript; charset=utf-8',worker.outputFiles[0].contents]);}
 if(birth)assets.set('/traditions.css',['text/css; charset=utf-8',fs.readFileSync(path.join(root,'apps/rashifal-kundli/frontend/traditions.css'))]);
 if(birth){const {reportCss,reportLayoutCss,reportTableCss}=await import('../apps/rashifal-kundli/frontend/export-report.mjs');assets.set('/export-report.css',['text/css; charset=utf-8',reportCss+reportLayoutCss+reportTableCss]);}
 const server=http.createServer((request,response)=>{
  const asset=request.method==='GET'?assets.get(request.url):null;
  response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('Referrer-Policy','no-referrer');response.setHeader('Cross-Origin-Opener-Policy','same-origin');
  response.setHeader('Permissions-Policy','geolocation=(), camera=(), microphone=(), payment=()');
  response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; frame-ancestors 'none'");
  if(!asset){response.writeHead(404);response.end('Not found');return;}
  response.writeHead(200,{'Content-Type':asset[0]});response.end(asset[1]);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
module.exports={createPreviewServer};
if(require.main===module)createPreviewServer(Number(process.argv[2]??4177)).then(server=>{
 console.log('Local synthetic chart preview: '+server.origin);process.on('SIGINT',()=>server.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
