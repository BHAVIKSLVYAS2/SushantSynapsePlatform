const fs=require('node:fs'),path=require('node:path');
const {transformSync,buildSync}=require('esbuild');
const {appCss}=require('../home-css.cjs');

// Filter only positively scoped rules; preserve shared rules and cascade order.
function prepareDelivery(output,files){
 const premium=fs.readFileSync(path.join(output,'/shared/premium.css'),'utf8');
 for(const [url,source]of [...files]){
  if(!source.endsWith('.html'))continue;
  const filename=path.join(output,url),html=fs.readFileSync(filename,'utf8');
  const app=html.match(/<body\b[^>]*\bdata-ui-app=["']([\w-]+)["']/i)?.[1];
  if(!app||!html.includes('/shared/premium.css'))continue;
  const asset='/shared/premium-'+app+'.css';
  fs.writeFileSync(path.join(output,asset),appCss(premium,app));
  files.set(asset,'packages/ui/premium.bundle.css');
  fs.writeFileSync(filename,html.replaceAll('/shared/premium.css',asset));
 }
 let before=0,after=0;
 for(const [url,source]of files){
  if(url.startsWith('/_')||! /\.(?:js|mjs|css)$/.test(url))continue;
  const filename=path.join(output,url);
  // This shared Node module imports JSON with attributes. Bundle its public
  // browser alias so chrome114 minification cannot strip the JSON type marker.
  const input=source==='packages/vedic/places.mjs'?buildSync({entryPoints:[path.resolve(__dirname,'../..',source)],bundle:true,write:false,format:'esm',platform:'browser',target:'chrome114',charset:'utf8',legalComments:'inline'}).outputFiles[0].text:fs.readFileSync(filename,'utf8');
  const {code}=transformSync(input,{loader:url.endsWith('.css')?'css':'js',
   minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:url.endsWith('.mjs')||/^\s*import\s/.test(input),target:'chrome114',legalComments:'inline',charset:'utf8'});
  before+=Buffer.byteLength(input);after+=Buffer.byteLength(code);
  fs.writeFileSync(filename,code);
 }
 console.log(`Public JS/CSS delivery: ${before} → ${after} bytes.`);
 return {before,after};
}
module.exports={prepareDelivery};
