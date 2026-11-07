const fs=require('node:fs'),path=require('node:path'),{buildSync}=require('esbuild');
const output=path.join(__dirname,'frontend/production');
const entries={birth:'birth-app',rashifal:'rashifal-app',matching:'matching-app','time-machine':'time-machine-app'};
// Preserve the exact original link order, including shared overrides at the end.
const stylesheetFiles=['../../packages/ui/premium.bundle.css','../../packages/ui/platform-header.css','../../packages/ui/legal-footer.css',...['chart-view','birth-app','traditions','time-machine','sensitivity','rulebook','advanced','rashifal','export-report','daily-almanac','location-control','preview'].map(name=>'frontend/'+name+'.css'),'../../packages/ui/platform-shell.css'];
function build(){
 require('../../infrastructure/build-place-directory.cjs').buildPlaceDirectory();
 const hash=require('node:crypto').createHash('sha256');hash.update(fs.readFileSync(__filename));
 hash.update(fs.readFileSync(path.resolve(__dirname,'../../infrastructure/home-css.cjs')));
 hash.update(fs.readFileSync(path.resolve(__dirname,'../../packages/ui/legal-html.cjs')));
 for(const file of stylesheetFiles)hash.update(file).update(fs.readFileSync(path.resolve(__dirname,file)));
 for(const directory of ['dev','frontend','../../packages/vedic']){
  const root=path.resolve(__dirname,directory);
  for(const name of fs.readdirSync(root,{recursive:true}).sort()){
   if(name.split(path.sep).includes('production')||! /\.(mjs|json)$/.test(name))continue;
   const file=path.join(root,name);if(fs.statSync(file).isFile())hash.update(directory+'/'+name).update(fs.readFileSync(file));
  }
 }
 const signature=hash.digest('hex'),stamp=path.join(output,'.source-hash');
 const expected=[...Object.keys(entries).flatMap(entry=>[entry+'.html',entry+'.mjs']),'sensitivity-worker.mjs','rashifal-worker.mjs','home-calendar.mjs','application.css','chunks.json'];
 if(fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8')===signature&&expected.every(name=>fs.existsSync(path.join(output,name))))return;
 fs.mkdirSync(output,{recursive:true});
 const cssSource=stylesheetFiles.map(file=>fs.readFileSync(path.resolve(__dirname,file),'utf8')).join('\n');
 const scopedCss=require('../../infrastructure/home-css.cjs').appCss(cssSource,'rashifal-kundli');
 fs.writeFileSync(path.join(output,'application.css'),require('esbuild').transformSync(scopedCss,{loader:'css',target:'chrome114',minify:true,charset:'utf8'}).code);
 buildSync({entryPoints:[path.join(__dirname,'frontend/home-calendar.mjs')],outfile:path.join(output,'home-calendar.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8'});
 const bundled=buildSync({entryPoints:Object.fromEntries(Object.keys(entries).map(entry=>[entry,path.join(__dirname,'frontend/entries',entry+'.mjs')])),outdir:output,outExtension:{'.js':'.mjs'},chunkNames:'chunks/[name]-[hash]',splitting:true,metafile:true,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8'});
 const chunks=Object.keys(bundled.metafile.outputs).map(file=>path.relative(output,path.resolve(file)).split(path.sep).join('/')).filter(file=>file.startsWith('chunks/')&&file.endsWith('.mjs'));
 fs.writeFileSync(path.join(output,'chunks.json'),JSON.stringify(chunks));
 for(const [entry,id] of Object.entries(entries)){
  const seen=new Set(),dependencies=[];
  function preload(file){for(const child of bundled.metafile.outputs[file]?.imports||[]){if(child.external||seen.has(child.path))continue;seen.add(child.path);dependencies.push(path.relative(output,path.resolve(child.path)).split(path.sep).join('/'));preload(child.path);}}
  preload(Object.keys(bundled.metafile.outputs).find(file=>path.resolve(file)===path.join(output,entry+'.mjs')));
  const preloads=dependencies.map(file=>`<link rel="modulepreload" href="/rashifal-kundli/${file}">`).join('');
  const nav=[['birth','Kundli',''],['rashifal','Rashifal','/rashifal'],['timeMachine','Time Machine','/time-machine'],['matching','Matching','/matching']].map(([key,label,suffix])=>`<a data-vedic-text="${key}" href="/rashifal-kundli${suffix}"${(entry==='birth'&&!suffix)||suffix==='/'+entry?' aria-current="page"':''}>${label}</a>`).join('');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>Ritvayam · Sushant Synapse</title><link rel="icon" href="/logo-adaptive-192.png">${preloads}<link rel="stylesheet" href="/rashifal-kundli/application.css"><script src="/shared/theme.js"></script><script src="/shared/platform-shell.js" defer></script><script src="/shared/language.js" defer></script></head><body data-ui-app="rashifal-kundli" data-platform-privacy="local-only" class="platform-shell-pending ${entry==='rashifal'?'vedic-rashifal-page':entry==='time-machine'?'vedic-tm-page':'vedic-birth-page'}"><a class="skip-link" href="#${id}">Skip to content</a><div class="vedic-app-header"><nav class="vedic-nav" aria-label="Vedic preview">${nav}</nav><details class="rashifal-preview-info"><summary data-vedic-text="previewDetails">About this preview</summary><p data-vedic-text="warning"></p><p data-vedic-text="privacy"></p></details></div><main id="${id}"><p class="vedic-initial-loading" role="status">Loading your workspace...</p></main><noscript>JavaScript is required. Birth details are processed on this device. <a href="/">Platform home</a></noscript><script type="module" src="/rashifal-kundli/${entry}.mjs"></script></body></html>`;
  fs.writeFileSync(path.join(output,entry+'.html'),require('../../packages/ui/legal-html.cjs').legalHtml(html));
 }
 buildSync({entryPoints:[path.join(__dirname,'dev/sensitivity-worker.mjs')],outfile:path.join(output,'sensitivity-worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8'});
 buildSync({entryPoints:[path.join(__dirname,'frontend/rashifal-worker.mjs')],outfile:path.join(output,'rashifal-worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,charset:'utf8'});
 fs.writeFileSync(stamp,signature);
}
module.exports={build,stylesheetFiles};
if(require.main===module)build();
