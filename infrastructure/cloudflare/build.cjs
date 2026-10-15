const fs = require('node:fs');
const path = require('node:path');
const {staticAssets} = require('../../server/static-assets');
const {createOfficialReferenceStore,officialArchives} = require('../../apps/fund-overlap/backend/official-reference-store');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'dist');
// Export only the public allowlist, never data, credentials or backend source.
function build({fullstack=false}={}) {
  if (fs.existsSync(output)) {
    if (fs.realpathSync(output) !== output || path.relative(root, output) !== path.join('infrastructure', 'cloudflare', 'dist')) throw Error('Unsafe export path');
    fs.rmSync(output, {recursive: true});
  }
  fs.mkdirSync(output, {recursive: true});
  const references = createOfficialReferenceStore(path.join(root,'apps/fund-overlap/data')).read();
  fs.writeFileSync(path.join(__dirname, 'fund-references.json'), JSON.stringify(references));
  // Portfolio bytes belong in free static assets, rather than growing the
  // compressed Worker bundle with every covered fund or reporting month.
  const runtimeReferences=Object.fromEntries(Object.entries(references).filter(([url])=>!url.startsWith('/api/fund-overlap/holdings/')));
  fs.writeFileSync(path.join(__dirname,'fund-runtime-references.json'),JSON.stringify(runtimeReferences));
  const current=Object.keys(references).filter(url=>url.startsWith('/api/fund-overlap/holdings/')).map(url=>({url,relative:url.slice('/api/fund-overlap/'.length),target:'/_fund-archive/'+url.slice('/api/fund-overlap/'.length)}));
  const archives=[...current,...officialArchives(path.join(root,'apps/fund-overlap/data'),references)];
  fs.writeFileSync(path.join(__dirname,'fund-archives.json'),JSON.stringify(Object.fromEntries(archives.map(item=>[item.url,item.target]))));
  const pages = {}, files = new Map();
  for (const [url, source] of Object.entries(staticAssets)) {
    const target = source.endsWith('.html') ? '/_pages/' + (url.replaceAll('/', '') || 'home') + '.html' : url;
    if (source.endsWith('.html')) pages[url] = target;
    files.set(target, source);
  }
  files.set('/_pages/unavailable.html', 'apps/portal/frontend/unavailable.html');
  files.set('/shared/availability.js', 'packages/ui/availability.js');
  files.set('/shared/availability.css', 'packages/ui/availability.css');
  for(const archive of archives)files.set(archive.target,'apps/fund-overlap/data/'+archive.relative);
  for (const [url, source] of files) {
    const target = path.join(output, url);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    let contents = fs.readFileSync(path.join(root, source));
    if (source.endsWith('.html')) contents = Buffer.from(contents.toString().replace('<head>', '<head><link rel="stylesheet" href="/shared/availability.css"><script src="/shared/availability.js"></script>'));
    fs.writeFileSync(target, contents);
  }
  fs.writeFileSync(path.join(__dirname, 'pages.json'), JSON.stringify(pages, null, 2) + '\n');
  if(fullstack){
    fs.mkdirSync(path.join(output, '_edge'), {recursive:true});
    fs.copyFileSync(path.join(root, 'docs/FUNCTIONALITY_LEDGER.md'), path.join(output, '_edge/functionality-ledger.md'));
  }
  fs.writeFileSync(path.join(output, '_headers'), `/*
  X-Synapse-Frontend: cloudflare
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=3600
  Referrer-Policy: same-origin
  Cache-Control: no-cache
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'

/_pages/home.html
  ! Content-Security-Policy
`);
  console.log(`Exported ${files.size} public frontend assets; no database or credentials included.`);
  return {output, pages, files};
}
if (require.main === module) build({fullstack:process.argv.includes('--fullstack')});
module.exports = {build};
