// Each voting entry is generated from the shared template.
const fs=require('node:fs'),path=require('node:path');
function buildArenaEntry(){
 const folder=path.join(__dirname,'frontend'),source=fs.readFileSync(path.join(folder,'index.html'),'utf8');
 for(const [id,name,image,label]of [['news-anchors','News Anchors','anchors-fast.webp','ANCHOR'],['actors','Actors','actors-fast.webp','ACTOR'],['corporates','Corporates','corporates-fast.webp','BOARDROOM']]){
  const count=id==='corporates'?'Nine':'Six';
  const description=`${count} fictional ${name.toLowerCase()} spoofs. Six reactions. Genuine yearly scores.`;
  const html=source.replaceAll('https://apps.sushantsynapse.com/satire-arena/politicians"','https://apps.sushantsynapse.com/satire-arena/'+id+'"')
   .replace('href="/satire-arena/cast-fast.webp"','href="/satire-arena/'+image+'"')
   .replace(/<title>[^<]+<\/title>/,`<title>${name} · Garland or Roast · Satire Arena</title>`)
   .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${description}">`)
   .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${description}">`)
   .replace(/<meta property="og:image" content="[^"]*">/,`<meta property="og:image" content="https://apps.sushantsynapse.com/satire-arena/${image}">`)
   .replace('<h2>Politicians Arena</h2>','<h2>'+name+' Arena</h2>')
   .replace('href="/satire-arena/politicians" aria-current="page"','href="/satire-arena/politicians"')
   .replace('href="/satire-arena/'+id+'"','href="/satire-arena/'+id+'" aria-current="page"')
   .replace('THIRTEEN FICTIONAL CHARACTERS',count.toUpperCase()+' FICTIONAL '+label+' SPOOFS');
  fs.writeFileSync(path.join(folder,id+'.html'),html);
 }
}
if(require.main===module)buildArenaEntry();
module.exports={buildArenaEntry};
