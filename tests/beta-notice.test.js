const {test}=require('node:test'),assert=require('node:assert/strict');
const {betaHtml,whatsapp}=require('../packages/ui/beta-html.cjs');
test('beta markup is idempotent, readable without JS and preserves app scripts',()=>{
 const html=betaHtml('<html><head><link rel="icon" href="/logo-adaptive-192.png"></head><body><main>App</main><script src="/app.js"></script><footer class="synapse-legal-footer">Legal</footer></body></html>');
 assert.equal(betaHtml(html),html);assert.equal((html.match(/data-synapse-beta/g)||[]).length,1);
 assert.match(html,/rel="icon" type="image\/png" sizes="192x192" href="\/logo-adaptive-192\.png\?v=20261029-company"/);
 assert.ok(html.includes('<script src="/app.js"></script>'));assert.ok(html.indexOf('data-synapse-beta')<html.indexOf('<footer'));
 assert.match(html,/beta-notice.js" defer/);assert.match(html,/Verify important information/);
 assert.equal(betaHtml('<svg/>'),'<svg/>');assert.ok(betaHtml('<head></head><body>Admin</body>').includes('data-synapse-beta'));
 const url=new URL(whatsapp);assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/917874166009');
 assert.ok(url.searchParams.get('text').includes('content/licensing concern'));assert.equal(url.searchParams.size,1);
});
