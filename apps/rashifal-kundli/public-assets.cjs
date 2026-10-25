const prefix='/rashifal-kundli',base='apps/rashifal-kundli/frontend/';
const assets={};
for(const entry of ['birth','rashifal','matching','time-machine']){
 const route=entry==='birth'?prefix:prefix+'/'+entry;
 assets[route]=assets[route+'/']=base+'production/'+entry+'.html';
 assets[prefix+'/'+entry+'.mjs']=base+'production/'+entry+'.mjs';
}
assets[prefix+'/sensitivity-worker.mjs']=base+'production/sensitivity-worker.mjs';
assets[prefix+'/rashifal-worker.mjs']=base+'production/rashifal-worker.mjs';
assets[prefix+'/home-calendar.mjs']=base+'production/home-calendar.mjs';
for(const name of ['chart-view','birth-app','traditions','time-machine','sensitivity','rulebook','advanced','rashifal','preview','export-report'])assets[prefix+'/'+name+'.css']=base+name+'.css';
assets[prefix+'/tokens.css']='packages/ui/premium.bundle.css';
assets[prefix+'/theme.js']='packages/ui/theme.js';
module.exports=assets;
