const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),search=require('../frontend/search-engine');
const index=JSON.parse(fs.readFileSync(path.join(root,'data/official-index.json'),'utf8')),coverage=JSON.parse(fs.readFileSync(path.join(root,'data/coverage.json'),'utf8'));
const amcs=[],rows=search.catalogue(index.funds,coverage.schemes).filter(f=>!f.available).map(f=>{let amc=amcs.indexOf(f.amc);if(amc<0){amc=amcs.length;amcs.push(f.amc);}return [f.id.slice('unavailable-'.length),f.name,amc];});
fs.writeFileSync(path.join(root,'frontend/picker-catalogue.json'),JSON.stringify({version:1,asOf:coverage.asOf||coverage.generatedAt,amcs,rows})+'\n');
console.log(`Saved picker catalogue: ${rows.length} grouped names; no external fetch.`);
