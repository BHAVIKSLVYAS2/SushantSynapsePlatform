// Canonical shared legal/language markup, composed before serving or exporting.
const footer="<footer class=\"synapse-legal-footer\" aria-label=\"Platform legal information\"><span>Sushant Synapse</span><nav aria-label=\"Legal links\"><a href=\"/support\">Support us</a><a href=\"/showcase\">Watch demos</a><a href=\"https://wa.me/917874166009?text=Hello%2C%20I%20would%20like%20to%20contact%20Sushant%20Synapse.\" target=\"_blank\" rel=\"noopener noreferrer\">WhatsApp</a><a href=\"/privacy\">Privacy</a><a href=\"/terms\">Usage terms</a><a href=\"/contact\">Contact</a><a href=\"/legal/third-party-notices\">Third-party notices</a></nav><div class=\"synapse-language\" data-language-control hidden role=\"group\" aria-label=\"Interface language / \u092d\u093e\u0937\u093e\"><span>Language / \u092d\u093e\u0937\u093e</span><button type=\"button\" lang=\"en\" data-interface-language=\"en\" aria-pressed=\"true\">English</button><button type=\"button\" lang=\"hi\" data-interface-language=\"hi\" aria-pressed=\"false\">\u0939\u093f\u0928\u094d\u0926\u0940</button><small data-language-help hidden></small></div></footer>";
function legalHtml(html){
 html=html.replaceAll('<!-- synapse:legal-footer -->',footer);
 // Some local tools had a shared header but never loaded its language service.
 if(html.includes('/shared/platform-shell.js')&&!html.includes('/shared/language.js'))html=html.replace('</head>','<link rel="stylesheet" href="/shared/legal-footer.css"><script src="/shared/language.js?v=20261025-global" defer></script></head>');
 return html;
}
module.exports={legalHtml,footer};
