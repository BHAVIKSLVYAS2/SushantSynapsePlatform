'use strict';
const {createPreviewServer}=require('./preview-vedic-charts.cjs');
if(require.main===module)createPreviewServer(Number(process.argv[2]??4178),{birth:true}).then(server=>{
 console.log('Local birth-details preview: '+server.origin);process.on('SIGINT',()=>server.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
