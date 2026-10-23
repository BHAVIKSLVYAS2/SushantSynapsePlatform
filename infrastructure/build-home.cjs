// Keep the original cascade order; this is delivery bundling, not new styling.
const fs=require('node:fs'),path=require('node:path'),{transformSync}=require('esbuild');
const root=path.resolve(__dirname,'..');
function buildHome(){
 require('../apps/satire-arena/build-entry.cjs').buildArenaEntry();
 require('./build-catalogue.cjs').buildCatalogue();
 const files=['apps/portal/frontend/platform.css','packages/ui/platform-header.css','packages/ui/legal-footer.css','packages/ui/whatsapp.css','packages/ui/premium.bundle.css','apps/portal/frontend/home.css','packages/ui/platform-shell.css'];
 const source=files.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
 const css=require('./home-css.cjs').homeCss(source);
 const {code}=transformSync(css,{loader:'css',minify:true,target:'chrome114',legalComments:'inline'});
 fs.writeFileSync(path.join(root,'apps/portal/frontend/home.bundle.css'),code);
 console.log(`Home stylesheet: ${Buffer.byteLength(source)} → ${Buffer.byteLength(code)} bytes; original cascade preserved.`);
}
if(require.main===module)buildHome();
module.exports={buildHome};
