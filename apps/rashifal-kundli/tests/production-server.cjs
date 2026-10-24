const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
async function start(){
 if(process.env.VEDIC_LIVE_ORIGIN)return {origin:process.env.VEDIC_LIVE_ORIGIN,close:async()=>{}};
 const root=path.resolve('infrastructure/cloudflare/dist'),pages=JSON.parse(fs.readFileSync('infrastructure/cloudflare/pages.json','utf8'));
 const {headers}=require('../privacy.cjs');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+(pages[url.pathname]||url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{...headers,'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript'});res.end(fs.readFileSync(file));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:'http://127.0.0.1:'+server.address().port,close:()=>new Promise(resolve=>server.close(resolve))};
}
module.exports={start};
