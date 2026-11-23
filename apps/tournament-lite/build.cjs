const fs=require('node:fs'),path=require('node:path'),{buildSync}=require('esbuild');
function build(){
 const engine=fs.readFileSync(path.join(__dirname,'backend/engine.js'),'utf8')
  .replace("const {randomUUID,randomInt}=require('node:crypto');",`const randomUUID=()=>crypto.randomUUID();
function randomInt(max){const bound=Math.floor(4294967296/max)*max;let n;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=bound);return n%max;}`);
 buildSync({absWorkingDir:path.resolve(__dirname,'../..'),stdin:{contents:engine,resolveDir:path.join(__dirname,'backend'),sourcefile:'tournament-engine.js',loader:'js'},bundle:true,platform:'browser',format:'iife',globalName:'TournamentEngine',target:'chrome114',outfile:path.join(__dirname,'frontend/engine.bundle.js'),legalComments:'none'});
}
if(require.main===module)build();module.exports={build};
