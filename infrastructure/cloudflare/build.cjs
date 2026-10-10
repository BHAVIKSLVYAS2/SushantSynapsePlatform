const fs = require('node:fs');
const path = require('node:path');
const {staticAssets} = require('../../server/static-assets');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'dist');
// Export only the public allowlist, never data, credentials or backend source.
function build() {
  if (fs.existsSync(output)) {
    if (fs.realpathSync(output) !== output || path.relative(root, output) !== path.join('infrastructure', 'cloudflare', 'dist')) throw Error('Unsafe export path');
    fs.rmSync(output, {recursive: true});
  }
  fs.mkdirSync(output, {recursive: true});
  const references = {'/api/fund-overlap/fund-index.json': JSON.parse(fs.readFileSync(path.join(root, 'apps/fund-overlap/data/fund-index.json'), 'utf8'))};
  for (const fund of references['/api/fund-overlap/fund-index.json'].funds) {
    if (!/^\/api\/fund-overlap\/holdings\/[a-z0-9-]+\/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/.test(fund.holdingsPath)) throw Error('Invalid public snapshot path');
    references[fund.holdingsPath] = JSON.parse(fs.readFileSync(path.join(root, 'apps/fund-overlap/data', fund.holdingsPath.slice('/api/fund-overlap/'.length)), 'utf8'));
  }
  fs.writeFileSync(path.join(__dirname, 'fund-references.json'), JSON.stringify(references));
  const pages = {}, files = new Map();
  for (const [url, source] of Object.entries(staticAssets)) {
    const target = source.endsWith('.html') ? '/_pages/' + (url.replaceAll('/', '') || 'home') + '.html' : url;
    if (source.endsWith('.html')) pages[url] = target;
    files.set(target, source);
  }
  files.set('/_pages/unavailable.html', 'apps/portal/frontend/unavailable.html');
  files.set('/shared/availability.js', 'packages/ui/availability.js');
  files.set('/shared/availability.css', 'packages/ui/availability.css');
  for (const [url, source] of files) {
    const target = path.join(output, url);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    let contents = fs.readFileSync(path.join(root, source));
    if (source.endsWith('.html')) contents = Buffer.from(contents.toString().replace('<head>', '<head><link rel="stylesheet" href="/shared/availability.css"><script src="/shared/availability.js"></script>'));
    fs.writeFileSync(target, contents);
  }
  fs.writeFileSync(path.join(__dirname, 'pages.json'), JSON.stringify(pages, null, 2) + '\n');
  fs.writeFileSync(path.join(output, '_headers'), `/*
  X-Synapse-Frontend: cloudflare
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=3600
  Referrer-Policy: same-origin
  Cache-Control: no-cache
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
`);
  console.log(`Exported ${files.size} public frontend assets; no database or credentials included.`);
  return {output, pages, files};
}
if (require.main === module) build();
module.exports = {build};
