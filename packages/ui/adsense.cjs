// Public-home-only integration. Never include account or tool input in ad code.
const publisher='ca-pub-1894051755496526';
const eligibleHome=(pathname,cookie='')=>pathname==='/'&&!/(?:^|;\s*)chambers_session=/.test(cookie);
function renderHome(html,nonce){
 if(!/^[a-zA-Z0-9-]{32,64}$/.test(nonce))throw Error('Invalid response nonce');
 const code=`<meta name="google-adsense-account" content="${publisher}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisher}" crossorigin="anonymous"></script>`;
 return html.replace('</head>',code+'</head>').replace(/<script\b/g,`<script nonce="${nonce}"`);
}
function homePolicy(nonce){
 // Google supports nonce-based strict CSP, rather than a changing domain list.
 return `default-src 'self'; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-src https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;
}
module.exports={publisher,eligibleHome,renderHome,homePolicy};
