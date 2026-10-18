const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');

// Version the complete public asset graph together, so relative module imports,
// workers and CSS URLs keep resolving inside the same release directory.
function cacheStaticAssets(output,files){
 const assets=[...files].filter(([url,source])=>!source.endsWith('.html')&&!url.startsWith('/_'))
  .sort(([a],[b])=>a.localeCompare(b));
 const hash=createHash('sha256').update(fs.readFileSync(__filename));
 for(const [url]of assets){const bytes=fs.readFileSync(path.join(output,url));hash.update(url+'\0'+bytes.length+'\0').update(bytes);}
 const prefix='/_static/'+hash.digest('hex').slice(0,32),urls=new Map(assets.map(([url])=>[url,prefix+url]));
 function rewrite(text){
  // Replace only complete allowlisted root-relative references. Queries and SVG
  // fragments survive; API/page URLs and external origins are never rewritten.
  return text.replace(/(["'`(\s=])(\/[\w./-]+)(?=[?#"'`)\s<>;]|$)/g,(match,before,url)=>before+(urls.get(url)||url));
 }
 for(const [url,source]of assets){
  const target=urls.get(url),filename=path.join(output,target),original=fs.readFileSync(path.join(output,url));
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,/\.(?:css|js|mjs|svg)$/.test(url)?rewrite(original.toString()):original);
  files.set(target,source);
 }
 // Keep original assets available for unversioned links and generated pages.
 // HTML always stays fresh and selects the current release automatically.
 for(const [url,source]of files)if(source.endsWith('.html')){
  const filename=path.join(output,url);fs.writeFileSync(filename,rewrite(fs.readFileSync(filename,'utf8')));
 }
 return {prefix,count:assets.length};
}
module.exports={cacheStaticAssets};
