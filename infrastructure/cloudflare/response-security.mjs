// Apply transport/browser protections to every edge response, including errors.
// Keep page-specific CSP, privacy policies and immutable public asset caching.
export function secureResponse(request,response){
 const headers=new Headers(response.headers),url=new URL(request.url);
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('X-Frame-Options','DENY');
 if(!headers.has('Referrer-Policy'))headers.set('Referrer-Policy','same-origin');
 if(url.protocol==='https:')headers.set('Strict-Transport-Security','max-age=31536000');
 headers.set('Permissions-Policy','camera=(), microphone=(), payment=(), usb=(), geolocation=(self)');
 if(response.status>=400||url.pathname.startsWith('/api/')||url.pathname==='/healthz')headers.set('Cache-Control','no-store');
 return new Response(request.method==='HEAD'?null:response.body,{status:response.status,statusText:response.statusText,headers});
}
