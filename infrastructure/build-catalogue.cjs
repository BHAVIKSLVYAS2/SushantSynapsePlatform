// Static no-JavaScript home cards and browser hydration use the same renderer.
const fs=require('node:fs'),path=require('node:path');
const catalogue=require('../packages/app-registry');
function navigationBundle(){return '// Generated from app-registry/index.js and ui/platform-shell.js.\n'+fs.readFileSync(path.join(__dirname,'../packages/app-registry/index.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../packages/ui/platform-shell.js'),'utf8');}
function buildCatalogue({write=true}={}){
 const file=path.join(__dirname,'../apps/portal/frontend/index.html');let html=fs.readFileSync(file,'utf8');
 function grid(className,apps,render=catalogue.renderCard){const start=html.indexOf('<div class="'+className+'">');if(start<0)throw Error('Missing '+className);const content=start+('<div class="'+className+'">').length;let depth=1,end;
  for(const match of html.slice(content).matchAll(/<\/?div\b[^>]*>/g)){depth+=match[0].startsWith('</')?-1:1;if(!depth){end=content+match.index;break;}}
  if(end===undefined)throw Error('Unclosed '+className);html=html.slice(0,content)+apps.map(a=>render(a)).join('')+html.slice(end);
 }
 grid('public-apps',catalogue.visibleApps().filter(a=>a.public&&!a.homeFeatureOnly));grid('workspace-grid',catalogue.visibleApps().filter(a=>!a.public));
 const taskLinks=catalogue.renderTaskLinks();if(html.includes('class="home-task-shortcuts"'))html=html.replace(/<nav class="home-task-shortcuts"[\s\S]*?<\/nav>/,taskLinks);else html=html.replace(/(<section\b[^>]*id="free-apps"[^>]*>)/,'$1'+taskLinks);
 // Safari can lose gradient/filter references across an external <use> shadow tree.
 // Keep one namespaced, same-document sprite for static and hydrated cards.
 const sprite=fs.readFileSync(path.join(__dirname,'../apps/portal/frontend/home-art.svg'),'utf8')
  .replace('<svg xmlns="http://www.w3.org/2000/svg">','<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;overflow:hidden;pointer-events:none">')
  .replace(/id="([^"]+)"/g,'id="home-art-$1"').replace(/url\(#([^)]+)\)/g,'url(#home-art-$1)');
 const spriteBlock='<!-- home-art:start -->'+sprite+'<!-- home-art:end -->';
 if(html.includes('<!-- home-art:start -->'))html=html.replace(/<!-- home-art:start -->[\s\S]*?<!-- home-art:end -->/,spriteBlock);
 else html=html.replace(/(<body\b[^>]*>)/,'$1'+spriteBlock);
 // Ship the settled layout so discovery hydration never moves the cards.
 if(!html.includes('class="home-discovery-toolbar"'))html=html.replace(/(<div class="home-search">[\s\S]*?<\/button><\/div>)(<nav class="home-filters"[\s\S]*?<\/nav>)/,
  '<div class="home-discovery-toolbar">$1<details class="home-filter-menu"><summary>Filters</summary>$2</details></div><div class="home-active-filters" hidden><button type="button" hidden></button><button type="button">Clear all</button></div>');
 if(write){fs.writeFileSync(file,html);fs.writeFileSync(path.join(__dirname,'../packages/ui/platform-shell.bundle.js'),navigationBundle());}return html;
}
if(require.main===module)buildCatalogue();
module.exports={buildCatalogue,navigationBundle};
