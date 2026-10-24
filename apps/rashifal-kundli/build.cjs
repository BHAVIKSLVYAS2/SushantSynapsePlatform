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
 const expected=[...Object.keys(entries).flatMap(entry=>[entry+'.html',entry+'.mjs']),'sensitivity-worker.mjs'];
 if(fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8')===signature&&expected.every(name=>fs.existsSync(path.join(output,name))))return;
 fs.mkdirSync(output,{recursive:true});
 for(const [entry,id] of Object.entries(entries)){
  buildSync({entryPoints:[path.join(__dirname,`dev/${entry}.mjs`)],outfile:path.join(output,entry+'.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
  const css=['chart-view','birth-app','traditions','time-machine','sensitivity','rulebook','advanced','rashifal','export-report'];
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>Rashifal &amp; Kundli — verification preview</title><link rel="stylesheet" href="/rashifal-kundli/tokens.css">${css.map(name=>`<link rel="stylesheet" href="/rashifal-kundli/${name}.css">`).join('')}<link rel="stylesheet" href="/rashifal-kundli/preview.css"></head><body class="${entry==='rashifal'?'vedic-rashifal-page':entry==='time-machine'?'vedic-tm-page':'vedic-birth-page'}"><header><h1>Rashifal &amp; Kundli · verification preview</h1><p>Experimental calculations and draft traditional interpretations. Independent source, sunrise, rulebook and translation reviews are unfinished. Do not rely on this preview for important decisions or certified ritual dates.</p><p>Birth details and results stay in this tab. No birth account, server submission, analytics or ads. Shared-device and browser-extension privacy still depends on your device.</p><nav aria-label="Vedic preview"><a href="/">Platform home</a> · <a href="/rashifal-kundli">Kundli</a> · <a href="/rashifal-kundli/rashifal">Rashifal</a> · <a href="/rashifal-kundli/time-machine">Time Machine</a> · <a href="/rashifal-kundli/matching">Matching</a></nav><label for="theme">Theme</label><select id="theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></header><main id="${id}"></main><noscript>JavaScript is required. Birth details are processed on this device.</noscript><script src="/rashifal-kundli/theme.js"></script><script type="module" src="/rashifal-kundli/${entry}.mjs"></script></body></html>`;
  fs.writeFileSync(path.join(output,entry+'.html'),html);
 }
 buildSync({entryPoints:[path.join(__dirname,'dev/sensitivity-worker.mjs')],outfile:path.join(output,'sensitivity-worker.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
 fs.writeFileSync(stamp,signature);
}
module.exports={build};
if(require.main===module)build();
