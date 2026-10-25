const fs=require('node:fs'),path=require('node:path'),{buildSync}=require('esbuild');
const output=path.join(__dirname,'frontend/production');
const entries={birth:'birth-app',rashifal:'rashifal-app',matching:'matching-app','time-machine':'time-machine-app'};
function build(){
 const hash=require('node:crypto').createHash('sha256');hash.update(fs.readFileSync(__filename));
 for(const directory of ['dev','frontend','../../packages/vedic']){
  const root=path.resolve(__dirname,directory);
  for(const name of fs.readdirSync(root,{recursive:true}).sort()){
   if(name.split(path.sep).includes('production')||! /\.(mjs|json)$/.test(name))continue;
   const file=path.join(root,name);if(fs.statSync(file).isFile())hash.update(directory+'/'+name).update(fs.readFileSync(file));
  }
 }
 const signature=hash.digest('hex'),stamp=path.join(output,'.source-hash');
 const expected=[...Object.keys(entries).flatMap(entry=>[entry+'.html',entry+'.mjs']),'sensitivity-worker.mjs','rashifal-worker.mjs','home-calendar.mjs'];
 if(fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8')===signature&&expected.every(name=>fs.existsSync(path.join(output,name))))return;
 fs.mkdirSync(output,{recursive:true});
 buildSync({entryPoints:[path.join(__dirname,'frontend/home-calendar.mjs')],outfile:path.join(output,'home-calendar.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 for(const [entry,id] of Object.entries(entries)){
  const [module,mount]=({birth:['birth-app','mountBirthApp'],rashifal:['rashifal-view','mountRashifal'],matching:['rulebook-view','mountMatching'],'time-machine':['time-machine-view','mountTimeMachine']})[entry];
  buildSync({stdin:{resolveDir:__dirname,sourcefile:'production-entry.mjs',contents:`import {${mount}} from './frontend/${module}.mjs'; import {initLanguageShell} from './frontend/language-shell.mjs'; ${mount}(document.querySelector('#${id}')); initLanguageShell();`},outfile:path.join(output,entry+'.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
  const css=['chart-view','birth-app','traditions','time-machine','sensitivity','rulebook','advanced','rashifal','export-report'];
  const nav=[['birth','Kundli',''],['rashifal','Rashifal','/rashifal'],['timeMachine','Time Machine','/time-machine'],['matching','Matching','/matching']].map(([key,label,suffix])=>`<a data-vedic-text="${key}" href="/rashifal-kundli${suffix}"${(entry==='birth'&&!suffix)||suffix==='/'+entry?' aria-current="page"':''}>${label}</a>`).join('');
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>RITVAYAM · Sushant Synapse</title><link rel="icon" href="/logo-adaptive-192.png"><link rel="stylesheet" href="/rashifal-kundli/tokens.css"><link rel="stylesheet" href="/shared/platform-header.css"><link rel="stylesheet" href="/shared/legal-footer.css">${css.map(name=>`<link rel="stylesheet" href="/rashifal-kundli/${name}.css">`).join('')}<link rel="stylesheet" href="/rashifal-kundli/preview.css"><link rel="stylesheet" href="/shared/platform-shell.css"><script src="/shared/theme.js"></script><script src="/shared/platform-shell.js" defer></script><script src="/shared/language.js" defer></script></head><body data-ui-app="rashifal-kundli" data-platform-privacy="local-only" class="platform-shell-pending ${entry==='rashifal'?'vedic-rashifal-page':entry==='time-machine'?'vedic-tm-page':'vedic-birth-page'}"><a class="skip-link" href="#${id}">Skip to content</a><div class="vedic-app-header"><nav class="vedic-nav" aria-label="Vedic preview">${nav}</nav><details class="rashifal-preview-info"><summary data-vedic-text="previewDetails">Preview · review pending</summary><p data-vedic-text="warning"></p><p data-vedic-text="privacy"></p></details></div><main id="${id}"></main><noscript>JavaScript is required. Birth details are processed on this device. <a href="/">Platform home</a></noscript><script type="module" src="/rashifal-kundli/${entry}.mjs"></script></body></html>`;
  fs.writeFileSync(path.join(output,entry+'.html'),html);
 }
 buildSync({entryPoints:[path.join(__dirname,'dev/sensitivity-worker.mjs')],outfile:path.join(output,'sensitivity-worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 buildSync({entryPoints:[path.join(__dirname,'frontend/rashifal-worker.mjs')],outfile:path.join(output,'rashifal-worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 fs.writeFileSync(stamp,signature);
}
module.exports={build};
if(require.main===module)build();
