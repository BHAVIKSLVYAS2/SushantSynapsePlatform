const path=require('node:path');
function buildLanguage(){require('esbuild').buildSync({entryPoints:[path.resolve(__dirname,'../packages/ui/language-runtime.js')],outfile:path.resolve(__dirname,'../packages/ui/language.js'),bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,charset:'utf8'});}
if(require.main===module)buildLanguage();module.exports={buildLanguage};
