const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');

// Each asset's digest includes its transitive dependencies, including cycles.
// Rewritten imports use absolute versioned URLs across digest directories.
function cacheStaticAssets(output,files){
 const assets=[...files].filter(([url,source])=>!source.endsWith('.html')&&!url.startsWith('/_'))
  .sort(([a],[b])=>a.localeCompare(b));
 const bytes=new Map(assets.map(([url])=>[url,fs.readFileSync(path.join(output,url))]));
 const textAsset=url=>/\.(?:css|js|mjs|svg|webmanifest)$/.test(url);
 const reference=/(["'`(\s=])((?:\/(?!\/)|\.\.?\/)[\w./%-]+)(?=[?#"'`)\s<>;]|$)/g;
 function resolve(base,url){
  return url.startsWith('/')?url:path.posix.normalize(path.posix.join(path.posix.dirname(base),url));
 }
 const dependencies=new Map(assets.map(([url])=>{
  const found=new Set();
  if(textAsset(url))for(const match of bytes.get(url).toString().matchAll(reference)){
   const target=resolve(url,match[2]);if(bytes.has(target))found.add(target);
  }
  return [url,found];
 }));
 const algorithm=fs.readFileSync(__filename),urls=new Map();
 for(const [url]of assets){
  const reachable=new Set();
  function visit(current){if(reachable.has(current))return;reachable.add(current);for(const child of dependencies.get(current))visit(child);}
  visit(url);
  const hash=createHash('sha256').update(algorithm);
  for(const dependency of [...reachable].sort()){
   const content=bytes.get(dependency);hash.update(dependency+'\0'+content.length+'\0').update(content);
  }
  urls.set(url,'/_static/'+hash.digest('hex').slice(0,32)+url);
 }
 function rewrite(text,base){
  // Only complete allowlisted URLs; API/page/external URLs remain untouched.
  return text.replace(reference,(match,before,url)=>before+(urls.get(resolve(base,url))||url));
 }
 for(const [url,source]of assets){
  const target=urls.get(url),filename=path.join(output,target),original=fs.readFileSync(path.join(output,url));
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,textAsset(url)?rewrite(original.toString(),url):original);
  files.set(target,source);
 }
 // Keep original assets available for unversioned links and generated pages.
 // HTML always stays fresh and selects the current release automatically.
 for(const [url,source]of files)if(source.endsWith('.html')){
  const filename=path.join(output,url);fs.writeFileSync(filename,rewrite(fs.readFileSync(filename,'utf8'),url));
 }
 return {prefix:'/_static',urls,count:assets.length};
}
module.exports={cacheStaticAssets};
