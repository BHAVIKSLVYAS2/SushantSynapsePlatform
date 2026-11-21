// Publish the reviewed standalone proposal without allowing inline scripts/styles.
const fs=require('node:fs'),path=require('node:path');
function buildBookPreview(){
 const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'docs/design/mantra-book-proposal.html'),'utf8');
 const style=source.match(/<style>([\s\S]*?)<\/style>/),data=source.match(/<script id="library-data" type="application\/json">([\s\S]*?)<\/script>/),runtime=source.match(/<script>([\s\S]*?)<\/script>/);
 if(!style||!data||!runtime)throw Error('Book preview template sections missing');
 const payload=JSON.parse(data[1]);
 for(const entry of payload)if(entry.recording)entry.recording.asset=entry.recording.asset.replace('../../apps/japseva/frontend','/japseva');
 const code=runtime[1].replace("JSON.parse(document.querySelector('#library-data').textContent)",JSON.stringify(payload));
 if(code===runtime[1])throw Error('Book preview data insertion failed');
 const html=source.replace(style[0],'<link rel="stylesheet" href="/japseva/book-preview.css">').replace(data[0],'').replace(runtime[0],'<script src="/japseva/book-preview.js" defer></script>').replaceAll('../../apps/japseva/frontend/','/japseva/');
 const output=path.join(__dirname,'frontend');
 for(const [name,content]of [['book-preview.html',html],['book-preview.css',style[1]],['book-preview.js',code]])fs.writeFileSync(path.join(output,name),content);
}
if(require.main===module)buildBookPreview();
module.exports={buildBookPreview};
