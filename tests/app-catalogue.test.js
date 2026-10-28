const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalogue=require('../packages/app-registry');
test('browser and server read the same registry, without private account state',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync('packages/app-registry/index.js','utf8'),context);assert.equal(JSON.stringify(context.SynapseCatalogue.apps),JSON.stringify(catalogue.apps));assert.equal(new Set(catalogue.apps.map(a=>a.id)).size,catalogue.apps.length);assert.ok(catalogue.visibleApps().every(a=>!a.catalogueParent));assert.ok(!JSON.stringify(context.SynapseCatalogue).includes('preferences'));
});
test('shipped no-JavaScript cards and featured links match the shared renderer',()=>{
 const {buildCatalogue,navigationBundle}=require('../infrastructure/build-catalogue.cjs');assert.equal(buildCatalogue({write:false}),fs.readFileSync('apps/portal/frontend/index.html','utf8'));assert.equal(navigationBundle(),fs.readFileSync('packages/ui/platform-shell.bundle.js','utf8'));
});

test('home artwork resolves every symbol and paint server inside the document for Safari',()=>{
 const html=fs.readFileSync('apps/portal/frontend/index.html','utf8');
 const sprite=html.match(/<!-- home-art:start -->([\s\S]*?)<!-- home-art:end -->/)[1];
 const ids=[...sprite.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of sprite.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(match[1]),match[1]);
 for(const app of catalogue.visibleApps()){
  for(const options of [{},{signedIn:true,access:{accessible:true,status:'Available'}}]){
   const card=catalogue.renderCard(app,options);
   const target=card.match(/<use href="#([^"]+)"/)[1];
   assert.ok(ids.includes(target),app.id+' resolves '+target);
   assert.doesNotMatch(card,/href="\/home-art\.svg#/);
  }
 }
});
test('private launch and favourite controls require available server-granted access',()=>{
 const app=catalogue.apps.find(a=>a.id==='advocate');
 const guest=catalogue.renderCard(app);assert.match(guest,/href="\/signin\?next=advocate"/);assert.doesNotMatch(guest,/data-action="launch"|data-action="favorite"/);
 const locked=catalogue.renderCard(app,{signedIn:true,access:{accessible:false,status:'Available'}});assert.match(locked,/Access required/);assert.doesNotMatch(locked,/data-action="launch"|data-action="favorite"/);
 for(const status of ['Unavailable','Planned']){const html=catalogue.renderCard(app,{signedIn:true,access:{accessible:true,status}});assert.doesNotMatch(html,/data-action="launch"|data-action="favorite"|href="\/advocate"/);}
 const allowed=catalogue.renderCard(app,{signedIn:true,access:{accessible:true,status:'Available'},favorite:true});assert.match(allowed,/data-action="launch"/);assert.match(allowed,/aria-pressed="true"/);
 const publicUnavailable=catalogue.renderCard(catalogue.apps.find(a=>a.id==='qr-maker'),{signedIn:true,access:{accessible:false,status:'Unavailable'}});assert.doesNotMatch(publicUnavailable,/data-action="launch"|href="\/qr-maker"|data-action="favorite"/);
});
