'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {ROOT,owners}=require('./catalog');
function migrations(){
 return owners.flatMap(([schema,dir])=>{
  const folder=path.join(ROOT,dir,'sqlserver'),ids=new Set();
  return fs.readdirSync(folder).filter(file=>/^\d{3}-[a-z0-9-]+\.sql$/.test(file)).sort().map(file=>{
   const id=schema+'-'+file.slice(0,3);if(ids.has(id))throw Error('Duplicate app migration sequence: '+id);ids.add(id);
   const source=fs.readFileSync(path.join(folder,file),'utf8');return {id,source,hash:createHash('sha256').update(source).digest('hex')};
  });
 });
}
module.exports={migrations};
