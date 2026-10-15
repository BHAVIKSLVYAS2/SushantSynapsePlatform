import {publicEditorialPath,publicPage} from './public-pages.mjs';
export async function cloudPages(request,api){
 const url=new URL(request.url);if(!publicEditorialPath(url.pathname))return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 try{
  const content=await api(new Request(new URL('/api/arena-editorial/public',url)));if(!content.ok)throw Error();
  let results=null;if(url.pathname==='/satire-arena/results'){const r=await api(new Request(new URL('/api/satire-arena/results',url)));if(!r.ok)throw Error();results=await r.json();}
  return publicPage(request,await content.json(),results);
 }catch{return new Response(request.method==='HEAD'?null:'Satire content is temporarily unavailable. Please try again.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Retry-After':'30'}});}
}
