const prefix='/rashifal-kundli',base='apps/rashifal-kundli/frontend/';
const assets={};
function generatedChunks(){
 const fs=require('node:fs'),path=require('node:path'),manifest=path.join(__dirname,'frontend/production/chunks.json');
 if(!fs.existsSync(manifest))return {};
 return Object.fromEntries(JSON.parse(fs.readFileSync(manifest,'utf8')).map(file=>{
  if(!/^chunks\/chunk-[A-Z0-9]+\.mjs$/.test(file))throw Error('Invalid public chunk manifest');
  return [prefix+'/'+file,base+'production/'+file];
 }));
}
Object.assign(assets,generatedChunks());
Object.defineProperty(assets,'generatedChunks',{value:generatedChunks});
for(let sign=1;sign<=12;sign++)for(const theme of ['light','dark'])assets[`${prefix}/moon-signs/${sign}-${theme}.webp`]=`${base}assets/moon-signs/${sign}-${theme}.webp`;
for(const entry of ['birth','rashifal','matching','time-machine']){
 const route=entry==='birth'?prefix:prefix+'/'+entry;
 assets[route]=assets[route+'/']=base+'production/'+entry+'.html';
 assets[prefix+'/'+entry+'.mjs']=base+'production/'+entry+'.mjs';
}
assets[prefix+'/sensitivity-worker.mjs']=base+'production/sensitivity-worker.mjs';
assets[prefix+'/rashifal-worker.mjs']=base+'production/rashifal-worker.mjs';
assets[prefix+'/home-calendar.mjs']=base+'production/home-calendar.mjs';
assets[prefix+'/application.css']=base+'production/application.css';
for(const name of ['chart-view','birth-app','traditions','time-machine','sensitivity','rulebook','advanced','rashifal','preview','export-report','daily-almanac'])assets[prefix+'/'+name+'.css']=base+name+'.css';
assets[prefix+'/tokens.css']='packages/ui/premium.bundle.css';
assets[prefix+'/theme.js']='packages/ui/theme.js';
module.exports=assets;
