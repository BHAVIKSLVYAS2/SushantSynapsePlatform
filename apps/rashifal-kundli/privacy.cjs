const headers={
 'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
 'Cross-Origin-Opener-Policy':'same-origin','X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow',
 'Permissions-Policy':'geolocation=(), camera=(), microphone=(), payment=()',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
module.exports={headers,isVedic:path=>path==='/rashifal-kundli'||path.startsWith('/rashifal-kundli/')};
