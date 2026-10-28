const version='2026-10-19.1';
const key='synapse-beta-acknowledgement';
const whatsapp='https://wa.me/917874166009?text='+encodeURIComponent('Hello Sushant Synapse, I would like to report a beta issue or a content/licensing concern. App name: [please add]. What happened: [please add].');
function betaHtml(html){
 html=require('./legal-html.cjs').legalHtml(html);
 html=html.replace(/<link\b[^>]*\brel="(?:icon|shortcut icon)"[^>]*\bhref="\/(?:logo-adaptive-192\.png|favicon\.svg)(?:\?[^\"]*)?"[^>]*>/gi,'<link rel="icon" type="image/png" sizes="192x192" href="/logo-adaptive-192.png?v=20261029-company">');
 if(!/<body\b/i.test(html)||html.includes('data-synapse-beta'))return html;
 const note='<div id="synapse-beta-note" role="note" class="synapse-beta-note" data-synapse-beta aria-label="Beta notice"><strong>Beta</strong><p>Beta tools may contain errors. Verify important information.</p><a href="'+whatsapp+'" target="_blank" rel="noopener noreferrer">Report an issue on WhatsApp</a><a href="/terms#beta-notice">Beta &amp; third-party information</a><button type="button" data-beta-review hidden>Review beta notice</button></div>';
 html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/shared/beta-notice.css"><script src="/shared/beta-notice.js" defer></script></head>');
 const footer=html.match(/<footer\b[^>]*class="[^"]*synapse-legal-footer[^>]*>/i);
 return footer?html.replace(footer[0],note+footer[0]):html.replace(/<\/body>/i,note+'</body>');
}
module.exports={betaHtml,version,key,whatsapp};
