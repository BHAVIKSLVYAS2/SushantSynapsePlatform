import registry from './index.js';
// Reviewed, useful public landing pages only. Never derive this from all HTML
// assets: that includes account/admin shells and noindex verification previews.
const utilityIds=new Set(['rozhisab','qr-maker','photo-resize','bill-splitter','moment-studio','decision-wheel','focus','ritual-assist','team-mixer','timetable-lite','daily-spark']);
export function publicUtilityPaths(){
 const apps=registry.apps.filter(app=>app.public&&app.status==='Available'&&utilityIds.has(app.id));
 return [...new Set([...apps.map(app=>app.path),...(apps.some(app=>app.id==='ritual-assist')?['/ritual-assist/calendar']:[]),...(apps.some(app=>app.id==='moment-studio')?['/moment-studio/cards']:[])])];
}

export function publicSeoResponse(request, publicOrigin){
 const url=new URL(request.url);
 if(!['/robots.txt','/sitemap.xml'].includes(url.pathname))return null;
 const origin=publicOrigin||url.origin,robot=url.pathname==='/robots.txt';
 const headers={'Content-Type':robot?'text/plain; charset=utf-8':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 const xml=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const body=robot?'User-agent: *\nDisallow: /api/\nSitemap: '+origin+'/sitemap.xml\n':
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
  ['/',...publicUtilityPaths()].map(path=>'<url><loc>'+xml(origin+path)+'</loc></url>').join('')+'</urlset>';
 return new Response(request.method==='HEAD'?null:body,{headers});
}
