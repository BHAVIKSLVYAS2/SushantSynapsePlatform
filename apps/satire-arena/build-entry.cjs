// News entry is generated from the shared voting template, not maintained twice.
const fs=require('node:fs'),path=require('node:path');
function buildArenaEntry(){
 const folder=path.join(__dirname,'frontend'),source=fs.readFileSync(path.join(folder,'index.html'),'utf8');
 const html=source.replaceAll('https://apps.sushantsynapse.com/satire-arena/politicians"','https://apps.sushantsynapse.com/satire-arena/news-anchors"')
  .replace('href="/satire-arena/cast-fast.webp"','href="/satire-arena/anchors-fast.webp"')
  .replace('<title>Garland or Roast · Satire Arena · Sushant Synapse</title>','<title>News Anchors · Garland or Roast · Satire Arena</title>')
  .replace('THIRTEEN FICTIONAL CHARACTERS','SIX FICTIONAL ANCHOR SPOOFS');
 fs.writeFileSync(path.join(folder,'news-anchors.html'),html);
}
if(require.main===module)buildArenaEntry();
module.exports={buildArenaEntry};
