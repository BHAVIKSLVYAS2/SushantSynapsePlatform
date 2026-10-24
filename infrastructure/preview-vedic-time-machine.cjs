const {createPreviewServer}=require('./preview-vedic-charts.cjs');
createPreviewServer(Number(process.argv[2]??4180),{timeMachine:true}).then(server=>{
 console.log('Local Astro Time Machine preview: '+server.origin);process.on('SIGINT',()=>server.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
