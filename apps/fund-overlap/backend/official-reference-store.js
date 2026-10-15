'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {compileReferences,validateEntry} = require('./official-library');
const {createHash}=require('node:crypto');

function createOfficialReferenceStore(root = path.join(__dirname, '..', 'data'), {strict=true}={}) {
  let signature, current;
  return {read() {
    const files = ['fund-index.json','official-index.json'];
    const next = files.map(file=>{try {const stat=fs.statSync(path.join(root,file));return `${stat.mtimeMs}:${stat.size}`;}catch(error){if(file==='official-index.json'&&error.code==='ENOENT')return 'absent';throw error;}}).join('|');
    if (current && signature===next) return current;
    const baseIndex=JSON.parse(fs.readFileSync(path.join(root,files[0]),'utf8'));
    let officialIndex;
    try {
    if (next.split('|')[1]!=='absent') officialIndex=JSON.parse(fs.readFileSync(path.join(root,files[1]),'utf8'));
    // Packed edge search tables are a publication artifact. Node can scan its
    // local catalogue on fallback searches without building them on first load.
    const references=compileReferences({baseIndex,officialIndex,searchIndexes:strict,readSnapshot:relative=>{
      const resolved=fs.realpathSync(path.join(root,relative)),base=fs.realpathSync(root),within=path.relative(base,resolved);
      if(within.startsWith('..'+path.sep)||within==='..'||path.isAbsolute(within))throw Error('Official reference is outside its data directory');
      return fs.readFileSync(resolved);
    }});
    current=references;signature=next;
    return current;
    }catch(error){
      if(strict)throw error;
      const previous=current || compileReferences({baseIndex,searchIndexes:false,readSnapshot:relative=>readOfficialSnapshot(root,relative)});
      current={...previous,'/api/fund-overlap/coverage.json':{...previous['/api/fund-overlap/coverage.json'],warning:'The latest official-library publication could not be verified. Showing the last valid library with its original reporting dates.'}};
      signature=next;return current;
    }
  }};
}
function readOfficialSnapshot(root,relative){
  if(!/^holdings\/[a-z0-9-]{1,80}\/\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/.test(relative))throw Error('Invalid official snapshot path');
  const resolved=fs.realpathSync(path.join(root,relative)),within=path.relative(fs.realpathSync(root),resolved);
  if(within.startsWith('..'+path.sep)||within==='..'||path.isAbsolute(within))throw Error('Archive is outside its data directory');
  const bytes=fs.readFileSync(resolved),snapshot=JSON.parse(bytes),id=relative.split('/')[1],entry={id,name:snapshot.name,amc:snapshot.amc,category:snapshot.category,portfolioDate:snapshot.portfolioDate,includedNavWeight:snapshot.includedNavWeight,holdingsCount:snapshot.holdings?.length,holdingsPath:'/api/fund-overlap/'+relative,sourceSha256:snapshot.source?.sha256,snapshotSha256:createHash('sha256').update(bytes).digest('hex')};
  validateEntry(entry,bytes);
  return bytes;
}
function officialArchives(root,references){
  const ids=new Set(Object.keys(references).filter(key=>key.startsWith('/api/fund-overlap/holdings/')).map(key=>key.split('/')[4])),archives=[];
  for(const id of ids){
    const folder=path.join(root,'holdings',id);
    for(const file of fs.readdirSync(folder,{withFileTypes:true})){
      if(!file.isFile()||!/^\d{4}-\d{2}-\d{2}-[a-f0-9]{16}\.json$/.test(file.name))continue;
      const relative='holdings/'+id+'/'+file.name,url='/api/fund-overlap/'+relative;
      if(references[url])continue;
      readOfficialSnapshot(root,relative);
      archives.push({url,relative,target:'/_fund-archive/'+relative});
    }
  }
  return archives;
}
module.exports={createOfficialReferenceStore,officialArchives,readOfficialSnapshot};
