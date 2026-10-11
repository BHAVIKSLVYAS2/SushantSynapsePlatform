const {spawnSync}=require('node:child_process'),path=require('node:path');
const bin=path.join(path.dirname(process.env.SYNAPSE_WRANGLER_PACKAGE||require.resolve('wrangler/package.json')),'bin/wrangler.js');
function run(args){const r=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'}});if(r.error)throw r.error;if(r.status)process.exit(r.status);}
run([bin,'deploy','--dry-run','--config','infrastructure/cloudflare/wrangler.fullstack.jsonc','--outdir','.publish/fullstack-dryrun']);
run(['--test','tests/cloudflare-fullstack.cjs','tests/cloudflare-samaj.test.js','tests/cloudflare-transfer.test.js','tests/cloudflare-free.cjs']);
process.env.SYNAPSE_ALL_APPS_D1='true';
run(['--test','tests/cloudflare-fullstack.cjs','tests/cloudflare-samaj.test.js']);
